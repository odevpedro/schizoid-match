import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { onboardingService } from '../../services/onboarding.service';

const SOURCE_OPTIONS = [
  {
    id: 'manual' as const,
    title: 'Preencher manualmente',
    subtitle: 'Vou informar meus dados de rotina agora',
  },
  {
    id: 'simulated' as const,
    title: 'Usar dados simulados',
    subtitle: 'Quero ver como funciona primeiro',
  },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentário' },
  { id: 'lightly_active', label: 'Levemente ativo' },
  { id: 'moderately_active', label: 'Moderadamente ativo' },
  { id: 'active', label: 'Ativo' },
  { id: 'very_active', label: 'Muito ativo' },
];

const SLEEP_ROUTINES = [
  { id: 'poor', label: 'Ruim' },
  { id: 'fair', label: 'Regular' },
  { id: 'good', label: 'Boa' },
  { id: 'great', label: 'Ótima' },
  { id: 'excellent', label: 'Excelente' },
];

const CHRONOTYPES = [
  { id: 'early_bird', label: 'Bem cedo' },
  { id: 'morning', label: 'Manhã' },
  { id: 'intermediate', label: 'Intermediário' },
  { id: 'afternoon', label: 'Tarde' },
  { id: 'night_owl', label: 'Noturno' },
];

export const OnboardingSourceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [source, setSource] = useState<'manual' | 'simulated' | null>(null);
  const [manualActivityLevel, setManualActivityLevel] = useState<string | null>(null);
  const [manualSleepRoutine, setManualSleepRoutine] = useState<string | null>(null);
  const [manualChronotype, setManualChronotype] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = source && (source === 'simulated' || (manualActivityLevel && manualSleepRoutine && manualChronotype));

  const handleFinish = async () => {
    if (!source) return;
    setLoading(true);
    try {
      await onboardingService.saveStep7({
        source,
        ...(source === 'manual' ? {
          manualActivityLevel: manualActivityLevel!,
          manualSleepRoutine: manualSleepRoutine!,
          manualChronotype: manualChronotype!,
        } : {}),
      });
      navigation.navigate('OnboardingCompleted');
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.stepIndicator}>Passo 7 de 7</Text>
      <Text style={styles.title}>Fonte dos dados</Text>
      <Text style={styles.subtitle}>Como você quer fornecer suas informações de rotina?</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          Você pode usar o WellMatch sem conectar relógio ou app de saúde. A conexão apenas melhora a precisão do seu perfil de rotina.
        </Text>
      </View>

      {SOURCE_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.sourceCard, source === opt.id && styles.sourceCardSelected]}
          onPress={() => setSource(opt.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sourceCardContent}>
            <Text style={styles.sourceCardTitle}>{opt.title}</Text>
            <Text style={styles.sourceCardSubtitle}>{opt.subtitle}</Text>
          </View>
          <View style={[styles.radio, source === opt.id && styles.radioSelected]}>
            {source === opt.id && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      ))}

      {source === 'manual' && (
        <View style={styles.pickersSection}>
          <Text style={styles.sectionLabel}>Nível de atividade</Text>
          <View style={styles.chipsRow}>
            {ACTIVITY_LEVELS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, manualActivityLevel === item.id && styles.chipSelected]}
                onPress={() => setManualActivityLevel(item.id)}
              >
                <Text style={[styles.chipText, manualActivityLevel === item.id && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Rotina de sono</Text>
          <View style={styles.chipsRow}>
            {SLEEP_ROUTINES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, manualSleepRoutine === item.id && styles.chipSelected]}
                onPress={() => setManualSleepRoutine(item.id)}
              >
                <Text style={[styles.chipText, manualSleepRoutine === item.id && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Cronotipo</Text>
          <View style={styles.chipsRow}>
            {CHRONOTYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, manualChronotype === item.id && styles.chipSelected]}
                onPress={() => setManualChronotype(item.id)}
              >
                <Text style={[styles.chipText, manualChronotype === item.id && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
        onPress={handleFinish}
        disabled={!canSubmit || loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Finalizar'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 60, paddingBottom: 40 },
  stepIndicator: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 20 },
  infoBox: {
    backgroundColor: colors.secondaryDim,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  infoBoxText: { fontSize: 13, color: colors.textSubtle, lineHeight: 20 },
  sourceCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  sourceCardContent: { flex: 1, marginRight: spacing.md },
  sourceCardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  sourceCardSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  pickersSection: { marginTop: spacing.lg },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextSelected: { color: colors.primary, fontWeight: '600' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.background },
});
