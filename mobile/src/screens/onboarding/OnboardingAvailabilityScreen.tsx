import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { MotionOnboardingScreen, MotionOptionCard } from '../../components/onboarding/MotionOnboarding';
import { onboardingService } from '../../services/onboarding.service';

const OPTIONS = [
  { value: 'early_morning', label: 'Início da manhã' },
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening', label: 'Noite' },
  { value: 'night', label: 'Madrugada' },
  { value: 'weekends', label: 'Fins de semana' },
];

export const OnboardingAvailabilityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
      await onboardingService.saveStep4({ availabilityPeriods: selected });
      navigation.navigate('OnboardingIntensity');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionOnboardingScreen
      step={4}
      title="Qual sua disponibilidade?"
      subtitle="Os períodos ajudam a sugerir pessoas que conseguem combinar agenda com você."
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
              delay={80 + OPTIONS.indexOf(opt) * 45}
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
