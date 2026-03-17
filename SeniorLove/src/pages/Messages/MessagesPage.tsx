import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axiosInstance from "../../axios/axiosInstance";
import "./MessagesPage.css";

type Request = {
    shortId: string;
    sender: {
        name: string;
        profile_picture: string;
    };
    message: { content: string } | null;
};

type Conversation = {
    shortId: string;
    sender: { name: string };
    receiver: { name: string };
    lastMessage: { content: string } | null;
};

export default function MessagesPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance.get("/conversations/requests").then((res) => {
            setRequests(res.data);
        });

        axiosInstance.get("/conversations").then((res) => {
            setConversations(res.data);
        });
    }, []);

    const updateStatus = async (shortId: string, status: "accepted" | "rejected") => {
        await axiosInstance.patch(`/conversations/${shortId}/status`, { status });
        setRequests((r) => r.filter((req) => req.shortId !== shortId));
    };

    return (
        <main className="messages">
            <h1 className="messages__title">Messages</h1>

            {/* DEMANDES */}
            {requests.length > 0 && (
                <section className="messages__section">
                    <h2 className="messages__section-title">Demandes</h2>

                    {requests.map((req) => (
                        <article key={req.shortId} className="messages__card messages__card--request">
                            <img
                                className="messages__avatar"
                                src={req.sender.profile_picture}
                                alt={req.sender.name}
                            />

                            <div className="messages__card-content">
                                <strong className="messages__name">{req.sender.name}</strong>
                                <p className="messages__preview">
                                    {req.message?.content ?? "Bonjour 👋"}
                                </p>

                                <div className="messages__actions">
                                    <button
                                        type="button"
                                        className="btn btn--primary messages__btn"
                                        onClick={() => updateStatus(req.shortId, "accepted")}
                                    >
                                        Accepter
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn--secondary secondary-focus messages__btn"
                                        onClick={() => updateStatus(req.shortId, "rejected")}
                                    >
                                        Refuser
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {/* CONVERSATIONS */}
            <section className="messages__section">
                <h2 className="messages__section-title">Conversations</h2>

                {conversations.length === 0 ? (
                    <div className="messages__empty">
                        <p>Aucune conversation pour le moment</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <article
                            key={conv.shortId}
                            className="messages__card"
                            onClick={() => navigate(`/messages/${conv.shortId}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") navigate(`/messages/${conv.shortId}`);
                            }}
                        >
                            <div className="messages__card-content">
                                <strong className="messages__name">{conv.receiver.name}</strong>
                                <p className="messages__preview">
                                    {conv.lastMessage?.content ?? "Aucun message"}
                                </p>
                            </div>
                        </article>
                    ))
                )}
            </section>
        </main>
    );
}
