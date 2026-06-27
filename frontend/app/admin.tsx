import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking, KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api";
import { C, S, R, SHADOW } from "@/src/theme";
import { Btn, Field, Logo } from "@/src/components/ui";

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - d) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Admin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading, login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try { setItems(await api.get("/enquiries")); } catch {}
  }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doLogin = async () => {
    setErr("");
    if (!email || !password) { setErr("Enter email and password"); return; }
    setBusy(true);
    try { await login(email.trim(), password); } catch (e: any) { setErr(e.message || "Login failed"); } finally { setBusy(false); }
  };

  const setStatus = async (id: string, status: string) => {
    setItems((p) => p.map((e) => (e.id === id ? { ...e, status } : e)));
    await api.put(`/enquiries/${id}/status?status=${status}`);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.brand} /></View>;
  }

  // ---- Login view ----
  if (!user) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + S["2xl"], paddingHorizontal: S.xl, paddingBottom: S["3xl"] }} keyboardShouldPersistTaps="handled">
          <Pressable testID="admin-back" onPress={() => router.replace("/(tabs)")} style={styles.backLink}>
            <Ionicons name="arrow-back" size={18} color={C.inkSoft} />
            <Text style={styles.backText}>Back to site</Text>
          </Pressable>
          <View style={{ alignItems: "center", marginVertical: S.xl }}><Logo size={56} /></View>
          <Text style={styles.loginTitle}>Staff Login</Text>
          <Text style={styles.loginSub}>View and manage customer enquiries.</Text>
          <Field label="Email" testID="admin-email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@tbpaving.co.uk" style={{ marginTop: S.lg }} />
          <Field label="Password" testID="admin-password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          {!!err && <Text testID="admin-error" style={styles.err}>{err}</Text>}
          <Btn testID="admin-login-btn" label="Log In" onPress={doLogin} loading={busy} style={{ marginTop: S.sm }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ---- Enquiries dashboard ----
  const newCount = items.filter((e) => e.status === "new").length;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <View>
          <Text style={styles.hTitle}>Enquiries</Text>
          <Text style={styles.hSub}>{newCount} new · {items.length} total</Text>
        </View>
        <Pressable testID="admin-logout" onPress={logout} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={22} color={C.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S["3xl"], gap: S.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.brand} />}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={48} color={C.muted} />
            <Text style={styles.emptyText}>No enquiries yet. They'll appear here the moment a customer submits the quote form.</Text>
          </View>
        ) : items.map((e) => (
          <View key={e.id} testID={`enq-${e.id}`} style={[styles.card, e.status === "new" && styles.cardNew]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{e.name}</Text>
                {!!e.service && <Text style={styles.service}>{e.service}</Text>}
              </View>
              <View style={[styles.badge, { backgroundColor: e.status === "new" ? C.brand : e.status === "contacted" ? C.success : C.muted }]}>
                <Text style={styles.badgeText}>{(e.status || "new").toUpperCase()}</Text>
              </View>
            </View>
            {!!e.message && <Text style={styles.message}>{e.message}</Text>}
            <Text style={styles.time}>{timeAgo(e.created_at)}</Text>
            <View style={styles.actions}>
              {!!e.phone && (
                <Pressable testID={`call-${e.id}`} style={styles.action} onPress={() => Linking.openURL(`tel:${e.phone}`)}>
                  <Ionicons name="call" size={16} color={C.brand} /><Text style={styles.actionText}>Call</Text>
                </Pressable>
              )}
              {!!e.email && (
                <Pressable testID={`email-${e.id}`} style={styles.action} onPress={() => Linking.openURL(`mailto:${e.email}`)}>
                  <Ionicons name="mail" size={16} color={C.brand} /><Text style={styles.actionText}>Email</Text>
                </Pressable>
              )}
              <Pressable testID={`done-${e.id}`} style={styles.action}
                onPress={() => setStatus(e.id, e.status === "contacted" ? "new" : "contacted")}>
                <Ionicons name={e.status === "contacted" ? "refresh" : "checkmark-done"} size={16} color={C.brand} />
                <Text style={styles.actionText}>{e.status === "contacted" ? "Reopen" : "Mark Done"}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: C.inkSoft, fontWeight: "600" },
  loginTitle: { fontSize: 26, fontWeight: "900", color: C.ink, textAlign: "center" },
  loginSub: { fontSize: 14, color: C.muted, textAlign: "center", marginTop: 4 },
  err: { color: C.error, fontWeight: "700", fontSize: 13, marginBottom: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: S.lg, paddingBottom: S.md, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  hTitle: { fontSize: 26, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  hSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: C.surfaceAlt },
  empty: { alignItems: "center", paddingTop: S["3xl"], paddingHorizontal: S.lg },
  emptyText: { fontSize: 14, color: C.muted, textAlign: "center", marginTop: S.md, lineHeight: 20 },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  cardNew: { borderColor: C.brand, borderWidth: 1.5 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: S.sm },
  name: { fontSize: 16, fontWeight: "800", color: C.ink },
  service: { fontSize: 13, color: C.brand, fontWeight: "700", marginTop: 2 },
  badge: { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.pill },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  message: { fontSize: 14, color: C.inkSoft, marginTop: S.sm, lineHeight: 20 },
  time: { fontSize: 11, color: C.muted, marginTop: S.sm },
  actions: { flexDirection: "row", gap: S.sm, marginTop: S.md, borderTopWidth: 1, borderTopColor: C.border, paddingTop: S.md },
  action: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.accentSoft, paddingHorizontal: S.md, paddingVertical: 8, borderRadius: R.pill },
  actionText: { fontSize: 12.5, fontWeight: "700", color: C.ink },
});
