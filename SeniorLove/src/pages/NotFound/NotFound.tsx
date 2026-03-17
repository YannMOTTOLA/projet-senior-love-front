import { useNavigate } from "react-router";
import { Home, ArrowLeft, SearchX } from "lucide-react";
import "./NotFound.css";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <main className="nf404" role="status" aria-live="polite">
            <div className="nf404__content">
                <div className="nf404__icon" aria-hidden="true">
                    <SearchX size={44} />
                </div>

                <h1 className="nf404__title">Oups&nbsp;!</h1>

                <p className="nf404__text">
                    La page demandée n’existe pas ou n’existe plus.
                    <br />
                    Veuillez nous excuser.
                </p>

                <div className="nf404__actions">
                    <button className="btn btn--primary nf404__btn" onClick={() => navigate(-1)}>
                        Page précédente
                    </button>
                </div>
            </div>
        </main>
    );
}
