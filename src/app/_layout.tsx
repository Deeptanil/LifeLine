import { Tabs, useRouter, useSegments, usePathname } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DispatchProvider, useDispatch } from '../context/DispatchContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavigationHeader } from '../components/NavigationHeader';
import { RF } from '../utils/Responsive';

const { width } = Dimensions.get('window');

function TabIcon({ name, label, focused, activeColor }: { name: any; label: string; focused: boolean; activeColor: string }) {
  const { C } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 2, paddingTop: 6, flex: 1, minWidth: 60 }}>
      <Ionicons name={name} size={18} color={focused ? activeColor : C.textDim} />
      <Text
        style={{ fontSize: RF(9), color: focused ? activeColor : C.textDim, fontWeight: focused ? '700' : '500', width: '100%', textAlign: 'center' }}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.7}
      >
        {label}
      </Text>
    </View>
  );
}

function DoctorFloatingBubble() {
  const router = useRouter();
  const { dispatches, cancelDispatch } = useDispatch();
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const docDispatch = dispatches.find(d => d.type === 'doctor');

  if (!docDispatch) return null;

  if (docDispatch.isRatingStar || docDispatch.stage === 2) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.floatingBubble, { top: 120 + insets.top }]}
      onPress={() => {
        const ts = Date.now().toString();
        router.push({ pathname: '/doctor', params: { openChat: 'true', ts } });
      }}
      activeOpacity={0.9}
    >
      <Ionicons name={docDispatch.chatMode === 'call' ? 'call' : 'chatbubbles'} size={24} color="#fff" />
      <View style={[styles.bubbleStatusPulse, { borderColor: '#638BFF' }]} />
    </TouchableOpacity>
  );
}

