import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, StyleSheet, View, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Search, ChevronDown, Activity, MapPin, Clock, Navigation } from 'lucide-react-native';
import { Typography } from '../../components/Typography';
import { TopBar } from '../../components/TopBar';
import { SeverityBadge, StatusBadge, SourcePill } from '../../components/Badges';
import { useAppTheme } from '../../hooks/useAppTheme';
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
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  
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
    if (sev === 'CRITICAL') return colors.crit;
    if (sev === 'HIGH') return colors.high;
    if (sev === 'MEDIUM') return colors.med;
    return colors.low;
  };

  const getSeverity = (sev: string | undefined) => {
    return (sev || 'LOW') as any;
  };

  const filteredItems = activeFilter === 'All'
    ? items
    : items.filter(item => (item.status || 'Reported').toLowerCase() === activeFilter.toLowerCase());

  return (
    <View style={styles.container}>
      <TopBar title="Incident Feed" />

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textDim} />
          <Typography variant="body" color={colors.textDim} style={{ fontSize: 14 }}>
            Search incidents by ID, area...
          </Typography>
        </View>

        <View style={styles.sortRow}>
          <View style={styles.sortBtn}>
            <Typography variant="body" color={colors.textMuted} style={{ fontSize: 12, fontWeight: '600' }}>
              Sort: Newest
            </Typography>
            <ChevronDown size={14} color={colors.textMuted} />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sfRow} contentContainerStyle={{ paddingRight: 16 }}>
            {FILTERS.map(f => (
              <TouchableOpacity 
                key={f} 
                style={[styles.sf, activeFilter === f && styles.sfActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Typography variant="mono" style={{ fontSize: 11, fontWeight: '700' }} color={activeFilter === f ? colors.green : colors.textDim}>
                  {f}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.incidentId}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16, paddingHorizontal: 16 }}
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
                    <Typography variant="body" color={colors.textMuted} style={{ fontSize: 12 }} numberOfLines={2}>
                      {item.description || 'No description provided.'}
                    </Typography>
                  </View>
                </View>

                <View style={styles.incMetaRow}>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color={colors.green} />
                    <Typography variant="body" color={colors.textMuted} style={{ fontSize: 11, marginLeft: 4 }}>
                      {item.district || 'City District'}
                    </Typography>
                  </View>
                  <View style={styles.metaItem}>
                    <Activity size={12} color={sevColor} />
                    <Typography variant="body" color={colors.textMuted} style={{ fontSize: 11, marginLeft: 4 }}>
                      {(item.status || 'REPORTED').toUpperCase()}
                    </Typography>
                  </View>
                </View>

                <View style={styles.incTags}>
                  <SeverityBadge severity={getSeverity(item.severity)} />
                  <View style={styles.tagPill}>
                    <Typography variant="mono" style={{ fontSize: 10, color: colors.textDim }}>
                      {item.sourceLabel || item.sourceType || 'LIVE FEED'}
                    </Typography>
                  </View>
                  <View style={styles.tagPill}>
                    <Typography variant="mono" style={{ fontSize: 10, color: colors.textDim }}>
                      {item.department || item.assignedDepartments?.[0] || 'UNASSIGNED'}
                    </Typography>
                  </View>
                </View>

                <View style={styles.incActions}>
                  <View style={styles.btnPrimary}>
                    <Navigation size={14} color={isDark ? '#000' : '#FFF'} />
                    <Typography variant="heading" style={{ fontSize: 13, color: isDark ? '#000' : '#FFF', marginLeft: 6 }}>
                      View Details
                    </Typography>
                  </View>
                </View>
                
              </TouchableOpacity>
            </Link>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', paddingTop: 48 }}>
              <Typography variant="body" style={styles.empty}>
                {activeFilter === 'All' ? 'No incidents — seed backend first.' : `No "${activeFilter}" incidents.`}
              </Typography>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bg 
  },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border2,
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
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border2,
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
    backgroundColor: colors.surface2,
  },
  sfActive: {
    backgroundColor: colors.greenDim,
    borderColor: colors.greenGlow,
  },
  incCard: {
    backgroundColor: colors.surface2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.15 : 0.05,
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
    backgroundColor: colors.surface3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.green,
    paddingVertical: 12,
    borderRadius: 12,
  },
  empty: { 
    color: colors.textMuted, 
    textAlign: 'center', 
    marginTop: 32 
  },
});
