import React, { useCallback } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import { VoiceCommandButton } from '../../components/VoiceCommandButton';
import { api } from '@/src/lib/api';
import { useStatus } from '../../contexts/StatusContext';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { showStatus } = useStatus();

  let activeTab: 'Map' | 'Incidents' | 'Report' | 'Trace' | 'Settings' = 'Map';
  if (segments.includes('incidents')) activeTab = 'Incidents';
  else if (segments.includes('report')) activeTab = 'Report';
  else if (segments.includes('trace')) activeTab = 'Trace';
  else if (segments.includes('settings')) activeTab = 'Settings';

  /**
   * After a voice `ingest` command succeeds, navigate to Incidents so the
   * user can immediately see the new entry.
   */
  const handleIngestSuccess = useCallback(() => {
    router.push('/incidents');
    showStatus({ type: 'success', label: 'Incident logged — view feed', duration: 3000 });
  }, []);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => (
        <>
          <VoiceCommandButton
            apiUrl={process.env.EXPO_PUBLIC_API_BASE_URL || 'https://wakanda-backend.onrender.com/v1'}
            callbacks={{ onIngestSuccess: handleIngestSuccess }}
          />
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
        </>
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
