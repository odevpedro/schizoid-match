import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import {
  MotionChip,
  MotionInfoPanel,
  MotionOnboardingScreen,
  MotionOptionCard,
} from '../../components/onboarding/MotionOnboarding';
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
  const [error, setError] = useState<string | null>(null);

  const canSubmit = source && (source === 'simulated' || (manualActivityLevel && manualSleepRoutine && manualChronotype));

  const handleFinish = async () => {
    if (!source) return;
    setLoading(true);
    setError(null);
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
      setError(err?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionOnboardingScreen
      step={7}
      title="Fonte dos dados"
      subtitle="Como você quer fornecer suas informações de rotina?"
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label="Finalizar"
            onPress={handleFinish}
            disabled={!canSubmit}
            loading={loading}
          />
        </>
      }
    >
      <>
        <MotionInfoPanel>
          Você pode usar o WellMatch sem conectar relógio ou app de saúde. A conexão apenas melhora a precisão do seu perfil de rotina.
        </MotionInfoPanel>

        {SOURCE_OPTIONS.map((opt, index) => (
          <MotionOptionCard
            key={opt.id}
            title={opt.title}
            description={opt.subtitle}
            selected={source === opt.id}
            onPress={() => setSource(opt.id)}
            delay={80 + index * 50}
          />
        ))}

        {source === 'manual' && (
          <View style={styles.pickersSection}>
            <Text style={styles.sectionLabel}>Nível de atividade</Text>
            <View style={styles.chipsRow}>
              {ACTIVITY_LEVELS.map((item) => (
                <MotionChip
                  key={item.id}
                  label={item.label}
                  selected={manualActivityLevel === item.id}
                  onPress={() => setManualActivityLevel(item.id)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Rotina de sono</Text>
            <View style={styles.chipsRow}>
              {SLEEP_ROUTINES.map((item) => (
                <MotionChip
                  key={item.id}
                  label={item.label}
                  selected={manualSleepRoutine === item.id}
                  onPress={() => setManualSleepRoutine(item.id)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Cronotipo</Text>
            <View style={styles.chipsRow}>
              {CHRONOTYPES.map((item) => (
                <MotionChip
                  key={item.id}
                  label={item.label}
                  selected={manualChronotype === item.id}
                  onPress={() => setManualChronotype(item.id)}
                />
              ))}
            </View>
          </View>
        )}
      </>
    </MotionOnboardingScreen>
  );
};

const styles = StyleSheet.create({
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
  error: { fontSize: 13, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
});