function GlobalTrackerBanner() {
  const { dispatches } = useDispatch();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (pathname === '/') setIsDismissed(false);
  }, [pathname]);

  const isHideRoute = (segments as string[]).includes('emergency') || (segments as string[]).includes('medicine') || (segments as string[]).includes('doctor');
  const trackerItems = dispatches.filter(d => d.type !== 'doctor');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (trackerItems.length > 0 && !isHideRoute && !isDismissed) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 10, tension: 60 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 250, useNativeDriver: true }).start();
    }
  }, [trackerItems.length, isHideRoute, isDismissed]);

  useEffect(() => {
    const i = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (trackerItems.length === 0) return null;

  return (
    <Animated.View 
      pointerEvents="box-none"
      style={[
        styles.trackerWrap, 
        { bottom: 60 + (Platform.OS === 'ios' ? insets.bottom : 0), height: 140 },
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: 'rgba(0,0,0,0)', overflow: 'visible', height: 140, width }}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: 8, overflow: 'visible', alignItems: 'flex-end' }}
        onScroll={(e) => setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={16}
      >
        {trackerItems.map(d => {
          let timerString = '';
          if (d.type === 'ambulance' || d.type === 'medic') {
            if (d.stage === 0) timerString = 'Assigning...';
            else if (d.stage === 2) timerString = 'Arrived';
            else {
              const msPassed = currentTime - (d.timerStart || currentTime);
              const remaining = Math.max(0, 600 - Math.floor(msPassed / 1000));
              timerString = `${Math.floor(remaining / 60)}m left`;
            }
          }

          return (
            <View key={d.id} style={{ width, paddingHorizontal: 12 }}>
              <TouchableOpacity
                style={[
                  styles.trackerCard,
                  d.type === 'ambulance' ? { backgroundColor: 'rgba(232,41,58,0.98)', shadowColor: '#E8293A' } :
                  d.type === 'medic' ? { backgroundColor: 'rgba(99,139,255,0.98)', shadowColor: '#638BFF' } :
                  { backgroundColor: 'rgba(0,201,167,0.98)', shadowColor: '#00C9A7' }
                ]}
                activeOpacity={0.9}
                onPress={() => {
                  const ts = Date.now().toString();
                  if (d.type === 'medicine') router.push({ pathname: '/medicine', params: { openTracker: 'true', ts, dispatchId: d.id } });
                  else router.push({ pathname: '/emergency', params: { openTracker: 'true', ts, dispatchId: d.id } });
                }}
              >
                <View style={styles.trackerIcon}>
                  <Ionicons name={d.icon as any} size={20} color="#fff" />
                </View>
                <View style={styles.trackerBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 28 }}>
                    <Text style={styles.trackerTitle} numberOfLines={1}>{d.title}</Text>
                  </View>
                  <Text style={styles.trackerSub} numberOfLines={1}>{d.subtitle}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="time" size={10} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
                    <Text style={styles.trackerStageBadge}>
                      {d.type === 'medicine' ? (d.stage === 0 ? 'Packing Order' : d.stage === 1 ? 'Out for Delivery' : 'Order Delivered') : timerString}
                    </Text>
                  </View>
                </View>

                {d.type !== 'medicine' && (
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 12 }}>
                    <Ionicons name="expand" size={20} color="#fff" />
                  </View>
                )}

                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); setIsDismissed(true); }}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, opacity: 0.8 }}
                >
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>

                {/* Internal Pagination - Zero Footprint */}
                {trackerItems.length > 1 && (
                  <View style={{ position: 'absolute', bottom: 6, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                    {trackerItems.map((_, i) => (
                      <View key={i} style={[styles.dot, { width: i === activeIdx ? 12 : 4, height: 4, backgroundColor: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.3)' }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

function AuthWall() {
  const { user, login, register } = useAuth();
  const { C, isDark } = useTheme();
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  if (user) return null;

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    if (isLogin) {
      const res = await login(phone, pass);
      if (!res.success) { setError(res.msg || 'Authentication failed.'); triggerShake(); }
    } else {
      if (!name || phone.length < 10 || pass.length < 6) {
        setError('Please provide valid 10-digit phone and 6+ char password.');
        triggerShake();
        setLoading(false);
        return;
      }
      const res = await register(name, phone, pass);
      if (!res.success) { setError(res.msg || 'Registration failed.'); triggerShake(); }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.authContainer, { backgroundColor: isDark ? 'rgba(10,22,40,0.95)' : 'rgba(240,244,255,0.97)' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[styles.authCard, { backgroundColor: C.navy2, borderColor: C.cardBorder, transform: [{ translateX: shakeAnim }] }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <Ionicons name="pulse" size={32} color={C.red} />
          <Text style={[styles.authTitle, { color: C.textMain }]}>Lifeline</Text>
        </View>
        <Text style={[styles.authSub, { color: C.textMuted }]}>Unified healthcare & emergency dispatch platform.</Text>

        {error ? <Text style={styles.authError}>{error}</Text> : null}

        {!isLogin && (
          <TextInput style={[styles.authInput, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]} placeholder="Full Name" placeholderTextColor={C.textDim} value={name} onChangeText={setName} />
        )}
        <TextInput style={[styles.authInput, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]} placeholder="Phone Number" placeholderTextColor={C.textDim} keyboardType="numeric" value={phone} onChangeText={setPhone} />
        <TextInput style={[styles.authInput, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]} placeholder="Secure Password" placeholderTextColor={C.textDim} secureTextEntry value={pass} onChangeText={setPass} />

        <TouchableOpacity style={[styles.authBtn, { backgroundColor: C.teal }]} onPress={submit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authBtnText}>{isLogin ? 'Secure Login' : 'Create Local Account'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 24 }} onPress={() => { setIsLogin(!isLogin); setError(''); }}>
          <Text style={{ color: C.textMuted, fontSize: RF(13), textAlign: 'center', fontWeight: '600' }}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function LayoutContent() {
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setIotOnline, addIotLog, iotOnline, dispatches } = useDispatch();
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const wasOnline = useRef(false);

  // ── Global IoT Emergency Polling ──
  useEffect(() => {
    const SERVER_URL = "http://192.168.4.1";
    let active = true;

    const poll = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

      try {
        const res = await fetch(`${SERVER_URL}/emergency`, {
          signal: controller.signal,
          headers: { 
            "Cache-Control": "no-cache"
          },
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
           console.log(`[IoT] Server returned ${res.status}`);
           if (active && wasOnline.current) {
             setIotOnline(false);
             // addIotLog("⚠️", `System Offline (${res.status})`, "#E8293A");
             wasOnline.current = false;
           }
           return;
        }

        const data = await res.json();
        
        // 1. Check Device Status (Heartbeat)
        const isDeviceAtHome = data.isDeviceOnline || false;

        if (active) {
          if (isDeviceAtHome !== wasOnline.current) {
            setIotOnline(isDeviceAtHome);
            if (isDeviceAtHome) {
              addIotLog("🟢", "Hotspot Connected (192.168.4.1)", "#00C9A7");
            } else {
              // addIotLog("⚪", "Device Offline (No heartbeat)", "#666");
            }
            wasOnline.current = isDeviceAtHome;
          }
        }

        // 2. Handle Emergency Event
        if (data && data.event && data.event.id) {
          const isNewEvent = data.event.id !== lastEventId;
          const isPending = data.event.acknowledged === false;

          if (isNewEvent) {
             setLastEventId(data.event.id);

             // Trigger only if it's a new ID AND it hasn't been handled yet
             if (isPending) {
                // Check if we ALREADY HAVE an active SOS dispatch
                const hasActiveSOS = dispatches.some(d => d.type === 'ambulance' || d.type === 'medic');

                if (!hasActiveSOS) {
                  addIotLog("🔴", `Emergency: ${data.event.device_id}`, "#E8293A");
                  router.push({ 
                    pathname: "/emergency", 
                    params: { autoTrigger: "true", device_id: data.event.device_id } 
                  });
                } else {
                  addIotLog("ℹ️", "Button pressed (Emergency already active)", "#666");
                }
             }
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (active) {
          // Quiet monitoring
          if (wasOnline.current) {
            setIotOnline(false);
            // addIotLog("⚠️", "System Offline", "#666");
            wasOnline.current = false;
          }
        }
      }
    };

    const interval = setInterval(poll, 2500);
    poll();
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [lastEventId]);

  return (
    <View style={{ flex: 1, backgroundColor: C.navy }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? 'rgba(10,22,40,0.98)' : 'rgba(255,255,255,0.98)',
            borderTopColor: C.cardBorder,
            borderTopWidth: 1,
            height: 60 + (Platform.OS === 'ios' ? insets.bottom : 0),
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 6 : 6,
            paddingTop: 4,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarItemStyle: { flex: 1 },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} label="Home" focused={focused} activeColor={C.teal} /> }} />
        <Tabs.Screen name="emergency" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'alert-circle' : 'alert-circle-outline'} label="SOS" focused={focused} activeColor={C.red} /> }} />
        <Tabs.Screen name="symptoms" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'git-network' : 'git-network-outline'} label="Symptoms" focused={focused} activeColor={C.amber} /> }} />
        <Tabs.Screen name="doctor" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'medical' : 'medical-outline'} label="Docs" focused={focused} activeColor={'#638BFF'} /> }} />
        <Tabs.Screen name="medicine" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'cart' : 'cart-outline'} label="Store" focused={focused} activeColor={C.teal} /> }} />
        <Tabs.Screen name="history" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'folder-open' : 'folder-open-outline'} label="Vault" focused={focused} activeColor={'#638BFF'} /> }} />
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>

      <GlobalTrackerBanner />
      <DoctorFloatingBubble />
      <AuthWall />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DispatchProvider>
            <LayoutContent />
          </DispatchProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  trackerWrap: { position: 'absolute', bottom: 65, width: '100%', height: 140, alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0)', zIndex: 100, overflow: 'visible' },
  trackerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 16, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  trackerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  trackerBody: { flex: 1, marginLeft: 14 },
  trackerTitle: { color: '#fff', fontSize: RF(13), fontWeight: '800', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 },
  trackerSub: { color: 'rgba(255,255,255,0.95)', fontSize: RF(11), fontWeight: '700' },
  trackerStageBadge: { color: 'rgba(255,255,255,0.85)', fontSize: RF(11), fontWeight: '800' },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: '#fff', width: 14 },

  floatingBubble: { position: 'absolute', top: 140, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#638BFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#638BFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 12 },
  floatingBubbleStar: { position: 'absolute', top: 140, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD166', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFD166', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 12 },
  bubbleStatusPulse: { position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#00C9A7', borderWidth: 2 },

  authContainer: { ...StyleSheet.absoluteFillObject, zIndex: 999, justifyContent: 'center', padding: 22 },
  authCard: { borderWidth: 1, padding: 28, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 20 },
  authTitle: { fontSize: RF(26), fontWeight: '800', letterSpacing: -0.5 },
  authSub: { fontSize: RF(13), textAlign: 'center', marginBottom: 30 },
  authError: { color: '#E8293A', backgroundColor: 'rgba(232,41,58,0.1)', borderWidth: 1, borderColor: 'rgba(232,41,58,0.3)', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: RF(13), fontWeight: '700', textAlign: 'center' },
  authInput: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 14, fontSize: RF(15) },
  authBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  authBtnText: { color: '#fff', fontWeight: '800', fontSize: RF(15) },
});
