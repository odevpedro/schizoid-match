import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { healthService } from '../../services/health.service';
import { HealthDashboardData } from '../../types/health.types';

export const HealthDashboardScreen: React.FC = () => {
  const [data, setData] = useState<HealthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      setData(await healthService.getDashboardData());
    } catch (err: any) {
      console.error('Health dashboard load failed', err);
      setError(err?.response?.data?.message ?? 'Não foi possível carregar seus dados de saúde.');
      setData({
        today: { steps: 0, sleepMinutes: 0, calories: 0, avgHeartRate: 0, hrv: 0, stressLevel: 0 },
        weekly: { avgSteps: 0, avgSleep: 0, activeDays: 0 },
        source: 'none',
        lastSync: null,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const MetricCard = ({ label, value, unit, color }: { label: string; value: string | number; unit: string; color?: string }) => (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Meus Dados</Text>
      <Text style={styles.subtitle}>
        Fonte: {data?.source === 'simulated' ? 'Modo Simulação' : data?.source === 'none' ? 'Nenhuma' : data?.source ?? 'Nenhuma'}
        {data?.lastSync ? ` · ${new Date(data.lastSync).toLocaleTimeString()}` : ''}
      </Text>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>HOJE</Text>
      <View style={styles.metricsGrid}>
        <MetricCard label="Passos" value={data?.today.steps ?? 0} unit="passos" color={colors.primary} />
        <MetricCard label="Sono" value={data?.today.sleepMinutes ?? 0} unit="min" color="#7c4dff" />
        <MetricCard label="Calorias" value={data?.today.calories ?? 0} unit="kcal" color="#ffa726" />
        <MetricCard label="Freq. Cardíaca" value={data?.today.avgHeartRate ?? 0} unit="bpm" color="#ef5350" />
        <MetricCard label="HRV" value={data?.today.hrv ?? 0} unit="ms" color="#66bb6a" />
        <MetricCard label="Estresse" value={`${data?.today.stressLevel ?? 0}%`} unit="" color="#ff7043" />
      </View>

      <Text style={styles.sectionTitle}>RESUMO SEMANAL</Text>
      <View style={styles.weeklyCard}>
        <View style={styles.weeklyRow}>
          <Text style={styles.weeklyLabel}>Média de passos/dia</Text>
          <Text style={styles.weeklyValue}>{data?.weekly.avgSteps ?? 0}</Text>
        </View>
        <View style={styles.weeklyRow}>
          <Text style={styles.weeklyLabel}>Média de sono/dia</Text>
          <Text style={styles.weeklyValue}>{data?.weekly.avgSleep ?? 0} min</Text>
        </View>
        <View style={styles.weeklyRow}>
          <Text style={styles.weeklyLabel}>Dias ativos</Text>
          <Text style={styles.weeklyValue}>{data?.weekly.activeDays ?? 0}/7</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          {data?.lastSync
            ? 'Dados agregados a partir das métricas sincronizadas. Nenhum dado bruto é compartilhado com outras pessoas.'
            : 'Nenhum dado sincronizado ainda. Conecte uma fonte de saúde para preencher este painel.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 2 },
  subtitle: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    width: '48%',
    flexGrow: 1,
  },
  metricValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  metricUnit: { fontSize: 11, color: colors.textMuted, marginTop: -2 },
  metricLabel: { fontSize: 12, color: colors.textSubtle, marginTop: 4 },
  weeklyCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weeklyLabel: { fontSize: 14, color: colors.textSubtle },
  weeklyValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  infoCard: {
    backgroundColor: 'rgba(0,229,160,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.15)',
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoText: { fontSize: 12, color: colors.textMuted, lineHeight: 18, textAlign: 'center' },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: 12, color: colors.error, lineHeight: 18 },
});
