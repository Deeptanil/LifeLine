import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from '../context/DispatchContext';
import { useTheme } from '../context/ThemeContext';
import { RF } from '../utils/Responsive';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { dispatches } = useDispatch();

  const { C, isDark } = useTheme();
  const styles = getStyles(C, isDark);

  const activeDispatch = dispatches.find(d => d.type === 'ambulance' || d.type === 'medic' || d.type === 'tele_medic');

  const handleSOS = () => {
    if (activeDispatch) {
      router.push({ pathname: '/emergency', params: { openTracker: 'true' } });
    } else {
      router.push('/emergency');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>Lifeline Unified Care,</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'User'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8}>
              <View style={styles.avatarWrap}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Medical ID Badge Banner */}
        <View style={{ paddingHorizontal: 22, marginBottom: 16 }}>
          <TouchableOpacity
            style={[styles.emergencyBadge, { backgroundColor: C.navy2, borderColor: C.cardBorder }]}
            onPress={() => router.push(user?.isOnboardingComplete ? '/profile' : '/onboarding')}
            activeOpacity={0.9}
          >
            <View style={[styles.bloodBadge, { backgroundColor: C.red }]}>
              <Text style={styles.bloodText}>{user?.bloodGroup || 'O+'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.badgeName, { color: C.textMain }]}>{user?.name || 'Complete Setup'}</Text>
                {user?.organDonor ? (
                  <View style={[styles.donorPill, { backgroundColor: 'rgba(0,201,167,0.15)' }]}>
                    <Text style={{ color: C.green, fontSize: RF(10), fontWeight: '700' }}>Organ Donor</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.badgeSub, { color: C.textMuted }]}>
                {user?.allergies ? `Allergies: ${user.allergies}` : 'Tap to complete emergency setup'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textDim} />
          </TouchableOpacity>
        </View>

        {/* SOS Emergency Dispatch Button */}
        <View style={styles.sosGrid}>
          {activeDispatch ? (
            <TouchableOpacity
              style={[styles.sosCard, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: C.amber }]}
              onPress={handleSOS}
              activeOpacity={0.8}
            >
              <View style={styles.sosRipple}>
                <Ionicons name={(activeDispatch.icon as any) || "map"} size={32} color={C.amber} />
              </View>
              <Text style={[styles.cardTitle, { color: C.amber, fontSize: RF(18), letterSpacing: 1, marginTop: 4 }]}>
                {activeDispatch.type === 'ambulance' ? 'Ambulance Dispatched' : 'Care Dispatch Active'}
              </Text>
              <Text style={[styles.sosSub, { color: C.amber }]}>Tap to view real-time tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.sosCard, { backgroundColor: C.redDark, borderColor: C.red }]} onPress={handleSOS} activeOpacity={0.8}>
              <View style={styles.sosRipple}>
                <Ionicons name="warning" size={32} color="#fff" />
              </View>
              <Text style={[styles.cardTitle, { color: '#fff', fontSize: RF(20), letterSpacing: 2, marginTop: 4 }]}>SOS Ambulance</Text>
              <Text style={[styles.sosSub, { color: '#fff' }]}>One-tap emergency dispatch</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Unified Sector Grid */}
        <Text style={[styles.sectionHeading, { color: C.textMain }]}>Unified Healthcare Sectors</Text>

        <View style={styles.grid}>
          {/* 1. Medic Home Dispatch */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: C.cardBg, borderColor: 'rgba(99,139,255,0.3)' }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/emergency', params: { type: 'medic' } })}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(99,139,255,0.15)' }]}>
              <Ionicons name="person-add" size={24} color="#638BFF" />
            </View>
            <Text style={styles.cardTitle}>Medic Home</Text>
            <Text style={styles.cardSub}>Nurse dispatched to home</Text>
          </TouchableOpacity>

          {/* 2. Tele-Medic Phone Consult */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: C.cardBg, borderColor: 'rgba(0,201,167,0.3)' }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/doctor', params: { tab: 'tele' } })}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(0,201,167,0.15)' }]}>
              <Ionicons name="call" size={24} color={C.teal} />
            </View>
            <Text style={styles.cardTitle}>Tele-Medic</Text>
            <Text style={styles.cardSub}>Call doctor over phone</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {/* 3. Medicine Delivery */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: C.cardBg, borderColor: 'rgba(255,179,0,0.3)' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/medicine')}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(255,179,0,0.15)' }]}>
              <Ionicons name="cart" size={24} color={C.amber} />
            </View>
            <Text style={styles.cardTitle}>Pharmacy</Text>
            <Text style={styles.cardSub}>Express drug delivery</Text>
          </TouchableOpacity>

          {/* 4. Book Appointments */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: C.cardBg, borderColor: 'rgba(168,85,247,0.3)' }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/doctor', params: { tab: 'appointment' } })}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
              <Ionicons name="calendar" size={24} color="#A855F7" />
            </View>
            <Text style={styles.cardTitle}>Appointments</Text>
            <Text style={styles.cardSub}>Book clinic & hospital slots</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {/* 5. Medical Vault & Records */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: C.cardBg, borderColor: 'rgba(99,139,255,0.3)' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/history')}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(99,139,255,0.15)' }]}>
              <Ionicons name="folder-open" size={24} color="#638BFF" />
            </View>
            <Text style={styles.cardTitle}>Medical Vault</Text>
            <Text style={styles.cardSub}>Digital records & history</Text>
          </TouchableOpacity>

          {/* 6. Health Checker */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: C.cardBg, borderColor: 'rgba(232,41,58,0.3)' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/symptoms')}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(232,41,58,0.15)' }]}>
              <Ionicons name="git-network" size={24} color={C.red} />
            </View>
            <Text style={styles.cardTitle}>Symptom Checker</Text>
            <Text style={styles.cardSub}>AI Triage & recommendations</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  header: { padding: 22, paddingTop: 16, paddingBottom: 12 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: RF(12), color: C.textMuted, marginBottom: 2 },
  userName: { fontSize: RF(22), fontWeight: '800', color: C.textMain },
  avatarWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  emergencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  bloodBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bloodText: { color: '#fff', fontSize: RF(16), fontWeight: '900' },
  badgeName: { fontSize: RF(14), fontWeight: '700' },
  badgeSub: { fontSize: RF(11), marginTop: 2 },
  donorPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sectionHeading: { fontSize: RF(15), fontWeight: '800', paddingHorizontal: 22, marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', paddingHorizontal: 22, gap: 12, marginBottom: 12 },
  actionCard: { flex: 1, borderRadius: 18, padding: 16, borderWidth: 1, height: 125, justifyContent: 'center' },
  cardIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardTitle: { fontSize: RF(14), fontWeight: '800', color: C.textMain },
  cardSub: { fontSize: RF(10), color: C.textMuted, marginTop: 2 },
  sosGrid: { paddingHorizontal: 22, marginBottom: 16 },
  sosCard: { borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sosRipple: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sosSub: { fontSize: RF(11), fontWeight: '700', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
});
