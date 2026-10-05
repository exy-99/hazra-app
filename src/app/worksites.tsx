import { router, useFocusEffect } from 'expo-router';
import { Building2, Plus } from 'lucide-react-native';
import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Radius, Spacing, Type } from '@/constants/theme';
import type { Worksite } from '@/db/types';
import { listWorkers } from '@/db/workers';
import { listWorksites } from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';

const WorksiteRow = memo(function WorksiteRow({
  site,
  count,
  onPress,
}: {
  site: Worksite;
  count: number;
  onPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={`Edit ${site.name}`}
      android_ripple={{ color: theme.muted }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Text style={[styles.name, { color: theme.foreground }]}>{site.name}</Text>
      <Text style={[styles.meta, { color: theme.mutedForeground }]}>
        {site.address ? `${site.type} · ${site.address}` : site.type}
      </Text>
      <Text style={[styles.count, { color: theme.mutedForeground }]}>
        {`${count} worker${count === 1 ? '' : 's'}`}
      </Text>
    </Pressable>
  );
});

function AddWorksiteButton({ onPress }: { onPress: () => void }): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add worksite"
      android_ripple={{ color: theme.onAccent }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Plus size={20} color={theme.onAccent} />
      <Text style={[styles.ctaLabel, { color: theme.onAccent }]}>+ Add worksite</Text>
    </Pressable>
  );
}

export default function WorksitesScreen() {
  const theme = useTheme();
  const [sites, setSites] = useState<Worksite[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const rows = await listWorksites();
      const entries = await Promise.all(
        rows.map(async (site) => {
          const workers = await listWorkers({ worksiteId: site.id });
          return [site.id, workers.length] as const;
        }),
      );
      setSites(rows);
      setCounts(Object.fromEntries(entries));
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  function goToAdd() {
    router.push('/worksite-form');
  }

  function goToEdit(id: string) {
    router.push({ pathname: '/worksite-form', params: { id } });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.title, { color: theme.foreground }]}>Worksites</Text>
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Loading worksites"
            color={theme.primary}
            style={styles.loader}
          />
        ) : sites.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Building2}
              title="No worksites yet"
              actionLabel="Add worksite"
              onAction={goToAdd}
            />
          </View>
        ) : (
          <View style={styles.listWrap}>
            <FlatList
              data={sites}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <WorksiteRow
                  site={item}
                  count={counts[item.id] ?? 0}
                  onPress={() => goToEdit(item.id)}
                />
              )}
            />
            <View style={styles.footer}>
              <AddWorksiteButton onPress={goToAdd} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: 800,
  },
  title: {
    ...Type.h1,
    paddingHorizontal: Spacing.three,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  footer: {
    padding: Spacing.three,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  ctaLabel: {
    ...Type.label,
    textAlign: 'center',
  },
  card: {
    minHeight: 44,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  name: {
    ...Type.body,
    fontWeight: '600',
  },
  meta: {
    ...Type.caption,
  },
  count: {
    ...Type.caption,
    fontVariant: ['tabular-nums'],
  },
});
