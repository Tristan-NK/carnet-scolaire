import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "node:crypto";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import {
  initDB,
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPassword,
  updateUserProfile,
  getCarnetData,
  saveCarnetData,
  createSupportTicket,
  isUsingPostgres,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

// Clé secrète JWT persistante et cryptographiquement forte
const SECRET_FILE = path.join(__dirname, ".jwt_secret");
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (fs.existsSync(SECRET_FILE)) {
    JWT_SECRET = fs.readFileSync(SECRET_FILE, "utf-8").trim();
  } else {
    JWT_SECRET = crypto.randomBytes(32).toString("hex");
    try {
      fs.writeFileSync(SECRET_FILE, JWT_SECRET, "utf-8");
    } catch (e) {}
  }
}

// Initialisation de la base de données (Neon PostgreSQL Cloud ou SQLite local)
await initDB();

// Dossier pour les téléversements (copies d'examens, photos de profil)
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuration sécurisée de Multer (filtrage strict MIME & extensions)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Nettoyage et extension sûre
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(8).toString("hex");
    cb(null, `copie-${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max par photo
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Format de fichier non autorisé. Seules les images (JPG, PNG, WebP) sont acceptées."));
    }
  },
});

const app = express();

// ---------------------------------------------------------------------------
// SÉCURITÉ & PERFORMANCES (HELMET, COMPRESSION, RATE LIMITING)
// ---------------------------------------------------------------------------

// 1. Masquage des en-têtes et sécurisation HTTP complète avec Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permet le chargement des images d'upload sur mobile
    contentSecurityPolicy: false, // Vite gère les assets en dev
  })
);

// 2. Compression gzip de toutes les réponses (divise par ~4 la bande passante)
app.use(compression());

// 3. Limitation du débit (Rate Limiting anti-DDoS et anti-bruteforce)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600, // 600 requêtes par minute par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Veuillez ralentir un instant." },
});
app.use("/api/", globalLimiter);

// Limiteur strict pour l'authentification (empêche le piratage par force brute des mots de passe)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 tentatives max toutes les 15 minutes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives de connexion ou création de compte. Veuillez patienter 15 minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// 4. CORS et parsers de corps HTTP
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// 5. Servir les uploads statiques avec cache-control HTTP pour accélérer l'affichage
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    maxAge: "7d", // Cache 7 jours dans le navigateur du smartphone
    immutable: true,
  })
);

// ---------------------------------------------------------------------------
// SANITISATION & VALIDATION DES ENTRÉES
// ---------------------------------------------------------------------------

function sanitizeString(str, maxLength = 150) {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "") // Supprime les balises scripts (anti-XSS)
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase()) && email.length <= 120;
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

function genererToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "90d" }
  );
}

// Middleware d'authentification
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expirée ou invalide. Veuillez vous reconnecter." });
  }
}

// ---------------------------------------------------------------------------
// ROUTES AUTHENTIFICATION SÉCURISÉES
// ---------------------------------------------------------------------------

// Inscription
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, nom, prenom, classe, initialCarnetData } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Adresse e-mail valide requise." });
    }

    const emailNettoye = email.trim().toLowerCase();
    const existant = await findUserByEmail(emailNettoye);
    if (existant) {
      return res.status(409).json({ error: "Un compte existe déjà avec cette adresse e-mail." });
    }

    const safeNom = sanitizeString(nom, 80);
    const safePrenom = sanitizeString(prenom, 80);
    const safeClasse = sanitizeString(classe, 50);

    const mdpFinal = (password && typeof password === "string" && password.trim().length >= 4)
      ? password.trim()
      : genererMotDePasseAleatoire();
    const isTemp = !password || password.trim().length < 4 || mdpFinal.startsWith("GB-");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(mdpFinal, salt);

    const userId = "usr_" + Date.now().toString(36) + crypto.randomBytes(6).toString("hex");

    await createUser({
      id: userId,
      email: emailNettoye,
      passwordHash,
      tempPassword: isTemp ? mdpFinal : null,
      nom: safeNom,
      prenom: safePrenom,
      classe: safeClasse,
    });

    // Données carnet initiales
    const carnetData = (initialCarnetData && typeof initialCarnetData === "object")
      ? structuredClone(initialCarnetData)
      : {
          auth: { isLoggedIn: true, email: emailNettoye },
          settings: {
            niveau: "mixte",
            bareme: 20,
            periodes: ["Trimestre 1", "Trimestre 2", "Trimestre 3"],
            periodeActive: 0,
            semaineActive: "toutes",
          },
          profil: {
            prenom: safePrenom,
            nom: safeNom,
            etablissement: "",
            classe: safeClasse,
            anneeScolaire: "2025-2026",
            photo: null,
            ville: "",
            objectifs: "",
            moyenneVisee: "",
            devise: "",
            notesPerso: [],
          },
          matieres: [],
          notes: [],
          creneaux: [],
          devoirs: [],
        };

    // Assurer que le profil et l'authentification reçoivent toujours les nom, prénom et classe saisis
    if (!carnetData.profil) carnetData.profil = {};
    if (safeNom) carnetData.profil.nom = safeNom;
    if (safePrenom) carnetData.profil.prenom = safePrenom;
    if (safeClasse) carnetData.profil.classe = safeClasse;
    if (!carnetData.auth) carnetData.auth = {};
    carnetData.auth.isLoggedIn = true;
    carnetData.auth.email = emailNettoye;

    await saveCarnetData(userId, carnetData);

    const user = {
      id: userId,
      email: emailNettoye,
      nom: safeNom,
      prenom: safePrenom,
      classe: safeClasse,
      isTempPassword: isTemp,
      generatedPassword: isTemp ? mdpFinal : null,
    };

    const token = genererToken(user);

    return res.status(201).json({
      message: "Compte créé avec succès.",
      token,
      user,
      carnet: carnetData,
    });
  } catch (err) {
    console.error("Erreur register:", err);
    return res.status(500).json({ error: "Erreur interne lors de la création du compte." });
  }
});

// Connexion
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof password !== "string") {
      return res.status(400).json({ error: "E-mail et mot de passe requis." });
    }

    const emailNettoye = email.trim().toLowerCase();
    const user = await findUserByEmail(emailNettoye);

    if (!user) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    let passwordValide = false;
    try {
      passwordValide = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      passwordValide = false;
    }

    if (!passwordValide && user.temp_password && user.temp_password === password.trim()) {
      passwordValide = true;
    }

    if (!passwordValide) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    const token = genererToken(user);
    let carnet = await getCarnetData(user.id);
    if (carnet) {
      if (!carnet.profil) carnet.profil = {};
      if (!carnet.profil.nom && user.nom) carnet.profil.nom = user.nom;
      if (!carnet.profil.prenom && user.prenom) carnet.profil.prenom = user.prenom;
      if (!carnet.profil.classe && user.classe) carnet.profil.classe = user.classe;
    }

    return res.json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        classe: user.classe,
        isTempPassword: !!user.temp_password,
      },
      carnet,
    });
  } catch (err) {
    console.error("Erreur login:", err);
    return res.status(500).json({ error: "Erreur interne lors de la connexion." });
  }
});

// Récupérer le profil courant
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }
    let carnet = await getCarnetData(user.id);
    if (carnet) {
      if (!carnet.profil) carnet.profil = {};
      if (!carnet.profil.nom && user.nom) carnet.profil.nom = user.nom;
      if (!carnet.profil.prenom && user.prenom) carnet.profil.prenom = user.prenom;
      if (!carnet.profil.classe && user.classe) carnet.profil.classe = user.classe;
    }
    return res.json({ user, carnet });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

// Changement de mot de passe
app.post("/api/auth/change-password", authMiddleware, async (req, res) => {
  try {
    const { ancienPassword, nouveauPassword } = req.body;

    if (!nouveauPassword || typeof nouveauPassword !== "string" || nouveauPassword.trim().length < 4) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit comporter au least 4 caractères." });
    }

    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    if (ancienPassword) {
      let match = await bcrypt.compare(ancienPassword, user.password_hash);
      if (!match && user.temp_password && user.temp_password === ancienPassword) {
        match = true;
      }
      if (!match) {
        return res.status(400).json({ error: "L'ancien mot de passe est incorrect." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(nouveauPassword.trim(), salt);

    await updateUserPassword(user.id, newHash, null);

    return res.json({ message: "Mot de passe mis à jour avec succès !" });
  } catch (err) {
    console.error("Erreur change-password:", err);
    return res.status(500).json({ error: "Erreur lors de la modification du mot de passe." });
  }
});

// ---------------------------------------------------------------------------
// ROUTES CARNET & SYNCHRONISATION
// ---------------------------------------------------------------------------

// Récupérer le carnet
app.get("/api/carnet", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    let carnet = await getCarnetData(req.user.id);
    if (carnet && user) {
      if (!carnet.profil) carnet.profil = {};
      if (!carnet.profil.nom && user.nom) carnet.profil.nom = user.nom;
      if (!carnet.profil.prenom && user.prenom) carnet.profil.prenom = user.prenom;
      if (!carnet.profil.classe && user.classe) carnet.profil.classe = user.classe;
    }
    return res.json({ carnet });
  } catch (err) {
    return res.status(500).json({ error: "Impossible de charger les données du carnet." });
  }
});

// Sauvegarder le carnet
app.put("/api/carnet", authMiddleware, async (req, res) => {
  try {
    const { carnet } = req.body;
    if (!carnet || typeof carnet !== "object") {
      return res.status(400).json({ error: "Données du carnet manquantes." });
    }

    await saveCarnetData(req.user.id, carnet);

    if (carnet.profil) {
      await updateUserProfile(req.user.id, {
        nom: sanitizeString(carnet.profil.nom, 80),
        prenom: sanitizeString(carnet.profil.prenom, 80),
        classe: sanitizeString(carnet.profil.classe, 50),
      });
    }

    return res.json({ message: "Carnet synchronisé avec succès.", updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Erreur save carnet:", err);
    return res.status(500).json({ error: "Erreur lors de la sauvegarde du carnet." });
  }
});

// ---------------------------------------------------------------------------
// TÉLÉVERSEMENT FICHIERS (COPIES & PHOTOS) AVEC VALIDATION STRICTE
// ---------------------------------------------------------------------------
app.post("/api/upload", authMiddleware, (req, res) => {
  upload.single("photo")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "L'image est trop volumineuse (max 10 Mo)." });
      }
      return res.status(400).json({ error: `Erreur d'envoi : ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier d'image valide reçu." });
    }

    const publicUrl = `/uploads/${req.file.filename}`;
    return res.json({
      message: "Fichier téléversé avec succès.",
      url: publicUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  });
});

