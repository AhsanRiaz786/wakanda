import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Animated, PanResponder, Platform } from 'react-native';
import { theme } from '../../constants/theme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { SeverityBadge } from '../../components/Badges';
import { Play, MapPin, Activity, Clock, Navigation } from 'lucide-react-native';
import { api } from '@/src/lib/api';
import { Map } from '../../components/Map';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

const FILTERS = ['All', 'Road Block', 'Water', 'Power', 'Accident'];

// Snap points for the bottom sheet
const SNAP_TOP = 0;
const SNAP_MID = height * 0.35;
const SNAP_BOT = height * 0.62;

export default function MapDashboardScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<any[]>([]);

  // Animation values for bottom sheet
  const translateY = useRef(new Animated.Value(SNAP_MID)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture drag if vertical movement is significant
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value);
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentY = (translateY as any)._value;
        
        let toValue = SNAP_MID;
        
        // Determine nearest snap point based on velocity and position
        if (gestureState.vy < -0.5 || currentY < SNAP_MID - 80) {
          toValue = SNAP_TOP;
        } else if (gestureState.vy > 0.5 || currentY > SNAP_MID + 80) {
          toValue = SNAP_BOT;
        }

        // Clamp values
        if (toValue < SNAP_TOP) toValue = SNAP_TOP;
        if (toValue > SNAP_BOT) toValue = SNAP_BOT;

        Animated.spring(translateY, {
          toValue,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    })
  ).current;

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

  const mapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#09090B' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#71717A' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#09090B' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#27272A' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#18181B' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#27272A' }] },
    { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3F3F46' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#09090B' }] }
  ];

  return (
    <View style={styles.container}>
      {/* Background Map spanning full height */}
      <View style={StyleSheet.absoluteFill}>
        <Map mapStyle={mapStyle} incidents={filteredIncidents} />
      </View>

      {/* TopBar overlapping Map */}
      <View style={styles.topBarWrapper}>
        <TopBar 
          title="Islamabad Ops" 
          subtitle="City Incident Dashboard" 
          leftIcon="pulse" 
          rightIcon="bell" 
          transparent
        />
      </View>

      {/* Draggable Bottom Sheet Overlay */}
      <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY }] }]}>
        
        {/* Floating Card (moves with the sheet) */}
        <View style={styles.floatingCard}>
          <View style={styles.floatingCardIconBox}>
            <MapPin size={20} color="#fff" />
          </View>
          <View>
            <Typography variant="heading" style={{ fontSize: 14, color: theme.colors.text }}>
              {filteredIncidents.length} Anomalies Found
            </Typography>
            <Typography variant="body" style={{ fontSize: 12, color: theme.colors.textDim }}>
              Within city limits
            </Typography>
          </View>
        </View>

        {/* The actual Sheet Container */}
        <View style={styles.bottomSheetContainer}>
          {/* Drag Handle Area */}
          <View {...panResponder.panHandlers} style={styles.dragZone}>
            <View style={styles.sheetHandle} />
          </View>
          
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            
            {/* Action Button at top of sheet */}
            <TouchableOpacity 
              style={[styles.runBtn, planId ? styles.runBtnSuccess : null]} 
              onPress={runPlan} 
              disabled={loading || !!planId}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Play size={18} color="#000" fill="#000" />
                  <Typography variant="heading" style={{ fontSize: 15, letterSpacing: 0.5, color: '#000' }}>
                    {planId ? 'Agent Plan Deployed ✓' : 'Run Autonomous Plan'}
                  </Typography>
                </>
              )}
            </TouchableOpacity>

            {/* Filter Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingRight: 20 }}>
              {FILTERS.map(f => (
                <TouchableOpacity 
                  key={f} 
                  style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                  onPress={() => setActiveFilter(f)}
                >
                  <Typography variant="body" style={{ fontSize: 13, fontWeight: '600' }} color={activeFilter === f ? theme.colors.greenSoft : theme.colors.textMuted}>
                    {f}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* List of Incident Cards inspired by screenshot */}
            {filteredIncidents.slice(0, 10).map((inc) => {
              const sevColor = inc.severity === 'CRITICAL' ? theme.colors.crit : inc.severity === 'HIGH' ? theme.colors.high : inc.severity === 'LOW' ? theme.colors.low : theme.colors.med;
              
              return (
                <View key={inc.incidentId} style={styles.incCard}>
                  <View style={styles.incHeader}>
                    <View style={[styles.incIconBox, { backgroundColor: `${sevColor}15` }]}>
                      <Activity size={24} color={sevColor} />
                    </View>
                    <View style={styles.incTitleArea}>
                      <Typography variant="heading" style={{ fontSize: 15, marginBottom: 2 }} numberOfLines={1}>
                        {inc.title || inc.description}
                      </Typography>
                      <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 12 }}>
                        {inc.description}
                      </Typography>
                    </View>
                  </View>

                  <View style={styles.incMetaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={12} color={theme.colors.green} />
                      <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 11, marginLeft: 4 }}>
                        1.2 km away
                      </Typography>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={12} color={theme.colors.green} />
                      <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 11, marginLeft: 4 }}>
                        {(inc.status || 'REPORTED').toUpperCase()}
                      </Typography>
                    </View>
                  </View>

                  <View style={styles.incTags}>
                    <SeverityBadge severity={inc.severity || 'UNKNOWN'} />
                    <View style={styles.tagPill}>
                      <Typography variant="mono" style={{ fontSize: 10, color: theme.colors.textDim }}>
                        {inc.sourceType || 'LIVE FEED'}
                      </Typography>
                    </View>
                    {inc.assignedDepartments?.map((dept: string) => (
                      <View key={dept} style={styles.tagPill}>
                        <Typography variant="mono" style={{ fontSize: 10, color: theme.colors.textDim }}>
                          {dept}
                        </Typography>
                      </View>
                    ))}
                  </View>

                  <View style={styles.incActions}>
                    <TouchableOpacity 
                      style={styles.btnPrimary}
                      onPress={() => inc.incidentId && router.push(`/incident/${inc.incidentId}`)}
                    >
                      <Navigation size={14} color="#000" />
                      <Typography variant="heading" style={{ fontSize: 13, color: '#000', marginLeft: 6 }}>
                        View Details
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  topBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.7)', // Slightly transparent background so text is readable over map
  },
  sheetWrapper: {
    position: 'absolute',
    top: 110, // Starts below TopBar
    left: 0,
    right: 0,
    height: height, // Full height so when pulled up it covers the screen
    zIndex: 20,
  },
  floatingCard: {
    position: 'absolute',
    top: -80, // Sits exactly above the sheet
    left: 20,
    right: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  floatingCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.greenDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: theme.colors.border2,
    borderRightColor: theme.colors.border2,
  },
  dragZone: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  sheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: theme.colors.surface3,
    borderRadius: 3,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 200, // Extra padding at bottom to clear bottom nav
  },
  runBtn: {
    backgroundColor: theme.colors.green,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    shadowColor: theme.colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  runBtnSuccess: {
    backgroundColor: theme.colors.greenSoft,
    shadowColor: 'transparent',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    backgroundColor: theme.colors.surface2,
  },
  filterChipActive: {
    backgroundColor: theme.colors.greenDeep,
    borderColor: theme.colors.green,
  },
  incCard: {
    backgroundColor: theme.colors.surface2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  incHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  incIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  incTitleArea: {
    flex: 1,
  },
  incMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  incTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: theme.colors.surface3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  incActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.green,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
