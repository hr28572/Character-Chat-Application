import { Controller, Post, Body, Get, Param, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body(ValidationPipe) sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(sendMessageDto);
  }

  @Get('conversation/:id')
  async getConversationHistory(@Param('id') conversationId: string) {
    return this.chatService.getConversationHistory(conversationId);
  }

  @Get('character/:characterId/latest-conversation')
  async getLatestConversationByCharacter(@Param('characterId') characterId: string) {
    return this.chatService.getLatestConversationByCharacter(parseInt(characterId));
  }

  @Get('ai/info')
  async getAIProviderInfo() {
    return this.chatService.getAIProviderInfo();
  }

  @Post('ai/switch')
  async switchAIProvider(@Body() body: { provider: 'ollama' | 'openai'; model?: string }) {
    return this.chatService.switchAIProvider(body.provider, body.model);
  }
}