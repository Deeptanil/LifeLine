import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated, Easing, Modal, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View, TextInput, Image, Alert, Linking, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from '../context/DispatchContext';
import { useTheme } from '../context/ThemeContext';
import { NavigationHeader } from '../components/NavigationHeader';
import { DB } from '../db/database';
import { RF } from '../utils/Responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_WIDTH * (3000 / 1581); // Increased for longer image

const DESTINATION = { lat: 12.934486, lng: 77.534720 };
const AMBULANCE_ROUTE = [
  { lat: 12.9141, lng: 77.5878 },
  { lat: 12.9118, lng: 77.5855 },
  { lat: 12.9135, lng: 77.5750 },
  { lat: 12.9174, lng: 77.5650 },
  { lat: 12.9230, lng: 77.5550 },
  { lat: 12.9280, lng: 77.5480 },
  { lat: 12.9310, lng: 77.5410 },
  { lat: 12.9344, lng: 77.5347 },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SERVICES = [
  { icon: 'medical-outline', label: 'Ambulance', sub: '~10 min ETA', color: 'rgba(232,41,58,0.1)' },
  { icon: 'home', label: 'Medic Home', sub: 'Nurse dispatch', color: 'rgba(0,201,167,0.1)' },
  { icon: 'medical', label: 'Doctor Call', sub: 'In 2 minutes', color: 'rgba(99,139,255,0.1)' },
  { icon: 'people', label: 'Alert Family', sub: '2 contacts', color: 'rgba(245,158,11,0.1)' },
  { icon: 'cart-outline', label: 'Pharmacy', sub: 'Emergency meds', color: 'rgba(0,201,167,0.1)' },
  { icon: 'git-network', label: 'Health Checker', sub: 'Analyse Symptoms', color: 'rgba(245,158,11,0.1)' },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { dispatches, startDispatch, cancelDispatch } = useDispatch();
  const insets = useSafeAreaInsets();
  const { C, isDark } = useTheme();
  const styles = getStyles(C);

  const [modalState, setModalState] = useState<'none' | 'sos_select' | 'hospitals_list' | 'medic_symptoms'>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [medicSymptoms, setMedicSymptoms] = useState('');
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(params.dispatchId as string || null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(params.openTracker === 'true');
  const [isMapLoading, setIsMapLoading] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0.9)).current;

  const activeAmbulance = dispatches.find(d => d.type === 'ambulance');
  const activeMedic = dispatches.find(d => d.type === 'medic');
  const targetDispatch = activeTrackerId ? dispatches.find(d => d.id === activeTrackerId) : null;
  const activeDispatch = targetDispatch || activeAmbulance || activeMedic;

  const [timerStart, setTimerStart] = useState<number | null>(activeDispatch?.timerStart || null);
  const prevDispatchRef = useRef(activeDispatch?.id);

  useEffect(() => {
    if (activeDispatch && activeDispatch.id !== prevDispatchRef.current) {
      setIsTrackerOpen(true);
      prevDispatchRef.current = activeDispatch.id;
    }
    // Automated completion logic
    if (activeDispatch && activeDispatch.stage === 2) {
      setCustomAlert({
        title: "Service Reached!",
        sub: `${activeDispatch.type === 'ambulance' ? 'The ambulance' : 'The nurse'} has reached its destination and will now be unpinned.`,
        confirmText: "Acknowledge",
        onConfirm: () => {
          cancelDispatch(activeDispatch.id);
          setIsTrackerOpen(false);
        }
      });
    }
  }, [activeDispatch?.id, activeDispatch?.stage]);

  // Read route param for opening tracker from global banner
  useEffect(() => {
    if (params.openTracker === 'true') {
      setIsTrackerOpen(true);
      if (params.dispatchId) setActiveTrackerId(params.dispatchId as string);
      router.setParams({ openTracker: '' });
    }
    if (params.autoTrigger === 'true') {
      triggerAmbulanceDispatch('Fastest Available');
      router.setParams({ autoTrigger: '' });
    }
  }, [params]);

  useEffect(() => {
    DB.Hospitals.findMany().then(setHospitalsList);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1.15, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0.9, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const acknowledgeIot = () => {
    console.log("📡 Sending IoT Acknowledgment...");

    // 5-second timeout to prevent getting stuck
    const controller = new AbortController();
    const timeoutMsg = setTimeout(() => {
      controller.abort();
      console.warn("⚠️ IoT Request TIMEOUT");
    }, 5000);

    fetch("http://192.168.4.1/iot/acknowledge", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acknowledged: true }),
      signal: controller.signal
    })
      .then(res => {
        clearTimeout(timeoutMsg);
        console.log("✅ IoT Acknowledge SUCCESS:", res.status);
      })
      .catch((err) => {
        clearTimeout(timeoutMsg);
        console.log("❌ IoT Acknowledge FAILED (Expected if hardware not linked):", err.message);
      });
  };

  const triggerAmbulanceDispatch = (hospitalName: string) => {
    startDispatch({
      type: 'ambulance',
      title: `🚑 Ambulance - ${hospitalName}`,
      subtitle: 'Unit #4 is boarding. Sit tight.',
      icon: 'medical',
      data: { hospital: hospitalName }
    });

    acknowledgeIot();
    setModalState('none');
    setSearchQuery('');
  };

  const triggerMedicDispatch = () => {
    if (medicSymptoms.length < 3) return;
    startDispatch({
      type: 'medic',
      title: '🧑‍⚕️ Rapid Nurse Dispatch',
      subtitle: `Responding to: ${medicSymptoms}`,
      icon: 'home',
      data: { symptoms: medicSymptoms }
    });

    acknowledgeIot();
    setModalState('none');
    setMedicSymptoms('');
  };

  const filteredHospitals = useMemo(() => {
    return hospitalsList.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, hospitalsList]);

  // Real-time Countdown ETA specific logic
  const [etaString, setEtaString] = useState('--');

  useEffect(() => {
    if (!activeDispatch || !isTrackerOpen || activeDispatch.stage === 2) return;

    const interval = setInterval(() => {
      const msPassed = Date.now() - (activeDispatch.timerStart || Date.now());
      // Total simulated journey is approx 600,000 ms (10 minutes)
      const totalSecs = 600;
      const elapsedSecs = Math.floor(msPassed / 1000);
      const remaining = Math.max(0, totalSecs - elapsedSecs);

      const minsLeft = Math.floor(remaining / 60);

      if (activeDispatch.stage === 0) {
        setEtaString('Locating');
      } else {
        setEtaString(`${minsLeft} min`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeDispatch, isTrackerOpen]);

  const [rating, setRating] = useState(0);

  const [customAlert, setCustomAlert] = useState<{ title: string; sub: string; confirmText?: string; cancelText?: string; isDestructive?: boolean; onConfirm?: () => void } | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy} />

      <NavigationHeader title="Emergency Assistance" subtitle="Real-time SOS dispatch system" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160, flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.sosWrap}>
          <Animated.View style={[styles.ringOuter, { transform: [{ scale: ringAnim }] }, activeAmbulance && { borderColor: 'rgba(245,158,11,0.3)' }]}>
            {activeAmbulance ? (
              <TouchableOpacity onPress={() => setIsTrackerOpen(true)} activeOpacity={0.85}>
                <Animated.View style={[styles.sosBtn, { transform: [{ scale: pulseAnim }], backgroundColor: Colors.amber, shadowColor: Colors.amber }]}>
                  <Ionicons name="map" size={56} color="#fff" />
                  <Text style={[styles.sosLabel, { fontSize: RF(24), letterSpacing: 1, textAlign: 'center', lineHeight: RF(28), marginTop: 10 }]}>VIEW{'\n'}STATUS</Text>
                </Animated.View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setModalState('sos_select')} activeOpacity={0.85}>
                <Animated.View style={[styles.sosBtn, { transform: [{ scale: pulseAnim }] }]}>
                  <Ionicons name="warning" size={56} color="#fff" />
                  <Text style={styles.sosLabel}>SOS</Text>
                  <Text style={styles.sosSub}>TAP TO START</Text>
                </Animated.View>
              </TouchableOpacity>
            )}
          </Animated.View>
          <Text style={styles.sosHint}>Your location will be shared immediately</Text>
        </View>

        <View style={styles.grid}>
          {SERVICES.map((s) => {
            const isDocActive = s.label === 'Doctor Call' && dispatches.find(d => d.type === 'doctor');
            const isMedicActive = s.label === 'Medic Home' && dispatches.find(d => d.type === 'medic');
            const isAmbulanceActive = s.label === 'Ambulance' && activeAmbulance;

            const isActive = isDocActive || isMedicActive || isAmbulanceActive;
            const isMedicDisabled = s.label === 'Medic Home' && activeAmbulance && !isMedicActive;

            return (
              <AnimatedTouchable key={s.label} activeOpacity={isMedicDisabled ? 1 : 0.7} onPress={() => {
                if (isMedicDisabled) return;
                if (isActive) {
                  if (isDocActive) router.push('/doctor');
                  else setIsTrackerOpen(true);
                  return;
                }
                if (s.label === 'Ambulance') setModalState('sos_select');
                else if (s.label === 'Medic Home') setModalState('medic_symptoms');
                else if (s.label === 'Doctor Call') router.push('/doctor');
                else if (s.label === 'Alert Family') {
                  acknowledgeIot();
                  setCustomAlert({ title: 'Alert Dispatched', sub: 'Your emergency contacts have been notified with your live coordinates.' });
                }
                else if (s.label === 'Pharmacy') router.push('/medicine');
                else if (s.label === 'Health Checker') router.push('/symptoms');
                else Alert.alert('Family Alert', 'Your emergency contacts have been notified of your current location.');
              }} style={[styles.actionBtn, { backgroundColor: isActive ? C.navy3 : C.cardBg, borderColor: isActive ? C.teal : C.cardBorder }, isMedicDisabled && { opacity: 0.5 }]}>
                <View style={[styles.actionIconWrap, { backgroundColor: isActive ? 'rgba(0,201,167,0.1)' : s.color }]}>
                  <Ionicons name={isActive ? 'locate' : s.icon as any} size={22} color={isActive ? C.teal : C.textMain} />
                </View>
                <Text style={[styles.actionLabel, isActive && { color: C.teal }]}>{isMedicDisabled ? 'Ambulance on-way' : (isActive ? 'VIEW STATUS' : s.label)}</Text>
                <Text style={styles.actionSub}>{isMedicDisabled ? 'Medic unavailable' : (isActive ? 'Active Link' : s.sub)}</Text>
              </AnimatedTouchable>
            );
          })}
        </View>
      </ScrollView>

      {/* TRACKER OVERLAY MODAL */}
      <Modal transparent animationType="slide" visible={isTrackerOpen && !!activeDispatch} onRequestClose={() => setIsTrackerOpen(false)}>
        {activeDispatch && (
          <View style={{ flex: 1, backgroundColor: C.navy }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} translucent={false} />

            {/* Map Image Section - Absolute Background */}
            {(activeDispatch.stage === 0 || activeDispatch.stage === 1) && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: MAP_HEIGHT, backgroundColor: C.navy }}>
                {activeDispatch.stage === 1 ? (
                  <View style={{ width: '100%', height: '100%', backgroundColor: C.navy3, alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={require('../assets/map.png')}
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      resizeMode="cover"
                      onLoad={() => setIsMapLoading(false)}
                      onError={() => {
                        console.warn("Local map asset failed, using fallback...");
                      }}
                    />
                    {/* Fallback Static Map in case local asset fails */}
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000' }}
                      style={{ width: '100%', height: '100%', position: 'absolute', zIndex: -1 }}
                      resizeMode="cover"
                      onLoad={() => setIsMapLoading(false)}
                    />
                    {isMapLoading && (
                      <View style={{ alignItems: 'center' }}>
                        <Ionicons name="map-outline" size={40} color={C.textDim} />
                        <Text style={{ color: C.textDim, fontSize: RF(12), marginTop: 8 }}>Loading Trackers...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[styles.imgWrap, { height: '100%', backgroundColor: C.navy }]}>
                    <Ionicons name="medical" size={100} color={C.red} />
                    <Text style={{ color: C.textMain, fontSize: RF(20), fontWeight: '800', marginTop: 16, textTransform: 'uppercase', letterSpacing: 2 }}>Dispatching</Text>
                  </View>
                )}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,22,40,0.15)' }} />
              </View>
            )}

            {activeDispatch.stage === 2 && (
              <View style={{ ...StyleSheet.absoluteFill, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
                <Ionicons name="checkmark-circle" size={80} color={C.teal} style={{ marginBottom: 20 }} />
                <Text style={{ fontSize: RF(28), fontWeight: '800', color: C.textMain, marginBottom: 8 }}>Successfully Arrived</Text>
                <Text style={{ fontSize: RF(14), color: C.textMuted, textAlign: 'center', marginBottom: 40, lineHeight: 22 }}>
                  {activeDispatch.type === 'ambulance' ? 'The ambulance has reached your location. Please proceed immediately.' : 'The nurse has arrived at your door. Please open the door securely.'}
                </Text>

                <View style={{ width: '100%', backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder, padding: 24, borderRadius: 24 }}>
                  <Text style={{ fontSize: RF(15), fontWeight: '800', color: C.textMain, textAlign: 'center', marginBottom: 16 }}>Rate The Service Provider</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 30 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Ionicons name={star <= rating ? "star" : "star-outline"} size={36} color="#FFD166" />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.cancelMapBtn, { backgroundColor: C.teal, borderColor: 'rgba(0,201,167,0.3)' }]}
                    onPress={() => {
                      setCustomAlert({
                        title: "Stop Mission?",
                        sub: "Are you sure you want to stop this rescue mission?",
                        confirmText: "Stop Mission",
                        cancelText: "Go Back",
                        isDestructive: true,
                        onConfirm: () => {
                          cancelDispatch(activeDispatch.id);
                          setIsTrackerOpen(false);
                        }
                      });
                    }}>
                    <Text style={styles.cancelMapText}>Submit & Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* UI overlay if not in Stage 2 Review */}
            {activeDispatch.stage < 2 && (
              <View style={{ flex: 1, pointerEvents: 'box-none', paddingTop: insets.top }}>
                <View style={styles.trackerHeaderRow}>
                  <TouchableOpacity
                    style={[styles.collapseBtn, activeDispatch.stage === 0 && { backgroundColor: C.navy3, borderColor: C.cardBorder }]}
                    onPress={() => setIsTrackerOpen(false)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="contract" size={24} color={activeDispatch.stage === 0 ? C.textMain : "#fff"} />
                    <Text style={[styles.collapseText, { color: activeDispatch.stage === 0 ? C.textMain : "#fff" }]}>Collapse</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                </View>

                <View style={styles.bottomSheetMap}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.stageTitle} numberOfLines={1}>
                        {activeDispatch.stage === 0 ? (activeDispatch.type === 'medic' ? 'Searching...' : 'Assigning Unit...') : 'On the way'}
                      </Text>
                      <Text style={styles.stageSub}>
                        {activeDispatch.stage === 0 ? (activeDispatch.type === 'medic' ? 'Locating closest nurse.' : 'Locating closest driver.') : (activeDispatch.type === 'ambulance' ? 'Driver: Ravi K. (KA-03-MX-6672)' : 'Nurse: Sister Mary')}
                      </Text>
                    </View>

                    <View style={styles.timeBox}>
                      <Text style={{ fontSize: RF(22), fontWeight: '800', color: C.teal }}>{etaString}</Text>
                      <Text style={{ fontSize: RF(10), color: C.textMuted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>ETA</Text>
                    </View>
                  </View>

                  {activeDispatch.stage >= 1 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, padding: 16, borderRadius: 16, marginBottom: 24 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(99,139,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Ionicons name="person" size={20} color="#638BFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: RF(16), fontWeight: '800', color: C.textMain }}>{activeDispatch.type === 'medic' ? 'Sister Mary' : 'Ravi Kumar'}</Text>
                        <Text style={{ fontSize: RF(13), color: C.textMuted, fontWeight: '600' }}>{activeDispatch.type === 'medic' ? '+91 88888 77777' : '+91 98765 43210'}</Text>
                      </View>
                      <TouchableOpacity
                        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => {
                          setCustomAlert({ title: "Connecting...", sub: "Routing your call to the driver securely." });
                          setTimeout(() => {
                            Linking.openURL('tel:+919999999999');
                            setCustomAlert(null);
                          }, 1000);
                        }}
                      >
                        <Ionicons name="call" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.cancelMapBtn, { width: '100%' }]}
                    onPress={() => {
                      setCustomAlert({
                        title: "Stop Dispatch?",
                        sub: "Are you sure you want to stop this rescue mission?",
                        confirmText: "Stop Dispatch",
                        cancelText: "Go Back",
                        isDestructive: true,
                        onConfirm: () => {
                          cancelDispatch(activeDispatch.id);
                          setIsTrackerOpen(false);
                        }
                      });
                    }}>
                    <Text style={styles.cancelMapText}>Stop Dispatch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Inline Custom Alert Overlay to fix iOS Modal Nesting */}
            {!!customAlert && isTrackerOpen && (
              <View style={[StyleSheet.absoluteFill, styles.alertBg, { zIndex: 100, borderRadius: 30 }]}>
                <View style={styles.alertBox}>
                  <Text style={styles.alertTitle}>{customAlert.title}</Text>
                  <Text style={styles.alertSub}>{customAlert.sub}</Text>
                  <View style={styles.alertActions}>
                    <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setCustomAlert(null)}>
                      <Text style={{ color: C.textMuted, fontWeight: '700', fontSize: RF(14) }}>{customAlert.cancelText || 'Go Back'}</Text>
                    </TouchableOpacity>
                    {customAlert.confirmText && (
                      <TouchableOpacity
                        style={[styles.alertConfirmBtn, customAlert.isDestructive && { backgroundColor: C.redDark, borderColor: C.red }]}
                        onPress={() => { customAlert.onConfirm && customAlert.onConfirm(); setCustomAlert(null); }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: RF(14) }}>{customAlert.confirmText}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </Modal>

      {/* Hospitals List Modal */}
      <Modal transparent animationType="slide" visible={modalState === 'hospitals_list'} onRequestClose={() => setModalState('none')}>
        <View style={styles.fullSheetBg}>
          <View style={[styles.fullSheet, { paddingTop: insets.top || 20, paddingBottom: insets.bottom || 20 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Verified Hospitals</Text>
              <TouchableOpacity onPress={() => setModalState('none')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarBox}>
              <Ionicons name="search" size={18} color={C.textDim} />
              <TextInput
                style={styles.hospitalSearchInput}
                placeholder="Search by hospital name or area..."
                placeholderTextColor={C.textDim}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}>
              {filteredHospitals.map(h => (
                <View key={h.id} style={styles.hospitalCard}>
                  <View style={styles.hospTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hospName}>{h.name}</Text>
                      <Text style={styles.hospLoc}>{h.location} • <Text style={{ color: C.teal }}>{h.dist}</Text></Text>
                    </View>
                  </View>
                  <View style={styles.hospBtns}>
                    <TouchableOpacity
                      style={styles.hospCallBtn}
                      onPress={() => {
                        setCustomAlert({ title: "Connecting Hospital...", sub: `Routing your call to ${h.name} desk.` });
                        setTimeout(() => {
                          Linking.openURL('tel:+919999999999');
                          setCustomAlert(null);
                        }, 1000);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={20} color="#638BFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hospDispatchBtn} onPress={() => triggerAmbulanceDispatch(h.name)} activeOpacity={0.8}>
                      <Text style={styles.hospDispatchText} numberOfLines={1} adjustsFontSizeToFit>Dispatch Ambulance</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SOS Type Selection Modal */}
      <Modal transparent animationType="fade" visible={modalState === 'sos_select'} onRequestClose={() => setModalState('none')}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <View style={styles.modalHeaderRow}>
              <Ionicons name="nuclear" size={32} color={C.red} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.modalTitle}>Dispatch Type</Text>
                <Text style={styles.modalSub}>How should we route your emergency?</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.fastestAction} onPress={() => triggerAmbulanceDispatch('Fastest Available')} activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="flash" size={18} color="#FF8A94" style={{ marginRight: 6 }} />
                <Text style={styles.fastestTitle}>Fastest Ambulance</Text>
              </View>
              <Text style={styles.fastestSub}>Automatically dispatch the closest unit to your coordinates immediately.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.specificAction} onPress={() => setModalState('hospitals_list')} activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="business" size={18} color={C.textMain} style={{ marginRight: 6 }} />
                <Text style={styles.specificTitle}>Specific Hospital</Text>
              </View>
              <Text style={styles.specificSub}>Browse verified hospitals in Bangalore to dispatch their proprietary units.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelModalBtn, { borderWidth: 1.5, borderColor: C.red, backgroundColor: 'transparent', borderRadius: 16, marginTop: 10 }]} onPress={() => setModalState('none')} activeOpacity={0.7}>
              <Text style={{ color: C.red, fontWeight: '800', fontSize: RF(15) }}>Cancel</Text>
            </TouchableOpacity>

            {/* Inline Custom Alert Overlay to fix SOS Interaction */}
            {!!customAlert && modalState === 'sos_select' && (
              <View style={[StyleSheet.absoluteFill, styles.alertBg, { zIndex: 100, borderRadius: 24, margin: -1 }]}>
                <View style={styles.alertBox}>
                  <Text style={styles.alertTitle}>{customAlert.title}</Text>
                  <Text style={styles.alertSub}>{customAlert.sub}</Text>
                  <View style={styles.alertActions}>
                    <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setCustomAlert(null)}>
                      <Text style={{ color: C.textMuted, fontWeight: '700', fontSize: RF(14) }}>{customAlert.cancelText || 'Close'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Medic Symptoms Modal */}
      <Modal transparent animationType="slide" visible={modalState === 'medic_symptoms'} onRequestClose={() => setModalState('none')}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <View style={styles.modalHeaderRow}>
              <Ionicons name="pulse" size={32} color="#638BFF" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.modalTitle}>Request Home Nurse</Text>
                <Text style={styles.modalSub}>Detail the patient's symptoms so we dispatch the right medic.</Text>
              </View>
            </View>

            <TextInput
              style={[styles.symptomsBox, { color: C.textMain }]}
              multiline
              placeholder="E.g., High fever since morning..."
              placeholderTextColor={Colors.textDim}
              value={medicSymptoms}
              onChangeText={setMedicSymptoms}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.specificAction, medicSymptoms.length < 3 && { opacity: 0.5 }, { backgroundColor: '#638BFF', borderColor: '#638BFF' }]}
              onPress={triggerMedicDispatch}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: RF(16), fontWeight: '800', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>Dispatch Nurse</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => { setModalState('none'); setMedicSymptoms(''); }} activeOpacity={0.7}>
              <Text style={{ color: Colors.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Global generic alert modal */}
      <Modal transparent animationType="fade" visible={!!customAlert && modalState === 'none' && !isTrackerOpen} onRequestClose={() => setCustomAlert(null)}>
        <View style={styles.alertBg}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{customAlert?.title}</Text>
            <Text style={styles.alertSub}>{customAlert?.sub}</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setCustomAlert(null)}>
                <Text style={{ color: C.textMuted, fontWeight: '700', fontSize: RF(14) }}>{customAlert?.cancelText || 'Close'}</Text>
              </TouchableOpacity>
              {customAlert?.confirmText && (
                <TouchableOpacity
                  style={[styles.alertConfirmBtn, customAlert.isDestructive && { backgroundColor: C.redDark, borderColor: C.red }]}
                  onPress={() => { customAlert.onConfirm && customAlert.onConfirm(); setCustomAlert(null); }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: RF(14) }}>{customAlert.confirmText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  sosWrap: { alignItems: 'center', paddingVertical: 10, marginBottom: 50 },
  ringOuter: {
    width: 250, height: 250, borderRadius: 125,
    borderWidth: 2, borderColor: 'rgba(232,41,58,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosBtn: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.redDark,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    shadowColor: C.red, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 15,
  },
  sosLabel: { fontSize: RF(36), fontWeight: '800', color: '#fff', letterSpacing: 4, marginTop: 6 },
  sosSub: { fontSize: RF(11), color: 'rgba(255,255,255,0.75)', letterSpacing: 2 },
  sosHint: { fontSize: RF(12), color: C.textDim, letterSpacing: 0.3, marginTop: 24, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 22, marginTop: 30 },
  actionBtn: { width: '48%', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 14 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: RF(13), fontWeight: '600', color: C.textMain, marginBottom: 2 },
  actionSub: { fontSize: RF(11), color: C.textMuted },
  symptomsBox: { backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 16, padding: 16, color: C.textMain, height: 120, marginBottom: 20, fontSize: RF(14) },
  modalBg: { flex: 1, backgroundColor: 'rgba(10,22,40,0.92)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { backgroundColor: C.navy2, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 24, padding: 24, width: '100%' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: RF(20), fontWeight: '800', color: C.textMain },
  modalSub: { fontSize: RF(13), color: C.textMuted, marginTop: 2 },
  fastestAction: { backgroundColor: 'rgba(232,41,58,0.12)', borderWidth: 1, borderColor: 'rgba(232,41,58,0.4)', padding: 18, borderRadius: 16, marginBottom: 16 },
  fastestTitle: { color: '#FF8A94', fontSize: RF(16), fontWeight: '800' },
  fastestSub: { color: C.textMuted, fontSize: RF(12), lineHeight: 18 },
  specificAction: { backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, padding: 18, borderRadius: 16, marginBottom: 20 },
  specificTitle: { color: C.textMain, fontSize: RF(16), fontWeight: '800' },
  specificSub: { color: C.textMuted, fontSize: RF(12), lineHeight: 18 },
  cancelModalBtn: { alignItems: 'center', paddingVertical: 12 },
  fullSheetBg: { flex: 1, backgroundColor: 'rgba(10,22,40,0.85)', justifyContent: 'flex-end' },
  fullSheet: { backgroundColor: C.navy2, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', paddingHorizontal: 22, paddingTop: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: RF(20), fontWeight: '800', color: C.textMain },
  searchBarBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 16, paddingVertical: 0, borderRadius: 14, marginBottom: 16 },
  hospitalSearchInput: { flex: 1, marginLeft: 10, paddingVertical: 14, color: C.textMain, fontSize: RF(14) },
  hospitalCard: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 18, padding: 16, marginBottom: 12 },
  hospTop: { marginBottom: 16 },
  hospName: { fontSize: RF(16), fontWeight: '700', color: C.textMain, marginBottom: 4 },
  hospLoc: { fontSize: RF(13), color: C.textMuted },
  hospBtns: { flexDirection: 'row', gap: 10 },
  hospCallBtn: { width: 50, height: 46, borderRadius: 12, backgroundColor: 'rgba(99,139,255,0.1)', borderWidth: 1, borderColor: 'rgba(99,139,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  hospDispatchBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  hospDispatchText: { color: '#fff', fontWeight: '800', fontSize: RF(14) },
  imgWrap: { backgroundColor: 'rgba(10,22,40,0.92)', alignItems: 'center', justifyContent: 'center' },
  trackerHeaderRow: { flexDirection: 'row', padding: 16 },
  collapseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  collapseText: { color: C.textMain, fontWeight: '800', fontSize: RF(14) },
  bottomSheetMap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.navy2, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 30, borderWidth: 1, borderColor: C.cardBorder },
  stageTitle: { fontSize: RF(22), fontWeight: '800', color: C.textMain, marginBottom: 4 },
  stageSub: { fontSize: RF(14), color: C.textMuted },
  timeBox: { alignItems: 'center', backgroundColor: 'rgba(0,201,167,0.1)', borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  cancelMapBtn: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: C.red, alignItems: 'center' },
  cancelMapText: { color: C.red, fontSize: RF(15), fontWeight: '800' },
  alertBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  alertBox: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 20, padding: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  alertTitle: { fontSize: RF(22), fontWeight: '800', color: C.textMain, marginBottom: 8 },
  alertSub: { fontSize: RF(16), color: C.textMuted, lineHeight: 22, marginBottom: 24 },
  alertActions: { flexDirection: 'row', gap: 12 },
  alertCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.navy3, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  alertConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.red, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,41,58,0.3)' },
});
