import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Navigation, Map as MapIcon, PlusCircle, Activity } from 'lucide-react-native';
import { Typography } from './Typography';
import { theme } from '../constants/theme';
// Assuming expo-router or similar will handle active state, we take it as prop for now.

type Tab = 'Map' | 'Incidents' | 'Report' | 'Trace';

interface BottomNavProps {
  activeTab: Tab;
  onTabSelect: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabSelect }: BottomNavProps) {
  const tabs: { id: Tab; icon: any }[] = [
    { id: 'Map', icon: Navigation },
    { id: 'Incidents', icon: Activity }, // Or custom List icon
    { id: 'Report', icon: PlusCircle },
    { id: 'Trace', icon: MapIcon }, // Or custom Network icon
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? theme.colors.green : theme.colors.textDim;
        const Icon = tab.icon;

        return (
          <TouchableOpacity 
            key={tab.id} 
            style={styles.tab} 
            onPress={() => onTabSelect(tab.id)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.activeDot} />}
            <Icon size={22} color={color} strokeWidth={isActive ? 2.5 : 1.8} />
            <Typography 
              variant="body" 
              color={color} 
              style={{ fontSize: 10, fontWeight: '500', marginTop: 4 }}
            >
              {tab.id}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 84,
    backgroundColor: 'rgba(8,14,18,0.97)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    zIndex: 180,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: -12,
    width: 20,
    height: 2,
    backgroundColor: theme.colors.green,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