// Signalement de défaillance ou contact développeur
app.post("/api/support", async (req, res) => {
  try {
    const { email, sujet, message, diagnostic } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Le message de signalement est requis." });
    }

    const ticketId = "tkt_" + Date.now().toString(36) + crypto.randomBytes(4).toString("hex");
    let userId = null;
    let safeEmail = sanitizeString(email, 120);

    // Extraction éventuelle du token si présent
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.id;
        if (!safeEmail) safeEmail = decoded.email;
      } catch (e) {}
    }

    await createSupportTicket({
      id: ticketId,
      userId,
      email: safeEmail,
      sujet: sanitizeString(sujet, 150) || "Signalement de défaillance",
      message: sanitizeString(message, 3000),
      diagnostic: typeof diagnostic === "object" ? JSON.stringify(diagnostic) : sanitizeString(diagnostic, 2000),
    });

    return res.status(201).json({
      message: "Votre signalement a été transmis avec succès à l'équipe de développement. Merci !",
      ticketId,
    });
  } catch (err) {
    console.error("Erreur support ticket:", err);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du signalement." });
  }
});

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    security: "hardened",
  });
});

// Servir l'application React PWA en production (dossier dist)
const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: "1d" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

// Gestionnaire d'erreur global pour éviter tout crash serveur
app.use((err, req, res, next) => {
  console.error("Erreur non gérée:", err);
  res.status(500).json({ error: "Une erreur interne s'est produite." });
});

// Lancement du serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SERVEUR CARNET SCOLAIRE] Sécurisé & Opérationnel sur http://0.0.0.0:${PORT}`);
  console.log(`[BASE DE DONNÉES] ${isUsingPostgres() ? "Neon PostgreSQL (Cloud ☁️)" : "SQLite Local (carnet.db 📁)"}`);
});
