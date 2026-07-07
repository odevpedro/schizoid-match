import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { adminService, DashboardStats } from '../../services/admin.service';
import { useAuthStore } from '../../store/auth.slice';

const CARD_CONFIG = [
  { key: 'totalReports' as const, label: 'Total de denúncias', color: colors.error },
  { key: 'pendingReports' as const, label: 'Pendentes', color: colors.warning },
  { key: 'totalBans' as const, label: 'Banimentos', color: '#EF4444' },
  { key: 'activeUsers' as const, label: 'Usuários ativos', color: colors.success },
];

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAllowed = user?.role === 'admin' || user?.role === 'moderator';

  const fetchStats = useCallback(async () => {
    if (!isAllowed) { setLoading(false); return; }
    try {
      const data = await adminService.getDashboard();
      setStats(data);
      setError(null);
    } catch {
      setError('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAllowed]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  if (!isAllowed) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Acesso restrito a moderadores e administradores.</Text>
      </View>
    );
  }

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
        <TouchableOpacity style={styles.retryBtn} onPress={fetchStats}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Painel de Moderação</Text>
      <Text style={styles.subtitle}>Bem-vindo, {user?.name}</Text>

      <View style={styles.grid}>
        {stats && CARD_CONFIG.map(({ key, label, color }) => (
          <View key={key} style={styles.card}>
            <Text style={[styles.cardValue, { color }]}>{stats[key]}</Text>
            <Text style={styles.cardLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminReports')}>
        <Text style={styles.menuText}>Denúncias</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {user?.role === 'admin' && (
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminAudit')}>
          <Text style={styles.menuText}>Auditoria</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 60, paddingBottom: spacing.xxl },
  centerContainer: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMuted, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    width: '47%',
    alignItems: 'center',
  },
  cardValue: { fontSize: 32, fontWeight: '800', marginBottom: spacing.xs },
  cardLabel: { ...typography.caption, textAlign: 'center' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuText: { ...typography.body },
  menuArrow: { fontSize: 20, color: colors.textMuted },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
