// CARETAI doctor workspace — fictional demo data only.
//
// Every record in this module is fictional and exists purely to demonstrate the
// doctor-side clinical profile layout for this university project. No record
// describes a real person and no real medical information is used. Records that
// are not explicitly defined below fall back to an explicit fictional demo
// profile built from the patient's card identity.

export type ConsultationMode = "Chat" | "Voice";
export type ConsultationLanguage = "বাংলা" | "English";

export type ProfileMedication = {
  name: string;
  dose: string;
  schedule: string;
  duration: string;
  meal: string;
  instruction: string;
};

export type ProfileTest = {
  name: string;
  instruction: string;
  status: string;
};

export type ApprovedRecommendations = {
  medications: ProfileMedication[];
  tests: ProfileTest[];
  diet: string[];
  followUp: { date: string; instruction: string };
  instructions: string;
  updatedBy: string;
  updatedAt: string;
};

export type ProfileCondition = {
  name: string;
  since: string;
  status: "Active" | "Managed" | "Resolved";
};

export type ProfileAllergy = {
  substance: string;
  reaction: string;
  severity: "Mild" | "Moderate" | "Severe";
};

export type ProfilePastMedication = {
  name: string;
  period: string;
  reason: string;
};

export type ProfileVisit = {
  id: number;
  date: string;
  mode: ConsultationMode;
  language: ConsultationLanguage;
  concern: string;
  summary: string;
  mainPoints: string[];
  review: string;
  recommendations?: ApprovedRecommendations;
  followUp?: { date: string; instruction: string };
};

export type ProfileMessage = {
  author: "CARETAI" | "Caregiver" | "Doctor";
  text: string;
};

export type ProfileReport = {
  name: string;
  date: string;
  status: "Available" | "Requested" | "Pending" | "Shared";
};

export type ProfileFollowUp = {
  visit: string;
  due: string;
  status: "Scheduled" | "Completed" | "Overdue";
  note: string;
};

export type ProfileAiSuggestion = {
  category: string;
  text: string;
};

export type ProfileCaregiver = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
};

export type PatientProfile = {
  id: string;
  patientId: string;
  name: string;
  initials: string;
  age: string;
  ageGroup: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  phone: string;
  address: string;
  preferredLanguage: ConsultationLanguage;
  caregiver: ProfileCaregiver;
  medicalHistory: string[];
  existingConditions: ProfileCondition[];
  allergies: ProfileAllergy[];
  currentMedications: ProfileMedication[];
  pastMedications: ProfilePastMedication[];
  previousVisits: ProfileVisit[];
  currentConsultation: {
    date: string;
    mode: ConsultationMode;
    language: ConsultationLanguage;
    mainPoints: string[];
    conversation: ProfileMessage[];
  };
  aiVisitSummary: string;
  reports: ProfileReport[];
  followUpHistory: ProfileFollowUp[];
  aiSuggestions: ProfileAiSuggestion[];
  doctorRecommendations: ApprovedRecommendations;
  isGenericDemo: boolean;
};

// Structural input the doctor dashboard already holds on every patient card.
export type PatientProfileSeed = {
  id: string;
  patientId: string;
  name: string;
  initials: string;
  age: string;
  ageGroup: string;
  issue: string;
  phone: string;
  mode: ConsultationMode;
  language: ConsultationLanguage;
  visit: number;
  visitDate: string;
  status: string;
  request?: string;
  followupDate?: string;
};

