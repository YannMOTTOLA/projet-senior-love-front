import { z } from "zod";
//import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import type { ChangeEvent, FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import axiosInstance from "../../axios/axiosInstance";
import "../MemberAccount/MinimalPersonalizeMemberAccount.css";
import "../MemberAccount/CreateAccountMember.css";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const createEventSchema = z.object({
    title: z.string().min(1, "Veuillez rensigner un titre pour votre véènement"),
    description: z.string().min(1, "La description de l'évènement est obligatoire"),
    address: z.string().min(1, "L'adresse ou lieu est obligatoire"),
    city: z.string().min(2, "Ville invalide."),
    postal_code: z.string().regex(/^\d{5}$/, "Code postal invalide."),
    start_datetime: z.string().nonempty("Veuillez entrer une date et un heure pour le début de votre évènement."),
    end_datetime: z.string().nonempty("Veuillez entrer vune date et une heure pour la fin de votre évènement."),
    visibility: z.enum(["public", "private"], "Veuillez indiqué si votre évènement est public ou privé"),
    max_participants: z.coerce.number({ message: "Veuillez entrer un nombre (entier) de participant." }).int().min(1, "Le nombre de participants doit être au moins 1"),
    illustration_url: z.string().min(1, "Une image ou photo est obligatoire."),
    interests: z.array(z.string().min(1)).min(1, "Au moins un intérêt doit être sélectionné"),
});

type visibility = z.infer<typeof createEventSchema.shape.visibility>;

