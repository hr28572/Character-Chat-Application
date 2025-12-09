import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CharacterListScreen from './src/screens/CharacterListScreen';
import ChatScreen from './src/screens/ChatScreen';
import { Character } from './src/types';

type RootStackParamList = {
  CharacterList: undefined;
  Chat: {
    character: Character;
    conversationId?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="CharacterList">
          <Stack.Screen 
            name="CharacterList" 
            component={CharacterListScreen}
            options={{
              title: 'Character Chat',
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: '600',
              },
            }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{
              title: 'Chat',
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: '600',
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
