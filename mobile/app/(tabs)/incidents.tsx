import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, StyleSheet, View, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Search, ChevronDown, Activity, MapPin, Clock, Navigation } from 'lucide-react-native';
import { Typography } from '../../components/Typography';
import { TopBar } from '../../components/TopBar';
import { SeverityBadge, StatusBadge, SourcePill } from '../../components/Badges';
import { theme } from '../../constants/theme';
import { api } from '@/src/lib/api';

type IncidentRow = {
  incidentId: string;
  title: string;
  description?: string;
  sourceLabel?: string;
  severity?: string;
  status?: string;
  timestamp?: string; // Optional if missing from backend
  department?: string; // Optional if missing
};

const FILTERS = ['All', 'Reported', 'Triaged', 'Assigned', 'In Progress', 'Resolved'];

export default function IncidentsScreen() {
  const router = useRouter();
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
              <TouchableOpacity 
                key={f} 
                style={[styles.sf, activeFilter === f && styles.sfActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Typography variant="mono" style={{ fontSize: 11, fontWeight: '700' }} color={activeFilter === f ? theme.colors.green : theme.colors.textDim}>
                  {f}
                </Typography>
              </TouchableOpacity>
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
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 16, paddingHorizontal: 16 }}
        renderItem={({ item }) => {
          const sevColor = getBorderColor(item.severity);
          
          return (
            <Link href={`/incident/${item.incidentId}`} asChild>
              <TouchableOpacity style={styles.incCard}>
                
                <View style={styles.incHeader}>
                  <View style={[styles.incIconBox, { backgroundColor: `${sevColor}15` }]}>
                    <Activity size={24} color={sevColor} />
                  </View>
                  <View style={styles.incTitleArea}>
                    <Typography variant="heading" style={{ fontSize: 15, marginBottom: 2 }} numberOfLines={1}>
                      {item.title || item.description || `Incident ${item.incidentId.split('-')[0]}`}
                    </Typography>
                    <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 12 }}>
                      {item.description || 'No description provided.'}
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
                      {(item.status || 'REPORTED').toUpperCase()}
                    </Typography>
                  </View>
                </View>

                <View style={styles.incTags}>
                  <SeverityBadge severity={getSeverity(item.severity)} />
                  <View style={styles.tagPill}>
                    <Typography variant="mono" style={{ fontSize: 10, color: theme.colors.textDim }}>
                      {item.sourceLabel || 'LIVE FEED'}
                    </Typography>
                  </View>
                  <View style={styles.tagPill}>
                    <Typography variant="mono" style={{ fontSize: 10, color: theme.colors.textDim }}>
                      {item.department || 'UNASSIGNED'}
                    </Typography>
                  </View>
                </View>

                <View style={styles.incActions}>
                  <View style={styles.btnPrimary}>
                    <Navigation size={14} color="#000" />
                    <Typography variant="heading" style={{ fontSize: 13, color: '#000', marginLeft: 6 }}>
                      View Details
                    </Typography>
                  </View>
                </View>
                
              </TouchableOpacity>
            </Link>
          );
        }}
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
  empty: { 
    color: theme.colors.textMuted, 
    textAlign: 'center', 
    marginTop: 32 
  },
});
