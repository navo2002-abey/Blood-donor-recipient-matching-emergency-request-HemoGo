import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

// Teammate's screens
import ActiveRequestCompletedScreen from '../screens/ActiveRequestCompletedScreen';
import ActiveRequestProgressScreen from '../screens/ActiveRequestProgressScreen';
import ActiveRequestQRVerifyScreen from '../screens/ActiveRequestQRVerifyScreen';
import ActiveRequestsScreen from '../screens/ActiveRequestsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminReportsScreen from '../screens/AdminReportsScreen';
import AdminSettingsScreen from '../screens/AdminSettingsScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AppointmentBookedScreen from '../screens/AppointmentBookedScreen';
import BloodRequestListScreen from '../screens/BloodRequestListScreen';
import BookAppointmentScreen from '../screens/BookAppointmentScreen';
import CheckEligibilityScreen from '../screens/CheckEligibilityScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import AvailableDonorsScreen from '../screens/AvailableDonorsScreen';
import CallScreen from '../screens/CallScreen';
import ConfirmBloodRequestScreen from '../screens/ConfirmBloodRequestScreen';
import CreateBloodRequestScreen from '../screens/CreateBloodRequestScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EmergencyModeScreen from '../screens/EmergencyModeScreen';
import DirectRequestScreen from '../screens/DirectRequestScreen';
import DonorDetailScreen from '../screens/DonorDetailScreen';
import DonorSettingsScreen from '../screens/DonorSettingsScreen';
import DonorSelectedScreen from '../screens/DonorSelectedScreen';
import ContactDonorScreen from '../screens/ContactDonorScreen';
import RequestBloodScreen from '../screens/RequestBloodScreen';
import FindDonorsScreen from '../screens/FindDonorsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HistoryDetailScreen from '../screens/HistoryDetailScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import MapScreen from '../screens/MapScreen';
import MyRequestsScreen from '../screens/MyRequestsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PatientDashboardScreen from '../screens/PatientDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RequestMatchScreen from '../screens/RequestMatchScreen';
import RewardsGiftScreen from '../screens/RewardsGiftScreen';
import RewardsScreen from '../screens/RewardsScreen';
import AppleAccountScreen from '../screens/AppleAccountScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SocialContinueScreen from '../screens/SocialContinueScreen';
import SmartMatchScreen from '../screens/SmartMatchScreen';
import SplashScreen from '../screens/SplashScreen';
import TrackingRequestScreen from '../screens/TrackingRequestScreen';

// Rashan's navigator
import OfficerNavigator from './OfficerNavigator';

import { ROLES } from '../utils/roles';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const soon = (title) => (props) => <ComingSoonScreen title={title} {...props} />;
const PatientProfileScreen = (props) => <ComingSoonScreen title="Profile" showLogout {...props} />;

const tabOptions = (icons, language, colors) => ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarAllowFontScaling: false,
  tabBarLabelStyle: {
    fontSize: language === 'si' ? 10 : 11,
    fontWeight: '600',
    lineHeight: language === 'si' ? 16 : 14,
  },
  tabBarStyle: {
    height: language === 'si' ? 76 : 64,
    paddingBottom: language === 'si' ? 10 : 8,
    paddingTop: 6,
    backgroundColor: colors.cardBg,
    borderTopColor: colors.border,
  },
  tabBarIcon: ({ color, size }) => (
    <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />
  ),
});

const DonorTabs = () => {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  return (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Map: 'map-outline',
      Requests: 'water-outline',
      Rewards: 'ribbon-outline',
      Profile: 'person-outline',
    }, language, colors)}
  >
    <Tab.Screen name="Home" component={DashboardScreen} options={{ title: t('tabs.home') }} />
    <Tab.Screen name="Map" component={MapScreen} options={{ title: t('tabs.map') }} />
    <Tab.Screen
      name="Requests"
      component={CreateBloodRequestScreen}
      options={{ title: t('tabs.request') }}
    />
    <Tab.Screen name="Rewards" component={RewardsScreen} options={{ title: t('tabs.rewards') }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
  </Tab.Navigator>
  );
};

