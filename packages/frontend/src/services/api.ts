import axios from 'axios';
import { Platform } from 'react-native';
import { Character, ChatResponse, SendMessageRequest } from '../types';

// Use your machine's IP address for device testing, localhost for web
const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://192.168.1.155:3000';  

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const characterApi = {
  getAll: (): Promise<Character[]> => 
    api.get('/characters').then(response => response.data),
  
  getById: (id: number): Promise<Character> => 
    api.get(`/characters/${id}`).then(response => response.data),
};

export const chatApi = {
  sendMessage: (data: SendMessageRequest): Promise<ChatResponse> => 
    api.post('/chat', data).then(response => response.data),
  
  getConversationHistory: (conversationId: string) => 
    api.get(`/chat/conversation/${conversationId}`).then(response => response.data),
  
  getLatestConversationByCharacter: (characterId: number) =>
    api.get(`/chat/character/${characterId}/latest-conversation`).then(response => response.data),
};