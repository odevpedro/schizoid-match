import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { notificationService } from '../../services/notification.service';

const TYPE_ICONS: Record<string, string> = {
  match: '♥',
  message: '💬',
  challenge_completed: '🏆',
  challenge_progress: '📈',
  system: '⚙',
};

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.item, item.read && styles.itemRead]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <Text style={styles.icon}>{TYPE_ICONS[item.type] || '●'}</Text>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleString('pt-BR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Notificações</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markAll}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma notificação</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screen,
    paddingTop: 60,
  },
  screenTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  markAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xl },
  item: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRead: { opacity: 0.6 },
  icon: { fontSize: 24, marginRight: spacing.md, marginTop: 2 },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  body: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  time: { fontSize: 11, color: colors.textSubtle },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 15, color: colors.textMuted },
});
