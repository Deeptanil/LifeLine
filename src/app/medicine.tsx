import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator, Linking, Modal, ScrollView, StatusBar, TextInput,
  StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, Platform, Animated
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
const RIDER_ROUTE = [
  { lat: 12.9544, lng: 77.5047 },
  { lat: 12.9490, lng: 77.5120 },
  { lat: 12.9460, lng: 77.5180 },
  { lat: 12.9410, lng: 77.5240 },
  { lat: 12.9370, lng: 77.5300 },
  { lat: 12.9344, lng: 77.5347 },
];

const CATEGORIES = ['All', 'Fever', 'Pain Relief', 'Antibiotics', 'Diabetes', 'Cardiac', 'Asthma'];

export default function MedicineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { dispatches, startDispatch, cancelDispatch } = useDispatch();
  const insets = useSafeAreaInsets();
  const { C, isDark } = useTheme();
  const styles = getStyles(C);
  const activeOrder = dispatches.find(d => d.type === 'medicine');

  const [isTrackerOpen, setIsTrackerOpen] = useState(params.openTracker === 'true');
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rx' | 'cart'>('cart');
  const prevDispatchRef = useRef(activeOrder?.id);

  useEffect(() => {
    if (activeOrder && activeOrder.id !== prevDispatchRef.current) {
        setIsTrackerOpen(true);
        prevDispatchRef.current = activeOrder.id;
    }
  }, [activeOrder]);

  useEffect(() => {
    if (params.openTracker === 'true') {
      setIsTrackerOpen(true);
      router.setParams({ openTracker: '' }); 
    }
    // Navigate to delivery tab and add item if coming from symptoms
    if (params.tab === 'delivery') {
      setTab('delivery');
      router.setParams({ tab: '' });
    }
    if (params.addItem) {
      const itemName = String(params.addItem);
      setCart(prev => ({ ...prev, [itemName]: (prev[itemName] || 0) + 1 }));
      router.setParams({ addItem: '' });
    }
  }, [params]);

  const [tab, setTab] = useState<'delivery' | 'finder'>('delivery');
  const [onlyOpen, setOnlyOpen] = useState(true);

  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  
  const [checkoutModal, setCheckoutModal] = useState(false); 
  const [rxModal, setRxModal] = useState(false);
  const [rxStep, setRxStep] = useState<'idle' | 'uploading' | 'verifying' | 'approved'>('idle');

  const [customAlert, setCustomAlert] = useState<{ title: string; sub: string; confirmText?: string; cancelText?: string; isDestructive?: boolean; onConfirm?: () => void } | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    if (activeOrder && activeOrder.stage === 2) {
       setCustomAlert({
          title: "Medicine Reached!",
          sub: "Your medicine has been delivered and will now be unpinned.",
          confirmText: "Acknowledge",
          onConfirm: () => {
             cancelDispatch(activeOrder.id);
             setIsTrackerOpen(false);
          }
       });
    }
  }, [activeOrder?.id, activeOrder?.stage]);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [displayedPharmacies, setDisplayedPharmacies] = useState<any[]>([]);

  useEffect(() => {
    DB.Medicines.findMany().then(setAllProducts);
  }, []);

  useEffect(() => {
    DB.Medicines.findByCategory(activeCategory).then(setDisplayedProducts);
  }, [activeCategory]);

  useEffect(() => {
    DB.Pharmacies.findMany(onlyOpen).then(setDisplayedPharmacies);
  }, [onlyOpen]);

  const addToCart = (name: string) => { setCart((prev) => ({ ...prev, [name]: (prev[name] || 0) + 1 })); };
  const removeFromCart = (name: string) => {
    setCart((prev) => {
      const newQty = (prev[name] || 0) - 1;
      const next = { ...prev };
      if (newQty <= 0) delete next[name];
      else next[name] = newQty;
      return next;
    });
  };

  const hasRxItems = Object.keys(cart).some(itemName => {
    const prod = allProducts.find(p => p.name === itemName);
    return prod?.rx;
  });

  const initiateCheckout = () => {
    if (isProcessing) return;
    if (hasRxItems) {
      setRxModal(true);
      setRxStep('idle');
    } else {
      processPaymentDirectly();
    }
  };

  const processPaymentDirectly = () => {
    setIsProcessing(true);
    setCheckoutModal(true);
    setTimeout(() => {
      setCheckoutModal(false);
      setIsProcessing(false);
      const items = Object.keys(cart);
      const total = Object.entries(cart).reduce((sum, [name, qty]) => {
        const prod = allProducts.find(p => p.name === name);
        return sum + (prod ? prod.price * qty : 0);
      }, 0);
      setCart({});
      startDispatch({
         type: 'medicine',
         title: 'Express Delivery',
         subtitle: `Processing ${items.length} item(s)`,
         icon: 'cart',
         data: { items, total },
      });
      // Open tracker directly instead of going home
      setIsTrackerOpen(true);
    }, 100); 
  };

  const handleRxUpload = () => {
    setRxStep('uploading');
    setTimeout(() => {
      setRxStep('verifying');
      setTimeout(() => {
        setRxStep('approved');
        setTimeout(() => {
           setRxModal(false);
           processPaymentDirectly();
        }, 1500);
      }, 3000);
    }, 1500);
  };

  const openMaps = (name: string, address: string) => {
    const query = encodeURIComponent(`${name} ${address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [name, qty]) => {
    const prod = allProducts.find(p => p.name === name);
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  const [isProcessing, setIsProcessing] = useState(false);
  const stageNum = activeOrder ? activeOrder.stage : 0;

  // Live countdown for delivery ETA
  const [etaString, setEtaString] = useState('10 mins');
  useEffect(() => {
    if (!activeOrder || activeOrder.stage === 2) return;
    const interval = setInterval(() => {
      const msPassed = Date.now() - (activeOrder.timerStart || Date.now());
      const totalSecs = 600; // 10 mins
      const elapsedSecs = Math.floor(msPassed / 1000);
      const remainingSecs = Math.max(0, totalSecs - elapsedSecs);
      
      const minsLeft = Math.ceil(remainingSecs / 60);
      setEtaString(`${minsLeft} min${minsLeft === 1 ? '' : 's'}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.stage]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.navy }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} />
      
      {/* MEDICINE TRACKER MODAL */}
      <Modal transparent animationType="slide" visible={isTrackerOpen && !!activeOrder} onRequestClose={() => setIsTrackerOpen(false)}>
        {activeOrder && (
           <View style={{ flex: 1, backgroundColor: C.navy }}>
             <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} translucent={false} />
             
             {/* Map Image Section - Absolute Background */}
             {(stageNum === 0 || stageNum === 1) && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: MAP_HEIGHT, backgroundColor: C.navy }}>
                    {stageNum === 1 ? (
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
                              <Text style={{ color: C.textDim, fontSize: RF(12), marginTop: 8 }}>Tracking Delivery...</Text>
                           </View>
                         )}
                      </View>
                    ) : (
                     <View style={[styles.imgWrap, { height: '100%', backgroundColor: C.navy }]}>
                        <Ionicons name="cube" size={100} color="#FFD700" />
                        <Text style={{ color: C.textMain, fontSize: RF(20), fontWeight: '800', marginTop: 16, textTransform: 'uppercase', letterSpacing: 2 }}>Order Confirmed</Text>
                     </View>
                   )}
                   <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,22,40,0.15)' }} />
                 </View>
              )}

             {stageNum === 2 && (
                <View style={{ ...StyleSheet.absoluteFill, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
                  <Ionicons name="checkmark-done-circle" size={80} color={C.teal} style={{ marginBottom: 20 }} />
                  <Text style={{ fontSize: RF(28), fontWeight: '800', color: C.textMain, marginBottom: 8 }}>Order Delivered</Text>
                  <Text style={{ fontSize: RF(13), color: C.textMuted, textAlign: 'center', marginBottom: 40, lineHeight: 22 }}>
                    Your medicine packet was securely handed over. Stay healthy.
                  </Text>
                  
                  <View style={{ width: '100%', backgroundColor: C.cardBg, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: C.cardBorder }}>
                     <Text style={{ fontSize: RF(15), fontWeight: '800', color: C.textMain, textAlign: 'center', marginBottom: 16 }}>Rate The Delivery</Text>
                     <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 30 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <TouchableOpacity key={star} onPress={() => setRatingStars(star)}>
                            <Ionicons name={star <= ratingStars ? 'star' : 'star-outline'} size={36} color="#FFD166" />
                          </TouchableOpacity>
                        ))}
                     </View>
                     <TouchableOpacity style={[{ backgroundColor: C.teal, paddingVertical: 14, borderRadius: 16, alignItems: 'center', width: '100%' }, ratingStars === 0 && { opacity: 0.5 }]} disabled={ratingStars === 0} onPress={() => {
                        cancelDispatch(activeOrder.id);
                        setIsTrackerOpen(false);
                        setRatingStars(0);
                     }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: RF(15) }}>Acknowledge Delivery</Text>
                     </TouchableOpacity>
                  </View>
                </View>
              )}

             {stageNum < 2 && (
               <View style={{ flex: 1, pointerEvents: 'box-none', zIndex: 10, paddingTop: insets.top }}>
                  <View style={{ flexDirection: 'row', padding: 16 }}>
                     <TouchableOpacity 
                        style={[styles.collapseBtn, stageNum === 0 && { backgroundColor: C.navy3, borderColor: C.cardBorder }]} 
                        onPress={() => setIsTrackerOpen(false)} 
                        activeOpacity={0.8}
                     >
                        <Ionicons name="contract" size={24} color={stageNum === 0 ? C.textMain : "#fff"} />
                        <Text style={{ color: stageNum === 0 ? C.textMain : "#fff", fontWeight: '800', fontSize: RF(14) }}>Collapse</Text>
                     </TouchableOpacity>
                  </View>

                 <View style={styles.bottomSheetMap}>
                     <View style={styles.etaCard}>
                         <View style={{ flex: 1 }}>
                           <Text style={styles.etaLabel}>Estimated Delivery</Text>
                           <Text style={styles.etaTime}>{etaString}</Text>
                           <Text style={styles.etaSub}>{stageNum === 0 ? 'Packing items...' : 'Rider is on-way.'}</Text>
                         </View>
                        <View style={styles.etaIconWrap}>
                          <Ionicons name={stageNum === 0 ? 'cube' : 'bicycle'} size={24} color={C.teal} />
                        </View>
                     </View>

                    {stageNum >= 1 && (
                       <View style={styles.riderCard}>
                         <View style={styles.riderAvatar}><Ionicons name="bicycle" size={24} color={C.teal} /></View>
                         <View style={{ flex: 1 }}>
                           <Text style={styles.riderName}>Ramu K.</Text>
                           <Text style={styles.riderDetails}>+91 9123456789</Text>
                         </View>
                         <TouchableOpacity 
                            style={styles.riderCallBtn} 
                            onPress={() => {
                               setCustomAlert({ title: "Connecting...", sub: "Routing call to rider." });
                               setTimeout(() => {
                                  Linking.openURL('tel:+919123456789');
                                  setCustomAlert(null);
                               }, 1000);
                            }}
                          >
                           <Ionicons name="call" size={20} color={C.teal} />
                         </TouchableOpacity>
                       </View>
                    )}

                    <TouchableOpacity 
                      style={[styles.destructiveBtnOutline, { width: '100%' }]}
                      onPress={() => {
                        setCustomAlert({
                          title: "Cancel Order?",
                          sub: "Are you sure you want to stop this medicine delivery?",
                          confirmText: "Cancel Order",
                          cancelText: "Keep Order",
                          isDestructive: true,
                          onConfirm: () => {
                            cancelDispatch(activeOrder.id);
                             setIsTrackerOpen(false);
                          }
                        });
                      }}>
                      <Text style={styles.destructiveBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                 </View>
                </View>
              )}

              {!!customAlert && isTrackerOpen && (
                 <View style={[StyleSheet.absoluteFill, styles.alertBg, { zIndex: 100 }]}>
                    <View style={[styles.alertBox, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                      <Text style={[styles.alertTitle, { color: C.textMain }]}>{customAlert.title}</Text>
                      <Text style={[styles.alertSub, { color: C.textMuted }]}>{customAlert.sub}</Text>
                      <View style={styles.alertActions}>
                         <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setCustomAlert(null)}>
                            <Text style={{ color: '#8A9DC9', fontWeight: '700', fontSize: RF(14) }}>{customAlert.cancelText || 'Back'}</Text>
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

      <NavigationHeader title="Pharmacy Store" subtitle="Order medicines & essentials" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        <View style={styles.tabContainer}>
           <TouchableOpacity style={[styles.tabBtn, tab === 'delivery' && styles.tabActive]} onPress={() => setTab('delivery')} activeOpacity={0.8}>
              <Text style={[styles.tabText, tab === 'delivery' && styles.tabTextActive]}>Instant Delivery</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.tabBtn, tab === 'finder' && styles.tabActive]} onPress={() => setTab('finder')} activeOpacity={0.8}>
              <Text style={[styles.tabText, tab === 'finder' && styles.tabTextActive]}>Find Pharmacy</Text>
           </TouchableOpacity>
        </View>
        
        {tab === 'delivery' && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.catScroll, { marginTop: 10 }]}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setActiveCategory(c)} activeOpacity={0.8}>
                  <View style={[styles.catChip, activeCategory === c && styles.catChipActive]}>
                    <Text style={[styles.catText, activeCategory === c && styles.catTextActive]}>{c}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.productList}>
              {displayedProducts.map((p) => {
                const qty = cart[p.name] || 0;
                return (
                  <View key={p.name} style={styles.productCard}>
                    <View style={styles.productImg}>
                       <Ionicons name={p.icon as any} size={28} color={C.textMain} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                         <Text style={styles.productType}>{p.type}</Text>
                         {p.rx && (
                           <View style={styles.rxBadge}><Text style={styles.rxText}>Rx</Text></View>
                         )}
                      </View>
                      <Text style={styles.productPrice}>₹{p.price}</Text>
                    </View>
                    
                    {qty === 0 ? (
                      <TouchableOpacity onPress={() => addToCart(p.name)} activeOpacity={0.8}>
                        <View style={styles.addBtn}><Ionicons name="add" size={20} color="#fff" /></View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepperWrap}>
                        <TouchableOpacity onPress={() => removeFromCart(p.name)} activeOpacity={0.7}>
                          <View style={styles.stepperBtn}><Ionicons name="remove" size={18} color="#fff" /></View>
                        </TouchableOpacity>
                        <Text style={styles.stepperQty}>{qty}</Text>
                        <TouchableOpacity onPress={() => addToCart(p.name)} activeOpacity={0.7}>
                          <View style={styles.stepperBtn}><Ionicons name="add" size={18} color="#fff" /></View>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {tab === 'finder' && (
          <View style={{ paddingHorizontal: 22, marginTop: 16 }}>
            <View style={styles.filterRow}>
               <Text style={styles.finderSectionTitle}>Verified local pharmacies</Text>
               <TouchableOpacity onPress={() => setOnlyOpen(!onlyOpen)} activeOpacity={0.8} style={[styles.filterChip, onlyOpen && styles.filterChipActive]}>
                  <View style={[styles.filterDot, onlyOpen && { backgroundColor: '#fff' }]} />
                  <Text style={[styles.filterChipText, onlyOpen && { color: '#fff' }]}>Open Now</Text>
               </TouchableOpacity>
            </View>

            {displayedPharmacies.map((p) => (
              <View key={p.id} style={styles.pharmacyCard}>
                 <View style={styles.pharmTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pharmName}>{p.name}</Text>
                      <Text style={styles.pharmAddr}>{p.address}</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, alignItems: 'center' }}>
                         <Text style={[styles.pharmStatus, { color: p.open ? C.teal : C.red }]}>
                           {p.open ? '● Open Now' : '● Closed'}
                         </Text>
                         <Text style={styles.pharmDist}>{p.dist} away</Text>
                      </View>
                    </View>
                 </View>
                 <View style={styles.pharmBtns}>
                     <TouchableOpacity 
                        onPress={() => {
                           setCustomAlert({ title: "Connecting Store...", sub: `Routing your call to ${p.name}.` });
                           setTimeout(() => {
                               Linking.openURL('tel:+919999999999');
                               setCustomAlert(null);
                           }, 1000);
                        }} 
                        activeOpacity={0.8} 
                        style={styles.pharmBtnSecondary}
                     >
                       <Ionicons name="call" size={18} color="#638BFF" style={{ marginRight: 6 }} />
                       <Text style={styles.pharmBtnSecText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openMaps(p.name, p.address)} activeOpacity={0.8} style={styles.pharmBtnPrimary}>
                       <Text style={styles.pharmBtnPriText}>Get Directions</Text>
                    </TouchableOpacity>
                 </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {tab === 'delivery' && totalItems > 0 && (
        <View style={styles.cartBarWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, maxHeight: 80 }}>
             {Object.entries(cart).map(([name, qty]) => (
                <View key={name} style={styles.miniCartItem}>
                   <Text style={{ color: C.textMain, fontSize: RF(11), fontWeight: '700' }}>{name.split(' ')[0]} x{qty}</Text>
                   <TouchableOpacity onPress={() => removeFromCart(name)}>
                      <Ionicons name="close-circle" size={16} color={C.red} />
                   </TouchableOpacity>
                </View>
             ))}
          </ScrollView>

          <View style={styles.cartBar}>
            <View>
              <Text style={{ color: C.textMain, fontWeight: '700', fontSize: RF(16) }}>
                ₹{totalPrice}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                 {hasRxItems && <View style={styles.miniRx}><Text style={{ color: '#fff', fontSize: RF(9), fontWeight: '800' }}>Rx</Text></View>}
                 <Text style={{ color: C.textMuted, fontSize: RF(12) }}>
                   {totalItems} item{totalItems > 1 ? 's' : ''} • 8–12 min
                 </Text>
              </View>
            </View>
            <TouchableOpacity 
               onPress={initiateCheckout} 
               activeOpacity={0.85} 
               disabled={!!activeOrder && activeOrder.stage < 2}
            >
              <View style={[
                styles.checkoutBtn, 
                !!activeOrder && activeOrder.stage < 2 && { backgroundColor: C.navy3, opacity: 0.8, borderWidth: 1, borderColor: C.cardBorder }
              ]}>
                <Text style={{ 
                  color: !!activeOrder && activeOrder.stage < 2 ? C.textMuted : '#fff', 
                  fontWeight: '800', 
                  fontSize: RF(14) 
                }}>
                  {!!activeOrder && activeOrder.stage < 2 ? 'Order on the way' : 'Checkout →'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Global generic alert modal */}
      <Modal transparent animationType="fade" visible={!!customAlert && !isTrackerOpen} onRequestClose={() => setCustomAlert(null)}>
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

      {/* Prescription Upload Modal */}
      <Modal transparent animationType="slide" visible={rxModal} onRequestClose={() => setRxModal(false)}>
        <View style={[styles.alertBg, { backgroundColor: isDark ? 'rgba(10,22,40,0.95)' : 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.rxBox, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(232,41,58,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
               <Ionicons name={rxStep === 'approved' ? 'checkmark-circle' : 'document-text'} size={32} color={rxStep === 'approved' ? C.teal : C.red} />
            </View>
            
            <Text style={[styles.alertTitle, { color: C.textMain }]}>
              {rxStep === 'idle' ? 'Prescription Required' : 
               rxStep === 'uploading' ? 'Uploading...' : 
               rxStep === 'verifying' ? 'Verifying...' : 'Verified!'}
            </Text>
            <Text style={[styles.alertSub, { textAlign: 'center', color: C.textMuted }]}>
              {rxStep === 'idle' ? 'One or more items in your cart require a valid medical prescription for checkout.' : 
               rxStep === 'uploading' ? 'Sending your document to our secure pharmacy server...' : 
               rxStep === 'verifying' ? 'Our Pharmacist is cross-referencing your items with the prescription.' : 'Your prescription has been approved. Starting delivery.'}
            </Text>

            {rxStep === 'idle' ? (
              <View style={{ width: '100%', gap: 12 }}>
                <TouchableOpacity 
                   style={[styles.alertConfirmBtn, { flex: 0, width: '100%' }]} 
                   onPress={handleRxUpload}
                   activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 2 }}>
                    <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: RF(14) }}>Capture & Upload</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.alertCancelBtn, { flex: 0, width: '100%' }]} 
                   onPress={() => setRxModal(false)}
                   activeOpacity={0.7}
                >
                  <Text style={{ color: C.textMuted, fontWeight: '700', fontSize: RF(14) }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : rxStep !== 'approved' ? (
              <View style={{ height: 4, width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                 <Animated.View style={{ height: '100%', width: '60%', backgroundColor: C.red }} />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  textDisabled: { color: C.textDim },
  tabContainer: { flexDirection: 'row', backgroundColor: C.navy3, borderRadius: 12, padding: 4, marginHorizontal: 22 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabText: { color: C.textMuted, fontWeight: '600', fontSize: RF(13) },
  tabTextActive: { color: C.textMain, fontWeight: '800' },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  finderSectionTitle: { fontSize: RF(15), fontWeight: '800', color: C.textMain },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  filterChipActive: { backgroundColor: C.teal, borderColor: C.teal },
  filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.textDim },
  filterChipText: { fontSize: RF(12), fontWeight: '700', color: C.textMuted },
  pharmacyCard: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 18, padding: 16, marginBottom: 14 },
  pharmTop: { marginBottom: 16 },
  pharmName: { fontSize: RF(16), fontWeight: '800', color: C.textMain, marginBottom: 4 },
  pharmAddr: { fontSize: RF(13), color: C.textMuted, lineHeight: 18 },
  pharmStatus: { fontSize: RF(13), fontWeight: '800' },
  pharmDist: { fontSize: RF(13), fontWeight: '600', color: C.textDim },
  pharmBtns: { flexDirection: 'row', gap: 10 },
  pharmBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(99,139,255,0.12)', borderWidth: 1, borderColor: 'rgba(99,139,255,0.25)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  pharmBtnSecText: { color: '#638BFF', fontWeight: '800', fontSize: RF(14) },
  pharmBtnPrimary: { flex: 1.5, paddingVertical: 14, borderRadius: 12, backgroundColor: C.teal, alignItems: 'center' },
  pharmBtnPriText: { color: '#fff', fontWeight: '800', fontSize: RF(14) },
  catScroll: { paddingHorizontal: 22, gap: 10, paddingBottom: 10 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder },
  catChipActive: { backgroundColor: 'rgba(232,41,58,0.12)', borderColor: 'rgba(232,41,58,0.35)' },
  catText: { fontSize: RF(13), fontWeight: '600', color: C.textMuted },
  catTextActive: { color: '#FF8A94', fontWeight: '800' },
  productList: { paddingHorizontal: 22, gap: 14 },
  productCard: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  productImg: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.navy3, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: RF(16), fontWeight: '800', color: C.textMain },
  productType: { fontSize: RF(12), color: C.textMuted },
  rxBadge: { backgroundColor: 'rgba(232,41,58,0.15)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(232,41,58,0.3)' },
  rxText: { color: C.red, fontSize: RF(9), fontWeight: '800' },
  productPrice: { fontSize: RF(16), fontWeight: '800', color: C.textMain, marginTop: 6 },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.navy3, borderRadius: 12, padding: 4 },
  stepperBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.redDark, alignItems: 'center', justifyContent: 'center' },
  stepperQty: { color: C.textMain, fontSize: RF(14), fontWeight: '800', width: 20, textAlign: 'center' },
  cartBarWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: C.navy, borderTopWidth: 1, borderTopColor: C.cardBorder, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  miniCartItem: { backgroundColor: C.navy3, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.cardBorder },
  cartBar: { backgroundColor: 'rgba(232,41,58,0.12)', borderWidth: 1, borderColor: 'rgba(232,41,58,0.3)', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkoutBtn: { backgroundColor: C.red, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  miniRx: { backgroundColor: C.red, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  imgWrap: { backgroundColor: 'rgba(10,22,40,0.92)', alignItems: 'center', justifyContent: 'center' },
  collapseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', alignSelf: 'flex-start' },
  bottomSheetMap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.navy2, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 30, borderWidth: 1, borderColor: C.cardBorder },
  etaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)', padding: 16, borderRadius: 18, marginBottom: 10 },
  etaLabel: { color: C.textMuted, fontSize: RF(12), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  etaTime: { color: C.teal, fontSize: RF(32), fontWeight: '800', marginBottom: 4 },
  etaSub: { color: C.textDim, fontSize: RF(13) },
  etaIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,201,167,0.15)', alignItems: 'center', justifyContent: 'center' },
  timelineBox: { paddingLeft: 12, marginBottom: 16 },
  timelineRow: { flexDirection: 'row' },
  timelineLineWrap: { alignItems: 'center', width: 24 },
  timelineDot: { width: 14, height: 14, borderRadius: 7 },
  timelineLine: { width: 2, height: 32, marginVertical: 4 },
  timelineContent: { flex: 1, paddingLeft: 16, paddingBottom: 16, marginTop: -3 },
  timelineTitle: { fontSize: RF(16), fontWeight: '800', marginBottom: 4 },
  timelineSub: { fontSize: RF(13), color: C.textDim },
  riderCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.navy3, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 10 },
  riderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(34,197,94,0.1)', alignItems: 'center', justifyContent: 'center' },
  riderName: { fontSize: RF(16), color: C.textMain, fontWeight: '800', marginBottom: 2 },
  riderDetails: { fontSize: RF(13), color: C.textMuted, fontWeight: '500' },
  riderCallBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', alignItems: 'center', justifyContent: 'center' },
  destructiveBtnOutline: { backgroundColor: 'transparent', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: C.red, alignItems: 'center', marginTop: 16, marginBottom: 10 },
  destructiveBtnText: { color: C.red, fontSize: RF(15), fontWeight: '800' },
  alertBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  alertBox: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 24, padding: 28, width: '100%', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  alertTitle: { fontSize: RF(22), fontWeight: '800', color: C.textMain, marginBottom: 8 },
  alertSub: { fontSize: RF(16), color: C.textMuted, lineHeight: 22, marginBottom: 24 },
  alertActions: { flexDirection: 'row', gap: 12 },
  alertCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.navy3, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
  alertConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.red, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,41,58,0.3)' },
  rxBox: { borderWidth: 1, borderRadius: 24, padding: 32, width: '100%', alignItems: 'center' },
});
