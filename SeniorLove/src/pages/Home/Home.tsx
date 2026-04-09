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

  // Mobile : index 1 par 1 (0 à 8)
  const [mobileIndex, setMobileIndex] = useState(0);
  // Desktop : page de 3 en 3 (0, 1, 2)
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
        setMobileIndex(0);
        setPageIndex(0);
      } catch (err) {
        console.error("Erreur chargement profils", err);
        setProfiles([]);
        setMobileIndex(0);
        setPageIndex(0);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [location.search]);

  /* ================= DONNÉES ================= */
  const limitedProfiles = useMemo(
    () => profiles.slice(0, MAX_PROFILES),
    [profiles]
  );

  // Mobile
  const currentProfile = useMemo(
    () => limitedProfiles[mobileIndex] ?? null,
    [limitedProfiles, mobileIndex]
  );

  // Desktop
  const totalPages = Math.ceil(limitedProfiles.length / PROFILES_PER_PAGE);
  const visibleProfiles = useMemo(
    () =>
      limitedProfiles.slice(
        pageIndex * PROFILES_PER_PAGE,
        (pageIndex + 1) * PROFILES_PER_PAGE
      ),
    [limitedProfiles, pageIndex]
  );

  const buildProfileProps = (profile: any) => ({
    id: getShortId(profile.id),
    name: profile.name,
    age: profile.member?.age ?? null,
    city: profile.city?.name ?? "",
    photoUrl: profile.profile_picture,
    labels: (profile.interests ?? []).map((i: any) => i?.name).filter(Boolean),
    isOnline: true,
  });

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
            {loading && <p>Chargement des profils...</p>}

            {!loading && limitedProfiles.length === 0 && (
              <p>Aucun profil ne correspond à votre recherche.</p>
            )}

            {!loading && limitedProfiles.length > 0 && (
              <>
                {/* ===== MOBILE : carousel 1 par 1 ===== */}
                <div className="home__mobile">
                  <button
                    className="card__refine-btn"
                    type="button"
                    onClick={() => navigate("/filters")}
                  >
                    Affiner la recherche
                  </button>

                  {currentProfile && (
                    <ProfileCard
                      key={currentProfile.id}
                      profile={buildProfileProps(currentProfile)}
                      onOpenProfile={(id) => navigate(`/profile/${id}`)}
                      onToggleLike={(id) => console.log("toggle like", id)}
                      onBlock={(id) => console.log("block", id)}
                    />
                  )}

                  <div className="home__carousel-controls">
                    <button
                      type="button"
                      className="home__carousel-btn"
                      onClick={() => setMobileIndex((i) => i - 1)}
                      disabled={mobileIndex === 0}
                      aria-label="Profil précédent"
                    >
                      ←
                    </button>
                    <span className="home__counter">
                      {mobileIndex + 1}/{limitedProfiles.length}
                    </span>
                    <button
                      type="button"
                      className="home__carousel-btn"
                      onClick={() => setMobileIndex((i) => i + 1)}
                      disabled={mobileIndex === limitedProfiles.length - 1}
                      aria-label="Profil suivant"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* ===== DESKTOP : grille 3 par 3 ===== */}
                <div className="home__desktop">
                  <div className="home__toolbar">
                    <button
                      className="card__refine-btn"
                      type="button"
                      onClick={() => navigate("/filters")}
                    >
                      Affiner la recherche
                    </button>
                  </div>

                  <div className="home__grid">
                    {visibleProfiles.map((profile) => (
                      <ProfileCard
                        key={profile.id}
                        profile={buildProfileProps(profile)}
                        onOpenProfile={(id) => navigate(`/profile/${id}`)}
                        onToggleLike={(id) => console.log("toggle like", id)}
                        onBlock={(id) => console.log("block", id)}
                      />
                    ))}
                  </div>

                  <div className="home__pagination">
                    <button
                      type="button"
                      className="home__carousel-btn"
                      onClick={() => setPageIndex((i) => i - 1)}
                      disabled={pageIndex === 0}
                      aria-label="Page précédente"
                    >
                      ←
                    </button>
                    <span className="home__counter">
                      {pageIndex * PROFILES_PER_PAGE + 1}–
                      {Math.min(
                        (pageIndex + 1) * PROFILES_PER_PAGE,
                        limitedProfiles.length
                      )}
                      /{limitedProfiles.length}
                    </span>
                    <button
                      type="button"
                      className="home__carousel-btn"
                      onClick={() => setPageIndex((i) => i + 1)}
                      disabled={pageIndex >= totalPages - 1}
                      aria-label="Page suivante"
                    >
                      →
                    </button>
                  </div>
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