const AdminTabs = () => {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  return (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Users: 'people-outline',
      Requests: 'alert-circle-outline',
      Reports: 'bar-chart-outline',
      Profile: 'person-outline',
    }, language, colors)}
  >
    <Tab.Screen name="Home" component={AdminDashboardScreen} options={{ title: t('tabs.admin') }} />
    <Tab.Screen name="Users" component={AdminUsersScreen} options={{ title: t('tabs.users') }} />
    <Tab.Screen name="Requests" component={soon(t('menu.Emergency Requests'))} options={{ title: t('tabs.requests') }} />
    <Tab.Screen name="Reports" component={AdminReportsScreen} options={{ title: t('tabs.reports') }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
  </Tab.Navigator>
  );
};

const PatientTabs = () => {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  return (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Requests: 'document-text-outline',
      Donors: 'search-outline',
      Profile: 'person-outline',
    }, language, colors)}
  >
    <Tab.Screen name="Home" component={PatientDashboardScreen} options={{ title: t('tabs.home') }} />
    <Tab.Screen
      name="Requests"
      component={MyRequestsScreen}
      options={{ title: t('tabs.myRequests') }}
    />
    <Tab.Screen name="Donors" component={FindDonorsScreen} options={{ title: t('tabs.donors'), tabBarStyle: { display: 'none' } }} />
    <Tab.Screen name="Profile" component={PatientProfileScreen} options={{ title: t('tabs.profile') }} />
  </Tab.Navigator>
  );
};

const RoleRoot = () => {
  const { user } = useAuth();

  if (user?.role === ROLES.ADMIN) {
    return <AdminTabs />;
  }
  if (user?.role === ROLES.BLOOD_BANK_OFFICER) {
    return <OfficerNavigator />;
  }
  if (user?.role === ROLES.PATIENT_FAMILY) {
    return <PatientTabs />;
  }
  return <DonorTabs />;
};

const AppNavigator = () => {
  const { colors, isDark } = useTheme();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.page,
      card: colors.cardBg,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.page },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="SocialContinue" component={SocialContinueScreen} />
        <Stack.Screen name="AppleAccount" component={AppleAccountScreen} />
        <Stack.Screen name="Main" component={RoleRoot} />
        <Stack.Screen name="FindDonors" component={FindDonorsScreen} />
        <Stack.Screen name="AvailableDonors" component={AvailableDonorsScreen} />
        <Stack.Screen name="DonorDetail" component={DonorDetailScreen} />
        <Stack.Screen name="DirectRequest" component={DirectRequestScreen} />
        <Stack.Screen name="Call" component={CallScreen} />
        <Stack.Screen name="RequestMatch" component={RequestMatchScreen} />
        <Stack.Screen name="SmartMatch" component={SmartMatchScreen} />
        <Stack.Screen name="EmergencyMode" component={EmergencyModeScreen} />
        <Stack.Screen name="DonorSelected" component={DonorSelectedScreen} />
        <Stack.Screen name="ContactDonor" component={ContactDonorScreen} />
        <Stack.Screen name="RequestBlood" component={RequestBloodScreen} />
        <Stack.Screen name="CreateBloodRequest" component={CreateBloodRequestScreen} />
        <Stack.Screen name="ConfirmBloodRequest" component={ConfirmBloodRequestScreen} />
        <Stack.Screen name="TrackingRequest" component={TrackingRequestScreen} />
        <Stack.Screen name="ActiveRequests" component={ActiveRequestsScreen} />
        <Stack.Screen name="ActiveRequestProgress" component={ActiveRequestProgressScreen} />
        <Stack.Screen name="ActiveRequestDetail" component={ActiveRequestProgressScreen} />
        <Stack.Screen name="ActiveRequestQRVerify" component={ActiveRequestQRVerifyScreen} />
        <Stack.Screen name="ActiveRequestCompleted" component={ActiveRequestCompletedScreen} />
        <Stack.Screen name="BloodRequestList" component={BloodRequestListScreen} />
        <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
        <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
        <Stack.Screen name="AppointmentBooked" component={AppointmentBookedScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
        <Stack.Screen name="RewardsGift" component={RewardsGiftScreen} />
        <Stack.Screen name="CheckEligibility" component={CheckEligibilityScreen} />
        <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
        <Stack.Screen name="DonorSettings" component={DonorSettingsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;