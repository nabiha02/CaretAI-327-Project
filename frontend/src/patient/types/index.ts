export type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

export type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export type IconName =
  | "brand"
  | "home"
  | "visits"
  | "plus"
  | "user"
  | "settings"
  | "logout"
  | "bell"
  | "chevron"
  | "chat"
  | "mic"
  | "video"
  | "calendar"
  | "clock"
  | "arrow"
  | "edit"
  | "shield"
  | "info"
  | "download"
  | "print"
  | "care"
  | "pill"
  | "test"
  | "leaf"
  | "clipboard"
  | "checkDocument"
  | "stethoscope"
  | "inbox";

export type VisitRecord = {
  id: number;
  date: string;
  mode: "Chat" | "Voice";
  language: "বাংলা" | "English";
  status: "Confirmed" | "Reviewed";
  duration?: string;
  mainConcern: string;
  onset: string;
  pattern?: string;
  reportedInformation: string[];
  quotes: string[];
  summary: string;
  notMentioned: { label: string; value: string }[];
  review: { status: "Waiting for doctor review" | "Reviewed"; doctor?: string; date?: string };
  recommendations?: {
    medications: { name: string; dose: string; schedule: string; duration: string; meal: string; instruction: string }[];
    tests: { name: string; instruction: string; status: string }[];
    diet: string[];
    instructions: string;
  };
  followup?: { date: string; instruction: string };
};
