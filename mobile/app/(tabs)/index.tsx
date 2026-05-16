import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Text } from 'react-native';
import { theme } from '../../constants/theme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { KpiCard } from '../../components/KpiCard';
import { SeverityBadge } from '../../components/Badges';
import { Play } from 'lucide-react-native';
import { api } from '@/src/lib/api';
import { Map } from '../../components/Map';

const { width, height } = Dimensions.get('window');

const FILTERS = ['All', 'Road Block', 'Water', 'Power', 'Accident'];

export default function MapDashboardScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<any[]>([]);

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await api.listIncidents();
      setIncidents(data.incidents || []);
    } catch (e) {
      console.error('Failed to fetch incidents', e);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents, planId]);

  const runPlan = useCallback(async () => {
    setLoading(true);
    try {
      const plan = await api.plan({ planMode: 'full' });
      setPlanId(String(plan.planId));
    } catch (e) {
      console.error('Plan failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredIncidents = incidents.filter(inc => {
    if (activeFilter === 'All') return true;
    const desc = (inc.description || '').toLowerCase();
    if (activeFilter === 'Road Block') return desc.includes('road') || desc.includes('block') || desc.includes('traffic') || desc.includes('congestion') || desc.includes('tree');
    if (activeFilter === 'Water') return desc.includes('water') || desc.includes('pipe') || desc.includes('flood') || desc.includes('leak');
    if (activeFilter === 'Power') return desc.includes('power') || desc.includes('electrical') || desc.includes('arc') || desc.includes('train');
    if (activeFilter === 'Accident') return desc.includes('accident') || desc.includes('crash') || desc.includes('rescue');
    return true;
  });

  const openCount = incidents.filter(i => i.status === 'reported' || i.status === 'triaged' || !i.status).length;
  const assignedCount = incidents.filter(i => i.status === 'assigned' || i.status === 'in_progress').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'closed' || i.status === 'duplicate').length;

  // Map styling for a dark, high-contrast look
  const mapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#0B1820' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#132028' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1D2F3C' }] },
    { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091218' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
  ];

  return (
    <View style={styles.container}>
      <Map mapStyle={mapStyle} incidents={filteredIncidents} />

      <View style={styles.mapFade} />

      <TopBar 
        title="Islamabad" 
        subtitle={`${incidents.length} active incidents`} 
        leftIcon="pulse" 
        rightIcon="bell" 
        transparent 
      />

      {/* Bottom Sheet style overlay */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        {/* Filter Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Typography variant="body" style={{ fontSize: 11, fontWeight: '600' }} color={activeFilter === f ? '#041A10' : theme.colors.textMuted}>
                {f}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* KPIs */}
        <View style={styles.kpiStrip}>
          <KpiCard number={String(openCount)} label="OPEN" color={theme.colors.crit} />
          <View style={{ width: 8 }} />
          <KpiCard number={String(assignedCount)} label="ASSIGNED" color={theme.colors.high} />
          <View style={{ width: 8 }} />
          <KpiCard number={String(resolvedCount)} label="RESOLVED" color={theme.colors.green} />
        </View>

        {/* Recent Incidents */}
        <ScrollView style={{ flex: 1, minHeight: 150 }}>
          {filteredIncidents.slice(0, 10).map((inc) => {
            const sevColor = inc.severity === 'CRITICAL' ? theme.colors.crit : inc.severity === 'HIGH' ? theme.colors.high : inc.severity === 'LOW' ? theme.colors.low : theme.colors.med;
            return (
              <View key={inc.incidentId} style={styles.incRow}>
                <View style={[styles.sevDot, { backgroundColor: sevColor, shadowColor: sevColor, shadowOpacity: 0.4, shadowRadius: 4 }]} />
                <View style={styles.rowMain}>
                  <Typography variant="body" style={{ fontSize: 12, fontWeight: '500' }} numberOfLines={1}>{inc.description}</Typography>
                  <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 10, marginTop: 2 }}>{inc.sourceType} · {(inc.status || 'REPORTED').toUpperCase()} · {inc.assignedDepartments?.length ? inc.assignedDepartments.join(', ') : 'UNASSIGNED'}</Typography>
                </View>
                <SeverityBadge severity={inc.severity || 'UNKNOWN'} />
              </View>
            );
          })}
        </ScrollView>

        {/* Action Button */}
        <TouchableOpacity style={styles.runBtn} onPress={runPlan} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#041A10" />
          ) : (
            <>
              <Play size={16} color="#041A10" fill="#041A10" />
              <Typography variant="heading" style={{ fontSize: 14 }} color="#041A10">
                {planId ? 'Plan Generated ✓' : 'Run Agent Plan'}
              </Typography>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
  },
  markerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255,71,87,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 84,
    left: 0,
    right: 0,
    maxHeight: height * 0.40,
    backgroundColor: 'rgba(9,15,20,0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border2,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.green,
  },
  kpiStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  incRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sevDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowMain: {
    flex: 1,
  },
  runBtn: {
    margin: 16,
    backgroundColor: theme.colors.green,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
