import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { getActiveDemoRole, type DemoRole } from "../../auth/services/demoAuth";
import "../styles/landing.css";

export type CaretaiRole = DemoRole;

type IconName = "arrow" | "brand" | "chat" | "check" | "close" | "doctor" | "history" | "language" | "menu" | "mic" | "shield" | "spark" | "user" | "video";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M5 12h13m-4-4 4 4-4 4" />,
    brand: <><path d="M12 3.2c-2.8 0-5 2.1-5 4.7 0 1 .3 1.9.8 2.7C5.6 11.3 4 13.3 4 15.8c0 2.8 2.1 5 4.8 5 1.3 0 2.5-.5 3.3-1.4.8.9 2 1.4 3.3 1.4 2.7 0 4.8-2.2 4.8-5 0-2.5-1.6-4.5-3.8-5.2.5-.8.8-1.7.8-2.7 0-2.6-2.3-4.7-5.2-4.7Z" /><path d="M12 6.7v9.9M8.7 11.7h6.6" /></>,
    chat: <><path d="M20 11.5a7.8 7.8 0 0 1-8 7.5 9 9 0 0 1-3.5-.7L4 20l1.5-4A7.3 7.3 0 0 1 4 11.5 7.8 7.8 0 0 1 12 4a7.8 7.8 0 0 1 8 7.5Z" /><path d="M8.5 11.5h.1m3.4 0h.1m3.4 0h.1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    doctor: <><path d="M5 3v6a4 4 0 0 0 8 0V3M3 3h4m4 0h4" /><path d="M9 13v1.5a4.5 4.5 0 0 0 9 0v-1" /><circle cx="18" cy="11" r="2" /></>,
    history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2M3 7v5h5" /></>,
    language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" /></>,
    shield: <><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
    user: <><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20c.5-3.3 3-5.5 6.5-5.5s6 2.2 6.5 5.5" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2.3" /><path d="m16 10 5-3v10l-5-3Z" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className="care-brand" to="/" aria-label="CARETAI home"><span><Icon name="brand" size={compact ? 20 : 23} /></span><div><strong>CARETAI</strong>{!compact && <small>Clinical Analysis for Responsive Evaluation &amp; Tracking using AI</small>}</div></Link>;
}

function CTA({ to, children, quiet = false }: { to: string; children: ReactNode; quiet?: boolean }) {
  return <Link className={`care-cta ${quiet ? "care-cta--quiet" : ""}`} to={to}>{children}</Link>;
}

function Reveal({ children, className = "", delay = 0, id }: { children: ReactNode; className?: string; delay?: number; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add("is-visible");
        observer.unobserve(node);
      }
    }, { threshold: 0.14 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} id={id} className={`care-reveal ${className}`} style={{ "--delay": `${delay}ms` } as React.CSSProperties}>{children}</div>;
}

function Heading({ index, title, copy }: { index?: string; title: ReactNode; copy?: string }) {
  return <div className="care-heading">{index && <span>{index}</span>}<h2>{title}</h2>{copy && <p>{copy}</p>}</div>;
}

