import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LoginScreen from '../screens/LoginScreen';
import MapScreen from '../screens/MapScreen';
import OfficerDashboardScreen from '../screens/OfficerDashboardScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PatientDashboardScreen from '../screens/PatientDashboardScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SplashScreen from '../screens/SplashScreen';
import { colors } from '../utils/colors';
import { ROLES } from '../utils/roles';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const soon = (title) => (props) => <ComingSoonScreen title={title} {...props} />;
const ProfileScreen = (props) => <ComingSoonScreen title="Profile" showLogout {...props} />;

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
    <Tab.Screen name="Requests" component={soon('Requests')} />
    <Tab.Screen name="Rewards" component={soon('Rewards')} />
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

const OfficerTabs = () => (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Stock: 'file-tray-stacked-outline',
      Requests: 'water-outline',
      Alerts: 'warning-outline',
      Profile: 'person-outline',
    })}
  >
    <Tab.Screen name="Home" component={OfficerDashboardScreen} options={{ title: 'Inventory' }} />
    <Tab.Screen name="Stock" component={soon('Nearby Blood Bank Stock')} options={{ title: 'Stock' }} />
    <Tab.Screen name="Requests" component={soon('Emergency Alerts & Logs')} />
    <Tab.Screen name="Alerts" component={soon('Expiry Monitoring')} />
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
    <Tab.Screen name="Requests" component={soon('My Requests')} />
    <Tab.Screen name="Donors" component={soon('Find Donors')} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const RoleRoot = () => {
  const { user } = useAuth();

  if (user?.role === ROLES.ADMIN) {
    return <AdminTabs />;
  }
  if (user?.role === ROLES.BLOOD_BANK_OFFICER) {
    return <OfficerTabs />;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
