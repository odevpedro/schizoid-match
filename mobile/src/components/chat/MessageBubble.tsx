import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ChatMessage } from '../../types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={[styles.wrapper, isOwn ? styles.ownWrapper : styles.otherWrapper]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {message.imageUrl && (
          <Image
            source={{ uri: message.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        {message.message ? (
          <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
            {message.message}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>{time}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginVertical: 2, maxWidth: '80%' },
  ownWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  otherWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 18, paddingHorizontal: spacing.md, paddingVertical: 10 },
  ownBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: colors.surfaceElevated, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  text: { fontSize: 15, lineHeight: 20 },
  ownText: { color: colors.background },
  otherText: { color: colors.text },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  time: { fontSize: 10, marginTop: 2, color: colors.textMuted },
  ownTime: { marginRight: 4 },
  otherTime: { marginLeft: 4 },
});
