import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { getDonorProfile, getRedemptions, redeemReward } from '../services/api';
import { colors } from '../utils/colors';

const rewards = [
  {
    id: 1,
    title: 'Free Health Check Up',
    points: 1000,
    icon: 'medkit-outline',
    color: '#FF6B6B',
    description: 'Comprehensive health checkup at partner hospitals',
  },
  {
    id: 2,
    title: 'Coffee Voucher',
    points: 750,
    icon: 'cafe-outline',
    color: '#FFA500',
    description: 'Free coffee at participating cafes',
  },
  {
    id: 3,
    title: 'HemoGo T-Shirt',
    points: 500,
    icon: 'shirt-outline',
    color: '#4ECDC4',
    description: 'Exclusive HemoGo branded t-shirt',
  },
  {
    id: 4,
    title: 'HemoGo Mug',
    points: 250,
    icon: 'gift-outline',
    color: '#9333EA',
    description: 'Ceramic HemoGo coffee mug',
  },
];

const RewardsGiftScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { hasUnread } = useNotifications();
  const [points, setPoints] = useState(0);
  const [redeemed, setRedeemed] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRewards = async () => {
    try {
      const profileResponse = await getDonorProfile();
      setPoints(profileResponse.data.points || 0);

      const redemptionsResponse = await getRedemptions();
      const redeemedIds = redemptionsResponse.data.map((r) => r.rewardId);
      setRedeemed(redeemedIds);
    } catch (error) {
      console.error('Failed to load rewards:', error);
    }
  };

  // Filter rewards based on points
  const getAvailableRewards = () => {
    if (points < 250) return []; // No rewards if less than 250 points
    if (points < 500) return rewards.filter((r) => r.points <= 250); // Only 250
    if (points < 750) return rewards.filter((r) => r.points <= 500); // 250, 500
    if (points < 1000) return rewards.filter((r) => r.points <= 750); // 250, 500, 750
    return rewards; // All rewards (250, 500, 750, 1000)
  };

  const availableRewards = getAvailableRewards();

  const handleRedeem = async (reward) => {
    if (redeemed.includes(reward.id)) {
      Alert.alert('Already Redeemed', 'You have already redeemed this reward.');
      return;
    }

    if (points < reward.points) {
      Alert.alert('Insufficient Points', `You need ${reward.points} points to redeem this reward.`);
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Redeem ${reward.title} for ${reward.points} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await redeemReward(reward.id);
              setPoints(response.data.points);
              setRedeemed([...redeemed, reward.id]);
              Alert.alert('Success!', `You have redeemed ${reward.title}. Check your email for details.`);
            } catch (error) {
              console.error('Failed to redeem reward:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to redeem reward. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadRewards();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header Bar matching CreateBloodRequestScreen */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (navigation?.canGoBack() ? navigation.goBack() : null)}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.brandContainer}>
          <BloodDrop size={18} />
          <Text style={styles.brandTitle}>HemoGo</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.iconBtn}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {hasUnread ? <View style={styles.bellBadge} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>Redeem Rewards</Text>
            <Text style={styles.subtitle}>Use your points to claim exclusive rewards</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={14} color={colors.white} />
            <Text style={styles.pointsBadgeText}>{points} pts</Text>
          </View>
        </View>

        {availableRewards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Not enough points yet</Text>
            <Text style={styles.emptySubtext}>You need at least 250 points to redeem rewards</Text>
          </View>
        ) : (
          availableRewards.map((reward) => {
            const isRedeemed = redeemed.includes(reward.id);
            const canRedeem = points >= reward.points && !isRedeemed && !loading;

            return (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardHeader}>
                  <View style={[styles.rewardIcon, { backgroundColor: reward.color + '20' }]}>
                    <Ionicons name={reward.icon} size={32} color={reward.color} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  </View>
                </View>
                <View style={styles.rewardFooter}>
                  <View style={styles.pointsContainer}>
                    <Ionicons name="star" size={16} color={colors.primary} />
                    <Text style={styles.pointsText}>{reward.points} points</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      !canRedeem && styles.redeemButtonDisabled,
                      isRedeemed && styles.redeemButtonRedeemed,
                    ]}
                    onPress={() => handleRedeem(reward)}
                    disabled={!canRedeem || loading}
                  >
                    <Text
                      style={[
                        styles.redeemButtonText,
                        (!canRedeem || isRedeemed) && styles.redeemButtonTextDisabled,
                      ]}
                    >
                      {isRedeemed ? 'Redeemed' : points < reward.points ? 'Not Enough' : 'Redeem'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brandTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
    },
    bellBadge: {
      position: 'absolute',
      top: 6,
      right: 7,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: colors.background || colors.white,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
    },
    titleCopy: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    pointsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 2,
    },
    pointsBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.white,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    rewardCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 12,
    },
    rewardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 12,
    },
    rewardIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rewardInfo: {
      flex: 1,
    },
    rewardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    rewardDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    rewardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pointsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    pointsText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    redeemButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    redeemButtonDisabled: {
      backgroundColor: colors.textMuted,
    },
    redeemButtonRedeemed: {
      backgroundColor: colors.success,
    },
    redeemButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.white,
    },
    redeemButtonTextDisabled: {
      color: 'rgba(255, 255, 255, 0.8)',
    },
  });

export default RewardsGiftScreen;
