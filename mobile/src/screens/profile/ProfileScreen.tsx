import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { WellnessBadges } from '../../components/health/WellnessBadges';
import { healthService } from '../../services/health.service';
import { useAuthStore } from '../../store/auth.slice';
import { HealthProfileDaily } from '../../types/health.types';

const BAND_LABELS: Record<string, string> = {
  very_low: 'Muito Baixo',
  low: 'Baixo',
  moderate: 'Moderado',
  high: 'Alto',
  very_high: 'Muito Alto',
  poor: 'Ruim',
  fair: 'Regular',
  good: 'Bom',
  great: 'Otimo',
  excellent: 'Excelente',
  early_bird: 'Madrugador',
  morning: 'Matutino',
  intermediate: 'Intermediario',
  afternoon: 'Vespertino',
  night_owl: 'Noturno',
};

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState<HealthProfileDaily | null>(null);

  useEffect(() => {
    healthService.getDerivedProfile().then((data) => {
      if (data.length > 0) setProfile(data[0]);
    }).catch(() => {});
  }, []);

  const MetricRow = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{BAND_LABELS[value] ?? value}</Text>
      </View>
    ) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {profile && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Perfil de Bem-estar</Text>
          <MetricRow label="Nivel de atividade" value={profile.activityLevel} />
          <MetricRow label="Media de passos" value={profile.avgStepsBand} />
          <MetricRow label="Qualidade do sono" value={profile.sleepQualityBand} />
          <MetricRow label="Cronotype" value={profile.chronotype} />
          <MetricRow label="Recuperacao" value={profile.recoveryBand} />
          <MetricRow label="Nivel de estresse" value={profile.stressBand} />
          <MetricRow label="Condicionamento cardiovascular" value={profile.cardioFitnessBand} />
          <View style={styles.consistencyRow}>
            <Text style={styles.metricLabel}>Consistencia geral</Text>
            <View style={styles.consistencyBar}>
              <View style={[styles.consistencyFill, { width: `${profile.consistencyScore ?? 0}%` as any }]} />
            </View>
            <Text style={styles.consistencyScore}>{profile.consistencyScore?.toFixed(0)}%</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Privacy')}>
        <Text style={styles.menuText}>Privacidade e LGPD</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={logout}>
        <Text style={styles.dangerText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: { fontSize: 14, color: colors.textMuted },
  metricValue: { fontSize: 14, fontWeight: '600', color: colors.primary },
  consistencyRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 8 },
  consistencyBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  consistencyFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  consistencyScore: { fontSize: 13, fontWeight: '600', color: colors.primary, width: 36 },
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
  menuText: { fontSize: 15, color: colors.text },
  menuArrow: { fontSize: 20, color: colors.textMuted },
  dangerItem: { borderColor: colors.error, backgroundColor: 'rgba(239,68,68,0.08)' },
  dangerText: { fontSize: 15, color: colors.error, fontWeight: '600' },
});
