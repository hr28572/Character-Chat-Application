import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Character, Message, ChatResponse } from '../types';
import { chatApi } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { conversationTracker } from '../utils/conversationTracker';

interface ChatScreenProps {
  route: {
    params: {
      character: Character;
      conversationId?: string;
    };
  };
  navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { character, conversationId: initialConversationId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(!!initialConversationId);
  const [conversationId, setConversationId] = useState(initialConversationId || uuidv4());
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({
      title: character.name,
      headerBackTitle: 'Characters',
    });

    // Load conversation history if conversationId exists
    if (initialConversationId) {
      loadConversationHistory();
    }

    // Save conversation when component unmounts or when conversationId changes
    return () => {
      if (conversationId && messages.length > 0) {
        conversationTracker.setConversation(character.id, conversationId);
      }
    };
  }, [character.name, character.id, initialConversationId, conversationId, messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !loadingHistory) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages.length, loadingHistory]);

  // Initial scroll to bottom when messages are first loaded
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [messages.length === 0 ? 0 : 1]); // Only run when messages go from 0 to having messages

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  const loadConversationHistory = async () => {
    if (!initialConversationId) {
      setLoadingHistory(false);
      return;
    }
    
    try {
      setLoadingHistory(true);
      console.log('Loading conversation history for:', initialConversationId);
      const response = await chatApi.getConversationHistory(initialConversationId);
      console.log('Loaded conversation history:', response);
      
      if (response && response.messages) {
        // Ensure unique messages by ID
        const uniqueMessages = response.messages.filter((message: Message, index: number, self: Message[]) =>
          index === self.findIndex((m: Message) => m.id === message.id)
        );
        setMessages(uniqueMessages);
        // Update conversationId to match the loaded conversation
        setConversationId(response.conversationId || initialConversationId);
        
        // Scroll to bottom after loading history
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // If loading history fails, we can still start a new conversation
      Alert.alert('Notice', 'Could not load conversation history. Starting a new conversation.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessageText = inputText.trim();
    setInputText('');
    setLoading(true);

    // Add user message to UI immediately (use negative ID to avoid conflicts with database IDs)
    const tempUserMessage: Message = {
      id: -Date.now(),
      conversationId,
      role: 'user',
      content: userMessageText,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);
    
    // Scroll to bottom after adding user message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const response: ChatResponse = await chatApi.sendMessage({
        characterId: character.id.toString(),
        message: userMessageText,
        conversationId,
      });

      // Update conversation ID if it was generated
      if (response.conversationId !== conversationId) {
        setConversationId(response.conversationId);
      }

      // Replace temp message with real messages from server
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
        const newMessages = [response.userMessage, response.characterMessage];
        
        // Ensure no duplicates by checking existing IDs
        const existingIds = new Set(filtered.map(msg => msg.id));
        const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
        
        return [...filtered, ...uniqueNewMessages];
      });
      
      // Scroll to bottom after adding new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send message. Please try again.';
      Alert.alert('Error', `${errorMessage}\n\nStatus: ${error.response?.status || 'Unknown'}`);
      
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.characterMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.characterBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.characterMessageText
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        enabled={true}
      >
        {loadingHistory ? (
          <View style={styles.loadingHistoryContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingHistoryText}>Loading conversation history...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `${item.id}_${index}_${item.role}`}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              if (!loading && !loadingHistory) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            onLayout={() => {
              if (!loading && !loadingHistory && messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}
        
        <View style={styles.inputContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
          
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Message ${character.name}...`}
              multiline={true}
              maxLength={1000}
              editable={!!(!loading)}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 200);
              }}
              blurOnSubmit={false}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || loading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!!(!inputText.trim() || loading)}
            >
              <Text style={[
                styles.sendButtonText,
                (!inputText.trim() || loading) && styles.sendButtonTextDisabled
              ]}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  characterMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  characterBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  characterMessageText: {
    color: '#212529',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#fff',
  },
  loadingHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingHistoryText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
});

export default ChatScreen;