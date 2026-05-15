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
          <Search size={16} color={theme.colors.textDim} />
          <Typography variant="body" color={theme.colors.textDim} style={{ fontSize: 13 }}>
            Search incidents by ID, area...
          </Typography>
        </View>

        <View style={styles.sortRow}>
          <View style={styles.sortBtn}>
            <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 11, fontWeight: '600' }}>
              Sort: Newest
            </Typography>
            <ChevronDown size={14} color={theme.colors.textMuted} />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sfRow}>
            {FILTERS.map(f => (
              <Pressable 
                key={f} 
                style={[styles.sf, activeFilter === f && styles.sfActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Typography variant="mono" style={{ fontSize: 10, fontWeight: '700' }} color={activeFilter === f ? theme.colors.green : theme.colors.textDim}>
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
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Link href={`/incident/${item.incidentId}`} asChild>
            <Pressable style={styles.incCard}>
              <View style={[styles.cardBar, { backgroundColor: getBorderColor(item.severity) }]} />
              
              <View style={styles.cardIcon}>
                <View style={[styles.cardIconInner, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Activity size={15} color={theme.colors.text} />
                </View>
              </View>

              <View style={styles.cardBody}>
                <Typography variant="body" style={styles.cardTitle} numberOfLines={1}>{item.title}</Typography>
                
                <View style={styles.cardTags}>
                  <SeverityBadge severity={getSeverity(item.severity)} />
                  <StatusBadge status={getStatus(item.status)} />
                  <View style={styles.srcBox}>
                    <Typography variant="mono" color={theme.colors.textDim} style={{ fontSize: 9, fontWeight: '700' }}>
                      {item.sourceLabel || 'SYSTEM'}
                    </Typography>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 10 }}>
                    {item.timestamp || '2 min ago'}
                  </Typography>
                  <Typography variant="mono" color={theme.colors.textDim} style={{ fontSize: 9 }}>
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
    backgroundColor: theme.colors.surface 
  },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sfRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sf: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 5,
  },
  sfActive: {
    backgroundColor: theme.colors.greenDim,
    borderColor: 'rgba(0,214,143,0.3)',
  },
  incCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  cardBar: {
    width: 3,
  },
  cardIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconInner: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 11,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  srcBox: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: theme.colors.surface2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empty: { 
    color: theme.colors.textMuted, 
    textAlign: 'center', 
    marginTop: 24 
  },
});
