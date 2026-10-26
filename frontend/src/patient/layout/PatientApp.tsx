import { useEffect, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { Toggle } from "../components/Toggle";
import { PatientSidebar } from "../components/PatientSidebar";
import { PatientHeader } from "../components/PatientHeader";
import { LogoutConfirmation } from "../components/LogoutConfirmation";
import { PreviousVisitContext } from "../components/PreviousVisitContext";
import { patientRoutes } from "../data/navigation";
import { demoVisits } from "../data/demoVisits";
import {
  confirmVisit as confirmVisitApi,
  createDraftReport,
  getConversation,
  getVisit,
  listVisits,
  sendConversationMessage,
  startConversation,
  type ApiVisit,
  type ApiVisitSummary,
} from "../../app/api";
import { getActiveDemoRole } from "../../auth/services/demoAuth";
import type {
  IconName,
  SpeechRecognitionConstructor,
  SpeechRecognitionInstance,
  VisitRecord,
} from "../types";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [notificationFilter, setNotificationFilter] = useState("All");
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>([3, 4, 5]);
  const [account, setAccount] = useState({
    name: "Chaiti",
    email: "chaiti@example.com",
    phone: "+880 1XXX-XXXXXX",
  });
  const [editingField, setEditingField] = useState<keyof typeof account | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<"English" | "বাংলা">("বাংলা");
  const [consultationMode, setConsultationMode] = useState<"Chat" | "Voice">("Chat");
  const [accessibility, setAccessibility] = useState({
    largerText: false,
    voiceResponses: true,
    reducedMotion: false,
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    visitUpdates: true,
    carePlanUpdates: true,
    followupReminders: true,
    systemNotifications: true,
  });
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [informationModal, setInformationModal] = useState<"privacy" | "about" | null>(null);
  const [consultationInProgress, setConsultationInProgress] = useState(false);
  const [consultationLanguage, setConsultationLanguage] = useState<"English" | "বাংলা">("বাংলা");
  const [voicePermission, setVoicePermission] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [voiceCallActive, setVoiceCallActive] = useState(false);
  const [visitSaved, setVisitSaved] = useState(false);
  const [savedVisitLanguage, setSavedVisitLanguage] = useState<"en" | "bn" | null>(null);
  const [reviewInformation, setReviewInformation] = useState({
    concern: "",
    symptoms: "",
    timeline: "",
    additional: "",
  });
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState<{ author: string; text: string }[]>([]);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceTranscriptHistory, setVoiceTranscriptHistory] = useState<string[]>([]);
  const [voiceResponse, setVoiceResponse] = useState("");
  const [activeVisitId, setActiveVisitId] = useState<number | null>(null);
  const [activeVisit, setActiveVisit] = useState<ApiVisit | null>(null);
  const [savedVisits, setSavedVisits] = useState<ApiVisitSummary[]>([]);
  const [visitApiAvailable, setVisitApiAvailable] = useState<boolean | null>(null);
  const [visitApiError, setVisitApiError] = useState("");
  const [conversationProgress, setConversationProgress] = useState({ answered: 0, total: 6 });
  const conversationStarting = useRef(false);
  const activeVisitIdRef = useRef<number | null>(null);
  const [editingReviewField, setEditingReviewField] = useState<keyof typeof reviewInformation | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [followupParentId, setFollowupParentId] = useState<number | null>(null);
  const [followupRelationship, setFollowupRelationship] = useState<{ visitId: number; follow_up_of: number } | null>(null);
  const [previousContextExpanded, setPreviousContextExpanded] = useState(true);
  const voiceStream = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const activeNav = location.pathname.startsWith("/patient/settings")
    ? "Settings"
    : location.pathname.startsWith("/patient/notifications")
      ? "Notifications"
      : location.pathname.startsWith("/patient/care-plan")
        ? "Care Plan"
        : location.pathname.startsWith("/patient/profile")
          ? "Patient Profile"
          : location.pathname.startsWith("/patient/visit/summary") || location.pathname.startsWith("/patient/follow-up/summary")
            ? "My Visits"
            : location.pathname.startsWith("/patient/visits")
              ? "My Visits"
              : location.pathname.startsWith("/patient/start-visit") || location.pathname.startsWith("/patient/visit/") || location.pathname.startsWith("/patient/follow-up")
                ? "Start a Visit"
                : "Home";

  const consultationBlocker = useBlocker(({ currentLocation, nextLocation }) =>
    consultationInProgress
    && (currentLocation.pathname === "/patient/visit/chat" || currentLocation.pathname === "/patient/visit/voice" || currentLocation.pathname === "/patient/follow-up/chat" || currentLocation.pathname === "/patient/follow-up/voice")
    && nextLocation.pathname !== "/patient/visit/review"
    && nextLocation.pathname !== "/patient/follow-up/review"
  );

  useEffect(() => {
    const protectActiveConsultation = (event: BeforeUnloadEvent) => {
      if (!consultationInProgress) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", protectActiveConsultation);
    return () => window.removeEventListener("beforeunload", protectActiveConsultation);
  }, [consultationInProgress]);

  useEffect(() => {
    if (location.pathname === "/patient/visit/chat") {
      setConsultationMode("Chat");
      setConsultationInProgress(true);
    }
    if (location.pathname === "/patient/visit/voice") {
      setConsultationMode("Voice");
      setConsultationInProgress(true);
    }
    if (location.pathname === "/patient/follow-up" && followupParentId === null) setFollowupParentId(4);
    if (location.pathname === "/patient/follow-up/chat") {
      setFollowupParentId((current) => current ?? 4);
      setConsultationMode("Chat");
      setConsultationInProgress(true);
    }
    if (location.pathname === "/patient/follow-up/voice") {
      setFollowupParentId((current) => current ?? 4);
      setConsultationMode("Voice");
      setConsultationInProgress(true);
    }
  }, [location.pathname]);

  const queryVisitId = Number(new URLSearchParams(location.search).get("visitId")) || null;
  const detailVisitId = location.pathname.startsWith("/patient/visits/")
    ? Number(location.pathname.split("/").pop()) || null
    : null;

  useEffect(() => {
    let mounted = true;
    listVisits()
      .then((visits) => {
        if (!mounted) return;
        setSavedVisits(visits);
        setVisitApiAvailable(true);
        setVisitApiError("");
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setVisitApiAvailable(false);
        setVisitApiError(error.message);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!queryVisitId) return;
    let mounted = true;
    setActiveVisitId(queryVisitId);
    activeVisitIdRef.current = queryVisitId;
    getConversation(queryVisitId)
      .then((detail) => {
        if (!mounted) return;
        setActiveVisit(detail.visit);
        setConversationProgress(detail.progress);
        setChatMessages(detail.messages.map((message) => ({ author: message.author, text: message.text })));
        setVoiceTranscriptHistory(detail.messages.filter((message) => message.author !== "CARETAI").map((message) => message.text));
        setConsultationMode(detail.visit.mode);
        setConsultationLanguage(detail.visit.language);
        setReviewInformation({
          concern: detail.visit.mainConcern,
          symptoms: detail.visit.pattern || "Not reported",
          timeline: detail.visit.onset,
          additional: detail.visit.reportedInformation.slice(1).join(" · ") || "Not reported",
        });
      })
      .catch((error: Error) => { if (mounted) setVisitApiError(error.message); });
    return () => { mounted = false; };
  }, [queryVisitId]);

  useEffect(() => {
    if (!detailVisitId) {
      setDetailVisit(null);
      return;
    }
    let mounted = true;
    getVisit(detailVisitId)
      .then((visit) => {
        if (!mounted) return;
        setDetailVisit(visit);
        setVisitApiAvailable(true);
      })
      .catch((error: Error) => {
        if (mounted && visitApiAvailable !== true) setVisitApiError(error.message);
      });
    return () => { mounted = false; };
  }, [detailVisitId, visitApiAvailable]);

  const [detailVisit, setDetailVisit] = useState<ApiVisit | null>(null);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const navigatePatient = (label: string) => {
    const destination = patientRoutes[label];
    if (destination) navigate(destination);
    setNotificationsOpen(false);
    setMobileNavOpen(false);
  };

  const medications = [
    { name: "Medicine A", schedule: [1, 1, 1], dose: "1 tablet", duration: "5 days", instruction: "After meals" },
    { name: "Medicine B", schedule: [1, 1, 0], dose: "1 spoon", duration: "7 days", instruction: "As directed by doctor" },
  ];

  const dietItems = [
    { name: "Milk", schedule: [0, 1, 1], instruction: "Include as recommended." },
    { name: "Fruit", schedule: [1, 0, 1], instruction: "Include fresh fruit in the daily routine." },
  ];

  const notifications: {
    id: number;
    icon: IconName;
    title: string;
    description: string;
    time: string;
    action: string;
    category: "Visit" | "Care Plan" | "Follow-up" | "System";
    destination: string;
  }[] = [
    {
      id: 1,
      icon: "clipboard",
      title: "Your care plan has been updated",
      description: "Your doctor added new recommendations to Visit #4.",
      time: "2 hours ago",
      action: "View Care Plan",
      category: "Care Plan",
      destination: "/patient/care-plan",
    },
    {
      id: 2,
      icon: "calendar",
      title: "Follow-up reminder",
      description: "Your recommended follow-up is coming up on October 5, 2026.",
      time: "Yesterday",
      action: "View Follow-up",
      category: "Follow-up",
      destination: "/patient/follow-up",
    },
    {
      id: 3,
      icon: "checkDocument",
      title: "Visit #4 was reviewed",
      description: "Your doctor has reviewed your confirmed visit information.",
      time: "Sep 29, 2026",
      action: "View Visit",
      category: "Visit",
      destination: "/patient/visits/4",
    },
    {
      id: 4,
      icon: "chat",
      title: "Visit #4 confirmed",
      description: "Your consultation information has been successfully confirmed and saved.",
      time: "Sep 28, 2026",
      action: "View Visit",
      category: "Visit",
      destination: "/patient/visits/4",
    },
    {
      id: 5,
      icon: "stethoscope",
      title: "Doctor recommendations available",
      description: "Recommendations have been added to your recent visit.",
      time: "Sep 28, 2026",
      action: "View Care Plan",
      category: "Care Plan",
      destination: "/patient/care-plan",
    },
  ];

  const unreadCount = notifications.filter((item) => !readNotificationIds.includes(item.id)).length;
  const visibleNotifications = notifications.filter((item) => {
    if (notificationFilter === "All") return true;
    if (notificationFilter === "Unread") return !readNotificationIds.includes(item.id);
    return item.category === notificationFilter;
  });

  const openNotification = (id: number, destination: string, category: string) => {
    setReadNotificationIds((current) => current.includes(id) ? current : [...current, id]);
    setNotificationsOpen(false);
    if (category === "Follow-up") {
      setFollowupParentId(4);
      setConsultationLanguage(demoVisits[0].language);
    }
    navigate(destination);
    notify(`${category} update opened`);
  };

  const Schedule = ({ values }: { values: number[] }) => (
    <div className="dose-schedule" aria-label={`${values.join(" plus ")} for morning, noon, and night`}>
      <div className="dose-schedule__numbers"><strong>{values[0]}</strong><span>+</span><strong>{values[1]}</strong><span>+</span><strong>{values[2]}</strong></div>
      <div className="dose-schedule__labels"><span>Morning</span><span>Noon</span><span>Night</span></div>
    </div>
  );

  const printCarePlan = () => {
    setDownloadOpen(false);
    notify("Opening print dialog — choose Save as PDF");
    window.setTimeout(() => window.print(), 250);
  };

  const downloadCarePlanImage = () => {
    setDownloadOpen(false);
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ink = "#243235";
    const soft = "#5f6d6f";
    const teal = "#247d7b";
    const line = "#dfe6e3";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const text = (value: string, x: number, y: number, size = 20, color = ink, weight = 400) => {
      context.fillStyle = color;
      context.font = `${weight} ${size}px DM Sans, Arial, sans-serif`;
      context.fillText(value, x, y);
    };
    const rule = (y: number) => {
      context.strokeStyle = line;
      context.beginPath();
      context.moveTo(75, y);
      context.lineTo(1125, y);
      context.stroke();
    };
    text("CARETAI", 75, 90, 28, teal, 700);
    text("PATIENT CARE PLAN", 75, 145, 16, teal, 700);
    text("Ayan Ahmed", 75, 195, 34, ink, 700);
    text("8 years old · Child", 75, 228, 18, soft);
    text("Last updated: September 28, 2026 · Updated by Doctor", 650, 195, 15, soft);
    rule(265);
    text("MEDICATIONS", 75, 315, 17, teal, 700);
    text("Medicine A", 75, 365, 23, ink, 700);
    text("1 + 1 + 1", 75, 405, 28, teal, 700);
    text("Morning     Noon     Night", 75, 435, 15, soft);
    text("Dose: 1 tablet · Duration: 5 days · After meals", 75, 475, 16, soft);
    text("Medicine B", 650, 365, 23, ink, 700);
    text("1 + 1 + 0", 650, 405, 28, teal, 700);
    text("Morning     Noon     Night", 650, 435, 15, soft);
    text("Dose: 1 spoon · Duration: 7 days · As directed by doctor", 650, 475, 16, soft);
    rule(525);
    text("DIET & FOOD", 75, 575, 17, teal, 700);
    text("Milk", 75, 625, 22, ink, 700);
    text("0 + 1 + 1", 75, 665, 27, teal, 700);
    text("Morning     Noon     Night", 75, 695, 15, soft);
    text("Fruit", 650, 625, 22, ink, 700);
    text("1 + 0 + 1", 650, 665, 27, teal, 700);
    text("Morning     Noon     Night", 650, 695, 15, soft);
    rule(750);
    text("RECOMMENDED TESTS", 75, 800, 17, teal, 700);
    text("CBC", 75, 850, 22, ink, 700);
    text("Recommended · Complete and share at follow-up", 75, 885, 16, soft);
    text("Blood Sugar", 650, 850, 22, ink, 700);
    text("Recommended", 650, 885, 16, soft);
    rule(940);
    text("DOCTOR'S INSTRUCTIONS", 75, 990, 17, teal, 700);
    text("Continue following the recommended routine and monitor the reported symptoms.", 75, 1035, 17, ink);
    text("Bring any relevant test reports to the follow-up.", 75, 1065, 17, ink);
    text("Added by Doctor · September 28, 2026", 75, 1105, 14, soft);
    rule(1150);
    text("FOLLOW-UP", 75, 1200, 17, teal, 700);
    text("Recommended follow-up", 75, 1245, 19, ink, 700);
    text("October 5, 2026", 75, 1282, 27, teal, 700);
    text("Return for follow-up or start a new visit if more information needs to be reported.", 75, 1320, 16, soft);
    rule(1385);
    text("This care plan contains recommendations provided by a doctor and cannot be edited by the patient.", 75, 1435, 14, soft);
    text("This tool collects information for a doctor; it does not provide a diagnosis.", 75, 1480, 14, soft);
    const link = document.createElement("a");
    link.download = "CARETAI-Care-Plan-Ayan-Ahmed.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    notify("Care Plan image downloaded");
  };

  const updateSetting = (callback: () => void) => {
    callback();
    setSettingsDirty(true);
    setSettingsSaved(false);
  };

  const saveSettings = () => {
    setEditingField(null);
    setSettingsDirty(false);
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 3000);
  };

  const startConsultation = (mode: "Chat" | "Voice") => {
    setConsultationMode(mode);
    setConsultationInProgress(true);
    setVoiceCallActive(false);
    setVoicePermission("idle");
    if (!followupParentId) {
      activeVisitIdRef.current = null;
      setActiveVisitId(null);
      setActiveVisit(null);
      setChatMessages([]);
      setVoiceTranscript("");
      setVoiceTranscriptHistory([]);
      setVoiceResponse(consultationLanguage === "বাংলা" ? "আপনার প্রধান সমস্যাটি বলুন।" : "Please describe the main concern.");
      setConversationProgress({ answered: 0, total: 6 });
      setVisitApiError("");
      navigate(`/patient/visit/${mode === "Chat" ? "chat" : "voice"}`);
      return;
    }
    if (mode === "Chat") {
      setChatMessages(followupParentId
        ? (consultationLanguage === "বাংলা"
          ? [
              { author: "CARETAI", text: "ভিজিট #৪-এর পর থেকে আয়ানের কাশি কি ভালো হয়েছে, খারাপ হয়েছে, নাকি একই আছে?" },
              { author: "Chaiti", text: "কাশি এখন অনেক ভালো এবং রাতে কম হচ্ছে।" },
              { author: "CARETAI", text: "ঘুমের সমস্যা কি আগের চেয়ে কমেছে? নতুন কোনো সমস্যা আছে?" },
              { author: "Chaiti", text: "ঘুম ভালো হয়েছে, তবে গলায় নতুন একটু অস্বস্তি আছে।" },
            ]
          : [
              { author: "CARETAI", text: "Since Visit #4, is Ayan's cough better, worse, or about the same?" },
              { author: "Chaiti", text: "The cough is much better and happens less often at night." },
              { author: "CARETAI", text: "Has sleep improved, and is there anything new?" },
              { author: "Chaiti", text: "Sleep has improved, but there is some new throat discomfort." },
            ])
        : consultationLanguage === "বাংলা"
        ? [
            { author: "CARETAI", text: "হ্যালো চৈতি। আয়ানের কী সমস্যা হচ্ছে?" },
            { author: "Chaiti", text: "কাশি প্রায় পাঁচ দিন ধরে হচ্ছে।" },
            { author: "CARETAI", text: "কাশি কখন থেকে হচ্ছে?" },
            { author: "Chaiti", text: "রাতে বেশি হয়, তাই ঘুমাতে সমস্যা হচ্ছে।" },
          ]
        : [
            { author: "CARETAI", text: "Hello Chaiti. What problem is Ayan experiencing?" },
            { author: "Chaiti", text: "The cough has been present for about five days." },
            { author: "CARETAI", text: "How long has the cough been present?" },
            { author: "Chaiti", text: "It is worse at night, so Ayan is having difficulty sleeping." },
          ]);
    }
    setVoiceTranscript(followupParentId
      ? (consultationLanguage === "বাংলা" ? "কাশি এখন অনেক ভালো এবং রাতে কম হচ্ছে।" : "The cough is much better and happens less often at night.")
      : consultationLanguage === "বাংলা" ? "আমার পাঁচ দিন ধরে কাশি হচ্ছে।" : "The cough has been present for about five days.");
    setVoiceTranscriptHistory(followupParentId
      ? (consultationLanguage === "বাংলা"
        ? ["কাশি এখন অনেক ভালো এবং রাতে কম হচ্ছে।", "ঘুম ভালো হয়েছে, তবে গলায় নতুন একটু অস্বস্তি আছে।"]
        : ["The cough is much better and happens less often at night.", "Sleep has improved, but there is some new throat discomfort."])
      : consultationLanguage === "বাংলা"
        ? ["আমার পাঁচ দিন ধরে কাশি হচ্ছে।", "রাতে কাশি বেশি হয়, তাই ঘুমাতে সমস্যা হচ্ছে।"]
        : ["The cough has been present for about five days.", "It is worse at night, so Ayan is having difficulty sleeping."]);
    const initialVoiceQuestion = followupParentId
      ? (consultationLanguage === "বাংলা" ? "আগের ভিজিটের পর থেকে কাশি কি ভালো হয়েছে, খারাপ হয়েছে, নাকি একই আছে?" : "Since the previous visit, is the cough better, worse, or about the same?")
      : (consultationLanguage === "বাংলা" ? "আপনার কী সমস্যা হচ্ছে?" : "What problem are you experiencing?");
    setVoiceResponse(initialVoiceQuestion);
    if (mode === "Voice") {
      speakResponse(initialVoiceQuestion, consultationLanguage);
    }
    const routeBase = followupParentId ? "/patient/follow-up" : "/patient/visit";
    navigate(`${routeBase}/${mode === "Chat" ? "chat" : "voice"}`);
  };

  const languageCode = consultationLanguage === "বাংলা" ? "bn" : "en";

  const speakResponse = (text: string, language: "English" | "বাংলা" = consultationLanguage) => {
    if (!("speechSynthesis" in window)) {
      notify("Voice output is not supported by this browser");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "বাংলা" ? "bn-BD" : "en-US";
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(language === "বাংলা" ? "bn" : "en"));
    if (matchingVoice) utterance.voice = matchingVoice;
    window.speechSynthesis.speak(utterance);
  };

  const persistPatientMessage = async (text: string, mode: "Chat" | "Voice" = consultationMode, language: "English" | "বাংলা" = consultationLanguage) => {
    if (followupParentId || conversationStarting.current) return;
    conversationStarting.current = true;
    try {
      if (!activeVisitIdRef.current) {
        const started = await startConversation({
          main_concern: text,
          mode,
          language,
          reporter: getActiveDemoRole() === "caregiver" ? "Caregiver" : "Patient",
        });
        const visitId = started.visit.id;
        activeVisitIdRef.current = visitId;
        setActiveVisitId(visitId);
        setActiveVisit(started.visit);
        setConversationProgress(started.progress);
        setChatMessages(started.messages.map((message) => ({ author: message.author, text: message.text })));
        setVoiceResponse(started.next_question);
        setSavedVisitLanguage(language === "বাংলা" ? "bn" : "en");
        navigate(`${location.pathname}?visitId=${visitId}`, { replace: true });
        void listVisits().then((visits) => {
          setSavedVisits(visits);
          setVisitApiAvailable(true);
          setVisitApiError("");
        }).catch(() => {});
        if (mode === "Voice") speakResponse(started.next_question, language);
      } else {
        const result = await sendConversationMessage(activeVisitIdRef.current, text);
        setActiveVisit(result.visit);
        setConversationProgress(result.progress);
        setChatMessages((current) => [
          ...current,
          { author: result.message.author, text: result.message.text },
          { author: result.assistant_message.author, text: result.assistant_message.text },
        ]);
        setVoiceResponse(result.assistant_message.text);
        if (mode === "Voice") speakResponse(result.assistant_message.text, language);
        void listVisits().then(setSavedVisits).catch(() => {});
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this response.";
      if (mode === "Chat") setChatDraft(text);
      setVisitApiError(message);
      notify(message);
    } finally {
      conversationStarting.current = false;
    }
  };

  const startSpeechRecognition = (language: "English" | "বাংলা") => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      notify("Speech recognition is not supported by this browser");
      return false;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
    }
    const recognition = new Recognition();
    recognition.lang = language === "বাংলা" ? "bn-BD" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      let hasFinalResult = false;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
        hasFinalResult ||= event.results[index].isFinal;
      }
      if (transcript.trim()) setVoiceTranscript(transcript.trim());
      if (hasFinalResult && transcript.trim()) {
        setVoiceTranscriptHistory((current) => [...current, transcript.trim()]);
        if (!followupParentId) {
          void persistPatientMessage(transcript.trim(), "Voice", language);
        } else {
          const response = language === "বাংলা"
            ? "ধন্যবাদ। আগের নির্দেশনা অনুসরণ করা হয়েছিল কি, এবং নতুন কোনো সমস্যা হয়েছে?"
            : "Thank you. Were the previous instructions followed, and is there anything new?";
          setVoiceResponse(response);
          speakResponse(response, language);
        }
      }
    };
    recognition.onerror = () => setVoicePermission("denied");
    recognitionRef.current = recognition;
    recognition.start();
    return true;
  };

  const requestMicrophone = async () => {
    setVoicePermission("requesting");
    try {
      voiceStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setVoicePermission("granted");
      const recognitionStarted = startSpeechRecognition(consultationLanguage);
      setVoiceCallActive(recognitionStarted);
      if (!recognitionStarted) {
        voiceStream.current.getTracks().forEach((track) => track.stop());
        voiceStream.current = null;
        return;
      }
      const greeting = followupParentId
        ? (consultationLanguage === "বাংলা" ? "আগের ভিজিটের পর থেকে কাশি কি ভালো হয়েছে, খারাপ হয়েছে, নাকি একই আছে?" : "Since the previous visit, is the cough better, worse, or about the same?")
        : consultationLanguage === "বাংলা" ? "আপনার কী সমস্যা হচ্ছে?" : "What problem are you experiencing?";
      setVoiceResponse(greeting);
      speakResponse(greeting);
    } catch {
      setVoicePermission("denied");
      setVoiceCallActive(false);
    }
  };

  const stopVoiceCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
    }
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    voiceStream.current?.getTracks().forEach((track) => track.stop());
    voiceStream.current = null;
    setVoiceCallActive(false);
  };

  const finishConsultation = () => {
    stopVoiceCall();
    if (!followupParentId) {
      const visitId = activeVisitIdRef.current;
      if (!visitId) {
        notify(consultationLanguage === "বাংলা" ? "প্রথমে আপনার প্রধান সমস্যাটি বলুন।" : "Please share the main concern before finishing.");
        return;
      }
      void createDraftReport(visitId)
        .then(({ visit }) => {
          setActiveVisit(visit);
          setReviewInformation({
            concern: visit.mainConcern,
            symptoms: visit.pattern || "Not reported",
            timeline: visit.onset,
            additional: visit.reportedInformation.slice(1).join(" · ") || "Not reported",
          });
          setEditingReviewField(null);
          setReviewConfirmed(false);
          setConsultationInProgress(false);
          navigate(`/patient/visit/review?visitId=${visitId}`);
        })
        .catch((error: Error) => notify(error.message));
      return;
    }
    setConsultationInProgress(false);
    if (consultationLanguage === "বাংলা") {
      setReviewInformation({
        concern: "কাশি আগের চেয়ে ভালো",
        symptoms: "রাতে কম হচ্ছে",
        timeline: "ভিজিট #৪-এর পর থেকে উন্নতি",
        additional: "ঘুম ভালো হয়েছে · নতুন গলায় অস্বস্তি",
      });
    } else {
      setReviewInformation({
        concern: "Cough improved",
        symptoms: "Less frequent at night",
        timeline: "Improved since Visit #4",
        additional: "Sleep improved · New throat discomfort",
      });
    }
    setEditingReviewField(null);
    setReviewConfirmed(false);
    navigate("/patient/follow-up/review");
  };

  const confirmVisit = () => {
    if (!followupParentId && activeVisitIdRef.current) {
      void confirmVisitApi(activeVisitIdRef.current, {
        "Main concern": reviewInformation.concern,
        "Timeline": reviewInformation.timeline,
        "Pattern": reviewInformation.symptoms,
        "Additional information": reviewInformation.additional,
      })
        .then(async ({ visit }) => {
          setActiveVisit(visit);
          setVisitSaved(true);
          setSavedVisitLanguage(languageCode);
          setFollowupRelationship(null);
          setVisitApiAvailable(true);
          void listVisits().then(setSavedVisits).catch(() => {});
          navigate(`/patient/visit/summary?visitId=${visit.id}`);
        })
        .catch((error: Error) => notify(error.message));
      return;
    }
    setVisitSaved(true);
    setSavedVisitLanguage(languageCode);
    setFollowupRelationship(followupParentId ? { visitId: 5, follow_up_of: followupParentId } : null);
    navigate(followupParentId ? "/patient/follow-up/summary" : "/patient/visit/summary");
  };

  const sendChatMessage = () => {
    const value = chatDraft.trim();
    if (!value) return;
    setChatDraft("");
    if (!followupParentId) {
      void persistPatientMessage(value, "Chat", consultationLanguage);
      return;
    }
    setChatMessages((current) => [...current, { author: "Chaiti", text: value }]);
    const response = consultationLanguage === "বাংলা"
      ? "আগের ডাক্তারের নির্দেশনা কি অনুসরণ করা হয়েছিল? কোনো নতুন সমস্যা আছে?"
      : "Were the previous doctor's instructions followed? Is there anything new?";
    window.setTimeout(() => setChatMessages((current) => [...current, { author: "CARETAI", text: response }]), 350);
  };

  const changeConsultationLanguage = (language: "English" | "বাংলা") => {
    if (language === consultationLanguage) return;
    if (!followupParentId && activeVisitIdRef.current) {
      notify("The language is fixed for a saved visit. Start a new visit to switch languages.");
      return;
    }
    setConsultationLanguage(language);
    notify(`Language changed to ${language}`);
    const nextQuestion = followupParentId
      ? (language === "বাংলা" ? "আগের ভিজিটের পর থেকে কী পরিবর্তন হয়েছে?" : "What has changed since the previous visit?")
      : language === "বাংলা" ? "কাশি কতদিন ধরে হচ্ছে?" : "How long has the cough been present?";
    if (followupParentId && location.pathname === "/patient/follow-up/chat") {
      setChatMessages((current) => [...current, { author: "CARETAI", text: nextQuestion }]);
    }
    if (followupParentId && location.pathname === "/patient/follow-up/voice" && voiceCallActive) {
      startSpeechRecognition(language);
      setVoiceResponse(nextQuestion);
      speakResponse(nextQuestion, language);
    }
  };

  const downloadPatientData = () => {
    const data = JSON.stringify({ patient: "Ayan Ahmed", caregiver: account, availableVisits: 4 }, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    link.download = "CARETAI-patient-data.json";
    link.click();
    URL.revokeObjectURL(link.href);
    notify("CARETAI data downloaded");
  };

  const printVisitSummary = () => {
    setDownloadOpen(false);
    notify("Opening print dialog — choose Save as PDF");
    window.setTimeout(() => window.print(), 200);
  };

  const downloadVisitImage = (visit: VisitRecord) => {
    setDownloadOpen(false);
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 2300;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ink = "#243235";
    const soft = "#5f6d6f";
    const teal = "#247d7b";
    const line = "#dfe6e3";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    let y = 90;
    const text = (value: string, x: number, size = 22, color = ink, weight = 400) => {
      context.fillStyle = color;
      context.font = `${weight} ${size}px DM Sans, Arial, sans-serif`;
      context.fillText(value, x, y);
    };
    const wrapped = (value: string, x: number, maxWidth: number, size = 20, color = soft, weight = 400) => {
      context.fillStyle = color;
      context.font = `${weight} ${size}px DM Sans, Arial, sans-serif`;
      const words = value.split(" ");
      let row = "";
      for (const word of words) {
        const next = `${row}${word} `;
        if (context.measureText(next).width > maxWidth && row) {
          context.fillText(row.trim(), x, y);
          y += size * 1.5;
          row = `${word} `;
        } else row = next;
      }
      if (row) {
        context.fillText(row.trim(), x, y);
        y += size * 1.5;
      }
    };
    const rule = () => {
      context.strokeStyle = line;
      context.beginPath();
      context.moveTo(80, y);
      context.lineTo(1320, y);
      context.stroke();
      y += 35;
    };
    const section = (title: string) => {
      y += 20;
      text(title.toUpperCase(), 80, 17, teal, 700);
      y += 34;
    };
    text("CARETAI", 80, 28, teal, 700);
    text("CONFIRMED VISIT SUMMARY", 980, 16, soft, 700);
    y += 58;
    text(`Visit #${visit.id}`, 80, 38, ink, 700);
    text(visit.status, 1120, 18, visit.status === "Reviewed" ? teal : soft, 700);
    y += 38;
    text(`${visit.date}  ·  ${visit.mode} consultation  ·  ${visit.language}`, 80, 18, soft);
    y += 35;
    rule();
    section("Patient information");
    text("Ayan Ahmed", 80, 24, ink, 700);
    text("Date of birth: May 14, 2018", 720, 18, soft);
    y += 34;
    text("8 years old · Male · Child", 80, 18, soft);
    text("Caregiver: Chaiti", 720, 18, soft);
    y += 42;
    section("Visit information");
    wrapped(`Visit #${visit.id} · ${visit.date} · ${visit.mode} · ${visit.language} · ${visit.status}${visit.duration ? ` · ${visit.duration}` : ""}`, 80, 1240, 18, ink, 600);
    section("Main concern");
    text(visit.mainConcern, 80, 30, ink, 700);
    y += 34;
    wrapped(`Onset / duration: ${visit.onset}${visit.pattern ? `   ·   Pattern: ${visit.pattern}` : ""}`, 80, 1240, 19);
    section("Reported information");
    for (const item of visit.reportedInformation) {
      text(`• ${item}`, 90, 19, ink, 500);
      y += 30;
    }
    section("Conversation highlights");
    for (const quote of visit.quotes) {
      wrapped(`“${quote}”`, 90, 1200, 18, soft);
      y += 8;
    }
    section("Overall summary");
    wrapped(visit.summary, 80, 1240, 19, ink);
    y += 8;
    section("Not mentioned");
    for (const item of visit.notMentioned) {
      text(`${item.label}: ${item.value}`, 90, 18, soft, 500);
      y += 29;
    }
    section("Clinical review");
    wrapped(visit.review.status === "Reviewed" ? `Reviewed by ${visit.review.doctor} · ${visit.review.date}` : visit.review.status, 80, 1240, 19, ink, 600);
    section("Doctor recommendations");
    if (visit.recommendations) {
      for (const medication of visit.recommendations.medications) {
        wrapped(`${medication.name} — ${medication.dose} · ${medication.schedule} (Morning · Noon · Night) · ${medication.duration} · ${medication.meal}`, 90, 1200, 18, ink, 600);
        wrapped(medication.instruction, 90, 1200, 17, soft);
      }
      for (const test of visit.recommendations.tests) wrapped(`${test.name} — ${test.status}. ${test.instruction}`, 90, 1200, 18, ink, 500);
      for (const diet of visit.recommendations.diet) wrapped(`Diet: ${diet}`, 90, 1200, 18, ink, 500);
      wrapped(`Doctor's instructions: ${visit.recommendations.instructions}`, 90, 1200, 18, ink, 500);
    } else {
      wrapped("No doctor recommendations yet. This visit is currently waiting for doctor review.", 90, 1200, 18, soft);
    }
    if (visit.followup) {
      section("Follow-up");
      wrapped(`${visit.followup.date} — ${visit.followup.instruction}`, 80, 1240, 19, ink, 600);
    }
    y = Math.min(y + 45, 2210);
    rule();
    wrapped("This tool collects information for a doctor; it does not provide a diagnosis.", 80, 1240, 17, soft, 600);
    const link = document.createElement("a");
    link.download = `CARETAI-Visit-${visit.id}-Summary.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    notify(`Visit #${visit.id} image downloaded`);
  };

  const startFollowup = (visit: VisitRecord) => {
    setFollowupParentId(visit.id);
    setConsultationLanguage(visit.language);
    setPreviousContextExpanded(true);
    setReviewConfirmed(false);
    setVisitSaved(false);
    setFollowupRelationship(null);
    navigate("/patient/follow-up");
  };

  const viewPreviousVisit = (visitId: number) => {
    window.open(`/patient/visits/${visitId}`, "_blank", "noopener,noreferrer");
  };

  if (activeNav === "Settings") {
    const accountRows: { key: keyof typeof account; label: string; type: string }[] = [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
    ];

    return (
      <div className={`app-shell settings-shell ${accessibility.largerText ? "settings-shell--large-text" : ""} ${accessibility.reducedMotion ? "settings-shell--reduced-motion" : ""}`}>
        <PatientSidebar activeNav={activeNav} open={mobileNavOpen} onNavigate={navigatePatient} onLogout={() => setLogoutModalOpen(true)} onClose={() => setMobileNavOpen(false)} />

        <main className="main settings-main">
          <PatientHeader title="Settings" unreadCount={unreadCount} readIds={readNotificationIds} notificationsOpen={notificationsOpen} onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)} onMenu={() => setMobileNavOpen(true)} onNavigate={navigatePatient} onOpenNotification={openNotification} onLogout={() => setLogoutModalOpen(true)} />

          <section className="settings-page-header">
            <div className="eyebrow">Account preferences</div>
            <div className="page-title">Settings</div>
            <p>Manage your account, consultation preferences, and CARETAI experience.</p>
          </section>

          <div className="settings-grid">
            <div className="settings-column">
              <section className="settings-card account-settings-card">
                <div className="settings-card__heading"><span><Icon name="user" size={18} /></span><div><div className="section-title section-title--small">Account</div><p>Your caregiver account details</p></div></div>
                <div className="account-settings-list">
                  {accountRows.map((row) => (
                    <div className="account-settings-row" key={row.key}>
                      <div>
                        <span>{row.label}</span>
                        {editingField === row.key ? (
                          <input
                            type={row.type}
                            value={account[row.key]}
                            aria-label={row.label}
                            autoFocus
                            onChange={(event) => {
                              setAccount({ ...account, [row.key]: event.target.value });
                              setSettingsDirty(true);
                              setSettingsSaved(false);
                            }}
                          />
                        ) : <strong>{account[row.key]}</strong>}
                      </div>
                      <button type="button" onClick={() => setEditingField(editingField === row.key ? null : row.key)}>{editingField === row.key ? "Cancel" : "Edit"}</button>
                    </div>
                  ))}
                </div>
                {editingField && <div className="account-card-action"><Button onClick={saveSettings}>Save Changes</Button></div>}
              </section>

              <section className="settings-card">
                <div className="settings-card__heading"><span><Icon name="chat" size={18} /></span><div><div className="section-title section-title--small">Consultation Preferences</div><p>Choose how CARETAI supports your consultations</p></div></div>
                <div className="preference-group">
                  <div className="setting-label">Preferred Language</div>
                  <div className="segmented-control" aria-label="Preferred language">
                    {(["English", "বাংলা"] as const).map((language) => <button className={preferredLanguage === language ? "active" : ""} type="button" key={language} onClick={() => updateSetting(() => { setPreferredLanguage(language); setConsultationLanguage(language); })}>{language}</button>)}
                  </div>
                  <p>CARETAI will use your selected language during consultations when available.</p>
                </div>
                <div className="preference-group preference-group--mode">
                  <div className="setting-label">Default Consultation Mode</div>
                  <div className="consultation-mode-options">
                    {(["Chat", "Voice"] as const).map((mode) => <button className={consultationMode === mode ? "active" : ""} type="button" key={mode} onClick={() => updateSetting(() => setConsultationMode(mode))}><i />{mode}</button>)}
                    <button className="disabled" type="button" disabled><i />Video <span>Coming Soon</span></button>
                  </div>
                </div>
              </section>

              <section className="settings-card about-settings-card">
                <div className="settings-card__heading"><span><Icon name="brand" size={18} /></span><div><div className="section-title section-title--small">About CARETAI</div><p>Clinical information support for patients and caregivers</p></div></div>
                <div className="about-settings-content">
                  <div><strong>CARETAI</strong><span>v1.0.0</span></div>
                  <p>Clinical Analysis for Responsive Evaluation &amp; Tracking using AI</p>
                  <p>CARETAI helps collect, organize, summarize, and track patient-reported information for clinical review.</p>
                  <button type="button" onClick={() => setInformationModal("about")}>About CARETAI <Icon name="arrow" size={13} /></button>
                </div>
              </section>
            </div>

            <div className="settings-column">
              <section className="settings-card">
                <div className="settings-card__heading"><span><Icon name="info" size={18} /></span><div><div className="section-title section-title--small">Accessibility &amp; Communication</div><p>Adjust how the interface works for you</p></div></div>
                <div className="toggle-list">
                  {[
                    { key: "largerText" as const, title: "Larger Text", description: "Make text and interface elements easier to read." },
                    { key: "voiceResponses" as const, title: "Voice Responses", description: "Allow CARETAI to read responses aloud during voice-enabled consultations." },
                    { key: "reducedMotion" as const, title: "Reduced Motion", description: "Reduce animations and visual movement throughout the interface." },
                  ].map((item) => (
                    <div className="toggle-row" key={item.key}><div><strong>{item.title}</strong><p>{item.description}</p></div><Toggle checked={accessibility[item.key]} label={item.title} onChange={() => updateSetting(() => setAccessibility({ ...accessibility, [item.key]: !accessibility[item.key] }))} /></div>
                  ))}
                </div>
              </section>

              <section className="settings-card">
                <div className="settings-card__heading"><span><Icon name="bell" size={18} /></span><div><div className="section-title section-title--small">Notifications</div><p>Choose which updates you receive</p></div></div>
                <div className="toggle-list">
                  {[
                    { key: "visitUpdates" as const, title: "Visit Updates", description: "Get notified when your visit status changes." },
                    { key: "carePlanUpdates" as const, title: "Care Plan Updates", description: "Get notified when your doctor updates your care plan." },
                    { key: "followupReminders" as const, title: "Follow-up Reminders", description: "Receive reminders about recommended follow-ups." },
                    { key: "systemNotifications" as const, title: "System Notifications", description: "Receive important system and account updates." },
                  ].map((item) => (
                    <div className="toggle-row" key={item.key}><div><strong>{item.title}</strong><p>{item.description}</p></div><Toggle checked={notificationPreferences[item.key]} label={item.title} onChange={() => updateSetting(() => setNotificationPreferences({ ...notificationPreferences, [item.key]: !notificationPreferences[item.key] }))} /></div>
                  ))}
                </div>
              </section>

              <section className="settings-card privacy-settings-card">
                <div className="settings-card__heading"><span><Icon name="shield" size={18} /></span><div><div className="section-title section-title--small">Privacy &amp; Data</div><p>Understand and manage your information</p></div></div>
                <div className="privacy-settings-list">
                  <div><span><strong>How CARETAI Uses Your Information</strong><p>Learn how consultation information is collected and presented to doctors.</p></span><button type="button" onClick={() => setInformationModal("privacy")}>View Privacy Information <Icon name="arrow" size={12} /></button></div>
                  <div><span><strong>Download My Data</strong><p>Download a copy of your available CARETAI information.</p></span><button type="button" onClick={downloadPatientData}>Download Data</button></div>
                  <div className="privacy-settings-row--danger"><span><strong>Delete Account</strong><p>Permanently remove your account and associated information.</p></span><button type="button" onClick={() => setDeleteModalOpen(true)}>Delete Account</button></div>
                </div>
              </section>
            </div>
          </div>

          <footer className="settings-footer"><Icon name="shield" size={13} /> This tool collects information for a doctor; it does not provide a diagnosis.</footer>

          <div className="settings-save-bar" aria-live="polite">
            <div>{settingsSaved ? <span className="settings-saved"><Icon name="checkDocument" size={16} /> Settings saved successfully.</span> : <span>{settingsDirty ? "You have unsaved changes." : "Your settings are up to date."}</span>}</div>
            {!settingsSaved && <Button disabled={!settingsDirty} onClick={saveSettings}>Save Changes</Button>}
          </div>
        </main>

        {deleteModalOpen && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteModalOpen(false); }}>
            <div className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
              <span className="delete-modal__icon"><Icon name="user" size={21} /></span>
              <div className="section-title" id="delete-account-title">Delete your account?</div>
              <p>This will permanently remove your account and associated CARETAI information. This action cannot be undone.</p>
              <div><Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button><button className="danger-button" type="button" onClick={() => navigate("/logout")}>Delete Account</button></div>
            </div>
          </div>
        )}
        {informationModal && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInformationModal(null); }}>
            <div className="delete-modal information-modal" role="dialog" aria-modal="true" aria-labelledby="information-modal-title">
              <span className="delete-modal__icon"><Icon name={informationModal === "privacy" ? "shield" : "brand"} size={21} /></span>
              <div className="section-title" id="information-modal-title">{informationModal === "privacy" ? "How CARETAI uses your information" : "About CARETAI"}</div>
              <p>{informationModal === "privacy" ? "CARETAI collects information reported by patients and caregivers, organizes it, and presents it to doctors for clinical review. It does not provide a diagnosis or expose internal AI reasoning." : "CARETAI helps collect, organize, summarize, and track patient-reported information for clinical review. Version v1.0.0."}</p>
              <div><Button onClick={() => setInformationModal(null)}>Close</Button></div>
            </div>
          </div>
        )}
        <LogoutConfirmation open={logoutModalOpen} onCancel={() => setLogoutModalOpen(false)} onConfirm={() => navigate("/logout")} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    );
  }

  if (activeNav === "Notifications") {
    return (
      <div className="app-shell notifications-shell">
        <PatientSidebar activeNav={activeNav} open={mobileNavOpen} onNavigate={navigatePatient} onLogout={() => setLogoutModalOpen(true)} onClose={() => setMobileNavOpen(false)} />

        <main className="main notifications-main">
          <PatientHeader title="Notifications" unreadCount={unreadCount} readIds={readNotificationIds} notificationsOpen={notificationsOpen} onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)} onMenu={() => setMobileNavOpen(true)} onNavigate={navigatePatient} onOpenNotification={openNotification} onLogout={() => setLogoutModalOpen(true)} />

          <section className="notifications-page-header">
            <div>
              <div className="eyebrow">Updates &amp; reminders</div>
              <div className="page-title">Notifications</div>
              <p>Stay updated about your visits, care plan, and follow-up.</p>
            </div>
            <Button variant="text" disabled={unreadCount === 0} onClick={() => setReadNotificationIds(notifications.map((item) => item.id))}>
              Mark all as read
            </Button>
          </section>

          <section className="notifications-content" aria-label="Notifications">
            <div className="notification-filters" role="tablist" aria-label="Filter notifications">
              {["All", "Unread", "Visits", "Care Plan", "Follow-up"].map((filter) => {
                const category = filter === "Visits" ? "Visit" : filter;
                return (
                  <button
                    className={notificationFilter === category ? "active" : ""}
                    key={filter}
                    type="button"
                    role="tab"
                    aria-selected={notificationFilter === category}
                    onClick={() => setNotificationFilter(category)}
                  >
                    {filter}
                    {filter === "Unread" && unreadCount > 0 && <span>{unreadCount}</span>}
                  </button>
                );
              })}
            </div>

            {visibleNotifications.length > 0 ? (
              <div className="notification-list">
                {visibleNotifications.map((item) => {
                  const isUnread = !readNotificationIds.includes(item.id);
                  return (
                    <button
                      className={`notification-card ${isUnread ? "notification-card--unread" : ""}`}
                      key={item.id}
                      type="button"
                      onClick={() => openNotification(item.id, item.destination, item.category)}
                    >
                      <span className="notification-card__state" aria-hidden="true">{isUnread && <i />}</span>
                      <span className="notification-card__icon"><Icon name={item.icon} size={20} /></span>
                      <span className="notification-card__body">
                        <span className="notification-card__meta"><span>{item.category}</span><time>{item.time}</time></span>
                        <strong>{item.title}</strong>
                        <span className="notification-card__description">{item.description}</span>
                      </span>
                      <span className="notification-card__action">{item.action} <Icon name="arrow" size={14} /></span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="notifications-empty">
                <span><Icon name="inbox" size={25} /></span>
                <strong>{notificationFilter === "Unread" ? "No unread notifications" : "You're all caught up"}</strong>
                <p>{notificationFilter === "Unread" ? "You've read all your updates." : "You don't have any new updates right now."}</p>
              </div>
            )}
          </section>

          <footer className="notifications-footer"><Icon name="shield" size={13} /> This tool collects information for a doctor; it does not provide a diagnosis.</footer>
        </main>
        <LogoutConfirmation open={logoutModalOpen} onCancel={() => setLogoutModalOpen(false)} onConfirm={() => navigate("/logout")} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    );
  }

  if (activeNav !== "Care Plan") {
    const isVisitDetail = location.pathname.startsWith("/patient/visits/");
    const selectedVisitId = detailVisitId;
    const selectedVisit = selectedVisitId
      ? detailVisit?.id === selectedVisitId
        ? detailVisit
        : visitApiAvailable === false
          ? demoVisits.find((visit) => visit.id === selectedVisitId) ?? null
          : null
      : null;
    const isFollowup = location.pathname.startsWith("/patient/follow-up");
    const isFollowupLanding = location.pathname === "/patient/follow-up";
    const isChat = location.pathname === "/patient/visit/chat" || location.pathname === "/patient/follow-up/chat";
    const isVoice = location.pathname === "/patient/visit/voice" || location.pathname === "/patient/follow-up/voice";
    const isReview = location.pathname === "/patient/visit/review" || location.pathname === "/patient/follow-up/review";
    const isSummary = location.pathname === "/patient/visit/summary" || location.pathname === "/patient/follow-up/summary";
    const previousVisit = followupParentId ? demoVisits.find((visit) => visit.id === followupParentId) ?? null : null;
    const isBangla = consultationLanguage === "বাংলা";
    const pageTitle = isSummary
      ? (isBangla ? "নিশ্চিত ভিজিট সারাংশ" : "Confirmed Visit Summary")
      : isVisitDetail
        ? "Visit Summary"
        : isChat
          ? (isBangla ? "বাংলা · চ্যাট পরামর্শ" : "English · Chat Consultation")
          : isVoice
            ? (isBangla ? "বাংলা · Voice Consultation" : "English · Voice Consultation")
            : isReview
              ? (isBangla ? "আপনার ভিজিট পর্যালোচনা করুন" : "Review Your Visit")
              : isFollowup ? "Follow-up Visit" : activeNav;
    const reviewItems: { key: keyof typeof reviewInformation; label: string; icon: IconName }[] = [
      { key: "concern", label: isBangla ? "প্রধান সমস্যা" : "Main concern", icon: "chat" },
      { key: "timeline", label: isBangla ? "কতদিন ধরে" : "Started", icon: "clock" },
      { key: "symptoms", label: isBangla ? "ধরণ" : "Pattern", icon: "visits" },
      { key: "additional", label: isBangla ? "অন্যান্য তথ্য" : "Other information", icon: "info" },
    ];
    const conversationHighlights = consultationMode === "Chat"
      ? chatMessages.filter((message) => message.author !== "CARETAI").map((message) => message.text).slice(-3)
      : voiceTranscriptHistory.slice(-3);

    return (
      <div className="app-shell connected-page-shell">
        <PatientSidebar activeNav={isReview ? "" : activeNav} open={mobileNavOpen} onNavigate={navigatePatient} onLogout={() => setLogoutModalOpen(true)} onClose={() => setMobileNavOpen(false)} />
        <main className="main connected-main">
          <PatientHeader title={pageTitle} unreadCount={unreadCount} readIds={readNotificationIds} notificationsOpen={notificationsOpen} onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)} onMenu={() => setMobileNavOpen(true)} onNavigate={navigatePatient} onOpenNotification={openNotification} onLogout={() => setLogoutModalOpen(true)} />

          {activeNav === "Home" && (
            <div className="connected-content">
              <section className="connected-page-heading"><div><div className="eyebrow">Patient dashboard</div><div className="page-title">Welcome back, Chaiti</div><p>Manage Ayan's visits, follow-up, and latest care information.</p></div><Button onClick={() => navigate("/patient/start-visit")}>Start a New Visit <Icon name="arrow" size={14} /></Button></section>
              <section className="dashboard-action-card"><span><Icon name="chat" size={23} /></span><div><div className="section-title">Report new information</div><p>Start a guided consultation to collect information for clinical review.</p></div><Button onClick={() => navigate("/patient/start-visit")}>Start a Visit</Button></section>
              <div className="connected-card-grid">
                <section className="connected-card"><div className="connected-card__heading"><div><div className="section-title section-title--small">Recent Visits</div><p>Your latest confirmed information</p></div><button type="button" onClick={() => navigate("/patient/visits")}>View all <Icon name="arrow" size={12} /></button></div>{visitApiAvailable === true ? (savedVisits.length ? savedVisits.slice(0, 1).map((visit) => <button className="compact-visit-row" type="button" key={visit.id} onClick={() => navigate(`/patient/visits/${visit.id}`)}><span><Icon name="visits" size={17} /></span><div><strong>Visit #{visit.id}</strong><p>{visit.status} · {visit.date} · {visit.mode}</p></div><Icon name="arrow" size={14} /></button>) : <p>No saved visits yet.</p>) : <button className="compact-visit-row" type="button" onClick={() => navigate("/patient/visits/4")}><span><Icon name="visits" size={17} /></span><div><strong>Demo Visit #4</strong><p>Simulated history · API unavailable</p></div><Icon name="arrow" size={14} /></button>}</section>
                <section className="connected-card"><div className="connected-card__heading"><div><div className="section-title section-title--small">Care Plan</div><p>Updated by your doctor</p></div></div><div className="dashboard-care-summary"><span><Icon name="care" size={19} /></span><div><strong>Recommendations available</strong><p>Last updated September 28, 2026</p></div></div><Button variant="secondary" onClick={() => navigate("/patient/care-plan")}>View Care Plan <Icon name="arrow" size={13} /></Button></section>
              </div>
            </div>
          )}

          {activeNav === "My Visits" && (
            <div className={`connected-content ${isVisitDetail ? "visit-detail-page" : ""}`}>
              {isVisitDetail ? (
                selectedVisit ? (
                  <>
                    <section className="visit-detail-page-header">
                      <div>
                        <button type="button" onClick={() => navigate("/patient/visits")}><Icon name="arrow" size={13} /> Back to My Visits</button>
                        <div><div className="page-title">Visit Summary</div><span className="visit-confirmed-badge"><Icon name="checkDocument" size={12} /> {selectedVisit.status}</span></div>
                        <p>Visit #{selectedVisit.id} · {selectedVisit.date} · {selectedVisit.mode} consultation · {selectedVisit.language}</p>
                      </div>
                      <div className="download-control visit-download-control">
                        <Button variant="secondary" onClick={() => setDownloadOpen(!downloadOpen)}><Icon name="download" size={15} /> Download <Icon name="chevron" size={13} /></Button>
                        {downloadOpen && <div className="download-menu"><button type="button" onClick={printVisitSummary}><Icon name="print" size={17} /><span><strong>Download PDF</strong><small>Clean printable visit record</small></span></button><button type="button" onClick={() => downloadVisitImage(selectedVisit)}><Icon name="download" size={17} /><span><strong>Download Image</strong><small>Professional PNG document</small></span></button></div>}
                      </div>
                    </section>

                    <article className="visit-detail-document">
                      <header className="visit-document-brand"><div><span><Icon name="brand" size={21} /></span><div><strong>CARETAI</strong><small>{detailVisit?.id === selectedVisit.id ? "Local patient visit record" : "Simulated confirmed visit summary"}</small></div></div><div><strong>Visit #{selectedVisit.id}</strong><small>{selectedVisit.date}</small></div></header>

                      <section className="visit-document-identity">
                        <div className="avatar avatar--patient">{detailVisit?.id === selectedVisit.id ? "LP" : "AA"}</div>
                        <div><span>Patient</span><strong>{detailVisit?.id === selectedVisit.id ? "Local patient (identity not stored)" : "Ayan Ahmed"}</strong><p>{detailVisit?.id === selectedVisit.id ? "Identity is not linked in this phase" : "8 years old · Child"}</p></div>
                        <div><span>Visit status</span><strong>{selectedVisit.status}</strong><p>{selectedVisit.mode} · {selectedVisit.language}</p></div>
                      </section>

                      <div className="visit-document-two-column">
                        <section className="visit-document-section">
                          <div className="visit-document-section__heading"><span><Icon name="user" size={16} /></span><div><strong>Patient Information</strong><p>Patient and caregiver details</p></div></div>
                          <dl className="visit-document-details"><div><dt>Patient identity</dt><dd>{detailVisit?.id === selectedVisit.id ? "Not attached in this local phase" : "Ayan Ahmed (simulated)"}</dd></div><div><dt>Date of birth</dt><dd>{detailVisit?.id === selectedVisit.id ? "Not stored" : "May 14, 2018 (simulated)"}</dd></div><div><dt>Age</dt><dd>{detailVisit?.id === selectedVisit.id ? "Not stored" : "8 years (simulated)"}</dd></div><div><dt>Gender</dt><dd>{detailVisit?.id === selectedVisit.id ? "Not stored" : "Male (simulated)"}</dd></div><div><dt>Age group</dt><dd>{detailVisit?.id === selectedVisit.id ? "Not stored" : "Child (simulated)"}</dd></div><div><dt>Preferred language</dt><dd>{selectedVisit.language}</dd></div><div><dt>Caregiver</dt><dd>{detailVisit?.id === selectedVisit.id ? "Reporter role only; no name stored" : "Chaiti · Caregiver (simulated)"}</dd></div></dl>
                        </section>
                        <section className="visit-document-section">
                          <div className="visit-document-section__heading"><span><Icon name="visits" size={16} /></span><div><strong>Visit Information</strong><p>{detailVisit?.id === selectedVisit.id ? "Saved local visit record" : "Simulated confirmed consultation record"}</p></div></div>
                          <dl className="visit-document-details"><div><dt>Visit number</dt><dd>#{selectedVisit.id}</dd></div><div><dt>Visit date</dt><dd>{selectedVisit.date}</dd></div><div><dt>Consultation mode</dt><dd>{selectedVisit.mode}</dd></div><div><dt>Language</dt><dd>{selectedVisit.language}</dd></div><div><dt>Visit status</dt><dd>Confirmed</dd></div>{selectedVisit.duration && <div><dt>Duration</dt><dd>{selectedVisit.duration}</dd></div>}</dl>
                        </section>
                      </div>

                      <section className="visit-main-concern">
                        <div><span>Main Concern</span><strong>{selectedVisit.mainConcern}</strong></div>
                        <div><span>Onset / duration</span><strong>{selectedVisit.onset}</strong></div>
                        {selectedVisit.pattern && <div><span>Pattern</span><strong>{selectedVisit.pattern}</strong></div>}
                      </section>

                      <section className="visit-document-section">
                        <div className="visit-document-section__heading"><span><Icon name="clipboard" size={16} /></span><div><strong>Reported Symptoms / Information</strong><p>Information reported during this consultation</p></div></div>
                        <div className="visit-reported-chips">{selectedVisit.reportedInformation.map((item) => <span key={item}><Icon name="checkDocument" size={12} /> {item}</span>)}</div>
                      </section>

                      <div className="visit-document-two-column visit-document-two-column--content">
                        <section className="visit-document-section visit-conversation-highlights">
                          <div className="visit-document-section__heading"><span><Icon name="chat" size={16} /></span><div><strong>Conversation Highlights</strong><p>From your conversation</p></div></div>
                          {selectedVisit.quotes.map((quote) => <blockquote key={quote}>“{quote}”</blockquote>)}
                        </section>
                        <section className="visit-document-section visit-overall-summary">
                          <div className="visit-document-section__heading"><span><Icon name="info" size={16} /></span><div><strong>Overall Summary</strong><p>AI-organized · Based only on reported information</p></div></div>
                          <p>{selectedVisit.summary}</p>
                        </section>
                      </div>

                      <div className="visit-document-two-column visit-document-two-column--content">
                        <section className="visit-document-section visit-not-mentioned">
                          <div className="visit-document-section__heading"><span><Icon name="info" size={16} /></span><div><strong>Not Mentioned</strong><p>Information that was not provided</p></div></div>
                          {selectedVisit.notMentioned.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
                        </section>
                        <section className="visit-document-section clinical-review-card">
                          <div className="visit-document-section__heading"><span><Icon name="stethoscope" size={16} /></span><div><strong>Clinical Review</strong><p>Doctor review status</p></div></div>
                          <span className={`clinical-review-status ${selectedVisit.review.status === "Reviewed" ? "reviewed" : ""}`}>{selectedVisit.review.status}</span>
                          {selectedVisit.review.doctor && <strong>{selectedVisit.review.doctor}</strong>}
                          {selectedVisit.review.date && <p>Reviewed on {selectedVisit.review.date}</p>}
                        </section>
                      </div>

                      <section className="visit-document-section doctor-recommendations-section">
                        <div className="visit-document-section__heading"><span><Icon name="care" size={16} /></span><div><strong>Doctor Recommendations</strong><p>Recommendations added after clinical review</p></div></div>
                        {selectedVisit.recommendations ? (
                          <div className="visit-recommendations-content">
                            <div><div className="document-kicker">Medications</div><div className="visit-medication-grid">{selectedVisit.recommendations.medications.map((medication) => <article key={medication.name}><strong>{medication.name}</strong><span>{medication.schedule}</span><small>Morning · Noon · Night</small><dl><div><dt>Dose</dt><dd>{medication.dose}</dd></div><div><dt>Duration</dt><dd>{medication.duration}</dd></div><div><dt>Meal</dt><dd>{medication.meal}</dd></div></dl><p>{medication.instruction}</p></article>)}</div></div>
                            <div className="visit-recommendations-grid"><div><div className="document-kicker">Recommended Tests</div>{selectedVisit.recommendations.tests.map((test) => <article className="visit-recommendation-row" key={test.name}><div><strong>{test.name}</strong><p>{test.instruction}</p></div><span>{test.status}</span></article>)}</div><div><div className="document-kicker">Diet &amp; Food</div>{selectedVisit.recommendations.diet.map((diet) => <p className="visit-diet-item" key={diet}><Icon name="leaf" size={13} /> {diet}</p>)}</div></div>
                            <div className="visit-doctor-instruction"><strong>Doctor's Instructions</strong><p>{selectedVisit.recommendations.instructions}</p></div>
                          </div>
                        ) : <div className="no-recommendations"><Icon name="clock" size={20} /><div><strong>No doctor recommendations yet</strong><p>Your visit is currently waiting for doctor review.</p></div></div>}
                      </section>

                      {selectedVisit.followup && <section className="visit-followup-section"><div><span>Follow-up</span><strong>{selectedVisit.followup.date}</strong><p>{selectedVisit.followup.instruction}</p></div><Button onClick={() => startFollowup(selectedVisit)}>Start Follow-up Visit <Icon name="arrow" size={13} /></Button></section>}
                      <footer className="visit-document-footer"><Icon name="shield" size={13} /> This tool collects information for a doctor; it does not provide a diagnosis.</footer>
                    </article>
                  </>
                ) : <section className="notifications-empty"><span><Icon name="inbox" size={25} /></span><strong>Visit not found</strong><p>The selected visit record is not available.</p><Button variant="secondary" onClick={() => navigate("/patient/visits")}>Back to My Visits</Button></section>
              ) : (
                <>
                  <section className="connected-page-heading"><div><div className="eyebrow">{isSummary && isBangla ? "ভিজিট নিশ্চিত হয়েছে" : "Visit history"}</div><div className="page-title">{isSummary ? pageTitle : "My Visits"}</div><p>{isSummary ? (isBangla ? "এই ভিজিটের নিশ্চিত করা তথ্য পর্যালোচনা করুন।" : "Review the information confirmed for this visit.") : "Review confirmed visits and doctor follow-up activity."}</p></div>{isSummary ? <Button variant="secondary" onClick={() => navigate("/patient/visits")}>{isBangla ? "আমার ভিজিটে ফিরে যান" : "Back to My Visits"}</Button> : <Button onClick={() => navigate("/patient/start-visit")}>Start a New Visit</Button>}</section>
                  {!isSummary && <div className="visit-patient-line"><div className="avatar avatar--mini">AA</div><span>Viewing visits for <strong>Ayan Ahmed</strong><i />8 years old · Child</span></div>}
                  {isSummary ? (
                    <>
                      <section className="connected-card visit-detail-card"><div className="visit-detail-status"><span><Icon name="checkDocument" size={20} /></span><div><strong>{activeVisit ? `Visit #${activeVisit.id} ${activeVisit.status.toLowerCase()}` : isBangla ? "ভিজিট #5 নিশ্চিত হয়েছে" : "Visit #5 confirmed"}</strong><p>{activeVisit?.date ?? (isBangla ? "এইমাত্র" : "Just now")} · {activeVisit?.language ?? (savedVisitLanguage === "bn" ? "বাংলা" : "English")} · {activeVisit?.mode ?? consultationMode} {isFollowup ? "follow-up" : "consultation"}</p></div></div><div className="visit-detail-grid"><div><span>{isBangla ? "রোগী" : "Patient"}</span><strong>{activeVisit ? "Local patient record · identity not attached" : isBangla ? "আয়ান আহমেদ · ৮ বছর · শিশু" : "Ayan Ahmed · 8 years old · Child"}</strong></div><div><span>{isBangla ? "অবস্থা" : "Status"}</span><strong>{activeVisit?.review.status ?? (isBangla ? "ডাক্তারের পর্যালোচনার অপেক্ষায়" : "Awaiting doctor review")}</strong></div><div><span>{isBangla ? "আজ জানানো হয়েছে" : "Reported Today"}</span><strong>{reviewInformation.concern}</strong></div><div><span>Visit relationship</span><strong>{isFollowup ? `Follow-up of Visit #${followupRelationship?.follow_up_of ?? followupParentId ?? 4}` : "Initial consultation"}</strong></div></div></section>
                      {isFollowup && <section className="followup-summary-relationship"><div><span>Previous Visit</span><strong>Visit #{followupRelationship?.follow_up_of ?? followupParentId ?? 4}</strong><p>Cough mostly at night · Difficulty sleeping</p></div><Icon name="arrow" size={18} /><div><span>Current Visit</span><strong>Visit #5 · Follow-up</strong><p>{reviewInformation.concern} · {reviewInformation.additional}</p></div><button type="button" onClick={() => viewPreviousVisit(followupRelationship?.follow_up_of ?? followupParentId ?? 4)}>Compare with Previous Visit <Icon name="arrow" size={12} /></button></section>}
                      {isFollowup && <section className="patient-timeline-card"><div className="section-title section-title--small">Patient Timeline</div><div>{[1, 2, 3, 4, 5].map((visit) => <span className={visit === 5 ? "current" : ""} key={visit}>Visit #{visit}{visit === 5 && <small>Follow-up</small>}</span>)}</div></section>}
                    </>
                  ) : (
                    <section className="connected-card visit-history-card">
                      {visitSaved && followupParentId && <button className="history-navigation-row" type="button" onClick={() => navigate("/patient/follow-up/summary")}><span><Icon name="visits" size={18} /></span><div><strong>Simulated follow-up visit</strong><p>Not connected to local persistence</p></div><span className="badge badge--complete">Simulated</span><Icon name="arrow" size={14} /></button>}
                      {visitApiAvailable === true ? (savedVisits.length ? savedVisits.map((visit) => <button className="history-navigation-row" type="button" key={visit.id} onClick={() => navigate(`/patient/visits/${visit.id}`)}><span><Icon name="visits" size={18} /></span><div><strong>Visit #{visit.id}</strong><p>{visit.date} · {visit.mode} · {visit.language}</p></div><span className="badge badge--complete">{visit.status}</span><Icon name="arrow" size={14} /></button>) : <p>No visits have been saved to the local API yet.</p>) : <>{visitApiError && <p>{visitApiError} Showing simulated history only.</p>}{demoVisits.map((visit) => <button className="history-navigation-row" type="button" key={visit.id} onClick={() => navigate(`/patient/visits/${visit.id}`)}><span><Icon name="visits" size={18} /></span><div><strong>Demo Visit #{visit.id}</strong><p>{visit.date} · {visit.mode} · {visit.language}</p></div><span className="badge badge--complete">Simulated · {visit.status}</span><Icon name="arrow" size={14} /></button>)}</>}
                    </section>
                  )}
                </>
              )}
            </div>
          )}

          {activeNav === "Start a Visit" && (
            <div className="connected-content">
              {!isReview && <>
                <section className="connected-page-heading"><div><div className="eyebrow">{isBangla && (isChat || isVoice) ? "নির্দেশিত পরামর্শ" : isFollowup ? "Recommended follow-up" : "Guided consultation"}</div><div className="page-title">{pageTitle}</div><p>{isChat || isVoice ? (isBangla ? "ডাক্তারের পর্যালোচনার জন্য রোগীর জানানো তথ্য শেয়ার করুন।" : "Share patient-reported information for a doctor's review.") : isFollowup ? "Continue with the recommended follow-up for Visit #4." : "Choose how you would like to provide information for this visit."}</p></div></section>
                <div className="consultation-patient-context"><div className="avatar avatar--patient">AA</div><div><span>{isBangla && (isChat || isVoice) ? "নির্বাচিত রোগী" : "Selected patient"}</span><strong>{isBangla && (isChat || isVoice) ? "আয়ান আহমেদ" : "Ayan Ahmed"}</strong><p>{isBangla && (isChat || isVoice) ? "৮ বছর · শিশু" : "8 years old · Child"}</p></div>{(isChat || isVoice) && <span className="consultation-status"><i /> {isBangla ? "চলমান" : "In Progress"}</span>}</div>
              </>}
              {isFollowupLanding && previousVisit && (
                <section className="followup-context-hero">
                  <div className="followup-context-hero__top"><span><Icon name="care" size={21} /></span><div><div className="eyebrow">Follow-up for Ayan Ahmed</div><div className="section-title">Let's see how things are now.</div><p>CARETAI remembers the previous visit as historical context. Please report what is happening today.</p></div></div>
                  <div className="followup-context-grid">
                    <div><span>Previous Visit</span><strong>Visit #{previousVisit.id}</strong><p>{previousVisit.date}</p></div>
                    <div><span>Previously reported</span><strong>{previousVisit.mainConcern} · {previousVisit.onset}</strong><p>{previousVisit.pattern} · {previousVisit.reportedInformation.find((item) => item.includes("sleep"))}</p></div>
                    <div><span>Previous doctor instructions</span><strong>{previousVisit.recommendations?.instructions ?? "No instructions available"}</strong></div>
                  </div>
                </section>
              )}
              {isFollowup && previousVisit && (isChat || isVoice) && <PreviousVisitContext visit={previousVisit} expanded={previousContextExpanded} onToggle={() => setPreviousContextExpanded(!previousContextExpanded)} onView={() => viewPreviousVisit(previousVisit.id)} />}
              {!isChat && !isVoice && !isReview && (
                <section className="previsit-language-card">
                  <div><strong>Consultation Language</strong><p>CARETAI will use this language during your consultation.</p></div>
                  <div className="consultation-language consultation-language--large">{(["English", "বাংলা"] as const).map((language) => <button className={consultationLanguage === language ? "active" : ""} type="button" key={language} onClick={() => changeConsultationLanguage(language)}>{language}</button>)}</div>
                </section>
              )}
              {isReview ? (
                <div className="smart-review-page">
                  <div className="review-progress" aria-label="Visit progress">
                    {[isBangla ? "১. কথা বলুন" : "1. Talk", isBangla ? "২. পর্যালোচনা" : "2. Review", isBangla ? "৩. নিশ্চিত করুন" : "3. Confirm"].map((step, index) => <div className={index <= 1 ? "active" : ""} key={step}><span>{index + 1}</span><strong>{step.split(". ")[1]}</strong></div>)}
                  </div>
                  <section className="review-introduction">
                    <div className="eyebrow">{isBangla ? "CARETAI যা বুঝেছে" : "CARETAI understood this"}</div>
                    <div className="page-title">{isFollowup ? (isBangla ? "আজকের তথ্য পর্যালোচনা করুন" : "Review Current Information") : isBangla ? "আমরা যা বুঝেছি" : "Here's what we understood"}</div>
                    <p>{isFollowup ? (isBangla ? "আগের তথ্য শুধু ঐতিহাসিক প্রসঙ্গ। আজ যা জানিয়েছেন সেটিই নতুন ভিজিটে সংরক্ষিত হবে।" : "Previous information is historical context only. Only what you reported today will be saved as the new visit.") : isBangla ? "নিচের তথ্যগুলো দেখে নিন। ভিজিট সংরক্ষণের আগে যেকোনো কিছু সংশোধন করতে পারেন।" : "Please check the information below. You can correct anything before we save your visit."}</p>
                    <div className="review-context-badges"><span><Icon name="user" size={13} /> {isBangla ? "আয়ান আহমেদ · ৮ বছর · শিশু" : "Ayan Ahmed · 8 years old · Child"}</span><span><Icon name={consultationMode === "Chat" ? "chat" : "mic"} size={13} /> {consultationMode} · {consultationLanguage} · {isBangla ? "২৮ সেপ্টেম্বর, ২০২৬" : "Sep 28, 2026"}</span></div>
                  </section>

                  {isFollowup && previousVisit && (
                    <>
                      <PreviousVisitContext visit={previousVisit} expanded={previousContextExpanded} onToggle={() => setPreviousContextExpanded(!previousContextExpanded)} onView={() => viewPreviousVisit(previousVisit.id)} />
                      <section className="followup-review-comparison">
                        <article className="followup-comparison-card historical"><span>Previous / Historical</span><strong>What we knew before</strong><p>{previousVisit.mainConcern} for {previousVisit.onset.toLowerCase()}, {previousVisit.pattern?.toLowerCase()}, with difficulty sleeping.</p></article>
                        <article className="followup-comparison-card current"><span>Reported Today</span><strong>What you told CARETAI today</strong><p>{reviewInformation.concern}. {reviewInformation.symptoms}. {reviewInformation.additional}.</p></article>
                        <article className="followup-comparison-card changes"><span>Changes since Visit #{previousVisit.id}</span><strong>What changed</strong><div><i>Improved</i><p>Cough frequency · Difficulty sleeping</p></div><div><i>New</i><p>Throat discomfort</p></div><div><i>Unchanged</i><p>Fever was not discussed today</p></div></article>
                      </section>
                      <section className="followup-change-table">
                        <div><strong>Previous</strong><strong>Current</strong></div>
                        <div><span>Cough mostly at night</span><span>Less frequent</span></div>
                        <div><span>Difficulty sleeping</span><span>Improved</span></div>
                        <div><span>Fever not mentioned</span><span>Not discussed today</span></div>
                        <div><span>—</span><span>New throat discomfort</span></div>
                      </section>
                    </>
                  )}

                  <div className="smart-review-grid">
                    <section className="review-understood-card">
                      <div className="review-card-heading"><span><Icon name="brand" size={19} /></span><div><div className="section-title">{isBangla ? "আপনি CARETAI-কে যা বলেছেন" : "What you told CARETAI"}</div><p>{isBangla ? "আপনার কথোপকথন থেকে সংগঠিত" : "Organized from your conversation"}</p></div></div>
                      <div className="review-fact-grid">
                        {reviewItems.map((item) => (
                          <article className="review-fact" key={item.key}>
                            <div className="review-fact__top"><span><Icon name={item.icon} size={14} /> {item.label}</span><button type="button" onClick={() => setEditingReviewField(item.key)}><Icon name="edit" size={12} /> {isBangla ? "সম্পাদনা" : "Edit"}</button></div>
                            {editingReviewField === item.key ? (
                              <div className="review-inline-edit"><input autoFocus value={reviewInformation[item.key]} onChange={(event) => { setReviewInformation({ ...reviewInformation, [item.key]: event.target.value }); setReviewConfirmed(false); }} /><button type="button" onClick={() => setEditingReviewField(null)}><Icon name="checkDocument" size={13} /> {isBangla ? "সংরক্ষণ" : "Save"}</button></div>
                            ) : <strong>{reviewInformation[item.key]}</strong>}
                          </article>
                        ))}
                      </div>
                      <div className="conversation-highlights">
                        <div><div className="section-title section-title--small">{isBangla ? "কথোপকথনের উল্লেখযোগ্য অংশ" : "Conversation Highlights"}</div><span>{isBangla ? "আপনার কথোপকথন থেকে" : "From your conversation"}</span></div>
                        {conversationHighlights.map((quote, index) => <blockquote key={`${quote}-${index}`}>“{quote}”</blockquote>)}
                      </div>
                    </section>

                    <aside className="review-summary-column">
                      <section className="visit-snapshot-card">
                        <div className="review-card-heading"><span><Icon name="visits" size={18} /></span><div><div className="section-title section-title--small">{isBangla ? "ভিজিটের সারাংশ" : "Visit Snapshot"}</div><p>{isBangla ? "এক নজরে আপনার জানানো তথ্য" : "Your report at a glance"}</p></div></div>
                        <div className="snapshot-grid">
                          <div><span>{isBangla ? "প্রধান সমস্যা" : "Main concern"}</span><strong>{reviewInformation.concern}</strong></div>
                          <div><span>{isBangla ? "সময়কাল" : "Duration"}</span><strong>{reviewInformation.timeline}</strong></div>
                          <div><span>{isBangla ? "ধরণ" : "Pattern"}</span><strong>{reviewInformation.symptoms}</strong></div>
                          <div><span>{isBangla ? "সংশ্লিষ্ট তথ্য" : "Associated information"}</span><strong>{reviewInformation.additional}</strong></div>
                        </div>
                      </section>
                      <section className="review-short-summary"><span><Icon name="info" size={16} /></span><div><div className="section-title section-title--small">{isBangla ? "সংক্ষেপে" : "In short"}</div><p>{isBangla ? `এই সাক্ষাতে আপনি ${reviewInformation.timeline} ধরে ${reviewInformation.concern} থাকার কথা জানিয়েছেন। এটি ${reviewInformation.symptoms} এবং এর কারণে ${reviewInformation.additional}।` : `During this visit, you reported ${reviewInformation.concern.toLowerCase()} that has been present for ${reviewInformation.timeline.toLowerCase()} and is ${reviewInformation.symptoms.toLowerCase()}. You also mentioned ${reviewInformation.additional.toLowerCase()}.`}</p><small>{isBangla ? "স্থানীয়ভাবে তৈরি খসড়া · শুধুমাত্র কথোপকথনের ভিত্তিতে" : "Local draft · Based only on your conversation"}</small></div></section>
                      <section className="review-missing-card"><div className="section-title section-title--small">{isBangla ? "উল্লেখ করা হয়নি" : "Not reported / unknown"}</div>{activeVisit && !isFollowup ? activeVisit.notMentioned.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>) : <><div><span>{isBangla ? "জ্বর" : "Fever"}</span><strong>{isFollowup ? (isBangla ? "আজ আলোচনা করা হয়নি" : "Not discussed today") : "Not provided"}</strong></div><div><span>{isBangla ? "বর্তমানে নেওয়া ওষুধ" : "Medication currently being taken"}</span><strong>{isFollowup ? (isBangla ? "আজ আলোচনা করা হয়নি" : "Not discussed today") : "Not provided"}</strong></div></>}</section>
                    </aside>
                  </div>

                  <section className="review-confirmation-card">
                    <div><span className="review-confirmation-card__icon"><Icon name="shield" size={20} /></span><div><div className="section-title">{isBangla ? "এই ভিজিট সংরক্ষণের জন্য প্রস্তুত?" : "Ready to save this visit?"}</div><p>{isFollowup ? `CARETAI will create Visit #5 as a follow-up of Visit #${previousVisit?.id ?? 4}. Historical information will not be copied as current information.` : isBangla ? "CARETAI উপরের তথ্য ব্যবহার করে ডাক্তারের পর্যালোচনার জন্য নিশ্চিত ভিজিট রেকর্ড তৈরি করবে।" : "CARETAI will use the information above to create your confirmed visit record for doctor review."}</p></div></div>
                    <label className="review-confirm-check"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /><span>{isBangla ? "আমি তথ্য পর্যালোচনা করেছি এবং এটি সঠিক।" : "I have reviewed the information and it is correct."}</span></label>
                    <div className="review-confirmation-actions"><Button variant="secondary" onClick={() => { setConsultationInProgress(true); const base = isFollowup ? "/patient/follow-up" : "/patient/visit"; navigate(`${base}/${consultationMode === "Voice" ? "voice" : "chat"}`); }}>{isBangla ? "কথোপকথনে ফিরে যান" : "Back to Conversation"}</Button><Button disabled={!reviewConfirmed} onClick={confirmVisit}>{isBangla ? "তথ্য নিশ্চিত করুন ও সংরক্ষণ করুন" : "Confirm & Save Visit"} <Icon name="arrow" size={13} /></Button></div>
                  </section>
                </div>
              ) : isChat ? (
                <section className="consultation-workspace">
                  <div className="consultation-primary-panel">
                    <div className="consultation-toolbar"><div><strong>{isBangla ? "CARETAI চ্যাট" : "CARETAI Chat"}</strong><span>{isBangla ? "তথ্য সংগ্রহ চলছে" : "Information collection in progress"}</span></div><div className="consultation-language">{(["English", "বাংলা"] as const).map((language) => <button className={consultationLanguage === language ? "active" : ""} type="button" key={language} onClick={() => changeConsultationLanguage(language)}>{language}</button>)}</div></div>
                    <div className="consultation-conversation">{chatMessages.map((message, index) => <div className={`consultation-message ${message.author !== "CARETAI" ? "consultation-message--patient" : ""}`} key={`${message.author}-${index}`}><span>{message.author}</span><p>{message.text}</p></div>)}</div>
                    <div className="consultation-composer"><textarea value={chatDraft} aria-label="Chat response" placeholder={activeVisitId ? (isBangla ? "আপনার উত্তর লিখুন…" : "Type your response…") : (isBangla ? "আপনার প্রধান সমস্যাটি লিখুন…" : "Describe the main concern to start…")} onChange={(event) => setChatDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChatMessage(); } }} /><button type="button" onClick={sendChatMessage} disabled={!chatDraft.trim()}><Icon name="arrow" size={17} /></button></div>
                  </div>
                  <aside className="consultation-side-panel"><div className="consultation-side-section"><span>{isFollowup ? (isBangla ? "আজ জানানো হয়েছে" : "Reported Today") : isBangla ? "বর্তমান সংগৃহীত তথ্য" : "Current reported information"}</span><strong>{isFollowup ? (isBangla ? "কাশি আগের চেয়ে ভালো · রাতে কম" : "Cough improved · Less frequent at night") : activeVisit?.mainConcern || (isBangla ? "প্রথম উত্তরটি এখনো সংরক্ষিত হয়নি" : "Waiting for your first response")}</strong><p>{isFollowup ? (isBangla ? "নতুন: গলায় অস্বস্তি" : "New: Throat discomfort") : activeVisit?.pattern || activeVisit?.onset || (isBangla ? "আরও তথ্য কথোপকথনের সঙ্গে সংরক্ষিত হবে" : "Details will appear as you respond")}</p></div><div className="consultation-progress"><span>{isBangla ? "ভিজিটের অগ্রগতি" : "Visit progress"}</span><div><i style={{ width: `${conversationProgress.total ? (conversationProgress.answered / conversationProgress.total) * 100 : 0}%` }} /></div><strong>{isBangla ? `${conversationProgress.total}টির মধ্যে ${conversationProgress.answered}টি উত্তর` : `${conversationProgress.answered} of ${conversationProgress.total} answers`}</strong></div><Button onClick={finishConsultation}>{isBangla ? "ভিজিট শেষ করুন" : "End Visit"} <Icon name="arrow" size={13} /></Button></aside>
                </section>
              ) : isVoice ? (
                <section className="voice-consultation-layout">
                  <div className="connected-card voice-call-panel">
                    <div className="consultation-toolbar"><div><strong>{isBangla ? "বাংলা · Voice Consultation" : "English · Voice Consultation"}</strong><span>{voiceCallActive ? (isBangla ? "শোনা হচ্ছে" : "Listening now") : (isBangla ? "মাইক্রোফোনের অনুমতি প্রয়োজন" : "Microphone access required")}</span></div><div className="consultation-language">{(["English", "বাংলা"] as const).map((language) => <button className={consultationLanguage === language ? "active" : ""} type="button" key={language} onClick={() => changeConsultationLanguage(language)}>{language}</button>)}</div></div>
                    <div className={`voice-orb ${voiceCallActive ? "voice-orb--active" : ""}`}><Icon name="mic" size={28} /></div>
                    <strong className="voice-call-status">{voiceCallActive ? (isBangla ? "চৈতির কথা শোনা হচ্ছে…" : "Listening to Chaiti…") : voicePermission === "denied" ? (isBangla ? "মাইক্রোফোনের অনুমতি পাওয়া যায়নি" : "Microphone permission was not granted") : (isBangla ? "শুরু করার জন্য প্রস্তুত" : "Ready to begin")}</strong>
                    <p className="voice-current-question">“{voiceResponse}”</p>
                    <p>{voicePermission === "denied" ? (isBangla ? "ব্রাউজার সেটিংসে মাইক্রোফোনের অনুমতি দিন, তারপর আবার চেষ্টা করুন।" : "Allow microphone access in your browser settings, then try again.") : (isBangla ? "CARETAI আপনার জানানো তথ্য ডাক্তারের পর্যালোচনার জন্য সংগঠিত করবে।" : "CARETAI will organize the information you report for clinical review.")}</p>
                    <div className="voice-call-controls">{!voiceCallActive ? <Button onClick={requestMicrophone} disabled={voicePermission === "requesting"}><Icon name="mic" size={15} /> {voicePermission === "requesting" ? (isBangla ? "মাইক্রোফোন চাওয়া হচ্ছে…" : "Requesting Microphone…") : voicePermission === "denied" ? (isBangla ? "আবার চেষ্টা করুন" : "Try Microphone Again") : (isBangla ? "ভয়েস চ্যাট শুরু করুন" : "Start Voice Chat")}</Button> : <button className="end-call-button" type="button" onClick={stopVoiceCall}>{isBangla ? "কল শেষ করুন" : "End Call"}</button>}<Button variant="secondary" onClick={finishConsultation}>{isBangla ? "পরামর্শ শেষ করুন" : "Finish Consultation"}</Button></div>
                  </div>
                  <div className="voice-information-column">
                    <section className="connected-card live-transcript-card"><div className="section-title section-title--small">{isBangla ? "লাইভ ট্রান্সক্রিপ্ট" : "Live Transcript"}</div><p><strong>{isBangla ? "চৈতি" : "Chaiti"}:</strong> {voiceTranscript}</p><div className="voice-response-block"><span>{isBangla ? "CARETAI-এর উত্তর" : "CARETAI response"}</span><p>{voiceResponse}</p></div></section>
                    <section className="connected-card voice-extracted-card"><div className="section-title section-title--small">{isFollowup ? (isBangla ? "আজ জানানো হয়েছে" : "Reported Today") : isBangla ? "বর্তমান সংগৃহীত তথ্য" : "Current Reported Information"}</div><div><span>{isBangla ? "সমস্যা" : "Concern"}</span><strong>{isFollowup ? (isBangla ? "কাশি আগের চেয়ে ভালো" : "Cough improved") : activeVisit?.mainConcern || "Waiting for first response"}</strong></div><div><span>{isBangla ? "সময়কাল / ধরণ" : "Timeline / Pattern"}</span><strong>{isFollowup ? (isBangla ? "রাতে কম · ঘুম ভালো" : "Less frequent at night · Sleep improved") : [activeVisit?.onset, activeVisit?.pattern].filter(Boolean).join(" · ") || "Not reported yet"}</strong></div><div className="consultation-progress"><span>{isBangla ? "ভিজিটের অগ্রগতি" : "Visit progress"}</span><div><i style={{ width: `${conversationProgress.total ? (conversationProgress.answered / conversationProgress.total) * 100 : 0}%` }} /></div><strong>{isBangla ? `${conversationProgress.total}টির মধ্যে ${conversationProgress.answered}টি উত্তর` : `${conversationProgress.answered} of ${conversationProgress.total} answers`}</strong></div></section>
                  </div>
                </section>
              ) : (
                <div className="visit-mode-navigation-grid">
                  <section className="connected-card visit-mode-navigation-card"><span><Icon name="chat" size={23} /></span><div className="section-title">Chat</div><p>Type responses in a guided consultation.</p><Button onClick={() => startConsultation("Chat")}>Start Chat</Button></section>
                  <section className="connected-card visit-mode-navigation-card"><span><Icon name="mic" size={23} /></span><div className="section-title">Voice</div><p>Speak responses in a voice-enabled consultation.</p><Button variant="secondary" onClick={() => startConsultation("Voice")}>Start Voice Chat</Button></section>
                  <section className="connected-card visit-mode-navigation-card visit-mode-navigation-card--disabled"><span><Icon name="video" size={23} /></span><div><span className="badge badge--soon">Coming Soon</span><div className="section-title">Video</div></div><p>Video consultation will be available in a future update.</p><Button disabled>Unavailable</Button></section>
                </div>
              )}
            </div>
          )}

          {activeNav === "Patient Profile" && (
            <div className="connected-content">
              <section className="connected-page-heading"><div><div className="eyebrow">Patient information</div><div className="page-title">Patient Profile</div><p>View the information used to support Ayan's consultations.</p></div></section>
              <section className="connected-card profile-navigation-card"><div className="profile-navigation-identity"><div className="avatar avatar--patient">AA</div><div><strong>Ayan Ahmed</strong><p>8 years old · Child</p></div></div><div className="profile-navigation-grid"><div><span>Date of birth</span><strong>May 14, 2018</strong></div><div><span>Caregiver</span><strong>Chaiti</strong></div><div><span>Relationship</span><strong>Parent / Caregiver</strong></div><div><span>Contact</span><strong>chaiti@example.com</strong></div></div></section>
            </div>
          )}

          <footer className="connected-footer"><Icon name="shield" size={13} /> This tool collects information for a doctor; it does not provide a diagnosis.</footer>
        </main>
        {consultationBlocker.state === "blocked" && (
          <div className="modal-backdrop">
            <div className="delete-modal consultation-leave-modal" role="dialog" aria-modal="true" aria-labelledby="leave-consultation-title">
              <span className="delete-modal__icon"><Icon name="chat" size={21} /></span><div className="section-title" id="leave-consultation-title">Leave this consultation?</div><p>Your current consultation is still in progress. Leaving may discard the current conversation.</p><div><Button variant="secondary" onClick={() => consultationBlocker.reset()}>Stay in Consultation</Button><button className="danger-button" type="button" onClick={() => { stopVoiceCall(); setConsultationInProgress(false); consultationBlocker.proceed(); }}>Leave Consultation</button></div>
            </div>
          </div>
        )}
        <LogoutConfirmation open={logoutModalOpen} onCancel={() => setLogoutModalOpen(false)} onConfirm={() => navigate("/logout")} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="app-shell care-plan-shell">
      <PatientSidebar activeNav={activeNav} open={mobileNavOpen} onNavigate={navigatePatient} onLogout={() => setLogoutModalOpen(true)} onClose={() => setMobileNavOpen(false)} />

      <main className="main care-plan-main">
        <PatientHeader title="Care Plan" unreadCount={unreadCount} readIds={readNotificationIds} notificationsOpen={notificationsOpen} onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)} onMenu={() => setMobileNavOpen(true)} onNavigate={navigatePatient} onOpenNotification={openNotification} onLogout={() => setLogoutModalOpen(true)} />
        <section className="care-plan-header care-plan-page-heading app-only"><div><div className="eyebrow">Doctor recommendations</div><div className="page-title">Care Plan</div><p>View your current recommendations and instructions from your doctor.</p></div></section>

        <section className="care-plan-context app-only">
          <div className="care-plan-patient"><div className="avatar avatar--patient">AA</div><div><span>Current patient</span><strong>Ayan Ahmed</strong><p>8 years old <i /> Child</p></div></div>
          <div className="care-plan-update"><span className="recent-badge">Updated recently</span><div><span>Last updated</span><strong>September 28, 2026</strong></div><div><span>Updated by</span><strong>Doctor</strong></div></div>
          <div className="download-control">
            <Button variant="secondary" onClick={() => setDownloadOpen(!downloadOpen)}><Icon name="download" size={15} /> Download Care Plan <Icon name="chevron" size={14} /></Button>
            {downloadOpen && (
              <div className="download-menu">
                <button type="button" onClick={printCarePlan}><Icon name="print" size={17} /><span><strong>Download as PDF</strong><small>Print-ready care plan</small></span></button>
                <button type="button" onClick={downloadCarePlanImage}><Icon name="download" size={17} /><span><strong>Download as Image</strong><small>Long-form PNG image</small></span></button>
              </div>
            )}
          </div>
        </section>

        <div className="care-plan-document" id="care-plan-document">
          <header className="care-document-header print-only-header"><div className="document-brand"><span><Icon name="brand" size={24} /></span><div><strong>CARETAI</strong><small>Patient Care Plan</small></div></div><div><strong>Ayan Ahmed</strong><small>Updated September 28, 2026</small></div></header>

          <div className="care-plan-grid">
            <section className="care-section medication-section">
              <div className="care-section__heading"><div className="care-section__icon"><Icon name="pill" size={19} /></div><div><div className="section-title section-title--small">Medications</div><p>Doctor-prescribed medications</p></div><span className="new-section-badge">New</span></div>
              <div className="medication-list">
                {medications.map((medication) => (
                  <article className="medication-card" key={medication.name}>
                    <div className="medication-card__top"><div><span>Doctor's recommendation</span><strong>{medication.name}</strong></div><Icon name="shield" size={15} /></div>
                    <Schedule values={medication.schedule} />
                    <dl><div><dt>Dose</dt><dd>{medication.dose}</dd></div><div><dt>Duration</dt><dd>{medication.duration}</dd></div><div><dt>Instruction</dt><dd>{medication.instruction}</dd></div></dl>
                  </article>
                ))}
              </div>
            </section>

            <div className="care-plan-side">
              <section className="care-section diet-section">
                <div className="care-section__heading"><div className="care-section__icon"><Icon name="leaf" size={19} /></div><div><div className="section-title section-title--small">Diet &amp; Food</div><p>Food-related instructions from your doctor.</p></div></div>
                <div className="diet-list">
                  {dietItems.map((item) => (
                    <article className="diet-card" key={item.name}><div><strong>{item.name}</strong><span>{item.instruction}</span></div><Schedule values={item.schedule} /></article>
                  ))}
                </div>
              </section>

              <section className="care-section tests-section">
                <div className="care-section__heading"><div className="care-section__icon"><Icon name="test" size={19} /></div><div><div className="section-title section-title--small">Recommended Tests</div><p>Tests requested for clinical review</p></div></div>
                <div className="test-list">
                  <article><div><strong>CBC</strong><p>Complete the test and share the report during the follow-up.</p></div><span>Recommended</span></article>
                  <article><div><strong>Blood Sugar</strong><p>Follow the test instructions provided by your doctor.</p></div><span>Recommended</span></article>
                </div>
              </section>
            </div>
          </div>

          <div className="care-plan-bottom-grid">
            <section className="doctor-instruction-card"><div className="doctor-instruction-card__icon"><Icon name="care" size={20} /></div><div><div className="document-kicker">Doctor's Instructions</div><blockquote>“Continue following the recommended routine and monitor the reported symptoms. Bring any relevant test reports to the follow-up.”</blockquote><span>Added by Doctor · September 28, 2026</span></div></section>
            <section className="followup-plan-card"><div><div className="document-kicker">Follow-up</div><span>Recommended follow-up</span><strong>October 5, 2026</strong><p>Return for follow-up or start a new visit if further information needs to be reported.</p></div><Button onClick={() => startFollowup(demoVisits[0])}>Start a Follow-up Visit <Icon name="arrow" size={14} /></Button></section>
          </div>

          <footer className="care-plan-footer"><span><Icon name="shield" size={13} /> Recommendations shown here were provided by a doctor and cannot be edited by the patient.</span><span>This tool collects information for a doctor; it does not provide a diagnosis.</span></footer>
        </div>
      </main>

      <LogoutConfirmation open={logoutModalOpen} onCancel={() => setLogoutModalOpen(false)} onConfirm={() => navigate("/logout")} />
      {toast && <div className="toast app-only" role="status">{toast}</div>}
    </div>
  );
}
