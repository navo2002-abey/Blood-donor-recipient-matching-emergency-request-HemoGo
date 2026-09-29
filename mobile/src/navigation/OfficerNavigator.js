import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ComingSoonScreen from '../screens/ComingSoonScreen';
import { colors } from '../utils/colors';

// Officer screens (Rashan's part)
import InventoryDashboardScreen from '../screens/officer/InventoryDashboardScreen';
import AddStockScreen from '../screens/officer/AddStockScreen';
import EditStockScreen from '../screens/officer/EditStockScreen';
import ReservedUnitsScreen from '../screens/officer/ReservedUnitsScreen';
import CreateReservationScreen from '../screens/officer/CreateReservationScreen';
import ExpiryMonitoringScreen from '../screens/officer/ExpiryMonitoringScreen';
import AIPredictionScreen from '../screens/officer/AIPredictionScreen';
import OrganizeDonationDriveScreen from '../screens/officer/OrganizeDonationDriveScreen';
import BloodRescueScreen from '../screens/officer/BloodRescueScreen';
import TransferRequestScreen from '../screens/officer/TransferRequestScreen';
import PendingTransfersScreen from '../screens/officer/PendingTransfersScreen';
import NearbyBloodBanksScreen from '../screens/officer/NearbyBloodBanksScreen';
import BloodBankDetailsScreen from '../screens/officer/BloodBankDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

const OfficerTabs = () => (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Stock: 'file-tray-stacked-outline',
      Requests: 'swap-horizontal-outline',
      Alerts: 'hourglass-outline',
      Profile: 'person-outline',
    })}
  >
    <Tab.Screen
      name="Home"
      component={InventoryDashboardScreen}
      options={{ title: 'Inventory' }}
    />
    <Tab.Screen
      name="Stock"
      component={NearbyBloodBanksScreen}
      options={{ title: 'Stock' }}
    />
    <Tab.Screen
      name="Requests"
      component={PendingTransfersScreen}
      options={{ title: 'Transfers' }}
    />
    <Tab.Screen
      name="Alerts"
      component={ExpiryMonitoringScreen}
      options={{ title: 'Expiry' }}
    />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// All officer stack screens (used by navigation.navigate('...'))
const OfficerNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OfficerTabs" component={OfficerTabs} />
    <Stack.Screen name="AddStock" component={AddStockScreen} />
    <Stack.Screen name="EditStock" component={EditStockScreen} />
    <Stack.Screen name="ReservedUnits" component={ReservedUnitsScreen} />
    <Stack.Screen name="CreateReservation" component={CreateReservationScreen} />
    <Stack.Screen name="ExpiryMonitoring" component={ExpiryMonitoringScreen} />
    <Stack.Screen name="AIPrediction" component={AIPredictionScreen} />
    <Stack.Screen name="OrganizeDrive" component={OrganizeDonationDriveScreen} />
    <Stack.Screen name="BloodRescue" component={BloodRescueScreen} />
    <Stack.Screen name="TransferRequest" component={TransferRequestScreen} />
    <Stack.Screen name="PendingTransfers" component={PendingTransfersScreen} />
    <Stack.Screen name="NearbyBloodBanks" component={NearbyBloodBanksScreen} />
    <Stack.Screen name="BloodBankDetails" component={BloodBankDetailsScreen} />
  </Stack.Navigator>
);

export default OfficerNavigator;