const ayanAhmed: PatientProfile = {
  id: "ayan-ahmed",
  patientId: "CA-0001",
  name: "Ayan Ahmed",
  initials: "AA",
  age: "8 years",
  ageGroup: "Child",
  gender: "Male",
  dateOfBirth: "May 14, 2018",
  bloodGroup: "B+",
  phone: "+880 1711-000001",
  address: "House 12, Road 5, Dhanmondi, Dhaka",
  preferredLanguage: "বাংলা",
  caregiver: {
    name: "Chaiti Ahmed",
    relationship: "Parent / Caregiver",
    phone: "+880 1711-000001",
    email: "chaiti@example.com",
  },
  medicalHistory: [
    "Night-time cough reported across the last several fictional visits.",
    "No hospital admissions recorded in this fictional demo record.",
  ],
  existingConditions: [
    { name: "Mild seasonal allergy", since: "2023", status: "Managed" },
  ],
  allergies: [
    { substance: "Household dust", reaction: "Sneezing, mild nasal congestion", severity: "Mild" },
  ],
  currentMedications: [
    { name: "Medicine A", dose: "1 tablet", schedule: "1 + 1 + 1", duration: "5 days", meal: "After meals", instruction: "Take only as prescribed by the doctor." },
    { name: "Medicine B", dose: "1 spoon", schedule: "1 + 1 + 0", duration: "7 days", meal: "As directed", instruction: "Follow the measuring instruction provided by the doctor." },
  ],
  pastMedications: [
    { name: "Medicine C", period: "Aug 2026", reason: "Reported sleeping difficulty (fictional demo)" },
  ],
  previousVisits: [
    {
      id: 3,
      date: "September 20, 2026",
      mode: "Voice",
      language: "English",
      concern: "Reduced appetite",
      summary: "The caregiver reported that Ayan had been eating less than usual for about three days while continuing to drink water normally.",
      mainPoints: ["Eating less than usual", "Drinking water normally", "No vomiting reported"],
      review: "Waiting for doctor review",
    },
    {
      id: 2,
      date: "September 12, 2026",
      mode: "Chat",
      language: "বাংলা",
      concern: "Tiredness",
      summary: "The caregiver reported increased tiredness since the previous day, particularly in the afternoon, while normal eating was maintained.",
      mainPoints: ["Tiredness", "Resting more than usual", "Eating normally"],
      review: "Reviewed by Dr. Sarah Rahman",
      recommendations: {
        medications: [
          { name: "Medicine C", dose: "1 tablet", schedule: "1 + 0 + 1", duration: "5 days", meal: "After meals", instruction: "Take only as prescribed by the doctor." },
        ],
        tests: [],
        diet: ["Ensure regular meals and hydration."],
        followUp: { date: "September 20, 2026", instruction: "Return if tiredness continues." },
        instructions: "Continue the recommended routine and monitor reported tiredness.",
        updatedBy: "Dr. Sarah Rahman",
        updatedAt: "September 13, 2026",
      },
      followUp: { date: "September 20, 2026", instruction: "Return if tiredness continues." },
    },
    {
      id: 1,
      date: "August 30, 2026",
      mode: "Chat",
      language: "English",
      concern: "Difficulty sleeping",
      summary: "The caregiver reported interrupted sleep over two nights while daytime activity remained normal.",
      mainPoints: ["Waking during the night", "Normal activity during the day"],
      review: "Waiting for doctor review",
    },
  ],
  currentConsultation: {
    date: "September 28, 2026",
    mode: "Chat",
    language: "বাংলা",
    mainPoints: [
      "Cough present for about five days",
      "More noticeable at night",
      "Difficulty sleeping because of the cough",
    ],
    conversation: [
      { author: "CARETAI", text: "হ্যালো চৈতি। আয়ানের কী সমস্যা হচ্ছে?" },
      { author: "Caregiver", text: "কাশি প্রায় পাঁচ দিন ধরে হচ্ছে।" },
      { author: "CARETAI", text: "কাশি কখন থেকে হচ্ছে?" },
      { author: "Caregiver", text: "রাতে বেশি হয়, তাই ঘুমাতে সমস্যা হচ্ছে।" },
      { author: "CARETAI", text: "কাশির সাথে কি জ্বর হয়েছে?" },
      { author: "Caregiver", text: "জ্বরের কথা বলা হয়নি, তবে রাতে ঘুমাতে সমস্যা হচ্ছে।" },
      { author: "CARETAI", text: "ধন্যবাদ, এই তথ্য ডাক্তারের পর্যালোচনার জন্য সংরক্ষণ করা হবে।" },
    ],
  },
  aiVisitSummary:
    "During this visit, the caregiver reported a cough that had been present for about five days and was more noticeable at night. Difficulty sleeping because of the cough was also reported. Fever and current medication were not mentioned. This summary is organized from the caregiver's own words.",
  reports: [
    { name: "CBC", date: "September 28, 2026", status: "Requested" },
    { name: "Blood Sugar", date: "September 28, 2026", status: "Requested" },
    { name: "Chest X-ray", date: "August 30, 2026", status: "Available" },
  ],
  followUpHistory: [
    { visit: "Visit #2", due: "September 20, 2026", status: "Completed", note: "Caregiver reported tiredness had eased." },
    { visit: "Visit #4", due: "October 5, 2026", status: "Scheduled", note: "Review cough and any available test reports." },
  ],
  aiSuggestions: [
    { category: "Observation", text: "Reported cough and poor sleep have persisted for about five days." },
    { category: "Consideration", text: "The caregiver did not mention fever or current medication; the doctor may wish to ask about these." },
    { category: "Follow-up", text: "A follow-up may help track whether the cough improves over time." },
  ],
  doctorRecommendations: {
    medications: [
      { name: "Medicine A", dose: "1 tablet", schedule: "1 + 1 + 1", duration: "5 days", meal: "After meals", instruction: "Take only as prescribed by the doctor." },
      { name: "Medicine B", dose: "1 spoon", schedule: "1 + 1 + 0", duration: "7 days", meal: "As directed", instruction: "Follow the measuring instruction provided by the doctor." },
    ],
    tests: [
      { name: "CBC", instruction: "Complete the test and share the report during follow-up.", status: "Recommended" },
      { name: "Blood Sugar", instruction: "Follow the test instructions provided by your doctor.", status: "Recommended" },
    ],
    diet: ["Include milk as recommended.", "Include fresh fruit in the daily routine."],
    followUp: { date: "October 5, 2026", instruction: "Return for follow-up and bring any available test reports." },
    instructions: "Continue following the recommended routine and bring any relevant test reports to the follow-up.",
    updatedBy: "Dr. Sarah Rahman",
    updatedAt: "September 28, 2026",
  },
  isGenericDemo: false,
};

