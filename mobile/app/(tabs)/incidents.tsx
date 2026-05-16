import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Search, ChevronDown, Activity, MapPin } from 'lucide-react-native';
import { Typography } from '../../components/Typography';
import { TopBar } from '../../components/TopBar';
import { SeverityBadge, StatusBadge, SourcePill } from '../../components/Badges';
import { theme } from '../../constants/theme';
import { api } from '@/src/lib/api';

type IncidentRow = {
  incidentId: string;
  title: string;
  sourceLabel?: string;
  severity?: string;
  status?: string;
  timestamp?: string; // Optional if missing from backend
  department?: string; // Optional if missing
};

const FILTERS = ['All', 'Reported', 'Triaged', 'Assigned', 'In Progress', 'Resolved'];

export default function IncidentsScreen() {
  const [items, setItems] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listIncidents();
      setItems((data.incidents as IncidentRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getBorderColor = (sev: string | undefined) => {
    if (sev === 'CRITICAL') return theme.colors.crit;
    if (sev === 'HIGH') return theme.colors.high;
    if (sev === 'MEDIUM') return theme.colors.med;
    return theme.colors.low;
  };

  const getSeverity = (sev: string | undefined) => {
    return (sev || 'LOW') as any;
  };

  const getStatus = (stat: string | undefined) => {
    return (stat || 'Reported') as any;
  };

  return (
    <View style={styles.container}>
      <TopBar title="Incident Feed" />

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Search size={18} color={theme.colors.textDim} />
          <Typography variant="body" color={theme.colors.textDim} style={{ fontSize: 14 }}>
            Search incidents by ID, area...
          </Typography>
        </View>

        <View style={styles.sortRow}>
          <View style={styles.sortBtn}>
            <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 12, fontWeight: '600' }}>
              Sort: Newest
            </Typography>
            <ChevronDown size={14} color={theme.colors.textMuted} />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sfRow} contentContainerStyle={{ paddingRight: 16 }}>
            {FILTERS.map(f => (
              <Pressable 
                key={f} 
                style={[styles.sf, activeFilter === f && styles.sfActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Typography variant="mono" style={{ fontSize: 11, fontWeight: '700' }} color={activeFilter === f ? theme.colors.green : theme.colors.textDim}>
                  {f}
                </Typography>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.incidentId}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 12, paddingHorizontal: 12 }}
        renderItem={({ item }) => (
          <Link href={`/incident/${item.incidentId}`} asChild>
            <Pressable style={({ pressed }) => [styles.incCard, pressed && styles.incCardPressed]}>
              <View style={[styles.cardBar, { backgroundColor: getBorderColor(item.severity) }]} />
              
              <View style={styles.cardIcon}>
                <View style={[styles.cardIconInner, { backgroundColor: theme.colors.surface3 }]}>
                  <Activity size={16} color={theme.colors.text} />
                </View>
              </View>

              <View style={styles.cardBody}>
                <Typography variant="body" style={styles.cardTitle} numberOfLines={1}>{item.title}</Typography>
                
                <View style={styles.cardTags}>
                  <SeverityBadge severity={getSeverity(item.severity)} />
                  <StatusBadge status={getStatus(item.status)} />
                  <View style={styles.srcBox}>
                    <Typography variant="mono" color={theme.colors.textDim} style={{ fontSize: 10, fontWeight: '700' }}>
                      {item.sourceLabel || 'SYSTEM'}
                    </Typography>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 11 }}>
                    {item.timestamp || '2 min ago'}
                  </Typography>
                  <Typography variant="mono" color={theme.colors.textDim} style={{ fontSize: 10 }}>
                    {item.department || 'DEPT-UNASSIGNED'}
                  </Typography>
                </View>
              </View>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          !loading ? <Typography variant="body" style={styles.empty}>No incidents — seed backend first.</Typography> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.bg 
  },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sfRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sf: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
    backgroundColor: theme.colors.surface2,
  },
  sfActive: {
    backgroundColor: theme.colors.greenDim,
    borderColor: theme.colors.greenGlow,
  },
  incCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  incCardPressed: {
    opacity: 0.8,
    backgroundColor: theme.colors.surface2,
  },
  cardBar: {
    width: 4,
  },
  cardIcon: {
    width: 50,
    alignItems: 'center',
    paddingTop: 16,
  },
  cardIconInner: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  srcBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  empty: { 
    color: theme.colors.textMuted, 
    textAlign: 'center', 
    marginTop: 32 
  },
});
