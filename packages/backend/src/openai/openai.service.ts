import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private ollama: Ollama;
  private openai: OpenAI;
  private provider: 'ollama' | 'openai';
  private model: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<'ollama' | 'openai'>('AI_PROVIDER') || 'ollama';
    
    // Initialize Ollama
    this.ollama = new Ollama({
      host: this.configService.get<string>('OLLAMA_URL') || 'http://localhost:11434',
    });
    
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
    });
    
    // Set model based on provider
    if (this.provider === 'ollama') {
      this.model = this.configService.get<string>('OLLAMA_MODEL') || 'llama3.1:8b';
    } else {
      this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
    }
  }

  async generateResponse(
    characterPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string
  ): Promise<string> {
    if (this.provider === 'ollama') {
      return this.generateOllamaResponse(characterPrompt, conversationHistory, userMessage);
    } else {
      return this.generateOpenAIResponse(characterPrompt, conversationHistory, userMessage);
    }
  }

  private async generateOllamaResponse(
    characterPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string
  ): Promise<string> {
    try {
      // CONTEXT MANAGEMENT: Optimize for token limits and conversation coherence
      
      // 1. Summarize older context if history is long
      const maxHistoryLength = 8; // pairs of exchanges
      let processedHistory = conversationHistory;
      
      if (conversationHistory.length > maxHistoryLength) {
        // Keep first 2 and last 6 exchanges for context continuity
        const earlyContext = conversationHistory.slice(0, 2);
        const recentContext = conversationHistory.slice(-6);
        const summarizedMiddle = this.summarizeMiddleContext(conversationHistory.slice(2, -6));
        
        processedHistory = [
          ...earlyContext,
          { role: 'assistant', content: `[Previous conversation summary: ${summarizedMiddle}]` },
          ...recentContext
        ] as Array<{ role: 'user' | 'assistant'; content: string }>;
      }
      
      // 2. Build optimized conversation context
      let contextMessages = '';
      
      // Add enhanced system prompt with character reinforcement
      contextMessages += `System: ${characterPrompt}\n\n`;
      contextMessages += `CONVERSATION CONTEXT: You are engaged in an ongoing conversation. Maintain character consistency, reference previous topics when relevant, and build upon established rapport.\n\n`;
      
      // 3. Add processed conversation history
      for (const msg of processedHistory) {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        contextMessages += `${role}: ${msg.content}\n`;
      }
      
      // 4. Add current user message with context cue
      contextMessages += `Human: ${userMessage}\nAssistant: [Stay in character and respond naturally based on the conversation context]`;

      // 5. Generate response with optimized parameters
      const response = await this.ollama.generate({
        model: this.model,
        prompt: contextMessages,
        stream: false,
        options: {
          temperature: 0.8, // Balanced creativity and consistency
          top_p: 0.9,
          num_ctx: 3072, // Increased context window
          repeat_penalty: 1.1, // Prevent repetition
          num_predict: 300, // Reasonable response length
        }
      });

      // 6. Validate response quality
      const generatedResponse = response.response || 'I apologize, but I cannot respond right now.';
      return this.validateAndCleanResponse(generatedResponse);
      
    } catch (error) {
      console.error('Ollama API Error:', error);
      throw new Error('Failed to generate response from Ollama AI');
    }
  }

  private async generateOpenAIResponse(
    characterPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string
  ): Promise<string> {
    try {
      // CONTEXT MANAGEMENT: Token-optimized conversation handling
      
      // 1. Intelligent history management for token efficiency
      const maxHistoryTokens = 1500; // Conservative estimate for context
      const estimatedPromptTokens = this.estimateTokenCount(characterPrompt);
      const availableHistoryTokens = maxHistoryTokens - estimatedPromptTokens;
      
      // 2. Build optimized message array
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system', 
          content: `${characterPrompt}\n\nCONTEXT INSTRUCTIONS: You are in an ongoing conversation. Maintain character consistency, reference previous exchanges when relevant, and build naturally upon established rapport. Stay true to your character traits and speaking style at all times.`
        }
      ];
      
      // 3. Smart history inclusion with token management
      let processedHistory = this.optimizeHistoryForTokens(conversationHistory, availableHistoryTokens);
      
      for (const msg of processedHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      }
      
      // 4. Add current user message
      messages.push({ role: 'user', content: userMessage });

      // 5. Generate with optimized parameters
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.8, // Balanced creativity and consistency
        max_tokens: 400, // Reasonable response length
        top_p: 0.9,
        frequency_penalty: 0.3, // Reduce repetition
        presence_penalty: 0.1, // Encourage topic diversity
      });

      // 6. Validate and clean response
      const generatedResponse = response.choices[0]?.message?.content || 'I apologize, but I cannot respond right now.';
      return this.validateAndCleanResponse(generatedResponse);
      
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  // Method to get current provider info
  getProviderInfo() {
    return {
      provider: this.provider,
      model: this.model,
      isOllama: this.provider === 'ollama',
      isOpenAI: this.provider === 'openai'
    };
  }

  // Method to switch providers at runtime
  switchProvider(provider: 'ollama' | 'openai', model?: string) {
    this.provider = provider;
    
    if (model) {
      this.model = model;
    } else {
      // Use default model for the provider
      if (provider === 'ollama') {
        this.model = this.configService.get<string>('OLLAMA_MODEL') || 'llama3.1:8b';
      } else {
        this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
      }
    }
    
    console.log(`Switched to ${provider} with model: ${this.model}`);
  }

  // CONTEXT MANAGEMENT HELPER METHODS
  
  private summarizeMiddleContext(messages: Array<{ role: 'user' | 'assistant'; content: string }>): string {
    if (messages.length === 0) return '';
    
    // Simple summarization - in production, you might use a separate AI call
    const topics = [];
    let currentTopic = '';
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        // Extract key topics from user messages
        const words = msg.content.toLowerCase().split(' ');
        const keywords = words.filter(word => 
          word.length > 4 && 
          !['that', 'this', 'with', 'have', 'they', 'were', 'been', 'from', 'would', 'could', 'should'].includes(word)
        );
        if (keywords.length > 0) {
          currentTopic = keywords[0];
        }
      }
    }
    
    return `The conversation covered topics including ${topics.join(', ') || currentTopic || 'general discussion'}.`;
  }
  
  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }
  
  private optimizeHistoryForTokens(
    history: Array<{ role: 'user' | 'assistant'; content: string }>, 
    maxTokens: number
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    let currentTokens = 0;
    const optimizedHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // Start from the most recent messages and work backwards
    for (let i = history.length - 1; i >= 0; i--) {
      const messageTokens = this.estimateTokenCount(history[i].content);
      
      if (currentTokens + messageTokens <= maxTokens) {
        optimizedHistory.unshift(history[i]);
        currentTokens += messageTokens;
      } else {
        // If we can't fit the whole message, try to fit a summary
        if (i > 0 && currentTokens < maxTokens * 0.8) {
          const summary = this.summarizeMiddleContext(history.slice(0, i + 1));
          const summaryTokens = this.estimateTokenCount(summary);
          
          if (currentTokens + summaryTokens <= maxTokens) {
            optimizedHistory.unshift({ role: 'assistant' as 'assistant', content: `[Earlier conversation: ${summary}]` });
          }
        }
        break;
      }
    }
    
    return optimizedHistory;
  }
  
  private validateAndCleanResponse(response: string): string {
    // Remove any potential AI artifacts or meta-commentary
    let cleaned = response.trim();
    
    // Remove common AI artifacts
    cleaned = cleaned.replace(/\[.*?\]/g, ''); // Remove bracketed meta-text
    cleaned = cleaned.replace(/^(Assistant:|AI:|Bot:)\s*/i, ''); // Remove role prefixes
    cleaned = cleaned.replace(/\*\*.*?\*\*/g, (match) => match.replace(/\*\*/g, '')); // Clean markdown bold
    
    // Ensure response isn't too short or generic
    if (cleaned.length < 10) {
      return "I appreciate you reaching out, but I'm having trouble formulating a proper response right now. Could you try rephrasing your message?";
    }
    
    // Limit response length for better user experience
    if (cleaned.length > 1000) {
      const sentences = cleaned.split(/[.!?]+/);
      let truncated = '';
      
      for (const sentence of sentences) {
        if ((truncated + sentence).length < 800) {
          truncated += sentence + (sentence.match(/[.!?]$/) ? '' : '.');
        } else {
          break;
        }
      }
      
      cleaned = truncated || cleaned.substring(0, 800) + '...';
    }
    
    return cleaned;
  }
}