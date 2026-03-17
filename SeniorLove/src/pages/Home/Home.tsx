// Home.tsx
import { useEffect, useMemo, useState } from "react";
import "./Home.css";
import ProfileCard from "../../components/ProfileCard/ProfileCard";
import { useNavigate, useLocation } from "react-router";
import axiosInstance from "../../axios/axiosInstance";

import EventsTab from "../EventsTab/EventsTab";
type Tab = "profils" | "evenements";

// même logique que le backend
const getShortId = (uuid: string) => uuid.replace(/-/g, "").slice(-6);

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("profils");

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // index du profil actuellement affiché
  const [currentIndex, setCurrentIndex] = useState(0);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const meRes = await axiosInstance.get("/profile/me");
        const user = meRes.data;

        const alikeRes = await axiosInstance.get(
          `/profiles/alike/${user.id}${location.search}`
        );

        setProfiles(alikeRes.data);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Erreur chargement profils", err);
        setProfiles([]);
        setCurrentIndex(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [location.search]);

  const currentProfile = useMemo(
    () => profiles[currentIndex] ?? null,
    [profiles, currentIndex]
  );

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < profiles.length - 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    setCurrentIndex((i) => i - 1);
  };

  const goNext = () => {
    if (!canGoNext) return;
    setCurrentIndex((i) => i + 1);
  };

  const interestTags: string[] = useMemo(() => {
    if (!currentProfile) return [];
    return (currentProfile.interests ?? [])
      .map((i: any) => i?.name)
      .filter(Boolean);
  }, [currentProfile]);

  return (
    <main className="home">
      {/* ================= TABS ================= */}
      <header className="home__top">
        <div className="home__tabs">
          <button
            type="button"
            className={`home__tab ${tab === "profils" ? "is-active" : ""}`}
            onClick={() => setTab("profils")}
          >
            Profils
          </button>

          <button
            type="button"
            className={`home__tab ${tab === "evenements" ? "is-active" : ""}`}
            onClick={() => setTab("evenements")}
          >
            Événements
          </button>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <section className="home__content">
        {tab === "profils" && loading && <p>Chargement des profils...</p>}

        {tab === "profils" && !loading && profiles.length === 0 && (
          <p>Aucun profil ne correspond à votre recherche.</p>
        )}

        {tab === "profils" && !loading && currentProfile && (
          <>
            {/* zone card et flèches */}
            <div className="home__carousel">
              <div className="home__carousel-card">
                <ProfileCard
                  profile={{
                    id: getShortId(currentProfile.id),
                    name: currentProfile.name,
                    // L'âge est dans member.age !
                    age: currentProfile.member?.age ?? null,
                    city: currentProfile.city?.name ?? "",
                    photoUrl: currentProfile.profile_picture,
                    labels: interestTags,
                    isOnline: true,
                  }}
                  onOpenProfile={(profileId) => {
                    navigate(`/profile/${profileId}`);
                  }}
                  onToggleLike={(profileId) => {
                    console.log("toggle like", profileId);
                  }}
                  onRefineSearch={() => navigate("/filters")}
                  currentIndex={currentIndex}
                  totalProfiles={profiles.length}
                />
              </div>

              {/* flèches sous la card (mobile) */}
              <div className="home__carousel-controls">
                <button
                  type="button"
                  className="home__carousel-btn"
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  aria-label="Profil précédent"
                >
                  ←
                </button>

                <button
                  type="button"
                  className="home__carousel-btn"
                  onClick={goNext}
                  disabled={!canGoNext}
                  aria-label="Profil suivant"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "evenements" && <div>Événements (à venir)</div>}
        {tab === "evenements" && <EventsTab />}

      </section>
    </main>
  );
}
