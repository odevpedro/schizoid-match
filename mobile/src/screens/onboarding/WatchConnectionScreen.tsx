import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { healthService } from '../../services/health.service';
import { healthSyncService, SyncStatus } from '../../services/health-sync.service';
import { getNativeBridge } from '../../services/native-health';
import { HealthMetricType, HealthProvider } from '../../types/health.types';

const PROVIDERS: { id: HealthProvider; name: string; desc: string; icon: string; checkNative: boolean }[] = [
  { id: 'simulated', name: 'Modo Simulação', desc: 'Dados gerados automaticamente para teste', icon: '🎮', checkNative: false },
  { id: 'healthkit', name: 'Apple Health', desc: 'iOS — HealthKit (nativo)', icon: '❤️', checkNative: true },
  { id: 'health_connect', name: 'Health Connect', desc: 'Android — Health Connect API (nativo)', icon: '📱', checkNative: true },
  { id: 'garmin', name: 'Garmin Connect', desc: 'API Garmin — dados de relógio Garmin', icon: '⌚', checkNative: false },
  { id: 'fitbit', name: 'Fitbit', desc: 'API Fitbit — dados de pulseira Fitbit', icon: '⌚', checkNative: false },
];

const ALL_METRICS: { id: HealthMetricType; label: string; sensitive: boolean }[] = [
  { id: 'steps', label: 'Contagem de Passos', sensitive: false },
  { id: 'sleep', label: 'Dados de Sono', sensitive: false },
  { id: 'calories', label: 'Calorias', sensitive: false },
  { id: 'heart_rate', label: 'Frequência Cardíaca', sensitive: true },
  { id: 'hrv', label: 'Variabilidade Cardíaca', sensitive: true },
  { id: 'vo2max', label: 'VO2 Máx', sensitive: true },
  { id: 'stress', label: 'Nível de Estresse', sensitive: true },
  { id: 'blood_oxygen', label: 'Oxigenação Sanguínea', sensitive: true },
  { id: 'skin_temp', label: 'Temperatura Cutânea', sensitive: true },
];

export const WatchConnectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selected, setSelected] = useState<HealthProvider | null>(null);
  const [grantedMetrics, setGrantedMetrics] = useState<Record<string, boolean>>({
    steps: true, sleep: true, calories: true,
  });
  const [loading, setLoading] = useState(false);
  const [providerAvailable, setProviderAvailable] = useState<Record<string, boolean>>({ simulated: true });
  const [checkingProvider, setCheckingProvider] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    const unsub = healthSyncService.subscribe(setSyncStatus);
    return unsub;
  }, []);

  const checkAvailability = async (providerId: HealthProvider) => {
    if (providerId === 'simulated') {
      setSelected('simulated');
      return;
    }
    setCheckingProvider(true);
    try {
      const bridge = getNativeBridge(providerId);
      if (bridge) {
        const avail = await bridge.isAvailable();
        setProviderAvailable((prev) => ({ ...prev, [providerId]: avail }));
        if (avail) {
          setSelected(providerId);
        } else {
          Alert.alert(
            'Dispositivo não encontrado',
            providerId === 'healthkit'
              ? 'HealthKit só funciona em dispositivos iOS reais. Use o Modo Simulação para testes.'
              : 'Health Connect só funciona em dispositivos Android reais. Use o Modo Simulação para testes.'
          );
        }
      } else if (providerId === 'garmin' || providerId === 'fitbit') {
        setSelected(providerId);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível verificar a disponibilidade.');
    } finally {
      setCheckingProvider(false);
    }
  };

  const connect = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const metrics = (Object.entries(grantedMetrics)
        .filter(([_, v]) => v)
        .map(([k]) => k)) as HealthMetricType[];

      if (metrics.length === 0) {
        Alert.alert('Selecione pelo menos uma métrica');
        setLoading(false);
        return;
      }

      await healthSyncService.connect(selected, metrics);

      if (selected === 'simulated') {
        Alert.alert('Conectado!', 'Modo simulação ativo. Dados sendo gerados a cada 2 minutos.', [
          { text: 'Continuar', onPress: () => navigation.navigate('HealthDashboard') },
        ]);
      } else {
        Alert.alert('Conectado!', `Fonte "${PROVIDERS.find((p) => p.id === selected)?.name}" configurada.`, [
          { text: 'Continuar', onPress: () => navigation.navigate('HealthDashboard') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  const toggleMetric = (id: HealthMetricType) => {
    setGrantedMetrics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAll = () => {
    const all = ALL_METRICS.reduce((acc, m) => ({ ...acc, [m.id]: true }), {});
    setGrantedMetrics(all);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Conectar Fonte de Dados</Text>
      <Text style={styles.subtitle}>
        Escolha de onde virão seus dados de saúde e bem-estar.
        Você pode revogar permissões a qualquer momento.
      </Text>

      <Text style={styles.sectionLabel}>Fonte de dados</Text>
      {PROVIDERS.map((p) => {
        const isSelected = selected === p.id;
        const isAvail = providerAvailable[p.id] !== false;
        return (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.providerCard,
              isSelected && styles.providerSelected,
              !isAvail && styles.providerDisabled,
            ]}
            onPress={() => checkAvailability(p.id)}
            disabled={loading || checkingProvider}
          >
            <Text style={styles.providerIcon}>{p.icon}</Text>
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, !isAvail && styles.disabledText]}>{p.name}</Text>
              <Text style={styles.providerDesc}>{p.desc}</Text>
            </View>
            {checkingProvider && p.id === selected && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
            {isSelected && !checkingProvider && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        );
      })}

      {syncStatus && syncStatus.isSyncing && (
        <View style={styles.syncingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.syncingText}>Sincronizando...</Text>
        </View>
      )}

      {syncStatus && syncStatus.lastSyncAt && (
        <View style={styles.lastSyncBar}>
          <Text style={styles.lastSyncText}>
            Última sincronia: {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
          </Text>
          <Text style={styles.lastSyncText}>
            {syncStatus.metricsCount} métricas importadas
          </Text>
        </View>
      )}

      {selected && (
        <>
          <View style={styles.metricsHeader}>
            <Text style={styles.sectionLabel}>Métricas para compartilhar</Text>
            <TouchableOpacity onPress={selectAll}>
              <Text style={styles.selectAllText}>Selecionar todas</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metricsCard}>
            {ALL_METRICS.map((m) => (
              <View key={m.id} style={styles.metricRow}>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  {m.sensitive && <Text style={styles.sensitiveTag}>Dado sensível</Text>}
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
            style={[styles.connectBtn, (loading || checkingProvider) && styles.connectBtnDisabled]}
            onPress={connect}
            disabled={loading || checkingProvider}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.background} />
                <Text style={styles.connectBtnText}> Conectando...</Text>
              </View>
            ) : (
              <Text style={styles.connectBtnText}>
                {selected === 'simulated' ? 'Ativar Simulação' : 'Conectar e sincronizar'}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.skipBtn} onPress={() => {
        healthSyncService.stopSync();
        navigation.goBack();
      }}>
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
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  selectAllText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
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
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  skipBtn: { alignItems: 'center', padding: spacing.md },
  skipText: { fontSize: 14, color: colors.textMuted },
  syncingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: spacing.sm, marginTop: 4,
  },
  syncingText: { fontSize: 12, color: colors.primary },
  lastSyncBar: {
    padding: spacing.sm, marginTop: 2,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
  },
  lastSyncText: { fontSize: 11, color: colors.textMuted },
});