const mayaRahman: PatientProfile = {
  id: "maya-rahman",
  patientId: "CA-0006",
  name: "Maya Rahman",
  initials: "MR",
  age: "67 years",
  ageGroup: "Older Adult",
  gender: "Female",
  dateOfBirth: "February 3, 1959",
  bloodGroup: "O+",
  phone: "+880 1711-000006",
  address: "Flat 4B, Green Villa, Uttara, Dhaka",
  preferredLanguage: "বাংলা",
  caregiver: {
    name: "Rehana Rahman",
    relationship: "Daughter / Caregiver",
    phone: "+880 1711-000606",
    email: "rehana@example.com",
  },
  medicalHistory: [
    "Long-standing high blood pressure, managed with regular check-ups (fictional demo).",
    "Reports of disturbed sleep and reduced appetite over recent weeks.",
  ],
  existingConditions: [
    { name: "High blood pressure", since: "2018", status: "Managed" },
    { name: "Reduced appetite", since: "2026", status: "Active" },
  ],
  allergies: [
    { substance: "Penicillin", reaction: "Skin rash", severity: "Moderate" },
  ],
  currentMedications: [
    { name: "Medicine D", dose: "1 tablet", schedule: "1 + 0 + 0", duration: "Ongoing", meal: "After breakfast", instruction: "Take as prescribed by the doctor." },
  ],
  pastMedications: [
    { name: "Medicine E", period: "Jul 2026", reason: "Reported poor sleep (fictional demo)" },
  ],
  previousVisits: [
    {
      id: 5,
      date: "September 10, 2026",
      mode: "Voice",
      language: "বাংলা",
      concern: "Reduced appetite",
      summary: "The caregiver reported that Maya had been eating smaller meals over the previous week.",
      mainPoints: ["Smaller meals", "Drinking water normally"],
      review: "Reviewed by Dr. Sarah Rahman",
    },
  ],
  currentConsultation: {
    date: "September 27, 2026",
    mode: "Voice",
    language: "বাংলা",
    mainPoints: [
      "Difficulty sleeping for about two weeks",
      "Reduced appetite reported",
      "No new medication mentioned",
    ],
    conversation: [
      { author: "CARETAI", text: "মায়া আপার ঘুম কেমন হচ্ছে?" },
      { author: "Caregiver", text: "প্রায় দুই সপ্তাহ ধরে রাতে ঠিকমতো ঘুম হচ্ছে না।" },
      { author: "CARETAI", text: "খাওয়ার ব্যাপারে কোনো পরিবর্তন আছে?" },
      { author: "Caregiver", text: "খাওয়া একটু কমে গেছে, জ্বর নেই।" },
    ],
  },
  aiVisitSummary:
    "The caregiver reported that Maya has had difficulty sleeping for about two weeks, with a reduced appetite during the same period. No fever was mentioned. This summary reflects only what was reported in the conversation.",
  reports: [
    { name: "Blood Pressure Log", date: "September 27, 2026", status: "Shared" },
    { name: "Fasting Blood Sugar", date: "September 12, 2026", status: "Available" },
  ],
  followUpHistory: [
    { visit: "Visit #5", due: "September 24, 2026", status: "Completed", note: "Appetite reviewed." },
    { visit: "Visit #6", due: "October 11, 2026", status: "Scheduled", note: "Review sleep and appetite." },
  ],
  aiSuggestions: [
    { category: "Observation", text: "Sleep difficulty and reduced appetite were reported together over about two weeks." },
    { category: "Consideration", text: "The doctor may wish to compare this with the previous visit's appetite notes." },
  ],
  doctorRecommendations: {
    medications: [
      { name: "Medicine D", dose: "1 tablet", schedule: "1 + 0 + 0", duration: "Ongoing", meal: "After breakfast", instruction: "Continue as prescribed by the doctor." },
    ],
    tests: [
      { name: "Blood Pressure Log", instruction: "Record readings twice daily and share at follow-up.", status: "Recommended" },
    ],
    diet: ["Encourage small, regular meals.", "Maintain steady fluid intake."],
    followUp: { date: "October 11, 2026", instruction: "Return to review sleep and appetite." },
    instructions: "Continue the current routine and bring the blood pressure log to the follow-up.",
    updatedBy: "Dr. Sarah Rahman",
    updatedAt: "September 27, 2026",
  },
  isGenericDemo: false,
};

