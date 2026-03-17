import { useNavigate, useLocation } from "react-router";
import { Home, MessageCircle, Heart, Calendar, User } from "lucide-react";
import "./NavBar.css";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { label: "Accueil", icon: Home, path: "/home" },
    { label: "Messagerie", icon: MessageCircle, path: "/messages" },
    { label: "J'aime", icon: Heart, path: "/likes", isRed: true },
    { label: "Calendrier", icon: Calendar, path: "/calendar" },
    { label: "Moi", icon: User, path: "/profile/me" },
  ];

  return (
    <nav className="nav">
      <div className="nav__inner">
        <div className="container-logo">
          <img className="logo" src="/assets/logo-sl.png" alt="SeniorLove" />
          <span className="brand__title-black">SeniorLove</span>
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <button
              key={item.label}
              className={`nav__item 
                ${active ? "is-active" : ""} 
                ${item.isRed ? "is-red" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="nav__icon" />
              <span className="nav__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
