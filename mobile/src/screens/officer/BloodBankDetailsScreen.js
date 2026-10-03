import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useMemo } from 'react';
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
import AppHeader from '../../components/AppHeader';
import BloodBanksMap from '../../components/BloodBanksMap';
import { useUserLocation } from '../../hooks/useUserLocation';
import { bloodBankService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import {
  groupsWithStock,
  normalizeStock,
  totalUnits,
} from '../../utils/stockHelpers';
import { useTheme } from '../../context/ThemeContext';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const pseudoDistance = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const km = (Math.abs(hash) % 80) / 10 + 0.8;
  return km.toFixed(1);
};

const BloodBankDetailsScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = route.params;
  const { location } = useUserLocation();

  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await bloodBankService.get(id);
        setBank({
          ...data.bloodBank,
          stock: normalizeStock(data.bloodBank?.stock),
        });
      } catch (e) {
        console.error('Load bank error:', e?.response?.data || e.message);
        Alert.alert('Error', 'Failed to load blood bank.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigation]);

  const call = () => {
    if (bank?.contact) {
      Linking.openURL(`tel:${bank.contact.replace(/\s/g, '')}`);
    }
  };

  const onRequestBlood = () => {
    navigation.navigate('CreateExchangeRequest', {
      preselectedBank: bank?.name,
    });
  };

  if (loading || !bank) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader navigation={navigation} showBack />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const stock = bank.stock || {};
  const total = totalUnits(stock);
  const available = groupsWithStock(stock);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader navigation={navigation} showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* REAL MAP BANNER */}
        <View style={styles.mapBanner}>
          <BloodBanksMap
            location={location}
            banks={[
              {
                name: bank.name,
                location: bank.location || {},
              },
            ]}
            interactive
          />
          <View style={styles.distancePillCenter}>
            <Ionicons
              name="location"
              size={12}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.distancePillText}>
              {pseudoDistance(bank.name)} km away
            </Text>
          </View>
        </View>

        {/* Title + verified */}
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.hospitalName}>{bank.name}</Text>
            {bank.verified && (
              <View style={styles.verifiedRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.verifiedText}>Verified Facility</Text>
              </View>
            )}
          </View>
          <View style={styles.iconBoxLg}>
            <Ionicons name="business" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="location" size={14} color={colors.textMuted} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>ADDRESS</Text>
              <Text style={styles.infoValue}>{bank.address}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="time" size={14} color={colors.textMuted} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>OPERATING HOURS</Text>
              <Text style={styles.infoValue}>{bank.operatingHours}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="call" size={14} color={colors.textMuted} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>CONTACT NUMBER</Text>
              <Text style={styles.infoValue}>{bank.contact}</Text>
            </View>
          </View>
        </View>

        {/* Summary pills */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Ionicons name="water" size={14} color={colors.primary} />
            <Text style={styles.summaryValue}>{total}</Text>
            <Text style={styles.summaryLabel}>Total units</Text>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.success}
            />
            <Text style={styles.summaryValue}>{available.length}</Text>
            <Text style={styles.summaryLabel}>Groups in stock</Text>
          </View>
        </View>

        {/* Detailed stock */}
        <View style={styles.stockSectionHeader}>
          <Text style={styles.stockTitle}>Detailed Blood Stock</Text>
          <Text style={styles.updatedText}>UPDATED JUST NOW</Text>
        </View>

        <View style={styles.stockCard}>
          <View style={styles.stockGrid}>
            {GROUPS.map((g) => {
              const count = stock[g] || 0;
              const isLow = count > 0 && count <= 3;
              return (
                <View key={g} style={styles.stockCell}>
                  <Text style={styles.stockType}>{g}</Text>
                  <Text
                    style={[
                      styles.stockCount,
                      count === 0 && { color: colors.textMuted },
                      isLow && { color: '#D97706' },
                    ]}
                  >
                    {count}
                  </Text>
                  {isLow ? <Text style={styles.lowBadge}>LOW</Text> : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Available for transfer */}
        {available.length > 0 ? (
          <View style={styles.availableBox}>
            <Text style={styles.availableTitle}>AVAILABLE FOR TRANSFER</Text>
            <View style={styles.availableChips}>
              {available.map((g) => (
                <View key={g} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {g} · {stock[g]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.textMuted}
            />
            <Text style={styles.emptyBoxText}>
              No stock available at this bank right now.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={call}>
          <Ionicons name="call" size={16} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={onRequestBlood}>
          <Ionicons name="swap-horizontal" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>Request Blood</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cardBg },
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },

  mapBanner: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#E8EEF3',
  },
  distancePillCenter: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  distancePillText: { fontSize: 12, fontWeight: '800', color: colors.text },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titleCol: { flex: 1, paddingRight: 10 },
  hospitalName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 28,
  },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  verifiedText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 6,
  },
  iconBoxLg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCard: {
    backgroundColor: colors.page,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', marginBottom: 16 },
  infoIconWrap: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 2,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  stockSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  updatedText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  stockCard: {
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.cardBg,
  },
  stockGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  stockCell: { alignItems: 'center', flex: 1 },
  stockType: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  stockCount: { fontSize: 13, fontWeight: '800', color: colors.text },
  lowBadge: {
    fontSize: 7,
    fontWeight: '900',
    color: '#D97706',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  availableBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  availableTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  availableChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },

  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.page,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  emptyBoxText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    width: 100,
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 6,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default BloodBankDetailsScreen;