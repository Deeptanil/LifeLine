export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  token?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  medications?: string;
  emergencyContacts?: EmergencyContact[];
  insurancePolicy?: string;
  primaryDoctor?: string;
  organDonor?: boolean;
  isOnboardingComplete?: boolean;
  history?: any[];
}

let mockUsers: User[] = [
  {
    id: '100',
    name: 'Deeptanil',
    phone: '7760343724',
    passwordHash: '12345678',
    age: 26,
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: 'Penicillin, Peanuts',
    chronicConditions: 'Mild Asthma',
    medications: 'Asthalin Inhaler as needed',
    emergencyContacts: [
      { name: 'Rohan Sharma', relation: 'Brother', phone: '+91 98765 43210' },
      { name: 'Dr. Shruti Sharma', relation: 'Primary Physician', phone: '+91 91234 56789' }
    ],
    insurancePolicy: 'HDFC Ergo Health - POL987654',
    primaryDoctor: 'Dr. Shruti Sharma',
    organDonor: true,
    isOnboardingComplete: true,
    history: []
  }
];

const DOCTORS = [
  { id: 1, name: 'Dr. Shruti Sharma', spec: 'General Physician', rating: '4.9', time: 'Available today' },
  { id: 2, name: 'Dr. Amit Patel', spec: 'Cardiologist', rating: '4.8', time: 'Next: Tomorrow 10 AM' },
  { id: 3, name: 'Dr. Neha Gupta', spec: 'Pediatrician', rating: '5.0', time: 'Available in 20m' },
];

const MEDICINES = [
  { icon: 'medkit', name: 'Paracetamol 500mg', type: 'Strip of 15 tabs · OTC', price: 24, cat: 'Fever', rx: false },
  { icon: 'water', name: 'ORS Electrolyte', type: '10 sachets · Hydration', price: 55, cat: 'Fever', rx: false },
  { icon: 'bandage', name: 'Ibuprofen 400mg', type: 'Strip of 10 tabs · OTC', price: 30, cat: 'Pain Relief', rx: false },
  { icon: 'flask', name: 'Volini Pain Spray', type: '50g Bottle · Topical', price: 140, cat: 'Pain Relief', rx: false },
  { icon: 'flask', name: 'Azithromycin 500mg', type: '3 tabs · Antibiotic', price: 145, cat: 'Antibiotics', rx: true },
  { icon: 'medkit', name: 'Amoxicillin 500mg', type: '10 caps · Antibiotic', price: 110, cat: 'Antibiotics', rx: true },
  { icon: 'eyedrop', name: 'Insulin Glargine', type: '100 IU/mL · Pen', price: 890, cat: 'Diabetes', rx: true },
  { icon: 'beaker', name: 'Metformin 500mg', type: 'Strip of 20 tabs', price: 42, cat: 'Diabetes', rx: true },
  { icon: 'heart', name: 'Telmisartan 40mg', type: 'Heart/BP · 15 tabs', price: 120, cat: 'Cardiac', rx: true },
  { icon: 'leaf', name: 'Asthalin Inhaler', type: '200 MDI · Bronchodilator', price: 155, cat: 'Asthma', rx: true },
];

const PHARMACIES = [
  { id: 1, name: 'MedPlus 24/7', address: 'HSR Layout Sector 2, Bangalore', open: true, phone: '+918012345678', dist: '1.1 km' },
  { id: 2, name: 'Apollo Pharmacy', address: 'Koramangala 5th Block, Bangalore', open: true, phone: '+918087654321', dist: '2.5 km' },
  { id: 3, name: 'Frank Ross Pharmacy', address: 'Indiranagar 100ft Road, Bangalore', open: false, phone: '+918043218765', dist: '4.2 km' },
  { id: 4, name: 'Generic Aadhaar', address: 'BTM Layout Stage 2, Bangalore', open: true, phone: '+918011112222', dist: '3.1 km' },
  { id: 5, name: 'Wellness Forever', address: 'Jayanagar 4th Block, Bangalore', open: true, phone: '+918022223333', dist: '1.9 km' },
];

const HOSPITALS = [
  { id: 1, name: 'Manipal Hospital', location: 'Old Airport Road', dist: '2.1 km', phone: '+91 80 2502 4444' },
  { id: 2, name: 'Sakra World Hospital', location: 'Bellandur', dist: '4.5 km', phone: '+91 80 4969 4969' },
  { id: 3, name: 'Apollo Hospitals', location: 'Bannerghatta Road', dist: '7.2 km', phone: '+91 80 2630 4050' },
  { id: 4, name: 'Aster CMI Hospital', location: 'Hebbal', dist: '9.8 km', phone: '+91 80 4342 0100' },
  { id: 5, name: 'Fortis Hospital', location: 'Cunningham Road', dist: '3.4 km', phone: '+91 80 4199 4444' },
  { id: 6, name: 'St. John’s Medical', location: 'Koramangala', dist: '1.8 km', phone: '+91 80 2206 5000' },
];

export const DB = {
  Users: {
    findMany: async () => mockUsers,
    findByPhone: async (phone: string) => {
      return mockUsers.find(x => x.phone === phone);
    },
    create: async ({ name, phone, passwordHash }: Partial<User>) => {
      if (mockUsers.find(x => x.phone === phone)) throw new Error("Exists");
      const newUser = { id: String(Date.now()), name: name!, phone: phone!, passwordHash: passwordHash!, history: [] };
      mockUsers.push(newUser);
      return newUser;
    },
    update: async (phone: string, updates: Partial<User>) => {
      const idx = mockUsers.findIndex(x => x.phone === phone);
      if (idx === -1) throw new Error("Not Found");
      mockUsers[idx] = { ...mockUsers[idx], ...updates };
      return mockUsers[idx];
    },
    delete: async (phone: string) => {
      mockUsers = mockUsers.filter(x => x.phone !== phone);
    }
  },

  Doctors: {
    findMany: async () => DOCTORS
  },

  Medicines: {
    findMany: async () => MEDICINES,
    findByCategory: async (category: string) => 
      category === 'All' ? MEDICINES : MEDICINES.filter(m => m.cat === category),
  },

  Pharmacies: {
    findMany: async (onlyOpen = false) => 
      onlyOpen ? PHARMACIES.filter(p => p.open) : PHARMACIES
  },

  Hospitals: {
    findMany: async () => HOSPITALS,
    search: async (query: string) => 
      HOSPITALS.filter(h => h.name.toLowerCase().includes(query.toLowerCase()) || h.location.toLowerCase().includes(query.toLowerCase()))
  }
};
