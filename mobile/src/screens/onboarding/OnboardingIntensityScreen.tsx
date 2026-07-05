import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { MotionOnboardingScreen, MotionOptionCard } from '../../components/onboarding/MotionOnboarding';
import { onboardingService } from '../../services/onboarding.service';

const INTENSITY_OPTIONS = [
  { id: 'low', title: 'Leve', description: 'Caminhadas tranquilas, alongamento' },
  { id: 'moderate', title: 'Moderada', description: 'Exercícios com ritmo constante' },
  { id: 'high', title: 'Intensa', description: 'Treinos pesados, alta performance' },
  { id: 'flexible', title: 'Flexível', description: 'Depende do dia e da atividade' },
];

export const OnboardingIntensityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await onboardingService.saveStep5({ intensityPreference: selected });
      navigation.navigate('OnboardingPrivacy');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionOnboardingScreen
      step={5}
      title="Qual intensidade você prefere?"
      subtitle="Escolha o nível que mais combina com seu momento atual."
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
        {INTENSITY_OPTIONS.map((opt, index) => (
          <MotionOptionCard
            key={opt.id}
            title={opt.title}
            description={opt.description}
            selected={selected === opt.id}
            onPress={() => setSelected(opt.id)}
            delay={80 + index * 50}
          />
        ))}
      </>
    </MotionOnboardingScreen>
  );
};

const styles = StyleSheet.create({
  error: { fontSize: 13, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
});
