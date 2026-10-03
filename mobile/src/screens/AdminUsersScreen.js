import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import Input from '../components/Input';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createAdminUser, fetchAdminUsers, updateAdminUser } from '../services/adminService';
import { colors } from '../utils/colors';
import { ADMIN_MENU, ROLES } from '../utils/roles';
import { isValidEmail } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: ROLES.DONOR, label: 'Donors' },
  { key: ROLES.BLOOD_BANK_OFFICER, label: 'Officers' },
  { key: ROLES.PATIENT_FAMILY, label: 'Patients' },
  { key: ROLES.ADMIN, label: 'Admins' },
  { key: 'INACTIVE', label: 'Inactive' },
];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: ROLES.DONOR,
  hospital: '',
};

const ROLE_OPTIONS = [
  ROLES.DONOR,
  ROLES.PATIENT_FAMILY,
  ROLES.BLOOD_BANK_OFFICER,
  ROLES.ADMIN,
];

const roleMeta = (item) => item.hospital || item.phone || item.email || 'No contact details';

const AdminUsersScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [draftRole, setDraftRole] = useState(ROLES.DONOR);
  const [draftHospital, setDraftHospital] = useState('');
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const list = await fetchAdminUsers();
      setUsers(list);
      setError('');
      return list;
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load users right now.');
      return [];
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      loadUsers().finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [loadUsers])
  );

  useEffect(() => {
    const userId = route.params?.userId;
    if (!userId || !users.length) return;
    const match = users.find((item) => item.id === userId);
    if (!match) return;
    setSelected(match);
    setDraftRole(match.role);
    setDraftHospital(match.hospital || '');
    navigation.setParams({ userId: undefined });
  }, [navigation, route.params?.userId, users]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const openUser = (item) => {
    setSelected(item);
    setDraftRole(item.role);
    setDraftHospital(item.hospital || '');
  };

  const closeSheet = () => {
    if (saving) return;
    setSelected(null);
  };

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (creating) return;
    setFormOpen(false);
  };

  const setFormField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      Alert.alert('Check the form', 'Please enter the full name.');
      return;
    }
    if (!isValidEmail(form.email)) {
      Alert.alert('Check the form', 'Please enter a valid email address.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Check the form', 'Please enter a phone number.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Check the form', 'Password must be at least 6 characters.');
      return;
    }

    setCreating(true);
    try {
      const created = await createAdminUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        hospital: form.hospital.trim(),
      });
      setUsers((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setFormOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      Alert.alert('Could not add user', err?.response?.data?.message || 'Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const isSelf = selected && user && String(selected.id) === String(user.id || user._id);

  const toggleActive = () => {
    if (!selected || isSelf) return;
    const activating = selected.isActive === false;
    Alert.alert(
      activating ? 'Activate account' : 'Deactivate account',
      activating
        ? `${selected.name} will be able to log in again.`
        : `${selected.name} will not be able to log in until the account is activated again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: activating ? 'Activate' : 'Deactivate',
          style: activating ? 'default' : 'destructive',
          onPress: () => applyActive(!activating ? false : true),
        },
      ]
    );
  };

  const applyActive = async (nextActive) => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateAdminUser(selected.id, { isActive: nextActive });
      setUsers((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setSelected(null);
    } catch (err) {
      Alert.alert('Could not update user', err?.response?.data?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveUser = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateAdminUser(selected.id, {
        role: draftRole,
        hospital: draftHospital,
      });
      setUsers((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setSelected(null);
    } catch (err) {
      Alert.alert('Could not update user', err?.response?.data?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const query = search.trim().toLowerCase();
  const visibleUsers = users.filter((item) => {
    const matchesRole =
      filter === 'ALL' ||
      (filter === 'INACTIVE' ? item.isActive === false : item.role === filter);
    const matchesSearch =
      !query ||
      item.name?.toLowerCase().includes(query) ||
      item.email?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.hospital?.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const unchanged =
    selected && draftRole === selected.role && (draftHospital || '') === (selected.hospital || '');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.intro}>
        <View style={styles.introCopy}>
          <Text style={styles.title}>{t('users.title')}</Text>
          <Text style={styles.subtitle}>
            {loading
              ? t('users.loading')
              : t(visibleUsers.length === 1 ? 'users.countOne' : 'users.count', { count: visibleUsers.length })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openForm}>
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.addBtnText}>{t('users.add')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('users.search')}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item.key === 'ALL'
                  ? t('users.all')
                  : item.key === 'INACTIVE'
                    ? t('users.inactive')
                    : item.key === ROLES.DONOR
                      ? t('users.donors')
                      : item.key === ROLES.BLOOD_BANK_OFFICER
                        ? t('users.officers')
                        : item.key === ROLES.PATIENT_FAMILY
                          ? t('users.patients')
                          : item.key === ROLES.ADMIN
                            ? t('users.admins')
                            : item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={visibleUsers}
          keyExtractor={(item) => item.id}
          style={styles.userList}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{error || t('users.empty')}</Text>
              <Text style={styles.emptyCopy}>{error ? t('users.retry') : t('users.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openUser(item)} activeOpacity={0.75}>
              <View style={[styles.badge, item.isActive === false && styles.badgeMuted]}>
                <Text style={styles.badgeText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>
                  {item.isActive === false ? 'Inactive · ' : ''}
                  {roleMeta(item)}
                </Text>
              </View>
              <View style={[styles.rolePill, item.isActive === false && styles.rolePillMuted]}>
                <Text style={[styles.rolePillText, item.isActive === false && styles.rolePillTextMuted]}>
                  {item.isActive === false ? t('users.inactive') : t(`roles.${item.role}`) || item.role}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={closeSheet}>
        <Pressable style={styles.backdrop} onPress={closeSheet}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selected?.name}</Text>
            <Text style={styles.sheetSub}>{selected?.email}</Text>
            <Text style={styles.sheetSub}>{selected?.phone}</Text>

            <Text style={styles.fieldLabel}>{t('pages.role')}</Text>
            <View style={styles.roleGrid}>
              {ROLE_OPTIONS.map((role) => {
                const active = draftRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleChip, active && styles.roleChipActive, isSelf && styles.roleChipDisabled]}
                    onPress={() => {
                      if (!isSelf) setDraftRole(role);
                    }}
                    disabled={!!isSelf}
                  >
                    <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                      {t(`roles.${role}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {isSelf ? <Text style={styles.note}>{t('pages.cannotChangeRole')}</Text> : null}

            <Text style={styles.fieldLabel}>{t('pages.hospital')}</Text>
            <TextInput
              value={draftHospital}
              onChangeText={setDraftHospital}
              placeholder={t('pages.optional')}
              placeholderTextColor={colors.textMuted}
              style={styles.hospitalInput}
            />

            <TouchableOpacity
              style={[styles.saveBtn, (saving || unchanged) && styles.saveBtnDisabled]}
              onPress={saveUser}
              disabled={saving || unchanged}
            >
              <Text style={styles.saveText}>{saving ? t('pages.saving') : t('pages.saveChanges')}</Text>
            </TouchableOpacity>
            {!isSelf ? (
              <TouchableOpacity
                style={[styles.deactivateBtn, selected?.isActive === false && styles.activateBtn]}
                onPress={toggleActive}
                disabled={saving}
              >
                <Text style={[styles.deactivateText, selected?.isActive === false && styles.activateText]}>
                  {selected?.isActive === false ? t('pages.activate') : t('pages.deactivate')}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.note}>{t('pages.cannotDeactivate')}</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={formOpen} animationType="slide" onRequestClose={closeForm}>
        <SafeAreaView style={styles.formSafe}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.formHeader}>
              <TouchableOpacity onPress={closeForm} style={styles.headerBtn} disabled={creating}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.formTitle}>{t('pages.addUser')}</Text>
              <View style={styles.headerBtn} />
            </View>
            <ScrollView
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Input
                label={t('pages.fullNameShort')}
                value={form.name}
                onChangeText={(value) => setFormField('name', value)}
                placeholder={t('pages.fullNameShort')}
                autoCapitalize="words"
                editable={!creating}
              />
              <Input
                label={t('pages.email')}
                value={form.email}
                onChangeText={(value) => setFormField('email', value)}
                placeholder={t('pages.email')}
                keyboardType="email-address"
                editable={!creating}
              />
              <Input
                label={t('pages.phoneShort')}
                value={form.phone}
                onChangeText={(value) => setFormField('phone', value)}
                placeholder={t('pages.phoneShort')}
                keyboardType="phone-pad"
                editable={!creating}
              />
              <Input
                label={t('pages.password')}
                value={form.password}
                onChangeText={(value) => setFormField('password', value)}
                placeholder={t('pages.passwordHint')}
                secureTextEntry
                editable={!creating}
              />
              <Text style={styles.fieldLabel}>{t('pages.role')}</Text>
              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((role) => {
                  const active = form.role === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleChip, active && styles.roleChipActive]}
                      onPress={() => setFormField('role', role)}
                      disabled={creating}
                    >
                      <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                        {t(`roles.${role}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.fieldLabel}>{t('pages.hospital')}</Text>
              <TextInput
                value={form.hospital}
                onChangeText={(value) => setFormField('hospital', value)}
                placeholder={t('pages.optional')}
                placeholderTextColor={colors.textMuted}
                style={styles.hospitalInput}
                editable={!creating}
              />
              <TouchableOpacity
                style={[styles.saveBtn, creating && styles.saveBtnDisabled]}
                onPress={submitForm}
                disabled={creating}
              >
                <Text style={styles.saveText}>{creating ? t('pages.adding') : t('pages.createAccountBtn')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={(feature) => Alert.alert('Coming Soon', `${feature} will be available in a later version.`)}
        menu={ADMIN_MENU}
        variant="staff"
        activeKey="Manage Users"
        org="HemoGo National Network"
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  intro: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  introCopy: { flex: 1 },
  title: { fontSize: 22, lineHeight: 32, fontWeight: '800', color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 36,
    paddingVertical: 8,
  },
  addBtnText: { color: colors.white, fontWeight: '800', fontSize: 13, lineHeight: 18 },
  subtitle: { marginTop: 2, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filterScroll: { flexGrow: 0, flexShrink: 0, height: 52 },
  filters: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  userList: { flex: 1 },
  chip: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 10,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMuted: { backgroundColor: colors.inputBg },
  badgeText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rolePill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 110,
  },
  rolePillMuted: { backgroundColor: colors.inputBg },
  rolePillText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  rolePillTextMuted: { color: colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyCopy: { marginTop: 6, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,17,17,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.inputBg,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipDisabled: { opacity: 0.6 },
  roleChipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  roleChipTextActive: { color: colors.white },
  note: { marginTop: 8, fontSize: 12, color: colors.textSecondary },
  hospitalInput: {
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  saveBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  deactivateBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtn: { borderColor: colors.success },
  deactivateText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  activateText: { color: colors.success },
  formSafe: { flex: 1, backgroundColor: colors.cardBg },
  flex: { flex: 1 },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  formTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  formScroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
});

export default AdminUsersScreen;
