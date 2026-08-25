import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { NavigationHeader } from '../components/NavigationHeader';
import { RF } from '../utils/Responsive';

const SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Sore Throat', 'Fatigue',
  'Nausea', 'Vomiting', 'Diarrhea', 'Shortness of Breath',
  'Chest Pain', 'Dizziness', 'Muscle Ache', 'Joint Pain'
];

type RecommendationNode = {
  type: 'danger' | 'warning' | 'default';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  color: string;
  border: string;
  mainBtn: { label: string; route: '/emergency' | '/doctor' | '/medicine' | null; params?: any } | null;
  secBtn: { label: string; route: '/medicine' | '/doctor' | null; params?: any } | null;
};

export default function SymptomsScreen() {
  const router = useRouter();
  const { C, isDark } = useTheme();
  const styles = getStyles(C);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [painLevel, setPainLevel] = useState<'Mild' | 'Moderate' | 'Severe' | null>(null);

  const toggleSymptom = (s: string) => {
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setSearchQuery(''); 
  };
  
  const displayedSymptoms = SYMPTOMS.filter(s => s.toLowerCase().includes((searchQuery || '').toLowerCase()));

  const getRecommendation = (): RecommendationNode => {
    const hasFever = selected.includes('Fever');
    const hasCough = selected.includes('Cough');
    const hasChestPain = selected.includes('Chest Pain');
    const hasBreathing = selected.includes('Shortness of Breath');

    if (hasChestPain || hasBreathing || painLevel === 'Severe') {
      return {
        type: 'danger', icon: 'warning',
        title: 'Emergency Medical Attention Required',
        desc: 'Chest pain or shortness of breath can be signs of a medical emergency. Do not wait.',
        color: 'rgba(232,41,58,0.15)', border: 'rgba(232,41,58,0.3)',
        mainBtn: { label: 'Call Ambulance', route: '/emergency', params: { autoTrigger: 'true' } },
        secBtn: null
      };
    }
    
    if (painLevel === 'Moderate' || (hasFever && hasCough)) {
       return {
         type: 'warning', icon: 'thermometer',
         title: painLevel === 'Moderate' ? 'High Discomfort' : 'Possible Infection',
         desc: 'Check your temperature and consider consulting a doctor immediately if pain persists.',
         color: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
         mainBtn: { label: 'Book Consult', route: '/doctor' },
         secBtn: { label: 'Buy Paracetamol', route: '/medicine', params: { addItem: 'Paracetamol 500mg', tab: 'delivery' } }
       };
    }
    
    if (selected.length === 0) {
      return {
        type: 'default', icon: 'medical',
        title: 'Select Symptoms',
        desc: 'Please select symptoms from the list above, or directly book a consultation with a General Physician.',
        color: C.navy3, border: C.cardBorder,
        mainBtn: { label: 'Book Consult', route: '/doctor' },
        secBtn: null
      };
    }

    return {
      type: 'default', icon: 'search',
      title: 'Select More Symptoms',
      desc: 'These combinations usually resolve with adequate rest, but do not ignore them if they escalate.',
      color: C.navy3, border: C.cardBorder,
      mainBtn: { label: 'Check Store', route: '/medicine' },
      secBtn: { label: 'Book Consult', route: '/doctor' }
    };
  };

  const rec = getRecommendation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.navy }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} />

      <NavigationHeader title="Health Checker" subtitle="Analyze your current symptoms" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        
          <View style={styles.searchBarBox}>
            <Ionicons name="search" size={18} color={C.textDim} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Type a symptom..."
              placeholderTextColor={C.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.tagGrid}>
            {displayedSymptoms.map(s => {
              const isSel = selected.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  activeOpacity={0.7}
                  onPress={() => toggleSymptom(s)}
                  style={[styles.tag, isSel && styles.tagActive]}
                >
                  <Text style={[styles.tagText, isSel && styles.tagTextActive]}>{s}</Text>
                  {isSel && <Ionicons name="close" size={14} color="#638BFF" style={{ marginLeft: 6 }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {selected.length > 0 && (
            <View style={styles.painMeterWrap}>
               <Text style={styles.painTitle}>How severe is your discomfort?</Text>
               <View style={styles.painRow}>
                 {['Mild', 'Moderate', 'Severe'].map(level => {
                    const isSel = painLevel === level;
                    const color = level === 'Severe' ? C.red : level === 'Moderate' ? C.amber : C.teal;
                    return (
                      <TouchableOpacity 
                         key={level} 
                         style={[styles.painBtn, isSel && { backgroundColor: color, borderColor: color }]}
                         onPress={() => setPainLevel(level as any)}
                         activeOpacity={0.8}
                      >
                         <Text style={[styles.painBtnText, isSel && { color: '#fff' }]}>{level}</Text>
                      </TouchableOpacity>
                    );
                 })}
               </View>
            </View>
          )}

          <View style={styles.bottomCardWrap}>
            <View style={[styles.recCard, { backgroundColor: rec.color, borderColor: rec.border }]}>
              <View style={styles.recHeaderRow}>
                 <Ionicons name={rec.icon} size={24} color={rec.type === 'danger' ? C.red : rec.type === 'warning' ? C.amber : C.textMain} />
                 <Text style={styles.recTitle}>{rec.title}</Text>
              </View>
              <Text style={styles.recDesc}>{rec.desc}</Text>

              <View style={styles.actionRow}>
                 {rec.secBtn && (
                   <TouchableOpacity style={[styles.secBtn, { backgroundColor: C.navy3, borderColor: C.textDim, borderWidth: 1 }]} activeOpacity={0.8} onPress={() => {
                      if (rec.secBtn?.route) {
                         if (rec.secBtn.params) {
                            router.push({ pathname: rec.secBtn.route, params: rec.secBtn.params });
                         } else {
                            router.push(rec.secBtn.route);
                         }
                      }
                   }}>
                      <Text style={[styles.secBtnText, { color: C.textMain }]} numberOfLines={1}>{rec.secBtn.label}</Text>
                   </TouchableOpacity>
                 )}
                {rec.mainBtn && (
                  <TouchableOpacity 
                     style={[styles.mainBtn, rec.type === 'danger' && { backgroundColor: C.red }, !rec.secBtn && { flex: 1 }]} 
                     onPress={() => {
                        if (rec.mainBtn?.route) {
                           if (rec.mainBtn.params) {
                              router.push({ pathname: rec.mainBtn.route, params: rec.mainBtn.params });
                           } else {
                              router.push(rec.mainBtn.route);
                           }
                        }
                     }}
                     activeOpacity={0.8}
                  >
                     <Text style={styles.mainBtnText} numberOfLines={1}>{rec.mainBtn.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  header: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: RF(26), fontWeight: '700', color: C.textMain, letterSpacing: -0.5 },
  sub: { fontSize: RF(13), color: C.textMuted, marginTop: 4 },
  
  searchBarBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navy3, paddingHorizontal: 16, borderRadius: 16, marginHorizontal: 22, marginTop: 20, borderWidth: 1, borderColor: C.cardBorder },
  searchInput: { flex: 1, paddingVertical: 14, marginLeft: 10, color: C.textMain, fontSize: RF(14) },
  
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 22, marginTop: 14, gap: 10, paddingBottom: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder },
  tagActive: { backgroundColor: 'rgba(99,139,255,0.15)', borderColor: 'rgba(99,139,255,0.3)' },
  tagText: { color: C.textMuted, fontSize: RF(13), fontWeight: '600' },
  tagTextActive: { color: '#638BFF', fontWeight: '800' },

  painMeterWrap: { paddingHorizontal: 22, marginTop: 24 },
  painTitle: { fontSize: RF(15), fontWeight: '800', color: C.textMain, marginBottom: 12 },
  painRow: { flexDirection: 'row', gap: 10 },
  painBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.cardBorder },
  painBtnActive: { borderColor: C.red, backgroundColor: 'rgba(232,41,58,0.1)' },
  painBtnText: { fontSize: RF(14), fontWeight: '700', color: C.textMuted },

  bottomCardWrap: { paddingHorizontal: 22, marginTop: 30 },
  recCard: { borderRadius: 24, padding: 22, borderWidth: 1 },
  recHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  recTitle: { fontSize: RF(18), fontWeight: '800', color: C.textMain, flex: 1 },
  recDesc: { fontSize: RF(14), color: C.textMuted, lineHeight: 22, marginBottom: 24 },
  
  actionRow: { flexDirection: 'row', gap: 12 },
  mainBtn: { flex: 1.5, paddingVertical: 14, borderRadius: 12, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { color: '#fff', fontWeight: '800', fontSize: RF(14) },
  secBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secBtnText: { fontWeight: '700', fontSize: RF(13) },
});
