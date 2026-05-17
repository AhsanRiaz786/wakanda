import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  StatusBar,
  Pressable,
} from 'react-native';
import { X, AlertTriangle, CheckCircle2, Activity, Bell, Info } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Typography } from './Typography';

interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info' | 'activity';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Critical Incident Detected',
    body: 'Road blockage on Constitution Ave near D-02. Severity: CRITICAL. AI dispatch initiated.',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'activity',
    title: 'Agent Plan Deployed',
    body: '12 incidents processed. 4 crews dispatched. 2 contradictions resolved by LLM.',
    time: '8 min ago',
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Incident INC-003 Resolved',
    body: 'Water leak at Blue Area has been resolved. Crews stood down.',
    time: '22 min ago',
    read: true,
  },
  {
    id: '4',
    type: 'info',
    title: 'Voice Command Processed',
    body: 'Intent detected: list_incidents. 8 results returned.',
    time: '35 min ago',
    read: true,
  },
  {
    id: '5',
    type: 'alert',
    title: 'Contradiction Alert',
    body: 'Conflicting source reports on incident INC-007. AI resolution applied.',
    time: '1 hr ago',
    read: true,
  },
];

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationPanel({ visible, onClose }: NotificationPanelProps) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);

  const slideAnim = useRef(new Animated.Value(-420)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 10,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -420,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'alert': return { Icon: AlertTriangle, color: colors.crit };
      case 'success': return { Icon: CheckCircle2, color: colors.green };
      case 'activity': return { Icon: Activity, color: '#A78BFA' };
      case 'info': return { Icon: Info, color: colors.low };
    }
  };

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <View style={styles.panelTitleRow}>
            <Bell size={18} color={colors.green} strokeWidth={2} />
            <Typography variant="heading" style={{ fontSize: 16, marginLeft: 10 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Typography variant="mono" style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>
                  {unreadCount}
                </Typography>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* List */}
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {MOCK_NOTIFICATIONS.map((notif, idx) => {
            const { Icon, color } = getIconForType(notif.type);
            return (
              <View
                key={notif.id}
                style={[
                  styles.notifRow,
                  idx < MOCK_NOTIFICATIONS.length - 1 && styles.notifBorder,
                  !notif.read && styles.notifUnread,
                ]}
              >
                <View style={[styles.notifIconBox, { backgroundColor: `${color}15` }]}>
                  <Icon size={18} color={color} strokeWidth={2} />
                </View>
                <View style={styles.notifBody}>
                  <View style={styles.notifTitleRow}>
                    <Typography
                      variant="body"
                      style={{ fontSize: 13, fontWeight: '600', flex: 1 }}
                      numberOfLines={1}
                    >
                      {notif.title}
                    </Typography>
                    {!notif.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
                  </View>
                  <Typography
                    variant="body"
                    color={colors.textMuted}
                    style={{ fontSize: 12, lineHeight: 18, marginTop: 3 }}
                    numberOfLines={2}
                  >
                    {notif.body}
                  </Typography>
                  <Typography
                    variant="mono"
                    color={colors.textDim}
                    style={{ fontSize: 10, marginTop: 4 }}
                  >
                    {notif.time}
                  </Typography>
                </View>
              </View>
            );
          })}

          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Typography variant="mono" color={colors.textDim} style={{ fontSize: 10, letterSpacing: 1 }}>
              END OF NOTIFICATIONS
            </Typography>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)',
    },
    panel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      maxHeight: '75%',
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.5 : 0.18,
      shadowRadius: 24,
      elevation: 20,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border2,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 52,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    panelTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    unreadBadge: {
      marginLeft: 8,
      backgroundColor: colors.crit,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 14,
      paddingHorizontal: 20,
      gap: 14,
    },
    notifBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    notifUnread: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    },
    notifIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    notifBody: {
      flex: 1,
    },
    notifTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginLeft: 8,
      flexShrink: 0,
    },
  });
