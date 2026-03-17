import { useState, type ChangeEvent, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import axiosInstance from "../../axios/axiosInstance";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import "./MinimalPersonalizeMemberAccount.css";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const personalizeSchema = z.object({
    age_min: z
        .coerce
        .number({
            message: "Veuillez entrer un âge minimum.",
        })
        .min(60, "L'âge minimum doit être au moins 60 ans."),

    age_max: z
        .coerce
        .number({
            message: "Veuillez entrer un âge maximum.",
        })
        .max(110, "L'âge maximum ne peut pas dépasser 110 ans."),
}).refine(
    (data) => data.age_min <= data.age_max,
    {
        message: "L'âge minimum ne peut pas être supérieur à l'âge maximum.",
        path: ["age_min"],
    }
);

export default function MinimalPersonalizeMemberAccount() {
    const navigate = useNavigate();
    const location = useLocation();
    const firstPartForm = location.state;

    const [form, setForm] = useState({
        profile_picture: null as File | null,
        bio: "",
        interests: [] as string[],
        show_age: false,
        relation_type: "",
        age_min: "" as number | "",
        age_max: "" as number | "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
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

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = event.target;

        setForm(prev => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (event.target as HTMLInputElement).checked
                    : type === "number"
                        ? value === "" ? "" : Number(value)
                        : value
        }));
        setErrors(prev => ({ ...prev, [name]: "" }));
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
        setForm(prev => ({ ...prev, profile_picture: file }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        try {
            const validation = personalizeSchema.safeParse({
                age_min: form.age_min,
                age_max: form.age_max,
            });

            if (!validation.success) {
                const formattedErrors: Record<string, string> = {};
                validation.error.issues.forEach(issue => {
                    const field = issue.path[0];
                    if (field) formattedErrors[field as string] = issue.message;
                });
                setErrors(formattedErrors);
                return;
            }

            let uploadedUrl = "";

            if (form.profile_picture instanceof File) {
                const fileName = `profile-${Date.now()}-${form.profile_picture.name}`;

                const { error } = await supabase.storage
                    .from("profile-pictures")
                    .upload(fileName, form.profile_picture);

                if (!error) {
                    uploadedUrl = supabase.storage
                        .from("profile-pictures")
                        .getPublicUrl(fileName).data.publicUrl;
                }
            }

            const finalData = {
                ...firstPartForm,
                ...form,
                profile_picture: uploadedUrl || undefined,
            };

            await axiosInstance.post(
                "/auth/register",
                finalData
            );
            console.log("Profil enregistré Avec succès");
            alert("Profil enregistré Avec succès")
            navigate("/LoginForm")
        } catch (err) {
            console.error("Erreur enregistrement profil :", err);
            alert("Erreur enregistrement profil")
        }
    };
    // TODO:ajouter handleSubmit login


    return (
        <main className="profile-custom">
            <button className="btn-back" onClick={() => navigate("/CreateAccountMember")}>
                ← Retour
            </button>
            <section className="header">
                <section className="title-container">
                    <img className="logo" src="/assets/logo-sl.png" alt="" />
                    <span className="brand__title-black">SeniorLove</span>
                </section>
                <h1>Personnaliser votre profil</h1>
            </section>

            {/* Photo */}
            <label className="add-image-btn">
                {form.profile_picture ? (
                    <img
                        src={URL.createObjectURL(form.profile_picture)}
                        alt="preview"
                        className="preview-photo"
                    />
                ) : (
                    "Importer une photo"
                )}
                <input type="file" accept="image/*" onChange={handleImage} />
            </label>

            {/* Bio */}
            <section className="bio-section">
                <label>Bio du profil</label>
                <textarea
                    name="bio"
                    placeholder="Décrivez-vous..."
                    value={form.bio}
                    onChange={handleChange}
                />
            </section>

            {/* Intérêts */}
            <section className="interests-section">
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

            {/* Options */}
            <section className="options">
                <label>
                    <input
                        type="checkbox"
                        name="show_age"
                        checked={form.show_age}
                        onChange={handleChange}
                    />
                    Rendre visible mon âge
                </label>
            </section>

            {/* Relation */}
            <section className="relation-info">
                <select
                    name="relation_type"
                    value={form.relation_type}
                    onChange={handleChange}
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
            </section>

            {/* Tranche d'âge */}
            <section className="age-range">
                <p>Tranche d’âge recherchée</p>

                {errors.age_min && <p className="error">{errors.age_min}</p>}
                {errors.age_max && <p className="error">{errors.age_max}</p>}

                <div className="age-inputs">
                    <label>
                        Âge minimum
                        <input
                            type="number"
                            name="age_min"
                            min={60}
                            max={form.age_max || 110}
                            value={form.age_min}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        Âge maximum
                        <input
                            type="number"
                            name="age_max"
                            min={form.age_min || 60}
                            max={110}
                            value={form.age_max}
                            onChange={handleChange}
                        />
                    </label>
                </div>
            </section>

            <div className="btn-container">
                <button className="btn btn--primary" onClick={handleSubmit}>
                    Créer son compte
                </button>
            </div>
        </main >
    );
}