const rafiAhmed: PatientProfile = {
  id: "rafi-ahmed",
  patientId: "CA-0003",
  name: "Rafi Ahmed",
  initials: "RA",
  age: "10 years",
  ageGroup: "Child",
  gender: "Male",
  dateOfBirth: "November 21, 2015",
  bloodGroup: "A+",
  phone: "+880 1711-000003",
  address: "Road 2, Rampura, Dhaka",
  preferredLanguage: "বাংলা",
  caregiver: {
    name: "Nadia Ahmed",
    relationship: "Parent / Caregiver",
    phone: "+880 1711-000303",
    email: "nadia@example.com",
  },
  medicalHistory: [
    "Recurring headaches reported over recent weeks (fictional demo).",
    "No known chronic conditions recorded in this fictional demo.",
  ],
  existingConditions: [],
  allergies: [],
  currentMedications: [],
  pastMedications: [
    { name: "Medicine F", period: "Aug 2026", reason: "Reported headache (fictional demo)" },
  ],
  previousVisits: [
    {
      id: 2,
      date: "August 31, 2026",
      mode: "Chat",
      language: "বাংলা",
      concern: "Headache",
      summary: "The caregiver reported episodes of headache in the afternoons.",
      mainPoints: ["Afternoon headaches", "No fever mentioned"],
      review: "Reviewed by Dr. Sarah Rahman",
    },
  ],
  currentConsultation: {
    date: "September 25, 2026",
    mode: "Chat",
    language: "বাংলা",
    mainPoints: [
      "Recurring headaches reported",
      "Occurring mostly in the afternoon",
      "Recent temperature readings requested by the doctor",
    ],
    conversation: [
      { author: "CARETAI", text: "রাফির মাথাব্যথা কেমন হচ্ছে?" },
      { author: "Caregiver", text: "দুপুরের দিকে মাথাব্যথা হয়, কয়েকদিন ধরে।" },
      { author: "CARETAI", text: "জ্বর আছে কি? তাপমাত্রা মাপা হয়েছে?" },
      { author: "Caregiver", text: "না, তাপমাত্রা মাপা হয়নি।" },
    ],
  },
  aiVisitSummary:
    "The caregiver reported recurring headaches that occur mostly in the afternoon. Fever was not reported and no temperature readings were provided. The doctor has requested recent temperature readings. This summary is based only on the reported conversation.",
  reports: [
    { name: "Temperature Readings", date: "Requested September 25, 2026", status: "Pending" },
  ],
  followUpHistory: [
    { visit: "Visit #2", due: "September 15, 2026", status: "Overdue", note: "No response recorded in this fictional demo." },
  ],
  aiSuggestions: [
    { category: "Observation", text: "Headaches were reported mostly in the afternoon across recent visits." },
    { category: "Consideration", text: "The doctor requested temperature readings; these are still pending." },
  ],
  doctorRecommendations: {
    medications: [],
    tests: [
      { name: "Temperature Readings", instruction: "Record temperature twice daily and share the readings.", status: "Requested" },
    ],
    diet: ["Maintain regular meals and hydration."],
    followUp: { date: "October 8, 2026", instruction: "Return with the requested temperature readings." },
    instructions: "Please share the requested temperature readings before the next review.",
    updatedBy: "Dr. Sarah Rahman",
    updatedAt: "September 25, 2026",
  },
  isGenericDemo: false,
};

