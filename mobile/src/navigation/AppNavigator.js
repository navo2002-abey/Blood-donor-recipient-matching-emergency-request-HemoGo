import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../context/AuthContext';

// Teammate's screens
import ActiveRequestCompletedScreen from '../screens/ActiveRequestCompletedScreen';
import ActiveRequestProgressScreen from '../screens/ActiveRequestProgressScreen';
import ActiveRequestQRVerifyScreen from '../screens/ActiveRequestQRVerifyScreen';
import ActiveRequestsScreen from '../screens/ActiveRequestsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
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
import DirectRequestScreen from '../screens/DirectRequestScreen';
import DonorDetailScreen from '../screens/DonorDetailScreen';
import FindDonorsScreen from '../screens/FindDonorsScreen';
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
import SignUpScreen from '../screens/SignUpScreen';
import SplashScreen from '../screens/SplashScreen';
import TrackingRequestScreen from '../screens/TrackingRequestScreen';

// Rashan's navigator
import OfficerNavigator from './OfficerNavigator';

import { colors } from '../utils/colors';
import { ROLES } from '../utils/roles';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const soon = (title) => (props) => <ComingSoonScreen title={title} {...props} />;
const PatientProfileScreen = (props) => <ComingSoonScreen title="Profile" showLogout {...props} />;

const tabOptions = (icons) => ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  tabBarStyle: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopColor: colors.border,
  },
  tabBarIcon: ({ color, size }) => (
    <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />
  ),
});

const DonorTabs = () => (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Map: 'map-outline',
      Requests: 'water-outline',
      Rewards: 'ribbon-outline',
      Profile: 'person-outline',
    })}
  >
    <Tab.Screen name="Home" component={DashboardScreen} />
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen
      name="Requests"
      component={CreateBloodRequestScreen}
      options={{ title: 'Request' }}
    />
    <Tab.Screen name="Rewards" component={RewardsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Users: 'people-outline',
      Requests: 'alert-circle-outline',
      Reports: 'bar-chart-outline',
      Profile: 'person-outline',
    })}
  >
    <Tab.Screen name="Home" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
    <Tab.Screen name="Users" component={soon('Manage Users')} />
    <Tab.Screen name="Requests" component={soon('Emergency Requests')} />
    <Tab.Screen name="Reports" component={soon('Reports & Analytics')} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const PatientTabs = () => (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Requests: 'document-text-outline',
      Donors: 'search-outline',
      Profile: 'person-outline',
    })}
  >
    <Tab.Screen name="Home" component={PatientDashboardScreen} />
    <Tab.Screen
      name="Requests"
      component={MyRequestsScreen}
      options={{ title: 'My Requests' }}
    />
    <Tab.Screen name="Donors" component={FindDonorsScreen} options={{ tabBarStyle: { display: 'none' } }} />
    <Tab.Screen name="Profile" component={PatientProfileScreen} />
  </Tab.Navigator>
);

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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Main" component={RoleRoot} />
        <Stack.Screen name="FindDonors" component={FindDonorsScreen} />
        <Stack.Screen name="AvailableDonors" component={AvailableDonorsScreen} />
        <Stack.Screen name="DonorDetail" component={DonorDetailScreen} />
        <Stack.Screen name="DirectRequest" component={DirectRequestScreen} />
        <Stack.Screen name="Call" component={CallScreen} />
        <Stack.Screen name="RequestMatch" component={RequestMatchScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;