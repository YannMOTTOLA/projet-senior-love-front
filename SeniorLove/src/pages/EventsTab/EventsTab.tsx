import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import axiosInstance from "../../axios/axiosInstance";
import EventCard, { type EventListItem } from "../../components/events/EventCard";
import EventSearchForm from "../../components/events/EventSearchForm";
import "./EventsTab.css";

function getEventParamsFromSearch(search: string) {
  const params = new URLSearchParams(search);

  const city = params.get("event_city") ?? undefined;
  const q = params.get("event_q") ?? undefined;
  const startFrom = params.get("event_startFrom") ?? undefined;
  const startTo = params.get("event_startTo") ?? undefined;
  const status = params.get("event_status") ?? undefined;
  const visibility = params.get("event_visibility") ?? undefined;
  const scope = params.get("event_scope") ?? undefined;

  const interestIdsRaw = params.get("event_interestIds") ?? "";
  const interestIds = interestIdsRaw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const apiParams: Record<string, string> = {};
  if (city) apiParams.city = city;
  if (q) apiParams.q = q;
  if (startFrom) apiParams.startFrom = startFrom;
  if (startTo) apiParams.startTo = startTo;
  if (status) apiParams.status = status;
  if (visibility) apiParams.visibility = visibility;
  if (scope) apiParams.scope = scope;
  if (interestIds.length) apiParams.interests = interestIds.join(",");

  const depKey = [
    city ?? "",
    q ?? "",
    startFrom ?? "",
    startTo ?? "",
    status ?? "",
    visibility ?? "",
    scope ?? "",
    interestIds.join(","),
  ].join("|");

  return { apiParams, depKey };
}

export default function EventsTab() {
  const location = useLocation();

  const { apiParams, depKey } = useMemo(
    () => getEventParamsFromSearch(location.search),
    [location.search]
  );

  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setActionError(null);
        const res = await axiosInstance.get("/events", {
          params: apiParams,
          signal: ctrl.signal,
        });
        setEvents(
          res.data.map((evt: any) => ({
            ...evt,
            city:
              typeof evt.city === "string"
                ? evt.city
                : evt.city?.name ?? "",
          }))
        );
      } catch (err) {
        if ((err as any)?.name === "CanceledError") return;
        console.error(err);
        setError("Impossible de charger les évènements.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [depKey]);

  const toggleJoin = async (eventId: string) => {
    const current = events.find((e) => e.id === eventId);
    if (!current) return;
    const isParticipant = Boolean(current.is_participant);

    setActionLoadingIds((prev) => {
      const next = new Set(prev);
      next.add(eventId);
      return next;
    });

    try {
      setActionError(null);
      const res = isParticipant
        ? await axiosInstance.delete(`/events/${eventId}/join`)
        : await axiosInstance.post(`/events/${eventId}/join`);

      const normalizeEvent = (evt: any): EventListItem => ({
        ...evt,
        city:
          typeof evt.city === "string"
            ? evt.city
            : evt.city?.name ?? "",
      });

      const updated = normalizeEvent(res.data);

      setEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );

    } catch (err) {
      console.error(err);
      setActionError(
        isParticipant
          ? "Impossible de se désinscrire de l’évènement."
          : "Impossible de s’inscrire à l’évènement."
      );
    } finally {
      setActionLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  return (
    <div className="events-tab">
      <EventSearchForm />

      <div className="events-tab__content">
        {loading && <p className="events-tab__hint">Chargement des évènements…</p>}

        {!loading && error && <p className="events-tab__error">{error}</p>}

        {!loading && !error && actionError && (
          <p className="events-tab__error">{actionError}</p>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="events-tab__empty">
            <p>Aucun évènement ne correspond à ces filtres.</p>
            <p className="events-tab__empty-sub">
              Astuce : enlève des filtres ou passe le scope sur “Tous”.
            </p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="events-tab__list">
            {events.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                actionLabel={evt.is_participant ? "Se désinscrire" : "S'inscrire"}
                actionDisabled={
                  actionLoadingIds.has(evt.id) ||
                  (!evt.is_participant && evt.available_spots <= 0)
                }
                onAction={toggleJoin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
