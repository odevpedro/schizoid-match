import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { MotionOnboardingScreen, MotionOptionCard } from '../../components/onboarding/MotionOnboarding';
import { onboardingService } from '../../services/onboarding.service';

const OPTIONS = [
  { value: 'friendship', label: 'Amizade' },
  { value: 'walking_partner', label: 'Companhia para caminhar' },
  { value: 'training_partner', label: 'Companhia para treinar' },
  { value: 'habit_accountability', label: 'Alguém para manter rotina' },
  { value: 'social_connection', label: 'Conexões sociais' },
  { value: 'romantic_optional', label: 'Aberto a conexão romântica' },
];

export const OnboardingIntentScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await onboardingService.saveStep1({ mainIntention: selected });
      navigation.navigate('OnboardingGoals');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionOnboardingScreen
      step={1}
      title="Qual sua intenção principal?"
      subtitle="Isso orienta as recomendações e evita conexões fora do seu contexto."
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label="Continuar"
            onPress={handleContinue}
            disabled={!selected}
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
              selected={selected === opt.value}
              onPress={() => setSelected(opt.value)}
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
