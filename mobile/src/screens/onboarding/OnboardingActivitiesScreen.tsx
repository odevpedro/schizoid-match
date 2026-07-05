import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { MotionOnboardingScreen, MotionOptionCard } from '../../components/onboarding/MotionOnboarding';
import { onboardingService } from '../../services/onboarding.service';

const OPTIONS = [
  { value: 'walking', label: 'Caminhada' },
  { value: 'running', label: 'Corrida' },
  { value: 'gym', label: 'Academia' },
  { value: 'cycling', label: 'Ciclismo' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'stretching', label: 'Alongamento' },
  { value: 'outdoor_activity', label: 'Atividades ao ar livre' },
  { value: 'home_workout', label: 'Treino em casa' },
  { value: 'casual_wellness', label: 'Bem-estar casual' },
];

export const OnboardingActivitiesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
      await onboardingService.saveStep3({ preferredActivities: selected });
      navigation.navigate('OnboardingAvailability');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionOnboardingScreen
      step={3}
      title="Quais atividades você prefere?"
      subtitle="Essas escolhas ajudam a mostrar pessoas com rotinas realmente compatíveis."
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
              delay={80 + OPTIONS.indexOf(opt) * 35}
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
