// Système d'authentification centralisé avec React Context.
// Permet à n'importe quel composant d'accéder aux infos d'auth sans les passer via les props.
/**Les 3 couches principales :
- Les types : définissent la structure des données
- Le Provider : gère l'état d'auth et met à jour tous les composants enfants
- Le hook useAuth() : permet aux composants d'accéder facilement à l'auth
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import axiosInstance, { refreshSession } from "../axios/axiosInstance";


// Hook personnalisé pour la déconnexion automatique après inactivité
// function useAutoLogout(timeoutMinutes = 2) {
//   const { logout } = useAuth();
//   const timeoutMs = timeoutMinutes * 60 * 1000;
//   const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const resetTimer = () => {
//     if (timeoutIdRef.current !== null) {
//       clearTimeout(timeoutIdRef.current);
//     }
//     timeoutIdRef.current = setTimeout(() => {
//       logout();
//     }, timeoutMs);
//   };

//   useEffect(() => {
//     // Écouter l'activité utilisateur
//     window.addEventListener("mousemove", resetTimer);
//     window.addEventListener("keypress", resetTimer);
//     window.addEventListener("click", resetTimer);

//     resetTimer(); // Lancer le timer au démarrage

//     return () => {
//       if (timeoutIdRef.current !== null) {
//         clearTimeout(timeoutIdRef.current);
//         timeoutIdRef.current = null;
//       }
//       window.removeEventListener("mousemove", resetTimer);
//       window.removeEventListener("keypress", resetTimer);
//       window.removeEventListener("click", resetTimer);
//     };
//   }, [logout, timeoutMs]);
// }

// ============================================
// 1. TYPES & INTERFACES
// ============================================

// Définit les différents rôles possibles d'un utilisateur
export type RoleName = "member" | "organization" | "moderator" | "admin";

// Structure d'un utilisateur authentifié
export type User = {
  id: string;
  name: string;
  role: RoleName;
};

// Les données nécessaires pour se connecter
type Credentials = {
  email: string;
  password: string
};

// Résultat d'une tentative de connexion (succès ou erreur)
type AuthResult =
  | { success: true; user: User }
  | { success: false; error: string };

// Tout ce que le contexte d'authentification fournit aux composants
type AuthContextValue = {
  user: User | null;              // L'utilisateur actuel (null si pas connecté)
  isLoading: boolean;              // Vrai pendant la vérification de la session
  login: (credentials: Credentials) => Promise<AuthResult>;  // Fonction de connexion
  refresh: () => Promise<void>;    // Fonction pour rafraîchir la session
  logout: () => Promise<void>;    // Fonction pour déconnecter
};

// ============================================
// 2. CRÉATION DU CONTEXTE
// ============================================

// Crée le contexte React qui sera utilisé pour partager l'état d'auth
// Initié à null (sera défini dans le Provider)
const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// 3. FONCTION UTILITAIRE
// ============================================

// Normalise les données utilisateur reçues de l'API
// Car l'API peut renvoyer le rôle sous différents formats
function normalizeUser(apiUser: any): User {
  const role =
    typeof apiUser?.role === "string"
      ? apiUser.role                    // Si role est directement une string
      : typeof apiUser?.role?.name === "string"
        ? apiUser.role.name               // Si role est un objet avec une propriété name
        : undefined;

  // Retourne un utilisateur au format standardisé
  return {
    id: apiUser.id,
    name: apiUser.name,
    role: role as RoleName
  };
}

// ============================================
// 4. VARIABLE GLOBALE POUR LE BOOTSTRAP
// ============================================

// Cette variable stocke la promesse du bootstrap (première vérification de session)
// Elle évite que plusieurs instances du Provider lancent plusieurs requêtes en parallèle
let bootstrapPromise: Promise<User | null> | null = null;

// ============================================
// 5. LE PROVIDER (le composant qui fournit l'auth)
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  // État: l'utilisateur actuel
  const [user, setUser] = useState<User | null>(null);

  // État: indique si on est en train de charger les données de session
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // FONCTION: Rafraîchir la session
  // ============================================
  const refresh = async () => {
    try {
      // Appelle l'API pour vérifier si la session est valide
      // (par exemple, via un token dans les cookies)
      const response = await refreshSession();
      setUser(normalizeUser(response.data.user));
    } catch {
      // Si la session n'est pas valide, on déconnecte l'utilisateur
      setUser(null);
    }
  };

  // ============================================
  // FONCTION: Se connecter
  // ============================================
  const login = async (credentials: Credentials): Promise<AuthResult> => {
    try {
      // Envoie les identifiants au serveur
      const response = await axiosInstance.post("/auth/login", credentials);

      // Normalise les données utilisateur reçues
      const normalized = normalizeUser(response.data.user);

      // Met à jour l'état local
      setUser(normalized);

      // Retourne le succès avec l'utilisateur
      return { success: true, user: normalized };
    } catch (error: any) {
      // Gère les erreurs de connexion
      // Essaie plusieurs chemins pour obtenir le message d'erreur de l'API
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erreur de connexion. Vérifiez vos identifiants.";

      return { success: false, error: errorMessage };
    }
  };
  // ============================================
  // FONCTION: Se déconnecter
  // ============================================

  const logout = async () => {
    try {
      // Appelle ton backend pour supprimer les cookies
      await axiosInstance.post("/auth/logout", {}, { withCredentials: true });

      // Met à jour l'état local
      setUser(null);

      // Redirige vers la page de login
      navigate("/LoginForm");
      // ou navigate("/login") si tu utilises react-router
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      setUser(null); // On force quand même la déconnexion côté front
      navigate("/LoginForm");

    }
  };

  // ============================================
  // HOOK: Vérification initiale de la session
  // ============================================
  useEffect(() => {
    // Cette variable empêche les mises à jour après le démontage du composant
    let canceled = false;

    // On considère qu'on est en train de charger
    setIsLoading(true);

    // Si c'est la première fois qu'on lance le bootstrap
    if (!bootstrapPromise) {
      // Lance la promesse et la stocke globalement
      // Tous les AuthProvider qui se montent en même temps partageront cette promesse
      bootstrapPromise = (async () => {
        try {
          // Essaie de récupérer la session existante
          const response = await refreshSession();
          return normalizeUser(response.data.user);
        } catch {
          // Pas de session valide
          return null;
        }
      })();
    }

    // Attend que la promesse de bootstrap se termine
    bootstrapPromise
      .then((bootUser) => {
        // Si le composant n'a pas été démonté entre-temps
        if (!canceled) {
          setUser(bootUser);
        }
      })
      .finally(() => {
        // Quand tout est fini, on arrête de charger
        if (!canceled) {
          setIsLoading(false);
        }
      });

    // Fonction de nettoyage appelée lors du démontage
    return () => {
      // Marque qu'on ne doit plus mettre à jour
      canceled = true;
    };
  }, []); // Cet effet s'exécute une seule fois au montage

  useEffect(() => {
    if (!user) return; // Ne lance le timer que si l'utilisateur est connecté

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const INACTIVITE = 2 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        logout();
      }, INACTIVITE);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("click", resetTimer);


    resetTimer();

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);

    };
  }, [user, logout]);

  // ============================================
  // RENDU: Fournir le contexte à tous les enfants
  // ============================================
  return (
    <AuthContext.Provider value={{ user, isLoading, login, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// 6. LE HOOK: useAuth()
// ============================================

// Hook personnalisé pour accéder au contexte d'authentification depuis n'importe quel composant
export function useAuth() {
  const context = useContext(AuthContext);

  // Vérification de sécurité: s'assure que le composant est bien à l'intérieur du Provider
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }

  return context;
}

// ============================================
// RÉSUMÉ DU FLUX
// ============================================
// 1. L'app démarre, le AuthProvider se monte
// 2. useEffect lance une vérification de session (bootstrap)
// 3. Si la session existe (token valide), l'utilisateur est restauré
// 4. D'autres composants peuvent appeler useAuth() pour accéder à user, login, refresh
// 5. Quand l'utilisateur clique "Connexion", on appelle login()
// 6. login() met à jour l'état user globalement
// 7. Tous les composants sont notifiés du changement d'état