const nabilaIslam: PatientProfile = {
  id: "nabila-islam",
  patientId: "CA-0014",
  name: "Nabila Islam",
  initials: "NI",
  age: "34 years",
  ageGroup: "Adult",
  gender: "Female",
  dateOfBirth: "June 9, 1992",
  bloodGroup: "AB+",
  phone: "+880 1711-000014",
  address: "Sector 7, Uttara, Dhaka",
  preferredLanguage: "বাংলা",
  caregiver: {
    name: "Self",
    relationship: "Patient",
    phone: "+880 1711-000014",
    email: "nabila@example.com",
  },
  medicalHistory: [
    "Persistent tiredness reported over recent weeks (fictional demo).",
  ],
  existingConditions: [],
  allergies: [],
  currentMedications: [],
  pastMedications: [],
  previousVisits: [
    {
      id: 1,
      date: "September 5, 2026",
      mode: "Chat",
      language: "বাংলা",
      concern: "Tiredness",
      summary: "Nabila reported feeling tired during the day for about a week.",
      mainPoints: ["Daytime tiredness", "Sleeping normally"],
      review: "Reviewed by Dr. Sarah Rahman",
    },
  ],
  currentConsultation: {
    date: "September 28, 2026",
    mode: "Voice",
    language: "বাংলা",
    mainPoints: [
      "Persistent tiredness reported",
      "Sleep described as normal",
      "Appetite unchanged",
    ],
    conversation: [
      { author: "CARETAI", text: "নাবিলা আপা, ক্লান্তি কেমন লাগছে?" },
      { author: "Caregiver", text: "সারাদিন ক্লান্ত লাগছে, ঘুম ঠিক আছে।" },
      { author: "CARETAI", text: "খাওয়ার ব্যাপারে কোনো পরিবর্তন আছে?" },
      { author: "Caregiver", text: "খাওয়া আগের মতোই আছে।" },
    ],
  },
  aiVisitSummary:
    "Nabila reported persistent tiredness during the day while describing sleep and appetite as unchanged. No fever or new medication was mentioned. This summary reflects only the reported conversation.",
  reports: [
    { name: "CBC", date: "Requested September 28, 2026", status: "Requested" },
  ],
  followUpHistory: [
    { visit: "Visit #1", due: "September 19, 2026", status: "Completed", note: "Tiredness reviewed." },
  ],
  aiSuggestions: [
    { category: "Observation", text: "Tiredness was reported again while sleep and appetite were described as normal." },
    { category: "Consideration", text: "The doctor may wish to review the requested test results at follow-up." },
  ],
  doctorRecommendations: {
    medications: [],
    tests: [
      { name: "CBC", instruction: "Complete the test and share the report at follow-up.", status: "Recommended" },
    ],
    diet: ["Maintain regular meals and hydration."],
    followUp: { date: "October 3, 2026", instruction: "Return with the test report." },
    instructions: "Complete the recommended test and bring the report to the follow-up.",
    updatedBy: "Dr. Sarah Rahman",
    updatedAt: "September 28, 2026",
  },
  isGenericDemo: false,
};

