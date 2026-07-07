import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { adminService, AuditEntry } from '../../services/admin.service';

const EVENT_TYPE_LABELS: Record<string, string> = {
  user_registered: 'Registro',
  login_success: 'Login',
  login_failed: 'Login falhou',
  onboarding_completed: 'Onboarding',
  public_profile_updated: 'Perfil atualizado',
  consent_granted: 'Consentimento',
  consent_revoked: 'Consentimento revogado',
  privacy_export_requested: 'Exportação',
  health_data_deleted: 'Dados de saúde removidos',
  account_deleted: 'Conta excluída',
  user_blocked: 'Bloqueio',
  user_unblocked: 'Desbloqueio',
  user_reported: 'Denúncia',
  moderation_action_taken: 'Moderação',
  match_created: 'Match',
  match_unmatched: 'Match desfeito',
  message_sent: 'Mensagem',
  message_read: 'Leitura',
  retention_cleanup_executed: 'Limpeza',
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  user_registered: '📝',
  login_success: '🔓',
  login_failed: '🔒',
  onboarding_completed: '🎉',
  public_profile_updated: '👤',
  consent_granted: '✅',
  consent_revoked: '❌',
  privacy_export_requested: '📦',
  health_data_deleted: '🗑️',
  account_deleted: '⚠️',
  user_blocked: '🚫',
  user_unblocked: '🔓',
  user_reported: '📢',
  moderation_action_taken: '⚖️',
  match_created: '💚',
  match_unmatched: '💔',
  message_sent: '💬',
  message_read: '👁️',
  retention_cleanup_executed: '🧹',
};

export const AdminAuditScreen: React.FC = () => {
  const [events, setEvents] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const fetchAudit = useCallback(async (pageNum: number, append = false) => {
    try {
      const data = await adminService.getAuditLog(pageNum, limit);
      setEvents(append ? (prev) => [...prev, ...data.data] : data.data);
      setTotal(data.total);
      setError(null);
    } catch {
      setError('Erro ao carregar auditoria');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchAudit(1); }, [fetchAudit]);

  const onRefresh = () => { setRefreshing(true); fetchAudit(1); };

  const onEndReached = () => {
    if (loadingMore || events.length >= total) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchAudit(nextPage, true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAudit(1)}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: AuditEntry }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventIcon}>
          {EVENT_TYPE_ICONS[item.eventType] ?? '📋'}
        </Text>
        <View style={styles.eventInfo}>
          <Text style={styles.eventType}>
            {EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}
          </Text>
          <Text style={styles.eventDescription}>
            {item.resourceType ? `${item.resourceType} ${item.resourceId?.slice(0, 8) ?? ''}` : '-'}
          </Text>
        </View>
        <Text style={styles.eventTime}>
          {new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: spacing.md }} color={colors.primary} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum evento de auditoria encontrado.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.screen, paddingTop: 20, paddingBottom: spacing.xxl },
  centerContainer: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  eventCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  eventIcon: { fontSize: 20 },
  eventInfo: { flex: 1 },
  eventType: { ...typography.body, fontWeight: '600' },
  eventDescription: { ...typography.caption, marginTop: 2 },
  eventTime: { ...typography.caption, textAlign: 'right' },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.bodyMuted },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
