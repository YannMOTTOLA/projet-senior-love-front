import type { FormEvent } from "react";
import { useState } from "react";
import { z } from "zod";
import { Auth } from "../_services/account.service";

// Schéma de validation Zod corrigé
const loginSchema = z.object({
  email: z.email("Email invalide").min(1, "Adresse email requise."),
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Hook personnalisé pour gérer l'authentification
export function useAuthHandler() {
  // Récupère la fonction login du hook d'authentification
  const { login } = Auth();
  
  // State pour stocker les erreurs de validation et d'API
  // Record<string, string> = { email: "message", password: "message", general: "message" }
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State pour indiquer si on est en train de soumettre le formulaire
  // Utile pour désactiver le bouton et afficher un loader
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Empêche le rechargement de la page
    event.preventDefault();
    
    // Réinitialise les erreurs précédentes
    setErrors({});
    
    // Active l'état de chargement
    setIsSubmitting(true);

    try {
      // Récupération des données du form
      const form = event.currentTarget;
      const formData = new FormData(form);
      
      // Extrait les valeurs des inputs
      const rawData = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      // Validation des données
      const validation = loginSchema.safeParse(rawData);

      // Si la validation échoue
      if (!validation.success) {
        // Transforme les erreurs Zod en objet { field: message }
        const formattedErrors: Record<string, string> = {};
        validation.error.issues.forEach((issue) => {
          // issue.path[0] contient le nom du champ ("email" ou "password")
          const field = issue.path[0];
          if (field) {
            // Stocke le message d'erreur pour ce champ
            formattedErrors[field as string] = issue.message;
          }
        });
        
        // Met à jour le state avec les erreurs
        setErrors(formattedErrors);
        
        // Désactive le loading
        setIsSubmitting(false);
        
        // Arrête l'exécution (pas de call API si la validation échoue)
        return;
      }

      // validation.data contient les données validées et typées
      const response = await login(validation.data);

      if (response.success) {
        // Connexion réussie
        // affiche dans la console pour le test
        console.log("Utilisateur connecté :", response.user?.name);
        
        // Optionnel : Afficher une notification de succès => Popup?
        // toast.success("Connexion réussie !");
        
        // Optionnel : Rediriger vers le dashboard ou page de profils qui match
        // navigate("/dashboard");
      } else {
        // Échec de la connexion
        // Affiche l'erreur renvoyée par l'API
        // "L'email et le mot de passe ne correspondent pas"
        setErrors({ 
          general: response.error || "Une erreur est survenue." 
        });
      }
    } catch (error) {
      // Cette partie ne devrait normalement JAMAIS être exécutée
      // car le hook useAuth gère toutes les erreurs
      // C'est une sécurité au cas où
      console.error("Erreur inattendue :", error);
      setErrors({ 
        general: "Une erreur inattendue est survenue. Veuillez réessayer." 
      });
    } finally {
      // Désactive l'état de chargement dans tous les cas
      setIsSubmitting(false);
    }
  };

  // Retourne tout ce dont les composants ont besoin
  return {
    handleSubmit,
    errors,
    isSubmitting,
  };
}