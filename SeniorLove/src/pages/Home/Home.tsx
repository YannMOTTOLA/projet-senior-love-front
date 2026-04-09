import { useEffect, useMemo, useState } from "react";
import "./Home.css";
import ProfileCard from "../../components/ProfileCard/ProfileCard";
import { useNavigate, useLocation } from "react-router";
import axiosInstance from "../../axios/axiosInstance";
import EventsTab from "../EventsTab/EventsTab";

type Tab = "profils" | "evenements";

const getShortId = (uuid: string) => uuid.replace(/-/g, "").slice(-6);

const PROFILES_PER_PAGE = 3;
const MAX_PROFILES = 9;

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("profils");

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const meRes = await axiosInstance.get("/profile/me");
        const user = meRes.data;

        const alikeRes = await axiosInstance.get(
          `/profiles/alike/${user.shortId}${location.search}`
        );

        setProfiles(alikeRes.data);
        setPageIndex(0);
      } catch (err) {
        console.error("Erreur chargement profils", err);
        setProfiles([]);
        setPageIndex(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [location.search]);

  /* ================= PAGINATION ================= */
  const limitedProfiles = useMemo(() => profiles.slice(0, MAX_PROFILES), [profiles]);

  const totalPages = Math.ceil(limitedProfiles.length / PROFILES_PER_PAGE);

  const visibleProfiles = useMemo(
    () => limitedProfiles.slice(pageIndex * PROFILES_PER_PAGE, (pageIndex + 1) * PROFILES_PER_PAGE),
    [limitedProfiles, pageIndex]
  );

  const canGoPrev = pageIndex > 0;
  const canGoNext = pageIndex < totalPages - 1;

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
        {tab === "profils" && (
          <>
            {/* Bouton affiner + compteur */}
            <div className="home__toolbar">
              <button
                className="card__refine-btn"
                type="button"
                onClick={() => navigate("/filters")}
              >
                Affiner la recherche
              </button>

              {!loading && limitedProfiles.length > 0 && (
                <span className="home__counter">
                  {pageIndex * PROFILES_PER_PAGE + 1}–
                  {Math.min((pageIndex + 1) * PROFILES_PER_PAGE, limitedProfiles.length)}
                  /{limitedProfiles.length}
                </span>
              )}
            </div>

            {loading && <p>Chargement des profils...</p>}

            {!loading && limitedProfiles.length === 0 && (
              <p>Aucun profil ne correspond à votre recherche.</p>
            )}

            {!loading && visibleProfiles.length > 0 && (
              <>
                <div className="home__grid">
                  {visibleProfiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={{
                        id: getShortId(profile.id),
                        name: profile.name,
                        age: profile.member?.age ?? null,
                        city: profile.city?.name ?? "",
                        photoUrl: profile.profile_picture,
                        labels: (profile.interests ?? [])
                          .map((i: any) => i?.name)
                          .filter(Boolean),
                        isOnline: true,
                      }}
                      onOpenProfile={(profileId) => navigate(`/profile/${profileId}`)}
                      onToggleLike={(profileId) => console.log("toggle like", profileId)}
                      onBlock={(profileId) => console.log("block", profileId)}
                    />
                  ))}
                </div>

                {/* Flèches pagination */}
                <div className="home__carousel-controls">
                  <button
                    type="button"
                    className="home__carousel-btn"
                    onClick={() => setPageIndex(i => i - 1)}
                    disabled={!canGoPrev}
                    aria-label="Page précédente"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="home__carousel-btn"
                    onClick={() => setPageIndex(i => i + 1)}
                    disabled={!canGoNext}
                    aria-label="Page suivante"
                  >
                    →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {tab === "evenements" && <EventsTab />}
      </section>
    </main>
  );
}
