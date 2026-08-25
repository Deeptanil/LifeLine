import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View, ActivityIndicator, TextInput, Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, DispatchItem } from '../context/DispatchContext';
import { useTheme } from '../context/ThemeContext';
import { NavigationHeader } from '../components/NavigationHeader';
import { DB } from '../db/database';
import { RF } from '../utils/Responsive';

export default function DoctorScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { dispatches, startDispatch, cancelDispatch, addChatMessage, finishDoctorConsultation } = useDispatch();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(C);
  
  const activeDocDispatch = dispatches.find(d => d.type === 'doctor');
  const activeAppointment = dispatches.find(d => d.type === 'appointment');

  const [docs, setDocs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'video' | 'clinic'>('video');

  const [bookingModal, setBookingModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [symptoms, setSymptoms] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('Today');

  const [msgInput, setMsgInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const prevDispatchRef = useRef(activeDocDispatch?.id);

  useEffect(() => {
    if (activeDocDispatch && activeDocDispatch.id !== prevDispatchRef.current) {
        setIsChatOpen(true);
        prevDispatchRef.current = activeDocDispatch.id;
    }
  }, [activeDocDispatch]);

  useEffect(() => {
    if (params.openChat === 'true' && activeDocDispatch) {
       setIsChatOpen(true);
       router.setParams({ openChat: '' });
    }
  }, [params, activeDocDispatch]);

  useEffect(() => {
    DB.Doctors.findMany().then(setDocs);
  }, []);

  const openBooking = (doc: any) => {
    setSelectedDoc(doc);
    setSymptoms('');
    setSelectedSlot('');
    setBookingModal(true);
  };

  const confirmBooking = () => {
    setBookingModal(false);
    if (activeTab === 'clinic') {
       startDispatch({
         type: 'appointment',
         title: 'Physical Visit',
         subtitle: `${selectedDate} at ${selectedSlot || '10:00 AM'}`,
         icon: 'calendar',
         data: { doc: selectedDoc, date: selectedDate, slot: selectedSlot || '10:00 AM' }
       });
       return;
    }
    
    startDispatch({
      type: 'doctor',
      title: 'Connecting randomly...',
      subtitle: 'Finding physician',
      icon: 'medical',
      data: { doc: selectedDoc, symptoms },
      chat: [],
      chatMode: 'chat'
    });
  };

  const [customAlert, setCustomAlert] = useState<any>(null);
  const [profileModal, setProfileModal] = useState<any>(null);

  const handleEndChat = () => {
    setCustomAlert({
       title: 'End Consultation?',
       sub: 'Are you sure you want to close this session?',
       confirmText: 'End Session',
       onConfirm: () => {
          if (activeDocDispatch) finishDoctorConsultation(activeDocDispatch.id);
          setIsChatOpen(false);
          setCustomAlert(null);
       }
    });
  };

  const sendMessage = () => {
    if (!msgInput.trim() || !activeDocDispatch) return;
    addChatMessage(activeDocDispatch.id, msgInput, true);
    setMsgInput('');
    
    setTimeout(() => {
      let reply = "I understand your symptoms. Can you elaborate further on how long you've been feeling this way?";
      const lower = msgInput.toLowerCase();
      if (lower.includes('chest pain') || lower.includes('heart')) {
         reply = "Chest pain can be an emergency. I strongly advise you to track the active tracker or let me dispatch a Medic to your home right now.";
      } else if (lower.includes('pain')) {
         reply = "Where exactly is the pain located, and could you rate it on a scale of 1 to 10?";
      } else if (lower.includes('fever')) {
         reply = "Please monitor your temperature closely. Ensure you drink plenty of fluids.";
      }
      addChatMessage(activeDocDispatch.id, reply, false);
    }, 2000);
  };

  useEffect(() => {
     if (activeDocDispatch && activeDocDispatch.stage >= 1 && activeDocDispatch.chatMode === 'chat' && (!activeDocDispatch.chat || activeDocDispatch.chat.length === 0)) {
        setTimeout(() => {
           addChatMessage(activeDocDispatch.id, "Hi, I've reviewed your case. What's happening? How can I help right now?", false);
        }, 1500);
     }
  }, [activeDocDispatch?.stage, activeDocDispatch?.chatMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.navy }]}>
       <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} />

               <NavigationHeader title="Consult Doctors" subtitle="Connect with medical professionals" />

       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>

        <View style={{ paddingHorizontal: 22, marginBottom: 20 }}>
          <View style={styles.tabContainer}>
             <TouchableOpacity style={[styles.tabBtn, activeTab === 'video' && styles.tabActive]} onPress={() => setActiveTab('video')} activeOpacity={0.8}>
                <Text style={[styles.tabText, activeTab === 'video' && styles.tabTextActive]}>Talk Now</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.tabBtn, activeTab === 'clinic' && styles.tabActive]} onPress={() => setActiveTab('clinic')} activeOpacity={0.8}>
                <Text style={[styles.tabText, activeTab === 'clinic' && styles.tabTextActive]}>Physical Clinic</Text>
             </TouchableOpacity>
          </View>
        </View>
        
        {activeDocDispatch && activeDocDispatch.stage < 2 && (
           <TouchableOpacity 
              activeOpacity={0.9}
              style={[styles.globalPin, { backgroundColor: C.navy2, borderColor: C.cardBorder }]} 
              onPress={() => setIsChatOpen(true)}
           >
              <View style={[styles.pinIconWrap, { backgroundColor: '#638BFF' }]}>
                 <Ionicons name="medical" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, paddingLeft: 12 }}>
                 <Text style={[styles.pinTitle, { color: C.textMain }]}>{activeDocDispatch.stage === 0 ? 'Connecting' : 'Active Consultation'}</Text>
                 <Text style={[styles.pinSub, { color: C.textMuted }]} numberOfLines={1}>{activeDocDispatch.data?.doc?.name || 'Waiting for physician...'}</Text>
              </View>
              <View style={styles.pinAction}>
                 <Text style={styles.pinActionText}>VIEW</Text>
              </View>
           </TouchableOpacity>
        )}

        {activeDocDispatch && activeDocDispatch.stage === 2 && (
             <View style={{ marginHorizontal: 22, backgroundColor: C.navy2, borderWidth: 1, borderColor: C.cardBorder, padding: 24, borderRadius: 24, marginBottom: 20 }}>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                   <Ionicons name="checkmark-circle" size={50} color={C.teal} style={{ marginBottom: 10 }} />
                   <Text style={{ fontSize: RF(20), fontWeight: '800', color: C.textMain, textAlign: 'center' }}>Consultation Finished</Text>
                   <Text style={{ fontSize: RF(13), color: C.textMuted, textAlign: 'center', marginTop: 4 }}>Your report and prescription have been saved.</Text>
                </View>
                <Text style={{ fontSize: RF(16), fontWeight: '800', color: C.textMain, textAlign: 'center', marginBottom: 16 }}>Rate Your Experience</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                   {[1, 2, 3, 4, 5].map(star => (
                     <TouchableOpacity key={star}>
                       <Ionicons name="star" size={36} color="#FFD166" />
                     </TouchableOpacity>
                   ))}
                </View>
                <TouchableOpacity style={{ backgroundColor: '#638BFF', paddingVertical: 14, borderRadius: 16, alignItems: 'center' }} onPress={() => {
                    cancelDispatch(activeDocDispatch.id);
                }}>
                   <Text style={{ color: '#fff', fontSize: RF(15), fontWeight: '800' }}>Submit Review</Text>
                </TouchableOpacity>
             </View>
        )}

        {activeTab === 'clinic' && activeAppointment && (
            <View style={{ marginHorizontal: 22, backgroundColor: C.navy2, borderWidth: 1, borderColor: C.teal, padding: 20, borderRadius: 24, marginBottom: 24 }}>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                     <Ionicons name="calendar-clear" size={22} color={C.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: RF(13), fontWeight: '700', color: C.teal, textTransform: 'uppercase', letterSpacing: 1 }}>Active Booking</Text>
                     <Text style={{ fontSize: RF(18), fontWeight: '800', color: C.textMain }}>{activeAppointment.data.date} at {activeAppointment.data.slot}</Text>
                  </View>
               </View>
               
               <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.navy3, padding: 14, borderRadius: 16, marginBottom: 16 }}>
                  <View style={[styles.docAvLarge, { width: 40, height: 40, borderRadius: 20, marginRight: 10 }]}>
                     <Ionicons name="person" size={20} color="#fff" />
                  </View>
                  <View>
                     <Text style={{ fontSize: RF(15), fontWeight: '800', color: C.textMain }}>{activeAppointment.data.doc.name}</Text>
                     <Text style={{ fontSize: RF(12), color: C.textMuted }}>{activeAppointment.data.doc.spec}</Text>
                  </View>
               </View>

               <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity 
                     activeOpacity={0.8}
                     style={{ flex: 1, backgroundColor: 'rgba(99,139,255,0.1)', borderWidth: 1, borderColor: 'rgba(99,139,255,0.3)', paddingVertical: 12, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                     onPress={() => Linking.openURL('tel:+919999999999')}
                  >
                     <Ionicons name="call" size={18} color="#638BFF" />
                     <Text style={{ color: '#638BFF', fontWeight: '800', fontSize: RF(14) }}>Call Clinic</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                     activeOpacity={0.8}
                     style={{ flex: 1, backgroundColor: 'rgba(232,41,58,0.05)', borderWidth: 1, borderColor: 'rgba(232,41,58,0.2)', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                     onPress={() => {
                        setCustomAlert({
                           title: 'Cancel Booking?',
                           sub: 'Are you sure you want to cancel this clinic appointment?',
                           confirmText: 'Cancel Booking',
                           cancelText: 'Keep it',
                           isDestructive: true,
                           onConfirm: () => {
                              cancelDispatch(activeAppointment.id);
                              setCustomAlert(null);
                           }
                        })
                     }}
                  >
                     <Text style={{ color: C.red, fontWeight: '800', fontSize: RF(14) }}>Cancel</Text>
                  </TouchableOpacity>
               </View>
            </View>
        )}

        <Text style={styles.sectionTitle}>Available Specialists</Text>

        {docs.sort((a,b) => {
           const activeId = activeDocDispatch?.data?.doc?.id || activeAppointment?.data?.doc?.id;
           return (activeId === a.id ? -1 : activeId === b.id ? 1 : 0);
        }).map(doc => {
          const isActiveDoc = activeDocDispatch?.data?.doc?.id === doc.id || activeAppointment?.data?.doc?.id === doc.id;
          const isAnotherSessionActive = (!!activeDocDispatch && activeDocDispatch.stage < 2 && !isActiveDoc) || (!!activeAppointment && !isActiveDoc);
          
          return (
          <View key={doc.id} style={[styles.docCard, isAnotherSessionActive && { opacity: 0.5 }]}>
            <View style={styles.docRow}>
              <View style={styles.docAvLarge}><Ionicons name="person" size={28} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                 <Text style={styles.bookingTitle}>Talk Now</Text>
                 <Text style={styles.docSpecSub}>{doc.spec}</Text>
                 
                 <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'center' }}>
                   <View style={styles.ratingBox}>
                     <Ionicons name="star" size={12} color="#FFD166" />
                     <Text style={styles.ratingText}>{doc.rating}</Text>
                   </View>
                   <Text style={styles.docTimeText}>{doc.time}</Text>
                 </View>
              </View>
            </View>

            <View style={styles.docActions}>
               <TouchableOpacity style={styles.docProfileBtn} activeOpacity={0.8} onPress={() => setProfileModal(doc)}>
                 <Text style={styles.docProfileBtnText}>View Profile</Text>
               </TouchableOpacity>

                <TouchableOpacity 
                    disabled={(!!activeDocDispatch && activeDocDispatch.stage < 2) || !!activeAppointment} 
                    style={[
                       styles.docBookBtn, 
                       ((!!activeDocDispatch && activeDocDispatch.stage < 2) || !!activeAppointment) && { backgroundColor: C.navy3, opacity: 0.5 }
                    ]} 
                    onPress={() => openBooking(doc)} 
                    activeOpacity={0.8}
                 >
                   <Text 
                      style={[
                        styles.docBookBtnText, 
                        ((!!activeDocDispatch && activeDocDispatch.stage < 2) || !!activeAppointment) && { color: C.textDim }
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                    >
                       {isActiveDoc ? (activeAppointment ? 'Booked' : 'In Session') : activeTab === 'clinic' ? 'Book Appointment' : 'Consult Live'}
                   </Text>
                 </TouchableOpacity>
             </View>
          </View>
          );
        })}

      </ScrollView>

      <Modal transparent animationType="slide" visible={bookingModal} onRequestClose={() => setBookingModal(false)}>
        <View style={styles.modalBgSheet}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom || 22 }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: C.textMain }]}>{activeTab === 'clinic' ? 'Book Appointment' : 'Start Consultation'}</Text>
              <TouchableOpacity onPress={() => setBookingModal(false)}>
                <Ionicons name="close-circle" size={24} color={C.red} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
              
              <View style={[styles.docPreview, { backgroundColor: C.navy3, borderColor: C.cardBorder }]}>
                <Ionicons name="person" size={24} color="#638BFF" style={{ marginRight: 12 }} />
                <View>
                   <Text style={{ fontSize: RF(16), fontWeight: '800', color: C.textMain }}>{selectedDoc?.name}</Text>
                   <Text style={{ fontSize: RF(13), color: C.textMuted }}>{selectedDoc?.spec}</Text>
                </View>
              </View>

              {activeTab === 'video' ? (
                 <>
                    <Text style={[styles.fieldLabel, { color: C.textMain }]}>Chief Complaint / Symptoms</Text>
                    <TextInput 
                      style={[styles.symptomsBox, { backgroundColor: C.cardBg, borderColor: C.cardBorder, color: C.textMain }]}
                      multiline
                      placeholder="E.g., Severe headaches and nausea since yesterday..."
                      placeholderTextColor={C.textDim}
                      value={symptoms}
                      onChangeText={setSymptoms}
                      textAlignVertical="top"
                    />
                 </>
              ) : (
                 <>
                    <Text style={[styles.fieldLabel, { color: C.textMain }]}>Select Date</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                       {['Today', 'Tomorrow', 'Day 3'].map(d => (
                          <TouchableOpacity 
                             key={d} 
                             style={[styles.dateBtn, { backgroundColor: C.cardBg, borderColor: C.cardBorder }, selectedDate === d && { borderColor: C.teal, backgroundColor: 'rgba(0,201,167,0.1)' }]}
                             onPress={() => setSelectedDate(d)}
                          >
                             <Text style={[styles.dateBtnText, { color: C.textMain }, selectedDate === d && { color: C.teal }]}>{d}</Text>
                          </TouchableOpacity>
                       ))}
                    </View>

                    <Text style={[styles.fieldLabel, { color: C.textMain }]}>Available Slots</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                       {['10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM'].map(t => (
                          <TouchableOpacity 
                             key={t} 
                             style={[styles.slotBtn, { backgroundColor: C.cardBg, borderColor: C.cardBorder }, selectedSlot === t && { borderColor: '#638BFF', backgroundColor: 'rgba(99,139,255,0.1)' }]}
                             onPress={() => setSelectedSlot(t)}
                          >
                             <Text style={[styles.slotBtnText, { color: C.textMain }, selectedSlot === t && { color: '#638BFF' }]}>{t}</Text>
                          </TouchableOpacity>
                       ))}
                    </View>
                 </>
              )}

              <TouchableOpacity 
                style={[styles.confirmBtn, (activeTab === 'video' && symptoms.length < 4) || (activeTab === 'clinic' && !selectedSlot) ? { opacity: 0.5 } : null]} 
                disabled={(activeTab === 'video' && symptoms.length < 4) || (activeTab === 'clinic' && !selectedSlot)} 
                onPress={confirmBooking}
              >
                 <Text style={{ color: '#fff', fontWeight: '800', fontSize: RF(15) }}>{activeTab === 'clinic' ? 'Confirm Booking' : 'Connect Now (₹199)'}</Text>
              </TouchableOpacity>

            </ScrollView>

            {/* Inline Alert for Booking Modal */}
            {!!customAlert && bookingModal && (
               <View style={[StyleSheet.absoluteFillObject, styles.alertBg, { zIndex: 100, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                  <View style={styles.alertBox}>
                    <Text style={[styles.alertTitle, { color: C.textMain }]}>{customAlert.title}</Text>
                    <Text style={[styles.alertSub, { color: C.textMuted }]}>{customAlert.sub}</Text>
                    <View style={styles.alertActions}>
                       <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setCustomAlert(null)}>
                          <Text style={{ color: C.textMuted, fontWeight: '700', fontSize: RF(14) }}>{customAlert.cancelText || 'Cancel'}</Text>
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
        </View>
      </Modal>

      <Modal transparent animationType="slide" visible={isChatOpen && !!activeDocDispatch} onRequestClose={() => setIsChatOpen(false)}>
        {activeDocDispatch && (
           <View style={{ flex: 1, backgroundColor: C.navy }}>
             {/* STAGE 0: CONNECTING */}
             {activeDocDispatch.stage === 0 && (
               <View style={{ flex: 1, paddingTop: insets.top }}>
                  <View style={[styles.chatHeader, { backgroundColor: C.navy2, borderBottomColor: C.cardBorder }]}>
                     <TouchableOpacity onPress={() => setIsChatOpen(false)} style={{ padding: 10 }}>
                        <Ionicons name="chevron-down" size={28} color={C.textMain} />
                     </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#638BFF" style={{ marginBottom: 20 }} />
                    <Text style={{ fontSize: RF(24), fontWeight: '800', color: C.textMain }}>Assigning Specialist</Text>
                    <Text style={{ fontSize: RF(14), color: C.textMuted, marginTop: 8 }}>Please wait while we construct a secure bridge...</Text>
                     <TouchableOpacity 
                        style={{ marginTop: 40 }} 
                        onPress={() => { 
                           setCustomAlert({
                              title: "Cancel Request?",
                              sub: "Are you sure you want to stop connecting to a doctor?",
                              confirmText: "Yes, Cancel",
                              isDestructive: true,
                              onConfirm: () => {
                                 cancelDispatch(activeDocDispatch.id);
                                 setIsChatOpen(false);
                                 setCustomAlert(null);
                              }
                           });
                        }}>
                       <Text style={{ color: C.red, fontWeight: '700' }}>Cancel Request</Text>
                     </TouchableOpacity>
                  </View>
               </View>
             )}

             {/* STAGE 1: CHAT/VIDEO */}
             {activeDocDispatch.stage === 1 && (
               <View style={{ flex: 1, backgroundColor: C.navy2, paddingTop: insets.top }}>
                  <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy2} />
                  <View style={[styles.chatHeader, { backgroundColor: C.navy2, borderBottomColor: C.cardBorder, paddingHorizontal: 22 }]}>
                    <TouchableOpacity onPress={() => setIsChatOpen(false)} style={{ padding: 10, marginLeft: -10 }}>
                       <Ionicons name="chevron-down" size={28} color={C.textMain} />
                    </TouchableOpacity>
                    
                    <View style={{ flex: 1, marginLeft: 6 }}>
                       <Text style={{ fontSize: RF(18), fontWeight: '800', color: C.textMain }}>{activeDocDispatch.data?.doc?.name || 'Doctor'}</Text>
                       <Text style={{ fontSize: RF(12), color: C.teal }}>{activeDocDispatch.chatMode === 'call' ? 'Live Call' : 'Online'}</Text>
                    </View>

                    <TouchableOpacity onPress={handleEndChat} style={{ padding: 10 }}>
                       <Text style={{ color: C.red, fontWeight: '800' }}>End Chat</Text>
                    </TouchableOpacity>
                  </View>

                  {activeDocDispatch.chatMode === 'call' ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: insets.bottom }}>
                       <View style={styles.callAvatar}><Ionicons name="person" size={60} color="#fff" /></View>
                       <Text style={{ fontSize: RF(24), fontWeight: '800', color: C.textMain, marginTop: 24 }}>00:43</Text>
                       <Text style={{ fontSize: RF(14), color: C.textMuted }}>Connected</Text>
                       
                       <View style={{ flexDirection: 'row', gap: 20, marginTop: 60 }}>
                          <TouchableOpacity style={styles.callBtnOutline}>
                             <Ionicons name="mic-off" size={24} color="#fff" />
                          </TouchableOpacity>
                           <TouchableOpacity 
                              style={[styles.callBtnEnd, { backgroundColor: C.red }]} 
                              onPress={() => {
                                 setCustomAlert({ title: "Connecting Doctor...", sub: "Routing your call through the secure medical channel." });
                                 setTimeout(() => {
                                    Linking.openURL('tel:+919999999999');
                                    setCustomAlert(null);
                                 }, 1000);
                              }}
                           >
                              <Ionicons name="call" size={24} color="#fff" />
                           </TouchableOpacity>
                          <TouchableOpacity style={styles.callBtnOutline}>
                             <Ionicons name="volume-high" size={24} color="#fff" />
                          </TouchableOpacity>
                       </View>
                    </View>
                  ) : (
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                      <ScrollView 
                        ref={scrollRef} 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={{ padding: 22 }}
                        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                      >
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                           <Text style={{ fontSize: RF(12), color: C.textDim, fontWeight: '700', textTransform: 'uppercase' }}>Session Started</Text>
                           <Text style={{ fontSize: RF(11), color: C.textMuted, marginTop: 4, textAlign: 'center' }}>
                             Your symptoms: {activeDocDispatch.data?.symptoms}
                           </Text>
                        </View>
                        
                        {activeDocDispatch.chat?.map((msg, i) => (
                           <View key={i} style={[styles.msgBubbleWrap, msg.isSender ? styles.msgSender : styles.msgReceiver]}>
                              {!msg.isSender && <View style={styles.msgAvatar}><Ionicons name="medical" size={14} color="#fff" /></View>}
                              <View style={[styles.msgBubble, msg.isSender ? styles.msgBubbleSender : { backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, borderBottomLeftRadius: 4 }]}>
                                <Text style={[styles.msgText, msg.isSender ? { color: '#fff' } : { color: C.textMain }]}>{msg.text}</Text>
                                <Text style={[styles.msgTime, msg.isSender ? { color: 'rgba(255,255,255,0.6)' } : { color: C.textDim }]}>{msg.time}</Text>
                              </View>
                           </View>
                        ))}
                      </ScrollView>
                      
                      <View style={[styles.chatInputWrap, { backgroundColor: C.navy2, borderTopColor: C.cardBorder, paddingHorizontal: 22, paddingBottom: insets.bottom || 12 }]}>
                        <TouchableOpacity style={styles.attachBtn}><Ionicons name="add" size={24} color={C.textMuted} /></TouchableOpacity>
                        <TextInput 
                          style={[styles.chatInput, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
                          placeholder="Type symptoms..."
                          placeholderTextColor={C.textDim}
                          value={msgInput}
                          onChangeText={setMsgInput}
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                          <Ionicons name="send" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </KeyboardAvoidingView>
                  )}
               </View>
             )}

             {/* Inline Alert for Chat Modal */}
             {!!customAlert && isChatOpen && (
               <View style={[StyleSheet.absoluteFillObject, styles.alertBg, { zIndex: 100 }]}>
                  <View style={styles.alertBox}>
                    <Text style={[styles.alertTitle, { color: C.textMain }]}>{customAlert.title}</Text>
                    <Text style={[styles.alertSub, { color: C.textMuted }]}>{customAlert.sub}</Text>
                    <View style={styles.alertActions}>
                       <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setCustomAlert(null)}>
                          <Text style={{ color: C.textMuted, fontWeight: '700', fontSize: RF(14) }}>{customAlert.cancelText || 'Cancel'}</Text>
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

      {/* Global Alert Modal (Only for Main Screen) */}
      <Modal transparent animationType="fade" visible={!!customAlert && !bookingModal && !isChatOpen && !profileModal} onRequestClose={() => setCustomAlert(null)}>
        <View style={styles.alertBg}>
          <View style={[styles.alertBox, { backgroundColor: C.navy2, borderColor: C.cardBorder }]}>
            <Text style={[styles.alertTitle, { color: C.textMain }]}>{customAlert?.title}</Text>
            <Text style={[styles.alertSub, { color: C.textMuted }]}>{customAlert?.sub}</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setCustomAlert(null)}>
                <Text style={{ color: C.textMuted, fontWeight: '700', fontSize: RF(14) }}>{customAlert?.cancelText || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.alertConfirmBtn, customAlert?.isDestructive && { backgroundColor: C.redDark, borderColor: C.red }]} 
                onPress={() => {
                  if (customAlert?.onConfirm) customAlert.onConfirm();
                  else setCustomAlert(null);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: RF(14) }}>{customAlert?.confirmText || 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Doctor Profile Modal */}
      <Modal transparent animationType="slide" visible={!!profileModal} onRequestClose={() => setProfileModal(null)}>
        <View style={styles.modalBgSheet}>
          <View style={[styles.modalSheet, { height: '85%', paddingBottom: insets.bottom || 22 }]}>
            <View style={{ padding: 22, borderBottomWidth: 1, borderBottomColor: C.cardBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.sheetTitle, { color: C.textMain }]}>Doctor Profile</Text>
              <TouchableOpacity onPress={() => setProfileModal(null)}>
                <Ionicons name="close-circle" size={28} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 60 }}>
              {/* Profile Content ... */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                 <View style={[styles.docAvLarge, { width: 90, height: 90, borderRadius: 45, marginBottom: 12, backgroundColor: C.navy3, borderColor: C.cardBorder }]}>
                    <Ionicons name="person" size={40} color="#fff" />
                 </View>
                 <Text style={{ fontSize: RF(24), fontWeight: '800', color: C.textMain }}>{profileModal?.name}</Text>
                 <Text style={{ fontSize: RF(15), color: C.textMuted, marginTop: 4 }}>{profileModal?.spec}</Text>
                 
                 <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
                    <View style={{ alignItems: 'center' }}>
                       <Ionicons name="star" size={24} color="#FFD166" />
                       <Text style={{ fontSize: RF(16), fontWeight: '800', color: C.textMain, marginTop: 4 }}>{profileModal?.rating}</Text>
                       <Text style={{ fontSize: RF(11), color: C.textDim }}>Rating</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: C.cardBorder }} />
                    <View style={{ alignItems: 'center' }}>
                       <Ionicons name="time" size={24} color={C.teal} />
                       <Text style={{ fontSize: RF(16), fontWeight: '800', color: C.textMain, marginTop: 4 }}>{profileModal?.time}</Text>
                       <Text style={{ fontSize: RF(11), color: C.textDim }}>Wait Time</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: C.cardBorder }} />
                    <View style={{ alignItems: 'center' }}>
                       <Ionicons name="briefcase" size={24} color="#638BFF" />
                       <Text style={{ fontSize: RF(16), fontWeight: '800', color: C.textMain, marginTop: 4 }}>12 Yrs</Text>
                       <Text style={{ fontSize: RF(11), color: C.textDim }}>Experience</Text>
                    </View>
                 </View>
              </View>

              <Text style={styles.fieldLabel}>Biography</Text>
              <Text style={{ color: C.textMuted, lineHeight: 22, marginBottom: 24 }}>
                 {profileModal?.name} is a renowned senior specialist at Manipal Clinics with over 12 years of clinical excellence. Highly decorated in comprehensive diagnostic protocols and rapid telemedicine triaging.
              </Text>

              <Text style={styles.fieldLabel}>Credentials</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                 {['MBBS', 'MD General', 'Medical Board Certified'].map(c => (
                    <View key={c} style={{ backgroundColor: C.navy3, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.cardBorder }}>
                       <Text style={{ color: C.textMain, fontSize: RF(12), fontWeight: '600' }}>{c}</Text>
                    </View>
                 ))}
              </View>
            </ScrollView>

            <View style={{ padding: 22, borderTopWidth: 1, borderTopColor: C.cardBorder, backgroundColor: C.navy2, paddingBottom: insets.bottom > 0 ? insets.bottom : 22 }}>
              <View style={styles.modalFooterActions}>
                <TouchableOpacity 
                   style={[styles.modalSecondaryBtn, (!!activeDocDispatch || !!activeAppointment) && { opacity: 0.5 }]} 
                   disabled={!!activeDocDispatch || !!activeAppointment}
                   onPress={() => { setProfileModal(null); setActiveTab('clinic'); setTimeout(() => openBooking(profileModal), 300); }}
                >
                   <Text 
                     style={{ color: C.textMain, fontWeight: '800', fontSize: RF(15) }}
                     numberOfLines={1}
                     adjustsFontSizeToFit={true}
                   >Book Appt.</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                   style={[styles.modalPrimaryBtn, (!!activeDocDispatch || !!activeAppointment) && { backgroundColor: C.navy3, opacity: 0.5 }]} 
                   disabled={!!activeDocDispatch || !!activeAppointment}
                   onPress={() => { setProfileModal(null); setActiveTab('video'); setTimeout(() => openBooking(profileModal), 300); }}
                >
                   <Text 
                     style={{ color: '#fff', fontWeight: '800', fontSize: RF(15) }}
                     numberOfLines={1}
                     adjustsFontSizeToFit={true}
                   >Chat Now</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Inline Alert for Profile Modal */}
            {!!customAlert && profileModal && (
               <View style={[StyleSheet.absoluteFillObject, styles.alertBg, { zIndex: 100, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                  <View style={styles.alertBox}>
                    <Text style={[styles.alertTitle, { color: C.textMain }]}>{customAlert.title}</Text>
                    <Text style={[styles.alertSub, { color: C.textMuted }]}>{customAlert.sub}</Text>
                    <View style={styles.alertActions}>
                       <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setCustomAlert(null)}>
                          <Text style={{ color: C.textMuted, fontWeight: '700', fontSize: RF(14) }}>{customAlert.cancelText || 'Cancel'}</Text>
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
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 0 },
  title: { fontSize: RF(26), fontWeight: '700', letterSpacing: -0.5 },
  sub: { fontSize: RF(13), marginTop: 3 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: C.navy3, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabText: { color: C.textMuted, fontWeight: '600', fontSize: RF(13) },
  tabTextActive: { color: C.textMain, fontWeight: '800' },

  sectionTitle: { fontSize: RF(18), fontWeight: '800', color: C.textMain, marginBottom: 16, marginHorizontal: 22 },
  
  docCard: { backgroundColor: C.cardBg, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder, marginHorizontal: 22 },
  docRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  docAvLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.navy3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.cardBorder },
  docNameTitle: { fontSize: RF(16), fontWeight: '800', color: C.textMain, marginBottom: 2 },
  docSpecSub: { color: C.textMuted, fontSize: RF(13) },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,209,102,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { color: '#FFD166', fontSize: RF(12), fontWeight: '800' },
  docTimeText: { color: C.teal, fontSize: RF(12), fontWeight: '700' },

  docActions: { flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.cardBorder },
  docProfileBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.navy3, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
  docProfileBtnText: { color: C.textMain, fontSize: RF(13), fontWeight: '700' },
  docBookBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#638BFF', alignItems: 'center' },
  docBookBtnText: { color: '#fff', fontSize: RF(13), fontWeight: '800' },

  modalBgSheet: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.navy2, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 0 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: 22, paddingBottom: 0 },
  sheetTitle: { fontSize: RF(20), fontWeight: '800', color: C.textMain },
  
  docPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navy3, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 24, marginHorizontal: 22 },
  fieldLabel: { color: C.textMain, fontSize: RF(14), fontWeight: '800', marginBottom: 10, marginHorizontal: 22 },
  symptomsBox: { backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 16, padding: 16, color: C.textMain, height: 120, marginBottom: 24, fontSize: RF(14), marginHorizontal: 22 },
  
  dateBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  dateBtnText: { fontSize: RF(13), fontWeight: '800' },
  slotBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  slotBtnText: { fontSize: RF(13), fontWeight: '700' },

  confirmBtn: { backgroundColor: '#638BFF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10, marginHorizontal: 22 },
  modalFooterActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalSecondaryBtn: { flex: 1, paddingVertical: 15, borderRadius: 16, backgroundColor: C.navy3, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
  modalPrimaryBtn: { flex: 1, paddingVertical: 15, borderRadius: 16, backgroundColor: '#638BFF', alignItems: 'center' },

  alertBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  alertBox: { backgroundColor: C.navy2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%' },
  alertTitle: { fontSize: RF(20), fontWeight: '800', color: C.textMain, marginBottom: 8 },
  alertSub: { fontSize: RF(14), color: C.textMuted, lineHeight: 22, marginBottom: 24 },
  alertActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  alertCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.navy3, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
  alertConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#638BFF', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(99,139,255,0.3)' },

  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.navy2, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  msgBubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  msgSender: { justifyContent: 'flex-end' },
  msgReceiver: { justifyContent: 'flex-start' },
  msgAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#638BFF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  msgBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  msgBubbleSender: { backgroundColor: '#638BFF', borderBottomRightRadius: 4 },
  msgBubbleReceiver: { backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, borderBottomLeftRadius: 4 },
  msgText: { fontSize: RF(14), lineHeight: 20 },
  msgTime: { fontSize: RF(10), marginTop: 4, alignSelf: 'flex-end' },
  
  chatInputWrap: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: C.navy2, borderTopWidth: 1, borderTopColor: C.cardBorder },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chatInput: { flex: 1, backgroundColor: C.navy3, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: C.textMain, fontSize: RF(14), marginHorizontal: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#638BFF', alignItems: 'center', justifyContent: 'center' },

  callAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  callBtnOutline: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  callBtnEnd: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },

  globalPin: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navy2, borderWidth: 1, borderColor: C.cardBorder, padding: 14, borderRadius: 16, marginBottom: 20, marginHorizontal: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  pinIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pinTitle: { fontSize: RF(15), fontWeight: '800', color: C.textMain, marginBottom: 2 },
  pinSub: { fontSize: RF(12), color: C.textMuted },
  pinAction: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pinActionText: { color: C.textMain, fontSize: RF(11), fontWeight: '800' },
});
