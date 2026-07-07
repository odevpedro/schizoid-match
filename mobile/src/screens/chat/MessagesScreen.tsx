import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { chatService } from '../../services/chat.service';
import { useChatStore } from '../../store/chat.slice';
import { NotificationBell } from '../../components/common/NotificationBell';
import { Conversation } from '../../types/chat.types';

export const MessagesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { conversations, setConversations } = useChatStore();

  useEffect(() => {
    chatService.getConversations().then(setConversations).catch(() => {});
  }, []);

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Chat', { matchId: item.match.id, partnerName: item.partner.name })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.partner.name?.charAt(0) ?? '?'}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.partner.name}</Text>
          {item.lastMessage && (
            <Text style={styles.time}>
              {new Date(item.lastMessage.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.lastMessage?.message ?? 'Inicie uma conversa!'}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unread}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Mensagens</Text>
        <NotificationBell navigation={navigation} />
      </View>
      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>Nenhum match ainda. Continue explorando!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.match.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screen,
    paddingTop: 60,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  list: { paddingHorizontal: spacing.screen },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginRight: spacing.md,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  info: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  time: { fontSize: 11, color: colors.textMuted },
  preview: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  unread: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  unreadText: { fontSize: 10, fontWeight: '700', color: colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
});
