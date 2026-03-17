import { useNavigate } from "react-router";
import "./Popupasso.css";

export default function Popupasso() {
  const navigate = useNavigate();

  return (
    <main className="popup-question">
      <div className="popup-container">
        <section className="popup__title-container">
          <img className="logo" src="/assets/logo-sl.png" alt="" />
          <span className="brand__title-black">SeniorLove</span>
        </section>
        <div className="main-title">
          <h2>Etes-vous une association?</h2>
        </div>
        <section className="popup__buttons">
          <button
            className="btn btn--secondary secondary-focus"
            onClick={() => navigate("/CreateAccountOrganisation")}
          >
            oui
          </button>
          <button
            className="btn btn--secondary secondary-focus"
            onClick={() => navigate("/CreateAccountMember")}> non </button>
        </section>
      </div>
    </main>
  );
}
