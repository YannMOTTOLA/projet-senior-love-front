import { useState } from "react";
import "./ProfileCard.css";
import { Search, Heart, EllipsisVertical } from "lucide-react";
import type { IProfileCardVM } from "../../@types/Profile";

interface IProfileCardProps {
  profile: IProfileCardVM;
  onOpenProfile?: (profileId: string) => void;
  onToggleLike?: (profileId: string) => void;
  onBlock?: (profileId: string) => void;
  onRefineSearch?: () => void;
  currentIndex?: number;
  totalProfiles?: number;
}

function ProfileCard({
  profile,
  onOpenProfile,
  onToggleLike,
  onBlock,
  onRefineSearch,
  currentIndex,
  totalProfiles,
}: IProfileCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const hasAge = profile.age !== null && profile.age !== undefined;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked((v) => !v);
    onToggleLike?.(profile.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((v) => !v);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Signaler le profil:", profile.id);
    alert("Signalement envoyé !");
    setShowMenu(false);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir bloquer ce profil ? Il ne vous sera plus proposé."
    );
    if (!confirmed) return;
    onBlock?.(profile.id);
    setShowMenu(false);
  };

  return (
    <>
      <div>
        {/* Bouton Affiner la recherche */}
        <button
          className="card__refine-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRefineSearch?.();
          }}
        >
          Affiner la recherche
        </button>
      </div>
      <article className="card" onClick={() => onOpenProfile?.(profile.id)}>
        <img
          className="card__img"
          src={profile.photoUrl}
          alt={`Photo de ${profile.name}`}
        />

        {/* bouton coeur */}
        <button
          className={`card__icon card__icon--left ${isLiked ? "is-liked" : ""}`}
          type="button"
          aria-label="Favori"
          onClick={handleLikeClick}
        >
          <Heart
            size={16}
            strokeWidth={2}
            fill={isLiked ? "currentColor" : "none"}
          />
        </button>

        {/* menu à droite */}
        <div className="card__menu-wrapper">
          <button
            className="card__icon card__icon--right"
            type="button"
            aria-label="Menu"
            onClick={handleMenuClick}
          >
            <EllipsisVertical />
          </button>

          {showMenu && (
            <div className="card__menu">
              <button
                className="card__menu-item"
                type="button"
                onClick={handleReport}
              >
                Signaler ce profil
              </button>
              <button
                className="card__menu-item card__menu-item--danger"
                type="button"
                onClick={handleBlock}
              >
                Bloquer ce profil
              </button>
            </div>
          )}
        </div>

        {/* bottom overlay */}
        <div className="card__bottom">
          <div className="card__meta">
            <div className="card__name">
              {profile.name}
              {hasAge && <span className="card__age">, {profile.age} ans</span>}
            </div>
            <div className="card__city">{profile.city}</div>
          </div>

          <div className="card__chips">
            {profile.labels.map((type) => (
              <span key={type} className="chip">
                {type}
              </span>
            ))}
          </div>

          <button
            className="card__search"
            type="button"
            aria-label="Voir le profil"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile?.(profile.id);
            }}
          >
            <Search size={16} strokeWidth={2} />
          </button>
        </div>
      </article>

      {/* Compteur */}
      {currentIndex !== undefined && totalProfiles !== undefined && (
        <div className="card__counter">
          {currentIndex + 1}/{totalProfiles}
        </div>
      )}


    </>
  );
}

export default ProfileCard;
