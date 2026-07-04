import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Button } from '../common/Button';
import { moderationService } from '../../services/moderation.service';

interface BlockUserButtonProps {
  targetUserId: string;
  onBlock?: () => void;
}

export const BlockUserButton: React.FC<BlockUserButtonProps> = ({ targetUserId, onBlock }) => {
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    Alert.alert(
      'Bloquear usuário?',
      'Ele não poderá mais aparecer para você nem conversar com você.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await moderationService.blockUser(targetUserId);
              Alert.alert('Usuário bloqueado com sucesso');
              onBlock?.();
            } catch {
              Alert.alert('Erro', 'Não foi possível bloquear o usuário.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Button
      label="Bloquear usuário"
      onPress={handlePress}
      variant="danger"
      loading={loading}
      disabled={loading}
    />
  );
};
