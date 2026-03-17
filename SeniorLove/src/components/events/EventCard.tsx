import "./EventCard.css";

export type EventListItem = {
  id: string;
  title: string;
  description: string;
  city: string;
  start_datetime: string;
  end_datetime: string;
  illustration_url: string | null;
  max_participants: number;
  current_participants: number;
  available_spots: number;
  is_participant?: boolean;
};

type Props = {
  event: EventListItem;
  onClick?: (eventId: string) => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: (eventId: string) => void;
};

function formatDateRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

  const dateFmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${dateFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  }
  return `${dateFmt.format(start)} ${timeFmt.format(start)} → ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

export default function EventCard({
  event,
  onClick,
  actionLabel,
  actionDisabled,
  onAction,
}: Props) {
  const isFull = event.available_spots <= 0;
  const dateLabel = formatDateRange(event.start_datetime, event.end_datetime);

  return (
    <article
      className={`sl-event-card ${onClick ? "is-clickable" : ""}`}
      onClick={() => onClick?.(event.id)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") onClick(event.id);
      }}
    >
      <div className="sl-event-card__media">
        {event.illustration_url ? (
          <img
            className="sl-event-card__img"
            src={event.illustration_url}
            alt={event.title}
            loading="lazy"
          />
        ) : (
          <div className="sl-event-card__placeholder" aria-hidden="true" />
        )}
        <span className={`sl-event-card__badge ${isFull ? "is-full" : ""}`}>
          {isFull ? "Complet" : `${event.available_spots} place${event.available_spots > 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="sl-event-card__content">
        <header className="sl-event-card__header">
          <h3 className="sl-event-card__title">{event.title}</h3>
          <p className="sl-event-card__city">{event.city}</p>
        </header>

        {dateLabel && <p className="sl-event-card__date">{dateLabel}</p>}

        <p className="sl-event-card__description">{event.description}</p>

        <footer className="sl-event-card__footer">
          <span className="sl-event-card__participants">
            {event.current_participants}/{event.max_participants} participants
          </span>
          {actionLabel && onAction && (
            <button
              type="button"
              className="sl-event-card__action"
              disabled={actionDisabled}
              onClick={(e) => {
                // permet d'effectuer l'action sans changement sur la page (mieux que e.preventdefault())
                e.stopPropagation();
                onAction(event.id);
              }}
            >
              {actionLabel}
            </button>
          )}
        </footer>
      </div>
    </article>
  );
}
