import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { notificationService } from '../../services/notification.service';

interface NotificationBellProps {
  navigation: any;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ navigation }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.navigate('Notifications')}>
      <Text style={styles.icon}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative', marginRight: 12 },
  icon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
