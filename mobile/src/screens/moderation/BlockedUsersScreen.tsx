import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from '../../components/common/Button';
import { moderationService, Block } from '../../services/moderation.service';

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export const BlockedUsersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await moderationService.getBlocks();
      setBlocks(data);
    } catch {
      setError('Erro ao carregar usuários bloqueados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handleUnblock = async (blockedId: string) => {
    setUnblockingId(blockedId);
    try {
      await moderationService.unblockUser(blockedId);
      setBlocks((prev) => prev.filter((b) => b.blockedId !== blockedId));
    } catch {
      Alert.alert('Erro', 'Não foi possível desbloquear o usuário.');
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button label="Tentar novamente" onPress={fetchBlocks} variant="outline" />
      </View>
    );
  }

  if (blocks.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Nenhum usuário bloqueado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuários bloqueados</Text>
      <FlatList
        data={blocks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.userId}>Usuário {item.blockedId.slice(0, 8)}...</Text>
              {item.reason && <Text style={styles.reason}>Motivo: {item.reason}</Text>}
              <Text style={styles.date}>Bloqueado em {formatDate(item.createdAt)}</Text>
            </View>
            <Button
              label="Desbloquear"
              onPress={() => handleUnblock(item.blockedId)}
              loading={unblockingId === item.blockedId}
              disabled={unblockingId === item.blockedId}
              variant="outline"
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  center: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md,
  },
  title: {
    ...typography.h2,
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.lg,
  },
  list: { paddingHorizontal: spacing.screen, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardInfo: { flex: 1 },
  userId: { ...typography.body, fontWeight: '600' },
  reason: { ...typography.caption, marginTop: 2 },
  date: { ...typography.caption, marginTop: 2 },
  emptyText: { ...typography.bodyMuted },
  errorText: { ...typography.bodyMuted, textAlign: 'center' },
});
