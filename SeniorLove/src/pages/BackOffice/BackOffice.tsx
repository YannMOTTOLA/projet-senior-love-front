import { useEffect, useState } from "react";
import axiosInstance from "../../axios/axiosInstance";
import LogoutButton from "../Auth/LogoutButton";
import "./BackOffice.css";

type Member = {
    id: string;
    shortId: string;
    name: string;
    email: string;
    city: {
        id: true,
        name: true,
        postal_code: true,
    };
    active: boolean;
    created_at: string;
    banned_until?: string | null;
};

type View = "all" | "latest" | "banned";

export default function BackOffice() {
    const [members, setMembers] = useState<Member[]>([]);
    const [newLastWeek, setNewLastWeek] = useState<number>(0);
    const [view, setView] = useState<View>("all");
    const [search, setSearch] = useState("");
    const [, forceTick] = useState(0);

    /* refresh chrono every second */
    useEffect(() => {
        const interval = setInterval(() => {
            forceTick(t => t + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchStats();
        fetchMembers();
    }, [view]);

    const fetchMembers = async () => {
        let url = "/backOffice/members";

        if (view === "latest") {
            url = "/backOffice/members/latest";
        }

        if (view === "banned") {
            url = "/backOffice/members/desactivated";
        }

        const res = await axiosInstance.get(url);
        setMembers(res.data);
    };

    const fetchStats = async () => {
        const res = await axiosInstance.get(
            "/backOffice/members/stats/new-last-week"
        );
        setNewLastWeek(res.data.newMembersLastWeek);
    };

    const deactivate48h = async (id: string) => {
        await axiosInstance.patch(
            `/backOffice/members/${id}/deactivate-48h`
        );
        fetchMembers();
    };

    const deactivate1Week = async (id: string) => {
        await axiosInstance.patch(
            `/backOffice/members/${id}/deactivate-1week`
        );
        fetchMembers();
    };

    const activate = async (id: string) => {
        await axiosInstance.patch(
            `/backOffice/members/${id}/activate`
        );
        fetchMembers();
    };

    const deleteUser = async (id: string) => {
        if (!confirm("Confirmer l'anonymisation du membre ?")) return;

        await axiosInstance.patch(
            `/backOffice/members/${id}/delete`
        );
        fetchMembers();
    };

    /* chrono */
    const formatRemainingTime = (bannedUntil?: string | null) => {
        if (!bannedUntil) return "—";

        const diff = new Date(bannedUntil).getTime() - Date.now();
        if (diff <= 0) return "Terminé";

        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours}h ${minutes}m ${seconds}s`;
    };

    /* search name OR email */
    const filteredMembers = members.filter(m =>
        `${m.name} ${m.email}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <main className="Container-backOffice">
            {/* NAV */}
            <aside className="backoffice-nav">
                <div className="nav-header">
                    <img src="/assets/logo-sl.png" className="logo" />
                    <span className="brand__title-black">BackOffice</span>
                </div>

                <button onClick={() => setView("all")}>
                    Tous les membres
                </button>

                <button onClick={() => setView("latest")}>
                    10 derniers inscrits
                </button>

                <button onClick={() => setView("banned")}>
                    Membres bannis
                </button>

                <div className="stats">
                    <p>Nouveaux cette semaine</p>
                    <strong>{newLastWeek}</strong>
                </div>
            </aside>

            {/* CONTENT */}
            <section className="backoffice-content">
                <h1>
                    {view === "all" && "Tous les membres"}
                    {view === "latest" && "Derniers inscrits"}
                    {view === "banned" && "Membres bannis"}
                    <div className="profile__toolbar">
                        <LogoutButton className="profile__icon-btn" iconOnly />
                    </div>
                </h1>

                {/* SEARCH */}
                <input
                    className="member-search"
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="members-table-wrapper">
                    <table className="members-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Ville</th>
                                <th>Statut</th>
                                {view === "banned" && <th>Temps restant</th>}
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredMembers.map((m) => (
                                <tr key={m.id}>
                                    <td>
                                        {m.name}
                                        <span className="short-id">
                                            #{m.shortId}
                                        </span>
                                    </td>

                                    <td className="email-cell">
                                        {m.email}
                                    </td>

                                    <td>{m.city.name}</td>

                                    <td>
                                        <span className={m.active ? "active" : "inactive"}>
                                            {m.active ? "Actif" : "Désactivé"}
                                        </span>
                                    </td>

                                    {view === "banned" && (
                                        <td className="chrono">
                                            {formatRemainingTime(m.banned_until)}
                                        </td>
                                    )}

                                    <td className="actions">
                                        {view !== "banned" && m.active && (
                                            <>
                                                <button onClick={() => deactivate48h(m.id)}>
                                                    48h
                                                </button>
                                                <button onClick={() => deactivate1Week(m.id)}>
                                                    1 semaine
                                                </button>
                                            </>
                                        )}

                                        {!m.active && (
                                            <button onClick={() => activate(m.id)}>
                                                Réactiver
                                            </button>
                                        )}

                                        <button
                                            className="danger"
                                            onClick={() => deleteUser(m.id)}
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
