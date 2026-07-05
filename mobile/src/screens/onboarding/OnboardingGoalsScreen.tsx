import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { MotionOnboardingScreen, MotionOptionCard } from '../../components/onboarding/MotionOnboarding';
import { onboardingService } from '../../services/onboarding.service';

const OPTIONS = [
  { value: 'walk_more', label: 'Caminhar mais' },
  { value: 'sleep_better', label: 'Dormir melhor' },
  { value: 'exercise_consistently', label: 'Exercitar com regularidade' },
  { value: 'find_training_partner', label: 'Encontrar parceiro de treino' },
  { value: 'build_routine', label: 'Criar uma rotina' },
  { value: 'reduce_sedentary_habits', label: 'Reduzir sedentarismo' },
  { value: 'meet_people_safely', label: 'Conhecer pessoas com segurança' },
];

export const OnboardingGoalsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await onboardingService.saveStep2({ wellnessGoals: selected });
      navigation.navigate('OnboardingActivities');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionOnboardingScreen
      step={2}
      title="Quais seus objetivos de bem-estar?"
      subtitle="Escolha um ou mais objetivos. Eles viram sinais seguros de compatibilidade."
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label="Continuar"
            onPress={handleContinue}
            disabled={selected.length === 0}
            loading={loading}
          />
        </>
      }
    >
      <>
        {OPTIONS.map((opt) => {
          return (
            <MotionOptionCard
              key={opt.value}
              title={opt.label}
              selected={selected.includes(opt.value)}
              onPress={() => toggle(opt.value)}
              marker="checkbox"
              delay={80 + OPTIONS.indexOf(opt) * 40}
            />
          );
        })}
      </>
    </MotionOnboardingScreen>
  );
};

const styles = StyleSheet.create({
  error: { fontSize: 13, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
});
