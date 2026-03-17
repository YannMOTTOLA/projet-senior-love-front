import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams } from "react-router";
import { createClient } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../axios/axiosInstance";
import LogoutButton from "../Auth/LogoutButton";
import EventCard, { type EventListItem } from "../../components/events/EventCard";
import { useNavigate } from "react-router";
import "./ProfilePage.css";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

type City = {
    id: number;
    name: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    department_id: number;
};

type Profile = {
    shortId: string;
    name: string;
    city: City;
    profile_picture: string;
    bio?: string;
    verified: boolean;
    isOwner: boolean;
    events?: EventListItem[];
};

export default function ProfilePage() {
    const { shortId } = useParams<{ shortId: string }>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [editMode, setEditMode] = useState(false);

    const [bioDraft, setBioDraft] = useState("");
    const [cityDraft, setCityDraft] = useState("");
    const [photoDraft, setPhotoDraft] = useState<string | null>(null);

    const { logout } = useAuth();
    const navigate = useNavigate();

    const normalizeEvent = (evt: any): EventListItem => ({
        id: evt.id,
        title: evt.title,
        description: evt.description,
        city: evt.city,
        start_datetime: evt.start_datetime,
        end_datetime: evt.end_datetime,
        illustration_url: evt.illustration_url,
        max_participants: evt.max_participants,
        current_participants: evt.current_participants,
        available_spots: evt.available_spots,
        is_participant: evt.is_participant,
    });


    useEffect(() => {
        if (!shortId) return;

        axiosInstance
            .get(`/profile/${shortId}`)
            .then((res) => {
                setProfile({
                    ...res.data,
                    events: (res.data.events || []).map(normalizeEvent),
                });
                setBioDraft(res.data.bio || "");
                setCityDraft(res.data.city.name);
                setPhotoDraft(res.data.profile_picture);
            })
            .catch(() => {
                console.error("Erreur chargement profil");
            });
    }, [shortId]);

    const handlePhotoClick = () => {
        if (!editMode) return;
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        const fileName = `profile-${profile.shortId}-${Date.now()}`;
        await supabase.storage.from("profile-pictures").upload(fileName, file);

        const publicUrl = supabase.storage
            .from("profile-pictures")
            .getPublicUrl(fileName).data.publicUrl;

        setPhotoDraft(publicUrl);
    };

    const handleUpdate = async () => {
        if (!profile) return;

        await axiosInstance.patch("/profile", {
            bio: bioDraft,
            city: cityDraft,
            profile_picture: photoDraft,
        });

        setProfile({
            ...profile,
            bio: bioDraft,
            city: {
                ...profile.city,
                name: cityDraft,
            },
            profile_picture: photoDraft || profile.profile_picture,
        });

        setEditMode(false);
    };

    const toggleJoin = async (eventId: string) => {
        if (!profile) return;

        const current = profile.events?.find((e) => e.id === eventId);
        if (!current) return;

        const isParticipant = Boolean(current.is_participant);

        isParticipant
            ? await axiosInstance.delete(`/events/${eventId}/join`)
            : await axiosInstance.post(`/events/${eventId}/join`);

        const refreshed = await axiosInstance.get(`/profile/${profile.shortId}`);

        setProfile({
            ...refreshed.data,
            events: (refreshed.data.events || []).map(normalizeEvent),
        });
    };


    const handleDeleteAccount = async () => {
        const ok1 = window.confirm("⚠️ Supprimer ton compte ?\n\nCette action est irréversible.");
        if (!ok1) return;

        const typed = window.prompt('Tape "SUPPRIMER" pour confirmer la suppression de ton compte :');
        if (typed !== "SUPPRIMER") return;

        try {
            await axiosInstance.delete("/profile");
            logout();
        } catch (e) {
            alert("Impossible de supprimer le compte.");
        }
    };

    if (!profile) return <p>Chargement…</p>;

    return (
        <main className="profile">
            <section className="profile__header">
                {profile.isOwner && (
                    <button
                        className="profile__danger-btn profile__danger-btn--left"
                        onClick={handleDeleteAccount}
                        type="button"
                        aria-label="Supprimer mon compte"
                    >
                        <Trash2 size={16} strokeWidth={2} />
                    </button>
                )}

                <div
                    className={`profile__avatar-wrapper ${editMode ? "is-editing" : ""}`}
                    onClick={handlePhotoClick}
                >
                    <img
                        src={photoDraft || profile.profile_picture}
                        alt={profile.name}
                        className="profile__avatar"
                    />

                    {profile.verified && <span className="profile__status-dot" />}

                    {editMode && (
                        <div className="profile__avatar-overlay">Modifier la photo</div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handlePhotoChange}
                    />
                </div>

                {profile.isOwner && (
                    <div className="profile__toolbar">
                        <LogoutButton className="profile__icon-btn" iconOnly />
                        <button
                            className="profile__icon-btn"
                            onClick={() => setEditMode((v) => !v)}
                            aria-label="Modifier le profil"
                            type="button"
                        >
                            <Pencil size={16} strokeWidth={2} />
                        </button>
                    </div>
                )}

                <h1 className="profile__name">
                    <span className="profile__name-text">{profile.name}</span>
                    {!profile.isOwner && <span className="profile__tag">#{shortId}</span>}
                </h1>

                {editMode ? (
                    <input
                        className="profile__city-input"
                        value={cityDraft}
                        onChange={(e) => setCityDraft(e.target.value)}
                    />
                ) : (
                    <p className="profile__subtitle">{profile.city.name}</p>
                )}
            </section>

            {!profile.isOwner && (
                <button
                    className="profile__save-btn"
                    onClick={async () => {
                        try {
                            await axiosInstance.get(`/messages/sendRequest/${profile.shortId}`);
                            window.location.href = "/messages";
                        } catch (e) {
                            alert("Impossible d'envoyer la demande");
                        }
                    }}
                >
                    Envoyer un message
                </button>
            )}

            <section className="profile__bio">
                {editMode ? (
                    <textarea
                        value={bioDraft}
                        onChange={(e) => setBioDraft(e.target.value)}
                    />
                ) : (
                    <p>{profile.bio || "Aucune description"}</p>
                )}
            </section>

            {editMode && (
                <div className="profile__actions">
                    <button className="profile__save-btn" onClick={handleUpdate}>
                        Mettre à jour
                    </button>
                </div>
            )}

            {profile.isOwner && (
                <section className="profile__events">
                    <div className="profile__events-header">
                        <h2>Mes événements</h2>

                        <button
                            className="profile__create-event-btn"
                            onClick={() => {
                                navigate("/CreateEvent");
                            }}
                            type="button"
                        >
                            Créer un évènement
                        </button>
                    </div>

                    {profile.events && profile.events.length > 0 ? (
                        <div className="profile__events-list">
                            {profile.events.map((evt) => (
                                <EventCard
                                    key={evt.id}
                                    event={evt}
                                    actionLabel={
                                        evt.is_participant ? "Se désinscrire" : "S'inscrire"
                                    }
                                    actionDisabled={
                                        !evt.is_participant && evt.available_spots <= 0
                                    }
                                    onAction={toggleJoin}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="profile__events-empty">
                            <p>Aucun évènement pour le moment</p>
                        </div>
                    )}
                </section>
            )}

        </main>
    );
}
