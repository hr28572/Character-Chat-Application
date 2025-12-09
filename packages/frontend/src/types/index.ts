export interface Character {
  id: number;
  name: string;
  slug: string;
  avatarUrl?: string;
  description: string;
  promptTemplate: string;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: string;
  role: 'user' | 'character' | 'system';
  content: string;
  createdAt: string;
}

export interface ChatResponse {
  conversationId: string;
  userMessage: Message;
  characterMessage: Message;
  character: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

export interface SendMessageRequest {
  characterId: string;
  message: string;
  conversationId?: string;
}