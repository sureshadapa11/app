import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R, SHADOW } from "@/src/theme";
import { Eyebrow, Btn } from "@/src/components/ui";
import { SERVICES } from "@/src/brand";

export default function Services() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <Eyebrow>What We Offer</Eyebrow>
        <Text style={styles.title}>Our Services</Text>
        <Text style={styles.sub}>Quality workmanship across every type of paving — all backed by our 10-year guarantee.</Text>
      </View>
      <FlatList
        data={SERVICES}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: S.md, paddingHorizontal: S.lg }}
        contentContainerStyle={{ paddingTop: S.md, paddingBottom: S["3xl"], gap: S.md }}
        renderItem={({ item }) => (
          <Pressable testID={`service-${item.id}`} style={styles.card} onPress={() => router.push("/(tabs)/quote")}>
            <View style={styles.icon}><Ionicons name={item.icon as any} size={24} color={C.brand} /></View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={{ paddingHorizontal: S.lg, paddingTop: S.xl }}>
            <View style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Not sure which option suits you?</Text>
              <Text style={styles.ctaSub}>Get a free site survey and honest advice — no pressure, no obligation.</Text>
              <Btn testID="services-quote-btn" label="Get a Free Quote" icon="calculator" onPress={() => router.push("/(tabs)/quote")} style={{ marginTop: S.md }} />
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: S.lg, paddingBottom: S.md, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 30, fontWeight: "900", color: C.ink, letterSpacing: -0.8 },
  sub: { fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 20 },
  card: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  icon: { width: 50, height: 50, borderRadius: R.md, backgroundColor: C.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: S.md },
  cardTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  cardDesc: { fontSize: 12.5, color: C.muted, marginTop: 6, lineHeight: 17 },
  ctaCard: { backgroundColor: C.ink, borderRadius: R.xl, padding: S.xl },
  ctaTitle: { fontSize: 19, fontWeight: "900", color: C.surface, letterSpacing: -0.3 },
  ctaSub: { fontSize: 13.5, color: "rgba(255,255,255,0.72)", marginTop: 8, lineHeight: 20 },
});
