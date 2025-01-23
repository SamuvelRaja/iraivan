import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY ?? '';

const Message = ({ text, isUser }) => (
  <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
      {text}
    </Text>
  </View>
);

export default function VoiceChatbot() {
  const [recording, setRecording] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        addMessage('Microphone permission denied', false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      setRecording(recording);
      addMessage('Recording started...', false);
    } catch (err) {
      console.error('Failed to start recording:', err);
      addMessage('Failed to start recording', false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsProcessing(true);
      
      if (uri) {
        addMessage('Processing audio...', false);
        await processAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      addMessage('Error processing recording', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const addMessage = (text, isUser) => {
    setMessages(prev => [...prev, { text, isUser, id: Date.now() }]);
  };

  const processAudio = async (uri) => {
    try {
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Transcribe this audio file:' },
              { inline_data: { mime_type: 'audio/mp3', data: base64Audio } },
            ],
          },
        ],
      });

      const transcript = result.response.text();
      addMessage(transcript, true);
      await getChatbotResponse(transcript);
    } catch (error) {
      console.error('Error processing audio:', error);
      addMessage('Failed to process audio', false);
    }
  };

  const getChatbotResponse = async (text) => {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text }] }],
      });

      const response = result.response.text();
      addMessage(response, false);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      addMessage('Failed to get response', false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatContainer}>
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <Message 
              key={message.id}
              text={message.text}
              isUser={message.isUser}
            />
          ))}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[
              styles.micButton,
              recording && styles.micButtonActive,
              isProcessing && styles.micButtonDisabled
            ]}
            onPress={recording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <MaterialIcons
              name={recording ? "mic-off" : "mic"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#343541',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: '#4B5563',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  botBubble: {
    backgroundColor: '#6B7280',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: 'white',
  },
  inputContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#10B981',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#DC2626',
  },
  micButtonDisabled: {
    backgroundColor: '#6B7280',
  },
});