import { useAuth } from "../../context/AuthContext";
import { LogOut } from "lucide-react";

type Props = {
    className?: string;
    iconOnly?: boolean;
};

export default function LogoutButton({ className = "", iconOnly = false }: Props) {
    const { logout } = useAuth();

    return (
        <button
            type="button"
            onClick={() => logout()}
            className={className ? className : "btn--secondary secondary-focus"}
            aria-label={iconOnly ? "Se déconnecter" : undefined}
        >
            <LogOut size={16} strokeWidth={2} />
            {!iconOnly && <span>Déconnexion</span>}
        </button>
    );
}