function Navbar({ role }: { role: CaretaiRole | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, []);
  const dashboard = role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
  return (
    <header className={`care-nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
      <nav className="care-nav" aria-label="Public navigation">
        <Brand />
        <button className="care-menu" type="button" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
        <div className={`care-nav__links ${open ? "is-open" : ""}`}>
          <div>{[["How It Works", "#how-it-works"], ["Connected Care", "#connected-care"], ["For Patients", "#patients"], ["For Doctors", "#doctors"], ["Safety", "#safety"]].map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}</div>
          <div className="care-nav__actions">{role ? <CTA to={dashboard}>Dashboard <Icon name="arrow" size={14} /></CTA> : <><Link to="/auth/sign-in">Sign In</Link><CTA to="/auth/sign-up">Get Started <Icon name="arrow" size={14} /></CTA></>}</div>
        </div>
      </nav>
    </header>
  );
}

const visitFields = [["Main concern", "Cough"], ["Duration", "About 5 days"], ["Pattern", "Mostly at night"], ["Associated information", "Difficulty sleeping"]];

function HeroFlow() {
  return (
    <div className="hero-product" aria-label="A conversation becoming an organized visit">
      <div className="hero-orbit hero-orbit--one" /><div className="hero-orbit hero-orbit--two" />
      <div className="hero-chat product-card">
        <header><span><Icon name="chat" size={16} /></span><div><strong>New conversation</strong><small>Guided visit · English</small></div><i>LIVE</i></header>
        {[["CARETAI", "How can we help today?"], ["Caregiver", "He has been coughing for about five days."], ["CARETAI", "Is it worse at a particular time?"], ["Caregiver", "Mostly at night. He's also having trouble sleeping."]].map(([who, text], index) => <div className={`hero-message ${who === "Caregiver" ? "is-person" : ""}`} style={{ "--i": index } as React.CSSProperties} key={text}><small>{who}</small><p>{text}</p></div>)}
      </div>
      <svg className="hero-connectors" viewBox="0 0 700 650" preserveAspectRatio="none" aria-hidden="true"><path d="M260 205 C360 205 322 330 430 330" /><path d="M258 280 C350 280 335 385 430 385" /><path d="M330 420 C380 420 380 440 430 440" /></svg>
      <div className="hero-fragments" aria-hidden="true">{["COUGH", "ABOUT 5 DAYS", "MOSTLY AT NIGHT", "DIFFICULTY SLEEPING"].map((item, index) => <span style={{ "--i": index } as React.CSSProperties} key={item}>{item}</span>)}</div>
      <div className="hero-visit product-card">
        <header><div><small>CONFIRMED VISIT</small><strong>Visit #4</strong></div><span>Patient review</span></header>
        <div>{visitFields.map(([label, value], index) => <dl style={{ "--i": index } as React.CSSProperties} key={label}><dt>{label}</dt><dd>{value}</dd></dl>)}</div>
        <footer><span><Icon name="check" size={12} /> Reviewed by patient</span></footer>
      </div>
      <div className="hero-doctor product-card"><span><Icon name="doctor" size={18} /></span><div><small>DOCTOR REVIEW</small><strong>Visit information ready for review</strong></div><Icon name="arrow" size={16} /></div>
      <div className="hero-caption"><span>01 Conversation</span><i /><span>02 Organized</span><i /><span>03 Confirmed</span></div>
    </div>
  );
}

function Hero({ role }: { role: CaretaiRole | null }) {
  const dashboard = role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
  return (
    <section className="care-hero">
      <div className="care-hero__copy"><span className="care-kicker">The connected care story</span><h1>Every conversation<br /><em>leaves a story.</em></h1><p>CARETAI turns what patients and caregivers share into organized information doctors can understand.</p><div className="care-hero__actions"><CTA to={role ? dashboard : "/auth/sign-up"}>{role ? "Go to Dashboard" : "Get Started"} <Icon name="arrow" size={16} /></CTA><a href="#how-it-works">Explore the Journey <span>↓</span></a></div><small><Icon name="shield" size={14} /> AI-assisted information · Doctor-led decisions</small></div>
      <HeroFlow />
    </section>
  );
}

function ConversationStage() {
  return (
    <section className="story-stage" id="how-it-works"><div className="care-shell story-grid"><Reveal><Heading index="Stage 01 · Conversation" title="It starts with a conversation." copy="Patients and caregivers share what they have experienced, in their own words." /></Reveal><Reveal className="stage-chat product-card"><header><span><Icon name="chat" /></span><div><strong>CARETAI consultation</strong><small>Listening one detail at a time</small></div></header>{[["CARETAI", "How can we help today?"], ["Caregiver", "He has been coughing for about five days."], ["CARETAI", "Is it worse at a particular time?"], ["Caregiver", "Mostly at night. He's also having trouble sleeping."]].map(([who, text], index) => <div className={`stage-message ${who === "Caregiver" ? "is-person" : ""}`} style={{ "--i": index } as React.CSSProperties} key={text}><small>{who}</small><p>{text}</p></div>)}</Reveal></div></section>
  );
}

function UnderstandingStage() {
  return (
    <section className="story-stage story-stage--tint"><div className="care-shell"><Reveal><Heading index="Stage 02 · Understanding" title="Words become organized information." copy="Selected phrases remain faithful to the conversation as they move into clear, reviewable fields." /></Reveal><Reveal className="understanding-flow"><div className="source-transcript product-card"><small>CONVERSATION HIGHLIGHTS</small><p>“He has been <mark>coughing</mark> for <mark>about five days</mark>.”</p><p>“<mark>Mostly at night.</mark> He's also having <mark>trouble sleeping</mark>.”</p></div><div className="phrase-rail"><span>Reported words</span><i /><Icon name="arrow" /></div><div className="structured-card product-card"><header><small>STRUCTURED VISIT</small><span><Icon name="spark" size={13} /> Organized by CARETAI</span></header>{visitFields.map(([label, value], index) => <div style={{ "--i": index } as React.CSSProperties} key={label}><small>{label}</small><strong>{value}</strong></div>)}<blockquote>Conversation highlights remain attached for review.</blockquote></div></Reveal></div></section>
  );
}

function ConfirmationStage() {
  return (
    <section className="story-stage"><div className="care-shell confirm-grid"><Reveal><Heading index="Stage 03 · Confirmation" title="Nothing is saved as confirmed without review." copy="Patients and caregivers can check and correct the information before confirming their visit record." /></Reveal><Reveal className="review-window product-card"><header><div><small>REVIEW INFORMATION</small><strong>Visit #4</strong></div><span className="awaiting">Awaiting review</span></header>{visitFields.map(([label, value]) => <div className="review-row" key={label}><div><small>{label}</small><strong>{value}</strong></div><button type="button" aria-label={`Edit ${label}`}>Edit</button></div>)}<footer><button type="button"><Icon name="check" size={14} /> Confirm information</button><span><Icon name="check" size={13} /> Confirmed by patient</span></footer></Reveal></div></section>
  );
}

function DoctorStage() {
  return (
    <section className="story-stage story-stage--dark"><div className="care-shell"><Reveal><Heading index="Stage 04 · Doctor review" title="Now the doctor has a clearer story." copy="The doctor reviews reported information, interprets clinical meaning, and makes the clinical decisions." /></Reveal><Reveal className="doctor-workspace product-card"><aside><Brand compact /><i className="active" /><i /><i /><i /></aside><main><header><div><small>PATIENT REVIEW</small><strong>Ayan Ahmed</strong><span>8 years old · Current visit #4</span></div><b>Pending review</b></header><nav>{["Profile", "Current visit", "Previous confirmed visits", "Highlights"].map((item, index) => <span className={index === 1 ? "active" : ""} key={item}>{item}</span>)}</nav><div className="doctor-columns"><section><small>REPORTED INFORMATION</small>{visitFields.map(([label, value]) => <dl key={label}><dt>{label}</dt><dd>{value}</dd></dl>)}</section><section><small>CONVERSATION HIGHLIGHT</small><blockquote>“Mostly at night. He's also having trouble sleeping.”</blockquote><div className="clinical-boundary"><Icon name="shield" size={16} /><span><strong>Doctor interpretation</strong>Clinical meaning and care plan remain with the doctor.</span></div></section></div></main></Reveal></div></section>
  );
}

const visits = [
  { label: "Visit #1", date: "12 Jan", title: "Initial conversation" },
  { label: "Visit #2", date: "04 Feb", title: "Confirmed context" },
  { label: "Visit #3", date: "18 Mar", title: "Previous report" },
  { label: "Visit #4", date: "Today", title: "Current report" },
  { label: "Follow-up", date: "Next", title: "Connected context" },
];

function ConnectedStory() {
  const [active, setActive] = useState(3);
  return (
    <section className="connected-story" id="connected-care"><div className="care-shell"><Reveal><Heading index="Connected care" title={<>One visit is a moment.<br /><em>Care is a story.</em></>} copy="Relevant history helps put each new conversation into context." /></Reveal><Reveal className="timeline"><div className="timeline-line"><i /></div>{visits.map((visit, index) => <button type="button" className={active === index ? "active" : ""} style={{ "--i": index } as React.CSSProperties} onClick={() => setActive(index)} key={visit.label}><span>{String(index + 1).padStart(2, "0")}</span><small>{visit.label} · {visit.date}</small><strong>{visit.title}</strong>{index === 3 && <div><b>Main concern</b><p>Cough</p><b>Pattern</b><p>Mostly at night</p></div>}</button>)}</Reveal><Reveal className="comparison"><div><small>PREVIOUS / HISTORICAL</small><strong>“Mostly at night”</strong><span>Confirmed in Visit #3</span></div><i><Icon name="arrow" size={17} /></i><div><small>REPORTED TODAY</small><strong>“Still mostly at night”</strong><span>Reported in Visit #4</span></div><i><Icon name="arrow" size={17} /></i><div><small>OBSERVED CHANGE IN REPORTING</small><strong>Sleep difficulty continues to be reported</strong><span>Derived only from displayed visit records</span></div></Reveal><Reveal className="history-rule"><Icon name="history" size={18} /><p><strong>Not discussed today stays historical.</strong> Previous symptoms never silently become current symptoms.</p></Reveal></div></section>
  );
}

function Responsibility() {
  const ai = ["Guides conversations", "Organizes reported information", "Summarizes confirmed visits", "Connects relevant history"];
  const doctor = ["Reviews information", "Requests more information", "Interprets clinical meaning", "Creates care plans and decisions"];
  return <section className="responsibility"><div className="care-shell"><Reveal><Heading index="Clear responsibility" title="AI organizes. Doctors decide." /></Reveal><Reveal className="responsibility-flow"><article><header><Icon name="spark" /><span><small>INFORMATION SUPPORT</small><strong>CARETAI</strong></span></header>{ai.map(item => <p key={item}><Icon name="check" size={13} />{item}</p>)}</article><div><i /><span>Patient-confirmed information</span><i /></div><article><header><Icon name="doctor" /><span><small>CLINICAL AUTHORITY</small><strong>Doctor</strong></span></header>{doctor.map(item => <p key={item}><Icon name="check" size={13} />{item}</p>)}</article></Reveal></div></section>;
}

function Audience() {
  return (
    <section className="audience"><div className="care-shell"><Reveal><Heading index="Two connected experiences" title="Designed for patients and doctors." /></Reveal><div className="audience-grid">
      <Reveal id="patients" className="audience-card" delay={100}><header><span><Icon name="user" /></span><div><small>PATIENT &amp; CAREGIVER</small><strong>Speak. Review. Stay connected.</strong></div></header><div className="patient-preview"><small>GOOD MORNING, CHAITI</small><h3>Ayan’s care, in one place.</h3><div><span><Icon name="chat" /></span><p><small>START A VISIT</small><strong>How would you like to talk?</strong></p></div><section><article><small>RECENT VISIT</small><strong>Cough</strong><span>Visit #4 · Confirmed</span></article><article><small>CARE PLAN</small><strong>Doctor reviewed</strong><span>View plan</span></article></section></div><ul>{["Start a visit", "Review and confirm information", "View visit history", "Access doctor-issued care plans"].map(item => <li key={item}><Icon name="check" size={13} />{item}</li>)}</ul><CTA to="/auth/sign-up?role=patient">Create patient account <Icon name="arrow" size={14} /></CTA></Reveal>
      <Reveal id="doctors" className="audience-card audience-card--doctor" delay={180}><header><span><Icon name="doctor" /></span><div><small>DOCTOR</small><strong>Review with connected context.</strong></div></header><div className="doctor-preview"><header><div><small>PATIENT REVIEW</small><strong>Ayan Ahmed</strong></div><i>Pending</i></header><div><article><small>CURRENT</small><strong>Visit #4</strong></article><article><small>PREVIOUS</small><strong>3 confirmed</strong></article></div><section><small>REPORTED INFORMATION</small><p><span>Pattern</span><strong>Mostly at night</strong></p><p><span>Associated</span><strong>Difficulty sleeping</strong></p></section></div><ul>{["Review pending visits", "Compare previous and current reports", "Request more information", "Manage care plans and follow-ups"].map(item => <li key={item}><Icon name="check" size={13} />{item}</li>)}</ul><CTA to="/auth/sign-up?role=doctor">Create doctor account <Icon name="arrow" size={14} /></CTA></Reveal>
    </div></div></section>
  );
}

function LanguageDemo() {
  const [language, setLanguage] = useState<"English" | "বাংলা">("English");
  return <section className="language-section"><div className="care-shell language-grid"><Reveal><Heading index="Chat, voice & language" title="A conversation should feel natural." copy="The selected consultation language carries through the experience, whether a patient chooses chat or voice." /><div className="mode-pills"><span><Icon name="chat" size={15} /> Chat <b>Available</b></span><span><Icon name="mic" size={15} /> Voice <b>Available</b></span><span><Icon name="video" size={15} /> Video <b>Coming soon</b></span></div></Reveal><Reveal className="language-demo product-card"><header><span><Icon name="language" /></span><div role="group" aria-label="Demonstration language"><button type="button" className={language === "English" ? "active" : ""} onClick={() => setLanguage("English")}>English</button><button type="button" className={language === "বাংলা" ? "active" : ""} onClick={() => setLanguage("বাংলা")}>বাংলা</button></div></header><div key={language}><small>CARETAI</small><p>{language === "English" ? "How long has the cough been present?" : "কতদিন ধরে কাশি হচ্ছে?"}</p><span>{language === "English" ? "Answer in your own words…" : "আপনার নিজের ভাষায় উত্তর দিন…"}</span></div><footer><Icon name="mic" size={17} /> Voice input ready</footer></Reveal></div></section>;
}

function Safety() {
  const items = [["No visual diagnosis", "No diagnosis from facial appearance or video."], ["Patient review", "Reported information is checked before confirmation."], ["Doctor authority", "Doctors retain clinical decision-making authority."], ["Clear history", "Historical information stays distinct from current reports."]];
  return <section className="safety" id="safety"><div className="care-shell"><Reveal><Heading index="Safety by design" title="Clear boundaries build trust." /></Reveal><Reveal className="safety-row">{items.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><Icon name={index === 2 ? "doctor" : index === 3 ? "history" : "shield"} /><strong>{title}</strong><p>{copy}</p></article>)}</Reveal></div></section>;
}

function Footer() {
  return <footer className="care-footer"><div><Brand /><p>Clinical Analysis for Responsive Evaluation &amp; Tracking using AI</p></div><nav aria-label="Footer navigation"><a href="#how-it-works">How It Works</a><a href="#connected-care">Connected Care</a><a href="#patients">Patients</a><a href="#doctors">Doctors</a><a href="#safety">Safety</a></nav><span>© 2026 CARETAI · University software engineering project</span></footer>;
}

export default function LandingPage() {
  const role = getActiveDemoRole();
  return <div className="care-page"><Navbar role={role} /><main><Hero role={role} /><ConversationStage /><UnderstandingStage /><ConfirmationStage /><DoctorStage /><ConnectedStory /><Responsibility /><Audience /><LanguageDemo /><Safety /><section className="final-cta"><Reveal><span><Icon name="brand" size={27} /></span><h2>Keep every conversation connected.</h2><p>Start with a conversation. Review what was understood. Build a clearer history over time.</p><div><CTA to="/auth/sign-up">Get Started <Icon name="arrow" size={15} /></CTA><CTA to="/auth/sign-in" quiet>Sign In</CTA></div><small>This tool collects information for a doctor; it does not provide a diagnosis.</small></Reveal></section></main><Footer /></div>;
}
