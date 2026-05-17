import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';

interface TopBarProps {
  title: string;
  subtitle?: string;
  leftIcon?: 'back' | 'pulse';
  onLeftPress?: () => void;
  rightIcon?: 'bell';
  onRightPress?: () => void;
  transparent?: boolean;
}

export function TopBar({ 
  title, 
  subtitle, 
  leftIcon, 
  onLeftPress, 
  rightIcon, 
  onRightPress,
  transparent = false
}: TopBarProps) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  
  return (
    <View style={[styles.container, transparent && styles.transparent]}>
      {leftIcon === 'back' && (
        <TouchableOpacity style={styles.iconBtn} onPress={onLeftPress}>
          <ChevronLeft color={colors.textMuted} size={20} />
        </TouchableOpacity>
      )}

      {leftIcon === 'pulse' ? (
        <View style={styles.pillContainer}>
          <View style={styles.pulseDot} />
          <View>
            <Typography variant="heading" style={{ fontSize: 14 }}>{title}</Typography>
            {subtitle && <Typography variant="body" color={colors.textMuted} style={{ fontSize: 10, marginTop: 1 }}>{subtitle}</Typography>}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: leftIcon ? 10 : 0 }}>
          {leftIcon !== 'back' && !leftIcon && <Typography variant="heading" style={{ fontSize: 22, flex: 1 }}>{title}</Typography>}
          {leftIcon === 'back' && <Typography variant="heading" style={{ fontSize: 16 }}>{title}</Typography>}
        </View>
      )}

      {rightIcon === 'bell' && (
        <TouchableOpacity style={[styles.iconBtn, { marginLeft: 10 }]} onPress={onRightPress}>
          <Bell color={colors.textMuted} size={18} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 100,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  pillContainer: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(8,14,18,0.92)' : 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBtn: {
    width: 42,
    height: 42,
    backgroundColor: isDark ? 'rgba(8,14,18,0.92)' : 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    backgroundColor: colors.crit,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
