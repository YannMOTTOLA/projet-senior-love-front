import { useNavigate } from "react-router";
import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";
import { z } from "zod";

import "./CreateAccountMember.css";

const createAccountSchema = z.object({
  gender: z.enum(["homme", "femme", "autre"], "Veuillez sélectionner un genre"),
  name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
  email: z.email("Adresse email invalide."),
  phone_number: z
    .string()
    .min(10, "Numéro de téléphone invalide.")
    .regex(/^[0-9+\s-]+$/, "Numéro de téléphone invalide."),
  date_of_birth: z.string().nonempty("Veuillez entrer votre date de naissance."),
  city: z.string().min(2, "Ville invalide."),
  postal_code: z
    .string()
    .regex(/^\d{5}$/, "Code postal invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule.")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Le mot de passe doit contenir un caractère spécial."
    ),
  confirmPassword: z.string(),
});

// Creation du type Typescript Gender à partir du schéma Zod du gender
type Gender = z.infer<typeof createAccountSchema.shape.gender>;
// génération du type TypeScript du fomulaire à partir du schéma Zod juste au dessus
type FormData = z.infer<typeof createAccountSchema> & {
  city_id?: number;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  department_code?: string;
  department_name?: string;
};

export default function CreateAccountMember() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    gender: "" as Gender,
    name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    city: "",
    postal_code: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  type CitySuggestion = {
    id: number;
    name: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    department_code: string;
    department_name: string;
  };

  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [citySelected, setCitySelected] = useState(false);



  // Objet contenant les messages d'erreurs indexés par nom de champ.
  // Exemple : errors.email → "Adresse email invalide".
  // Plus pratique qu'un tableau car chaque champ possède sa propre erreur.
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

    if (event.target.name === "password") {
      const value = event.target.value;

      setPasswordRules({
        minLength: value.length >= 8,
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }

    // Effacer l'erreur au changement du champ
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const goNext = async () => {
    const validation = createAccountSchema.safeParse(form);
    const allRulesValid = Object.values(passwordRules).every(Boolean);

    if (!validation.success) {
      const formattedErrors: Record<string, string> = {};

      validation.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field) formattedErrors[field as string] = issue.message;
      });

      setErrors(formattedErrors);
      return;
    }

    if (!allRulesValid) {
      setErrors({ password: "Votre mot de passe ne respecte pas toutes les règles." });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "Les mots de passe ne correspondent pas." });
      return;
    }

    const emailTaken = await checkEmailExists(form.email);

    if (emailTaken) {
      setErrors({ email: "Cet email est déjà utilisé." });
      return;
    }

    // On retire confirmPassword des données à envoyer
    const { confirmPassword, ...dataToSend } = form;

    // On envoi les donné de form sur la prochaine page pour terminer l'écriture des données
    navigate("/MinimalPersonalizeMemberAccount", {
      state: dataToSend,
    });
  };

  const checkEmailExists = async (email: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/auth/email/${email}`);

      if (res.status === 409) {
        return true; // email pris
      }
      return false; // email disponible

    } catch (err) {
      console.error("Erreur vérification email :", err);
      return false;
    }
  };

  useEffect(() => {
    if (citySelected) return;

    if (cityQuery.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetch(`http://localhost:3001/api/cities/search?q=${cityQuery}`)
        .then(res => res.json())
        .then(data => setCitySuggestions(data))
        .catch(() => setCitySuggestions([]));
    }, 300);

    return () => clearTimeout(timeout);
  }, [cityQuery, citySelected]);



  return (
    <main className="create-account">
      <button className="btn-back" onClick={() => navigate("/Popupasso")}>
        ← Retour
      </button>
      <section className="header">
        <section className="title-container">
          <img className="logo" src="/assets/logo-sl.png" alt="" />
          <span className="brand__title-black">SeniorLove</span>
        </section>
        <h1>Créer un compte</h1>
      </section>

      {/* Genre */}
      <section className="gender-countainer">

        {errors.gender && <p className="error">{errors.gender}</p>}
        <div className="gender-section">
          <label>
            <input
              type="checkbox"
              name="gender"
              value="homme"
              checked={form.gender === "homme"}
              onChange={() => setForm({ ...form, gender: "homme" })}
            />
            Homme
          </label>

          <label>
            <input
              type="checkbox"
              name="gender"
              value="femme"
              checked={form.gender === "femme"}
              onChange={() => setForm({ ...form, gender: "femme" })}
            />
            Femme
          </label>

          <label>
            <input
              type="checkbox"
              name="gender"
              value="autre"
              checked={form.gender === "autre"}
              onChange={() => setForm({ ...form, gender: "autre" })}
            />
            Autre
          </label>
        </div>
      </section>

      {/* Formulaire */}
      <section className="form-fields">

        {errors.name && <p className="error">{errors.name}</p>}
        <input type="text" name="name" placeholder="Prénom" value={form.name} onChange={handleChange} />

        {errors.email && <p className="error">{errors.email}</p>}
        <input type="email" name="email" placeholder="Adresse mail" value={form.email} onChange={handleChange} />

        {errors.phone_number && <p className="error">{errors.phone_number}</p>}
        <input type="tel" name="phone_number" placeholder="Numéro de téléphone" value={form.phone_number} onChange={handleChange} />

        {errors.date_of_birth && <p className="error">{errors.date_of_birth}</p>}
        <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />

        {/* Ville avec autocomplétion */}
        {errors.city && <p className="error">{errors.city}</p>}
        <input
          type="text"
          placeholder="Commencez à taper votre ville"
          value={cityQuery}
          onChange={(e) => {
            setCitySelected(false);
            setCityQuery(e.target.value);
          }}
        />


        {citySuggestions.length > 0 && (
          <ul className="city-suggestions">
            {citySuggestions.map(city => (
              <li
                key={city.id}
                onClick={() => {
                  setForm(prev => ({
                    ...prev,
                    city: city.name,
                    city_name: city.name,
                    postal_code: city.postal_code,
                    city_id: city.id,
                    latitude: city.latitude,
                    longitude: city.longitude,
                    department_code: city.department_code,
                    department_name: city.department_name,
                  }));

                  setCityQuery(`${city.name} (${city.postal_code})`);
                  setCitySuggestions([]);
                  setCitySelected(true);
                }}
              >
                {city.name} – {city.postal_code}
              </li>

            ))}
          </ul>
        )}

        {/* Code postal auto */}
        <input
          type="text"
          name="postal_code"
          placeholder="Code postal"
          value={form.postal_code}
          readOnly
        />


        {/* Password */}
        {errors.password && <p className="error">{errors.password}</p>}
        <input type="password" name="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} />

        <ul className="password-rules">
          <li className={passwordRules.minLength ? "valid" : "invalid"}>
            {passwordRules.minLength ? "✓" : "✗"} Au moins 8 caractères
          </li>
          <li className={passwordRules.upper ? "valid" : "invalid"}>
            {passwordRules.upper ? "✓" : "✗"} Une majuscule
          </li>
          <li className={passwordRules.lower ? "valid" : "invalid"}>
            {passwordRules.lower ? "✓" : "✗"} Une minuscule
          </li>
          <li className={passwordRules.number ? "valid" : "invalid"}>
            {passwordRules.number ? "✓" : "✗"} Un chiffre
          </li>
          <li className={passwordRules.special ? "valid" : "invalid"}>
            {passwordRules.special ? "✓" : "✗"} Un caractère spécial
          </li>
        </ul>

        {/* Confirm Password */}
        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
        <input type="password" name="confirmPassword" placeholder="Confirmer le mot de passe" value={form.confirmPassword} onChange={handleChange} />

      </section>

      <div className="btn-coutainer">
        <button className="btn btn--primary continue-btn" onClick={goNext}>
          Continuer
        </button>
      </div>

    </main>
  );
}
