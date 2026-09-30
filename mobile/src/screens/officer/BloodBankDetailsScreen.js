import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bloodBankService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const BloodBankDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await bloodBankService.get(id);
        setBank(data.bloodBank);
      } catch (e) {
        Alert.alert('Error', 'Failed to load blood bank.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigation]);

  const call = () => {
    if (bank?.contact) Linking.openURL(`tel:${bank.contact.replace(/\s/g, '')}`);
  };

  if (loading || !bank) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blood Bank Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.name}>{bank.name}</Text>
        {bank.verified && (
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.verifiedText}>Verified Facility</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.textMuted} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>ADDRESS</Text>
              <Text style={styles.infoValue}>{bank.address}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.textMuted} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>OPERATING HOURS</Text>
              <Text style={styles.infoValue}>{bank.operatingHours}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.textMuted} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>CONTACT NUMBER</Text>
              <Text style={styles.infoValue}>{bank.contact}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detailed Blood Stock</Text>
        <Text style={styles.updatedText}>UPDATED 5M AGO</Text>

        <View style={styles.stockGrid}>
          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => {
            const count = bank.stock?.[g] || 0;
            return (
              <View key={g} style={styles.stockCell}>
                <Text style={styles.stockLabel}>{g}</Text>
                <Text style={styles.stockValue}>{count}</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.callBtn} onPress={call}>
          <Ionicons name="call" size={18} color={colors.white} />
          <Text style={styles.callText}>Call Hospital</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  verifiedRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6 },
  verifiedText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  infoBox: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginTop: 16, borderWidth: 1, borderColor: colors.cardBorder, gap: 14 },
  infoRow: { flexDirection: 'row' },
  infoLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '600', marginTop: 3, lineHeight: 19 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 22, marginBottom: 4 },
  updatedText: { fontSize: 10, color: colors.textMuted, fontWeight: '700', marginBottom: 12 },
  stockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stockCell: { width: '22%', minWidth: 68, flexGrow: 1, backgroundColor: colors.white, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  stockLabel: { fontSize: 12, fontWeight: '800', color: colors.text },
  stockValue: { fontSize: 18, fontWeight: '800', color: colors.primary, marginTop: 2 },
  callBtn: { flexDirection: 'row', gap: 8, height: 54, borderRadius: 27, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  callText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});

export default BloodBankDetailsScreen;