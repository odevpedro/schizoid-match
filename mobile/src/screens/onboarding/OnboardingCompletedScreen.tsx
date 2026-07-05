import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { MotionInfoPanel, MotionOnboardingScreen } from '../../components/onboarding/MotionOnboarding';
import { useAuthStore } from '../../store/auth.slice';

export const OnboardingCompletedScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);

  const handleStart = () => {
    setLoading(true);
    setOnboardingCompleted(true);
  };

  return (
    <MotionOnboardingScreen
      title="Perfil criado!"
      subtitle="Seu perfil público de bem-estar foi gerado com segurança. Agora você pode encontrar pessoas com rotinas compatíveis."
      icon="✓"
      badge="Pronto para combinar"
      centered
      contentStyle={styles.content}
      footer={
        <Button
          label="Começar a usar o WellMatch"
          onPress={handleStart}
          loading={loading}
        />
      }
    >
      <MotionInfoPanel tone="success">
        Seu perfil usa apenas informações seguras. Nenhum dado bruto de saúde é compartilhado.
      </MotionInfoPanel>
    </MotionOnboardingScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
  },
});
