import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import "./LoginForm.css";

// ============================================
// 1. SCHÉMA DE VALIDATION (Zod)
// ============================================

const loginSchema = z.object({
  email: z.email("Email invalide").min(1, "Adresse email requise."),
  password: z.string().min(1, "Le mot de passe est requis"),
});

// ============================================
// 2. COMPOSANT PRINCIPAL
// ============================================

export default function LoginForm() {
  // ============================================
  // HOOKS
  // ============================================

  // Notre hook d'authentification personnalisé
  // On récupère la fonction login() pour se connecter
  const { login } = useAuth();

  // Hook de navigation de react-router
  // Permet de rediriger l'utilisateur après connexion
  const navigate = useNavigate();

  // ============================================
  // ÉTATS
  // ============================================

  // Stocke les erreurs de validation ou d'authentification
  // Format: { email: "Email invalide", general: "Identifiants incorrects", ... }
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Indique si la requête est en cours
  // Utilisé pour désactiver les inputs et le bouton pendant l'envoi
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État du formulaire
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,  // La case "Mémoriser mes identifiants"
  });

  // FONCTION: Gestion des changements d'inputs
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  // ============================================
  // 3. FONCTION: Gestion de la soumission du formulaire
  // ============================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Empêche le rechargement de la page par défaut
    event.preventDefault();

    // Réinitialise les erreurs précédentes
    setErrors({});

    // Indique qu'on est en train de traiter la requête
    setIsSubmitting(true);

    try {
      // ============================================
      // ÉTAPE 1: RÉCUPÉRER LES DONNÉES DU FORMULAIRE
      // ============================================

      // FormData extrait les données de tous les inputs du formulaire
      const formData = new FormData(event.currentTarget);

      // On construit un objet avec les données
      const rawData = {
        email: formData.get("email"),      // Récupère la valeur de l'input name="email"
        password: formData.get("password"), // Récupère la valeur de l'input name="password"
      };

      // ============================================
      // ÉTAPE 2: VALIDER LES DONNÉES
      // ============================================

      // safeParse: valide les données sans lever d'erreur
      // Retourne { success: true, data: ... } ou { success: false, error: ... }
      const validation = loginSchema.safeParse(rawData);

      if (!validation.success) {
        // Si la validation échoue, on formate les erreurs
        // { email: "Email invalide", password: "Le mot de passe est requis" }
        const formatted: Record<string, string> = {};

        // Pour chaque erreur de validation
        for (const issue of validation.error.issues) {
          const field = issue.path[0]; // Récupère le champ concerné (email ou password)
          if (field) formatted[String(field)] = issue.message; // Stocke le message d'erreur
        }

        // Affiche les erreurs dans le formulaire
        setErrors(formatted);
        return; // Arrête ici, ne pas appeler login()
      }

      // ============================================
      // ÉTAPE 3: APPELER LA FONCTION LOGIN
      // ============================================

      // Appelle notre fonction login du contexte d'auth
      // Les données ont déjà été validées
      const result = await login(validation.data);

      // Vérifie si la connexion a réussi
      if (!result.success) {
        // Si le serveur retourne une erreur (ex: "Identifiants incorrects")
        // On l'affiche dans le champ "general"
        setErrors({ general: result.error });
        return; // Arrête ici
      }

      // ============================================
      // ÉTAPE 4: GÉRER LE "REMEMBER ME"
      // ============================================

      //Utilise validation.data.email 
      if (form.rememberMe) {
        localStorage.setItem("email", validation.data.email);
      } else {
        localStorage.removeItem("email");
      }

      if (["admin", "moderator"].includes(result.user.role)) {
        await login(validation.data);
        navigate("/BackOffice", { replace: true });
      } else {
        await login(validation.data);
        navigate("/Home", { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  // ============================================
  // 4. HOOK: Restaurer l'email sauvegardé au chargement
  // ============================================

  useEffect(() => {
    // S'exécute une seule fois au montage du composant ([] = dépendances vides)

    // Récupère l'email sauvegardé du localStorage
    const savedEmail = localStorage.getItem("email");

    // Si un email était sauvegardé
    if (savedEmail) {
      // Remplit le formulaire avec cet email et coche la case "rememberMe"
      setForm((prev) => ({
        ...prev,
        email: savedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  // ============================================
  // 5. FONCTION: Gestion du changement de la case "Remember Me"
  // ============================================

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Récupère si la case est cochée ou non
    const checked = event.target.checked;
    // Recouvre l'ensemble des possibilitées de récupérer l'email => directement dnas l'input
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    // Met à disposition les deux 
    const currentEmail = emailInput?.value || form.email;

    setForm({ ...form, rememberMe: checked });

    if (checked) {
      localStorage.setItem("email", currentEmail);
    } else {
      localStorage.removeItem("email");
    }
  };

  // ============================================
  // 6. RENDU (JSX)
  // ============================================

  return (
    <main className="profile-custom">
      {/* SECTION: En-tête avec logo et titre */}
      <section className="header">
        <section className="title-container">
          <img className="logo" src="/assets/logo-sl.png" alt="" />
          <span className="brand__title-black">SeniorLove</span>
        </section>
        <h1>Se connecter</h1>
      </section>

      {/* SECTION: Le formulaire de connexion */}
      <section className="form-fields">
        <form className="loginForm" onSubmit={handleSubmit}>
          {/* CHAMP: Email */}
          <label>
            Adresse mail
            {/* Affiche l'erreur email si elle existe */}
            {errors.email && <p className="error">{errors.email}</p>}
            <input
              name="email"
              type="text"
              placeholder="Email"
              value={form.email}
              onChange={handleInputChange}
              disabled={isSubmitting} // Désactive pendant la soumission
            />
          </label>

          {/* CHAMP: Mot de passe */}
          <label>
            Mot de passe
            {/* Affiche l'erreur password si elle existe */}
            {errors.password && <p className="error">{errors.password}</p>}
            <input
              name="password"
              type="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={handleInputChange}
              disabled={isSubmitting} // Désactive pendant la soumission
            />
          </label>

          {/* LIEN: Mot de passe oublié */}
          <Link className="link" to="/ForgetPassword">
            Mot de passe oublié ?
          </Link>

          {/* ERREUR GÉNÉRALE: Erreurs côté serveur (ex: identifiants invalides) */}
          {errors.general && <p className="error">{errors.general}</p>}

          {/* BOUTON: Soumettre le formulaire */}
          <div className="btn-container">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </div>
        </form>

        {/* SECTION: Case "Mémoriser mes identifiants" */}
        <div className="gender-section">
          <label>
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={onChange}
            />
            Mémoriser mes identifiants
          </label>
        </div>
      </section>

      {/* SÉPARATEUR */}
      <div className="separator">
        <span className="dot"></span>
      </div>

      {/* SECTION: Créer un compte */}
      <section className="btn--account">
        <p>Pas encore de compte ?</p>
        <button
          className="btn btn--primary"
          onClick={() => navigate("/Popupasso")}
        >
          Créer un compte
        </button>
      </section>
    </main>
  );
}

