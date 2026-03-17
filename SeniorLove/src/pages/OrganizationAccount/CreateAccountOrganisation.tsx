import { useNavigate } from "react-router";
import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import axiosInstance from "../../axios/axiosInstance";

import "./CreateAccountOrganisation.css";

/* ===============================
   ZOD
================================ */

const createOrganisationSchema = z.object({
  siret: z.string().regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres."),
  name: z.string().min(1, "Le nom de l'association est requis."),
  email: z.string().email("Adresse email invalide."),
  city_id: z.number({ message: "Ville invalide." }),
  postal_code: z.string().regex(/^\d{5}$/, "Code postal invalide."),
  creation_date: z.string().nonempty("Veuillez entrer une date de création."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule.")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Le mot de passe doit contenir un caractère spécial."),
  confirmPassword: z.string(),
  logo_url: z.string().url().optional().or(z.literal("")),
});

type OrganisationFormData = z.infer<typeof createOrganisationSchema> & {
  city_name?: string;
  latitude?: number;
  longitude?: number;
  department_code?: string;
  department_name?: string;
};


type CitySuggestion = {
  id: number;
  name: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  department_code: string;
  department_name: string;
};


function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

/* ===============================
   COMPONENT
================================ */

export default function CreateAccountOrganisation() {
  const navigate = useNavigate();

  const [form, setForm] = useState<OrganisationFormData>({
    siret: "",
    name: "",
    email: "",
    city_id: 0,
    postal_code: "",
    creation_date: "",
    password: "",
    confirmPassword: "",
    logo_url: "",
    latitude: undefined,
    longitude: undefined,
    department_code: undefined,
    department_name: undefined,
  });


  /* ===== MOT DE PASSE — IDENTIQUE AUX MEMBRES ===== */

  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  /* ===== AUTOCOMPLETE VILLE ===== */

  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [citySelected, setCitySelected] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (citySelected) return;

    if (cityQuery.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/cities/search?q=${cityQuery}`);
        setCitySuggestions(res.data);
      } catch {
        setCitySuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [cityQuery, citySelected]);


  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((p) => ({
      ...p,
      [name]: value,
    }));

    if (name === "password") {
      setPasswordRules({
        minLength: value.length >= 8,
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setLogoFile(file);
  };

  const submit = async () => {
    const validation = createOrganisationSchema.safeParse(form);
    const allRulesValid = Object.values(passwordRules).every(Boolean);

    if (!validation.success) {
      const formatted: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field) formatted[field as string] = issue.message;
      });
      setErrors(formatted);
      return;
    }

    if (!allRulesValid) {
      setErrors({
        password: "Votre mot de passe ne respecte pas toutes les règles.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "Les mots de passe ne correspondent pas." });
      return;
    }

    setIsSubmitting(true);

    try {
      let logo_url: string | undefined;

      if (logoFile) {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Supabase manquant");

        const fileName = `org-logo-${Date.now()}-${logoFile.name}`;
        await supabase.storage
          .from("profile-pictures")
          .upload(fileName, logoFile);

        logo_url = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName).data.publicUrl;
      }

      await axiosInstance.post("/auth/register/organization", {
        ...form,
        logo_url,
      });

      alert("Compte association créé avec succès");
      navigate("/LoginForm");
    } catch {
      setErrors({ general: "Erreur lors de la création du compte." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="create-organisation">
      <button className="btn-back" onClick={() => navigate("/Popupasso")}>
        ← Retour
      </button>

      <section className="header">
        <h1>Créer un compte association</h1>
      </section>

      {errors.general && <p className="error error--center">{errors.general}</p>}

      <section className="form-fields">
        <input name="siret" placeholder="SIRET" value={form.siret} onChange={handleChange} />
        <input name="name" placeholder="Nom de l'association" value={form.name} onChange={handleChange} />

        {/* Logo */}
        <div className="logo-row">
          <div className="logo-preview">
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} alt="preview" />
            ) : (
              <span className="logo-placeholder">Logo</span>
            )}
          </div>

          <label className="logo-upload">
            {logoFile ? "Changer le logo" : "Importer un logo"}
            <input type="file" accept="image/*" onChange={handleLogo} />
          </label>
        </div>

        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />

        {/* VILLE AUTOCOMPLETE */}
        <input
          placeholder="Commencez à taper la ville"
          value={cityQuery}
          onChange={(e) => {
            setCitySelected(false);
            setCityQuery(e.target.value);
          }}
        />

        {citySuggestions.length > 0 && (
          <ul className="city-suggestions">
            {citySuggestions.map((city) => (
              <li
                key={city.id}
                onClick={() => {
                  setForm((p) => ({
                    ...p,
                    city_id: city.id,
                    city_name: city.name,
                    postal_code: city.postal_code,
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

        <input name="postal_code" placeholder="Code postal" value={form.postal_code} readOnly />
        <input type="date" name="creation_date" value={form.creation_date} onChange={handleChange} />

        {/* PASSWORD */}
        {errors.password && <p className="error">{errors.password}</p>}
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
        />

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

        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmer le mot de passe"
          value={form.confirmPassword}
          onChange={handleChange}
        />
      </section>

      <div className="btn-coutainer">
        <button className="btn btn--primary continue-btn" onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer le compte"}
        </button>
      </div>
    </main>
  );
}
