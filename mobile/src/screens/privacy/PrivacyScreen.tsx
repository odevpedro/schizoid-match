import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { healthService } from '../../services/health.service';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.slice';
import { ConsentRecord, HealthMetricType } from '../../types/health.types';

const METRIC_LABELS: Record<HealthMetricType, string> = {
  steps: 'Contagem de Passos',
  sleep: 'Dados de Sono',
  heart_rate: 'Frequencia Cardiaca',
  hrv: 'Variabilidade da Frequencia Cardiaca',
  calories: 'Calorias',
  vo2max: 'VO2 Max',
  stress: 'Nivel de Estresse',
  blood_oxygen: 'Oxigenacao Sanguinea',
  skin_temp: 'Temperatura Cutanea',
};

const SAFE_METRICS: HealthMetricType[] = ['steps', 'sleep', 'calories'];
const SENSITIVE_METRICS: HealthMetricType[] = ['heart_rate', 'hrv', 'vo2max', 'stress', 'blood_oxygen', 'skin_temp'];

export const PrivacyScreen: React.FC = () => {
  const logout = useAuthStore((s) => s.logout);
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    healthService.getConsents().then((records: ConsentRecord[]) => {
      const map = records.reduce((acc, r) => ({
        ...acc,
        [r.metricType]: r.permissionStatus === 'granted',
      }), {});
      setConsents(map);
    }).catch(() => {});
  }, []);

  const toggleMetric = async (metric: HealthMetricType, value: boolean) => {
    setConsents((prev) => ({ ...prev, [metric]: value }));
    try {
      if (value) {
        const purpose = SENSITIVE_METRICS.includes(metric) ? 'wellness_badges' : 'matching_compatibility';
        await healthService.grantConsent([metric], 'simulated', purpose);
      } else {
        await healthService.revokeConsent([metric]);
      }
    } catch {
      setConsents((prev) => ({ ...prev, [metric]: !value }));
    }
  };

  const exportData = async () => {
    try {
      const data = await api.get('/privacy/export');
      Alert.alert('Exportacao concluida', 'Seus dados foram exportados. Em uma versao futura, o arquivo sera enviado por email.');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel exportar seus dados.');
    }
  };

  const deleteHealthData = () => {
    Alert.alert(
      'Excluir dados de saude',
      'Seus dados de saude e perfil derivado serao removidos. Esta acao nao pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/privacy/health-data');
              Alert.alert('Dados de saude excluidos com sucesso.');
            } catch {
              Alert.alert('Erro ao excluir dados.');
            }
          },
        },
      ],
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Excluir conta permanentemente',
      'Todos os seus dados, incluindo mensagens e matches, serao removidos. Esta acao e irreversivel.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/privacy/account');
              await logout();
            } catch {
              Alert.alert('Erro ao excluir conta.');
            }
          },
        },
      ],
    );
  };

  const MetricToggle = ({ metric }: { metric: HealthMetricType }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{METRIC_LABELS[metric]}</Text>
        {SENSITIVE_METRICS.includes(metric) && (
          <Text style={styles.sensitiveTag}>Dado sensivel</Text>
        )}
      </View>
      <Switch
        value={consents[metric] ?? false}
        onValueChange={(val) => toggleMetric(metric, val)}
        trackColor={{ false: colors.border, true: colors.primaryDim }}
        thumbColor={consents[metric] ? colors.primary : colors.textMuted}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacidade</Text>
      <Text style={styles.subtitle}>Voce controla quais dados de saude sao usados para compatibilidade.</Text>

      <Text style={styles.sectionTitle}>Dados basicos</Text>
      <View style={styles.card}>
        {SAFE_METRICS.map((m) => <MetricToggle key={m} metric={m} />)}
      </View>

      <Text style={styles.sectionTitle}>Dados avancados (sensiveis)</Text>
      <View style={styles.card}>
        {SENSITIVE_METRICS.map((m) => <MetricToggle key={m} metric={m} />)}
      </View>

      <Text style={styles.sectionTitle}>Seus dados (LGPD)</Text>
      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionBtn} onPress={exportData}>
          <Text style={styles.actionText}>Exportar meus dados</Text>
          <Text style={styles.actionDesc}>Baixe uma copia de todos os seus dados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={deleteHealthData}>
          <Text style={styles.dangerBtnText}>Excluir dados de saude</Text>
          <Text style={styles.actionDesc}>Remove dados de saude e perfil derivado</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.criticalBtn]} onPress={deleteAccount}>
          <Text style={styles.criticalBtnText}>Excluir conta permanentemente</Text>
          <Text style={styles.actionDesc}>Remove conta e todos os dados</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'space-between',
  },
  toggleInfo: { flex: 1, marginRight: spacing.md },
  toggleLabel: { fontSize: 14, color: colors.text },
  sensitiveTag: { fontSize: 11, color: colors.warning, marginTop: 2 },
  actionsCard: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  actionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dangerBtn: { borderColor: colors.warning, backgroundColor: 'rgba(245,158,11,0.08)' },
  dangerBtnText: { fontSize: 15, fontWeight: '600', color: colors.warning },
  criticalBtn: { borderColor: colors.error, backgroundColor: 'rgba(239,68,68,0.08)' },
  criticalBtnText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
