import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../openai/openai.service';
import { CharacterService } from '../characters/characters.service';
import { SendMessageDto } from './dto/send-message.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
    private characterService: CharacterService
  ) {}

  async sendMessage(sendMessageDto: SendMessageDto) {
    const { characterId, message, conversationId } = sendMessageDto;

    // Find character by ID
    const character = await this.characterService.findOne(parseInt(characterId));
    if (!character) {
      throw new NotFoundException('Character not found');
    }

    // Generate or use existing conversation ID
    const currentConversationId = conversationId || uuidv4();

    // Save user message
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId: currentConversationId,
        role: 'user',
        content: message,
      },
    });

    try {
      // Get conversation history
      const conversationHistory = await this.prisma.message.findMany({
        where: { conversationId: currentConversationId },
        orderBy: { createdAt: 'asc' },
        take: 20, // Limit to last 20 messages
      });

      // Prepare conversation history for OpenAI (exclude the current user message)
      const historyForAI = conversationHistory
        .filter(msg => msg.id !== userMessage.id)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
        }));

      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(
        character.promptTemplate,
        historyForAI,
        message
      );

      // Save character response
      const characterMessage = await this.prisma.message.create({
        data: {
          conversationId: currentConversationId,
          role: 'character',
          content: aiResponse,
        },
      });

      return {
        conversationId: currentConversationId,
        userMessage: {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt,
        },
        characterMessage: {
          id: characterMessage.id,
          role: characterMessage.role,
          content: characterMessage.content,
          createdAt: characterMessage.createdAt,
        },
        character: {
          id: character.id,
          name: character.name,
          avatarUrl: character.avatarUrl,
        },
      };
    } catch (error) {
      console.error('Chat service error:', error);
      throw new BadRequestException('Failed to generate response');
    }
  }

  async getConversationHistory(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return { conversationId, messages };
  }

  async getLatestConversationByCharacter(characterId: number) {
    // Find conversations that have messages (indicating active conversations)
    // We'll get all conversations ordered by latest message
    const conversations = await this.prisma.message.groupBy({
      by: ['conversationId'],
      _max: {
        createdAt: true
      },
      _count: {
        conversationId: true
      },
      orderBy: {
        _max: {
          createdAt: 'desc'
        }
      },
      take: 10 // Get the 10 most recent conversations
    });

    // For each conversation, check if it has both user and assistant messages
    // (indicating a conversation with a character)
    for (const conv of conversations) {
      const messages = await this.prisma.message.findMany({
        where: { conversationId: conv.conversationId },
        select: { role: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      });

      const hasUserMessage = messages.some(m => m.role === 'user');
      const hasAssistantMessage = messages.some(m => m.role === 'assistant');

      if (hasUserMessage && hasAssistantMessage && messages.length > 1) {
        return {
          conversationId: conv.conversationId,
          messageCount: conv._count.conversationId,
          lastMessageAt: conv._max.createdAt
        };
      }
    }

    return null;
  }

  async getAIProviderInfo() {
    return this.aiService.getProviderInfo();
  }

  async switchAIProvider(provider: 'ollama' | 'openai', model?: string) {
    this.aiService.switchProvider(provider, model);
    return {
      success: true,
      message: `Switched to ${provider}${model ? ` with model ${model}` : ''}`,
      ...this.aiService.getProviderInfo()
    };
  }
}