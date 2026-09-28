import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Home, BookOpen, CalendarDays, ListChecks, Settings, Plus, Trash2, X,
  Bell, BellRing, ChevronLeft, ChevronRight, Check, AlertTriangle, GraduationCap,
  Download, Upload, Printer, Edit3, Target, Search, Calendar, Clock,
  Sparkles, RefreshCw, Palette, Filter, Eye, Layers, UserCircle, Camera,
  User, School, Award, MapPin, Pin, Lightbulb, StickyNote, CheckCircle2,
  Bookmark, Flame, Star, LayoutGrid, List, CheckSquare, Square,
  ZoomIn, ZoomOut, FileText, FolderArchive, ShieldCheck, Volume2,
  Lock, Key, LogIn, LogOut, Mail, Send, Copy, Cloud, Database,
  LifeBuoy, MessageSquare, BookMarked, Dumbbell, Coffee
} from "lucide-react";
import { getItem, setItem } from "./storage.js";
import {
  getToken,
  setToken,
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  fetchCarnet,
  syncCarnet,
  changeUserPassword,
  uploadImage,
  sendSupportTicket,
} from "./api.js";

// ---------------------------------------------------------------------------
// Design tokens — Palette Drapeau Gabonais 🇬🇦 (Vert · Jaune · Bleu)
// ---------------------------------------------------------------------------
const GABON_VERT   = "#009e60";  // vert national
const GABON_JAUNE  = "#fcd116";  // jaune national
const GABON_BLEU   = "#3a75c4";  // bleu national

// Dérivés foncés
const VERT_DARK    = "#00784A";  // vert profond
const JAUNE_DARK   = "#b89200";  // jaune foncé (texte sur fond jaune)
const BLEU_DARK    = "#1e4d99";  // bleu profond

// Tons pastels
const VERT_SOFT    = "#d4f5e7";
const JAUNE_SOFT   = "#fff8d6";
const BLEU_SOFT    = "#dceaf9";

// Neutres
const INK          = "#1a3248";  // bleu très foncé
const INK_SOFT     = "#4b6780";  // gris-bleu
const PAPER        = "#f0f7f4";  // blanc teinté vert très doux
const PAPER_LINE   = "#c8e8da";  // ligne de réglure verte pâle
const CARD         = "#FFFFFF";

// Alias sémantiques (rétro-compatibilité)
const RED          = GABON_BLEU;   // "accent principal" = bleu
const RED_SOFT     = BLEU_SOFT;
const YELLOW       = GABON_JAUNE;
const YELLOW_SOFT  = JAUNE_SOFT;
const GREEN        = GABON_VERT;
const GREEN_SOFT   = VERT_SOFT;

const SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const TABS = [
  { id: "accueil",  label: "Accueil",          icon: Home,         color: GABON_JAUNE },
  { id: "notes",    label: "Notes",             icon: BookOpen,     color: GABON_BLEU  },
  { id: "copies",   label: "Mes Copies",        icon: Camera,       color: GABON_VERT  },
  { id: "edt",      label: "Emploi du temps",   icon: CalendarDays, color: GABON_JAUNE },
  { id: "devoirs",  label: "Devoirs",           icon: ListChecks,   color: GABON_VERT  },
  { id: "profil",   label: "Mon Profil",        icon: UserCircle,   color: GABON_JAUNE },
  { id: "reglages", label: "Réglages",          icon: Settings,     color: "#9AB8D8"   },
];

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const COULEURS_MATIERES = [
  { id: "gabon-bleu",  hex: GABON_BLEU,  bg: BLEU_SOFT,   nom: "Bleu Gabon" },
  { id: "gabon-vert",  hex: GABON_VERT,  bg: VERT_SOFT,   nom: "Vert Gabon" },
  { id: "gabon-jaune", hex: JAUNE_DARK,  bg: JAUNE_SOFT,  nom: "Jaune Gabon" },
  { id: "vert-dark",   hex: VERT_DARK,   bg: VERT_SOFT,   nom: "Vert Foncé" },
  { id: "bleu-dark",   hex: BLEU_DARK,   bg: BLEU_SOFT,   nom: "Bleu Foncé" },
  { id: "teal",        hex: "#0D9488",   bg: "#F0FDFA",   nom: "Turquoise" },
  { id: "amber",       hex: "#b36b00",   bg: JAUNE_SOFT,  nom: "Ambre" },
  { id: "purple",      hex: "#7C3AED",   bg: "#F5F3FF",   nom: "Violet" },
  { id: "navy",        hex: INK,         bg: "#E4EDF5",   nom: "Bleu Nuit" },
];

const PRESETS = {
  college: [
    { nom: "Français",            couleur: GABON_BLEU  },
    { nom: "Mathématiques",       couleur: GABON_VERT  },
    { nom: "Histoire-Géographie", couleur: JAUNE_DARK  },
    { nom: "SVT",                 couleur: VERT_DARK   },
    { nom: "Physique-Chimie",     couleur: BLEU_DARK   },
    { nom: "Anglais LV1",         couleur: "#0D9488"   },
    { nom: "Espagnol LV2",        couleur: "#b36b00"   },
    { nom: "EPS",                 couleur: GABON_VERT  },
    { nom: "Technologie",         couleur: GABON_BLEU  },
  ],
  lycee: [
    { nom: "Français",            couleur: GABON_BLEU  },
    { nom: "Mathématiques",       couleur: GABON_VERT  },
    { nom: "Physique-Chimie",     couleur: BLEU_DARK   },
    { nom: "SVT",                 couleur: VERT_DARK   },
    { nom: "Histoire-Géographie", couleur: JAUNE_DARK  },
    { nom: "Anglais LV1",         couleur: "#0D9488"   },
    { nom: "Espagnol LV2",        couleur: "#b36b00"   },
    { nom: "Philosophie",         couleur: INK         },
    { nom: "EPS",                 couleur: GABON_VERT  },
  ],
};

const STORAGE_KEY = "carnet-scolaire:data";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function genererMotDePasseAleatoire() {
  const lettres = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const chiffres = "23456789";
  let pass = "GB-";
  for (let i = 0; i < 3; i++) {
    pass += lettres.charAt(Math.floor(Math.random() * lettres.length));
  }
  pass += "-";
  for (let i = 0; i < 3; i++) {
    pass += chiffres.charAt(Math.floor(Math.random() * chiffres.length));
  }
  return pass;
}

function defaultData() {
  return {
    auth: {
      isLoggedIn: false,
      email: "",
      password: "",
      isTempPassword: true,
      comptesConnus: {}, // { [email]: { password, isTempPassword, date } }
    },
    settings: {
      niveau: "mixte",
      bareme: 20,
      periodes: ["Trimestre 1", "Trimestre 2", "Trimestre 3"],
      periodeActive: 0,
      semaineActive: "toutes",
    },
    profil: {
      prenom: "",
      nom: "",
      etablissement: "",
      classe: "",
      anneeScolaire: "2025-2026",
      photo: null,         // base64 ou null
      ville: "",
      objectifs: "",       // Cap / Objectif principal de l'année
      moyenneVisee: "",    // Moyenne générale visée
      devise: "",          // Devise ou règle de conduite personnelle
      notesPerso: [],      // { id, titre, contenu, categorie, date, couleur, epingle: boolean, fait: boolean }
    },
    matieres: [],
    notes: [],
    creneaux: [],
    devoirs: [],
    copies: [],
    planningPerso: [], // { id, jour, debut, fin, titre, type, couleur, fait }
  };
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
async function loadData() {
  try {
    const raw = await getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.settings.semaineActive) parsed.settings.semaineActive = "toutes";
      // Migration auth
      if (!parsed.auth) parsed.auth = defaultData().auth;
      if (!parsed.auth.comptesConnus) parsed.auth.comptesConnus = {};
      // Migration : ajouter profil si absent (anciens utilisateurs)
      if (!parsed.profil) parsed.profil = defaultData().profil;
      if (!parsed.profil.notesPerso) parsed.profil.notesPerso = [];
      if (!parsed.profil.objectifs) parsed.profil.objectifs = "";
      if (!parsed.profil.moyenneVisee) parsed.profil.moyenneVisee = "";
      if (!parsed.profil.devise) parsed.profil.devise = "";
      if (!parsed.copies) parsed.copies = [];
      if (!parsed.planningPerso) parsed.planningPerso = [];
      return parsed;
    }
  } catch (e) {
    // pas encore de données
  }
  return null;
}

async function saveData(data) {
  try {
    await setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Échec de l'enregistrement", e);
  }
}

// ---------------------------------------------------------------------------
// Calculs de moyennes
// ---------------------------------------------------------------------------
function moyenneMatiere(notes, matiereId, periode) {
  const list = notes.filter((n) => n.matiereId === matiereId && n.periode === periode);
  if (list.length === 0) return null;
  let somme = 0, poids = 0;
  list.forEach((n) => {
    const bareme = Number(n.bareme) || 20;
    const sur20 = (Number(n.valeur) / bareme) * 20;
    const coef = Number(n.coefficient || 1);
    somme += sur20 * coef;
    poids += coef;
  });
  if (poids === 0) return null;
  return somme / poids; // normalisé sur 20
}

function moyenneGenerale(matieres, notes, periode) {
  let somme = 0, poids = 0;
  matieres.forEach((m) => {
    const moy = moyenneMatiere(notes, m.id, periode);
    if (moy !== null) {
      const coef = Number(m.coefficient || 1);
      somme += moy * coef;
      poids += coef;
    }
  });
  if (poids === 0) return null;
  return somme / poids;
}

function formatNote(valeurSur20, bareme = 20) {
  if (valeurSur20 === null || valeurSur20 === undefined || isNaN(valeurSur20)) return "—";
  return ((valeurSur20 / 20) * bareme).toFixed(2).replace(/\.00$/, "");
}

function todayJourFR() {
  const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return jours[new Date().getDay()];
}

function dateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function joursRestants(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

function nomMatiere(data, id) {
  return data.matieres.find((m) => m.id === id)?.nom || "—";
}

function couleurMatiere(data, id) {
  const mat = data.matieres.find((m) => m.id === id);
  return mat?.couleur || INK;
}

// Compression d'image côté client pour les copies numérisées
function compresserPhotoCopie(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Composants UI de base
// ---------------------------------------------------------------------------
function Page({ title, subtitle, color, icon: Icon, children, action }) {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* En-tête officiel visible uniquement lors de l'impression PDF / papier */}
      <div className="hidden print:flex items-center justify-between pb-4 mb-6 border-b-2 border-stone-800">
        <img src="/favicon.png" alt="République Gabonaise" className="w-14 h-14 object-contain rounded-md" />
        <div className="text-center">
          <div className="text-sm font-black uppercase tracking-widest text-[#1F2A44]">RÉPUBLIQUE GABONAISE</div>
          <div className="text-[11px] font-serif italic text-stone-600">Union — Travail — Justice</div>
          <div className="text-xs font-bold mt-1 text-[#1F2A44] uppercase tracking-wide">CARNET SCOLAIRE NUMÉRIQUE</div>
        </div>
        <img src="/favicon.png" alt="Armoiries" className="w-14 h-14 object-contain rounded-md border border-stone-300" />
      </div>

      {/* En-tête de section — visible à l'écran */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-2xl shadow-sm"
            style={{ width: 52, height: 52, background: color + "18", color }}
          >
            <Icon size={26} />
          </div>
          <div>
            <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl font-bold leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p style={{ color: INK_SOFT }} className="text-sm mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div
      className={"rounded-xl p-4 shadow-xs transition-all " + className}
      style={{ background: CARD, border: `1px solid ${PAPER_LINE}`, ...style }}
    >
      {children}
    </div>
  );
}

function EmptyState({ text, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-8 text-center text-sm flex flex-col items-center justify-center gap-2"
      style={{ border: `1.5px dashed ${PAPER_LINE}`, color: INK_SOFT, background: "rgba(255,255,255,0.4)" }}
    >
      {Icon && <Icon size={28} className="opacity-40 mb-1" />}
      <span>{text}</span>
    </div>
  );
}

function Button({ children, onClick, variant = "primary", type = "button", small, title, disabled }) {
  const styles = {
    primary: { background: GABON_BLEU,  color: "#fff" },
    accent:  { background: GABON_VERT,  color: "#fff" },
    warning: { background: GABON_JAUNE, color: JAUNE_DARK },
    success: { background: GABON_VERT,  color: "#fff" },
    ghost:   { background: "#FFFFFF",   color: INK, border: `1px solid ${PAPER_LINE}` },
    subtle:  { background: VERT_SOFT,   color: VERT_DARK },
    danger:  { background: BLEU_SOFT,   color: BLEU_DARK },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        "rounded-lg font-medium inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 " +
        (small ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm")
      }
      style={{ ...styles[variant], fontFamily: SANS }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-2.5">
      <span className="block text-xs font-semibold mb-1" style={{ color: INK_SOFT, fontFamily: SANS }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 11px",
  borderRadius: 8,
  border: `1px solid ${PAPER_LINE}`,
  fontFamily: SANS,
  fontSize: 14,
  color: INK,
  background: "#fff",
  outline: "none",
  transition: "border-color 0.2s",
};

// ---------------------------------------------------------------------------
// Composant de Connexion Sécurisée (avec mot de passe automatique pour .com)
// ---------------------------------------------------------------------------
// Composant de Connexion Sécurisée
// ---------------------------------------------------------------------------
function Connexion({ data, update, setData, onBienvenue }) {
  const [mode, setMode] = useState("connexion"); // "connexion" | "inscription"
  const [email, setEmail] = useState(data.auth?.email || "");
  const [nomComplet, setNomComplet] = useState("");
  const [classe, setClasse] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [modalPassAlea, setModalPassAlea] = useState(null);
  const [erreur, setErreur] = useState("");
  const [copieEffectuee, setCopieEffectuee] = useState(false);
  const [chargement, setChargement] = useState(false);
  const createdCarnetRef = useRef(null);

  const emailNettoye = email.trim().toLowerCase();
  const isCom = emailNettoye.endsWith(".com");

  async function handleInscription(e) {
    if (e?.preventDefault) e.preventDefault();
    setErreur("");

    if (!emailNettoye) {
      setErreur("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    if (!isCom) {
      setErreur("L'adresse e-mail doit se terminer par .com pour recevoir votre mot de passe.");
      return;
    }

    setChargement(true);
    try {
      const parts = nomComplet.trim().split(" ");
      const prenom = parts[0] || "";
      const nom = parts.slice(1).join(" ") || "";

      const res = await registerUser({
        email: emailNettoye,
        password: password.trim() || undefined,
        nom,
        prenom,
        classe: classe.trim(),
        initialCarnetData: data,
      });

      createdCarnetRef.current = res.carnet;
      const passGenere = res.user?.generatedPassword;
      if (passGenere) {
        setPassword(passGenere);
        setModalPassAlea(passGenere);
      } else {
        if (res.carnet && setData) {
          setData(res.carnet);
        } else {
          update((d) => {
            if (!d.auth) d.auth = defaultData().auth;
            d.auth.isLoggedIn = true;
            d.auth.email = emailNettoye;
            d.auth.isTempPassword = false;
            if (prenom) d.profil.prenom = prenom;
            if (nom) d.profil.nom = nom;
            if (classe) d.profil.classe = classe.trim();
          });
        }
        if (onBienvenue) {
          onBienvenue({ prenom, nom, classe: classe.trim() });
        }
      }
    } catch (err) {
      setErreur(err.message || "Erreur lors de la création du compte.");
    } finally {
      setChargement(false);
    }
  }

  async function handleSubmit(e) {
    if (mode === "inscription") {
      return handleInscription(e);
    }

    e.preventDefault();
    setErreur("");

    if (!emailNettoye) {
      setErreur("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    if (!isCom) {
      setErreur("Veuillez renseigner une adresse e-mail valide (ex. nom@exemple.com).");
      return;
    }

    if (!password) {
      setErreur("Veuillez renseigner votre mot de passe.");
      return;
    }

    setChargement(true);
    try {
      const res = await loginUser({ email: emailNettoye, password });
      if (res.carnet && setData) {
        setData(res.carnet);
      } else {
        update((d) => {
          if (!d.auth) d.auth = defaultData().auth;
          d.auth.isLoggedIn = true;
          d.auth.email = emailNettoye;
          d.auth.isTempPassword = res.user?.isTempPassword || false;
        });
      }

      if (onBienvenue) {
        const p = res.carnet?.profil || {};
        const u = res.user || {};
        onBienvenue({
          prenom: p.prenom || u.prenom || "",
          nom: p.nom || u.nom || "",
          classe: p.classe || u.classe || "",
          isNouveau: false,
        });
      }
    } catch (err) {
      setErreur(err.message || "Identifiant ou mot de passe incorrect.");
    } finally {
      setChargement(false);
    }
  }

  function handleMotDePasseOublie() {
    if (!emailNettoye || !isCom) {
      setErreur("Indiquez votre adresse e-mail valide (en .com) pour réinitialiser votre mot de passe.");
      return;
    }
    setErreur("Veuillez contacter le support ou vous reconnecter avec vos identifiants.");
  }

  async function connexionInvite() {
    setChargement(true);
    try {
      try {
        const res = await loginUser({ email: "invite@education.ga", password: "GB-DEMO-2026" });
        if (res.carnet && setData) setData(res.carnet);
      } catch (e) {
        const res = await registerUser({
          email: "invite@education.ga",
          password: "GB-DEMO-2026",
          nom: "Invité",
          prenom: "Élève",
          classe: "3ème B",
          initialCarnetData: data,
        });
        if (res.carnet && setData) setData(res.carnet);
      }
      if (onBienvenue) {
        onBienvenue({
          prenom: "Élève",
          nom: "Invité",
          classe: "3ème B",
          isNouveau: false,
        });
      }
    } catch (err) {
      update((d) => {
        if (!d.auth) d.auth = defaultData().auth;
        d.auth.isLoggedIn = true;
        d.auth.email = "invite@education.ga";
        d.auth.password = "GB-DEMO";
        d.auth.isTempPassword = false;
      });
      if (onBienvenue) {
        onBienvenue({
          prenom: "Élève",
          nom: "Invité",
          classe: "3ème B",
          isNouveau: false,
        });
      }
    } finally {
      setChargement(false);
    }
  }


  return (
    <div
      style={{
        background: `radial-gradient(circle at 50% 20%, #F5FAFD 0%, #E8F1F8 100%)`,
        minHeight: "100vh",
        fontFamily: SANS,
      }}
      className="flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Ruban drapeau gabonais discret */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex shadow-xs">
        <div style={{ flex: 1, background: GABON_VERT }} />
        <div style={{ flex: 1, background: GABON_JAUNE }} />
        <div style={{ flex: 1, background: GABON_BLEU }} />
      </div>

      {/* Modale d'annonce du code d'accès */}
      {modalPassAlea && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <Key size={22} />
            </div>

            <h3 className="text-lg font-bold text-center text-stone-900">
              {mode === "inscription" ? "Compte créé avec succès !" : "Votre code d'accès temporaire"}
            </h3>
            <p className="text-xs text-center text-stone-500 mt-1">
              Un mot de passe aléatoire a été attribué à <span className="font-semibold text-stone-700">{emailNettoye}</span> :
            </p>

            {/* Boîte code */}
            <div className="my-4 p-3.5 rounded-xl bg-stone-50 border border-stone-300 flex items-center justify-between gap-3">
              <span className="font-mono text-xl font-bold text-stone-800 tracking-wider select-all">
                {modalPassAlea}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(modalPassAlea);
                  setCopieEffectuee(true);
                  setTimeout(() => setCopieEffectuee(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                {copieEffectuee ? <Check size={13} /> : <Copy size={13} />}
                <span>{copieEffectuee ? "Copié" : "Copier"}</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-500 mb-5 text-center">
              Ce mot de passe est enregistré. Vous pourrez le modifier à tout moment dans les réglages de votre profil.
            </p>

            <Button
              variant="accent"
              onClick={() => {
                const passFinal = modalPassAlea;
                setModalPassAlea(null);
                if (createdCarnetRef.current && setData) {
                  setData(createdCarnetRef.current);
                } else {
                  update((d) => {
                    if (!d.auth) d.auth = defaultData().auth;
                    d.auth.isLoggedIn = true;
                    d.auth.email = emailNettoye;
                    d.auth.password = passFinal;
                    d.auth.isTempPassword = true;
                    const parts = nomComplet.trim().split(" ");
                    if (parts[0]) d.profil.prenom = parts[0];
                    if (parts.slice(1).join(" ")) d.profil.nom = parts.slice(1).join(" ");
                    if (classe.trim()) d.profil.classe = classe.trim();
                  });
                }
                const parts = nomComplet.trim().split(" ");
                const prenom = parts[0] || "";
                const nom = parts.slice(1).join(" ") || "";
                if (onBienvenue) {
                  onBienvenue({ prenom, nom, classe: classe.trim() });
                }
              }}
            >
              <LogIn size={15} /> Accéder à mon carnet
            </Button>
          </div>
        </div>
      )}

      {/* Carte centrale */}
      <div className="max-w-sm w-full bg-white rounded-2xl p-7 shadow-xl border border-stone-200/80 relative">
        {/* En-tête sobre et officiel */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl p-1 bg-white shadow-xs border border-stone-200 flex items-center justify-center mb-3">
            <img src="/favicon.png" alt="République Gabonaise" className="w-full h-full object-contain rounded-xl" />
          </div>

          <h1 className="text-xl font-black tracking-tight text-stone-900">
            Carnet Scolaire
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] font-bold text-[#009E60] tracking-wider uppercase">
              République Gabonaise
            </span>
            <img src="/logo-gabon.svg" alt="Gabon" className="w-3.5 h-2.5 rounded-[1px] inline-block shadow-2xs" />
          </div>
        </div>

        {/* Sélecteur d'onglets Connexion / Créer un compte */}
        <div className="flex rounded-xl bg-stone-100 p-1 mb-5">
          <button
            type="button"
            onClick={() => { setMode("connexion"); setErreur(""); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === "connexion" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => { setMode("inscription"); setErreur(""); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === "inscription" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Créer un compte
          </button>
        </div>

        {/* Formulaire Connexion ou Inscription */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "inscription" && (
            <Field label="Nom et prénom">
              <input
                type="text"
                style={inputStyle}
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
                placeholder="ex. Mboué Ornella"
                autoFocus
              />
            </Field>
          )}

          <Field label="Adresse e-mail">
            <div className="relative">
              <input
                type="email"
                style={{ ...inputStyle, paddingLeft: 36 }}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErreur("");
                }}
                placeholder="nom@exemple.com"
                autoFocus={mode === "connexion"}
              />
              <Mail size={15} className="absolute left-3 top-3 text-stone-400" />
            </div>
          </Field>

          {mode === "inscription" && (
            <Field label="Classe (optionnel)">
              <input
                type="text"
                style={inputStyle}
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                placeholder="ex. Terminale D, 3ème B..."
              />
            </Field>
          )}

          <div>
            <Field label={mode === "inscription" ? "Mot de passe (optionnel - généré si vide)" : "Mot de passe"}>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  style={{ ...inputStyle, paddingLeft: 36, paddingRight: 38 }}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErreur("");
                  }}
                  placeholder={mode === "inscription" ? "Laissez vide pour mot de passe aléatoire" : "••••••••"}
                />
                <Lock size={15} className="absolute left-3 top-3 text-stone-400" />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-1"
                  tabIndex={-1}
                >
                  <Eye size={15} />
                </button>
              </div>
            </Field>

            {mode === "connexion" && (
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleMotDePasseOublie}
                  className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}
          </div>

          {erreur && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{erreur}</span>
            </div>
          )}

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={chargement}
              className="w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${GABON_VERT} 0%, ${GABON_BLEU} 100%)`,
              }}
            >
              {chargement ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Traitement en cours…</span>
                </>
              ) : (
                <>
                  {mode === "inscription" ? <Key size={15} /> : <LogIn size={15} />}
                  <span>{mode === "inscription" ? "Créer mon compte" : "Se connecter"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={connexionInvite}
              className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 hover:underline transition-colors text-center"
            >
              Accéder sans compte (Démo)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animation de Bienvenue après création de compte (avec la nouvelle Favicon)
// ---------------------------------------------------------------------------
function BienvenueAnimation({ user, onClose }) {
  const [progression, setProgression] = useState(100);
  const [secondesRestantes, setSecondesRestantes] = useState(8);
  const nomAffiche = [user?.prenom, user?.nom].filter(Boolean).join(" ");

  useEffect(() => {
    // Durée allongée à 8.5 secondes pour bien lire et profiter de l'animation
    const DUREE = 8500;
    const debut = Date.now();
    const interval = setInterval(() => {
      const ecoule = Date.now() - debut;
      const restant = Math.max(0, 100 - (ecoule / DUREE) * 100);
      setProgression(restant);
      setSecondesRestantes(Math.max(1, Math.ceil((DUREE - ecoule) / 1000)));
      if (restant <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-7 text-center shadow-2xl border border-stone-200/80 overflow-hidden animate-pop-in">
        {/* Ruban officiel République Gabonaise */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div style={{ flex: 1, background: GABON_VERT }} />
          <div style={{ flex: 1, background: GABON_JAUNE }} />
          <div style={{ flex: 1, background: GABON_BLEU }} />
        </div>

        {/* Étoiles décoratives d'excellence */}
        <div className="absolute top-4 left-5 text-amber-400 opacity-70 animate-bounce">
          <Sparkles size={22} />
        </div>
        <div className="absolute top-6 right-6 text-blue-500 opacity-60 animate-pulse">
          <Star size={19} />
        </div>

        {/* Favicon officielle mise en valeur avec halo vibrant et flottement */}
        <div className="relative my-3 inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-[#009e60] via-[#fcd116] to-[#3a75c4] shadow-xl animate-float-soft animate-glow-pulse flex items-center justify-center">
            <img
              src="/favicon.png"
              alt="Carnet Scolaire"
              className="w-full h-full object-contain rounded-[22px] bg-white p-1"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-xl shadow-md border-2 border-white">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Titre & Message d'accueil personnalisé */}
        <div className="mt-2 mb-4">
          <div className="text-xs uppercase tracking-widest font-black text-emerald-700 flex items-center justify-center gap-1.5">
            <Sparkles size={13} />
            <span>{user?.isNouveau ? "Compte créé avec succès !" : "Connexion réussie !"}</span>
          </div>

          <h2 className="text-lg font-bold text-stone-700 mt-1">
            {user?.isNouveau ? "Bienvenue dans ton carnet scolaire," : "Ravi de te revoir dans ton carnet,"}
          </h2>

          <div
            className="text-2xl sm:text-3xl font-black mt-1 text-transparent bg-clip-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${GABON_VERT} 0%, ${GABON_BLEU} 100%)`,
              fontFamily: SERIF,
            }}
          >
            {nomAffiche || "Élève"} ! 🇬🇦
          </div>

          {user?.classe && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
              <GraduationCap size={14} className="text-amber-600" />
              <span>Classe de {user.classe}</span>
            </div>
          )}

          <p className="text-xs text-stone-500 mt-3 leading-relaxed max-w-xs mx-auto">
            Ton espace est prêt pour suivre tes notes, ton emploi du temps et viser l'excellence scolaire cette année.
          </p>
        </div>

        {/* Barre de progression subtile */}
        <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden mb-4">
          <div
            className="h-full transition-all duration-75 ease-linear rounded-full"
            style={{
              width: `${progression}%`,
              background: `linear-gradient(90deg, ${GABON_VERT}, ${GABON_JAUNE}, ${GABON_BLEU})`,
            }}
          />
        </div>

        {/* Indicateur de temps restant */}
        <div className="text-[11px] text-stone-400 mb-3 font-medium flex items-center justify-center gap-1">
          <span>Entrée automatique dans</span>
          <span className="font-bold text-stone-600 font-mono">{secondesRestantes}s</span>
          <span>ou cliquer ci-dessous :</span>
        </div>

        {/* Bouton d'accès immédiat */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 hover:brightness-105 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${GABON_VERT} 0%, ${GABON_BLEU} 100%)`,
          }}
        >
          <span>Accéder à mon espace scolaire</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App Principale
// ---------------------------------------------------------------------------
export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("accueil");
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("synced");
  const [bienvenueOverlay, setBienvenueOverlay] = useState(null);
  const syncTimeoutRef = useRef(null);

  // ── Notifications & Alarmes ──
  const [notifPermission, setNotifPermission] = useState("default");
  const [notifsPanelOpen, setNotifsPanelOpen] = useState(false);
  const [notifsRecentes, setNotifsRecentes] = useState([]); // { id, titre, corps, type, ts, lue }
  const notifMoteurRef = useRef(null);
  const notifsRecenCount = notifsRecentes.filter((n) => !n.lue).length;

  useEffect(() => {
    (async () => {
      // 1. D'abord charger le cache local pour réactivité immédiate
      const stored = await loadData();
      let initialData = stored || defaultData();

      // 2. Si un token d'authentification existe, charger les données fraîches depuis le serveur SQLite
      const token = getToken();
      if (token) {
        try {
          const res = await fetchCurrentUser();
          if (res?.carnet) {
            initialData = res.carnet;
            if (!initialData.auth) initialData.auth = defaultData().auth;
            initialData.auth.isLoggedIn = true;
            if (res.user?.email) initialData.auth.email = res.user.email;
            if (!initialData.profil) initialData.profil = defaultData().profil;
            if (!initialData.profil.prenom && res.user?.prenom) initialData.profil.prenom = res.user.prenom;
            if (!initialData.profil.nom && res.user?.nom) initialData.profil.nom = res.user.nom;
            if (!initialData.profil.classe && res.user?.classe) initialData.profil.classe = res.user.classe;
          }
          setSyncStatus("synced");
        } catch (err) {
          console.warn("Serveur non joignable, utilisation du cache local:", err);
          setSyncStatus("offline");
        }
      }

      setData(initialData);
      setLoaded(true);
    })();
  }, []);

  // ── Demande de permission notifications au chargement ──
  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => setNotifPermission(perm));
      }
    }
  }, []);

  // ── Moteur de vérification des événements (toutes les 60s) ──
  useEffect(() => {
    if (!data || !loaded) return;

    function jouerSon(freq = 880, dur = 0.3) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur);
      } catch {}
    }

    function envoyerNotif(titre, corps, type = "info") {
      // Ajouter au centre de notifs interne
      setNotifsRecentes((prev) => [
        { id: uid(), titre, corps, type, ts: Date.now(), lue: false },
        ...prev.slice(0, 19),
      ]);
      // Notification système si permis
      if (notifPermission === "granted" && "Notification" in window) {
        try {
          new Notification(titre, {
            body: corps,
            icon: "/favicon.png",
            badge: "/favicon.png",
          });
        } catch {}
      }
    }

    const clesCoursNotifies = new Set();
    const clesDevoirsNotifies = new Set();

    function verifier() {
      const jourAuj = todayJourFR();
      const now = new Date();
      const curMin = now.getHours() * 60 + now.getMinutes();

      // Vérification des créneaux de cours
      const semaineActive = data.settings.semaineActive || "toutes";
      const creneauxAuj = data.creneaux.filter((c) => {
        if (c.jour !== jourAuj) return false;
        if (!c.semaine || c.semaine === "toutes" || semaineActive === "toutes") return true;
        return c.semaine === semaineActive;
      });

      creneauxAuj.forEach((c) => {
        const [hD, mD] = (c.debut || "00:00").split(":").map(Number);
        const debutMin = hD * 60 + mD;
        const diff = debutMin - curMin;

        // 5 minutes avant le cours
        const cle5 = `cours-5-${c.id}`;
        if (diff === 5 && !clesCoursNotifies.has(cle5)) {
          clesCoursNotifies.add(cle5);
          envoyerNotif(
            `📋 Cours dans 5 min : ${c.label}`,
            `${c.debut} → ${c.fin}${c.salle ? " • Salle " + c.salle : ""}${c.professeur ? " • " + c.professeur : ""}`,
            "cours"
          );
          jouerSon(660, 0.25);
        }

        // Heure du cours
        const cleCours = `cours-0-${c.id}`;
        if (diff === 0 && !clesCoursNotifies.has(cleCours)) {
          clesCoursNotifies.add(cleCours);
          envoyerNotif(
            `🔔 Cours maintenant : ${c.label}`,
            `Le cours commence ! ${c.debut} → ${c.fin}${c.salle ? " • Salle " + c.salle : ""}`,
            "cours"
          );
          jouerSon(880, 0.4);
          setTimeout(() => jouerSon(880, 0.4), 500);
        }
      });

      // Vérification des plages de travail perso
      const planAuj = (data.planningPerso || []).filter((p) => p.jour === jourAuj && !p.fait);
      planAuj.forEach((p) => {
        const [hD, mD] = (p.debut || "00:00").split(":").map(Number);
        const debutMin = hD * 60 + mD;
        const diff = debutMin - curMin;
        const cle = `perso-5-${p.id}`;
        if (diff === 5 && !clesCoursNotifies.has(cle)) {
          clesCoursNotifies.add(cle);
          envoyerNotif(
            `📖 Session dans 5 min : ${p.titre}`,
            `Ta plage de travail commence bientôt (${p.debut} → ${p.fin})`,
            "perso"
          );
          jouerSon(550, 0.3);
        }
      });

      // Vérification des devoirs à rendre demain
      if (curMin === 480) { // 8h00 du matin
        const demain = new Date();
        demain.setDate(demain.getDate() + 1);
        const demainStr = demain.toISOString().slice(0, 10);
        const devoirsDemain = (data.devoirs || []).filter(
          (d) => !d.fait && d.date === demainStr
        );
        devoirsDemain.forEach((d) => {
          const cle = `devoir-${d.id}-${demainStr}`;
          if (!clesDevoirsNotifies.has(cle)) {
            clesDevoirsNotifies.add(cle);
            const mat = data.matieres.find((m) => m.id === d.matiereId);
            envoyerNotif(
              `⚠️ Devoir à rendre demain`,
              `${d.titre} • ${mat?.nom || "Matière inconnue"}`,
              "devoir"
            );
          }
        });
      }
    }

    verifier(); // vérification immédiate
    notifMoteurRef.current = setInterval(verifier, 60_000);
    return () => clearInterval(notifMoteurRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loaded, notifPermission]);

  useEffect(() => {
    if (!loaded || !data) return;

    // Toujours persister en local immédiatement
    saveData(data);

    // Si connecté et token présent, synchroniser vers le serveur SQLite (debounced 600ms)
    const token = getToken();
    if (token && data.auth?.isLoggedIn) {
      setSyncStatus("saving");
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await syncCarnet(data);
          setSyncStatus("synced");
        } catch (err) {
          console.error("Erreur synchronisation carnet SQLite:", err);
          setSyncStatus("error");
        }
      }, 600);
    }
  }, [data, loaded]);

  const update = useCallback((fn) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  if (!data) {
    return (
      <div style={{ fontFamily: SANS, color: INK_SOFT }} className="p-12 text-sm flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin mr-2" size={18} /> Ouverture du carnet scolaire…
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher l'écran de connexion
  if (!data.auth?.isLoggedIn) {
    return (
      <Connexion
        data={data}
        update={update}
        setData={setData}
        onBienvenue={(usr) => setBienvenueOverlay(usr)}
      />
    );
  }

  const periode = data.settings.periodes[data.settings.periodeActive] || "Trimestre 1";

  const user = data.auth;
  const activeTab = TABS.find((t) => t.id === tab);
  const ActiveIcon = activeTab?.icon || Home;

  return (
    <div
      style={{ background: PAPER, fontFamily: SANS, minHeight: "100vh" }}
      className="flex overflow-hidden relative"
    >
      {/* Animation de Bienvenue après création de compte */}
      {bienvenueOverlay && (
        <BienvenueAnimation
          user={bienvenueOverlay}
          onClose={() => setBienvenueOverlay(null)}
        />
      )}

      {/* ====================================================
          SIDEBAR — Desktop: 240px avec labels | Mobile: 68px icônes
          ==================================================== */}
      <nav
        className="no-print flex flex-col shrink-0 z-30 transition-all duration-300"
        style={{
          width: "var(--sidebar-width, 240px)",
          minWidth: "var(--sidebar-min-width, 240px)",
          background: `linear-gradient(175deg, ${VERT_DARK} 0%, ${GABON_VERT} 35%, ${GABON_BLEU} 85%, ${BLEU_DARK} 100%)`,
          boxShadow: "3px 0 20px rgba(0,0,0,0.18)",
        }}
      >
        {/* ── Logo & Branding ── */}
        <div
          className="flex items-center gap-3 px-3 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <img
            src="/favicon.png"
            alt="Carnet Scolaire"
            className="w-11 h-11 rounded-2xl object-cover shadow-lg flex-shrink-0"
            style={{ border: "2px solid rgba(255,255,255,0.25)" }}
          />
          <div className="overflow-hidden hidden md:block">
            <div className="text-sm font-black text-white leading-tight tracking-wide">Carnet Scolaire</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <img src="/logo-gabon.svg" alt="Gabon" className="w-4 h-3 rounded-[2px] shadow-xs" />
              <span className="text-[10px] text-white/70 font-semibold">République Gabonaise</span>
            </div>
          </div>
        </div>

        {/* ── Navigation Items ── */}
        <div className="flex-1 py-2.5 px-2 space-y-0.5 overflow-y-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                title={t.label}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-150 group ${
                  active ? "" : "hover:bg-white/10"
                }`}
                style={{
                  background: active ? "rgba(255,255,255,0.14)" : "transparent",
                }}
              >
                {/* Chip icône colorée */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
                  style={{
                    background: active
                      ? t.color
                      : "rgba(255,255,255,0.12)",
                    boxShadow: active
                      ? `0 3px 10px ${t.color}60`
                      : "none",
                  }}
                >
                  <Icon
                    size={17}
                    color={active ? (t.color === GABON_JAUNE ? VERT_DARK : "#fff") : "rgba(255,255,255,0.75)"}
                  />
                </div>

                {/* Label visible uniquement sur desktop */}
                <span
                  className="text-sm font-semibold hidden md:block truncate flex-1 text-left"
                  style={{ color: active ? "#fff" : "rgba(255,255,255,0.75)" }}
                >
                  {t.label}
                </span>

                {/* Point actif */}
                {active && (
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 hidden md:block"
                    style={{ background: GABON_JAUNE }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Bas de la sidebar : user + sync + déconnexion ── */}
        <div
          className="border-t px-3 py-3"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          {/* Sync status */}
          <div className="mb-2 flex items-center gap-2 px-1">
            {syncStatus === "synced" && (
              <>
                <Cloud size={13} className="text-emerald-300 flex-shrink-0" />
                <span className="text-[11px] text-white/70 hidden md:block">Synchronisé</span>
              </>
            )}
            {syncStatus === "saving" && (
              <>
                <RefreshCw size={13} className="animate-spin text-amber-300 flex-shrink-0" />
                <span className="text-[11px] text-amber-200 hidden md:block">Synchronisation…</span>
              </>
            )}
            {syncStatus === "error" && (
              <>
                <AlertTriangle size={13} className="text-red-300 flex-shrink-0" />
                <span className="text-[11px] text-red-200 hidden md:block">Hors-ligne (local)</span>
              </>
            )}
            {syncStatus === "offline" && (
              <>
                <Cloud size={13} className="opacity-40 text-white flex-shrink-0" />
                <span className="text-[11px] text-white/50 hidden md:block">Hors-ligne</span>
              </>
            )}
          </div>

          {/* Profil utilisateur */}
          {user?.nom && (
            <div
              className="flex items-center gap-2.5 px-1 py-2 rounded-xl mb-2"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: GABON_JAUNE, color: VERT_DARK }}
              >
                {(user.prenom || user.nom || "?")[0].toUpperCase()}
              </div>
              <div className="overflow-hidden hidden md:block">
                <div className="text-xs font-bold text-white truncate">{user.prenom || user.nom}</div>
                <div className="text-[10px] text-white/60 truncate">{data.settings.classe || "Élève"}</div>
              </div>
            </div>
          )}

          {/* Déconnexion */}
          <button
            onClick={() => {
              logoutUser();
              update((d) => {
                if (!d.auth) d.auth = defaultData().auth;
                d.auth.isLoggedIn = false;
              });
            }}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Se déconnecter"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className="text-xs font-semibold hidden md:block">Déconnexion</span>
          </button>
        </div>
      </nav>

      {/* ====================================================
          ZONE PRINCIPALE : Topbar + Contenu
          ==================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Topbar contextuelle ── */}
        <header
          className="no-print flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            borderColor: PAPER_LINE,
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: (activeTab?.color || GABON_BLEU) + "20", color: activeTab?.color || GABON_BLEU }}
            >
              <ActiveIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: INK }}>{activeTab?.label || "Accueil"}</h2>
              <p className="text-[11px]" style={{ color: INK_SOFT }}>{periode}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Année scolaire */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: GABON_VERT + "15", color: GABON_VERT }}
            >
              <GraduationCap size={13} />
              <span>{data.settings.anneeScolaire || "2025–2026"}</span>
            </div>
            {/* Classe */}
            {data.settings.classe && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: GABON_BLEU + "15", color: GABON_BLEU }}
              >
                <School size={13} />
                <span>{data.settings.classe}</span>
              </div>
            )}

            {/* 🔔 Cloche de notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifsPanelOpen((v) => !v);
                  if (!notifsPanelOpen) {
                    setNotifsRecentes((prev) => prev.map((n) => ({ ...n, lue: true })));
                  }
                }}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors"
                style={{ color: INK_SOFT }}
                title="Centre de notifications"
              >
                {notifsRecenCount > 0
                  ? <BellRing size={18} className="text-amber-500" />
                  : <Bell size={18} />}
                {notifsRecenCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                    {notifsRecenCount > 9 ? "9+" : notifsRecenCount}
                  </span>
                )}
              </button>

              {/* Panel notifications */}
              {notifsPanelOpen && (
                <div
                  className="absolute right-0 top-12 w-80 rounded-2xl shadow-xl border z-50 overflow-hidden"
                  style={{ background: "#fff", borderColor: PAPER_LINE }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: PAPER_LINE }}>
                    <div className="flex items-center gap-2">
                      <Bell size={15} style={{ color: GABON_BLEU }} />
                      <span className="text-sm font-bold" style={{ color: INK }}>Notifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {notifPermission !== "granted" && (
                        <button
                          onClick={() => Notification.requestPermission().then(setNotifPermission)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold hover:bg-amber-200 transition-colors"
                        >
                          Activer
                        </button>
                      )}
                      {notifPermission === "granted" && (
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Actives
                        </span>
                      )}
                      <button onClick={() => setNotifsPanelOpen(false)} className="text-stone-400 hover:text-stone-700">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifsRecentes.length === 0 ? (
                      <div className="py-10 text-center text-sm text-stone-400">
                        <Bell size={28} className="mx-auto mb-2 opacity-20" />
                        Aucune notification pour l’instant
                      </div>
                    ) : (
                      notifsRecentes.map((n) => {
                        const icons = { cours: "📋", perso: "📖", devoir: "⚠️", info: "i" };
                        const bgCols = { cours: BLEU_SOFT, perso: VERT_SOFT, devoir: JAUNE_SOFT, info: "#f8f8f8" };
                        const elapsed = Math.round((Date.now() - n.ts) / 60000);
                        const elapsedStr = elapsed < 1 ? "à l’instant" : elapsed < 60 ? `il y a ${elapsed} min` : `il y a ${Math.round(elapsed / 60)}h`;
                        return (
                          <div
                            key={n.id}
                            className="px-4 py-3 border-b hover:bg-stone-50 transition-colors"
                            style={{ borderColor: PAPER_LINE, background: n.lue ? "" : bgCols[n.type] + "60" }}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="text-lg leading-none mt-0.5">{icons[n.type] || "i"}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold" style={{ color: INK }}>{n.titre}</div>
                                <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">{n.corps}</div>
                                <div className="text-[10px] text-stone-400 mt-1">{elapsedStr}</div>
                              </div>
                              {!n.lue && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {notifsRecentes.length > 0 && (
                    <div className="px-4 py-2 text-center border-t" style={{ borderColor: PAPER_LINE }}>
                      <button
                        onClick={() => setNotifsRecentes([])}
                        className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        Tout effacer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Contenu de page ── */}
        <main
          className="flex-1 overflow-auto"
          style={{
            background: PAPER,
          }}
        >
          <div className="max-w-none px-6 py-6 md:px-10 md:py-8">
            {tab === "accueil"  && <Accueil data={data} periode={periode} setTab={setTab} update={update} />}
            {tab === "notes"    && <Notes   data={data} periode={periode} update={update} />}
            {tab === "copies"   && <CopiesView data={data} update={update} />}
            {tab === "edt"      && <EDT     data={data} update={update} />}
            {tab === "devoirs"  && <Devoirs data={data} update={update} />}
            {tab === "profil"   && <Profil  data={data} update={update} />}
            {tab === "reglages" && <Reglages data={data} update={update} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Onglet Accueil
// ---------------------------------------------------------------------------
function Accueil({ data, periode, setTab, update }) {
  const jourAuj = todayJourFR();
  const semaineActive = data.settings.semaineActive || "toutes";

  const coursAuj = data.creneaux
    .filter((c) => {
      if (c.jour !== jourAuj) return false;
      if (!c.semaine || c.semaine === "toutes" || semaineActive === "toutes") return true;
      return c.semaine === semaineActive;
    })
    .sort((a, b) => a.debut.localeCompare(b.debut));

  const devoirsAvenir = data.devoirs
    .filter((d) => !d.fait)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const rappels = data.devoirs.filter((d) => {
    if (d.fait) return false;
    const jr = joursRestants(d.date);
    if (d.priorite === "haute") return jr <= 2;
    if (d.rappel === "J-1") return jr === 0 || jr === 1;
    if (d.rappel === "H-3") return jr === 0;
    return false;
  });

  const moyGen = moyenneGenerale(data.matieres, data.notes, periode);

  return (
    <Page title="Tableau de bord" subtitle={`${jourAuj} · ${periode}`} color={INK} icon={Home}>
      {/* Carte profil rapide */}
      {(data.profil?.prenom || data.profil?.nom || data.profil?.etablissement) && (
        <div
          className="rounded-2xl p-3.5 mb-5 flex items-center gap-4 shadow-xs border"
          style={{
            background: `linear-gradient(135deg, ${VERT_SOFT} 0%, ${BLEU_SOFT} 100%)`,
            borderColor: PAPER_LINE,
          }}
        >
          {/* Avatar */}
          <div
            className="relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md"
            style={{
              background: data.profil.photo
                ? "transparent"
                : `linear-gradient(135deg, ${GABON_VERT}, ${GABON_BLEU})`,
              overflow: "hidden",
            }}
          >
            {data.profil.photo ? (
              <img src={data.profil.photo} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <span>
                {(data.profil.prenom?.[0] || "").toUpperCase()}
                {(data.profil.nom?.[0] || "").toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="font-black text-sm" style={{ color: INK }}>
              {[data.profil.prenom, data.profil.nom].filter(Boolean).join(" ") || "Élève"}
            </div>
            {data.profil.classe && (
              <div className="text-xs font-medium mt-0.5" style={{ color: VERT_DARK }}>
                {data.profil.classe}{data.profil.etablissement ? " — " + data.profil.etablissement : ""}
              </div>
            )}
            {data.profil.anneeScolaire && (
              <div className="text-[11px] mt-0.5" style={{ color: INK_SOFT }}>
                Année scolaire {data.profil.anneeScolaire}
              </div>
            )}
          </div>
          <button
            onClick={() => setTab("profil")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: GABON_BLEU, color: "#fff" }}
          >
            Modifier
          </button>
        </div>
      )}

      {/* Widget Objectifs de l'année & Notes de rappel épinglées */}
      {(data.profil?.objectifs || (data.profil?.notesPerso && data.profil.notesPerso.some((n) => n.epingle && !n.fait))) && (
        <div
          className="rounded-2xl p-4 mb-5 shadow-xs border bg-white"
          style={{ borderColor: PAPER_LINE }}
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-[#009E60]" />
              <span className="text-xs font-black uppercase tracking-wider text-stone-700">
                Mon Cap & Idées pour Réussir l'Année
              </span>
            </div>
            <button
              onClick={() => setTab("profil")}
              className="text-xs font-semibold text-[#009E60] hover:underline"
            >
              Gérer dans Profil &rarr;
            </button>
          </div>

          {/* Grand objectif */}
          {data.profil?.objectifs && (
            <div className="text-sm font-bold text-[#1A3248] mb-2.5 flex items-center gap-2 flex-wrap bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
              <Target size={16} className="text-[#009E60] shrink-0" />
              <span className="flex-1">{data.profil.objectifs}</span>
              {data.profil.moyenneVisee && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#009E60] text-white shrink-0">
                  Cible : {data.profil.moyenneVisee}/20
                </span>
              )}
            </div>
          )}

          {/* Notes et mémos épinglés */}
          {data.profil?.notesPerso && data.profil.notesPerso.filter((n) => n.epingle && !n.fait).length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto pt-1 pb-1">
              {data.profil.notesPerso
                .filter((n) => n.epingle && !n.fait)
                .map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl text-xs shrink-0 border min-w-[220px] max-w-[280px] flex items-start gap-2 shadow-2xs"
                    style={{ background: n.couleur || "#FEF08A", borderColor: "rgba(0,0,0,0.1)" }}
                  >
                    <Pin size={13} className="shrink-0 text-stone-800 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-stone-900 leading-tight">{n.titre}</div>
                      {n.contenu && (
                        <div className="text-[11px] text-stone-700 mt-1 line-clamp-2">{n.contenu}</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* En-tête officiel scolaire */}
      <div
        className="rounded-2xl p-4 mb-6 shadow-xs border flex items-center justify-between gap-4 flex-wrap bg-white"
        style={{ borderColor: PAPER_LINE }}
      >
        <div className="flex items-center gap-3.5">
          <img
            src="/favicon.png"
            alt="Armoiries du Gabon"
            className="w-14 h-11 object-contain rounded-lg border border-stone-200 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-[#1F2A44] uppercase">
                RÉPUBLIQUE GABONAISE
              </span>
              <img src="/logo-gabon.svg" alt="Drapeau Gabon" className="w-4 h-2.5 rounded-[1px] shadow-xs" />
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              Union · Travail · Justice — Carnet Scolaire Numérique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-stone-50 py-1.5 px-3 rounded-xl border border-stone-200">
          <img
            src="/favicon.png"
            alt="Logo Enseignement"
            className="w-8 h-8 rounded-lg object-contain"
          />
          <div className="text-right">
            <div className="text-[11px] font-bold text-[#1F2A44]">Suivi Pédagogique</div>
            <div className="text-[10px] text-emerald-700 font-semibold">100% Local & Sécurisé</div>
          </div>
        </div>
      </div>
      {/* Alerte rappels & devoirs urgents */}
      {rappels.length > 0 && (
        <div
          className="rounded-xl p-3.5 mb-5 flex items-start gap-3 shadow-xs"
          style={{ background: YELLOW_SOFT, border: `1px solid ${YELLOW}` }}
        >
          <Bell size={18} color="#8A6200" className="mt-0.5 shrink-0 animate-bounce" />
          <div className="text-sm space-y-1 flex-1" style={{ color: "#6B4B00" }}>
            <div className="font-bold text-xs uppercase tracking-wider">Rappels urgents</div>
            {rappels.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span>
                  <strong>{r.titre}</strong> ({nomMatiere(data, r.matiereId)}) — <em>{dateLabel(r.date)}</em>
                </span>
                {r.priorite === "haute" && (
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                    Urgent
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cartes d'indicateurs rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold" style={{ color: INK_SOFT }}>
            <span>Moyenne générale</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{periode}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span style={{ fontFamily: SERIF, color: INK }} className="text-4xl font-bold">
              {moyGen === null ? "—" : formatNote(moyGen, data.settings.bareme)}
            </span>
            <span className="text-sm font-medium" style={{ color: INK_SOFT }}>
              / {data.settings.bareme}
            </span>
          </div>
          <div className="mt-2 text-xs" style={{ color: INK_SOFT }}>
            Sur {data.matieres.length} matière{data.matieres.length > 1 ? "s" : ""}
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="text-xs font-semibold" style={{ color: INK_SOFT }}>Devoirs en attente</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span style={{ fontFamily: SERIF, color: GREEN }} className="text-4xl font-bold">
              {data.devoirs.filter((d) => !d.fait).length}
            </span>
            <span className="text-xs text-stone-500">
              ({data.devoirs.filter((d) => !d.fait && joursRestants(d.date) < 0).length} en retard)
            </span>
          </div>
          <button
            onClick={() => setTab("devoirs")}
            className="mt-2 text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 text-left"
          >
            Accéder aux devoirs &rarr;
          </button>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="text-xs font-semibold" style={{ color: INK_SOFT }}>Programme du jour</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span style={{ fontFamily: SERIF, color: YELLOW }} className="text-4xl font-bold">
              {coursAuj.length}
            </span>
            <span className="text-xs text-stone-500">créneaux</span>
          </div>
          <button
            onClick={() => setTab("edt")}
            className="mt-2 text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 text-left"
          >
            Voir l'emploi du temps &rarr;
          </button>
        </Card>
      </div>

      {/* Colonnes cours et devoirs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: INK }}>
              Aujourd'hui — {jourAuj}
            </h2>
            <span className="text-xs text-stone-500">{coursAuj.length} cours</span>
          </div>
          {coursAuj.length === 0 ? (
            <EmptyState text="Aucun cours prévu aujourd'hui. Profite de ta journée ou avance tes devoirs !" />
          ) : (
            <div className="space-y-2.5">
              {coursAuj.map((c) => {
                const color = c.matiereId ? couleurMatiere(data, c.matiereId) : (c.type === "revision" ? GREEN : INK);
                return (
                  <Card key={c.id} className="flex items-center justify-between !p-3 border-l-4" style={{ borderLeftColor: color }}>
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2" style={{ color: INK }}>
                        <span>{c.label}</span>
                        {c.semaine && c.semaine !== "toutes" && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                            Sem. {c.semaine}
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: INK_SOFT }}>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {c.debut}–{c.fin}
                        </span>
                        {c.salle && <span>· Salle {c.salle}</span>}
                      </div>
                    </div>
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: c.type === "revision" ? GREEN_SOFT : "rgba(31, 42, 68, 0.08)",
                        color: c.type === "revision" ? GREEN : INK,
                      }}
                    >
                      {c.type === "revision" ? "Révision" : "Cours"}
                    </span>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: INK }}>
              Prochains devoirs
            </h2>
            <span className="text-xs text-stone-500">
              {data.devoirs.filter((d) => !d.fait).length} en attente
            </span>
          </div>
          {devoirsAvenir.length === 0 ? (
            <EmptyState text="Aucun devoir en attente. Tout est à jour !" />
          ) : (
            <div className="space-y-2.5">
              {devoirsAvenir.map((d) => {
                const jr = joursRestants(d.date);
                const retard = jr < 0;
                const matColor = couleurMatiere(data, d.matiereId);
                return (
                  <Card key={d.id} className="flex items-center justify-between !p-3 border-l-4" style={{ borderLeftColor: matColor }}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => update((dt) => {
                          const item = dt.devoirs.find((x) => x.id === d.id);
                          if (item) item.fait = true;
                        })}
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors hover:border-emerald-600 shrink-0"
                        style={{ borderColor: PAPER_LINE }}
                        title="Marquer comme fait"
                      >
                        <Check size={12} className="opacity-0 hover:opacity-100" />
                      </button>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: INK }}>
                          <span>{d.titre}</span>
                          {d.priorite === "haute" && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-bold">
                              Urgent
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: retard ? RED : INK_SOFT }}>
                          <span className="font-medium" style={{ color: matColor }}>{nomMatiere(data, d.matiereId)}</span>
                          {" · "}{dateLabel(d.date)}
                          {retard && " · en retard !"}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// 2. Onglet Notes & Simulateur
// ---------------------------------------------------------------------------
function Notes({ data, periode, update }) {
  const [ajoutMatiere, setAjoutMatiere] = useState(false);
  const [nomM, setNomM] = useState("");
  const [coefM, setCoefM] = useState(1);
  const [couleurM, setCouleurM] = useState(COULEURS_MATIERES[1].hex);
  const [ouvertNoteForm, setOuvertNoteForm] = useState(null); // { matiereId, noteId (si edit) }
  const [showSimulateur, setShowSimulateur] = useState(false);
  const [docAImprimer, setDocAImprimer] = useState(null); // "releve" | "bulletin" | null
  const [viewerCopie, setViewerCopie] = useState(null); // { note, copieIdx }

  // Nombre total de copies numérisées
  const totalCopies = useMemo(() => {
    return data.notes.reduce((acc, n) => acc + (n.copies?.length || 0), 0);
  }, [data.notes]);

  // État simulateur
  const [simMatiereId, setSimMatiereId] = useState("");
  const [simNote, setSimNote] = useState(15);
  const [simCoef, setSimCoef] = useState(1);

  function ajouterMatiere(e) {
    e.preventDefault();
    if (!nomM.trim()) return;
    update((d) => d.matieres.push({
      id: uid(),
      nom: nomM.trim(),
      coefficient: Number(coefM) || 1,
      couleur: couleurM,
    }));
    setNomM("");
    setCoefM(1);
    setAjoutMatiere(false);
  }

  function supprimerMatiere(id) {
    if (window.confirm("Supprimer cette matière ainsi que toutes ses notes ?")) {
      update((d) => {
        d.matieres = d.matieres.filter((m) => m.id !== id);
        d.notes = d.notes.filter((n) => n.matiereId !== id);
      });
    }
  }

  const moyGen = moyenneGenerale(data.matieres, data.notes, periode);

  // Calcul du simulateur
  const simResults = useMemo(() => {
    if (!simMatiereId) return null;
    const targetM = data.matieres.find((m) => m.id === simMatiereId);
    if (!targetM) return null;

    const moyActuelleM = moyenneMatiere(data.notes, simMatiereId, periode);
    const moyActuelleG = moyGen;

    // Calcul matière simulée
    const listSimNotes = [
      ...data.notes.filter((n) => n.matiereId === simMatiereId && n.periode === periode),
      { valeur: Number(simNote), bareme: data.settings.bareme, coefficient: Number(simCoef) },
    ];
    let sM = 0, pM = 0;
    listSimNotes.forEach((n) => {
      sM += ((Number(n.valeur) / Number(n.bareme)) * 20) * Number(n.coefficient || 1);
      pM += Number(n.coefficient || 1);
    });
    const simMoyM = pM > 0 ? sM / pM : null;

    // Calcul générale simulée
    let sG = 0, pG = 0;
    data.matieres.forEach((m) => {
      const coef = Number(m.coefficient || 1);
      if (m.id === simMatiereId) {
        if (simMoyM !== null) {
          sG += simMoyM * coef;
          pG += coef;
        }
      } else {
        const moy = moyenneMatiere(data.notes, m.id, periode);
        if (moy !== null) {
          sG += moy * coef;
          pG += coef;
        }
      }
    });
    const simMoyG = pG > 0 ? sG / pG : null;

    return {
      moyActuelleM,
      simMoyM,
      diffM: (simMoyM !== null && moyActuelleM !== null) ? (simMoyM - moyActuelleM) : null,
      moyActuelleG,
      simMoyG,
      diffG: (simMoyG !== null && moyActuelleG !== null) ? (simMoyG - moyActuelleG) : null,
    };
  }, [simMatiereId, simNote, simCoef, data, periode, moyGen]);

  return (
    <Page
      title="Notes & Évaluations"
      subtitle={periode}
      color={RED}
      icon={BookOpen}
      action={
        <>
          <Button
            variant="ghost"
            onClick={() => setDocAImprimer("releve")}
            title="Imprimer ou exporter le relevé officiel de notes"
          >
            <Printer size={15} /> Relevé
          </Button>
          <Button
            variant="ghost"
            onClick={() => setDocAImprimer("bulletin")}
            title="Imprimer ou exporter le bulletin officiel du semestre/trimestre"
          >
            <Award size={15} /> Bulletin officiel
          </Button>
          <Button
            variant={showSimulateur ? "warning" : "ghost"}
            onClick={() => {
              setShowSimulateur((v) => !v);
              if (!simMatiereId && data.matieres.length > 0) setSimMatiereId(data.matieres[0].id);
            }}
          >
            <Target size={15} /> Simulateur
          </Button>
          <Button variant="accent" onClick={() => setAjoutMatiere((v) => !v)}>
            <Plus size={15} /> Matière
          </Button>
        </>
      }
    >
      {/* Impression exclusive : Relevé ou Bulletin officiel */}
      {docAImprimer && (
        <DocumentOfficielModal
          type={docAImprimer}
          onClose={() => setDocAImprimer(null)}
          data={data}
          periode={periode}
        />
      )}

      {/* Visionneuse plein écran de copie */}
      {viewerCopie && (
        <VisionneuseCopie
          note={viewerCopie.note}
          initialIndex={viewerCopie.copieIdx || 0}
          onClose={() => setViewerCopie(null)}
          update={update}
        />
      )}

      {/* Simulateur de moyenne */}
      {showSimulateur && (
        <Card className="mb-6 border-2 border-amber-300 bg-amber-50/40">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles size={18} color={YELLOW} />
              <h3 className="font-bold text-sm" style={{ color: INK }}>
                Simulateur de moyenne — « Et si j'avais cette note ? »
              </h3>
            </div>
            <button onClick={() => setShowSimulateur(false)} className="text-stone-400 hover:text-stone-700">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Field label="Choisir la matière">
              <select
                style={inputStyle}
                value={simMatiereId}
                onChange={(e) => setSimMatiereId(e.target.value)}
              >
                {data.matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={`Note visée (/${data.settings.bareme})`}>
              <input
                type="number"
                step="0.5"
                min="0"
                max={data.settings.bareme}
                style={inputStyle}
                value={simNote}
                onChange={(e) => setSimNote(e.target.value)}
              />
            </Field>

            <Field label="Coefficient prévu">
              <input
                type="number"
                step="0.5"
                min="0.5"
                style={inputStyle}
                value={simCoef}
                onChange={(e) => setSimCoef(e.target.value)}
              />
            </Field>
          </div>

          {simResults && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
              <div className="p-3 rounded-lg bg-white border border-amber-200">
                <div className="text-xs text-stone-500 font-semibold">Moyenne de la matière estimée</div>
                <div className="text-xl font-bold mt-1" style={{ color: INK }}>
                  {formatNote(simResults.simMoyM, data.settings.bareme)} / {data.settings.bareme}
                  {simResults.diffM !== null && (
                    <span
                      className={`text-xs ml-2 font-bold px-1.5 py-0.5 rounded ${
                        simResults.diffM >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {simResults.diffM >= 0 ? "+" : ""}
                      {formatNote(simResults.diffM, data.settings.bareme)} pts
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-amber-200">
                <div className="text-xs text-stone-500 font-semibold">Moyenne générale estimée</div>
                <div className="text-xl font-bold mt-1" style={{ color: INK }}>
                  {formatNote(simResults.simMoyG, data.settings.bareme)} / {data.settings.bareme}
                  {simResults.diffG !== null && (
                    <span
                      className={`text-xs ml-2 font-bold px-1.5 py-0.5 rounded ${
                        simResults.diffG >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {simResults.diffG >= 0 ? "+" : ""}
                      {formatNote(simResults.diffG, data.settings.bareme)} pts
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Formulaire d'ajout de matière */}
      {ajoutMatiere && (
        <Card className="mb-5 shadow-sm">
          <form onSubmit={ajouterMatiere} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Field label="Nom de la matière">
                  <input
                    style={inputStyle}
                    value={nomM}
                    onChange={(e) => setNomM(e.target.value)}
                    placeholder="ex. Mathématiques, Philosophie, Histoire..."
                    autoFocus
                  />
                </Field>
              </div>
              <div>
                <Field label="Coefficient">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    style={inputStyle}
                    value={coefM}
                    onChange={(e) => setCoefM(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold mb-1.5" style={{ color: INK_SOFT }}>
                Couleur de la matière
              </span>
              <div className="flex gap-2 flex-wrap items-center">
                {COULEURS_MATIERES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCouleurM(c.hex)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      background: c.hex,
                      outline: couleurM === c.hex ? `3px solid ${INK}` : "none",
                      outlineOffset: 2,
                    }}
                    title={c.nom}
                  >
                    {couleurM === c.hex && <Check size={14} color="#fff" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="submit">Enregistrer la matière</Button>
              <Button variant="ghost" onClick={() => setAjoutMatiere(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Liste des matières */}
      {data.matieres.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          text="Aucune matière pour l'instant. Ajoute tes matières pour commencer à enregistrer tes notes ou charge les presets dans Réglages !"
        />
      ) : (
        <div className="space-y-3">
          {data.matieres.map((m) => {
            const moy = moyenneMatiere(data.notes, m.id, periode);
            const notesM = data.notes.filter((n) => n.matiereId === m.id && n.periode === periode);
            const couleur = m.couleur || INK;

            return (
              <Card key={m.id} className="border-l-4" style={{ borderLeftColor: couleur }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: couleur }}
                    />
                    <div>
                      <div className="font-bold text-sm" style={{ color: INK }}>
                        {m.nom}{" "}
                        <span style={{ color: INK_SOFT }} className="font-normal text-xs">
                          · coeff. {m.coefficient}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: INK_SOFT }}>
                        {moy === null ? (
                          <span className="italic text-stone-400">Aucune note pour ce trimestre</span>
                        ) : (
                          <span className="font-semibold text-stone-800">
                            Moyenne : {formatNote(moy, data.settings.bareme)} / {data.settings.bareme}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      small
                      variant="ghost"
                      onClick={() =>
                        setOuvertNoteForm(
                          ouvertNoteForm?.matiereId === m.id && !ouvertNoteForm?.noteId
                            ? null
                            : { matiereId: m.id, noteId: null }
                        )
                      }
                    >
                      <Plus size={13} /> Note
                    </Button>
                    <button
                      onClick={() => supprimerMatiere(m.id)}
                      title="Supprimer la matière"
                      className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Badges des notes */}
                {notesM.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-wrap gap-2">
                    {notesM.map((n) => (
                      <div
                        key={n.id}
                        className="text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-2 transition-all hover:shadow-xs group bg-white border border-stone-200"
                        style={{ color: INK }}
                      >
                        <span className="font-medium">{n.label || "Note"} :</span>
                        <span className="font-bold">
                          {n.valeur}/{n.bareme}
                        </span>
                        {n.coefficient && n.coefficient !== 1 && (
                          <span className="text-[10px] text-stone-500">(coef {n.coefficient})</span>
                        )}

                        {/* Bouton photo de la copie physique si présente */}
                        {n.copies && n.copies.length > 0 ? (
                          <button
                            onClick={() => setViewerCopie({ note: n, copieIdx: 0 })}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors border border-emerald-200"
                            title="Voir la copie numérisée enregistrée"
                          >
                            <Camera size={11} />
                            <span>{n.copies.length} p.</span>
                          </button>
                        ) : null}

                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                          <button
                            onClick={() => setOuvertNoteForm({ matiereId: m.id, noteId: n.id })}
                            title="Modifier cette note ou filmer la copie"
                            className="text-stone-500 hover:text-blue-600 p-0.5"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() =>
                              update((d) => {
                                d.notes = d.notes.filter((x) => x.id !== n.id);
                              })
                            }
                            title="Supprimer cette note"
                            className="text-stone-500 hover:text-red-600 p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulaire ajout ou édition d'une note */}
                {ouvertNoteForm?.matiereId === m.id && (
                  <NoteForm
                    bareme={data.settings.bareme}
                    initialNote={data.notes.find((x) => x.id === ouvertNoteForm.noteId)}
                    onSave={(note) => {
                      update((d) => {
                        if (ouvertNoteForm.noteId) {
                          const idx = d.notes.findIndex((x) => x.id === ouvertNoteForm.noteId);
                          if (idx >= 0) d.notes[idx] = { ...d.notes[idx], ...note };
                        } else {
                          d.notes.push({ id: uid(), matiereId: m.id, periode, ...note });
                        }
                      });
                      setOuvertNoteForm(null);
                    }}
                    onCancel={() => setOuvertNoteForm(null)}
                  />
                )}
              </Card>
            );
          })}

          {/* Synthèse générale */}
          <Card style={{ background: INK }} className="text-white mt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-sm font-semibold tracking-wide">Moyenne générale — {periode}</span>
                <p className="text-xs text-white/60">Pondérée selon les coefficients de chaque matière</p>
              </div>
              <span style={{ fontFamily: SERIF, color: YELLOW }} className="text-2xl sm:text-3xl font-bold">
                {moyGen === null ? "—" : `${formatNote(moyGen, data.settings.bareme)} / ${data.settings.bareme}`}
              </span>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Formulaire de saisie de note avec capture photo de la copie physique
// ---------------------------------------------------------------------------
function NoteForm({ bareme, initialNote, onSave, onCancel }) {
  const [label, setLabel] = useState(initialNote?.label || "");
  const [valeur, setValeur] = useState(initialNote?.valeur ?? "");
  const [baremeVal, setBaremeVal] = useState(initialNote?.bareme || bareme);
  const [coeff, setCoeff] = useState(initialNote?.coefficient || 1);
  const [copies, setCopies] = useState(initialNote?.copies || []);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const cameraInputRef = useRef(null);

  async function handleCaptureCopies(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setLoadingPhoto(true);
    try {
      const nouvellesPages = [];
      for (const file of files) {
        let photoUrl = null;
        try {
          const uploadRes = await uploadImage(file);
          if (uploadRes?.url) {
            photoUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          // Serveur non disponible ou hors-ligne
        }
        if (!photoUrl) {
          photoUrl = await compresserPhotoCopie(file);
        }
        nouvellesPages.push({
          id: uid(),
          url: photoUrl,
          date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
        });
      }
      setCopies((prev) => [...prev, ...nouvellesPages]);
    } catch (err) {
      console.error("Erreur lors de la capture de la copie", err);
      alert("Impossible de charger la photo.");
    } finally {
      setLoadingPhoto(false);
      e.target.value = "";
    }
  }

  function supprimerPageCopie(id) {
    setCopies((prev) => prev.filter((p) => p.id !== id));
  }

  function submit(e) {
    e.preventDefault();
    if (valeur === "" || isNaN(Number(valeur))) return;
    onSave({
      label: label.trim() || "Évaluation",
      valeur: Number(valeur),
      bareme: Number(baremeVal) || 20,
      coefficient: Number(coeff) || 1,
      copies: copies,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 pt-3 border-t border-stone-200 bg-stone-50/70 p-3.5 rounded-xl space-y-3"
    >
      <div className="flex items-end gap-2.5 flex-wrap">
        <div style={{ minWidth: 140 }} className="flex-1">
          <Field label="Intitulé du devoir / interro">
            <input
              style={inputStyle}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex. Interro ch.3, DM 2, Bac Blanc..."
              autoFocus
            />
          </Field>
        </div>
        <div style={{ width: 90 }}>
          <Field label="Note obtenue">
            <input
              type="number"
              step="0.25"
              min="0"
              max={baremeVal}
              style={inputStyle}
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              placeholder="15"
            />
          </Field>
        </div>
        <div style={{ width: 85 }}>
          <Field label="Sur combien">
            <input
              type="number"
              min="1"
              style={inputStyle}
              value={baremeVal}
              onChange={(e) => setBaremeVal(e.target.value)}
            />
          </Field>
        </div>
        <div style={{ width: 80 }}>
          <Field label="Coeff.">
            <input
              type="number"
              min="0.25"
              step="0.25"
              style={inputStyle}
              value={coeff}
              onChange={(e) => setCoeff(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Section Filmer / Joindre la copie physique (Anti-Perte) */}
      <div className="pt-3 border-t border-stone-200">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Camera size={15} className="text-[#009E60]" />
              Filmer / Photographier ma copie (Anti-perte)
            </span>
            <p className="text-[11px] text-stone-500">
              Garde une trace nette de tes feuilles d'examen au chaud sur l'appareil.
            </p>
          </div>

          <Button
            small
            variant="ghost"
            onClick={() => cameraInputRef.current?.click()}
            disabled={loadingPhoto}
          >
            {loadingPhoto ? <RefreshCw size={12} className="animate-spin" /> : <Camera size={12} />}
            <span>{copies.length > 0 ? "+ Ajouter une page" : "Photographier la copie"}</span>
          </Button>

          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleCaptureCopies}
          />
        </div>

        {/* Aperçu des pages filmées */}
        {copies.length > 0 ? (
          <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1">
            {copies.map((c, idx) => (
              <div
                key={c.id || idx}
                className="relative group shrink-0 rounded-xl overflow-hidden border border-stone-300 shadow-2xs w-20 h-28 bg-stone-200 flex flex-col"
              >
                <img src={c.url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Page {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => supprimerPageCopie(c.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                  title="Supprimer cette page"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 rounded-lg border border-dashed border-stone-300 text-center text-xs text-stone-400 bg-white/50">
            Aucune photo de copie jointe pour l'instant.
          </div>
        )}
      </div>

      <div className="pt-2 flex gap-2">
        <Button type="submit" variant="accent">
          {initialNote ? "Modifier la note" : "Enregistrer la note"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Visionneuse Plein Écran de Copie Numérisée (Anti-Perte)
// ---------------------------------------------------------------------------
function VisionneuseCopie({ note, initialIndex = 0, onClose, update }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const copies = note?.copies || [];
  const curCopie = copies[index] || copies[0];
  const fileInputRef = useRef(null);
  const [addingPhoto, setAddingPhoto] = useState(false);

  async function handleAddPage(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAddingPhoto(true);
    try {
      const nouvelles = [];
      for (const f of files) {
        const b64 = await compresserPhotoCopie(f);
        nouvelles.push({
          id: uid(),
          url: b64,
          date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
        });
      }
      update((d) => {
        const target = d.notes.find((x) => x.id === note.id);
        if (target) {
          if (!target.copies) target.copies = [];
          target.copies.push(...nouvelles);
        }
      });
      setIndex(copies.length);
    } catch (err) {
      alert("Erreur lors de l'ajout de la page.");
    } finally {
      setAddingPhoto(false);
      e.target.value = "";
    }
  }

  function supprimerPageCourante() {
    if (copies.length <= 1) {
      if (window.confirm("Supprimer l'unique photo de cette copie ?")) {
        update((d) => {
          const target = d.notes.find((x) => x.id === note.id);
          if (target) target.copies = [];
        });
        onClose();
      }
      return;
    }
    if (window.confirm(`Supprimer la page ${index + 1} de cette copie ?`)) {
      update((d) => {
        const target = d.notes.find((x) => x.id === note.id);
        if (target && target.copies) {
          target.copies.splice(index, 1);
        }
      });
      setIndex((i) => Math.max(0, i - 1));
    }
  }

  function telechargerImage() {
    if (!curCopie?.url) return;
    const a = document.createElement("a");
    a.href = curCopie.url;
    a.download = `copie-${note.label || "evaluation"}-page${index + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (!curCopie) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col backdrop-blur-xs animate-fadeIn text-white select-none">
      {/* Barre supérieure */}
      <div className="p-3 sm:px-6 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
            <FileText size={18} />
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base flex items-center gap-2">
              <span>{note.label || "Copie d'évaluation"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold">
                {note.valeur}/{note.bareme}
              </span>
            </div>
            <div className="text-[11px] text-stone-400">
              Page {index + 1} sur {copies.length} {curCopie.date && `· Enregistrée le ${curCopie.date}`}
            </div>
          </div>
        </div>

        {/* Contrôles zoom & actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg bg-stone-800 p-0.5 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
              className="p-1.5 hover:bg-stone-700 rounded text-stone-300"
              title="Zoom arrière"
            >
              <ZoomOut size={16} />
            </button>
            <span className="px-2 py-1 text-stone-400 font-mono text-[11px]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-1.5 hover:bg-stone-700 rounded text-stone-300"
              title="Zoom avant"
            >
              <ZoomIn size={16} />
            </button>
            {zoom !== 1 && (
              <button
                onClick={() => setZoom(1)}
                className="px-1.5 py-1 hover:bg-stone-700 rounded text-[10px] text-stone-400"
              >
                100%
              </button>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={addingPhoto}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Ajouter une autre page à cette copie"
          >
            {addingPhoto ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
            <span className="hidden sm:inline">Ajouter page</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleAddPage}
          />

          <button
            onClick={telechargerImage}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5"
            title="Télécharger l'image sur l'appareil"
          >
            <Download size={14} />
          </button>

          <button
            onClick={supprimerPageCourante}
            className="p-2 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-300 hover:text-red-300 text-xs"
            title="Supprimer cette page"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Zone d'affichage image */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.15s ease-out" }}
          className="max-w-full max-h-full flex items-center justify-center"
        >
          <img
            src={curCopie.url}
            alt={`Page ${index + 1}`}
            className="max-w-[92vw] max-h-[82vh] object-contain rounded-lg shadow-2xl border border-stone-700 select-none pointer-events-auto"
          />
        </div>

        {/* Flèches de navigation de pages */}
        {copies.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + copies.length) % copies.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs border border-white/20 transition-transform active:scale-95"
              title="Page précédente"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % copies.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs border border-white/20 transition-transform active:scale-95"
              title="Page suivante"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Bandeau miniature en bas si plusieurs pages */}
      {copies.length > 1 && (
        <div className="p-2 bg-stone-900/90 border-t border-stone-800 flex justify-center gap-2 overflow-x-auto">
          {copies.map((c, i) => (
            <button
              key={c.id || i}
              onClick={() => setIndex(i)}
              className={`relative rounded-lg overflow-hidden w-12 h-16 shrink-0 border-2 transition-all ${
                index === i ? "border-emerald-400 scale-105 shadow-md" : "border-stone-700 opacity-60 hover:opacity-100"
              }`}
            >
              <img src={c.url} alt={`Min ${i + 1}`} className="w-full h-full object-cover" />
              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-center font-bold text-white">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modale d'Impression des Documents Scolaires Officiels Gabonais
// (Relevé de notes ou Bulletin du semestre / trimestre exclusivement)
// ---------------------------------------------------------------------------
function DocumentOfficielModal({ type, onClose, data, periode }) {
  const p = data.profil || {};
  const isReleve = type === "releve";
  const notesPeriode = data.notes.filter((n) => n.periode === periode);
  const moyGen = moyenneGenerale(data.matieres, data.notes, periode);

  // Décision et mentions officielles gabonaises selon la moyenne
  let mention = "Passable";
  let appreciationConseil = "Poursuivez vos efforts pour consolider les acquis.";
  if (moyGen !== null) {
    if (moyGen >= 16) {
      mention = "Très Bien — Félicitations du Conseil de Classe";
      appreciationConseil = "Excellent travail ! Félicitations du conseil pour votre régularité et votre rigueur exemplaire.";
    } else if (moyGen >= 14) {
      mention = "Bien — Félicitations du Conseil de Classe";
      appreciationConseil = "Très bon trimestre. Félicitations pour ces résultats solides.";
    } else if (moyGen >= 12) {
      mention = "Assez Bien — Encouragements du Conseil de Classe";
      appreciationConseil = "Bon travail d'ensemble. Encouragements du conseil à persévérer.";
    } else if (moyGen >= 10) {
      mention = "Passable — Tableau d'Honneur";
      appreciationConseil = "Résultats convenables. Intensifiez les efforts dans les matières fondamentales.";
    } else {
      mention = "Insuffisant — Doit redoubler d'efforts";
      appreciationConseil = "Résultats insuffisants. Un travail personnel régulier et soutenu est impératif.";
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto modal-backdrop-print">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* Barre d'action supérieure (masquée à l'impression) */}
        <div className="no-print p-4 bg-stone-900 text-white flex items-center justify-between gap-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Printer className="text-emerald-400" size={20} />
            <div>
              <div className="font-bold text-sm sm:text-base">
                {isReleve ? "Aperçu du Relevé de Notes" : "Aperçu du Bulletin Officiel"}
              </div>
              <div className="text-xs text-stone-400">
                Format A4 officiel gabonais · Conforme pour l'impression papier ou l'exportation en PDF
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer size={15} /> Imprimer / Enregistrer PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Officiel imprimable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-black print:p-0">
          <div id="document-officiel-print" className="max-w-[760px] mx-auto text-[11px] leading-tight font-sans">
            
            {/* En-tête officiel République Gabonaise */}
            <div className="flex justify-between items-start border-b-2 border-stone-800 pb-3 mb-4">
              <div className="text-left space-y-0.5 max-w-[280px]">
                <div className="font-serif font-black text-xs uppercase tracking-wider text-stone-900">
                  République Gabonaise
                </div>
                <div className="text-[10px] font-bold text-stone-600 italic">
                  Union — Travail — Justice
                </div>
                <div className="text-[10px] font-semibold text-stone-700 pt-1">
                  Ministère de l'Éducation Nationale
                </div>
                <div className="text-[10px] text-stone-600">
                  Direction d'Académie Provinciale
                </div>
                <div className="text-[11px] font-bold text-stone-900 pt-1">
                  Établissement : {p.etablissement || "Collège / Lycée"}
                </div>
                {p.ville && <div className="text-[10px] text-stone-600">Ville : {p.ville}</div>}
              </div>

              <div className="text-center px-2">
                <div className="w-14 h-14 mx-auto rounded-full border border-stone-300 flex items-center justify-center p-1 bg-stone-50 overflow-hidden mb-1">
                  <img src="/favicon.png" alt="Blason" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest">
                  Année Scolaire
                </div>
                <div className="font-bold text-xs text-stone-900 font-mono">
                  {p.anneeScolaire || "2025-2026"}
                </div>
              </div>

              <div className="text-right space-y-0.5 max-w-[240px]">
                <div className="font-bold text-stone-900 text-xs uppercase">
                  {periode.toUpperCase()}
                </div>
                <div className="text-[10px] text-stone-500">
                  Édité le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="text-[10px] text-stone-500 pt-1 font-mono">
                  Matricule : {p.classe ? `${p.classe}-2026` : "ELV-2026"}
                </div>
              </div>
            </div>

            {/* Titre encadré du document */}
            <div className="my-3 py-2 px-4 text-center border-2 border-stone-800 bg-stone-50 rounded-lg">
              <h1 className="font-serif font-black text-sm uppercase tracking-widest text-stone-900">
                {isReleve
                  ? "RELEVÉ OFFICIEL DES NOTES & ÉVALUATIONS"
                  : `BULLETIN DE NOTES OFFICIEL — ${periode.toUpperCase()}`}
              </h1>
            </div>

            {/* Fiche d'identité de l'élève */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-stone-100/70 border border-stone-300 rounded-lg mb-4 text-xs">
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-bold">Nom & Prénom</span>
                <span className="font-bold text-stone-900 text-sm">
                  {[p.nom, p.prenom].filter(Boolean).join(" ") || "Élève"}
                </span>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-bold">Classe</span>
                <span className="font-bold text-stone-900">{p.classe || "Non renseignée"}</span>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-bold">Période</span>
                <span className="font-bold text-stone-900">{periode}</span>
              </div>
            </div>

            {/* Table du document : Relevé ou Bulletin */}
            {isReleve ? (
              /* Tableau Relevé de notes */
              <div className="border border-stone-400 rounded overflow-hidden mb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-200 border-b border-stone-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="p-2 border-r border-stone-300">Discipline</th>
                      <th className="p-2 border-r border-stone-300">Date</th>
                      <th className="p-2 border-r border-stone-300">Évaluation</th>
                      <th className="p-2 text-center border-r border-stone-300">Note brute</th>
                      <th className="p-2 text-center border-r border-stone-300">Note /20</th>
                      <th className="p-2 text-center border-r border-stone-300">Coeff</th>
                      <th className="p-2 text-center">Moyenne Matière</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.matieres.map((m) => {
                      const notesMat = notesPeriode.filter((n) => n.matiereId === m.id);
                      const moyM = moyenneMatiere(data.notes, m.id, periode);
                      if (notesMat.length === 0) {
                        return (
                          <tr key={m.id} className="border-b border-stone-200 text-stone-400">
                            <td className="p-2 font-bold border-r border-stone-200 text-stone-800">{m.nom}</td>
                            <td colSpan={5} className="p-2 italic text-center text-stone-400">Aucune évaluation enregistrée</td>
                            <td className="p-2 text-center font-bold text-stone-500">—</td>
                          </tr>
                        );
                      }
                      return notesMat.map((n, idx) => {
                        const noteSur20 = ((Number(n.valeur) / Number(n.bareme || 20)) * 20).toFixed(2);
                        return (
                          <tr key={n.id} className="border-b border-stone-200">
                            {idx === 0 ? (
                              <td rowSpan={notesMat.length} className="p-2 font-bold border-r border-stone-300 align-top bg-stone-50/50">
                                {m.nom}
                                <div className="text-[9px] text-stone-400 font-normal">Coeff. {m.coefficient || 1}</div>
                              </td>
                            ) : null}
                            <td className="p-2 border-r border-stone-200 text-stone-600">{n.date || "—"}</td>
                            <td className="p-2 border-r border-stone-200 font-medium">{n.label || "Devoir"}</td>
                            <td className="p-2 border-r border-stone-200 text-center font-mono">{n.valeur}/{n.bareme}</td>
                            <td className="p-2 border-r border-stone-200 text-center font-bold font-mono">{noteSur20}</td>
                            <td className="p-2 border-r border-stone-200 text-center">{n.coefficient || 1}</td>
                            {idx === 0 ? (
                              <td rowSpan={notesMat.length} className="p-2 text-center font-bold font-mono text-sm border-l border-stone-300 align-middle bg-stone-50">
                                {moyM !== null ? `${moyM.toFixed(2)}/20` : "—"}
                              </td>
                            ) : null}
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Tableau Bulletin officiel du trimestre / semestre */
              <div className="border border-stone-400 rounded overflow-hidden mb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-200 border-b border-stone-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="p-2 border-r border-stone-300">Disciplines</th>
                      <th className="p-2 text-center border-r border-stone-300 w-14">Coeff</th>
                      <th className="p-2 text-center border-r border-stone-300 w-24">Moyenne /20</th>
                      <th className="p-2 text-center border-r border-stone-300 w-24">Total (Moy × Coeff)</th>
                      <th className="p-2">Appréciations et observations des professeurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.matieres.map((m) => {
                      const moyM = moyenneMatiere(data.notes, m.id, periode);
                      const coeff = Number(m.coefficient) || 1;
                      const totalM = moyM !== null ? (moyM * coeff).toFixed(2) : "—";
                      let appProf = "Travail régulier.";
                      if (moyM !== null) {
                        if (moyM >= 16) appProf = "Excellent niveau, participation active et rigueur exemplaire.";
                        else if (moyM >= 14) appProf = "Très bon travail. Solide compréhension du programme.";
                        else if (moyM >= 12) appProf = "Bon travail d'ensemble. Des progrès réguliers.";
                        else if (moyM >= 10) appProf = "Ensemble convenable. Peut mieux faire en approfondissant.";
                        else appProf = "Résultats insuffisants. Manque de travail personnel.";
                      }

                      return (
                        <tr key={m.id} className="border-b border-stone-300">
                          <td className="p-2 font-bold border-r border-stone-300 bg-stone-50/40">{m.nom}</td>
                          <td className="p-2 text-center border-r border-stone-300 font-mono">{coeff}</td>
                          <td className="p-2 text-center border-r border-stone-300 font-bold font-mono text-xs">
                            {moyM !== null ? moyM.toFixed(2) : "—"}
                          </td>
                          <td className="p-2 text-center border-r border-stone-300 font-mono text-stone-700">
                            {totalM}
                          </td>
                          <td className="p-2 text-stone-700 italic text-[10px]">{moyM !== null ? appProf : "Pas de note"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-100 border-t-2 border-stone-800 font-bold text-xs">
                      <td className="p-2.5 uppercase tracking-wider">Total des coefficients & points</td>
                      <td className="p-2.5 text-center font-mono">
                        {data.matieres.reduce((acc, m) => acc + (Number(m.coefficient) || 1), 0)}
                      </td>
                      <td className="p-2.5 text-center font-mono bg-stone-200/60 font-black">
                        {moyGen !== null ? `${moyGen.toFixed(2)}/20` : "—"}
                      </td>
                      <td colSpan={2} className="p-2.5 text-stone-600 text-[10px] font-normal italic">
                        Moyenne pondérée officielle du semestre
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Bilan & Décision du Conseil de Classe */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 border-2 border-stone-800 rounded-lg bg-stone-50/80">
                <div className="text-[10px] uppercase font-bold text-stone-500 mb-1">
                  Moyenne Générale Officielle
                </div>
                <div className="text-2xl font-black font-mono text-stone-900">
                  {moyGen !== null ? `${moyGen.toFixed(2)} / 20` : "Non calculée"}
                </div>
                <div className="text-xs font-bold text-stone-800 mt-1">
                  Mention : <span className="underline">{mention}</span>
                </div>
              </div>

              <div className="p-3 border border-stone-400 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-stone-500 mb-1">
                  Avis et Décision du Conseil de Classe
                </div>
                <div className="text-xs text-stone-800 italic leading-snug">
                  "{appreciationConseil}"
                </div>
              </div>
            </div>

            {/* Signatures officielles à trois parties */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-[10px]">
              <div className="border border-stone-300 p-2 pb-14 rounded">
                <span className="font-bold block uppercase">Le Professeur Principal</span>
                <span className="text-[9px] text-stone-400">Visa & Signature</span>
              </div>
              <div className="border border-stone-300 p-2 pb-14 rounded">
                <span className="font-bold block uppercase">Le Chef d'Établissement</span>
                <span className="text-[9px] text-stone-400">Signature & Sceau officiel</span>
              </div>
              <div className="border border-stone-300 p-2 pb-14 rounded">
                <span className="font-bold block uppercase">Le Parent / Tuteur légal</span>
                <span className="text-[9px] text-stone-400">Signature</span>
              </div>
            </div>

            {/* Pied de page officiel */}
            <div className="mt-6 pt-2 border-t border-stone-300 text-center text-[9px] text-stone-500">
              Document officiel édité via Carnet Scolaire · République Gabonaise.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Espace Dédié : Mes Copies Numérisées (Coffre-Fort Anti-Perte)
// ---------------------------------------------------------------------------
function CopiesView({ data, update }) {
  const [modalAjout, setModalAjout] = useState(false);
  const [filtreMatiere, setFiltreMatiere] = useState("");
  const [recherche, setRecherche] = useState("");
  const [viewerCopie, setViewerCopie] = useState(null);

  // État formulaire ajout de copie
  const [titre, setTitre] = useState("");
  const [matiereId, setMatiereId] = useState(data.matieres[0]?.id || "");
  const [dateCopie, setDateCopie] = useState(new Date().toISOString().slice(0, 10));
  const [noteValeur, setNoteValeur] = useState("");
  const [pages, setPages] = useState([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Centraliser toutes les copies : autonomes, notes et devoirs
  const toutesLesCopies = useMemo(() => {
    const list = [];
    (data.copies || []).forEach((c) => {
      list.push({
        id: c.id,
        type: "autonome",
        titre: c.titre,
        matiereId: c.matiereId,
        date: c.date,
        valeur: c.valeur || null,
        bareme: c.bareme || 20,
        pages: c.pages || [],
        source: c,
      });
    });
    (data.notes || []).forEach((n) => {
      if (n.copies && n.copies.length > 0) {
        list.push({
          id: n.id,
          type: "note",
          titre: n.label || "Évaluation",
          matiereId: n.matiereId,
          date: n.date,
          valeur: n.valeur,
          bareme: n.bareme || 20,
          pages: n.copies,
          source: n,
        });
      }
    });
    (data.devoirs || []).forEach((d) => {
      if (d.copies && d.copies.length > 0) {
        list.push({
          id: d.id,
          type: "devoir",
          titre: d.titre,
          matiereId: d.matiereId,
          date: d.date,
          valeur: null,
          bareme: null,
          pages: d.copies,
          source: d,
        });
      }
    });
    return list;
  }, [data.copies, data.notes, data.devoirs]);

  const copiesFiltrees = useMemo(() => {
    return toutesLesCopies.filter((c) => {
      if (filtreMatiere && c.matiereId !== filtreMatiere) return false;
      if (recherche.trim()) {
        const q = recherche.toLowerCase();
        const mat = nomMatiere(data, c.matiereId).toLowerCase();
        const t = (c.titre || "").toLowerCase();
        return mat.includes(q) || t.includes(q);
      }
      return true;
    });
  }, [toutesLesCopies, filtreMatiere, recherche, data]);

  const totalPages = useMemo(() => {
    return toutesLesCopies.reduce((acc, c) => acc + (c.pages?.length || 0), 0);
  }, [toutesLesCopies]);

  // Capture directe depuis smartphone ou import fichier
  async function handleFileCapture(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setEnvoiEnCours(true);
    try {
      for (const file of files) {
        try {
          const res = await uploadImage(file);
          setPages((prev) => [...prev, { id: uid(), url: res.url, date: new Date().toISOString().slice(0, 10) }]);
        } catch (err) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setPages((prev) => [...prev, { id: uid(), url: ev.target.result, date: new Date().toISOString().slice(0, 10) }]);
          };
          reader.readAsDataURL(file);
        }
      }
    } finally {
      setEnvoiEnCours(false);
      e.target.value = "";
    }
  }

  function enregistrerNouvelleCopie(e) {
    e.preventDefault();
    if (!titre.trim()) {
      alert("Donne un titre à ta copie (ex: Devoir Surveillé de Maths N°1).");
      return;
    }
    if (pages.length === 0) {
      alert("Prends au moins une photo de ta copie.");
      return;
    }

    const nouvelle = {
      id: uid(),
      titre: titre.trim(),
      matiereId: matiereId || (data.matieres[0]?.id || ""),
      date: dateCopie,
      valeur: noteValeur ? Number(noteValeur) : null,
      bareme: 20,
      pages,
      creeLe: new Date().toISOString(),
    };

    update((d) => {
      if (!d.copies) d.copies = [];
      d.copies.unshift(nouvelle);
    });

    setTitre("");
    setPages([]);
    setNoteValeur("");
    setModalAjout(false);
  }

  function supprimerCopie(item) {
    if (!window.confirm(`Supprimer définitivement la copie "${item.titre}" ?`)) return;
    update((d) => {
      if (item.type === "autonome") {
        d.copies = (d.copies || []).filter((c) => c.id !== item.id);
      } else if (item.type === "note") {
        const n = d.notes.find((x) => x.id === item.id);
        if (n) n.copies = [];
      } else if (item.type === "devoir") {
        const dv = d.devoirs.find((x) => x.id === item.id);
        if (dv) dv.copies = [];
      }
    });
  }

  return (
    <Page
      title="Mes Copies Numérisées"
      subtitle="Coffre-fort anti-perte de tes copies d'examen et devoirs"
      color={GABON_VERT}
      icon={Camera}
      action={
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="accent"
            onClick={() => setModalAjout(true)}
            className="!bg-emerald-600 hover:!bg-emerald-700 text-white shadow-md"
          >
            <Camera size={15} /> Filmer une copie
          </Button>
        </div>
      }
    >
      {/* Visionneuse plein écran */}
      {viewerCopie && (
        <VisionneuseCopie
          note={viewerCopie.note}
          initialIndex={viewerCopie.copieIdx || 0}
          onClose={() => setViewerCopie(null)}
          update={update}
        />
      )}

      {/* Bannière de réassurance anti-perte */}
      <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-emerald-950">
              Tes copies papier sont sécurisées en ligne
            </h3>
            <p className="text-xs text-emerald-800 leading-snug">
              Même si ta copie physique est perdue, abîmée ou conservée par le professeur, tes photos originales restent archivées et consultables ici avec leurs notes et appréciations.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-200/80 text-emerald-900 border border-emerald-300">
          {totalPages} page{totalPages > 1 ? "s" : ""} sauvegardée{totalPages > 1 ? "s" : ""}
        </span>
      </div>

      {/* Barre de recherche et filtres par matière */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex gap-2 overflow-x-auto max-w-full">
          <button
            onClick={() => setFiltreMatiere("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              filtreMatiere === "" ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Toutes les matières ({toutesLesCopies.length})
          </button>
          {data.matieres.map((m) => {
            const count = toutesLesCopies.filter((c) => c.matiereId === m.id).length;
            if (count === 0) return null;
            return (
              <button
                key={m.id}
                onClick={() => setFiltreMatiere(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  filtreMatiere === m.id ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {m.nom} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
          <input
            placeholder="Rechercher une copie..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-emerald-600 transition-all"
          />
        </div>
      </div>

      {/* Grille des copies */}
      {copiesFiltrees.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Camera size={32} />
          </div>
          <h3 className="font-bold text-base text-stone-900">
            Aucune copie archivée pour le moment
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-5">
            Prends en photo tes copies de devoirs ou d'interrogations pour ne jamais les perdre !
          </p>
          <Button
            variant="accent"
            onClick={() => setModalAjout(true)}
            className="!bg-emerald-700 text-white mx-auto"
          >
            <Camera size={15} /> Filmer ma première copie
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {copiesFiltrees.map((c) => {
            const matNom = nomMatiere(data, c.matiereId);
            const matColor = couleurMatiere(data, c.matiereId);
            const firstPage = c.pages[0];

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Image miniature cliquable */}
                <div
                  className="relative h-44 bg-stone-100 overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setViewerCopie({
                    note: {
                      id: c.id,
                      label: c.titre,
                      valeur: c.valeur !== null ? `${c.valeur}` : "Copie",
                      bareme: c.bareme || 20,
                      copies: c.pages,
                    },
                    copieIdx: 0,
                  })}
                >
                  <img
                    src={firstPage?.url}
                    alt={c.titre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                    <span className="font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs flex items-center gap-1">
                      <Camera size={11} /> {c.pages.length} page{c.pages.length > 1 ? "s" : ""}
                    </span>
                    {c.valeur !== null && (
                      <span className="font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                        {c.valeur}/{c.bareme || 20}
                      </span>
                    )}
                  </div>
                </div>

                {/* Métadonnées & actions */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{ background: matColor + "20", color: matColor }}
                      >
                        {matNom}
                      </span>
                      <span className="text-[11px] text-stone-400">{c.date}</span>
                    </div>
                    <h4 className="font-bold text-sm text-stone-900 leading-snug line-clamp-2" title={c.titre}>
                      {c.titre}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => setViewerCopie({
                        note: {
                          id: c.id,
                          label: c.titre,
                          valeur: c.valeur !== null ? `${c.valeur}` : "Copie",
                          bareme: c.bareme || 20,
                          copies: c.pages,
                        },
                        copieIdx: 0,
                      })}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Consulter</span>
                      <Maximize2 size={13} />
                    </button>
                    <button
                      onClick={() => supprimerCopie(c)}
                      className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Supprimer cette copie"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Filmer / Ajouter une Copie */}
      {modalAjout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:px-6 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm sm:text-base">
                <Camera size={20} />
                <span>Filmer / Numériser une copie</span>
              </div>
              <button onClick={() => setModalAjout(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={enregistrerNouvelleCopie} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Titre ou Intitulé du devoir *
                </label>
                <input
                  required
                  placeholder="Ex : Devoir Surveillé de Maths N°1, Interro de SVT..."
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-300 p-2.5 bg-stone-50 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Matière *</label>
                  <select
                    value={matiereId}
                    onChange={(e) => setMatiereId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-300 p-2.5 bg-stone-50 focus:bg-white focus:outline-emerald-600"
                  >
                    {data.matieres.map((m) => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={dateCopie}
                    onChange={(e) => setDateCopie(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-300 p-2 bg-stone-50 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Note obtenue (Optionnel)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    placeholder="Ex : 15.5"
                    value={noteValeur}
                    onChange={(e) => setNoteValeur(e.target.value)}
                    className="w-32 text-xs rounded-xl border border-stone-300 p-2 bg-stone-50 focus:bg-white focus:outline-emerald-600"
                  />
                  <span className="text-xs text-stone-500 font-bold">/ 20</span>
                </div>
              </div>

              {/* Zone appareil photo / photos capturées */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Pages de la copie filmée ({pages.length} page{pages.length > 1 ? "s" : ""}) *
                </label>

                {/* Grille des pages déjà prises */}
                {pages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {pages.map((p, idx) => (
                      <div key={p.id || idx} className="relative rounded-xl overflow-hidden border border-stone-300 h-28 group">
                        <img src={p.url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white font-bold">
                          Page {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer cette page"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Boutons de capture directe */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={envoiEnCours}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-3 px-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Camera size={18} className="text-emerald-600" />
                    <span>{pages.length > 0 ? "Filmer la page suivante" : "Prendre en photo (Caméra)"}</span>
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileCapture}
                  />

                  <button
                    type="button"
                    disabled={envoiEnCours}
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Importer une image depuis la galerie"
                  >
                    <Upload size={16} />
                    <span className="hidden sm:inline">Importer</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileCapture}
                  />
                </div>
                {envoiEnCours && (
                  <div className="text-xs text-emerald-700 mt-2 flex items-center gap-1.5 animate-pulse font-medium">
                    <RefreshCw size={12} className="animate-spin" /> Téléversement de l'image sur le serveur...
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setModalAjout(false)}>
                  Annuler
                </Button>
                <Button variant="accent" type="submit" disabled={envoiEnCours || pages.length === 0}>
                  <Check size={14} /> Enregistrer dans mon coffre-fort
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------------------
// 3. Emploi du temps (EDT) — Design Élégant & Moderne
// ---------------------------------------------------------------------------
function EDT({ data, update }) {
  const [ajout, setAjout] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [vueMode, setVueMode] = useState("semaine"); // "semaine" | "jour"
  const [jourActif, setJourActif] = useState(todayJourFR() === "Dimanche" ? "Lundi" : todayJourFR());
  const [semaineFiltre, setSemaineFiltre] = useState(data.settings.semaineActive || "toutes");
  const [edtMode, setEdtMode] = useState("cours"); // "cours" | "planning"
  const [showPlanningModal, setShowPlanningModal] = useState(false);

  // \u2500\u2500 Formulaire créneau scolaire \u2500\u2500
  const [form, setForm] = useState({
    jour: "Lundi",
    debut: "08:00",
    fin: "10:00",
    label: "",
    type: "cours",
    matiereId: "",
    salle: "",
    professeur: "",
    semaine: "toutes",
  });

  // Calcul de la durée en clair
  function calcDuree(debut, fin) {
    if (!debut || !fin) return "";
    const [hD, mD] = debut.split(":").map(Number);
    const [hF, mF] = fin.split(":").map(Number);
    let diff = (hF * 60 + mF) - (hD * 60 + mD);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}min`;
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h00`;
  }

  // Vérifier si le cours a lieu en ce moment
  function isEnCours(jour, debut, fin) {
    if (todayJourFR() !== jour) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [hD, mD] = debut.split(":").map(Number);
    const [hF, mF] = fin.split(":").map(Number);
    const tD = hD * 60 + mD;
    const tF = hF * 60 + mF;
    return cur >= tD && cur < tF;
  }

  function ouvrirAjout() {
    setEditingId(null);
    const defaultMat = data.matieres[0];
    setForm({
      jour: jourActif,
      debut: "08:00",
      fin: "10:00",
      label: defaultMat ? defaultMat.nom : "",
      type: "cours",
      matiereId: defaultMat ? defaultMat.id : "",
      salle: "",
      professeur: "",
      semaine: semaineFiltre === "toutes" ? "toutes" : semaineFiltre,
    });
    setAjout(true);
  }

  function ouvrirEdition(c) {
    setEditingId(c.id);
    setForm({
      jour: c.jour,
      debut: c.debut || "08:00",
      fin: c.fin || "10:00",
      label: c.label || "",
      type: c.type || "cours",
      matiereId: c.matiereId || "",
      salle: c.salle || "",
      professeur: c.professeur || "",
      semaine: c.semaine || "toutes",
    });
    setAjout(true);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.label.trim()) return;
    update((d) => {
      if (editingId) {
        const idx = d.creneaux.findIndex((x) => x.id === editingId);
        if (idx >= 0) d.creneaux[idx] = { id: editingId, ...form };
      } else {
        d.creneaux.push({ id: uid(), ...form });
      }
    });
    setAjout(false);
    setEditingId(null);
  }

  // Filtrage selon la semaine A / B / Toutes
  const creneauxFiltres = data.creneaux.filter((c) => {
    if (semaineFiltre === "toutes") return true;
    if (!c.semaine || c.semaine === "toutes") return true;
    return c.semaine === semaineFiltre;
  });

  const CRENEAU_PRESETS = [
    { label: "07:30 – 09:30", debut: "07:30", fin: "09:30" },
    { label: "08:00 – 10:00", debut: "08:00", fin: "10:00" },
    { label: "10:00 – 12:00", debut: "10:00", fin: "12:00" },
    { label: "13:30 – 15:30", debut: "13:30", fin: "15:30" },
    { label: "15:30 – 17:30", debut: "15:30", fin: "17:30" },
  ];

  return (
    <Page
      title={edtMode === "cours" ? "Emploi du temps" : "Mon Programme de Travail"}
      subtitle={edtMode === "cours"
        ? `${semaineFiltre === "toutes" ? "Toutes les semaines" : `Semaine ${semaineFiltre}`} · ${creneauxFiltres.length} créneau${creneauxFiltres.length > 1 ? "x" : ""}`
        : `${(data.planningPerso || []).length} plage${(data.planningPerso || []).length > 1 ? "s" : ""} planifiée${(data.planningPerso || []).length > 1 ? "s" : ""}`
      }
      color={edtMode === "cours" ? GABON_JAUNE : GABON_VERT}
      icon={edtMode === "cours" ? CalendarDays : BookMarked}
      action={
        <div className="flex items-center gap-2 flex-wrap">
          {/* \u2500\u2500 Switcher principal Cours / Mon Programme \u2500\u2500 */}
          <div className="inline-flex rounded-xl border-2 p-0.5 text-xs font-bold shadow-xs" style={{ borderColor: GABON_VERT + "50", background: "#fff" }}>
            <button
              onClick={() => setEdtMode("cours")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${edtMode === "cours" ? "text-white shadow-xs" : "text-stone-600 hover:text-black"}`}
              style={edtMode === "cours" ? { background: GABON_JAUNE, color: JAUNE_DARK } : {}}
            >
              <CalendarDays size={13} />
              <span>Cours</span>
            </button>
            <button
              onClick={() => setEdtMode("planning")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${edtMode === "planning" ? "text-white shadow-xs" : "text-stone-600 hover:text-black"}`}
              style={edtMode === "planning" ? { background: GABON_VERT, color: "#fff" } : {}}
            >
              <BookMarked size={13} />
              <span>Mon Programme</span>
            </button>
          </div>

          {edtMode === "cours" && (<>
          <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setVueMode("semaine")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                vueMode === "semaine" ? "bg-[#1A3248] text-white shadow-xs" : "text-stone-600 hover:text-black"
              }`}
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Vue Semaine</span>
            </button>
            <button
              onClick={() => setVueMode("jour")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                vueMode === "jour" ? "bg-[#1A3248] text-white shadow-xs" : "text-stone-600 hover:text-black"
              }`}
            >
              <List size={13} />
              <span className="hidden sm:inline">Vue Journée</span>
            </button>
          </div>

          {/* Sélecteur Semaine A / B / Toutes */}
          <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-semibold shadow-2xs">
            {["toutes", "A", "B"].map((sem) => (
              <button
                key={sem}
                onClick={() => {
                  setSemaineFiltre(sem);
                  update((d) => { d.settings.semaineActive = sem; });
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  semaineFiltre === sem ? "bg-[#009E60] text-white shadow-xs" : "text-stone-600 hover:text-black"
                }`}
              >
                {sem === "toutes" ? "A & B" : `Sem. ${sem}`}
              </button>
            ))}
          </div>

          <Button variant="accent" onClick={ouvrirAjout}>
            <Plus size={14} /> Nouveau créneau
          </Button>
          </>)} {/* fin edtMode === cours */}

          {edtMode === "planning" && (
            <Button variant="accent" onClick={() => setShowPlanningModal(true)}>
              <Plus size={14} /> Ajouter une plage
            </Button>
          )}
        </div>
      }
    >
      {/* ===================================================================== */}
      {/* MODE "COURS" : affichage de l'emploi du temps scolaire                */}
      {/* ===================================================================== */}
      {edtMode === "cours" && (
      <>

      {ajout && (
        <Card className="mb-6 border-2 border-emerald-300 bg-emerald-50/30 shadow-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#009E60]" />
              <h3 className="font-bold text-sm" style={{ color: INK }}>
                {editingId ? "Modifier le créneau" : "Ajouter un créneau horaire"}
              </h3>
            </div>
            <button
              onClick={() => { setAjout(false); setEditingId(null); }}
              className="text-stone-400 hover:text-stone-700 p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Raccourcis horaires rapides */}
          <div className="mb-3">
            <span className="block text-[11px] font-semibold text-stone-500 mb-1">
              Raccourcis horaires fréquents :
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {CRENEAU_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setForm({ ...form, debut: p.debut, fin: p.fin })}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                    form.debut === p.debut && form.fin === p.fin
                      ? "bg-[#009E60] text-white border-[#009E60]"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Choix Matière */}
              <div>
                <Field label="Matière associée">
                  <select
                    style={inputStyle}
                    value={form.matiereId}
                    onChange={(e) => {
                      const m = data.matieres.find((x) => x.id === e.target.value);
                      setForm({
                        ...form,
                        matiereId: e.target.value,
                        label: m ? m.nom : form.label,
                      });
                    }}
                  >
                    <option value="">— Activité libre / Autre —</option>
                    {data.matieres.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Intitulé du cours */}
              <div className="sm:col-span-2">
                <Field label="Intitulé affiché sur l'emploi du temps">
                  <input
                    style={inputStyle}
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="ex. Mathématiques, TP Chimie, Philosophie..."
                    autoFocus
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Jour */}
              <div>
                <Field label="Jour">
                  <select
                    style={inputStyle}
                    value={form.jour}
                    onChange={(e) => setForm({ ...form, jour: e.target.value })}
                  >
                    {JOURS.map((j) => (
                      <option key={j}>{j}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Heure de début */}
              <div>
                <Field label="Heure de début">
                  <input
                    type="time"
                    style={inputStyle}
                    value={form.debut}
                    onChange={(e) => setForm({ ...form, debut: e.target.value })}
                    required
                  />
                </Field>
              </div>

              {/* Heure de fin */}
              <div>
                <Field label="Heure de fin">
                  <input
                    type="time"
                    style={inputStyle}
                    value={form.fin}
                    onChange={(e) => setForm({ ...form, fin: e.target.value })}
                    required
                  />
                </Field>
              </div>

              {/* Durée calculée */}
              <div className="flex flex-col justify-end mb-2.5">
                <div className="text-xs text-stone-500 font-medium mb-1">Durée du cours :</div>
                <div className="px-3 py-2 bg-emerald-100/70 text-emerald-900 font-bold rounded-lg text-sm flex items-center gap-1.5 border border-emerald-200">
                  <Clock size={14} className="text-emerald-700" />
                  <span>{calcDuree(form.debut, form.fin) || "—"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Salle */}
              <div>
                <Field label="Salle de classe (opt.)">
                  <input
                    style={inputStyle}
                    value={form.salle}
                    onChange={(e) => setForm({ ...form, salle: e.target.value })}
                    placeholder="ex. Salle 204, Labo 2"
                  />
                </Field>
              </div>

              {/* Professeur */}
              <div>
                <Field label="Professeur (opt.)">
                  <input
                    style={inputStyle}
                    value={form.professeur}
                    onChange={(e) => setForm({ ...form, professeur: e.target.value })}
                    placeholder="ex. M. Mba, Mme Ondo"
                  />
                </Field>
              </div>

              {/* Type */}
              <div>
                <Field label="Type d'activité">
                  <select
                    style={inputStyle}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="cours">Cours obligatoire</option>
                    <option value="revision">Révision / Étude libre</option>
                    <option value="tp">Travaux Pratiques (TP)</option>
                    <option value="sport">EPS / Activité sportive</option>
                  </select>
                </Field>
              </div>

              {/* Semaine A/B */}
              <div>
                <Field label="Périodicité">
                  <select
                    style={inputStyle}
                    value={form.semaine}
                    onChange={(e) => setForm({ ...form, semaine: e.target.value })}
                  >
                    <option value="toutes">Toutes les semaines</option>
                    <option value="A">Semaine A uniquement</option>
                    <option value="B">Semaine B uniquement</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="submit" variant="primary">
                <Check size={14} /> {editingId ? "Mettre à jour" : "Ajouter à l'emploi du temps"}
              </Button>
              <Button variant="ghost" onClick={() => { setAjout(false); setEditingId(null); }}>
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Barre d'onglets de jours (navigation rapide) */}
      <div className="flex gap-2 overflow-x-auto pb-2.5 mb-4">
        {JOURS.map((j) => {
          const count = creneauxFiltres.filter((c) => c.jour === j).length;
          const isAuj = j === todayJourFR();
          const actif = jourActif === j;
          return (
            <button
              key={j}
              onClick={() => setJourActif(j)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 border shadow-2xs ${
                actif
                  ? "bg-[#1A3248] text-white border-[#1A3248] shadow-sm"
                  : isAuj
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <span>{j}</span>
              {isAuj && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Aujourd'hui" />
              )}
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    actif ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* VUE 1 : VUE SEMAINE COMPLÈTE (6 COLONNES ÉLÉGANTES SUR GRAND ÉCRAN)    */}
      {/* ===================================================================== */}
      {vueMode === "semaine" && (
        <>
          {/* Vue Grille desktop */}
          <div className="hidden md:grid gap-3.5" style={{ gridTemplateColumns: "repeat(6, minmax(0,1fr))" }}>
            {JOURS.map((jour) => {
              const list = creneauxFiltres
                .filter((c) => c.jour === jour)
                .sort((a, b) => a.debut.localeCompare(b.debut));
              const isAuj = jour === todayJourFR();

              return (
                <div
                  key={jour}
                  className={`flex flex-col rounded-2xl p-2.5 transition-all ${
                    isAuj ? "bg-emerald-50/50 ring-2 ring-emerald-400/40" : "bg-white/60"
                  }`}
                  style={{ border: `1px solid ${PAPER_LINE}` }}
                >
                  {/* En-tête de colonne */}
                  <div
                    className={`py-2 px-2.5 rounded-xl text-center mb-2.5 font-black text-xs flex items-center justify-between ${
                      isAuj
                        ? "bg-[#009E60] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    <span>{jour}</span>
                    <span className="text-[10px] opacity-80">{list.length}</span>
                  </div>

                  {/* Cartes de cours de la journée */}
                  <div className="space-y-2.5 flex-1">
                    {list.length === 0 ? (
                      <div className="text-[11px] text-center py-6 text-stone-300 italic">
                        Aucun cours
                      </div>
                    ) : (
                      list.map((c) => {
                        const color = c.matiereId
                          ? couleurMatiere(data, c.matiereId)
                          : (c.type === "revision" ? GABON_VERT : INK);
                        const enCours = isEnCours(c.jour, c.debut, c.fin);

                        return (
                          <div
                            key={c.id}
                            className={`rounded-xl p-2.5 bg-white transition-all hover:shadow-md relative group border-l-4 ${
                              enCours ? "ring-2 ring-emerald-500 shadow-md" : "shadow-2xs"
                            }`}
                            style={{
                              borderLeftColor: color,
                              borderTop: `1px solid ${PAPER_LINE}`,
                              borderRight: `1px solid ${PAPER_LINE}`,
                              borderBottom: `1px solid ${PAPER_LINE}`,
                            }}
                          >
                            {/* Badge cours actif maintenant */}
                            {enCours && (
                              <div className="mb-1.5 inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                                <span>En cours</span>
                              </div>
                            )}

                            {/* Horaires très clairs : Début et Fin */}
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1 text-stone-700 bg-stone-50 px-1.5 py-0.5 rounded">
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-[#3A75C4]" />
                                {c.debut} ➔ {c.fin}
                              </span>
                              <span className="text-[9px] text-stone-400 font-normal">
                                {calcDuree(c.debut, c.fin)}
                              </span>
                            </div>

                            {/* Nom de la matière */}
                            <div
                              className="text-xs font-bold leading-snug line-clamp-2"
                              style={{ color: INK }}
                              title={c.label}
                            >
                              {c.label}
                            </div>

                            {/* Professeur et Salle */}
                            {(c.salle || c.professeur) && (
                              <div className="text-[10px] text-stone-500 mt-1.5 space-y-0.5">
                                {c.salle && (
                                  <div className="flex items-center gap-1 truncate" title={`Salle ${c.salle}`}>
                                    <MapPin size={9} className="shrink-0 text-stone-400" />
                                    <span>Salle {c.salle}</span>
                                  </div>
                                )}
                                {c.professeur && (
                                  <div className="flex items-center gap-1 truncate text-stone-600 font-medium" title={c.professeur}>
                                    <User size={9} className="shrink-0 text-stone-400" />
                                    <span>{c.professeur}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Semaine A / B badge */}
                            {c.semaine && c.semaine !== "toutes" && (
                              <div className="mt-1.5">
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold">
                                  Sem. {c.semaine}
                                </span>
                              </div>
                            )}

                            {/* Actions Modifier / Supprimer au survol */}
                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/95 rounded-md p-0.5 shadow-xs">
                              <button
                                onClick={() => ouvrirEdition(c)}
                                className="p-1 hover:text-blue-600 text-stone-400"
                                title="Modifier"
                              >
                                <Edit3 size={11} />
                              </button>
                              <button
                                onClick={() => update((d) => { d.creneaux = d.creneaux.filter((x) => x.id !== c.id); })}
                                className="p-1 hover:text-red-600 text-stone-400"
                                title="Supprimer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fallback mobile automatique pour la vue semaine */}
          <div className="block md:hidden space-y-2.5">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
              Jour sélectionné : {jourActif}
            </div>
            {creneauxFiltres.filter((c) => c.jour === jourActif).length === 0 ? (
              <EmptyState text={`Aucun cours programmé le ${jourActif}.`} />
            ) : (
              creneauxFiltres
                .filter((c) => c.jour === jourActif)
                .sort((a, b) => a.debut.localeCompare(b.debut))
                .map((c) => {
                  const color = c.matiereId ? couleurMatiere(data, c.matiereId) : (c.type === "revision" ? GABON_VERT : INK);
                  const enCours = isEnCours(c.jour, c.debut, c.fin);
                  return (
                    <Card key={c.id} className="border-l-4 !p-3 shadow-xs" style={{ borderLeftColor: color }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 flex items-center gap-1">
                              <Clock size={11} className="text-[#3A75C4]" />
                              {c.debut} – {c.fin}
                              <span className="text-[10px] text-stone-400 font-normal">({calcDuree(c.debut, c.fin)})</span>
                            </span>
                            {enCours && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                En cours
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-bold" style={{ color: INK }}>{c.label}</div>
                          <div className="text-xs text-stone-500 mt-1 flex items-center gap-3">
                            {c.salle && <span>📍 Salle {c.salle}</span>}
                            {c.professeur && <span>👤 {c.professeur}</span>}
                            {c.semaine && c.semaine !== "toutes" && (
                              <span className="text-amber-800 bg-amber-100 px-1 rounded text-[10px]">Sem. {c.semaine}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => ouvrirEdition(c)} className="p-1.5 text-stone-400 hover:text-blue-600">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => update((d) => { d.creneaux = d.creneaux.filter((x) => x.id !== c.id); })} className="p-1.5 text-stone-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })
            )}
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* VUE 2 : VUE JOURNÉE DÉTAILLÉE (TIMELINE CHRONOLOGIQUE ÉLÉGANTE)        */}
      {/* ===================================================================== */}
      {vueMode === "jour" && (
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: INK }}>
                Planning complet du {jourActif}
              </h2>
              <p className="text-xs text-stone-500">
                {creneauxFiltres.filter((c) => c.jour === jourActif).length} créneau(x) programmé(s)
              </p>
            </div>
            <Button small variant="accent" onClick={ouvrirAjout}>
              <Plus size={13} /> Ajouter un cours ce jour
            </Button>
          </div>

          {creneauxFiltres.filter((c) => c.jour === jourActif).length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              text={`Aucun cours le ${jourActif}. Profitez-en pour réviser ou avancer vos devoirs !`}
            />
          ) : (
            <div className="relative pl-6 border-l-2 border-emerald-300 space-y-4 my-2">
              {creneauxFiltres
                .filter((c) => c.jour === jourActif)
                .sort((a, b) => a.debut.localeCompare(b.debut))
                .map((c) => {
                  const color = c.matiereId ? couleurMatiere(data, c.matiereId) : (c.type === "revision" ? GABON_VERT : INK);
                  const enCours = isEnCours(c.jour, c.debut, c.fin);

                  return (
                    <div key={c.id} className="relative group">
                      {/* Puce sur la ligne chronologique */}
                      <div
                        className="absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center"
                        style={{ background: color }}
                      />

                      <Card
                        className={`transition-all hover:shadow-md border-l-4 !p-4 ${
                          enCours ? "ring-2 ring-emerald-500 bg-emerald-50/20" : ""
                        }`}
                        style={{ borderLeftColor: color }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            {/* Badges d'heures */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 flex items-center gap-1.5 shadow-2xs">
                                <Clock size={12} className="text-[#3A75C4]" />
                                <strong>{c.debut}</strong> ➔ <strong>{c.fin}</strong>
                                <span className="text-[10px] text-stone-400 font-normal">({calcDuree(c.debut, c.fin)})</span>
                              </span>
                              {enCours && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                                  En cours actuellement
                                </span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                                {c.type === "revision" ? "Révision" : c.type === "tp" ? "TP" : "Cours"}
                              </span>
                            </div>

                            {/* Matière */}
                            <h3 className="text-base font-bold" style={{ color: INK }}>
                              {c.label}
                            </h3>

                            {/* Métadonnées */}
                            <div className="flex items-center gap-4 text-xs text-stone-500 pt-0.5 flex-wrap">
                              {c.salle && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} className="text-stone-400" />
                                  Salle {c.salle}
                                </span>
                              )}
                              {c.professeur && (
                                <span className="flex items-center gap-1 font-medium text-stone-700">
                                  <User size={12} className="text-stone-400" />
                                  Prof. {c.professeur}
                                </span>
                              )}
                              {c.semaine && c.semaine !== "toutes" && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                                  Semaine {c.semaine}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Boutons d'action */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button small variant="ghost" onClick={() => ouvrirEdition(c)}>
                              <Edit3 size={13} />
                            </Button>
                            <button
                              onClick={() => update((d) => { d.creneaux = d.creneaux.filter((x) => x.id !== c.id); })}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Supprimer ce cours"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* MODE PLANNING */}
      {edtMode === "planning" && (
        <PlanningPerso
          data={data}
          update={update}
          jourActif={jourActif}
          setJourActif={setJourActif}
          showModal={showPlanningModal}
          setShowModal={setShowPlanningModal}
        />
      )}
    </Page>
  );
}

// ---------------------------------------------------------------------------
// 3b. Programme de Travail Personnel & Révisions Hors-Cours
// ---------------------------------------------------------------------------
const TYPES_PLANNING = [
  { id: "revision",  label: "Révision",         icon: "📚", couleur: GABON_BLEU,  bg: BLEU_SOFT },
  { id: "exercices", label: "Exercices",        icon: "✏️", couleur: GABON_VERT,  bg: VERT_SOFT },
  { id: "lecture",   label: "Lecture",          icon: "📖", couleur: BLEU_DARK,   bg: BLEU_SOFT },
  { id: "projet",    label: "Projet / Exposé",  icon: "🗂️", couleur: "#7C3AED",  bg: "#F5F3FF" },
  { id: "pause",     label: "Sport / Pause",    icon: "🏃", couleur: "#D97706",   bg: JAUNE_SOFT },
  { id: "autre",     label: "Autre activité",   icon: "⭐", couleur: JAUNE_DARK,  bg: JAUNE_SOFT },
];

const JOURS_PLANNING = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const MODELES_RAPIDES = [
  { titre: "Révision du soir", type: "revision", debut: "17:00", fin: "18:30", note: "Relire les cours de la journée" },
  { titre: "Exercices & Devoirs", type: "exercices", debut: "18:30", fin: "19:30", note: "Faire les devoirs prévus pour demain" },
  { titre: "Lecture libre", type: "lecture", debut: "20:30", fin: "21:15", note: "Lecture calme avant de dormir" },
  { titre: "Entraînement intensif", type: "exercices", debut: "16:00", fin: "17:30", note: "Refaire les exercices difficiles" },
];

function PlanningPerso({ data, update, jourActif, setJourActif, showModal, setShowModal }) {
  const planning = data.planningPerso || [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Synchronisation avec le bouton d'action du header
  useEffect(() => {
    if (showModal) {
      ouvrirAjout(jourActif);
      setShowModal(false);
    }
  }, [showModal]);

  const [form, setForm] = useState({
    jour: jourActif || "Lundi",
    debut: "17:00",
    fin: "18:30",
    titre: "",
    type: "revision",
    note: "",
    fait: false,
  });

  function calcDuree(debut, fin) {
    if (!debut || !fin) return "";
    const [hD, mD] = (debut || "00:00").split(":").map(Number);
    const [hF, mF] = (fin || "00:00").split(":").map(Number);
    let diff = (hF * 60 + mF) - (hD * 60 + mD);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}min`;
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h00`;
  }

  function ouvrirAjout(jourChoisi) {
    setEditingId(null);
    setForm({
      jour: jourChoisi || jourActif || "Lundi",
      debut: "17:00",
      fin: "18:30",
      titre: "",
      type: "revision",
      note: "",
      fait: false,
    });
    setShowForm(true);
  }

  function ouvrirEdition(p) {
    setEditingId(p.id);
    setForm({
      jour: p.jour || "Lundi",
      debut: p.debut || "17:00",
      fin: p.fin || "18:30",
      titre: p.titre || "",
      type: p.type || "revision",
      note: p.note || "",
      fait: p.fait || false,
    });
    setShowForm(true);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.titre.trim()) return;
    update((d) => {
      if (!d.planningPerso) d.planningPerso = [];
      if (editingId) {
        const idx = d.planningPerso.findIndex((x) => x.id === editingId);
        if (idx >= 0) d.planningPerso[idx] = { id: editingId, ...form };
      } else {
        d.planningPerso.push({ id: uid(), ...form });
      }
    });
    setShowForm(false);
    setEditingId(null);
  }

  function ajouterModele(modele) {
    update((d) => {
      if (!d.planningPerso) d.planningPerso = [];
      d.planningPerso.push({
        id: uid(),
        jour: jourActif,
        debut: modele.debut,
        fin: modele.fin,
        titre: modele.titre,
        type: modele.type,
        note: modele.note,
        fait: false,
      });
    });
  }

  function toggleFait(id) {
    update((d) => {
      if (!d.planningPerso) d.planningPerso = [];
      const item = d.planningPerso.find((x) => x.id === id);
      if (item) item.fait = !item.fait;
    });
  }

  function supprimer(id) {
    update((d) => {
      if (!d.planningPerso) d.planningPerso = [];
      d.planningPerso = d.planningPerso.filter((x) => x.id !== id);
    });
  }

  const planningDuJour = planning
    .filter((p) => p.jour === jourActif)
    .sort((a, b) => (a.debut || "").localeCompare(b.debut || ""));

  const totalMinDuJour = planningDuJour.reduce((acc, p) => {
    const [hD, mD] = (p.debut || "00:00").split(":").map(Number);
    const [hF, mF] = (p.fin || "00:00").split(":").map(Number);
    let diff = (hF * 60 + mF) - (hD * 60 + mD);
    if (diff < 0) diff = 0;
    return acc + diff;
  }, 0);
  const totalH = Math.floor(totalMinDuJour / 60);
  const totalM = totalMinDuJour % 60;

  return (
    <div className="space-y-6">
      {/* ── Bandeau Explicatif & Pédagogique ── */}
      <div
        className="p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-2xs"
        style={{ background: "linear-gradient(135deg, rgba(0, 158, 96, 0.08) 0%, rgba(58, 117, 196, 0.08) 100%)", border: `1px solid ${GABON_VERT}30` }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs" style={{ background: GABON_VERT, color: "#fff" }}>
          <BookMarked size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-bold" style={{ color: VERT_DARK }}>
              Mon Programme de Révisions & Travail Personnel
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              🇬🇦 Suivi autonome
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Organise tes créneaux de travail en dehors des cours : révisions, exercices, lecture et devoirs.
            L'application surveille ton planning et t'envoie un <strong>rappel sonore et une notification 5 minutes avant</strong> chaque session pour t'aider à rester régulier !
          </p>
        </div>
      </div>

      {/* ── Suggestions rapides en 1 clic ── */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-2">
          <Lightbulb size={14} className="text-amber-500" />
          <span>Suggestions rapides pour {jourActif} (1 clic pour ajouter) :</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {MODELES_RAPIDES.map((m) => {
            const tInfo = TYPES_PLANNING.find((t) => t.id === m.type) || TYPES_PLANNING[0];
            return (
              <button
                key={m.titre}
                type="button"
                onClick={() => ajouterModele(m)}
                className="text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all hover:scale-102 flex items-center gap-1.5 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-stone-700"
              >
                <span>{tInfo.icon}</span>
                <span>{m.titre}</span>
                <span className="text-[10px] text-stone-400 font-mono">({m.debut}–{m.fin})</span>
                <Plus size={12} className="text-emerald-600" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sélecteur des jours (7 jours de la semaine) ── */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {JOURS_PLANNING.map((j) => {
          const totalJ = planning.filter((p) => p.jour === j).length;
          const faitsJ = planning.filter((p) => p.jour === j && p.fait).length;
          const isAuj = j === todayJourFR();
          const actif = jourActif === j;
          return (
            <button
              key={j}
              onClick={() => setJourActif(j)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 border shadow-2xs ${
                actif
                  ? "text-white shadow-sm"
                  : isAuj
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
              style={actif ? { background: GABON_VERT, borderColor: GABON_VERT } : {}}
            >
              <span>{j}</span>
              {isAuj && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" title="Aujourd'hui" />}
              {totalJ > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    actif ? "bg-white/25 text-white" : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {faitsJ}/{totalJ}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── En-tête de la journée active & Actions ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold" style={{ color: INK }}>
            Planning de travail du {jourActif}
          </h3>
          <p className="text-xs text-stone-500">
            {planningDuJour.length === 0 ? (
              "Aucune session programmée"
            ) : (
              <>
                {planningDuJour.length} session{planningDuJour.length > 1 ? "s" : ""} · Total :{" "}
                <strong className="text-emerald-700 font-bold">
                  {totalH}h{totalM > 0 ? totalM.toString().padStart(2, "0") : "00"}
                </strong>{" "}
                de travail personnel prévu
              </>
            )}
          </p>
        </div>

        <Button variant="accent" onClick={() => ouvrirAjout(jourActif)}>
          <Plus size={14} /> Ajouter une plage
        </Button>
      </div>

      {/* ── Formulaire d'ajout / modification ── */}
      {showForm && (
        <Card className="border-2 shadow-md" style={{ borderColor: GABON_VERT, background: VERT_SOFT + "35" }}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: GABON_VERT + "30" }}>
            <div className="flex items-center gap-2">
              <Clock size={18} style={{ color: GABON_VERT }} />
              <h3 className="font-bold text-sm" style={{ color: INK }}>
                {editingId ? "Modifier la plage de travail" : `Nouvelle plage de travail pour le ${form.jour}`}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="text-stone-400 hover:text-stone-700 p-1"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Field label="Intitulé de la session *">
                  <input
                    style={inputStyle}
                    value={form.titre}
                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    placeholder="Ex : Révision Philosophie, Exercices SVT, Fiches Anglais..."
                    autoFocus
                    required
                  />
                </Field>
              </div>

              <div>
                <Field label="Type d'activité">
                  <select
                    style={inputStyle}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {TYPES_PLANNING.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Field label="Jour">
                  <select
                    style={inputStyle}
                    value={form.jour}
                    onChange={(e) => setForm({ ...form, jour: e.target.value })}
                  >
                    {JOURS_PLANNING.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div>
                <Field label="Heure de début">
                  <input
                    type="time"
                    style={inputStyle}
                    value={form.debut}
                    onChange={(e) => setForm({ ...form, debut: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <div>
                <Field label="Heure de fin">
                  <input
                    type="time"
                    style={inputStyle}
                    value={form.fin}
                    onChange={(e) => setForm({ ...form, fin: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <div className="flex flex-col justify-end mb-2.5">
                <div className="text-xs text-stone-500 font-medium mb-1">Durée :</div>
                <div className="px-3 py-2 bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200">
                  <Clock size={13} className="text-emerald-700" />
                  <span>{calcDuree(form.debut, form.fin) || "—"}</span>
                </div>
              </div>
            </div>

            <div>
              <Field label="Consignes, chapitres ou objectifs spécifiques (optionnel)">
                <textarea
                  style={{ ...inputStyle, minHeight: 65, resize: "vertical" }}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Ex : Relire pages 30 à 45, apprendre par cœur les définitions du cours..."
                />
              </Field>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" variant="accent">
                <Check size={14} /> {editingId ? "Mettre à jour" : "Enregistrer la session"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Liste des sessions du jour ── */}
      {planningDuJour.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-dashed border-stone-300 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-stone-100 text-stone-400">
            <BookMarked size={24} />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-stone-800 mb-1">
              Aucune plage de travail pour le {jourActif}
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Choisis l'un des modèles rapides ci-dessus ou clique ci-dessous pour planifier ta première séance d'étude.
            </p>
            <Button variant="accent" small onClick={() => ouvrirAjout(jourActif)}>
              <Plus size={13} /> Créer une plage pour {jourActif}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {planningDuJour.map((p) => {
            const tInfo = TYPES_PLANNING.find((t) => t.id === p.type) || TYPES_PLANNING[0];
            return (
              <Card
                key={p.id}
                className={`border-l-4 transition-all ${
                  p.fait ? "bg-stone-50/80 opacity-70" : "bg-white hover:shadow-md"
                }`}
                style={{ borderLeftColor: tInfo.couleur }}
              >
                <div className="flex items-start gap-3.5">
                  {/* Case à cocher fait/pas fait */}
                  <button
                    type="button"
                    onClick={() => toggleFait(p.id)}
                    className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      p.fait
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-stone-300 hover:border-emerald-500 bg-white"
                    }`}
                    title={p.fait ? "Marquer comme à faire" : "Marquer comme terminé"}
                  >
                    {p.fait && <Check size={14} strokeWidth={3} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm">{tInfo.icon}</span>
                      <h4
                        className={`text-sm font-bold ${p.fait ? "line-through text-stone-400" : "text-stone-900"}`}
                      >
                        {p.titre}
                      </h4>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: tInfo.bg, color: tInfo.couleur }}
                      >
                        {tInfo.label}
                      </span>
                      {p.fait && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          ✓ Terminé
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-600 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-semibold bg-stone-100 px-2 py-0.5 rounded-md">
                        <Clock size={11} className="text-blue-600" />
                        {p.debut} ➔ {p.fin}
                        <span className="text-stone-400 font-normal">({calcDuree(p.debut, p.fin)})</span>
                      </span>
                    </div>

                    {p.note && (
                      <p className="text-xs text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-stone-200/60 mt-1">
                        📝 {p.note}
                      </p>
                    )}
                  </div>

                  {/* Actions Modifier / Supprimer */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => ouvrirEdition(p)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-stone-100 transition-colors"
                      title="Modifier"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => supprimer(p.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Aperçu global de la semaine ── */}
      {planning.length > 0 && (
        <div className="pt-4 border-t border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-emerald-600" />
              <span>Aperçu de toute la semaine</span>
            </h4>
            <span className="text-xs text-stone-400">
              {planning.length} session{planning.length > 1 ? "s" : ""} au total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {JOURS_PLANNING.map((j) => {
              const sessionsJ = planning.filter((p) => p.jour === j).sort((a, b) => (a.debut || "").localeCompare(b.debut || ""));
              const isSelected = j === jourActif;
              const isToday = j === todayJourFR();

              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => setJourActif(j)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-300"
                      : "bg-white border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[11px] font-bold ${isToday ? "text-emerald-700 font-black" : "text-stone-800"}`}>
                      {j.slice(0, 3)}
                    </span>
                    {sessionsJ.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700">
                        {sessionsJ.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {sessionsJ.length === 0 ? (
                      <div className="text-[10px] text-stone-300 italic">—</div>
                    ) : (
                      sessionsJ.map((s) => {
                        const tI = TYPES_PLANNING.find((t) => t.id === s.type) || TYPES_PLANNING[0];
                        return (
                          <div
                            key={s.id}
                            className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${
                              s.fait ? "line-through opacity-50 bg-stone-100 text-stone-500" : "bg-emerald-100/60 text-emerald-900"
                            }`}
                            title={`${s.titre} (${s.debut}-${s.fin})`}
                          >
                            {tI.icon} {s.titre}
                          </div>
                        );
                      })
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Onglet Devoirs avec filtres, recherche et édition
// ---------------------------------------------------------------------------
function Devoirs({ data, update }) {
  const [ajout, setAjout] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("afaire"); // "tous" | "afaire" | "faits" | "retard"
  const [filtreMatiere, setFiltreMatiere] = useState("");
  const [recherche, setRecherche] = useState("");
  const [viewerCopieDevoir, setViewerCopieDevoir] = useState(null);
  const [loadingPhotoDevoir, setLoadingPhotoDevoir] = useState(false);
  const cameraDevoirRef = useRef(null);

  const [form, setForm] = useState({
    matiereId: "",
    titre: "",
    date: "",
    type: "devoir",
    rappel: "J-1",
    priorite: "normale",
    copies: [],
  });

  async function handleCaptureCopiesDevoir(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setLoadingPhotoDevoir(true);
    try {
      const nouvellesPages = [];
      for (const file of files) {
        const compressedBase64 = await compresserPhotoCopie(file);
        nouvellesPages.push({
          id: uid(),
          url: compressedBase64,
          date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
        });
      }
      setForm((f) => ({ ...f, copies: [...(f.copies || []), ...nouvellesPages] }));
    } catch (err) {
      alert("Erreur lors de la capture de la feuille.");
    } finally {
      setLoadingPhotoDevoir(false);
      e.target.value = "";
    }
  }

  function supprimerPageCopieDevoir(id) {
    setForm((f) => ({ ...f, copies: (f.copies || []).filter((p) => p.id !== id) }));
  }

  function startEdit(devoir) {
    setEditingId(devoir.id);
    setForm({
      matiereId: devoir.matiereId || "",
      titre: devoir.titre || "",
      date: devoir.date || "",
      type: devoir.type || "devoir",
      rappel: devoir.rappel || "J-1",
      priorite: devoir.priorite || "normale",
      copies: devoir.copies || [],
    });
    setAjout(true);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.titre.trim() || !form.date) return;

    if (editingId) {
      update((d) => {
        const item = d.devoirs.find((x) => x.id === editingId);
        if (item) Object.assign(item, form);
      });
      setEditingId(null);
    } else {
      update((d) => d.devoirs.push({ id: uid(), ...form, fait: false }));
    }

    setForm({ matiereId: "", titre: "", date: "", type: "devoir", rappel: "J-1", priorite: "normale", copies: [] });
    setAjout(false);
  }

  // Filtrage des devoirs
  const devoirsFiltres = useMemo(() => {
    return data.devoirs
      .filter((d) => {
        if (filtreMatiere && d.matiereId !== filtreMatiere) return false;
        if (recherche && !d.titre.toLowerCase().includes(recherche.toLowerCase())) return false;
        const jr = joursRestants(d.date);
        if (filtreStatut === "afaire") return !d.fait;
        if (filtreStatut === "faits") return d.fait;
        if (filtreStatut === "retard") return !d.fait && jr < 0;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.devoirs, filtreStatut, filtreMatiere, recherche]);

  const stats = {
    total: data.devoirs.length,
    afaire: data.devoirs.filter((d) => !d.fait).length,
    faits: data.devoirs.filter((d) => d.fait).length,
    retard: data.devoirs.filter((d) => !d.fait && joursRestants(d.date) < 0).length,
  };

  return (
    <Page
      title="Devoirs & Travaux"
      subtitle={`${stats.afaire} en attente${stats.retard > 0 ? ` · ${stats.retard} en retard` : ""}`}
      color={GREEN}
      icon={ListChecks}
      action={
        <Button
          variant="accent"
          onClick={() => {
            setEditingId(null);
            setForm({ matiereId: "", titre: "", date: "", type: "devoir", rappel: "J-1", priorite: "normale", copies: [] });
            setAjout((v) => !v);
          }}
        >
          <Plus size={14} /> Devoir
        </Button>
      }
    >
      {/* Visionneuse si ouverte depuis un devoir */}
      {viewerCopieDevoir && (
        <VisionneuseCopie
          note={viewerCopieDevoir.note}
          initialIndex={viewerCopieDevoir.copieIdx || 0}
          onClose={() => setViewerCopieDevoir(null)}
          update={update}
        />
      )}

      {/* Formulaire ajout / modification */}
      {ajout && (
        <Card className="mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
            <h3 className="font-bold text-sm" style={{ color: INK }}>
              {editingId ? "Modifier le devoir" : "Ajouter un nouveau devoir"}
            </h3>
            <button onClick={() => setAjout(false)} className="text-stone-400 hover:text-stone-600">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div style={{ minWidth: 160 }} className="flex-1">
                <Field label="Intitulé du devoir">
                  <input
                    style={inputStyle}
                    value={form.titre}
                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    placeholder="ex. Exercices p.142 n°3 et 4"
                    autoFocus
                  />
                </Field>
              </div>

              <div style={{ width: 160 }}>
                <Field label="Matière">
                  <select
                    style={inputStyle}
                    value={form.matiereId}
                    onChange={(e) => setForm({ ...form, matiereId: e.target.value })}
                  >
                    <option value="">— Choisir —</option>
                    {data.matieres.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div style={{ width: 140 }}>
                <Field label="Échéance">
                  <input
                    type="date"
                    style={inputStyle}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ width: 130 }}>
                <Field label="Type">
                  <select
                    style={inputStyle}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="devoir">Devoir maison</option>
                    <option value="interro">Interro / Contrôle</option>
                    <option value="compo">Composition / Bac blanc</option>
                    <option value="revision">Révisions</option>
                  </select>
                </Field>
              </div>

              <div style={{ width: 130 }}>
                <Field label="Priorité">
                  <select
                    style={inputStyle}
                    value={form.priorite}
                    onChange={(e) => setForm({ ...form, priorite: e.target.value })}
                  >
                    <option value="normale">Normale</option>
                    <option value="haute">⭐ Urgent / Important</option>
                  </select>
                </Field>
              </div>

              <div style={{ width: 130 }}>
                <Field label="Rappel">
                  <select
                    style={inputStyle}
                    value={form.rappel}
                    onChange={(e) => setForm({ ...form, rappel: e.target.value })}
                  >
                    <option value="J-1">La veille</option>
                    <option value="H-3">Le jour même</option>
                    <option value="aucun">Aucun</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Section Filmer / Joindre la feuille d'exercice ou sujet */}
            <div className="pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Camera size={14} className="text-[#009E60]" />
                  Feuille de devoir / Sujet physique numérisé
                </span>
                <Button
                  small
                  variant="ghost"
                  onClick={() => cameraDevoirRef.current?.click()}
                  disabled={loadingPhotoDevoir}
                >
                  {loadingPhotoDevoir ? <RefreshCw size={12} className="animate-spin" /> : <Camera size={12} />}
                  <span>{form.copies?.length > 0 ? "+ Ajouter page" : "Photographier la feuille"}</span>
                </Button>
                <input
                  type="file"
                  ref={cameraDevoirRef}
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={handleCaptureCopiesDevoir}
                />
              </div>

              {form.copies && form.copies.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1">
                  {form.copies.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="relative group shrink-0 rounded-xl overflow-hidden border border-stone-300 shadow-2xs w-20 h-28 bg-stone-200 flex flex-col"
                    >
                      <img src={c.url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Page {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => supprimerPageCopieDevoir(c.id)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer cette page"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-stone-400 italic">
                  Aucune photo jointe. Prends en photo le sujet pour ne jamais le perdre !
                </p>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="submit" variant="accent">
                {editingId ? "Enregistrer" : "Ajouter"}
              </Button>
              <Button variant="ghost" onClick={() => setAjout(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Barre de recherche et filtres */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {/* Onglets de statut */}
        <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-medium">
          {[
            { id: "afaire", label: `À faire (${stats.afaire})` },
            { id: "tous", label: `Tous (${stats.total})` },
            { id: "faits", label: `Faits (${stats.faits})` },
            { id: "retard", label: `En retard (${stats.retard})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltreStatut(f.id)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filtreStatut === f.id ? "bg-[#1F2A44] text-white font-semibold" : "text-stone-600 hover:text-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtre matière et recherche */}
        <div className="flex items-center gap-2 flex-1 sm:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
            <input
              style={{ ...inputStyle, paddingLeft: 28 }}
              placeholder="Rechercher un devoir..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <select
            style={{ ...inputStyle, width: "auto" }}
            value={filtreMatiere}
            onChange={(e) => setFiltreMatiere(e.target.value)}
          >
            <option value="">Toutes les matières</option>
            {data.matieres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des devoirs */}
      {devoirsFiltres.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          text={
            recherche || filtreMatiere
              ? "Aucun devoir ne correspond à vos filtres."
              : "Aucun devoir enregistré. Tout est accompli !"
          }
        />
      ) : (
        <div className="space-y-2.5">
          {devoirsFiltres.map((d) => {
            const jr = joursRestants(d.date);
            const retard = jr < 0 && !d.fait;
            const matColor = couleurMatiere(data, d.matiereId);

            return (
              <Card
                key={d.id}
                className="flex items-center justify-between !p-3.5 transition-all border-l-4"
                style={{
                  borderLeftColor: matColor,
                  opacity: d.fait ? 0.6 : 1,
                  background: d.fait ? "#FAFBFD" : CARD,
                }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      update((dt) => {
                        const item = dt.devoirs.find((x) => x.id === d.id);
                        if (item) item.fait = !item.fait;
                      })
                    }
                    className="flex items-center justify-center rounded-full shrink-0 transition-transform active:scale-90"
                    style={{
                      width: 24,
                      height: 24,
                      border: `1.5px solid ${d.fait ? GREEN : PAPER_LINE}`,
                      background: d.fait ? GREEN : "transparent",
                    }}
                    title={d.fait ? "Marquer non fait" : "Marquer comme fait"}
                  >
                    {d.fait && <Check size={14} color="#fff" />}
                  </button>

                  <div>
                    <div
                      className="text-sm font-semibold flex items-center gap-2"
                      style={{
                        color: INK,
                        textDecoration: d.fait ? "line-through" : "none",
                      }}
                    >
                      <span>{d.titre}</span>
                      {d.priorite === "haute" && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: retard ? RED : INK_SOFT }}>
                      <span className="font-semibold" style={{ color: matColor }}>
                        {nomMatiere(data, d.matiereId)}
                      </span>
                      <span>· {dateLabel(d.date)}</span>
                      {d.copies && d.copies.length > 0 && (
                        <button
                          onClick={() => setViewerCopieDevoir({
                            note: { label: d.titre, valeur: "Sujet/Copie", bareme: nomMatiere(data, d.matiereId), copies: d.copies },
                            copieIdx: 0,
                          })}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 transition-colors"
                          title="Voir la feuille ou copie enregistrée"
                        >
                          <Camera size={11} />
                          <span>{d.copies.length} p.</span>
                        </button>
                      )}
                      {retard && (
                        <span className="font-bold flex items-center gap-1">
                          <AlertTriangle size={12} /> en retard ({Math.abs(jr)} j)
                        </span>
                      )}
                      {!retard && !d.fait && jr === 0 && (
                        <span className="text-amber-600 font-bold">· Pour aujourd'hui</span>
                      )}
                      {!retard && !d.fait && jr === 1 && (
                        <span className="text-amber-700 font-semibold">· Pour demain</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(d)}
                    title="Modifier"
                    className="p-1.5 text-stone-400 hover:text-blue-600 rounded transition-colors"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() =>
                      update((dt) => {
                        dt.devoirs = dt.devoirs.filter((x) => x.id !== d.id);
                      })
                    }
                    title="Supprimer"
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------------------
// 5. Onglet Réglages (Assistance Développeur, Périodes, Matières, Reset)
// ---------------------------------------------------------------------------
function Reglages({ data, update }) {
  const [notification, setNotification] = useState("");
  const [afficherFormSupport, setAfficherFormSupport] = useState(false);
  const [supportSujet, setSupportSujet] = useState("Défaillance d'affichage");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportEnvoiEnCours, setSupportEnvoiEnCours] = useState(false);

  // État modale in-app pour ajouter une période (remplace window.prompt)
  const [modalAjoutPeriode, setModalAjoutPeriode] = useState(false);
  const [nomNouvellePeriode, setNomNouvellePeriode] = useState("");

  function showMsg(txt) {
    setNotification(txt);
    setTimeout(() => setNotification(""), 4000);
  }

  function chargerPreset(niveau) {
    update((d) => {
      d.settings.niveau = niveau;
      let ajouts = 0;
      PRESETS[niveau].forEach((item) => {
        if (!d.matieres.some((m) => m.nom.toLowerCase() === item.nom.toLowerCase())) {
          d.matieres.push({
            id: uid(),
            nom: item.nom,
            coefficient: 1,
            couleur: item.couleur,
          });
          ajouts++;
        }
      });
      if (ajouts > 0) {
        showMsg(`${ajouts} matières type ${niveau === "college" ? "Collège" : "Lycée"} ajoutées avec succès !`);
      } else {
        showMsg(`Toutes les matières type ${niveau === "college" ? "Collège" : "Lycée"} sont déjà présentes.`);
      }
    });
  }

  // Envoyer un signalement de défaillance au développeur
  async function envoyerSignalementSupport(e) {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportEnvoiEnCours(true);
    try {
      const diagnostic = {
        date: new Date().toISOString(),
        userAgent: navigator.userAgent,
        authEmail: data.auth?.email || "Non connecté",
        eleve: `${data.profil?.prenom || ""} ${data.profil?.nom || ""}`.trim(),
        classe: data.profil?.classe || "",
        totalNotes: data.notes?.length || 0,
        totalMatieres: data.matieres?.length || 0,
      };

      await sendSupportTicket({
        email: data.auth?.email || "",
        sujet: supportSujet,
        message: supportMessage.trim(),
        diagnostic,
      });

      setSupportMessage("");
      setAfficherFormSupport(false);
      showMsg("Signalement envoyé au développeur avec succès ! Merci pour ton retour.");
    } catch (err) {
      alert("Erreur lors de l'envoi du signalement : " + (err.message || "Erreur réseau"));
    } finally {
      setSupportEnvoiEnCours(false);
    }
  }

  // Enregistrer une nouvelle période depuis la modale in-app
  function validerAjoutPeriode(e) {
    e.preventDefault();
    const nom = nomNouvellePeriode.trim();
    if (!nom) return;
    update((d) => {
      if (!d.settings.periodes.includes(nom)) {
        d.settings.periodes.push(nom);
        d.settings.periodeActive = d.settings.periodes.length - 1;
      }
    });
    setNomNouvellePeriode("");
    setModalAjoutPeriode(false);
    showMsg(`Période "${nom}" ajoutée et activée !`);
  }

  return (
    <Page title="Réglages & Assistance" subtitle="Personnalise ton carnet et contacte le développeur" color={INK_SOFT} icon={Settings}>
      {notification && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <Check size={16} /> {notification}
        </div>
      )}

      {/* Assistance & Contact Développeur en cas de défaillance */}
      <Card className="mb-5 border-2 border-emerald-200/80 bg-emerald-50/20">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <LifeBuoy size={20} className="text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-900">
              Assistance & Contact Développeur
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Assistance disponible
          </span>
        </div>

        <p className="text-xs text-stone-600 mb-4 leading-relaxed">
          Une défaillance technique, un bug d'affichage ou un problème avec tes notes ? Contacte directement l'équipe de développement pour une assistance rapide.
        </p>

        <div className="flex gap-2.5 flex-wrap">
          <Button
            variant="primary"
            onClick={() => setAfficherFormSupport((v) => !v)}
            className="!bg-emerald-700 hover:!bg-emerald-800 text-white"
          >
            <Send size={14} /> {afficherFormSupport ? "Fermer le formulaire" : "Signaler une défaillance"}
          </Button>

          <a
            href="mailto:tristannkoghe7@gmail.com?subject=Signalement%20de%20d%C3%A9faillance%20Carnet%20Scolaire"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
          >
            <Mail size={14} className="text-blue-600" />
            <span>Contacter par e-mail</span>
          </a>

          <a
            href="https://wa.me/24174405439?text=Bonjour%20Tristan,%20j'utilise%20Carnet%20Scolaire%20et%20j'ai%20une%20question%20ou%20un%20probl%C3%A8me%20technique%20:"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-100/60 hover:bg-emerald-100 text-xs font-semibold transition-colors shadow-2xs"
          >
            <MessageSquare size={14} className="text-emerald-700" />
            <span>Support WhatsApp</span>
          </a>
        </div>

        {/* Formulaire de signalement de défaillance */}
        {afficherFormSupport && (
          <div className="mt-4 pt-4 border-t border-emerald-200">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              Signaler un bug ou une panne technique
            </h3>
            <form onSubmit={envoyerSignalementSupport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Type de défaillance
                </label>
                <select
                  value={supportSujet}
                  onChange={(e) => setSupportSujet(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-300 p-2 bg-white focus:outline-emerald-600"
                >
                  <option value="Défaillance d'affichage">Défaillance d'affichage / Interface</option>
                  <option value="Problème de synchronisation des notes">Problème de synchronisation des notes</option>
                  <option value="Erreur lors de l'enregistrement d'une copie">Erreur enregistrement / appareil photo copie</option>
                  <option value="Lenteur anormale">Lenteur anormale</option>
                  <option value="Autre suggestion ou bug">Autre suggestion ou bug</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description détaillée du problème
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explique ce qui s'est passé, sur quel écran, et ce qui ne marche pas..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-300 p-2.5 bg-white focus:outline-emerald-600 resize-none"
                />
              </div>

              <div className="text-[11px] text-stone-500 bg-white/70 p-2 rounded-lg border border-stone-200">
                ℹ️ Un diagnostic technique (navigateur, heure, état de la session) sera automatiquement transmis au développeur pour corriger la défaillance.
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setAfficherFormSupport(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="accent"
                  type="submit"
                  disabled={supportEnvoiEnCours}
                >
                  {supportEnvoiEnCours ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Transmission...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Envoyer le rapport au développeur
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Niveau & Presets de matières */}
      <Card className="mb-4">
        <div className="text-sm font-semibold mb-2" style={{ color: INK }}>
          Niveau scolaire & Matières préconfigurées
        </div>
        <p className="text-xs text-stone-500 mb-3">
          Configure automatiquement les matières officielles du Gabon pour ton carnet en un seul clic :
        </p>

        <div className="flex gap-2 mb-3 flex-wrap">
          <Button
            variant={data.settings.niveau === "college" ? "primary" : "ghost"}
            small
            onClick={() => chargerPreset("college")}
            className="!rounded-xl"
          >
            📚 Charger matières Collège
          </Button>
          <Button
            variant={data.settings.niveau === "lycee" ? "primary" : "ghost"}
            small
            onClick={() => chargerPreset("lycee")}
            className="!rounded-xl"
          >
            🎓 Charger matières Lycée
          </Button>
        </div>

        {/* Affichage visuel en direct des matières actuelles */}
        <div className="mt-3 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-800">
              Matières enregistrées dans ton carnet ({data.matieres.length}) :
            </span>
          </div>

          {data.matieres.length === 0 ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              ⚠️ Tu n'as pas encore de matières. Clique sur <strong>« Charger matières Collège »</strong> ou <strong>« Charger matières Lycée »</strong> ci-dessus pour les ajouter automatiquement !
            </div>
          ) : (
            <div className="flex gap-1.5 flex-wrap">
              {data.matieres.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border border-stone-200 bg-white shadow-2xs"
                  style={{ color: m.couleur }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: m.couleur }} />
                  {m.nom}
                  <span className="text-[10px] text-stone-400 font-normal">Coeff. {m.coefficient || 1}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Barème */}
      <Card className="mb-4">
        <div className="text-sm font-semibold mb-1" style={{ color: INK }}>
          Barème standard des notes
        </div>
        <p className="text-xs text-stone-500 mb-3">
          Note maximale utilisée par défaut lors de l'ajout d'une évaluation :
        </p>
        <div className="flex gap-2">
          {[20, 10].map((b) => (
            <Button
              key={b}
              variant={data.settings.bareme === b ? "accent" : "ghost"}
              small
              onClick={() => update((d) => { d.settings.bareme = b; })}
            >
              Notes sur {b} {data.settings.bareme === b && "✓"}
            </Button>
          ))}
        </div>
      </Card>

      {/* Périodes d'évaluation */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold" style={{ color: INK }}>
              Période active & Découpage de l'année
            </div>
            <p className="text-xs text-stone-500">
              Sélectionne la période en cours ou ajoute une nouvelle période (Semestre, Trimestre...) :
            </p>
          </div>
          <Button small variant="accent" onClick={() => setModalAjoutPeriode(true)} className="!bg-emerald-700 text-white">
            <Plus size={13} /> Ajouter une période
          </Button>
        </div>

        {/* Sélecteur de période active */}
        <div className="flex items-center gap-3 my-3">
          <button
            onClick={() =>
              update((d) => {
                d.settings.periodeActive =
                  (d.settings.periodeActive - 1 + d.settings.periodes.length) % d.settings.periodes.length;
              })
            }
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Période précédente"
          >
            <ChevronLeft size={18} color={INK} />
          </button>

          <div className="flex-1 text-center py-2 px-3 rounded-xl bg-stone-100 border border-stone-200">
            <span className="text-xs text-stone-500 block uppercase font-bold tracking-wider">
              Période sélectionnée
            </span>
            <span className="text-base font-bold text-stone-900">
              {data.settings.periodes[data.settings.periodeActive]}
            </span>
          </div>

          <button
            onClick={() =>
              update((d) => {
                d.settings.periodeActive =
                  (d.settings.periodeActive + 1) % d.settings.periodes.length;
              })
            }
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Période suivante"
          >
            <ChevronRight size={18} color={INK} />
          </button>
        </div>

        {/* Toutes les périodes sous forme de boutons directs */}
        <div className="flex gap-1.5 flex-wrap pt-2 border-t border-stone-100">
          <span className="text-[11px] text-stone-500 font-semibold self-center mr-1">Toutes :</span>
          {data.settings.periodes.map((p, idx) => {
            const active = data.settings.periodeActive === idx;
            return (
              <button
                key={p}
                onClick={() => update((d) => { d.settings.periodeActive = idx; })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {p} {active && "✓"}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Modale IN-APP pour ajouter une période (remplace le window.prompt natif) */}
      {modalAjoutPeriode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Calendar size={18} className="text-emerald-700" />
                Ajouter une période d'évaluation
              </h3>
              <button
                onClick={() => setModalAjoutPeriode(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={validerAjoutPeriode} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nom de la période *
                </label>
                <input
                  required
                  autoFocus
                  placeholder="Ex : Semestre 1, Trimestre 2, Examen Blanc..."
                  value={nomNouvellePeriode}
                  onChange={(e) => setNomNouvellePeriode(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-300 p-2.5 bg-stone-50 focus:bg-white focus:outline-emerald-600 font-medium"
                />
              </div>

              {/* Suggestions rapides en 1 clic */}
              <div>
                <span className="block text-[11px] font-semibold text-stone-500 mb-1.5">
                  Suggestions rapides :
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {["Semestre 1", "Semestre 2", "Trimestre 1", "Trimestre 2", "Trimestre 3", "Examen Blanc"].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setNomNouvellePeriode(sugg)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 border border-stone-200 transition-colors"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setModalAjoutPeriode(false)}>
                  Annuler
                </Button>
                <Button variant="accent" type="submit" disabled={!nomNouvellePeriode.trim()} className="!bg-emerald-700 text-white">
                  <Check size={14} /> Ajouter cette période
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Droits d'auteur & Mentions Légales */}
      <Card className="mb-4 border border-stone-200/80 bg-stone-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Droits d'Auteur & Mentions Légales
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
            v1.0
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
          <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
            <div className="font-bold text-stone-800 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5 flex-wrap">
              <span>© 2026 Carnet Scolaire</span>
              <span className="text-stone-300">·</span>
              <span className="text-emerald-700 font-bold">Tous droits réservés</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Application conçue et développée par <strong>Tristan NKOGHE</strong> spécialement pour les élèves, collégiens et lycéens de la République Gabonaise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <strong className="block text-stone-800 font-bold mb-0.5">⚖️ Propriété Intellectuelle</strong>
              <span>L'architecture logicielle, le design, le code source et la marque « Carnet Scolaire » sont protégés par les lois sur la propriété intellectuelle. Toute reproduction ou imitation est interdite.</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <strong className="block text-stone-800 font-bold mb-0.5">🔒 Confidentialité des Données</strong>
              <span>Les notes, devoirs, copies numérisées et informations d'identité demeurent strictement personnels, chiffrés et protégés sur la base de données sécurisée.</span>
            </div>
          </div>

          <div className="text-[10px] text-stone-400 text-center pt-1 border-t border-stone-200/60">
            Fait avec fierté au Gabon 🇬🇦 · République Gabonaise · Union — Travail — Justice
          </div>
        </div>
      </Card>

      {/* Réinitialisation */}
      <Card>
        <div className="text-sm font-semibold mb-1 text-red-700">Zone de danger</div>
        <p className="text-xs mb-3" style={{ color: INK_SOFT }}>
          Efface toutes les données locales du carnet (notes, devoirs, créneaux et matières).
        </p>
        <Button
          variant="danger"
          small
          onClick={() => {
            if (window.confirm("Êtes-vous sûr(e) de vouloir tout réinitialiser ?")) {
              update((d) => Object.assign(d, defaultData()));
              showMsg("Toutes les données ont été réinitialisées.");
            }
          }}
        >
          <Trash2 size={13} /> Réinitialiser entièrement le carnet
        </Button>
      </Card>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// 6. Espace Profil Eleve
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 6. Espace Profil Élève & Contrôle de l'Année Scolaire
// ---------------------------------------------------------------------------
function Profil({ data, update }) {
  const p = data.profil || {};

  // Formulaire d'identité
  const [form, setForm] = useState({
    prenom: p.prenom || "",
    nom: p.nom || "",
    etablissement: p.etablissement || "",
    classe: p.classe || "",
    anneeScolaire: p.anneeScolaire || "2025-2026",
    ville: p.ville || "",
    photo: p.photo || null,
    objectifs: p.objectifs || "",
    moyenneVisee: p.moyenneVisee || "",
    devise: p.devise || "",
  });

  useEffect(() => {
    const prof = data.profil || {};
    setForm((prev) => ({
      ...prev,
      prenom: prof.prenom || prev.prenom || "",
      nom: prof.nom || prev.nom || "",
      classe: prof.classe || prev.classe || "",
      etablissement: prof.etablissement || prev.etablissement || "",
      anneeScolaire: prof.anneeScolaire || prev.anneeScolaire || "2025-2026",
      ville: prof.ville || prev.ville || "",
      photo: prof.photo || prev.photo || null,
      objectifs: prof.objectifs || prev.objectifs || "",
      moyenneVisee: prof.moyenneVisee || prev.moyenneVisee || "",
      devise: prof.devise || prev.devise || "",
    }));
  }, [data.profil]);

  const [saved, setSaved] = useState(false);
  const photoRef = useRef(null);

  // Formulaire d'ajout de note de rappel / idée
  const [nouvelleNote, setNouvelleNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    titre: "",
    contenu: "",
    categorie: "rappel", // "rappel" | "objectif" | "idee" | "revision" | "projet"
    couleur: "#FEF08A",   // Jaune par défaut
    epingle: false,
  });

  // Filtre et recherche pour les notes
  const [filtreCat, setFiltreCat] = useState("toutes");
  const [rechercheNote, setRechercheNote] = useState("");

  const CATEGORIES_NOTES = [
    { id: "rappel",   label: "Rappel urgent",       icon: Bell,      badge: "bg-amber-100 text-amber-900 border-amber-300" },
    { id: "objectif", label: "Objectif & Défi",     icon: Target,    badge: "bg-emerald-100 text-emerald-900 border-emerald-300" },
    { id: "idee",     label: "Idée & Organisation", icon: Lightbulb, badge: "bg-blue-100 text-blue-900 border-blue-300" },
    { id: "revision", label: "Méthode & Révision",  icon: BookOpen,  badge: "bg-indigo-100 text-indigo-900 border-indigo-300" },
    { id: "projet",   label: "Orientation & Avenir",icon: Award,     badge: "bg-purple-100 text-purple-900 border-purple-300" },
  ];

  const COULEURS_POSTIT = [
    { label: "Jaune soleil", hex: "#FEF08A" },
    { label: "Vert menthe",  hex: "#BBF7D0" },
    { label: "Bleu ciel",    hex: "#BFDBFE" },
    { label: "Pêche",        hex: "#FED7AA" },
    { label: "Lilas",        hex: "#E9D5FF" },
  ];

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadRes = await uploadImage(file);
      if (uploadRes?.url) {
        setForm((f) => ({ ...f, photo: uploadRes.url }));
        return;
      }
    } catch (err) {}
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photo: ev.target.result }));
    reader.readAsDataURL(file);
  }

  function handleSaveProfil(e) {
    e.preventDefault();
    update((d) => {
      d.profil = {
        ...d.profil,
        ...form,
      };
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // Modification du mot de passe
  const [passAncien, setPassAncien] = useState("");
  const [passNouveau, setPassNouveau] = useState("");
  const [passConfirmer, setPassConfirmer] = useState("");
  const [passMsg, setPassMsg] = useState(null);

  async function handleChangerPass(e) {
    e.preventDefault();
    setPassMsg(null);

    if (!passAncien) {
      setPassMsg({ type: "error", text: "Veuillez entrer votre mot de passe actuel." });
      return;
    }
    if (!passNouveau || passNouveau.length < 4) {
      setPassMsg({ type: "error", text: "Le nouveau mot de passe doit comporter au moins 4 caractères." });
      return;
    }
    if (passNouveau !== passConfirmer) {
      setPassMsg({ type: "error", text: "La confirmation ne correspond pas au nouveau mot de passe." });
      return;
    }

    try {
      await changeUserPassword({ ancienPassword: passAncien, nouveauPassword: passNouveau });
      update((d) => {
        if (!d.auth) d.auth = defaultData().auth;
        d.auth.password = passNouveau;
        d.auth.isTempPassword = false;
        const email = d.auth.email;
        if (email && d.auth.comptesConnus?.[email]) {
          d.auth.comptesConnus[email].password = passNouveau;
          d.auth.comptesConnus[email].isTempPassword = false;
        }
      });

      setPassAncien("");
      setPassNouveau("");
      setPassConfirmer("");
      setPassMsg({ type: "success", text: "Votre mot de passe a été modifié avec succès sur le serveur !" });
    } catch (err) {
      setPassMsg({ type: "error", text: err.message || "Erreur lors de la modification du mot de passe." });
    }
  }

  function ajouterNote(e) {
    e.preventDefault();
    if (!noteForm.titre.trim()) return;
    const item = {
      id: uid(),
      titre: noteForm.titre.trim(),
      contenu: noteForm.contenu.trim(),
      categorie: noteForm.categorie,
      couleur: noteForm.couleur,
      epingle: Boolean(noteForm.epingle),
      fait: false,
      date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    };

    update((d) => {
      if (!d.profil.notesPerso) d.profil.notesPerso = [];
      d.profil.notesPerso.unshift(item);
    });

    setNoteForm({
      titre: "",
      contenu: "",
      categorie: "rappel",
      couleur: "#FEF08A",
      epingle: false,
    });
    setNouvelleNote(false);
  }

  function toggleFaitNote(id) {
    update((d) => {
      const n = d.profil.notesPerso?.find((x) => x.id === id);
      if (n) n.fait = !n.fait;
    });
  }

  function togglePinNote(id) {
    update((d) => {
      const n = d.profil.notesPerso?.find((x) => x.id === id);
      if (n) n.epingle = !n.epingle;
    });
  }

  function supprimerNote(id) {
    update((d) => {
      d.profil.notesPerso = (d.profil.notesPerso || []).filter((x) => x.id !== id);
    });
  }

  const initiales = [form.prenom?.[0] || "", form.nom?.[0] || ""].join("").toUpperCase();

  const notesFiltrees = (data.profil?.notesPerso || [])
    .filter((n) => {
      if (filtreCat === "epingles") return n.epingle;
      if (filtreCat !== "toutes" && n.categorie !== filtreCat) return false;
      if (rechercheNote.trim()) {
        const q = rechercheNote.toLowerCase();
        return n.titre.toLowerCase().includes(q) || (n.contenu || "").toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (a.epingle && !b.epingle) return -1;
      if (!a.epingle && b.epingle) return 1;
      if (a.fait && !b.fait) return 1;
      if (!a.fait && b.fait) return -1;
      return 0;
    });

  return (
    <Page
      title="Mon Profil"
      subtitle="Organise tes informations scolaires, tes objectifs et tes mémos"
      color={GABON_BLEU}
      icon={UserCircle}
    >
      {/* 1. Carte d'identité scolaire officielle avec bannière Gabon */}
      <div
        className="rounded-2xl p-5 mb-6 shadow-md relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(135deg, ${GABON_VERT} 0%, ${GABON_BLEU} 100%)`,
          minHeight: 140,
        }}
      >
        {/* Bandes tricolores drapeau */}
        <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 7 }}>
          <div style={{ flex: 1, background: GABON_VERT }} />
          <div style={{ flex: 1, background: GABON_JAUNE }} />
          <div style={{ flex: 1, background: GABON_BLEU }} />
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          {/* Avatar cliquable */}
          <div
            className="relative w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-2xl shrink-0 cursor-pointer group bg-white/20 border-2 border-white/40 overflow-hidden"
            onClick={() => photoRef.current?.click()}
            title="Cliquer pour changer de photo"
          >
            {form.photo ? (
              <img src={form.photo} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <span>{initiales || <User size={32} />}</span>
            )}
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={22} color="#fff" />
            </div>
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

          {/* Coordonnées */}
          <div className="flex-1 min-w-[200px]">
            <div className="text-2xl font-black leading-tight drop-shadow">
              {[form.prenom, form.nom].filter(Boolean).join(" ") || [p.prenom, p.nom].filter(Boolean).join(" ") || "Prénom & Nom de l'élève"}
            </div>
            {form.classe && (
              <div className="text-sm font-bold mt-1 text-yellow-300 flex items-center gap-1.5">
                <GraduationCap size={15} /> {form.classe}
              </div>
            )}
            {form.etablissement && (
              <div className="text-xs opacity-90 flex items-center gap-1.5 mt-0.5">
                <School size={13} /> {form.etablissement}
              </div>
            )}
            {form.ville && (
              <div className="text-xs opacity-80 flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} /> {form.ville}
              </div>
            )}
            {form.anneeScolaire && (
              <div className="text-[11px] opacity-75 mt-0.5 font-mono">
                Année {form.anneeScolaire}
              </div>
            )}
          </div>

          {/* Armoiries Gabon */}
          <img
            src="/favicon.png"
            alt="Armoiries"
            className="w-14 h-14 rounded-xl object-contain opacity-85 shrink-0 hidden sm:block border border-white/30 p-0.5 bg-white/10"
          />
        </div>

        {/* Objectif principal en bas de carte si défini */}
        {form.objectifs && (
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-xs font-semibold">
            <Target size={14} className="text-yellow-300 shrink-0" />
            <span className="truncate">Objectif majeur : {form.objectifs}</span>
            {form.moyenneVisee && (
              <span className="ml-auto bg-white/20 text-white px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0">
                Moyenne visée : {form.moyenneVisee}/20
              </span>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. SECTION BOÎTE À IDÉES & NOTES DE RAPPEL ("Avoir le contrôle")       */}
      {/* ===================================================================== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: INK }}>
              <StickyNote size={20} className="text-[#3A75C4]" />
              Notes de Rappel & Boîte à Idées
            </h2>
            <p className="text-xs text-stone-500">
              Note tes astuces, objectifs, conseils des professeurs et idées pour réussir ton année
            </p>
          </div>
          <Button variant="accent" onClick={() => setNouvelleNote((v) => !v)}>
            <Plus size={14} /> Nouvelle note / idée
          </Button>
        </div>

        {/* Formulaire de création de note */}
        {nouvelleNote && (
          <Card className="mb-5 border-2 border-blue-200 bg-blue-50/20 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200">
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: INK }}>
                <Lightbulb size={17} className="text-[#FCD116]" />
                Ajouter une note de rappel ou une idée clé
              </div>
              <button onClick={() => setNouvelleNote(false)} className="text-stone-400 hover:text-stone-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={ajouterNote} className="space-y-3">
              <Field label="Titre de la note ou de l'idée">
                <input
                  style={inputStyle}
                  value={noteForm.titre}
                  onChange={(e) => setNoteForm({ ...noteForm, titre: e.target.value })}
                  placeholder="ex. Formules de Physique à mémoriser, Conseil de révision Maths..."
                  autoFocus
                  required
                />
              </Field>

              <Field label="Détail, points clés ou étapes (optionnel)">
                <textarea
                  style={{ ...inputStyle, minHeight: 70 }}
                  value={noteForm.contenu}
                  onChange={(e) => setNoteForm({ ...noteForm, contenu: e.target.value })}
                  placeholder="Écris tes réflexions, les pièges à éviter, le plan d'action..."
                  rows={3}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Catégorie */}
                <div>
                  <Field label="Catégorie">
                    <select
                      style={inputStyle}
                      value={noteForm.categorie}
                      onChange={(e) => setNoteForm({ ...noteForm, categorie: e.target.value })}
                    >
                      {CATEGORIES_NOTES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Couleur de note */}
                <div>
                  <Field label="Couleur de la note">
                    <div className="flex gap-2 items-center pt-1">
                      {COULEURS_POSTIT.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setNoteForm({ ...noteForm, couleur: col.hex })}
                          className={`w-6 h-6 rounded-full border transition-transform ${
                            noteForm.couleur === col.hex ? "scale-125 ring-2 ring-[#1A3248]" : "hover:scale-110"
                          }`}
                          style={{ background: col.hex, borderColor: "rgba(0,0,0,0.15)" }}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </Field>
                </div>

                {/* Épinglé */}
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                    <input
                      type="checkbox"
                      checked={noteForm.epingle}
                      onChange={(e) => setNoteForm({ ...noteForm, epingle: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <Pin size={14} className="text-amber-700" />
                    Épingler en priorité sur l'Accueil
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="submit" variant="primary">
                  <Check size={14} /> Enregistrer la note
                </Button>
                <Button variant="ghost" onClick={() => setNouvelleNote(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filtres & Recherche de notes */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setFiltreCat("toutes")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                filtreCat === "toutes"
                  ? "bg-[#1A3248] text-white"
                  : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              Toutes ({(data.profil?.notesPerso || []).length})
            </button>
            <button
              onClick={() => setFiltreCat("epingles")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                filtreCat === "epingles"
                  ? "bg-[#1A3248] text-white"
                  : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              <Pin size={12} className="text-amber-500" /> Épinglées
            </button>
            {CATEGORIES_NOTES.map((cat) => {
              const count = (data.profil?.notesPerso || []).filter((x) => x.categorie === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFiltreCat(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    filtreCat === cat.id
                      ? "bg-[#1A3248] text-white"
                      : "bg-white text-stone-600 border border-stone-200"
                  }`}
                >
                  {cat.label} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-48">
            <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
            <input
              style={{ ...inputStyle, paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6 }}
              placeholder="Rechercher une idée..."
              value={rechercheNote}
              onChange={(e) => setRechercheNote(e.target.value)}
            />
          </div>
        </div>

        {/* Grille des notes / post-its */}
        {notesFiltrees.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            text="Aucune note ou idée enregistrée. Utilise le bouton ci-dessus pour poser tes rappels et tes objectifs de révision !"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {notesFiltrees.map((n) => {
              const catObj = CATEGORIES_NOTES.find((c) => c.id === n.categorie) || CATEGORIES_NOTES[0];
              const CatIcon = catObj.icon;

              return (
                <div
                  key={n.id}
                  className={`rounded-2xl p-4 transition-all duration-200 relative group flex flex-col justify-between border shadow-2xs hover:shadow-md ${
                    n.fait ? "opacity-60 bg-stone-100" : ""
                  }`}
                  style={{
                    background: n.fait ? "#F3F4F6" : (n.couleur || "#FEF08A"),
                    borderColor: "rgba(0,0,0,0.08)",
                  }}
                >
                  <div>
                    {/* Entête note : Catégorie + Bouton Épingler + Supprimer */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catObj.badge}`}>
                        <CatIcon size={10} />
                        {catObj.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePinNote(n.id)}
                          className={`p-1 rounded transition-colors ${
                            n.epingle ? "text-amber-800" : "text-stone-400 hover:text-stone-700"
                          }`}
                          title={n.epingle ? "Désépingler" : "Épingler en haut"}
                        >
                          <Pin size={13} fill={n.epingle ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => supprimerNote(n.id)}
                          className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Titre */}
                    <h3
                      className={`text-sm font-bold leading-tight mb-1.5 ${
                        n.fait ? "line-through text-stone-500" : "text-stone-900"
                      }`}
                    >
                      {n.titre}
                    </h3>

                    {/* Contenu */}
                    {n.contenu && (
                      <p
                        className={`text-xs whitespace-pre-wrap leading-relaxed ${
                          n.fait ? "line-through text-stone-400" : "text-stone-800"
                        }`}
                      >
                        {n.contenu}
                      </p>
                    )}
                  </div>

                  {/* Pied de carte : Date + Checkbox accompli */}
                  <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px] text-stone-600">
                    <span>{n.date || "Cette année"}</span>
                    <button
                      onClick={() => toggleFaitNote(n.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-black transition-colors"
                    >
                      {n.fait ? (
                        <>
                          <CheckSquare size={14} className="text-emerald-700" />
                          <span className="text-emerald-800">Accompli</span>
                        </>
                      ) : (
                        <>
                          <Square size={14} className="text-stone-400" />
                          <span>Marquer fait</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. FORMULAIRE DE PROFIL & CAP DE L'ANNÉE SCOLAIRE                    */}
      {/* ===================================================================== */}
      <div className="space-y-6">
        <Card>
          <form onSubmit={handleSaveProfil} className="space-y-5">
            {/* Bloc Cap & Objectif */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-sm font-bold mb-1 flex items-center gap-2 text-emerald-950">
                <Target size={17} className="text-[#009E60]" />
                Mon Cap & Mes Ambitions Scolaires
              </div>
              <p className="text-xs text-stone-600 mb-3">
                Définis ton cap pour garder la motivation et le contrôle tout au long de l'année scolaire.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Field label="Mon Grand Objectif pour cette année">
                    <input
                      style={inputStyle}
                      value={form.objectifs}
                      onChange={(e) => setForm({ ...form, objectifs: e.target.value })}
                      placeholder="ex. Décrocher mon Bac C avec mention Bien, Passer en 1ère S..."
                    />
                  </Field>
                </div>
                <div>
                  <Field label="Moyenne générale visée (/20)">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      style={inputStyle}
                      value={form.moyenneVisee}
                      onChange={(e) => setForm({ ...form, moyenneVisee: e.target.value })}
                      placeholder="ex. 15.0"
                    />
                  </Field>
                </div>
              </div>

              <Field label="Ma devise ou citation motivante">
                <input
                  style={inputStyle}
                  value={form.devise}
                  onChange={(e) => setForm({ ...form, devise: e.target.value })}
                  placeholder="ex. Travail, constance et excellence — rien n'est impossible !"
                />
              </Field>
            </div>

            {/* Bloc Identité Élève */}
            <div>
              <div className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
                <User size={16} /> Identité & Établissement
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Prénom">
                  <input
                    style={inputStyle}
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    placeholder="ex. Mboué, Ornella..."
                  />
                </Field>
                <Field label="Nom de famille">
                  <input
                    style={inputStyle}
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="ex. Nziengui, Ondo, Mba..."
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Classe">
                  <input
                    style={inputStyle}
                    value={form.classe}
                    onChange={(e) => setForm({ ...form, classe: e.target.value })}
                    placeholder="ex. Terminale D, 3ème B, 1ère C..."
                  />
                </Field>
                <Field label="Année scolaire">
                  <input
                    style={inputStyle}
                    value={form.anneeScolaire}
                    onChange={(e) => setForm({ ...form, anneeScolaire: e.target.value })}
                    placeholder="2025-2026"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Établissement scolaire">
                  <input
                    style={inputStyle}
                    value={form.etablissement}
                    onChange={(e) => setForm({ ...form, etablissement: e.target.value })}
                    placeholder="ex. Lycée National Léon Mba, Collège Bessieux..."
                  />
                </Field>
                <Field label="Ville">
                  <input
                    style={inputStyle}
                    value={form.ville}
                    onChange={(e) => setForm({ ...form, ville: e.target.value })}
                    placeholder="ex. Libreville, Port-Gentil, Franceville..."
                  />
                </Field>
              </div>

              {/* Photo de profil */}
              <div className="pt-2">
                <span className="block text-xs font-semibold mb-2" style={{ color: INK_SOFT }}>
                  Photo d'identité / Avatar scolaire
                </span>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs overflow-hidden"
                    style={{
                      background: form.photo
                        ? "transparent"
                        : `linear-gradient(135deg, ${GABON_VERT}, ${GABON_BLEU})`,
                    }}
                  >
                    {form.photo ? (
                      <img src={form.photo} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initiales || "?"}</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="ghost" small onClick={() => photoRef.current?.click()}>
                      <Camera size={13} /> Choisir une photo
                    </Button>
                    {form.photo && (
                      <Button variant="danger" small onClick={() => setForm((f) => ({ ...f, photo: null }))}>
                        <X size={13} /> Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center gap-3 border-t border-stone-200">
              <Button type="submit" variant="primary">
                <Check size={15} /> Enregistrer mes réglages de profil
              </Button>
              {saved && (
                <span className="text-sm font-semibold flex items-center gap-1" style={{ color: GABON_VERT }}>
                  <Check size={15} /> Informations sauvegardées avec succès !
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* 4. Sécurité & Modification de mot de passe */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-[#3A75C4]" />
              <h3 className="font-bold text-base" style={{ color: INK }}>
                Sécurité du compte & Modification du mot de passe
              </h3>
            </div>
            {data.auth?.email && (
              <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-stone-100 text-stone-700 flex items-center gap-1.5 border border-stone-200">
                <Mail size={12} className="text-[#009E60]" />
                {data.auth.email}
              </span>
            )}
          </div>

          {data.auth?.isTempPassword && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Vous utilisez un mot de passe temporaire aléatoire.</strong>
                <p className="mt-0.5 text-amber-800">
                  Pour votre confort et sécurité, personnalisez votre mot de passe ci-dessous afin de vous en souvenir facilement.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleChangerPass} className="space-y-3 max-w-lg">
            <Field label="Ancien mot de passe (ou mot de passe reçu)">
              <input
                type="password"
                style={inputStyle}
                value={passAncien}
                onChange={(e) => setPassAncien(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nouveau mot de passe personnalisé">
                <input
                  type="password"
                  style={inputStyle}
                  value={passNouveau}
                  onChange={(e) => setPassNouveau(e.target.value)}
                  placeholder="Au moins 4 caractères"
                />
              </Field>

              <Field label="Confirmer le nouveau mot de passe">
                <input
                  type="password"
                  style={inputStyle}
                  value={passConfirmer}
                  onChange={(e) => setPassConfirmer(e.target.value)}
                  placeholder="Répétez le nouveau mot de passe"
                />
              </Field>
            </div>

            {passMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
                  passMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {passMsg.type === "success" ? <Check size={15} /> : <AlertTriangle size={15} />}
                <span>{passMsg.text}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <Button type="submit" variant="accent">
                <Key size={14} /> Changer mon mot de passe
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  update((d) => {
                    if (!d.auth) d.auth = defaultData().auth;
                    d.auth.isLoggedIn = false;
                  });
                }}
              >
                <LogOut size={14} /> Se déconnecter
              </Button>
            </div>
          </form>
        </Card>

        {/* 4. Statistiques de contrôle annuel */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Matières",       value: data.matieres.length,                                    color: GABON_BLEU },
            { label: "Notes saisies",  value: data.notes.length,                                       color: GABON_VERT },
            { label: "Devoirs actifs", value: data.devoirs.filter((d) => !d.fait).length,              color: JAUNE_DARK },
            { label: "Créneaux EDT",   value: data.creneaux.length,                                    color: GABON_BLEU },
            { label: "Mémos & Idées",  value: (data.profil?.notesPerso || []).length,                  color: "#7C3AED" },
          ].map((stat) => (
            <Card key={stat.label} className="text-center !p-3.5">
              <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[11px] mt-0.5 font-medium text-stone-500">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}
