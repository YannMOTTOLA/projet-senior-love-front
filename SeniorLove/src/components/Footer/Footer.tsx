import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <section className="site-footer__socials">
        <a
          className="site-footer__social-link"
          href="https://www.facebook.com/?locale=fr_FR"
          target="_blank"
          rel="noreferrer"
        >
          <img src="/assets/facebook.png" alt="Facebook" />
        </a>

        <a
          className="site-footer__social-link"
          href="https://www.instagram.com/"
          target="_blank"
          rel="noreferrer"
        >
          <img src="/assets/instagram.png" alt="Instagram" />
        </a>
      </section>

      <section className="site-footer__legal">
        <ul className="site-footer__legal-list">
          <li>
            <a href="#" className="site-footer__legal-link">
              Mentions légales
            </a>
          </li>
          <li>
            <a href="#" className="site-footer__legal-link">
              Politique de confidentialité
            </a>
          </li>
          <li>
            <a href="#" className="site-footer__legal-link">
              Conditions générales d'utilisation
            </a>
          </li>
          <li>
            <a href="#" className="site-footer__legal-link">
              Politique de cookies
            </a>
          </li>
        </ul>
      </section>

      <p className="site-footer__copyright">
        © 2025 SeniorLove tous droits réservés.
      </p>
    </footer>
  );
}
