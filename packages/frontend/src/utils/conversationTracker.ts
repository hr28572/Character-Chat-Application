import { chatApi } from '../services/api';

// Conversation tracker that checks backend for existing conversations
class ConversationTracker {
  private conversations: { [characterId: number]: string } = {};
  private loadedCharacters: Set<number> = new Set();

  async getConversation(characterId: number): Promise<string | undefined> {
    // If we already checked this character, return cached result
    if (this.loadedCharacters.has(characterId)) {
      return this.conversations[characterId];
    }

    // Check backend for existing conversations with this character
    try {
      console.log('Checking for existing conversation for character:', characterId);
      const latestConversation = await chatApi.getLatestConversationByCharacter(characterId);
      
      if (latestConversation && latestConversation.conversationId) {
        console.log('Found existing conversation:', latestConversation.conversationId);
        this.conversations[characterId] = latestConversation.conversationId;
      } else {
        console.log('No existing conversation found for character:', characterId);
      }
      
      this.loadedCharacters.add(characterId);
      return this.conversations[characterId];
    } catch (error) {
      console.log('Error checking for existing conversation:', error);
      this.loadedCharacters.add(characterId);
      return undefined;
    }
  }

  setConversation(characterId: number, conversationId: string) {
    this.conversations[characterId] = conversationId;
    this.loadedCharacters.add(characterId);
  }

  hasConversation(characterId: number): boolean {
    return !!this.conversations[characterId];
  }

  removeConversation(characterId: number) {
    delete this.conversations[characterId];
    this.loadedCharacters.delete(characterId);
  }

  // Reset cache when app starts fresh
  clearCache() {
    this.loadedCharacters.clear();
  }
}

export const conversationTracker = new ConversationTracker();