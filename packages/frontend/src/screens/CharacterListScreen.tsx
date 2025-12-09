import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Character } from '../types';
import { characterApi } from '../services/api';
import { conversationTracker } from '../utils/conversationTracker';


interface CharacterListScreenProps {
  navigation: any;
}

const CharacterListScreen: React.FC<CharacterListScreenProps> = ({ navigation }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const data = await characterApi.getAll();
      setCharacters(data);
    } catch (error) {
      console.error('Error loading characters:', error);
      Alert.alert('Error', 'Failed to load characters. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const selectCharacter = async (character: Character) => {
    const existingConversationId = await conversationTracker.getConversation(character.id);
    navigation.navigate('Chat', { 
      character, 
      conversationId: existingConversationId 
    });
  };

  const renderCharacter = ({ item }: { item: Character }) => {
    const hasActiveConversation = conversationTracker.hasConversation(item.id);
    
    return (
      <TouchableOpacity
        style={styles.characterCard}
        onPress={() => selectCharacter(item)}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{item.avatarUrl || '👤'}</Text>
          {hasActiveConversation && (
            <View style={styles.conversationIndicator}>
              <Text style={styles.conversationDot}>💬</Text>
            </View>
          )}
        </View>
        <View style={styles.characterInfo}>
          <Text style={styles.characterName}>{item.name}</Text>
          <Text style={styles.characterDescription}>
            {hasActiveConversation ? 'Continue conversation...' : item.description}
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading characters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose a Character</Text>
        <Text style={styles.headerSubtitle}>Select who you'd like to chat with</Text>
      </View>
      
      <FlatList
        data={characters}
        renderItem={renderCharacter}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  listContainer: {
    padding: 20,
  },
  characterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    fontSize: 30,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  characterDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 20,
    color: '#007AFF',
    marginLeft: 12,
  },
  conversationIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationDot: {
    fontSize: 12,
  },
});

export default CharacterListScreen;