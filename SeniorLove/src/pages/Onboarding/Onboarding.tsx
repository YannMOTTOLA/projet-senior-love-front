import { useNavigate } from "react-router";
import './Onboarding.css'


export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <main className="onboarding">
      <div className="onboarding-container">
        <div className=" onboarding__background-container">
          <section className="onboarding__title-container">
            <img className="logo" src="/assets/logo-sl.png" alt="logo seniorLove" />
            <span className="brand__title-white">SeniorLove</span>
          </section>
          <section className="onboarding__buttons">
            <button
              className="btn btn--primary"
              onClick={() => navigate("/LoginForm")}> Connexion </button>
            <button
              className="btn btn--secondary btn-white"
              onClick={() => navigate("/Popupasso")}> inscription </button>
          </section>
        </div>
        <div className="onboarding__details-container">
          <section className="onboarding__text">
            <h2 className="subtitle">Qui sommes nous ?</h2>
            <p className="onboarding__paragraph">
              SeniorLove est une application de rencontres pensée pour les femmes
              et les hommes de plus de soixante ans. Notre envie : vous offrir un
              espace simple, chaleureux et respectueux, où vous pouvez faire de
              nouvelles connaissances sans vous sentir jugé ni pressé. Derrière la
              plateforme, il y a une équipe qui connaît vos besoins, vos craintes
              et vos envies de partage. Nous faisons en sorte que l’inscription,
              la création du profil et les premiers échanges restent faciles, même
              si vous n’êtes pas à l’aise avec le numérique. Ici, vous avancez à
              votre rythme, vous prenez le temps de discuter, de découvrir l’autre
              et, peut-être, de construire une belle histoire. Vous n’êtes jamais
              seul ici.
            </p>
          </section>

          <div>
            <h2 className="subtitle">
              Rencontrez de nouvelles personnes de votre âge
            </h2>
            <section className="onboarding__feature">
              <img src="/assets/couple.png" alt="couple image" />
              <p className="onboarding__paragraph">
                SeniorLove vous aide à trouver des personnes ouvertes, sincères et
                bienveillantes. Une amitié, une complicité ou un nouvel amour
                peuvent naître d’une simple conversation. Laissez-vous surprendre
                par de jolies histoires, à votre rythme.{" "}
              </p>
            </section>

            <section className="onboarding__feature">
              <p className="onboarding__paragraph">
                Ici, vous pouvez rencontrer de nouveaux amis, ou peut-être une
                personne spéciale à vos côtés. Profitez d’un espace sûr pour
                échanger, rire et faire de belles découvertes. Parce que les
                belles relations n’ont pas d’âge, elles se vivent quand on se sent
                prêt.
              </p>
              <img src="/assets/couple.png" alt="couple image" />
            </section>

            <section className="onboarding__feature">
              <img src="/assets/couple.png" alt="couple image" />
              <p className="onboarding__paragraph">
                Que vous cherchiez l’amitié, le partage ou l’amour, SeniorLove
                vous accompagne. Profitez d’un espace sûr pour découvrir de
                nouvelles personnes et peut-être écrire un nouveau chapitre plein
                de douceur et de sourire.
              </p>
            </section>
            <section>
              <h2 className="subtitle">
                Une application sécurisée pour des rencontres en toute
                tranquillité
              </h2>
              <p className="onboarding__paragraph">
                Chez SeniorLove, votre sécurité est notre priorité. Chaque profil
                est vérifié avec soin et nos équipes surveillent la plateforme
                pour vous protéger des faux comptes et des comportements
                irrespectueux. Vos informations personnelles sont confidentielles
                : vous choisissez ce que vous partagez et avec qui. En cas de
                doute ou de malaise, vous pouvez nous signaler un profil en un
                clic et nous intervenons. Ainsi, vous profitez de rencontres
                sereines, dans un environnement pensé pour votre tranquillité
                d’esprit, jour après jour.
              </p>
            </section>
          </div>

          <div>
            <button
              className="btn btn--primary onboarding__buttons-big"
              onClick={() => navigate("/Popupasso")}>
              S'inscrire
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
