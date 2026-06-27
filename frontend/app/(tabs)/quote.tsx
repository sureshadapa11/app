import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "@/src/api";
import { C, S, R, SHADOW } from "@/src/theme";
import { Eyebrow, Btn, Field } from "@/src/components/ui";
import { BIZ, SERVICES } from "@/src/brand";

const SERVICE_NAMES = SERVICES.map((s) => s.title);

export default function Quote() {
  const insets = useSafeAreaInsets();

  // Enquiry form
  const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  // AI estimate
  const [estService, setEstService] = useState(SERVICE_NAMES[0]);
  const [area, setArea] = useState("");
  const [material, setMaterial] = useState("");
  const [estLoading, setEstLoading] = useState(false);
  const [estimate, setEstimate] = useState("");

  const call = (num: string) => Linking.openURL(`tel:${num.replace(/\s/g, "")}`);
  const mail = () => Linking.openURL(`mailto:${BIZ.email}`);

  const submit = async () => {
    setErr("");
    if (!form.name || (!form.phone && !form.email)) {
      setErr("Please add your name and a phone or email so we can reach you.");
      return;
    }
    setSending(true);
    try {
      await api.post("/enquiries", form);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSent(true);
    } catch {
      setErr("Something went wrong. Please call us instead.");
    } finally {
      setSending(false);
    }
  };

  const runEstimate = async () => {
    setEstLoading(true); setEstimate("");
    try {
      const res = await api.post("/ai/paving-estimate", { service: estService, area, material });
      setEstimate(res.estimate);
    } catch {
      setEstimate("Sorry, the estimator is busy right now. Please send an enquiry below and we'll get back to you fast.");
    } finally {
      setEstLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <Eyebrow>Get In Touch</Eyebrow>
        <Text style={styles.title}>Request a Free Quote</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S["3xl"], gap: S.lg }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Contact quick actions */}
          <View style={styles.contactRow}>
            <Pressable testID="quote-call" style={styles.contactBtn} onPress={() => call(BIZ.phone)}>
              <Ionicons name="call" size={20} color={C.brand} />
              <Text style={styles.contactLabel}>Call</Text>
              <Text style={styles.contactVal}>{BIZ.phone}</Text>
            </Pressable>
            <Pressable testID="quote-mobile" style={styles.contactBtn} onPress={() => call(BIZ.mobile)}>
              <Ionicons name="phone-portrait" size={20} color={C.brand} />
              <Text style={styles.contactLabel}>Mobile</Text>
              <Text style={styles.contactVal}>{BIZ.mobile}</Text>
            </Pressable>
          </View>
          <Pressable testID="quote-email" style={styles.emailBtn} onPress={mail}>
            <Ionicons name="mail" size={18} color={C.ink} />
            <Text style={styles.emailText}>{BIZ.email}</Text>
          </Pressable>
          <View style={styles.hoursRow}>
            <Ionicons name="time" size={15} color={C.muted} />
            <Text style={styles.hoursText}>{BIZ.hours}  ·  Free site survey</Text>
          </View>

          {/* AI Instant Estimate */}
          <View style={styles.aiCard}>
            <View style={styles.aiHead}>
              <Ionicons name="sparkles" size={18} color={C.brand} />
              <Text style={styles.aiTitle}>Instant AI Estimate</Text>
            </View>
            <Text style={styles.aiSub}>Get a ballpark price in seconds. Final price confirmed at your free survey.</Text>

            <Text style={styles.pickLabel}>SERVICE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm, paddingVertical: 4 }}>
              {SERVICE_NAMES.map((s) => (
                <Pressable key={s} testID={`est-service-${s}`} onPress={() => setEstService(s)}
                  style={[styles.chip, estService === s && styles.chipActive]}>
                  <Text style={[styles.chipText, estService === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: S.sm, marginTop: S.md }}>
              <Field testID="est-area" value={area} onChangeText={setArea} placeholder="Area e.g. 40 sqm" style={{ flex: 1, marginBottom: 0 }} />
              <Field testID="est-material" value={material} onChangeText={setMaterial} placeholder="Material (optional)" style={{ flex: 1, marginBottom: 0 }} />
            </View>
            <Btn testID="est-run" label="Get Instant Estimate" icon="flash" onPress={runEstimate} loading={estLoading} style={{ marginTop: S.md }} />
            {estLoading && (
              <View style={styles.estLoading}><ActivityIndicator color={C.brand} /><Text style={styles.estLoadingText}>Calculating…</Text></View>
            )}
            {!!estimate && (
              <View testID="est-result" style={styles.estResult}>
                <Text style={styles.estResultText}>{estimate}</Text>
              </View>
            )}
          </View>

          {/* Enquiry form */}
          {sent ? (
            <View testID="enquiry-success" style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={48} color={C.success} />
              <Text style={styles.successTitle}>Thanks, {form.name.split(" ")[0]}!</Text>
              <Text style={styles.successText}>Your enquiry has been received. We'll be in touch very soon to arrange your free site survey.</Text>
              <Btn testID="enquiry-call-now" label={`Call now: ${BIZ.mobile}`} icon="call" variant="dark" onPress={() => call(BIZ.mobile)} style={{ marginTop: S.md }} />
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Send Us a Message</Text>
              <Field label="Your Name" testID="enq-name" value={form.name} onChangeText={(t: string) => setForm({ ...form, name: t })} placeholder="John Smith" />
              <Field label="Phone Number" testID="enq-phone" value={form.phone} onChangeText={(t: string) => setForm({ ...form, phone: t })} keyboardType="phone-pad" placeholder="07..." />
              <Field label="Email Address" testID="enq-email" value={form.email} onChangeText={(t: string) => setForm({ ...form, email: t })} autoCapitalize="none" keyboardType="email-address" placeholder="you@email.com" />
              <Text style={styles.pickLabel}>SERVICE REQUIRED</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm, paddingVertical: 4, marginBottom: S.md }}>
                {SERVICE_NAMES.map((s) => (
                  <Pressable key={s} testID={`enq-service-${s}`} onPress={() => setForm({ ...form, service: s })}
                    style={[styles.chip, form.service === s && styles.chipActive]}>
                    <Text style={[styles.chipText, form.service === s && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Field label="Message" testID="enq-message" value={form.message} onChangeText={(t: string) => setForm({ ...form, message: t })} placeholder="Tell us about your project…" multiline numberOfLines={4} style={{ marginBottom: S.sm }} />
              {!!err && <Text testID="enq-error" style={styles.err}>{err}</Text>}
              <Btn testID="enq-submit" label="Send Enquiry — It's Free" icon="send" onPress={submit} loading={sending} style={{ marginTop: S.sm }} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: S.lg, paddingBottom: S.md, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 28, fontWeight: "900", color: C.ink, letterSpacing: -0.8 },
  contactRow: { flexDirection: "row", gap: S.md },
  contactBtn: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, alignItems: "center", borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  contactLabel: { fontSize: 11, fontWeight: "700", color: C.muted, marginTop: 6 },
  contactVal: { fontSize: 14, fontWeight: "800", color: C.ink, marginTop: 2 },
  emailBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: S.md },
  emailText: { fontSize: 14, fontWeight: "700", color: C.ink },
  hoursRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  hoursText: { fontSize: 13, color: C.muted, fontWeight: "600" },
  aiCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  aiHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiTitle: { fontSize: 18, fontWeight: "900", color: C.ink },
  aiSub: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },
  pickLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: C.inkSoft, marginTop: S.md, marginBottom: 4 },
  chip: { paddingHorizontal: S.md, paddingVertical: 9, borderRadius: R.pill, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, flexShrink: 0 },
  chipActive: { backgroundColor: C.brand, borderColor: C.brand },
  chipText: { fontSize: 12.5, fontWeight: "700", color: C.inkSoft },
  chipTextActive: { color: C.onBrand },
  estLoading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: S.md },
  estLoadingText: { color: C.muted, fontWeight: "600" },
  estResult: { marginTop: S.md, backgroundColor: C.accentSoft, borderRadius: R.md, padding: S.md },
  estResultText: { fontSize: 14, color: C.ink, lineHeight: 22 },
  formCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  formTitle: { fontSize: 18, fontWeight: "900", color: C.ink, marginBottom: S.md },
  err: { color: C.error, fontWeight: "700", fontSize: 13, marginTop: 4 },
  successCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.xl, alignItems: "center", borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  successTitle: { fontSize: 22, fontWeight: "900", color: C.ink, marginTop: S.md },
  successText: { fontSize: 14, color: C.muted, textAlign: "center", marginTop: S.sm, lineHeight: 21 },
});
