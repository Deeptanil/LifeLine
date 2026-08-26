import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RF } from '../utils/Responsive';
import { NavigationHeader } from '../components/NavigationHeader';

interface VaultDoc {
  id: string;
  title: string;
  category: 'Prescription' | 'Lab Report' | 'Vaccine' | 'Discharge Summary';
  date: string;
  doctor?: string;
  notes?: string;
}

interface HistoryItem {
  id: string;
  type: 'ambulance' | 'medic' | 'doctor' | 'medicine' | 'tele_medic' | 'appointment';
  title: string;
  subtitle: string;
  date: string;
  status: 'Completed' | 'Delivered' | 'Confirmed' | 'Archived';
  details: string;
}

const MOCK_DOCS: VaultDoc[] = [
  { id: 'doc1', title: 'Complete Blood Count (CBC) Report', category: 'Lab Report', date: '12 Aug 2026', doctor: 'Dr. Shruti Sharma', notes: 'Hemoglobin: 14.2 g/dL · Normal Range' },
  { id: 'doc2', title: 'Asthma Management & Inhaler Rx', category: 'Prescription', date: '04 Jul 2026', doctor: 'Dr. Amit Patel', notes: 'Asthalin Inhaler twice daily' },
  { id: 'doc3', title: 'COVID-19 Vaccine Certificate (Booster)', category: 'Vaccine', date: '15 Mar 2026', doctor: 'Apollo Health Center' },
  { id: 'doc4', title: 'Hospital Discharge Summary', category: 'Discharge Summary', date: '10 Dec 2025', doctor: 'Manipal Hospital' }
];

const MOCK_HISTORY: HistoryItem[] = [
  { id: 'h1', type: 'ambulance', title: 'Emergency ALS Ambulance Dispatch', subtitle: 'Dispatched to HSR Sector 2 → Manipal Hospital', date: '20 Aug 2026 · 11:42 PM', status: 'Completed', details: 'ETA: 6 mins · Paramedic Unit #402' },
  { id: 'h2', type: 'tele_medic', title: 'Home Tele-Medic Consult', subtitle: 'Phone Consultation with Dr. Shruti Sharma', date: '14 Aug 2026 · 04:15 PM', status: 'Completed', details: 'Duration: 12 mins · Follow-up Rx generated' },
  { id: 'h3', type: 'medicine', title: 'Express Pharmacy Delivery', subtitle: 'Paracetamol & ORS Electrolytes', date: '08 Aug 2026 · 09:30 AM', status: 'Delivered', details: 'Delivered by MedPlus 24/7' },
  { id: 'h4', type: 'appointment', title: 'Cardiology Clinical Appointment', subtitle: 'Dr. Amit Patel at Apollo Hospital', date: '01 Aug 2026 · 10:00 AM', status: 'Confirmed', details: 'Slot #12 · Room 304' }
];

