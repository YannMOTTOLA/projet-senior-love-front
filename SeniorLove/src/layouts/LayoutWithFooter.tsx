import Footer from "../components/Footer/Footer";
import "./LayoutWithFooter.css";

export default function LayoutWithFooter({ children }: { children: React.ReactNode }) {
    return (
        <div className="layout-footer">
            <div className="layout-footer__content">{children}</div>
            <Footer />
        </div>
    );
}
