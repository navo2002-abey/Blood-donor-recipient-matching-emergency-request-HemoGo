import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { colors } from '../utils/colors';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CheckEligibilityScreen = ({ navigation }) => {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [lastDonation, setLastDonation] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [recentIllness, setRecentIllness] = useState(null);
  const [recentTattoo, setRecentTattoo] = useState(null);
  const [onMedication, setOnMedication] = useState(null);
  const [showBloodDropdown, setShowBloodDropdown] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [issues, setIssues] = useState([]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setLastDonationDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setLastDonation(formattedDate);
    }
  };

  const checkEligibility = () => {
    // Validation
    if (!age || !weight || !bloodGroup) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);

    // Eligibility rules
    const eligibilityIssues = [];

    // Age: 18-65
    if (ageNum < 18) {
      eligibilityIssues.push('You must be at least 18 years old to donate.');
    } else if (ageNum > 65) {
      eligibilityIssues.push('Maximum age for donation is 65 years.');
    }

    // Weight: minimum 50kg
    if (weightNum < 50) {
      eligibilityIssues.push('Minimum weight required is 50kg.');
    }

    // Recent illness
    if (recentIllness === true) {
      eligibilityIssues.push('Recent illness may affect eligibility. Please wait until fully recovered.');
    }

    // Recent tattoo (within 6 months)
    if (recentTattoo === true) {
      eligibilityIssues.push('Recent tattoo (within 6 months) may affect eligibility.');
    }

    // On medication
    if (onMedication === true) {
      eligibilityIssues.push('Current medication may affect eligibility. Please consult with a doctor.');
    }

    // Last donation check (minimum 3 months)
    if (lastDonation) {
      const donationDate = new Date(lastDonation);
      const today = new Date();
      const monthsDiff = (today - donationDate) / (1000 * 60 * 60 * 24 * 30);
      if (monthsDiff < 3) {
        eligibilityIssues.push('Minimum gap between donations is 3 months.');
      }
    }

    setIssues(eligibilityIssues);
    setIsEligible(eligibilityIssues.length === 0);
    setShowResult(true);
  };

  const handleCheckAgain = () => {
    setShowResult(false);
    setIssues([]);
    setIsEligible(false);
  };

  const handleUpdateAvailability = () => {
    Alert.alert('Success', 'Your availability status has been updated to "Available to Donate".');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {showResult ? (
          <View style={styles.resultContainer}>
            <View style={[styles.resultCard, isEligible ? styles.eligibleCard : styles.notEligibleCard]}>
              <View style={styles.resultIconContainer}>
                <Ionicons
                  name={isEligible ? 'checkmark-circle' : 'close-circle'}
                  size={80}
                  color={isEligible ? colors.success : colors.primary}
                />
              </View>
              <Text style={[styles.resultTitle, isEligible ? styles.eligibleTitle : styles.notEligibleTitle]}>
                {isEligible ? 'Eligible to Donate!' : 'Not Eligible'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {isEligible
                  ? 'Congratulations! You meet all the requirements to donate blood.'
                  : 'Based on your answers, you are not currently eligible to donate.'}
              </Text>
            </View>

            {!isEligible && (
              <View style={styles.issuesCard}>
                <Text style={styles.issuesTitle}>Reasons:</Text>
                {issues.map((issue, index) => (
                  <View key={index} style={styles.issueItem}>
                    <Ionicons name="alert-circle" size={20} color={colors.primary} />
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.resultButtons}>
              <TouchableOpacity style={styles.checkAgainButton} onPress={handleCheckAgain}>
                <Ionicons name="refresh-outline" size={20} color={colors.white} />
                <Text style={styles.checkAgainButtonText}>Check Again</Text>
              </TouchableOpacity>
              {isEligible && (
                <TouchableOpacity style={styles.updateButton} onPress={handleUpdateAvailability}>
                  <Ionicons name="checkmark-done-outline" size={20} color={colors.white} />
                  <Text style={styles.updateButtonText}>Update Availability Status</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Check Eligibility</Text>
            <Text style={styles.subtitle}>Answer a few questions to see if you can donate</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age *</Text>
                <View style={styles.input}>
                  <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your age"
                    placeholderTextColor={colors.textMuted}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Weight (kg) *</Text>
                <View style={styles.input}>
                  <Ionicons name="fitness-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your weight"
                    placeholderTextColor={colors.textMuted}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Blood Group *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowBloodDropdown(!showBloodDropdown)}
                >
                  <Ionicons name="water-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.textInput, !bloodGroup && styles.placeholder]}>
                    {bloodGroup || 'Select blood group'}
                  </Text>
                  <Ionicons
                    name={showBloodDropdown ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
                {showBloodDropdown && (
                  <View style={styles.dropdown}>
                    {BLOOD_GROUPS.map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setBloodGroup(group);
                          setShowBloodDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{group}</Text>
                        {bloodGroup === group && (
                          <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Donation Date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.textInput, !lastDonation && styles.placeholder]}>
                    {lastDonation || 'Select date'}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={lastDonationDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recent Illness (within last 30 days)</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[styles.toggle, recentIllness === true && styles.toggleActive]}
                    onPress={() => setRecentIllness(true)}
                  >
                    <Text style={[styles.toggleText, recentIllness === true && styles.toggleTextActive]}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggle, recentIllness === false && styles.toggleActive]}
                    onPress={() => setRecentIllness(false)}
                  >
                    <Text style={[styles.toggleText, recentIllness === false && styles.toggleTextActive]}>
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recent Tattoo (within 6 months)</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[styles.toggle, recentTattoo === true && styles.toggleActive]}
                    onPress={() => setRecentTattoo(true)}
                  >
                    <Text style={[styles.toggleText, recentTattoo === true && styles.toggleTextActive]}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggle, recentTattoo === false && styles.toggleActive]}
                    onPress={() => setRecentTattoo(false)}
                  >
                    <Text style={[styles.toggleText, recentTattoo === false && styles.toggleTextActive]}>
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Currently on Medication</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[styles.toggle, onMedication === true && styles.toggleActive]}
                    onPress={() => setOnMedication(true)}
                  >
                    <Text style={[styles.toggleText, onMedication === true && styles.toggleTextActive]}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggle, onMedication === false && styles.toggleActive]}
                    onPress={() => setOnMedication(false)}
                  >
                    <Text style={[styles.toggleText, onMedication === false && styles.toggleTextActive]}>
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={checkEligibility}>
                <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                <Text style={styles.submitButtonText}>Check Eligibility</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Basic requirements: Age 18-65, weight 50kg+, 3-month gap between donations
              </Text>
            </View>
          </>
        )}
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
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    minHeight: 60,
  },
  dropdownItemText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  toggle: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  toggleTextActive: {
    color: colors.white,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  resultContainer: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  eligibleCard: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
  },
  notEligibleCard: {
    borderColor: colors.primary,
    backgroundColor: '#FEF2F2',
  },
  resultIconContainer: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  eligibleTitle: {
    color: colors.success,
  },
  notEligibleTitle: {
    color: colors.primary,
  },
  resultSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  issuesCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  issuesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  issueText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  resultButtons: {
    gap: 12,
  },
  checkAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 14,
  },
  checkAgainButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default CheckEligibilityScreen;
