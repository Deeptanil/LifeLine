import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NavigationHeader } from '../components/NavigationHeader';
import { RF } from '../utils/Responsive';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, deleteProfile, logout } = useAuth();
  const { isDark, toggleTheme, C } = useTheme();
  const styles = getStyles(C);

  const [name, setName] = useState(user?.name || '');
  const [pass, setPass] = useState(user?.passwordHash || '');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: C.navy }]}>
        <ActivityIndicator size="large" color={C.teal} />
      </View>
    );
  }

  const handleUpdate = async () => {
    if (!name || pass.length < 6) { setStatusMsg('Invalid parameters.'); return; }
    setLoading(true);
    setStatusMsg('');
    const success = await updateProfile(name, pass);
    if (success) setStatusMsg('Profile updated securely.');
    else setStatusMsg('Update failed.');
    setLoading(false);
  };

  const handleLogout = () => { logout(); router.replace('/'); };
  const handleDelete = async () => { setLoading(true); await deleteProfile(); router.replace('/'); };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.navy }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} />

      <NavigationHeader title="My Account" subtitle="Profile & application settings" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>

          {/* Avatar Zone */}
          <View style={styles.avatarZone}>
            <View style={[styles.avatarWrap, { backgroundColor: C.teal, shadowColor: C.teal }]}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
            <Text style={[styles.avatarName, { color: C.textMain }]}>{user.name}</Text>
            <Text style={[styles.avatarPhone, { color: C.textMuted }]}>+91 {user.phone}</Text>
          </View>

          {/* Theme Toggle Section */}
          <View style={[styles.section]}>
            <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Appearance</Text>
            <View style={[styles.actionRow, { backgroundColor: C.navy2, borderColor: C.cardBorder, borderWidth: 1 }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={24}
                color={isDark ? '#638BFF' : C.amber}
              />
              <Text style={[styles.actionText, { color: C.textMain }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: C.navy3, true: '#638BFF' }}
                thumbColor={isDark ? '#fff' : C.navy4}
                ios_backgroundColor={C.navy3}
              />
            </View>
          </View>

          {/* Credentials */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Modify Credentials</Text>

            <Text style={[styles.label, { color: C.textDim }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              placeholderTextColor={C.textDim}
              value={name} onChangeText={setName}
            />

            <Text style={[styles.label, { color: C.textDim }]}>Secure Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              placeholderTextColor={C.textDim}
              secureTextEntry
              value={pass} onChangeText={setPass}
            />

            {statusMsg !== '' && (
              <Text style={[styles.statusMsg, statusMsg.includes('updated') ? { color: C.teal } : { color: C.red }]}>
                {statusMsg}
              </Text>
            )}

            <TouchableOpacity style={[styles.updateBtn, { backgroundColor: C.teal }]} onPress={handleUpdate} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Security & Sessions</Text>

            <TouchableOpacity style={[styles.actionRow, { backgroundColor: C.navy2, borderColor: C.cardBorder, borderWidth: 1 }]} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={24} color={C.textMain} />
              <Text style={[styles.actionText, { color: C.textMain }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={20} color={C.textDim} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />

            <TouchableOpacity style={[styles.actionRow, { backgroundColor: C.navy2, borderColor: C.cardBorder, borderWidth: 1 }]} onPress={handleDelete} activeOpacity={0.8}>
              <Ionicons name="trash-bin-outline" size={24} color={C.red} />
              <Text style={[styles.actionText, { color: C.red }]}>Delete Account Permanently</Text>
            </TouchableOpacity>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Support</Text>

            <TouchableOpacity style={[styles.actionRow, { backgroundColor: C.navy2, borderColor: C.cardBorder, borderWidth: 1 }]} onPress={() => {}} activeOpacity={0.8}>
              <Ionicons name="chatbubbles-outline" size={24} color={C.textMain} />
              <Text style={[styles.actionText, { color: C.textMain }]}>Contact Support Desk</Text>
              <Ionicons name="chevron-forward" size={20} color={C.textDim} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />

            <TouchableOpacity style={[styles.actionRow, { backgroundColor: C.navy2, borderColor: C.cardBorder, borderWidth: 1 }]} onPress={() => {}} activeOpacity={0.8}>
              <Ionicons name="document-text-outline" size={24} color={C.textMain} />
              <Text style={[styles.actionText, { color: C.textMain }]}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color={C.textDim} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: RF(20), fontWeight: '800' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  avatarZone: { alignItems: 'center', paddingVertical: 30 },
  avatarWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  avatarName: { fontSize: RF(24), fontWeight: '800', marginBottom: 4 },
  avatarPhone: { fontSize: RF(14), fontWeight: '600' },

  section: { paddingHorizontal: 22, marginBottom: 30 },
  sectionTitle: { fontSize: RF(14), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },

  label: { fontSize: RF(13), fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 16, fontSize: RF(15) },

  statusMsg: { fontSize: RF(13), fontWeight: '600', textAlign: 'center', marginBottom: 16 },

  updateBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  updateBtnText: { color: '#fff', fontWeight: '800', fontSize: RF(15) },

  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16 },
  actionText: { flex: 1, marginLeft: 14, fontSize: RF(15), fontWeight: '700' },
  divider: { height: 1, opacity: 0.5, marginVertical: 6 },
});
