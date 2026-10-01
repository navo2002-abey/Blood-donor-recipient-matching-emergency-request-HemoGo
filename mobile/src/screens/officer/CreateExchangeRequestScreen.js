import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { stockService, transferService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { digitsOnly } from '../../utils/numbers';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const URGENCIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const CreateExchangeRequestScreen = ({ navigation }) => {
  const { user } = useAuth();
  const myHospital = user?.hospital || 'Colombo General Hospital Blood Bank';

  const [bloodGroup, setBloodGroup] = useState('');
  const [units, setUnits] = useState('1');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [reason, setReason] = useState('');

  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [searched, setSearched] = useState(false);

  const [saving, setSaving] = useState(false);

  // Reset bank list when blood group changes
  useEffect(() => {
    setBanks([]);
    setSelectedBank(null);
    setSearched(false);
  }, [bloodGroup]);

  const handleFindBanks = async () => {
    if (!bloodGroup) {
      return Alert.alert('Missing', 'Select a blood group first.');
    }
    try {
      setLoadingBanks(true);
      setSearched(true);
      const { data } = await stockService.banksWithBlood(bloodGroup, myHospital);
      setBanks(data.banks || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load banks.');
    } finally {
      setLoadingBanks(false);
    }
  };

    const handleSend = async () => {
    if (!bloodGroup) return Alert.alert('Missing', 'Select blood group.');
    if (!selectedBank) return Alert.alert('Missing', 'Select a source bank.');
    if (!units || Number(units) <= 0)
        return Alert.alert('Invalid', 'Enter a valid number of units.');
    if (Number(units) > selectedBank.totalUnits)
        return Alert.alert(
        'Too many units',
        `Only ${selectedBank.totalUnits} units available at ${selectedBank.hospital}.`
        );

    try {
        setSaving(true);
        await transferService.create({
        bloodGroup,
        units: Number(units),
        sourceBank: selectedBank.hospital,
        destinationHospital: myHospital,
        reason: reason.trim() || `${bloodGroup} needed at ${myHospital}`,
        urgency,
        status: 'PENDING',
        });

        // ✅ Go to confirmation screen
        navigation.replace('TransferConfirmation', {
        bloodGroup,
        quantity: Number(units),
        sourceHospital: selectedBank.hospital,
        destinationHospital: myHospital,
        urgency,
        });
    } catch (e) {
        Alert.alert('Error', e?.response?.data?.message || 'Failed to send.');
    } finally {
        setSaving(false);
    }
    };

  const daysLeft = (date) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Exchange Request</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Your bank */}
          <View style={styles.myBankCard}>
            <View style={styles.myBankIcon}>
              <Ionicons name="business" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.myBankLabel}>REQUESTING FOR</Text>
              <Text style={styles.myBankName} numberOfLines={1}>
                {myHospital}
              </Text>
            </View>
          </View>

          {/* Step 1 — Blood group */}
          <Text style={styles.stepLabel}>STEP 1 · WHAT BLOOD DO YOU NEED?</Text>
          <View style={styles.chipRow}>
            {GROUPS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, bloodGroup === g && styles.chipActive]}
                onPress={() => setBloodGroup(g)}
              >
                <Text
                  style={[styles.chipText, bloodGroup === g && styles.chipTextActive]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Units + urgency */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>UNITS NEEDED</Text>
              <TextInput
                style={styles.input}
                value={units}
                onChangeText={(t) => setUnits(digitsOnly(t))}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={4}
                placeholder="1"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.label}>URGENCY</Text>
              <View style={styles.chipRowSmall}>
                {URGENCIES.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.smallChip,
                      urgency === u && styles.smallChipActive,
                    ]}
                    onPress={() => setUrgency(u)}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        urgency === u && styles.smallChipTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Step 2 — Find banks */}
          <Text style={styles.stepLabel}>STEP 2 · FIND A SOURCE BANK</Text>
          <TouchableOpacity
            style={[
              styles.findBtn,
              (!bloodGroup || loadingBanks) && styles.disabled,
            ]}
            onPress={handleFindBanks}
            disabled={!bloodGroup || loadingBanks}
          >
            {loadingBanks ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="search" size={18} color={colors.white} />
                <Text style={styles.findBtnText}>
                  Search banks with {bloodGroup || '...'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Bank results */}
          {searched && !loadingBanks ? (
            banks.length === 0 ? (
              <View style={styles.emptyBanks}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.primary} />
                <Text style={styles.emptyBanksTitle}>
                  No banks have {bloodGroup} available
                </Text>
                <Text style={styles.emptyBanksSub}>
                  Try another blood group or check again later.
                </Text>
              </View>
            ) : (
              banks.map((b) => {
                const selected = selectedBank?.hospital === b.hospital;
                return (
                  <TouchableOpacity
                    key={b.hospital}
                    style={[styles.bankCard, selected && styles.bankCardActive]}
                    onPress={() => setSelectedBank(b)}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        selected && styles.radioOuterActive,
                      ]}
                    >
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankName} numberOfLines={2}>
                        {b.hospital}
                      </Text>
                      <View style={styles.bankMetaRow}>
                        <View style={styles.bankMeta}>
                          <Ionicons name="water" size={12} color={colors.primary} />
                          <Text style={styles.bankMetaText}>
                            {b.totalUnits} units
                          </Text>
                        </View>
                        {b.earliestExpiry ? (
                          <View style={styles.bankMeta}>
                            <Ionicons
                              name="hourglass-outline"
                              size={12}
                              color={colors.textMuted}
                            />
                            <Text style={styles.bankMetaText}>
                              {daysLeft(b.earliestExpiry)}d left
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )
          ) : null}

          {/* Step 3 — Reason */}
          {selectedBank ? (
            <>
              <Text style={styles.stepLabel}>STEP 3 · REASON (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={reason}
                onChangeText={setReason}
                placeholder={`e.g. ${bloodGroup} needed urgently for surgery`}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
              />

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Request Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Blood</Text>
                  <Text style={styles.summaryValue}>
                    {bloodGroup} × {units} unit{Number(units) > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>From</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {selectedBank.hospital}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>To</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {myHospital}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Urgency</Text>
                  <Text style={styles.summaryValue}>{urgency}</Text>
                </View>
              </View>
            </>
          ) : null}

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!selectedBank || saving) && styles.disabled,
            ]}
            onPress={handleSend}
            disabled={!selectedBank || saving}
          >
            <Text style={styles.sendBtnText}>
              {saving ? 'SENDING...' : 'SEND EXCHANGE REQUEST'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 40 },

  myBankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  myBankIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  myBankLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  myBankName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
    marginTop: 2,
  },

  stepLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.4,
    marginBottom: 8,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#F4F4F6',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },

  chipRowSmall: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
  },
  smallChipActive: { backgroundColor: colors.primary },
  smallChipText: { fontSize: 10, fontWeight: '800', color: colors.text },
  smallChipTextActive: { color: colors.white },

  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F4F4F6',
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  textarea: { height: 90, textAlignVertical: 'top', paddingTop: 14 },

  findBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginBottom: 16,
  },
  findBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },

  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  bankCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF8F9',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  bankName: { fontSize: 13, fontWeight: '800', color: colors.text },
  bankMetaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  bankMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bankMetaText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  emptyBanks: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF1F3',
    borderRadius: 14,
    gap: 6,
    marginBottom: 20,
  },
  emptyBanksTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  emptyBanksSub: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  summaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  summaryValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },

  sendBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  sendBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  disabled: { opacity: 0.5 },
});

export default CreateExchangeRequestScreen;