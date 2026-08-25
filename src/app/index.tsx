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
  const { dispatches, iotOnline } = useDispatch();

  const { C, isDark } = useTheme();
  const styles = getStyles(C, isDark);

  const activeDispatch = dispatches.find(d => d.type === 'ambulance' || d.type === 'medic');

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

        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Guest'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8}>
              <View style={styles.avatarWrap}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: C.cardBg, borderColor: 'rgba(99,139,255,0.3)' }]} activeOpacity={0.8} onPress={() => router.push('/doctor')}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(99,139,255,0.15)' }]}>
              <Ionicons name="medical" size={24} color="#638BFF" />
            </View>
            <Text style={styles.cardTitle}>Find Doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: C.cardBg, borderColor: 'rgba(0,201,167,0.3)' }]} activeOpacity={0.8} onPress={() => router.push('/medicine')}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(0,201,167,0.15)' }]}>
              <Ionicons name="cart" size={24} color={C.teal} />
            </View>
            <Text style={styles.cardTitle}>Pharmacy</Text>
          </TouchableOpacity>
        </View>

        {/* IoT Device Status Card */}
        <View style={{ paddingHorizontal: 22, marginBottom: 14 }}>
          <TouchableOpacity
            style={[styles.iotCard, { backgroundColor: C.cardBg, borderColor: iotOnline ? 'rgba(0,201,167,0.3)' : C.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => router.push('/iot')}
          >
            <View style={[styles.iotIconWrap, { backgroundColor: iotOnline ? 'rgba(0,201,167,0.1)' : 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="hardware-chip" size={22} color={iotOnline ? C.teal : C.textDim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.iotTitle}>IoT Emergency Button</Text>
              <Text style={[styles.iotStatus, { color: iotOnline ? C.teal : C.textDim }]}>
                {iotOnline ? '● Device Online' : '○ Ready to Link'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textDim} />
          </TouchableOpacity>
        </View>

        <View style={styles.sosGrid}>
          {activeDispatch ? (
            <TouchableOpacity
              style={[styles.sosCard, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: C.amber, elevation: 0, shadowOpacity: 0 }]}
              onPress={handleSOS}
              activeOpacity={0.8}
            >
              <View style={[styles.sosRipple, { backgroundColor: 'transparent' }]}>
                <Ionicons name={(activeDispatch.icon as any) || "map"} size={32} color={C.amber} />
              </View>
              <Text style={[styles.cardTitle, { color: C.amber, fontSize: RF(18), letterSpacing: 1, marginTop: 4 }]}>
                {activeDispatch.type === 'ambulance' ? 'Ambulance Active' : activeDispatch.type === 'medic' ? 'Medic Active' : 'Order Tracking'}
              </Text>
              <Text style={[styles.sosSub, { color: C.amber }]}>Tap to view status</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.sosCard, { backgroundColor: C.redDark, borderColor: C.red }]} onPress={handleSOS} activeOpacity={0.8}>
              <View style={styles.sosRipple}>
                <Ionicons name="warning" size={32} color="#fff" />
              </View>
              <Text style={[styles.cardTitle, { color: '#fff', fontSize: RF(20), letterSpacing: 2, marginTop: 4 }]}>SOS Emergency</Text>
              <Text style={[styles.sosSub, { color: '#fff' }]}>Tap to get help</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => router.push('/symptoms')} activeOpacity={0.9}>
          <View style={styles.triageBanner}>
            <View style={styles.triageBannerContent}>
              <Text style={styles.triageTitle}>Free Health Checker</Text>
              <Text style={styles.triageSub}>Identify your condition and get recommended steps or dispatch a Nurse home directly.</Text>
            </View>
            <View style={styles.triageIconBadge}>
              <Ionicons name="git-network" size={28} color={C.amber} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ paddingHorizontal: 22, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Quick Reorder</Text>
            <TouchableOpacity onPress={() => router.push('/medicine')}>
              <Text style={styles.seeAllText}>Store →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, gap: 14 }}>
            {[{ icon: 'medkit', name: 'Paracetamol 500mg', price: '24' }, { icon: 'water', name: 'ORS Electrolyte', price: '55' }, { icon: 'flask', name: 'Volini Pain Spray', price: '140' }].map(item => (
              <View key={item.name} style={[styles.storeCard, { backgroundColor: C.navy2, borderColor: C.cardBorder }]}>
                <View style={styles.storeCardTop}>
                  <View style={[styles.storeImgWrap, { backgroundColor: C.navy3 }]}><Ionicons name={item.icon as any} size={24} color={C.teal} /></View>
                  <Text style={[styles.storeTitle, { color: C.textMain }]} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.storePrice, { color: C.textMain }]}>₹{item.price}</Text>
                </View>
                <TouchableOpacity style={[styles.storeBtn, { backgroundColor: C.navy3 }]} onPress={() => router.push({ pathname: '/medicine', params: { addItem: item.name, tab: 'delivery' } })}>
                  <Text style={[styles.storeBtnText, { color: C.teal }]}>Reorder</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  header: { padding: 22, paddingTop: 16, paddingBottom: 16 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: RF(13), color: C.textMuted, marginBottom: 4 },
  userName: { fontSize: RF(24), fontWeight: '800', color: C.textMain },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },

  grid: { flexDirection: 'row', paddingHorizontal: 22, gap: 14, marginBottom: 14 },
  actionCard: { flex: 1, borderRadius: 20, padding: 20, borderWidth: 1, height: 130, justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  cardIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { fontSize: RF(16), fontWeight: '800', color: C.textMain },

  sosGrid: { paddingHorizontal: 22, marginBottom: 24 },
  sosCard: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: isDark ? 0.4 : 0.15, shadowRadius: 10 },
  sosRipple: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sosSub: { fontSize: RF(12), fontWeight: '700', textTransform: 'uppercase', marginTop: 6, letterSpacing: 0.5 },

  triageBanner: { marginHorizontal: 22, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  triageBannerContent: { flex: 1, paddingRight: 16 },
  triageTitle: { fontSize: RF(16), fontWeight: '800', color: '#E89020', marginBottom: 6 },
  triageSub: { fontSize: RF(12), color: C.textMain, opacity: 0.8, lineHeight: 18 },
  triageIconBadge: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontSize: RF(18), fontWeight: '800', color: C.textMain },
  seeAllText: { fontSize: RF(13), fontWeight: '700', color: C.teal },

  storeCard: { width: 145, height: 210, borderWidth: 1, borderRadius: 16, padding: 16 },
  storeCardTop: { flex: 1, alignItems: 'center' },
  storeImgWrap: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  storeTitle: { fontSize: RF(13), fontWeight: '700', textAlign: 'center', marginBottom: 8, height: 36 },
  storePrice: { fontSize: RF(16), fontWeight: '800' },
  storeBtn: { paddingVertical: 10, borderRadius: 20, width: '100%', alignItems: 'center', marginTop: 'auto' },
  storeBtnText: { fontSize: RF(12), fontWeight: '700' },

  iotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14
  },
  iotIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iotTitle: {
    fontSize: RF(15),
    fontWeight: '800',
    color: C.textMain,
    marginBottom: 2
  },
  iotStatus: {
    fontSize: RF(12),
    fontWeight: '700'
  },
});
