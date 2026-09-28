// Client API pour communiquer avec le backend Node.js / Express & SQLite
const TOKEN_KEY = "carnet:token";
const USER_KEY = "carnet:user";

// Récupère le token JWT stocké
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {}
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setCachedUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {}
}

// Fonction utilitaire pour exécuter des requêtes API
async function apiFetch(endpoint, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Si on envoie du JSON et pas du FormData
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `Erreur requête (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Inscription
export async function registerUser({ email, password, nom, prenom, classe, initialCarnetData }) {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, nom, prenom, classe, initialCarnetData }),
  });
  if (res.token) setToken(res.token);
  if (res.user) setCachedUser(res.user);
  return res;
}

// Connexion
export async function loginUser({ email, password }) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (res.token) setToken(res.token);
  if (res.user) setCachedUser(res.user);
  return res;
}

// Déconnexion
export function logoutUser() {
  setToken(null);
  setCachedUser(null);
}

// Profil de l'utilisateur connecté
export async function fetchCurrentUser() {
  return await apiFetch("/api/auth/me");
}

// Changement de mot de passe
export async function changeUserPassword({ ancienPassword, nouveauPassword }) {
  return await apiFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ ancienPassword, nouveauPassword }),
  });
}

// Charger le carnet depuis le serveur
export async function fetchCarnet() {
  const res = await apiFetch("/api/carnet");
  return res.carnet;
}

// Sauvegarder le carnet sur le serveur
export async function syncCarnet(carnet) {
  return await apiFetch("/api/carnet", {
    method: "PUT",
    body: JSON.stringify({ carnet }),
  });
}

// Téléverser une photo (copie d'examen ou avatar)
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("photo", file);

  const res = await apiFetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  return res; // { url, filename, size }
}

// Envoyer un signalement de défaillance au développeur
export async function sendSupportTicket({ email, sujet, message, diagnostic }) {
  return await apiFetch("/api/support", {
    method: "POST",
    body: JSON.stringify({ email, sujet, message, diagnostic }),
  });
}

