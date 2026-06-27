import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, S, R } from "@/src/theme";

export function Sheet({ visible, onClose, title, children, testID }: any) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} testID="sheet-backdrop" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + S.lg }]} testID={testID}>
            <View style={styles.grabber} />
            <View style={styles.handleRow}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} testID="sheet-close" style={styles.close}>
                <Ionicons name="close" size={22} color={C.ink} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(20,15,10,0.55)" },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.lg, paddingTop: S.sm },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: C.border, alignSelf: "center", marginBottom: S.md },
  handleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: S.lg },
  title: { fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: C.surfaceAlt },
});
