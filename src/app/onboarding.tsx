import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RF } from '../utils/Responsive';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, saveMedicalOnboarding } = useAuth();
  const { C, isDark } = useTheme();

  const [step, setStep] = useState(1);

  // Form Fields
  const [age, setAge] = useState(user?.age ? String(user.age) : '26');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [chronicConditions, setChronicConditions] = useState(user?.chronicConditions || '');
  const [medications, setMedications] = useState(user?.medications || '');

  // Emergency Contacts
  const [contact1Name, setContact1Name] = useState(user?.emergencyContacts?.[0]?.name || '');
  const [contact1Rel, setContact1Rel] = useState(user?.emergencyContacts?.[0]?.relation || 'Family');
  const [contact1Phone, setContact1Phone] = useState(user?.emergencyContacts?.[0]?.phone || '');

  const [contact2Name, setContact2Name] = useState(user?.emergencyContacts?.[1]?.name || '');
  const [contact2Rel, setContact2Rel] = useState(user?.emergencyContacts?.[1]?.relation || 'Doctor');
  const [contact2Phone, setContact2Phone] = useState(user?.emergencyContacts?.[1]?.phone || '');

  // Insurance & Organ Donor
  const [insurancePolicy, setInsurancePolicy] = useState(user?.insurancePolicy || '');
  const [primaryDoctor, setPrimaryDoctor] = useState(user?.primaryDoctor || '');
  const [organDonor, setOrganDonor] = useState(user?.organDonor ?? true);

  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!bloodGroup) {
      Alert.alert('Required', 'Please select your blood group.');
      return;
    }
    if (!contact1Name || !contact1Phone) {
      Alert.alert('Required', 'Please provide at least one primary emergency contact.');
      return;
    }

    setLoading(true);
    const emergencyContacts = [
      { name: contact1Name, relation: contact1Rel, phone: contact1Phone }
    ];
    if (contact2Name && contact2Phone) {
      emergencyContacts.push({ name: contact2Name, relation: contact2Rel, phone: contact2Phone });
    }

    const success = await saveMedicalOnboarding({
      age: parseInt(age) || 25,
      gender,
      bloodGroup,
      allergies,
      chronicConditions,
      medications,
      emergencyContacts,
      insurancePolicy,
      primaryDoctor,
      organDonor
    });

    setLoading(false);
    if (success) {
      router.replace('/');
    } else {
      Alert.alert('Error', 'Failed to save medical onboarding details.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.navy1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}>
        {/* Header Badge */}
        <View style={styles.headerBox}>
          <View style={[styles.headerIcon, { backgroundColor: 'rgba(232,41,58,0.15)' }]}>
            <Ionicons name="shield-checkmark" size={28} color={C.red} />
          </View>
          <Text style={[styles.headerTitle, { color: C.textMain }]}>Emergency Medical Setup</Text>
          <Text style={[styles.headerSub, { color: C.textMuted }]}>
            Step {step} of 3: {step === 1 ? 'Vitals & Allergies' : step === 2 ? 'Emergency Contacts' : 'Insurance & Organ Donor'}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: C.navy3 }]}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%`, backgroundColor: C.red }]} />
        </View>

        {/* Step 1: Vitals & Medical Attributes */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: C.textMain }]}>🩸 Medical Profile & Vitals</Text>

            <Text style={[styles.label, { color: C.textMuted }]}>Blood Group *</Text>
            <View style={styles.bloodWrap}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.bloodChip,
                    { backgroundColor: bloodGroup === bg ? C.red : C.navy3, borderColor: bloodGroup === bg ? C.red : C.cardBorder }
                  ]}
                  onPress={() => setBloodGroup(bg)}
                >
                  <Text style={[styles.bloodText, { color: bloodGroup === bg ? '#fff' : C.textMain }]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: C.textMuted }]}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g. 26"
                  placeholderTextColor={C.textDim}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: C.textMuted }]}>Gender</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
                  value={gender}
                  onChangeText={setGender}
                  placeholder="e.g. Male"
                  placeholderTextColor={C.textDim}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: C.textMuted, marginTop: 12 }]}>Severe Allergies (Medication/Food)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g. Penicillin, Peanuts, Sulfa"
              placeholderTextColor={C.textDim}
            />

            <Text style={[styles.label, { color: C.textMuted, marginTop: 12 }]}>Chronic Medical Conditions</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={chronicConditions}
              onChangeText={setChronicConditions}
              placeholder="e.g. Asthma, Diabetes, Hypertension"
              placeholderTextColor={C.textDim}
            />

            <Text style={[styles.label, { color: C.textMuted, marginTop: 12 }]}>Ongoing Daily Medications</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={medications}
              onChangeText={setMedications}
              placeholder="e.g. Asthalin Inhaler, Metformin"
              placeholderTextColor={C.textDim}
            />

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: C.red }]} onPress={() => setStep(2)}>
              <Text style={styles.nextText}>Next: Emergency Contacts</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Emergency Contacts */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: C.textMain }]}>📞 Primary Emergency Contacts</Text>
            <Text style={[styles.cardDesc, { color: C.textMuted }]}>
              First responders will notify these contacts instantly during an ambulance dispatch.
            </Text>

            {/* Contact 1 */}
            <Text style={[styles.subHeading, { color: C.blue }]}>Contact 1 (Primary)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain, marginBottom: 8 }]}
              value={contact1Name}
              onChangeText={setContact1Name}
              placeholder="Contact Name (e.g. Rohan Sharma)"
              placeholderTextColor={C.textDim}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
                value={contact1Rel}
                onChangeText={setContact1Rel}
                placeholder="Relation (e.g. Brother)"
                placeholderTextColor={C.textDim}
              />
              <TextInput
                style={[styles.input, { flex: 1.5, backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
                keyboardType="phone-pad"
                value={contact1Phone}
                onChangeText={setContact1Phone}
                placeholder="Phone Number"
                placeholderTextColor={C.textDim}
              />
            </View>

            {/* Contact 2 */}
            <Text style={[styles.subHeading, { color: C.blue, marginTop: 16 }]}>Contact 2 (Secondary/Doctor)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain, marginBottom: 8 }]}
              value={contact2Name}
              onChangeText={setContact2Name}
              placeholder="Contact Name (e.g. Dr. Shruti)"
              placeholderTextColor={C.textDim}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
                value={contact2Rel}
                onChangeText={setContact2Rel}
                placeholder="Relation (e.g. Doctor)"
                placeholderTextColor={C.textDim}
              />
              <TextInput
                style={[styles.input, { flex: 1.5, backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
                keyboardType="phone-pad"
                value={contact2Phone}
                onChangeText={setContact2Phone}
                placeholder="Phone Number"
                placeholderTextColor={C.textDim}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={[styles.backBtn, { borderColor: C.cardBorder }]} onPress={() => setStep(1)}>
                <Text style={[styles.backText, { color: C.textMain }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, { flex: 1, backgroundColor: C.red }]} onPress={() => setStep(3)}>
                <Text style={styles.nextText}>Next: Insurance & Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Insurance & Finish */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: C.textMain }]}>🏥 Insurance & Preferences</Text>

            <Text style={[styles.label, { color: C.textMuted }]}>Health Insurance Policy Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={insurancePolicy}
              onChangeText={setInsurancePolicy}
              placeholder="e.g. HDFC Ergo - POL987654"
              placeholderTextColor={C.textDim}
            />

            <Text style={[styles.label, { color: C.textMuted, marginTop: 12 }]}>Preferred Primary Doctor / Hospital</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={primaryDoctor}
              onChangeText={setPrimaryDoctor}
              placeholder="e.g. Manipal Hospital, Old Airport Road"
              placeholderTextColor={C.textDim}
            />

            <TouchableOpacity
              style={[styles.donorToggle, { backgroundColor: organDonor ? 'rgba(0,201,167,0.15)' : C.navy3, borderColor: organDonor ? C.green : C.cardBorder }]}
              onPress={() => setOrganDonor(!organDonor)}
            >
              <Ionicons name={organDonor ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={organDonor ? C.green : C.textDim} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.donorTitle, { color: C.textMain }]}>Registered Organ Donor</Text>
                <Text style={[styles.donorSub, { color: C.textMuted }]}>Flag profile as registered donor for emergency trauma units.</Text>
              </View>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity style={[styles.backBtn, { borderColor: C.cardBorder }]} onPress={() => setStep(2)}>
                <Text style={[styles.backText, { color: C.textMain }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.finishBtn, { backgroundColor: C.green }]} onPress={handleFinish} disabled={loading}>
                <Text style={styles.finishText}>{loading ? 'Saving...' : 'Complete Setup & Unlock Dashboard'}</Text>
                <Ionicons name="checkmark-done" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBox: { alignItems: 'center', marginBottom: 16 },
  headerIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  headerTitle: { fontSize: RF(20), fontWeight: '700', textAlign: 'center' },
  headerSub: { fontSize: RF(12), marginTop: 4, textAlign: 'center' },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  card: { padding: 16, borderRadius: 16 },
  cardTitle: { fontSize: RF(16), fontWeight: '700', marginBottom: 12 },
  cardDesc: { fontSize: RF(12), marginBottom: 16, lineHeight: 18 },
  label: { fontSize: RF(12), fontWeight: '600', marginBottom: 6 },
  subHeading: { fontSize: RF(13), fontWeight: '700', marginBottom: 8 },
  bloodWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  bloodChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, minWidth: 44, alignItems: 'center' },
  bloodText: { fontSize: RF(13), fontWeight: '700' },
  input: { height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: RF(13) },
  nextBtn: { height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  nextText: { color: '#fff', fontSize: RF(14), fontWeight: '700' },
  backBtn: { width: 90, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: RF(14), fontWeight: '600' },
  finishBtn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  finishText: { color: '#fff', fontSize: RF(13), fontWeight: '700' },
  donorToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  donorTitle: { fontSize: RF(13), fontWeight: '700' },
  donorSub: { fontSize: RF(11), marginTop: 2 }
});
