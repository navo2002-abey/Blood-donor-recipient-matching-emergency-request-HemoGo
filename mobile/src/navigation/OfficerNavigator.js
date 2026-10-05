import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/officer/HomeScreen';
import InventoryListScreen from '../screens/officer/InventoryListScreen';
import AddStockScreen from '../screens/officer/AddStockScreen';
import EditStockScreen from '../screens/officer/EditStockScreen';
import CreateReservationScreen from '../screens/officer/CreateReservationScreen';
import ExpiryMonitoringScreen from '../screens/officer/ExpiryMonitoringScreen';
import AIPredictionScreen from '../screens/officer/AIPredictionScreen';
import OrganizeDonationDriveScreen from '../screens/officer/OrganizeDonationDriveScreen';
import BloodRescueScreen from '../screens/officer/BloodRescueScreen';
import TransferRequestScreen from '../screens/officer/TransferRequestScreen';
import PendingTransfersScreen from '../screens/officer/PendingTransfersScreen';
import NearbyBloodBanksScreen from '../screens/officer/NearbyBloodBanksScreen';
import BloodBankDetailsScreen from '../screens/officer/BloodBankDetailsScreen';
import QRScanScreen from '../screens/officer/QRScanScreen';
import SettingsScreen from '../screens/officer/SettingsScreen';
import AlertsScreen from '../screens/officer/AlertsScreen';
import CampaignConfirmationScreen from '../screens/officer/CampaignConfirmationScreen';
import CampaignListScreen from '../screens/officer/CampaignListScreen';
import EditCampaignScreen from '../screens/officer/EditCampaignScreen';
import TransferConfirmationScreen from '../screens/officer/TransferConfirmationScreen';
import CreateExchangeRequestScreen from '../screens/officer/CreateExchangeRequestScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabOptions = (icons, language, colors) => ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarAllowFontScaling: false,
  tabBarLabelStyle: {
    fontSize: language === 'si' ? 10 : 11,
    fontWeight: '700',
    lineHeight: language === 'si' ? 16 : 14,
  },
  tabBarStyle: {
    height: language === 'si' ? 74 : 62,
    paddingBottom: language === 'si' ? 10 : 6,
    paddingTop: 6,
    backgroundColor: colors.cardBg,
    borderTopColor: colors.border,
  },
  tabBarIcon: ({ color, size }) => (
    <Ionicons name={icons[route.name] || 'ellipse-outline'} size={22} color={color} />
  ),
});

const OfficerTabs = () => {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  return (
  <Tab.Navigator
    screenOptions={tabOptions({
      Home: 'home-outline',
      Inventory: 'water-outline',
      Scan: 'qr-code-outline',
      Alerts: 'notifications-outline',
      Log: 'list-outline',
    }, language, colors)}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarLabel: t('tabs.home') }}
    />
    <Tab.Screen
      name="Inventory"
      component={InventoryListScreen}
      options={{ tabBarLabel: t('tabs.inventory') }}
    />
    <Tab.Screen
      name="Scan"
      component={QRScanScreen}
      options={{ tabBarLabel: t('tabs.scan') }}
    />
    <Tab.Screen
      name="Alerts"
      component={AlertsScreen}
      options={{ tabBarLabel: t('tabs.alerts') }}
    />
    <Tab.Screen
      name="Log"
      component={PendingTransfersScreen}
      options={{ tabBarLabel: t('tabs.log') }}
    />
  </Tab.Navigator>
  );
};

const OfficerNavigator = () => {
  const { colors } = useTheme();
  return (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
    <Stack.Screen name="OfficerTabs" component={OfficerTabs} />
    <Stack.Screen name="AddStock" component={AddStockScreen} />
    <Stack.Screen name="EditStock" component={EditStockScreen} />
    <Stack.Screen name="CreateReservation" component={CreateReservationScreen} />
    <Stack.Screen name="ExpiryMonitoring" component={ExpiryMonitoringScreen} />
    <Stack.Screen name="AIPrediction" component={AIPredictionScreen} />
    <Stack.Screen name="OrganizeDrive" component={OrganizeDonationDriveScreen} />
    <Stack.Screen name="BloodRescue" component={BloodRescueScreen} />
    <Stack.Screen name="TransferRequest" component={TransferRequestScreen} />
    <Stack.Screen name="TransferConfirmation" component={TransferConfirmationScreen} />
    <Stack.Screen name="PendingTransfers" component={PendingTransfersScreen} />
    <Stack.Screen name="NearbyBloodBanks" component={NearbyBloodBanksScreen} />
    <Stack.Screen name="BloodBankDetails" component={BloodBankDetailsScreen} />
    <Stack.Screen name="QRScan" component={QRScanScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Alerts" component={AlertsScreen} />
    <Stack.Screen name="CreateExchangeRequest" component={CreateExchangeRequestScreen} />
    <Stack.Screen name="CampaignConfirmation" component={CampaignConfirmationScreen} />
    <Stack.Screen name="CampaignList" component={CampaignListScreen} />
    <Stack.Screen name="EditCampaign" component={EditCampaignScreen} />
  </Stack.Navigator>
  );
};

export default OfficerNavigator;