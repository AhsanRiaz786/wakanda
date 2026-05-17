import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ClipboardList, FilePlus2, Home, ShieldCheck, Settings2 } from 'lucide-react-native';

import { useAppTheme } from '../hooks/useAppTheme';
import { Typography } from './Typography';

type Tab = 'Map' | 'Incidents' | 'Report' | 'Trace' | 'Settings';

interface BottomNavProps {
  activeTab: Tab;
  onTabSelect: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabSelect }: BottomNavProps) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'Map', label: 'Home', icon: Home },
    { id: 'Incidents', label: 'Incidents', icon: ClipboardList },
    { id: 'Report', label: 'Report', icon: FilePlus2 },
    { id: 'Trace', label: 'Trace', icon: ShieldCheck },
    { id: 'Settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <View style={styles.safeArea} pointerEvents="box-none">
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const color = isActive ? colors.green : colors.textMuted;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabSelect(tab.id)}
              activeOpacity={0.78}
            >
              <View style={styles.iconSlot}>
                {isActive && <View style={styles.activeDot} />}
                <Icon
                  size={24}
                  color={color}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>
              <Typography
                variant="body"
                color={color}
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {tab.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === 'ios' ? 102 : 94,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    zIndex: 180,
  },
  container: {
    width: '91%',
    maxWidth: 430,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: isDark ? 'rgba(24,24,27,0.98)' : 'rgba(255,255,255,0.98)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: isDark ? 0.38 : 0.15,
    shadowRadius: 22,
    elevation: 16,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconSlot: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    borderRadius: 14,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '800',
  },
});
