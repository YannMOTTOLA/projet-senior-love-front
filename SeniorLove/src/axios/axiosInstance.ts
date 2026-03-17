/**
 * Les 3 éléments clés :

- withCredentials: true : C'est ce qui permet d'envoyer automatiquement les cookies (tes tokens HTTPOnly). 
                          Sans ça, rien ne marche.
- refreshPromise : La variable globale qui évite les requêtes en cascade. 
                    Si 5 requêtes échouent simultanément, elles vont toutes attendre le même rafraîchissement au lieu d'en lancer 5.
- L'interceptor de réponse : C'est le cœur du système. 
                            Il vérifie si on a un 401, et si c'est possible, il rafraîchit le token et refait la requête automatiquement.
 */


import axios from "axios";

// ============================================
// 1. CRÉATION DE L'INSTANCE AXIOS
// ============================================

// On crée une instance Axios personnalisée au lieu d'utiliser axios directement
// Cela permet de configurer des paramètres par défaut pour TOUTES les requêtes
const axiosInstance = axios.create({
  // La base URL: toutes les requêtes commenceront par cette URL
  // Au lieu d'écrire "http://localhost:3001/api/auth/login", on écrit juste "/auth/login"
  baseURL: `${import.meta.env.VITE_API_URL}/api`,

  // TRÈS IMPORTANT: withCredentials: true
  // Cela indique au navigateur d'inclure automatiquement dans CHAQUE requête:
  //   - Les cookies (notamment le refresh token HTTPOnly qui ne peut pas être accédé en JS)
  //   - Les en-têtes de session du navigateur
  //   - Les informations d'authentification du navigateur
  // 
  // Sans cela, même si le serveur envoie un cookie, le navigateur ne l'inclura pas
  // dans les requêtes suivantes
  withCredentials: true,

  // Header par défaut pour toutes les requêtes
  headers: { "Content-Type": "application/json" },
});

// ============================================
// 2. VARIABLE POUR ÉVITER LES REQUÊTES MULTIPLES
// ============================================

// Cette promesse stocke la requête de rafraîchissement en cours
// Imagine que 3 requêtes échouent en même temps avec un 401
// Sans cette variable, on lancherait 3 appels /auth/refresh simultanés
// Avec cette variable, les 3 attendent la même promesse
let refreshPromise: Promise<any> | null = null;

// ============================================
// 3. FONCTION: Rafraîchir la session
// ============================================

export function refreshSession() {
  // Si une requête de refresh est déjà en cours
  if (!refreshPromise) {
    // Lance une nouvelle requête de refresh
    refreshPromise = axiosInstance.post("/auth/refresh")
      // .finally() s'exécute peu importe le résultat (succès ou erreur)
      .finally(() => {
        // Après le refresh (succès ou échec), on réinitialise la variable
        // Comme ça, la prochaine fois qu'on aura besoin de refresh,
        // on lancera une nouvelle requête
        refreshPromise = null;
      });
  }

  // Retourne la promesse en cours (soit celle qui vient d'être créée, soit celle qui existe)
  return refreshPromise;
}

// ============================================
// 4. LES INTERCEPTORS (l'intelligence du système)
// ============================================

// Un interceptor = une fonction qui s'exécute automatiquement avant/après chaque requête
// On utilise un interceptor de réponse = s'exécute APRÈS que le serveur réponde

axiosInstance.interceptors.response.use(
  // Premier argument: fonction en cas de succès (status 2xx)
  (response) => response,

  // Deuxième argument: fonction en cas d'erreur (status 4xx, 5xx, etc.)
  async (error) => {
    // ============================================
    // RÉCUPÉRER LES INFOS DE L'ERREUR
    // ============================================

    // L'objet de la requête originale qui a échoué
    // On va potentiellement la refaire
    const originalRequest = error.config;

    // Vrai si le serveur a répondu avec un code 401 (Unauthorized)
    // 401 = "ton token d'accès a expiré"
    const is401 = error.response?.status === 401;

    // Vrai si on a déjà tenté de refaire cette requête
    // (pour éviter les boucles infinies)
    const alreadyRetried = Boolean(originalRequest?._retry);

    // Vrai si l'erreur vient de la requête de refresh elle-même
    // On ne veut pas essayer de refresh si le refresh échoue
    const isRefreshCall = Boolean(originalRequest?.url?.includes("/auth/refresh"));

    // Vrai si la requête est une tentative d'auth (login ou register)
    // Pas besoin de refresh si la connexion échoue déjà
    const isAuthCall =
      Boolean(originalRequest?.url?.includes("/auth/login")) ||
      Boolean(originalRequest?.url?.includes("/auth/register"));

    // ============================================
    // LA LOGIQUE: RETRY AUTOMATIQUE
    // ============================================

    // Si TOUS ces conditions sont vraies:
    // 1. C'est un 401 (token expiré)
    // 2. On n'a pas encore retesté cette requête
    // 3. Ce n'est pas l'appel de refresh qui a échoué
    // 4. Ce n'est pas un appel de login/register
    // ALORS on essaie de rafraîchir le token et de refaire la requête
    if (is401 && !alreadyRetried && !isRefreshCall && !isAuthCall) {
      // Marque cette requête comme ayant été reetentée
      // (pour ne pas boucler à l'infini)
      originalRequest._retry = true;

      // Attend le rafraîchissement de la session
      // Si plusieurs requêtes arrivent ici en même temps,
      // elles vont toutes attendre la MÊME promesse grâce à notre gestion ci-dessus
      await refreshSession();

      // Une fois le token rafraîchi, refait la requête originale
      // avec le nouveau token automatiquement inclus (grâce à withCredentials)
      return axiosInstance(originalRequest);
    }

    // Si on n'entre pas dans la logique de retry, rejette l'erreur
    // Le composant qui a appelé cette requête recevra l'erreur
    return Promise.reject(error);
  }
);

export default axiosInstance;

// ============================================
// RÉSUMÉ DU FLUX COMPLET
// ============================================
/*
1. L'app envoie une requête GET /user
2. Axios ajoute automatiquement le cookie (access token HTTPOnly)
3. Le serveur répond avec 401 (token expiré)
4. L'interceptor détecte le 401
5. L'interceptor appelle /auth/refresh
6. Le serveur utilise le refresh token (dans un autre cookie)
7. Le serveur envoie un nouveau access token (dans les Set-Cookie)
8. L'interceptor refait la requête GET /user originale
9. Cette fois elle passe, le serveur répond avec 200 et les données
10. Le composant reçoit les données avec succès

Tout ça SE FAIT AUTOMATIQUEMENT sans que le composant ne fasse rien !
*/

// ============================================
// AVANTAGES DE CE SYSTÈME
// ============================================
/*
Transparence: Les composants ne savent pas que les tokens expirent
DRY: Logique de retry centralisée, pas répétée partout
Efficacité: Évite les requêtes multiples de refresh grâce à refreshPromise
Sécurité: Les tokens HTTPOnly ne peuvent pas être volés par XSS
Robustesse: Gère les edge cases (ne retry pas le refresh lui-même, etc.)
*/