// 1. Crée un type séparé pour le formulaire (avec strings)
type FormInput = {
    title: string;
    description: string;
    address: string;
    city: string;
    postal_code: string;
    start_datetime: string;
    end_datetime: string;
    visibility: "public" | "private";
    max_participants: string; // ← STRING pour l'input
    illustration_url: File | null,
    interests: string[];
    city_id?: number;
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

export default function createEvent() {

    const navigate = useNavigate();

    //const navigate = useNavigate();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // État du formulaire
    const [form, setForm] = useState<FormInput>({
        title: "",
        description: "",
        address: "",
        city: "",
        postal_code: "",
        start_datetime: "",
        end_datetime: "",
        visibility: "public" as visibility,
        max_participants: "",
        illustration_url: null as File | null,
        interests: [],
    });


    const [cityQuery, setCityQuery] = useState("");
    const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
    const [citySelected, setCitySelected] = useState(false);
    const [interestsList, setInterestList] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        const fetchInterests = async () => {
            try {
                const res = await axiosInstance.get("/auth/interests");
                setInterestList(res.data);
            } catch (err) {
                console.error("Erreur chargement intérêts :", err);
            }
        };
        fetchInterests();
    }, []);


    useEffect(() => {
        if (citySelected) return;

        if (cityQuery.length < 2) {
            setCitySuggestions([]);
            return;
        }
        const timeout = setTimeout(() => {
            axiosInstance.get(`/cities/search?q=${cityQuery}`)
                .then(res => setCitySuggestions(res.data))
                .catch(() => setCitySuggestions([]));
        }, 300);

        return () => clearTimeout(timeout);
    }, [cityQuery, citySelected]);


    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
        // Effacer l'erreur au changement du champ
        setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
    };

    const toggleInterest = (interest: string) => {
        setForm(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setForm(prev => ({ ...prev, illustration_url: file }));
    };


    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        // Empêche le rechargement de la page par défaut
        event.preventDefault();
        // Réinitialise les erreurs précédentes
        setErrors({});
        // Indique qu'on est en train de traiter la requête
        setIsSubmitting(true);

        try {
            let uploadedUrl = "";

            if (form.illustration_url instanceof File) {
                const fileName = `event-${Date.now()}-${form.illustration_url.name}`;

                const { error } = await supabase.storage
                    .from("profile-pictures")
                    .upload(fileName, form.illustration_url);

                if (!error) {
                    uploadedUrl = supabase.storage
                        .from("profile-pictures")
                        .getPublicUrl(fileName).data.publicUrl;
                }
            }

            const validation = createEventSchema.safeParse({
                title: form.title,
                description: form.description,
                address: form.address,
                city: form.city,
                postal_code: form.postal_code,
                start_datetime: form.start_datetime,
                end_datetime: form.end_datetime,
                visibility: form.visibility,
                max_participants: parseInt(form.max_participants, 10),
                illustration_url: uploadedUrl,
                interests: form.interests,
            });



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


            const finalData = {
                ...validation.data,
                city_id: form.city_id,
                city_name: form.city_name,
                latitude: form.latitude,
                longitude: form.longitude,
                department_code: form.department_code,
                department_name: form.department_name,

            };

            await axiosInstance.post(
                "/event",
                finalData
            );
            console.log("Evènement enregistré Aaec succès");
            alert("Evènement enregistré Avec succès")
            navigate("/Profile/me")

        } catch (err) {
            console.error("Erreur enregistrement évènement:", err);
            alert("Erreur enregistrement évènement")
        } finally {
            setIsSubmitting(false);
        }
    }


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

            {/* Photo */}
            <label className="add-image-btn">
                {form.illustration_url ? (
                    <img
                        src={URL.createObjectURL(form.illustration_url)}
                        alt="preview"
                        className="preview-photo"
                    />
                ) : (
                    "Importer une photo ou une image"
                )}
                <input type="file" accept="image/*" onChange={handleImage} />
            </label>

            {/* SECTION: Le formulaire de création d'evenement*/}
            <section className="form-fields">
                <form className="loginForm" onSubmit={handleSubmit}>
                    <section className="form-fields">

                        {errors.title && <p className="error">{errors.title}</p>}
                        <input type="text" name="title" placeholder="Titre" value={form.title} onChange={handleChange} />


                        {/* Intérêts */}
                        <section className="interests-section">
                            {errors.interests && <p className="error">{errors.intesrests}</p>}
                            <p>Centres d'intérêts</p>
                            <div className="interests-grid">
                                {interestsList.map(item => (
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

                        {errors.description && <p className="error">{errors.description}</p>}
                        <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} />

                        {errors.address && <p className="error">{errors.address}</p>}
                        <input type="text" name="address" placeholder="Adress" value={form.address} onChange={handleChange} />

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
                        {errors.start_datetime && <p className="error">{errors.start_datetime}</p>}
                        <input type="datetime-local" name="start_datetime" value={form.start_datetime} onChange={handleChange} />

                        {errors.end_datetime && <p className="error">{errors.end_datetime}</p>}
                        <input type="datetime-local" name="end_datetime" value={form.end_datetime} onChange={handleChange} />

                        {/* Visibilité*/}
                        <section className="gender-countainer">

                            {errors.visibility && <p className="error">{errors.gender}</p>}
                            <div className="gender-section">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="visibility"
                                        value="public"
                                        checked={form.visibility === "public"}
                                        onChange={() => setForm({ ...form, visibility: "public" })}
                                    />
                                    Public
                                </label>

                                <label>
                                    <input
                                        type="checkbox"
                                        name="visibility"
                                        value="private"
                                        checked={form.visibility === "private"}
                                        onChange={() => setForm({ ...form, visibility: "private" })}
                                    />
                                    Privé
                                </label>

                                {errors.max_participants && <p className="error">{errors.max_participants}</p>}
                                <input type="number" name="max_participants" placeholder="Nombre de participants" value={form.max_participants} onChange={handleChange} />

                            </div>
                        </section>


                        {/* ERREUR GÉNÉRALE: Erreurs côté serveur  */}
                        {errors.general && <p className="error">{errors.general}</p>}

                        {/* BOUTON: Soumettre le formulaire */}
                        <div className="btn-container">
                            <button
                                type="submit"
                                className="btn btn--primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Création en cours..." : "Créer"}
                            </button>
                        </div>
                    </section>
                </form>

            </section>
        </main >
    )
}