const detailedProfiles: Record<string, PatientProfile> = {
  "ayan-ahmed": ayanAhmed,
  "maya-rahman": mayaRahman,
  "rafi-ahmed": rafiAhmed,
  "nabila-islam": nabilaIslam,
};

function createGenericDemoProfile(seed: PatientProfileSeed): PatientProfile {
  return {
    id: seed.id,
    patientId: seed.patientId,
    name: seed.name,
    initials: seed.initials,
    age: seed.age,
    ageGroup: seed.ageGroup,
    gender: "Not recorded in this demo",
    dateOfBirth: "Not recorded in this demo",
    bloodGroup: "Not recorded",
    phone: seed.phone,
    address: "Not recorded in this demo",
    preferredLanguage: seed.language,
    caregiver: {
      name: "Demo caregiver",
      relationship: "Not recorded in this demo",
      phone: "Not recorded",
      email: "Not recorded in this demo",
    },
    medicalHistory: [
      "No detailed medical history is recorded for this fictional demo profile.",
    ],
    existingConditions: [],
    allergies: [],
    currentMedications: [],
    pastMedications: [],
    previousVisits: [],
    currentConsultation: {
      date: seed.visitDate,
      mode: seed.mode,
      language: seed.language,
      mainPoints: [seed.issue],
      conversation: [
        {
          author: "CARETAI",
          text: "This is an explicit fictional demo profile. A full conversation transcript is not available for this patient.",
        },
      ],
    },
    aiVisitSummary: `This is a fictional demo summary for ${seed.name}. The reported concern on file is: ${seed.issue}. This placeholder record contains no real clinical information.`,
    reports: [],
    followUpHistory: [],
    aiSuggestions: [
      {
        category: "Demo note",
        text: "This fictional profile has no detailed records yet. Add a demo record to explore the full layout.",
      },
    ],
    doctorRecommendations: {
      medications: [],
      tests: [],
      diet: [],
      followUp: {
        date: "Not scheduled in this demo",
        instruction: "No follow-up guidance recorded for this fictional demo profile.",
      },
      instructions: "No doctor-approved recommendations recorded for this fictional demo profile.",
      updatedBy: "Not recorded",
      updatedAt: "Not recorded",
    },
    isGenericDemo: true,
  };
}

export function getPatientProfile(seed: PatientProfileSeed): PatientProfile {
  return detailedProfiles[seed.id] ?? createGenericDemoProfile(seed);
}
