import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { chatService } from '../../services/chat.service';
import { socketService } from '../../services/socket.service';
import { useChatStore } from '../../store/chat.slice';
import { useAuthStore } from '../../store/auth.slice';
import { ChatMessage } from '../../types/chat.types';

export const ChatScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { matchId, partnerName } = route.params;
  const { messages, setMessages, addMessage } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const listRef = useRef<FlatList>(null);

  const matchMessages = messages[matchId] ?? [];

  useEffect(() => {
    navigation.setOptions({ title: partnerName });
    chatService.getMessages(matchId).then((msgs) => setMessages(matchId, msgs));
    chatService.getSuggestions(matchId).then(setSuggestions);
    socketService.joinMatch(matchId);
    socketService.onMessage((msg: ChatMessage) => {
      if (msg.matchId === matchId) addMessage(matchId, msg);
    });
    return () => socketService.offMessage();
  }, [matchId]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      const msg = await chatService.sendMessage(matchId, trimmed);
      addMessage(matchId, msg);
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestions}
        >
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => setText(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        ref={listRef}
        data={matchMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === user?.id} />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mensagem..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Text style={styles.sendIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  suggestions: {
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    maxWidth: 240,
  },
  suggestionText: { fontSize: 12, color: colors.primary },
  messageList: { padding: spacing.screen, paddingBottom: spacing.md },
  inputRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 18, color: colors.background, fontWeight: '700' },
});
