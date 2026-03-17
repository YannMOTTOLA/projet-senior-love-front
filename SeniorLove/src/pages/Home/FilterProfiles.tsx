import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router";
import axiosInstance from "../../axios/axiosInstance";
import { z } from "zod";
import "./FilterProfiles.css";

const filtersSchema = z
  .object({
    ageMin: z.coerce.number().min(18).max(120).optional(),
    ageMax: z.coerce.number().min(18).max(120).optional(),
    relationType: z.string().optional(),
    interests: z.array(z.string()).optional(),
    city_id: z.coerce.number().optional(),
  })
  .refine(
    (data) => {
      if (data.ageMin === undefined || data.ageMax === undefined) return true;
      return data.ageMin <= data.ageMax;
    },
    {
      message: "L'âge minimum doit être inférieur ou égal à l'âge maximum.",
      path: ["general"],
    }
  );

type Interest = {
  id: number;
  name: string;
};

type City = {
  id: number;
  name: string;
  postal_code: string;
};

export default function FilterProfiles() {
  const navigate = useNavigate();
  const location = useLocation();

  const wrapperRef = useRef<HTMLLabelElement | null>(null);

  const [interestsList, setInterestsList] = useState<Interest[]>([]);
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [citySelected, setCitySelected] = useState(false); // ✅ CLÉ

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    ageMin: "",
    ageMax: "",
    relationType: "",
    interests: [] as string[],
    city_id: "",
    city_name: "",
  });

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };


  useEffect(() => {
    if (citySelected) return;

    if (form.city_name.length < 2) {
      setCityResults([]);
      setShowAutocomplete(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(
          `/cities/search?q=${form.city_name}`
        );
        setCityResults(res.data);
        setShowAutocomplete(true);
      } catch {
        setCityResults([]);
        setShowAutocomplete(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [form.city_name, citySelected]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);


  useEffect(() => {
    const params = new URLSearchParams(location.search);

    (async () => {
      try {
        const [, interestsRes] = await Promise.all([
          axiosInstance.get("/profile/me"),
          axiosInstance.get("/auth/interests"),
        ]);

        

        setInterestsList(interestsRes.data);

        setForm((prev) => ({
          ...prev,
          ageMin: params.get("ageMin") ?? "",
          ageMax: params.get("ageMax") ?? "",
          relationType: params.get("relationType") ?? "",
          interests: params.get("interests")?.split(",") ?? [],
          city_id: params.get("city_id") ?? "",
          city_name: params.get("city_id") ? "Ville sélectionnée" : "",
        }));

        if (params.get("city_id")) {
          setCitySelected(true);
        }
      } catch {
        setErrors({ general: "Erreur lors du chargement des filtres." });
      }
    })();
  }, [location.search]);


  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const rawData = {
        ageMin: form.ageMin || undefined,
        ageMax: form.ageMax || undefined,
        relationType: form.relationType || undefined,
        interests: form.interests,
        city_id: form.city_id ? Number(form.city_id) : undefined,
      };

      const validation = filtersSchema.safeParse(rawData);

      if (!validation.success) {
        const formatted: Record<string, string> = {};
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0];
          if (field) formatted[field as string] = issue.message;
        });
        setErrors(formatted);
        return;
      }

      const params = new URLSearchParams();

      if (validation.data.ageMin !== undefined)
        params.set("ageMin", String(validation.data.ageMin));
      if (validation.data.ageMax !== undefined)
        params.set("ageMax", String(validation.data.ageMax));
      if (validation.data.relationType)
        params.set("relationType", validation.data.relationType);
      if (validation.data.interests?.length)
        params.set("interests", validation.data.interests.join(","));
      if (validation.data.city_id)
        params.set("city_id", String(validation.data.city_id));

      navigate(`/home?${params.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <main className="profile-custom">
      <section className="header">
        <h1>Affiner la recherche</h1>
      </section>

      <section className="form-fields">
        <form className="loginForm" onSubmit={handleSubmit}>
          {/* Ville */}
          <label ref={wrapperRef}>
            Ville
            <input
              type="text"
              value={form.city_name}
              placeholder="Commencez à taper une ville"
              onChange={(e) => {
                setCitySelected(false);
                setForm((p) => ({
                  ...p,
                  city_name: e.target.value,
                  city_id: "",
                }));
              }}
              disabled={isSubmitting}
            />

            {showAutocomplete && cityResults.length > 0 && (
              <ul className="autocomplete-list">
                {cityResults.map((city) => (
                  <li
                    key={city.id}
                    onClick={() => {
                      setForm((p) => ({
                        ...p,
                        city_id: String(city.id),
                        city_name: `${city.name} (${city.postal_code})`,
                      }));
                      setCityResults([]);
                      setShowAutocomplete(false);
                      setCitySelected(true); // ✅ STOP DÉFINITIF
                    }}
                  >
                    {city.name} ({city.postal_code})
                  </li>
                ))}
              </ul>
            )}
          </label>

          {/* Relation */}
          <label>
            Type de relation
            <select
              value={form.relationType}
              disabled={isSubmitting}
              onChange={(e) =>
                setForm((p) => ({ ...p, relationType: e.target.value }))
              }
            >
              <option value="">Choisir une relation</option>
              <option value="amicale">Relation amicale</option>
              <option value="amoureuse">Relation amoureuse</option>
              <option value="les_deux">Les deux</option>
              <option value="amicale_homme">Amicale homme</option>
              <option value="amoureuse_homme">Amoureuse homme</option>
              <option value="les_deux_homme">Les deux homme</option>
              <option value="amicale_femme">Amicale femme</option>
              <option value="amoureuse_femme">Amoureuse femme</option>
              <option value="les_deux_femme">Les deux femme</option>
            </select>
          </label>

          {/* Âges */}
          <div className="form-row">
            <label>
              Âge minimum
              <input
                inputMode="numeric"
                value={form.ageMin}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ageMin: e.target.value }))
                }
              />
            </label>

            <label>
              Âge maximum
              <input
                inputMode="numeric"
                value={form.ageMax}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ageMax: e.target.value }))
                }
              />
            </label>
          </div>

          {/* Intérêts */}
          <section className="interests-section">
            <p>Centres d’intérêts</p>
            <div className="interests-grid">
              {interestsList.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`interest-chip ${form.interests.includes(item.name) ? "selected" : ""
                    }`}
                  onClick={() => toggleInterest(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </section>

          {errors.general && <p className="error">{errors.general}</p>}

          <button type="submit" className="btn btn--primary">
            Appliquer les filtres
          </button>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => navigate("/home")}
          >
            Annuler
          </button>
        </form>
      </section>
    </main>
  );
}