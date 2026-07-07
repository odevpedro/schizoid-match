import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { adminService, AdminReport } from '../../services/admin.service';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  reviewed: 'Revisado',
  dismissed: 'Rejeitado',
  action_taken: 'Ação tomada',
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  reviewed: colors.secondary,
  dismissed: colors.textMuted,
  action_taken: colors.success,
};

const REASON_LABELS: Record<string, string> = {
  inappropriate_content: 'Conteúdo inapropriado',
  harassment: 'Assédio',
  fake_profile: 'Perfil falso',
  underage: 'Menor de idade',
  spam: 'Spam',
  offline_behavior: 'Comportamento fora do app',
  other: 'Outro',
};

export const AdminReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const data = await adminService.getReports();
      setReports(data);
      setError(null);
    } catch {
      setError('Erro ao carregar denúncias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onRefresh = () => { setRefreshing(true); fetchReports(); };

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
        <TouchableOpacity style={styles.retryBtn} onPress={fetchReports}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: AdminReport }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('AdminReportDetail', { reportId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reporterName} numberOfLines={1}>
          {item.reporter?.name ?? item.reporterId.slice(0, 8)}
        </Text>
        <Text style={[styles.statusBadge, { color: STATUS_COLORS[item.status] ?? colors.textMuted }]}>
          {STATUS_LABELS[item.status] ?? item.status}
        </Text>
      </View>

      <Text style={styles.reportDetail}>
        Denunciou: {item.reported?.name ?? item.reportedId.slice(0, 8)}
      </Text>
      <Text style={styles.reportReason}>
        {REASON_LABELS[item.reason] ?? item.reason}
      </Text>
      <Text style={styles.reportDate}>
        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma denúncia encontrada.</Text>
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
  reportCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reporterName: { ...typography.body, fontWeight: '600', flex: 1 },
  statusBadge: { ...typography.caption, fontWeight: '600' },
  reportDetail: { ...typography.bodyMuted, marginBottom: 2 },
  reportReason: { ...typography.body, marginBottom: 2 },
  reportDate: { ...typography.caption, marginTop: spacing.xs },
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
