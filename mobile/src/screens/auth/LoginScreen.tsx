import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/auth.slice';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Credenciais invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>WellMatch</Text>
          <Text style={styles.logoSub}>Conexoes pelo bem-estar</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="seu@email.com"
          />
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <Button label="Entrar" onPress={handleLogin} loading={loading} />

          <Button
            label="Criar conta"
            onPress={() => navigation.navigate('Register')}
            variant="ghost"
            style={styles.registerButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.screen },
  logo: { alignItems: 'center', marginBottom: spacing.xxl },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  logoSub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  form: { gap: spacing.sm },
  registerButton: { marginTop: spacing.sm },
});