export default function MedicalHistoryScreen() {
  const { user } = useAuth();
  const { C, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'timeline' | 'vault'>('timeline');
  const [filter, setFilter] = useState<string>('All');

  // Vault Docs State
  const [docs, setDocs] = useState<VaultDoc[]>(MOCK_DOCS);
  const [historyList, setHistoryList] = useState<HistoryItem[]>(MOCK_HISTORY);

  // Upload Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState<'Prescription' | 'Lab Report' | 'Vaccine' | 'Discharge Summary'>('Lab Report');
  const [newNotes, setNewNotes] = useState('');

  const handleAddDocument = () => {
    if (!newTitle) {
      Alert.alert('Required', 'Please enter a document title.');
      return;
    }
    const newDoc: VaultDoc = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCat,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      doctor: user?.primaryDoctor || 'Self Uploaded',
      notes: newNotes
    };
    setDocs([newDoc, ...docs]);
    setModalVisible(false);
    setNewTitle('');
    setNewNotes('');
    Alert.alert('Saved', 'Document added to your secure medical vault.');
  };

  const filteredHistory = historyList.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Emergency') return item.type === 'ambulance' || item.type === 'medic';
    if (filter === 'Consultations') return item.type === 'tele_medic' || item.type === 'appointment' || item.type === 'doctor';
    if (filter === 'Pharmacy') return item.type === 'medicine';
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.navy }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} />
      
      {/* Top Header with Back Button */}
      <NavigationHeader title="Medical Records & History" subtitle="Unified encrypted personal vault" />

      {/* Tab Switcher */}
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 }}>
        <View style={[styles.tabBar, { backgroundColor: C.navy3 }]}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'timeline' && { backgroundColor: C.blue }]}
            onPress={() => setActiveTab('timeline')}
          >
            <Ionicons name="time" size={16} color={activeTab === 'timeline' ? '#fff' : C.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'timeline' ? '#fff' : C.textMuted }]}>Care Timeline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'vault' && { backgroundColor: C.blue }]}
            onPress={() => setActiveTab('vault')}
          >
            <Ionicons name="folder-open" size={16} color={activeTab === 'vault' ? '#fff' : C.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'vault' ? '#fff' : C.textMuted }]}>Health Vault ({docs.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
        {/* TAB 1: Care Timeline */}
        {activeTab === 'timeline' && (
          <View>
            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {['All', 'Emergency', 'Consultations', 'Pharmacy'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    { backgroundColor: filter === cat ? C.blue : C.navy3, borderColor: filter === cat ? C.blue : C.cardBorder }
                  ]}
                  onPress={() => setFilter(cat)}
                >
                  <Text style={[styles.filterText, { color: filter === cat ? '#fff' : C.textMain }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredHistory.map((item) => (
              <View key={item.id} style={[styles.historyCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor:
                          item.type === 'ambulance' ? 'rgba(232,41,58,0.15)' :
                          item.type === 'tele_medic' ? 'rgba(99,139,255,0.15)' :
                          item.type === 'medicine' ? 'rgba(0,201,167,0.15)' : 'rgba(255,179,0,0.15)'
                      }
                    ]}
                  >
                    <Ionicons
                      name={
                        item.type === 'ambulance' ? 'alert-circle' :
                        item.type === 'tele_medic' ? 'call' :
                        item.type === 'medicine' ? 'medkit' : 'calendar'
                      }
                      size={22}
                      color={
                        item.type === 'ambulance' ? C.red :
                        item.type === 'tele_medic' ? C.blue :
                        item.type === 'medicine' ? C.green : '#FFB300'
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.itemTitle, { color: C.textMain }]} numberOfLines={1}>{item.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,201,167,0.15)' }]}>
                        <Text style={[styles.statusText, { color: C.green }]}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={[styles.itemSub, { color: C.textMuted }]}>{item.subtitle}</Text>
                    <Text style={[styles.itemDate, { color: C.textDim }]}>{item.date}</Text>
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />
                <Text style={[styles.itemDetails, { color: C.textMuted }]}>{item.details}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 2: Digital Health Vault */}
        {activeTab === 'vault' && (
          <View>
            {/* Add Document Action */}
            <TouchableOpacity style={[styles.addDocBtn, { backgroundColor: C.blue }]} onPress={() => setModalVisible(true)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.addDocText}>Upload New Medical Record</Text>
            </TouchableOpacity>

            {docs.map((doc) => (
              <View key={doc.id} style={[styles.docCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.docIcon, { backgroundColor: 'rgba(99,139,255,0.15)' }]}>
                    <Ionicons
                      name={doc.category === 'Lab Report' ? 'flask' : doc.category === 'Prescription' ? 'document-text' : 'shield-checkmark'}
                      size={22}
                      color={C.blue}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.docTitle, { color: C.textMain }]}>{doc.title}</Text>
                    <Text style={[styles.docSub, { color: C.textMuted }]}>
                      {doc.category} · {doc.date}
                    </Text>
                    {doc.notes ? <Text style={[styles.docNotes, { color: C.green }]}>{doc.notes}</Text> : null}
                  </View>
                  <Ionicons name="download-outline" size={20} color={C.textMuted} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: C.textMain }]}>Add Medical Record</Text>

            <Text style={[styles.modalLabel, { color: C.textMuted }]}>Document Title</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Lipid Profile Lab Test"
              placeholderTextColor={C.textDim}
            />

            <Text style={[styles.modalLabel, { color: C.textMuted, marginTop: 12 }]}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {(['Prescription', 'Lab Report', 'Vaccine', 'Discharge Summary'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    { backgroundColor: newCat === cat ? C.blue : C.navy3, borderColor: newCat === cat ? C.blue : C.cardBorder }
                  ]}
                  onPress={() => setNewCat(cat)}
                >
                  <Text style={{ color: newCat === cat ? '#fff' : C.textMain, fontSize: RF(11) }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: C.textMuted, marginTop: 12 }]}>Notes / Summary</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={newNotes}
              onChangeText={setNewNotes}
              placeholder="Key findings or doctor instructions"
              placeholderTextColor={C.textDim}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.cardBorder, backgroundColor: C.navy3 }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: C.textMain }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.blue }]} onPress={handleAddDocument}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save to Vault</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabText: { fontSize: RF(12), fontWeight: '700' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: RF(12), fontWeight: '600' },
  historyCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: RF(13), fontWeight: '700', flex: 1, marginRight: 6 },
  itemSub: { fontSize: RF(11), marginTop: 2 },
  itemDate: { fontSize: RF(10), marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: RF(10), fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  itemDetails: { fontSize: RF(11) },
  addDocBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, marginBottom: 16 },
  addDocText: { color: '#fff', fontSize: RF(13), fontWeight: '700' },
  docCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  docIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docTitle: { fontSize: RF(13), fontWeight: '700' },
  docSub: { fontSize: RF(11), marginTop: 2 },
  docNotes: { fontSize: RF(11), marginTop: 4, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  modalTitle: { fontSize: RF(16), fontWeight: '700', marginBottom: 14 },
  modalLabel: { fontSize: RF(12), fontWeight: '600', marginBottom: 4 },
  modalInput: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: RF(13) },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }
});
