// ============================================
// EXPLICATION GÉNÉRALE
// ============================================
/*
Ce composant ProtectedRoute est un "composant gardien".
Son rôle: vérifier que l'utilisateur a le droit d'accéder à une page.

Cas d'usage:
- Un utilisateur non connecté ne peut pas accéder à /dashboard
- Un utilisateur "member" ne peut pas accéder à /admin
- Un utilisateur doit attendre que la session soit vérifiée avant d'afficher quoi que ce soit
*/

// ============================================
// 1. IMPORTS
// ============================================

// Navigate: Composant de react-router qui redirige vers une autre route
import { Navigate } from "react-router";

// ReactElement: Type TypeScript pour un élément React (un composant)
import type { ReactElement } from "react";

// Notre hook d'authentification personnalisé
import { useAuth } from "../context/AuthContext";

// ============================================
// 2. DÉFINITION DU COMPOSANT
// ============================================

export function ProtectedRoute({
  children,
  roles,
  guestOnly = false,
}: {
  // children: le composant à afficher si tout est ok
  // C'est le contenu "protégé" qui sera rendu si l'utilisateur a le droit
  children: ReactElement;

  // roles: un tableau optionnel de rôles autorisés
  // Ex: ["admin", "moderator"] signifie que seuls les admin et moderateurs peuvent accéder
  // Si on ne passe pas roles, n'importe quel utilisateur connecté peut accéder
  roles?: string[];
  guestOnly?: boolean;
}) {
  // ============================================
  // 3. RÉCUPÉRER LES INFOS D'AUTH
  // ============================================

  // On utilise notre hook useAuth() pour avoir accès à:
  // - user: l'utilisateur actuel (ou null si pas connecté)
  // - isLoading: vrai pendant la vérification initiale de la session
  const { user, isLoading } = useAuth();

  // ============================================
  // 4. VÉRIFICATION 1: LA SESSION EST-ELLE VÉRIFIÉE?
  // ============================================

  // Au démarrage de l'app, on doit vérifier si l'utilisateur a une session valide
  // Pendant cette vérification, isLoading = true
  // On affiche un écran de chargement pour ne pas montrer d'erreur prématurément
  if (isLoading) {
    return <p>Chargement...</p>;
  }

  // ============================================
  // 5. VÉRIFICATION 2: L'UTILISATEUR EST-IL CONNECTÉ?
  // ============================================

  if (guestOnly) {
  if (user) {
    const redirectTo =
      user.role === "admin" || user.role === "moderator"
        ? "/BackOffice"
        : "/home";

    return <Navigate to={redirectTo} replace />;
  }

  return children;
  }

  // Si isLoading = false et user = null, l'utilisateur n'est pas connecté
  // On le redirige vers la page de connexion
  if (!user) {
    // Navigate: Redirige vers /LoginForm
    // replace: remplace l'entrée actuelle de l'historique
    //          (l'utilisateur ne peut pas revenir en arrière avec le bouton retour)
    return <Navigate to="/LoginForm" replace />;
  }

  // ============================================
  // 6. VÉRIFICATION 3: L'UTILISATEUR A-T-IL LE BON RÔLE?
  // ============================================

  // Si on a spécifié des rôles autorisés
  if (roles && !roles.includes(user.role)) {
  const redirectTo =
    user.role === "admin" || user.role === "moderator"
      ? "/BackOffice"
      : "/home";

  return <Navigate to={redirectTo} replace />;
}

  // ============================================
  // 7. TOUT EST OK: AFFICHER LE CONTENU
  // ============================================

  // Si on arrive ici, c'est que:
  // - La session est vérifiée
  // - L'utilisateur est connecté
  // - L'utilisateur a le bon rôle (ou pas de rôle requis)
  // On peut donc afficher le composant enfant
  return children;
}

// ============================================
// EXEMPLES D'UTILISATION
// ============================================
/*
1. Protection basique (juste besoin d'être connecté):
   <ProtectedRoute>
     <Dashboard />
   </ProtectedRoute>

2. Protection avec rôles (admin seulement):
   <ProtectedRoute roles={["admin"]}>
     <AdminPanel />
   </ProtectedRoute>

3. Protection avec plusieurs rôles autorisés:
   <ProtectedRoute roles={["admin", "moderator"]}>
     <ModeratorPanel />
   </ProtectedRoute>

4. Dans une structure de routes complète:
   <Routes>
     <Route path="/login" element={<LoginForm />} />
     <Route path="/unauthorized" element={<UnauthorizedPage />} />

     <Route
       path="/dashboard"
       element={
         <ProtectedRoute>
           <Dashboard />
         </ProtectedRoute>
       }
     />

     <Route
       path="/admin"
       element={
         <ProtectedRoute roles={["admin"]}>
           <AdminPanel />
         </ProtectedRoute>
       }
     />
   </Routes>
*/

// ============================================
// FLUX D'EXÉCUTION COMPLET
// ============================================
/*
SCÉNARIO 1: Utilisateur non connecté accède à /dashboard
1. useAuth() retourne user = null, isLoading = true
2. On affiche "Chargement..."
3. Après la vérification de session
4. useAuth() retourne user = null, isLoading = false
5. Condition "if (!user)" = true
6. On redirige vers /LoginForm

SCÉNARIO 2: Utilisateur connecté (member) accède à /admin
1. useAuth() retourne user = {id: "1", name: "Alice", role: "member"}, isLoading = false
2. Pas de chargement
3. user existe, donc on passe la 2e vérification
4. roles = ["admin"], user.role = "member"
5. "admin" n'est pas dans ["member"]
6. Condition "if (roles && !roles.includes(user.role))" = true
7. On redirige vers /unauthorized

SCÉNARIO 3: Utilisateur connecté (admin) accède à /admin
1. useAuth() retourne user = {id: "1", name: "Bob", role: "admin"}, isLoading = false
2. Pas de chargement
3. user existe
4. roles = ["admin"], user.role = "admin"
5. "admin" EST dans ["admin"]
6. Condition "if (roles && !roles.includes(user.role))" = false
7. return children (affiche AdminPanel)
*/

// ============================================
// POINTS CLÉS À RETENIR
// ============================================
/*
Les 3 vérifications (dans cet ordre):
   1. Est-ce que la session est chargée?
   2. Est-ce que l'utilisateur existe?
   3. Est-ce que l'utilisateur a le bon rôle?

Le chargement initial:
   C'est important de vérifier isLoading car sinon on redirirait les utilisateurs
   valides vers la page de login pendant 100ms (le temps de la première requête)

L'utilisation de roles:
   - Si roles n'est pas passé: n'importe quel utilisateur connecté peut accéder
   - Si roles = ["admin"]: seul un utilisateur avec role="admin" peut accéder
   - roles est optionnel (?: string[])

Navigate avec replace:
   replace=true fait que l'utilisateur ne peut pas revenir en arrière
   C'est important pour un flow de sécurité (ne pas pouvoir revenir à /admin
   après être redirigé vers /unauthorized)
*/
