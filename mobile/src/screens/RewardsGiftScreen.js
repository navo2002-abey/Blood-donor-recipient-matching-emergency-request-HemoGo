import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BloodDrop } from '../components/Logo';
import { colors } from '../utils/colors';

const POINTS_KEY = '@donor_points';
const REDEEMED_KEY = '@redeemed_rewards';

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

const RewardsGiftScreen = () => {
  const [points, setPoints] = useState(0);
  const [redeemed, setRedeemed] = useState([]);

  const loadRewards = async () => {
    try {
      const storedPoints = await AsyncStorage.getItem(POINTS_KEY);
      const totalPoints = storedPoints ? parseInt(storedPoints) : 0;
      setPoints(totalPoints);

      const storedRedeemed = await AsyncStorage.getItem(REDEEMED_KEY);
      const redeemedList = storedRedeemed ? JSON.parse(storedRedeemed) : [];
      setRedeemed(redeemedList);
    } catch (error) {
      console.error('Failed to load rewards:', error);
    }
  };

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
            try {
              const newPoints = points - reward.points;
              await AsyncStorage.setItem(POINTS_KEY, JSON.stringify(newPoints));
              setPoints(newPoints);

              const newRedeemed = [...redeemed, reward.id];
              await AsyncStorage.setItem(REDEEMED_KEY, JSON.stringify(newRedeemed));
              setRedeemed(newRedeemed);

              Alert.alert('Success!', `You have redeemed ${reward.title}. Check your email for details.`);
            } catch (error) {
              console.error('Failed to redeem reward:', error);
              Alert.alert('Error', 'Failed to redeem reward. Please try again.');
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={16} color={colors.white} />
          <Text style={styles.pointsBadgeText}>{points} pts</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Redeem Rewards</Text>
        <Text style={styles.subtitle}>Use your points to claim exclusive rewards</Text>

        {rewards.map((reward) => {
          const isRedeemed = redeemed.includes(reward.id);
          const canRedeem = points >= reward.points && !isRedeemed;

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
                  disabled={!canRedeem}
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
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
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
    marginBottom: 20,
  },
  rewardCard: {
    backgroundColor: colors.white,
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
