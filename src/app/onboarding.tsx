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
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, saveMedicalOnboarding } = useAuth();
  const { C } = useTheme();

  const [step, setStep] = useState(1);

  // Form Fields — pre-populated from existing user data
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [chronicConditions, setChronicConditions] = useState(user?.chronicConditions || '');
  const [medications, setMedications] = useState(user?.medications || '');

  // Emergency Contacts
  const [contact1Name, setContact1Name] = useState(user?.emergencyContacts?.[0]?.name || '');
  const [contact1Rel, setContact1Rel] = useState(user?.emergencyContacts?.[0]?.relation || '');
  const [contact1Phone, setContact1Phone] = useState(user?.emergencyContacts?.[0]?.phone || '');

  const [contact2Name, setContact2Name] = useState(user?.emergencyContacts?.[1]?.name || '');
  const [contact2Rel, setContact2Rel] = useState(user?.emergencyContacts?.[1]?.relation || '');
  const [contact2Phone, setContact2Phone] = useState(user?.emergencyContacts?.[1]?.phone || '');

  // Insurance & Organ Donor
  const [insurancePolicy, setInsurancePolicy] = useState(user?.insurancePolicy || '');
  const [primaryDoctor, setPrimaryDoctor] = useState(user?.primaryDoctor || '');
  const [organDonor, setOrganDonor] = useState(user?.organDonor ?? false);

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
      { name: contact1Name, relation: contact1Rel || 'Family', phone: contact1Phone }
    ];
    if (contact2Name && contact2Phone) {
      emergencyContacts.push({ name: contact2Name, relation: contact2Rel || 'Other', phone: contact2Phone });
    }

    const success = await saveMedicalOnboarding({
      age: parseInt(age) || undefined,
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
      Alert.alert('Error', 'Failed to save medical details. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.navy1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}>

        {/* Header Badge */}
        <View style={styles.headerBox}>
          <View style={[styles.headerIcon, { backgroundColor: 'rgba(232,41,58,0.15)' }]}>
            <Ionicons name="shield-checkmark" size={28} color={C.red} />
          </View>
          <Text style={[styles.headerTitle, { color: C.textMain }]}>Emergency Medical Setup</Text>
          <Text style={[styles.headerSub, { color: C.textMuted }]}>
            Step {step} of 3 · {step === 1 ? 'Vitals & Allergies' : step === 2 ? 'Emergency Contacts' : 'Insurance & Preferences'}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: C.navy3 }]}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` as any, backgroundColor: C.red }]} />
        </View>

        {/* ── Step 1: Vitals & Medical Attributes ── */}
        {step === 1 && (
          <View style={[styles.card, { backgroundColor: C.navy2, borderColor: C.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: C.textMain }]}>🩸 Medical Profile & Vitals</Text>

            <Text style={[styles.label, { color: C.textMuted }]}>Blood Group *</Text>
            <View style={styles.bloodWrap}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.bloodChip,
                    {
                      backgroundColor: bloodGroup === bg ? C.red : C.navy3,
                      borderColor: bloodGroup === bg ? C.red : C.cardBorder
                    }
                  ]}
                  onPress={() => setBloodGroup(bg)}
                >
                  <Text style={[styles.bloodText, { color: bloodGroup === bg ? '#fff' : C.textMain }]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Age */}
            <Text style={[styles.label, { color: C.textMuted }]}>Age</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 26"
              placeholderTextColor={C.textDim}
            />

            {/* Gender selector */}
            <Text style={[styles.label, { color: C.textMuted }]}>Gender</Text>
            <View style={styles.genderWrap}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderChip,
                    { backgroundColor: gender === g ? C.blue : C.navy3, borderColor: gender === g ? C.blue : C.cardBorder }
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, { color: gender === g ? '#fff' : C.textMain }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.textMuted }]}>Severe Allergies (Medication / Food)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g. Penicillin, Peanuts, Sulfa"
              placeholderTextColor={C.textDim}
            />

            <Text style={[styles.label, { color: C.textMuted }]}>Chronic Medical Conditions</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={chronicConditions}
              onChangeText={setChronicConditions}
              placeholder="e.g. Asthma, Diabetes, Hypertension"
              placeholderTextColor={C.textDim}
            />

            <Text style={[styles.label, { color: C.textMuted }]}>Ongoing Daily Medications</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={medications}
              onChangeText={setMedications}
              placeholder="e.g. Asthalin Inhaler, Metformin 500mg"
              placeholderTextColor={C.textDim}
            />

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.red }]} onPress={() => setStep(2)}>
              <Text style={styles.primaryBtnText}>Next: Emergency Contacts</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Emergency Contacts ── */}
        {step === 2 && (
          <View style={[styles.card, { backgroundColor: C.navy2, borderColor: C.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: C.textMain }]}>📞 Emergency Contacts</Text>
            <Text style={[styles.cardDesc, { color: C.textMuted }]}>
              First responders will notify these contacts instantly during an emergency dispatch.
            </Text>

            {/* Contact 1 */}
            <Text style={[styles.subHeading, { color: C.blue }]}>Contact 1 (Primary) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={contact1Name}
              onChangeText={setContact1Name}
              placeholder="Full Name (e.g. Rohan Sharma)"
              placeholderTextColor={C.textDim}
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={contact1Rel}
              onChangeText={setContact1Rel}
              placeholder="Relation (e.g. Brother, Parent)"
              placeholderTextColor={C.textDim}
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              keyboardType="phone-pad"
              value={contact1Phone}
              onChangeText={setContact1Phone}
              placeholder="Phone Number"
              placeholderTextColor={C.textDim}
            />

            {/* Contact 2 */}
            <Text style={[styles.subHeading, { color: C.blue, marginTop: 8 }]}>Contact 2 (Secondary / Doctor)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={contact2Name}
              onChangeText={setContact2Name}
              placeholder="Full Name (e.g. Dr. Shruti)"
              placeholderTextColor={C.textDim}
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={contact2Rel}
              onChangeText={setContact2Rel}
              placeholder="Relation (e.g. Doctor, Friend)"
              placeholderTextColor={C.textDim}
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              keyboardType="phone-pad"
              value={contact2Phone}
              onChangeText={setContact2Phone}
              placeholder="Phone Number"
              placeholderTextColor={C.textDim}
            />

            <View style={styles.navRow}>
              <TouchableOpacity style={[styles.backBtn, { borderColor: C.cardBorder }]} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={16} color={C.textMain} />
                <Text style={[styles.backBtnText, { color: C.textMain }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: C.red }]} onPress={() => setStep(3)}>
                <Text style={styles.primaryBtnText}>Next: Insurance</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step 3: Insurance & Finish ── */}
        {step === 3 && (
          <View style={[styles.card, { backgroundColor: C.navy2, borderColor: C.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: C.textMain }]}>🏥 Insurance & Preferences</Text>

            <Text style={[styles.label, { color: C.textMuted }]}>Health Insurance Policy Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={insurancePolicy}
              onChangeText={setInsurancePolicy}
              placeholder="e.g. HDFC Ergo - POL987654"
              placeholderTextColor={C.textDim}
            />

            <Text style={[styles.label, { color: C.textMuted }]}>Preferred Primary Doctor / Hospital</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.navy3, borderColor: C.cardBorder, color: C.textMain }]}
              value={primaryDoctor}
              onChangeText={setPrimaryDoctor}
              placeholder="e.g. Manipal Hospital, Old Airport Road"
              placeholderTextColor={C.textDim}
            />

            <TouchableOpacity
              style={[
                styles.donorToggle,
                {
                  backgroundColor: organDonor ? 'rgba(0,201,167,0.12)' : C.navy3,
                  borderColor: organDonor ? C.green : C.cardBorder
                }
              ]}
              onPress={() => setOrganDonor(!organDonor)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={organDonor ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={organDonor ? C.green : C.textDim}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.donorTitle, { color: C.textMain }]}>Registered Organ Donor</Text>
                <Text style={[styles.donorSub, { color: C.textMuted }]}>
                  Flag your profile as a registered donor for emergency trauma units.
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.navRow}>
              <TouchableOpacity style={[styles.backBtn, { borderColor: C.cardBorder }]} onPress={() => setStep(2)}>
                <Ionicons name="arrow-back" size={16} color={C.textMain} />
                <Text style={[styles.backBtnText, { color: C.textMain }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: C.green }]}
                onPress={handleFinish}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Saving...' : 'Complete Setup'}</Text>
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
  headerBox: { alignItems: 'center', marginBottom: 20 },
  headerIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerTitle: { fontSize: RF(20), fontWeight: '800', textAlign: 'center' },
  headerSub: { fontSize: RF(12), marginTop: 5, textAlign: 'center' },

  progressTrack: { height: 6, borderRadius: 3, marginBottom: 24, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },

  card: { padding: 20, borderRadius: 20, borderWidth: 1 },
  cardTitle: { fontSize: RF(17), fontWeight: '800', marginBottom: 14 },
  cardDesc: { fontSize: RF(12), marginBottom: 16, lineHeight: 19 },

  label: { fontSize: RF(12), fontWeight: '600', marginBottom: 6, marginTop: 12 },
  subHeading: { fontSize: RF(13), fontWeight: '700', marginBottom: 10 },

  // Blood group chips — wider minWidth to prevent AB+ clipping
  bloodWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  bloodChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, minWidth: 56, alignItems: 'center' },
  bloodText: { fontSize: RF(13), fontWeight: '800' },

  // Gender selector chips
  genderWrap: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  genderChip: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  genderText: { fontSize: RF(13), fontWeight: '700' },

  // Full-width stacked inputs
  input: { borderRadius: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 14, fontSize: RF(14), marginTop: 0, marginBottom: 4 },

  // Nav row (Back + Next/Finish)
  navRow: { flexDirection: 'row', gap: 12, marginTop: 24, alignItems: 'center' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 20,
  },
  primaryBtnText: { color: '#fff', fontSize: RF(14), fontWeight: '800', flexShrink: 1, textAlign: 'center' },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 90,
    marginTop: 0,
  },
  backBtnText: { fontSize: RF(14), fontWeight: '700' },

  donorToggle: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 16 },
  donorTitle: { fontSize: RF(14), fontWeight: '800' },
  donorSub: { fontSize: RF(11), marginTop: 3, lineHeight: 16 },
});
