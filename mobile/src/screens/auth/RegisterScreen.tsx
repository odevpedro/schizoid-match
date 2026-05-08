import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/auth.slice';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Preencha os campos obrigatorios');
      return;
    }
    if (password.length < 8) {
      Alert.alert('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, locationRegion: location });
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Junte-se a comunidade WellMatch</Text>

        <View style={styles.form}>
          <Input label="Nome completo *" value={name} onChangeText={setName} placeholder="Ana Lima" />
          <Input
            label="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="seu@email.com"
          />
          <Input
            label="Senha * (min. 8 caracteres)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Input
            label="Regiao (opcional)"
            value={location}
            onChangeText={setLocation}
            placeholder="Sao Paulo, SP"
          />

          <Button label="Criar conta" onPress={handleRegister} loading={loading} />
          <Button
            label="Ja tenho conta"
            onPress={() => navigation.goBack()}
            variant="ghost"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.screen, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.xl },
  form: { gap: spacing.sm },
  backButton: { marginTop: spacing.sm },
});
