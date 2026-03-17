import { useState, useEffect } from "react";
import axiosInstance from "../axios/axiosInstance";

// Structure des données du formulaire de connexion
type Credentials = {
  email: string;
  password: string;
};

// Structure de l'utilisateur connecté
// Ajouter ici tous les champs souhiatés que l'API renvoie (name, email, etc.)
type User = {
  id: string;
  role: string;
  // email?: string;
  name: string;
};

// Structure de retour pour toutes les opérations d'authentification
// Permet une gestion d'erreur propre sans try/catch dans les composants
type AuthResult = {
  success: boolean;      // true si l'opération a réussi
  user?: User;           // Le User (uniquement si success = true)
  error?: string;        // Message d'erreur (uniquement si success = false)
};

export function Auth() {

  // Stocke l'utilisateur actuellement connecté
  // null = pas connecté, User = connecté
  const [user, setUser] = useState<User | null>(null);
  
  // Indique si on est en train de vérifier l'authentification au chargement
  // Utile pour afficher un loader pendant la vérification du token
  const [isLoading, setIsLoading] = useState(true);

  //const [hasBooted, setHasBooted] = useState(false);

  // Fonction de connexion
  const login = async (credentials: Credentials): Promise<AuthResult> => {
    try {
      // Envoie les credentials à l'API
      // L'API valide et renvoie le User + set les cookies (httpOnly)
      const response = await axiosInstance.post("/auth/login", credentials);
      
      // Récupère le User depuis la réponse
      const authenticatedUser = response.data.user;
      
      // Met à jour le state local avec le User connecté
      setUser(authenticatedUser);
      
      // Retourne un succès avec les données du User
      // L'appelant (LoginForm/ MinimalPersonalzeMemberAccount) peut utiliser ces données directement
      return { 
        success: true, 
        user: authenticatedUser 
      };
      
    } catch (error: any) {
      // En cas d'erreur
      // Récupère le message d'erreur de l'API si disponible
      // Sinon utilise un message générique
      const errorMessage = 
        error.response.data.message || 
        "Erreur de connexion. Vérifiez vos identifiants.";
      
      // Retourne un échec avec le message d'erreur
      // Pas besoin de throw, l'appelant (LoginForm) gère proprement l'erreur
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Fonciton de deconnexion du User
  const logout = async (): Promise<AuthResult> => {
    try {
      // Appelle l'API pour invalider le token côté serveur
      // et supprimer les cookies
      await axiosInstance.post("/auth/logout");
      
      // Réinitialise le state local
      setUser(null);
      
      // Retourne un succès
      return { success: true };
      
    } catch (error: any) {
      // Même en cas d'erreur, on déconnecte localement
      // pour éviter un état incohérent
      setUser(null);
      
      // Mais on informe quand même d'une erreur potentielle
      return { 
        success: false, 
        error: "Erreur lors de la déconnexion" 
      };
    }
  };

  //Vérifie automatiquement si un token valid existe et récupère le User
 // Promise<void> car pas besoin de retour (usage interne, aucune donnée à afficher)
  const refresh = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Tente de rafraîchir le token
      // Si un refresh token valide existe dans les cookies,
      // l'API renvoie un nouveau access token + les données user
      const res = await axiosInstance.post("/auth/refresh");
      
      // Met à jour l'utilisateur (= toujours connecté)
      setUser(res.data.user);
      
    } catch {
      // Si le refresh échoue (pas de token, token expiré, etc.)
      // L'utilisateur n'est plus connecté
      setUser(null);
      
    } finally {
      // Dans tous les cas (succès ou échec),
      // le chargement initial est terminé
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator";
  const isMember = user?.role === "member";
  const isOrganization = user?.role === "organization";

  //Vérifie automatiquement si l'utilisateur est connecté
  //au chargement de l'application
  useEffect(() => {
    refresh();
  }, []);; // Tableau vide = exécuté une seule fois au montage

  // Retourne toutes les données et fonctions nécessaires
  return { 
    user,                          // L'utilisateur connecté ou null
    login,                         // Fonction de connexion
    logout,                        // Fonction de déconnexion
    refresh,                       // Fonction de refresh (rarement utilisée manuellement)
    isAuthenticated: !!user,       // Boolean : true si connecté , false sinon user= null
    isLoading,                     // Boolean : true pendant la vérification initiale
    isMember,
    isOrganization,
    isAdmin,
    isModerator,
  };
}