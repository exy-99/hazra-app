import { router, useFocusEffect } from "expo-router";
import { Building2, Plus, Users } from "lucide-react-native";
import { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { MaxContentWidth, Radius, Spacing, Type } from "@/constants/theme";
import type { Worker, Worksite } from "@/db/types";
import { listWorkers } from "@/db/workers";
import { listWorksites } from "@/db/worksites";
import { useTheme } from "@/hooks/use-theme";

const WorkerRow = memo(function WorkerRow({
  worker,
  siteName,
  onPress,
}: {
  worker: Worker;
  siteName: string;
  onPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={`View ${worker.name} profile`}
      android_ripple={{ color: theme.muted }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.name, { color: theme.foreground }]}>
        {worker.name}
      </Text>
      <Text style={[styles.meta, { color: theme.mutedForeground }]}>
        {`${worker.role ?? "Worker"} · ${siteName}`}
      </Text>
    </Pressable>
  );
});

function AddWorkerButton({
  onPress,
}: {
  onPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add worker"
      android_ripple={{ color: theme.onAccent }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Plus size={20} color={theme.onAccent} />
      <Text style={[styles.ctaLabel, { color: theme.onAccent }]}>
        Add worker
      </Text>
    </Pressable>
  );
}

export default function WorkersScreen() {
  const theme = useTheme();
  const [sites, setSites] = useState<Worksite[]>([]);
  const [siteNames, setSiteNames] = useState<Map<string, string>>(new Map());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Collapse the worksite filter chips when the list scrolls, mirroring
  // the attendance screen header behavior.
  const [scrolledPastTop, setScrolledPastTop] = useState(false);
  const chipsCollapsed = scrolledPastTop;

  function handleListScroll(y: number) {
    const past = y > 8;
    setScrolledPastTop((prev) => (prev === past ? prev : past));
  }

  async function load() {
    setLoadError(false);
    try {
      const [active, all] = await Promise.all([
        listWorksites(),
        listWorksites(true),
      ]);
      const rows = await listWorkers(
        selectedSite ? { worksiteId: selectedSite } : {},
      );
      setSites(active);
      setSiteNames(new Map(all.map((site) => [site.id, site.name] as const)));
      setWorkers(rows);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [selectedSite]),
  );

  function retry() {
    setLoading(true);
    void load();
  }

  function goToAdd() {
    router.push("/worker-form");
  }

  function goToProfile(id: string) {
    router.push({ pathname: "/worker/[id]", params: { id } });
  }

  function goToWorksites() {
    router.push("/worksites");
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.foreground }]}>
            Workers
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage worksites"
            android_ripple={{ color: theme.muted }}
            onPress={goToWorksites}
            style={({ pressed }) => [
              styles.worksitesEntry,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Building2 size={18} color={theme.primary} />
            <Text style={[styles.worksitesLabel, { color: theme.primary }]}>
              Worksites
            </Text>
          </Pressable>
        </View>
        {chipsCollapsed ? null : (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition.duration(200)}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {[{ id: null as string | null, name: "All" }]
                .concat(
                  sites.map((site) => ({
                    id: site.id as string | null,
                    name: site.name,
                  })),
                )
                .map((chip) => {
                  const selected =
                    chip.id === null
                      ? selectedSite === null
                      : selectedSite === chip.id;
                  const label = chip.id === null ? "All" : chip.name;
                  return (
                    <Pressable
                      key={label === "All" ? "__all" : (chip.id as string)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={label}
                      android_ripple={{
                        color: selected ? theme.onPrimary : theme.muted,
                      }}
                      onPress={() => setSelectedSite(chip.id)}
                      style={({ pressed }) => [
                        styles.chip,
                        selected
                          ? {
                              backgroundColor: theme.primary,
                              borderColor: theme.primary,
                            }
                          : {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                            },
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: selected
                              ? theme.onPrimary
                              : theme.foreground,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </Animated.View>
        )}
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Loading workers"
            color={theme.primary}
            style={styles.loader}
          />
        ) : loadError ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Users}
              title="Couldn't load workers"
              actionLabel="Try again"
              onAction={retry}
            />
          </View>
        ) : workers.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Users}
              title="No workers at this worksite"
              actionLabel="Add worker"
              onAction={goToAdd}
            />
          </View>
        ) : (
          <Animated.View
            style={styles.listWrap}
            layout={LinearTransition.duration(200)}
          >
            <FlatList
              data={workers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onScroll={(e) => handleListScroll(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <WorkerRow
                  worker={item}
                  siteName={siteNames.get(item.worksite_id) ?? "—"}
                  onPress={() => goToProfile(item.id)}
                />
              )}
            />
            <View style={styles.footer}>
              <AddWorkerButton onPress={goToAdd} />
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
  },
  title: {
    ...Type.h1,
  },
  worksitesEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    minHeight: 44,
  },
  worksitesLabel: {
    ...Type.label,
  },
  chipRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chip: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  chipText: {
    ...Type.label,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  listWrap: {
    flex: 1,
  },
  footer: {
    padding: Spacing.three,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  ctaLabel: {
    ...Type.label,
    textAlign: "center",
  },
  listContent: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  card: {
    minHeight: 44,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  name: {
    ...Type.body,
    fontWeight: "600",
  },
  meta: {
    ...Type.caption,
  },
});
