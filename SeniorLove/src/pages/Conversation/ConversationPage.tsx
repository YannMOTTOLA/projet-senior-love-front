import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import axiosInstance from "../../axios/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import "./ConversationPage.css";

type Message = {
    id: string;
    content: string;
    sender_id: string;
    sent_at: string;
};

type Conversation = {
    shortId: string;
    sender: { id: string; name: string };
    receiver: { id: string; name: string };
};

export default function ConversationPage() {
    const { shortId } = useParams();

    const bottomRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const emojiBtnRef = useRef<HTMLButtonElement>(null);

    const { user } = useAuth();
    const myId = user?.id ?? localStorage.getItem("userId") ?? "";

    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState("");
    const [otherName, setOtherName] = useState("");

    const [showEmoji, setShowEmoji] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const sync = () => setIsDesktop(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    useEffect(() => {
        if (!shortId) return;
        axiosInstance.get(`/conversations/${shortId}/messages`).then((res) => {
            setMessages(res.data);
        });
    }, [shortId]);

    useEffect(() => {
        if (!shortId) return;

        axiosInstance.get("/conversations").then((res) => {
            const convs: Conversation[] = res.data;
            const conv = convs.find((c) => c.shortId === shortId);
            if (!conv) return;

            const other = conv.sender.id === myId ? conv.receiver.name : conv.sender.name;
            setOtherName(other);
        });
    }, [shortId, myId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!showEmoji) return;

        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;

            if (emojiRef.current && emojiRef.current.contains(target)) return;
            if (emojiBtnRef.current && emojiBtnRef.current.contains(target)) return;

            setShowEmoji(false);
        };

        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [showEmoji]);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setContent((prev) => prev + emojiData.emoji);
    };

    const send = async () => {
        if (!content.trim() || !shortId) return;

        const res = await axiosInstance.post(`/conversations/${shortId}/messages`, {
            content,
        });

        setMessages((m) => [...m, res.data]);
        setContent("");
        setShowEmoji(false);
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        send();
    };

    return (
        <main className="conversation">
            <div className="conversation__shell">
                <header className="conversation__header">
                    <h1 className="conversation__title">{otherName || "Conversation"}</h1>
                </header>

                <div className="conversation__messages">
                    {messages.map((msg) => {
                        const isMine = msg.sender_id === myId;

                        return (
                            <div
                                key={msg.id}
                                className={`bubble ${isMine ? "bubble--me" : "bubble--them"}`}
                            >
                                <div className="bubble__meta">
                                    <span className="bubble__sender">
                                        {isMine ? "Moi" : otherName || "Utilisateur"}
                                    </span>
                                    <span className="bubble__time">
                                        {new Date(msg.sent_at).toLocaleTimeString("fr-FR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>

                                <p className="bubble__text">{msg.content}</p>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {showEmoji && (
                    <div className="emoji-popover" ref={emojiRef}>
                        <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            width="100%"
                            height={isDesktop ? 560 : 340}
                            previewConfig={{ showPreview: false }}
                            skinTonesDisabled
                            searchDisabled={false}
                        />
                    </div>
                )}

                <form className="conversation__input" onSubmit={onSubmit}>
                    <button
                        ref={emojiBtnRef}
                        type="button"
                        className="icon-btn"
                        onClick={() => setShowEmoji((v) => !v)}
                        aria-label="Ouvrir les emojis"
                    >
                        😊
                    </button>

                    <input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Écrire un message..."
                    />

                    <button type="submit">Envoyer</button>
                </form>
            </div>
        </main>
    );
}
