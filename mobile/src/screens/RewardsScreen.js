import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BloodDrop } from '../components/Logo';
import { colors } from '../utils/colors';

const POINTS_KEY = '@donor_points';

const RewardsScreen = ({ navigation }) => {
  const [points, setPoints] = useState(0);
  const nextLevelPoints = 1000;

  const loadRewards = async () => {
    try {
      // Load points from AsyncStorage
      const storedPoints = await AsyncStorage.getItem(POINTS_KEY);
      const totalPoints = storedPoints ? parseInt(storedPoints) : 0;
      setPoints(totalPoints);
    } catch (error) {
      console.error('Failed to load rewards:', error);
    }
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
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Rewards & Achievements</Text>

        <View style={styles.pointsCard}>
          <View style={styles.pointsIconContainer}>
            <Ionicons name="star" size={40} color={colors.white} />
          </View>
          <Text style={styles.pointsLabel}>Total Points</Text>
          <Text style={styles.pointsValue}>{points}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min((points / nextLevelPoints) * 100, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{points}/{nextLevelPoints} points</Text>
          </View>

          <TouchableOpacity 
            style={styles.collectButton} 
            onPress={() => navigation.navigate('RewardsGift')}
          >
            <Ionicons name="gift-outline" size={20} color={colors.white} />
            <Text style={styles.collectButtonText}>Collect Rewards</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Earn Points</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.infoText}>Book an appointment: +10 points</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.infoText}>Complete a blood donation: +100 points</Text>
            </View>
          </View>
        </View>
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
    justifyContent: 'center',
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  pointsCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  pointsSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  collectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
});

export default RewardsScreen;
