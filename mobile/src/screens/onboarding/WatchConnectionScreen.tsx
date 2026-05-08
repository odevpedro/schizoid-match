import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { healthService } from '../../services/health.service';
import { HealthMetricType, HealthProvider } from '../../types/health.types';

const PROVIDERS = [
  { id: 'simulated' as HealthProvider, name: 'Modo Demonstracao', desc: 'Dados simulados para explorar o app', icon: '🎮', available: true },
  { id: 'healthkit' as HealthProvider, name: 'Apple Health', desc: 'iOS — HealthKit', icon: '♥', available: false },
  { id: 'health_connect' as HealthProvider, name: 'Health Connect', desc: 'Android — Health Connect API', icon: '♥', available: false },
  { id: 'garmin' as HealthProvider, name: 'Garmin', desc: 'Em breve', icon: '⌚', available: false },
  { id: 'fitbit' as HealthProvider, name: 'Fitbit', desc: 'Em breve', icon: '⌚', available: false },
];

const SAFE_METRICS: { id: HealthMetricType; label: string; sensitive: boolean }[] = [
  { id: 'steps', label: 'Contagem de Passos', sensitive: false },
  { id: 'sleep', label: 'Dados de Sono', sensitive: false },
  { id: 'calories', label: 'Calorias', sensitive: false },
  { id: 'heart_rate', label: 'Frequencia Cardiaca (agregada)', sensitive: true },
  { id: 'hrv', label: 'Variabilidade Cardiaca', sensitive: true },
  { id: 'stress', label: 'Nivel de Estresse', sensitive: true },
];

export const WatchConnectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selected, setSelected] = useState<HealthProvider | null>(null);
  const [grantedMetrics, setGrantedMetrics] = useState<Record<string, boolean>>({
    steps: true, sleep: true, calories: true,
  });
  const [loading, setLoading] = useState(false);

  const toggleMetric = (id: HealthMetricType) => {
    setGrantedMetrics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const connect = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const metrics = (Object.entries(grantedMetrics)
        .filter(([_, v]) => v)
        .map(([k]) => k)) as HealthMetricType[];

      if (metrics.length === 0) {
        Alert.alert('Selecione pelo menos uma metrica');
        setLoading(false);
        return;
      }

      await healthService.grantConsent(metrics, selected);
      await healthService.ingestMetrics(selected);
      Alert.alert('Conectado!', 'Seus dados foram importados com sucesso.', [
        { text: 'Continuar', onPress: () => navigation.navigate('Main') },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Conectar Smartwatch</Text>
      <Text style={styles.subtitle}>
        Escolha como importar seus dados de saude. Voce pode revogar permissoes a qualquer momento.
      </Text>

      <Text style={styles.sectionLabel}>Fonte de dados</Text>
      {PROVIDERS.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={[styles.providerCard, selected === p.id && styles.providerSelected, !p.available && styles.providerDisabled]}
          onPress={() => p.available && setSelected(p.id)}
          disabled={!p.available}
        >
          <Text style={styles.providerIcon}>{p.icon}</Text>
          <View style={styles.providerInfo}>
            <Text style={[styles.providerName, !p.available && styles.disabledText]}>{p.name}</Text>
            <Text style={styles.providerDesc}>{p.desc}</Text>
          </View>
          {selected === p.id && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}

      {selected && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Quais dados compartilhar?</Text>
          <View style={styles.metricsCard}>
            {SAFE_METRICS.map((m) => (
              <View key={m.id} style={styles.metricRow}>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  {m.sensitive && <Text style={styles.sensitiveTag}>Dado sensivel</Text>}
                </View>
                <Switch
                  value={grantedMetrics[m.id] ?? false}
                  onValueChange={() => toggleMetric(m.id)}
                  trackColor={{ false: colors.border, true: colors.primaryDim }}
                  thumbColor={grantedMetrics[m.id] ? colors.primary : colors.textMuted}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.connectBtn, loading && styles.connectBtnDisabled]}
            onPress={connect}
            disabled={loading}
          >
            <Text style={styles.connectBtnText}>{loading ? 'Conectando...' : 'Conectar e importar'}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.skipText}>Pular por agora</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase' },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  providerSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  providerDisabled: { opacity: 0.4 },
  providerIcon: { fontSize: 24 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '600', color: colors.text },
  providerDesc: { fontSize: 12, color: colors.textMuted },
  disabledText: { color: colors.textMuted },
  check: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  metricsCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'space-between',
  },
  metricInfo: { flex: 1, marginRight: spacing.md },
  metricLabel: { fontSize: 14, color: colors.text },
  sensitiveTag: { fontSize: 11, color: colors.warning, marginTop: 2 },
  connectBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  connectBtnDisabled: { opacity: 0.6 },
  connectBtnText: { fontSize: 16, fontWeight: '700', color: colors.background },
  skipBtn: { alignItems: 'center', padding: spacing.md },
  skipText: { fontSize: 14, color: colors.textMuted },
});
