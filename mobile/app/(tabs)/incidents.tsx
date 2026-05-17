import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { Search, ChevronDown, Activity, MapPin, Navigation, X, Check } from 'lucide-react-native';
import { Typography } from '../../components/Typography';
import { TopBar } from '../../components/TopBar';
import { SeverityBadge } from '../../components/Badges';
import { useAppTheme } from '../../hooks/useAppTheme';
import { api } from '@/src/lib/api';
import { NotificationPanel } from '../../components/NotificationPanel';
import { useStatus } from '../../contexts/StatusContext';

type IncidentRow = {
  incidentId: string;
  title: string;
  description?: string;
  sourceLabel?: string;
  sourceType?: string;
  severity?: string;
  status?: string;
  assignedDepartments?: string[];
  district?: string;
  createdAt?: string;
  urgencyScore?: number;
};

type SortMode = 'newest' | 'oldest' | 'severity' | 'urgency';

const STATUS_FILTERS = ['All', 'Reported', 'Triaged', 'Assigned', 'In Progress', 'Resolved'];

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'severity', label: 'Highest Severity' },
  { id: 'urgency', label: 'Highest Urgency' },
];

const SEV_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, unknown: 0 };

export default function IncidentsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const { showStatus } = useStatus();

  const [items, setItems] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const sortMenuAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoading(true);
    const sid = showStatus({ type: 'loading', label: 'Loading Feed...', duration: 0 });
    try {
      const data = await api.listIncidents();
      setItems((data.incidents as IncidentRow[]) ?? []);
      showStatus({ id: sid, type: 'connected', label: 'Feed Updated', duration: 2500 });
    } catch {
      showStatus({ id: sid, type: 'error', label: 'Feed Unavailable', duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSortMenu = (open: boolean) => {
    setSortMenuVisible(open);
    Animated.spring(sortMenuAnim, {
      toValue: open ? 1 : 0,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  // ─── Client-side filter + search + sort pipeline ───────────────────────────
  const processed = items
    .filter(item => {
      // Status filter
      if (activeFilter !== 'All') {
        const match = activeFilter.toLowerCase().replace(' ', '_');
        if ((item.status || 'reported').toLowerCase().replace(' ', '_') !== match) return false;
      }
      // Text search across id, title, description
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          item.incidentId,
          item.title,
          item.description,
          item.district,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortMode) {
        case 'newest':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'oldest':
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'severity':
          return (SEV_RANK[b.severity?.toLowerCase() || 'unknown'] ?? 0)
            - (SEV_RANK[a.severity?.toLowerCase() || 'unknown'] ?? 0);
        case 'urgency':
          return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
        default:
          return 0;
      }
    });

  const getSevColor = (sev?: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical') return colors.crit;
    if (s === 'high') return colors.high;
    if (s === 'medium') return colors.med;
    return colors.low;
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.id === sortMode)?.label ?? 'Sort';

  return (
    <View style={styles.container}>
      <TopBar
        title="Incident Feed"
        rightIcon="bell"
        onRightPress={() => setNotifVisible(true)}
      />

      <NotificationPanel visible={notifVisible} onClose={() => setNotifVisible(false)} />

      {/* ─── Controls ─────────────────────────────────────────────────── */}
      <View style={styles.controls}>
        {/* Search Input */}
        <View style={styles.searchRow}>
          <Search size={18} color={searchQuery ? colors.green : colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, title, area..."
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort + Status Filter Row */}
        <View style={styles.filterRow}>
          {/* Sort Button */}
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => toggleSortMenu(true)}
            activeOpacity={0.75}
          >
            <Typography variant="mono" color={colors.textMuted} style={{ fontSize: 11, fontWeight: '700' }}>
              {currentSortLabel}
            </Typography>
            <ChevronDown size={13} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Status Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingRight: 16, gap: 6, flexDirection: 'row' }}
          >
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, activeFilter === f && styles.chipActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Typography
                  variant="mono"
                  style={{ fontSize: 10, fontWeight: '700' }}
                  color={activeFilter === f ? colors.green : colors.textDim}
                >
                  {f.toUpperCase()}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Result count */}
        {searchQuery.length > 0 || activeFilter !== 'All' ? (
          <Typography variant="mono" color={colors.textDim} style={{ fontSize: 10, marginTop: 8, letterSpacing: 0.5 }}>
            {processed.length} RESULT{processed.length !== 1 ? 'S' : ''}
          </Typography>
        ) : null}
      </View>

      {/* ─── List ─────────────────────────────────────────────────────── */}
      <FlatList
        data={processed}
        keyExtractor={item => item.incidentId}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ paddingBottom: 130, paddingTop: 16, paddingHorizontal: 16 }}
        renderItem={({ item }) => {
          const sevColor = getSevColor(item.severity);
          return (
            <Link href={`/incident/${item.incidentId}`} asChild>
              <TouchableOpacity style={styles.incCard} activeOpacity={0.8}>
                <View style={styles.incHeader}>
                  <View style={[styles.incIconBox, { backgroundColor: `${sevColor}15` }]}>
                    <Activity size={22} color={sevColor} />
                  </View>
                  <View style={styles.incTitleArea}>
                    <Typography variant="heading" style={{ fontSize: 15, marginBottom: 2 }} numberOfLines={1}>
                      {item.title || `Incident ${item.incidentId.split('-')[0]}`}
                    </Typography>
                    <Typography variant="body" color={colors.textMuted} style={{ fontSize: 12 }} numberOfLines={2}>
                      {item.description || 'No description.'}
                    </Typography>
                  </View>
                </View>

                <View style={styles.incMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color={colors.green} />
                    <Typography variant="body" color={colors.textMuted} style={{ fontSize: 11, marginLeft: 4 }}>
                      {item.district || 'City District'}
                    </Typography>
                  </View>
                  <View style={styles.metaItem}>
                    <Activity size={12} color={sevColor} />
                    <Typography variant="body" color={colors.textMuted} style={{ fontSize: 11, marginLeft: 4 }}>
                      {(item.status || 'REPORTED').toUpperCase().replace('_', ' ')}
                    </Typography>
                  </View>
                </View>

                <View style={styles.incTags}>
                  <SeverityBadge severity={item.severity || 'low'} />
                  <View style={styles.tagPill}>
                    <Typography variant="mono" style={{ fontSize: 10, color: colors.textDim }}>
                      {(item.sourceType || 'LIVE FEED').toUpperCase().replace('_', ' ')}
                    </Typography>
                  </View>
                  {item.assignedDepartments?.[0] && (
                    <View style={styles.tagPill}>
                      <Typography variant="mono" style={{ fontSize: 10, color: colors.textDim }}>
                        {item.assignedDepartments[0]}
                      </Typography>
                    </View>
                  )}
                </View>

                <View style={styles.incAction}>
                  <Navigation size={13} color={isDark ? '#000' : '#FFF'} />
                  <Typography variant="heading" style={{ fontSize: 13, color: isDark ? '#000' : '#FFF', marginLeft: 6 }}>
                    View Details
                  </Typography>
                </View>
              </TouchableOpacity>
            </Link>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', paddingTop: 56 }}>
              <Typography variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : activeFilter !== 'All'
                  ? `No "${activeFilter}" incidents.`
                  : 'No incidents — seed the backend first.'}
              </Typography>
            </View>
          ) : null
        }
      />

      {/* ─── Sort Menu Modal ──────────────────────────────────────────── */}
      <Modal
        transparent
        visible={sortMenuVisible}
        animationType="none"
        onRequestClose={() => toggleSortMenu(false)}
      >
        <Pressable style={styles.sortBackdrop} onPress={() => toggleSortMenu(false)} />
        <View style={styles.sortMenu}>
          <Typography variant="label" color={colors.textDim} style={{ fontSize: 11, letterSpacing: 1.2, marginBottom: 12 }}>
            SORT BY
          </Typography>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.sortOption, sortMode === opt.id && styles.sortOptionActive]}
              onPress={() => {
                setSortMode(opt.id);
                toggleSortMenu(false);
              }}
            >
              <Typography
                variant="body"
                style={{ fontSize: 15, fontWeight: sortMode === opt.id ? '600' : '400' }}
                color={sortMode === opt.id ? colors.green : colors.text}
              >
                {opt.label}
              </Typography>
              {sortMode === opt.id && <Check size={16} color={colors.green} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    controls: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      padding: 0,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 10,
      paddingVertical: 7,
      paddingHorizontal: 10,
      flexShrink: 0,
    },
    chip: {
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: colors.surface2,
    },
    chipActive: {
      backgroundColor: colors.greenDim,
      borderColor: colors.greenGlow,
    },
    incCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.12 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    incHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    incIconBox: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      flexShrink: 0,
    },
    incTitleArea: { flex: 1 },
    incMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
    incTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    tagPill: {
      backgroundColor: colors.surface2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    incAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.green,
      paddingVertical: 11,
      borderRadius: 12,
    },
    // Sort modal
    sortBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.3)',
    },
    sortMenu: {
      position: 'absolute',
      bottom: 130,
      left: 16,
      right: 16,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 20,
    },
    sortOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sortOptionActive: {
      borderBottomColor: colors.greenGlow,
    },
  });
