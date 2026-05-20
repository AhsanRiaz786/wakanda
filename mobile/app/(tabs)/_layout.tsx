import React from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();

  let activeTab: 'Map' | 'Incidents' | 'Report' | 'Trace' | 'Settings' = 'Map';
  const segList = segments as string[];
  if (segList.includes('incidents')) activeTab = 'Incidents';
  else if (segList.includes('report')) activeTab = 'Report';
  else if (segList.includes('trace')) activeTab = 'Trace';
  else if (segList.includes('settings')) activeTab = 'Settings';

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => (
        <BottomNav
          activeTab={activeTab}
          onTabSelect={(tab) => {
            if (tab === 'Map') router.push('/');
            else if (tab === 'Incidents') router.push('/incidents');
            else if (tab === 'Report') router.push('/report');
            else if (tab === 'Trace') router.push('/trace');
            else if (tab === 'Settings') router.push('/settings');
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="incidents" />
      <Tabs.Screen name="report" />
      <Tabs.Screen name="trace" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
