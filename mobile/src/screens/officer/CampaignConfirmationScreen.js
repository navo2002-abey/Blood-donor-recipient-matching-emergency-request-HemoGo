import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { colors } from '../../utils/colors';

const CampaignConfirmationScreen = ({ route, navigation }) => {
  const mode = route?.params?.mode || 'created';
  const campaign = route?.params?.campaign || null;

  const isEdit = mode === 'updated';
  const groups = campaign?.targetBloodGroups || [];
  const venueName = campaign?.venue?.name || 'Venue';
  const venueType = campaign?.venue?.type;

  const handleViewAll = () => {
    navigation.replace('CampaignList');
  };

  const handleCreateAnother = () => {
    navigation.replace('OrganizeDrive');
  };

  if (!campaign) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader navigation={navigation} showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Campaign not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader navigation={navigation} showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Success graphic */}
        <View style={styles.graphicContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Ionicons
                name={isEdit ? 'checkmark-done' : 'checkmark'}
                size={40}
                color={colors.white}
              />
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          {isEdit ? 'Campaign Updated!' : 'Campaign Published!'}
        </Text>
        <Text style={styles.subtitle}>
          {isEdit
            ? 'Your changes have been saved.'
            : 'Your donation drive is now live.'}
        </Text>

        {/* Status pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            STATUS: {campaign.status || 'PUBLISHED'}
          </Text>
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>CAMPAIGN SUMMARY</Text>

          <View style={styles.summaryRow}>
            <View style={styles.iconBox}>
              <Ionicons name="megaphone" size={16} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>NAME</Text>
              <Text style={styles.rowValue}>{campaign.name}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.iconBox}>
              <Ionicons name="water" size={16} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>TARGET BLOOD GROUPS</Text>
              <View style={styles.chipRow}>
                {groups.map((g) => (
                  <View key={g} style={styles.chip}>
                    <Text style={styles.chipText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.iconBox}>
              <Ionicons name="calendar" size={16} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>PREFERRED DATE</Text>
              <Text style={styles.rowValue}>
                {new Date(campaign.preferredDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryRow, { marginBottom: 0 }]}>
            <View style={styles.iconBox}>
              <Ionicons
                name={venueType === 'HOSPITAL' ? 'business' : 'location'}
                size={16}
                color={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>
                {venueType === 'HOSPITAL' ? 'HOSPITAL' : 'EXTERNAL VENUE'}
              </Text>
              <Text style={styles.rowValue}>{venueName}</Text>
              {campaign.venue?.address ? (
                <Text style={styles.rowSub}>{campaign.venue.address}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Hint about management */}
        <View style={styles.hintBox}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.hintText}>
            To edit or delete this campaign, open it from{' '}
            <Text style={styles.hintBold}>Donation Campaigns</Text> in the menu.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom actions — solid background */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewAll}>
          <Ionicons name="list-outline" size={16} color={colors.white} />
          <Text style={styles.primaryBtnText}>VIEW ALL CAMPAIGNS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleCreateAnother}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>CREATE ANOTHER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 180,
    alignItems: 'center',
  },

  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
    height: 140,
  },
  outerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginRight: 8,
  },
  statusText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  summaryCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
  },
  summaryHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    paddingTop: 2,
  },
  rowLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  rowSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFF1F3',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  /* Hint box */
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    width: '100%',
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  hintBold: {
    fontWeight: '800',
    color: colors.text,
  },

  /* Solid bottom bar — no transparency */
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

export default CampaignConfirmationScreen;