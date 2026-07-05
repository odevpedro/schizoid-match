import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { onboardingService, PublicWellnessProfile } from '../../services/onboarding.service';
import { useAuthStore } from '../../store/auth.slice';

const MAIN_INTENTION_LABELS: Record<string, string> = {
  friendship: 'Amizade',
  walking_partner: 'Companhia para caminhar',
  training_partner: 'Companhia para treino',
  habit_accountability: 'Compromisso de hábitos',
  social_connection: 'Conexão social',
  romantic_optional: 'Relacionamento (flexível)',
};

const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  low: 'Leve',
  moderate: 'Moderada',
  active: 'Ativa',
  very_active: 'Muito ativa',
};

const CONSISTENCY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const SLEEP_ROUTINE_LABELS: Record<string, string> = {
  irregular: 'Irregular',
  regular: 'Regular',
  consistent: 'Consistente',
};

const CHRONOTYPE_LABELS: Record<string, string> = {
  early: 'Início da manhã',
  morning: 'Matutino',
  flexible: 'Flexível',
  evening: 'Vespertino',
  night: 'Noturno',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  mixed: 'Misto',
};

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={[styles.fieldValue, !value && styles.fieldEmpty]}>
      {value || 'Não informado'}
    </Text>
  </View>
);

const TagsField: React.FC<{ label: string; tags?: string[] | null }> = ({ label, tags }) => {
  const items = tags ?? [];
  return (
    <View style={styles.tagsSection}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.tagsRow}>
        {items.length > 0
          ? items.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))
          : <Text style={[styles.fieldValue, styles.fieldEmpty]}>Não informado</Text>
        }
      </View>
    </View>
  );
};

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);
  const [profile, setProfile] = useState<PublicWellnessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await onboardingService.getWellnessProfile();
      setProfile(data);
    } catch {
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {!profile ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Complete o onboarding primeiro</Text>
          <Text style={styles.emptyText}>
            Preencha seu perfil de bem-estar para aparecer para outras pessoas.
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => setOnboardingCompleted(false)}
          >
            <Text style={styles.startBtnText}>Ir para o onboarding</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Seu Perfil Público de Bem-Estar</Text>
          <Text style={styles.privacyNote}>
            Essas são as informações usadas para encontrar pessoas com rotina compatível. Nenhum dado bruto de saúde é exibido para outros usuários.
          </Text>

          <View style={styles.fieldsContainer}>
            <Field
              label="Intenção principal"
              value={profile.mainIntention ? (MAIN_INTENTION_LABELS[profile.mainIntention] ?? profile.mainIntention) : null}
            />
            <Field
              label="Nível de atividade"
              value={profile.activityLevel ? (ACTIVITY_LEVEL_LABELS[profile.activityLevel] ?? profile.activityLevel) : null}
            />
            <Field
              label="Consistência"
              value={profile.activityConsistencyBand ? (CONSISTENCY_LABELS[profile.activityConsistencyBand] ?? profile.activityConsistencyBand) : null}
            />
            <Field
              label="Rotina de sono"
              value={profile.sleepRoutineBand ? (SLEEP_ROUTINE_LABELS[profile.sleepRoutineBand] ?? profile.sleepRoutineBand) : null}
            />
            <Field
              label="Cronotipo"
              value={profile.chronotypeBand ? (CHRONOTYPE_LABELS[profile.chronotypeBand] ?? profile.chronotypeBand) : null}
            />
            <Field
              label="Intensidade preferida"
              value={profile.intensityPreference}
            />
            <TagsField label="Atividades preferidas" tags={profile.preferredActivities} />
            <TagsField label="Objetivos de bem-estar" tags={profile.wellnessGoals} />
            <TagsField label="Períodos disponíveis" tags={profile.availabilityPeriods} />
            <TagsField label="Badges públicos" tags={profile.publicBadges} />
            <Field
              label="Confiança do perfil"
              value={CONFIDENCE_LABELS[profile.scoreConfidence] ?? profile.scoreConfidence}
            />
            <Field
              label="Fonte"
              value={SOURCE_LABELS[profile.source] ?? profile.source}
            />
          </View>
        </View>
      )}

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HealthDashboard')}>
          <Text style={styles.menuText}>Meus Dados</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Privacy')}>
          <Text style={styles.menuText}>Privacidade</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('WatchConnection')}>
          <Text style={styles.menuText}>Smartwatch</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={() => navigation.navigate('Privacy')}>
          <Text style={styles.dangerText}>Excluir conta</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={logout}>
          <Text style={styles.dangerText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 60 },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  privacyNote: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  fieldsContainer: { gap: 0 },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldLabel: { fontSize: 13, color: colors.textMuted, flex: 1 },
  fieldValue: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right', maxWidth: '55%' },
  fieldEmpty: { color: colors.textMuted, fontWeight: '400' },
  tagsSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: {
    backgroundColor: colors.primaryDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  emptyCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  startBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startBtnText: { color: colors.background, fontWeight: '700', fontSize: 14 },
  errorText: { fontSize: 16, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  menuSection: { marginTop: spacing.sm },
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
