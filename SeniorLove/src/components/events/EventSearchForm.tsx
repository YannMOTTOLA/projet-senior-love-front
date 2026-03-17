import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import axiosInstance from "../../axios/axiosInstance";
import "./EventSearchForm.css";

type Interest = {
  id: string;
  name: string;
};

type EventSearchValues = {
  city: string;
  q: string;
  startFrom: string;
  startTo: string;
  status: "" | "disponible" | "complet" | "clos";
  visibility: "" | "public" | "private";
  scope: "" | "recommended" | "all" | "mine";
  interestIds: string[];
};

const EVENT_KEYS = {
  city: "event_city",
  q: "event_q",
  startFrom: "event_startFrom",
  startTo: "event_startTo",
  status: "event_status",
  visibility: "event_visibility",
  scope: "event_scope",
  interestIds: "event_interestIds",
} as const;

function readValuesFromSearch(search: string): EventSearchValues {
  const params = new URLSearchParams(search);
  const rawInterestIds = params.get(EVENT_KEYS.interestIds) ?? "";
  const interestIds = rawInterestIds
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  return {
    city: params.get(EVENT_KEYS.city) ?? "",
    q: params.get(EVENT_KEYS.q) ?? "",
    startFrom: params.get(EVENT_KEYS.startFrom) ?? "",
    startTo: params.get(EVENT_KEYS.startTo) ?? "",
    status: (params.get(EVENT_KEYS.status) as EventSearchValues["status"]) ?? "",
    visibility:
      (params.get(EVENT_KEYS.visibility) as EventSearchValues["visibility"]) ?? "",
    scope: (params.get(EVENT_KEYS.scope) as EventSearchValues["scope"]) ?? "",
    interestIds,
  };
}

function setOrDeleteParam(params: URLSearchParams, key: string, value: string) {
  if (value.trim() === "") params.delete(key);
  else params.set(key, value.trim());
}

const hasAdvancedFilters = (values: EventSearchValues) =>
  Boolean(
    values.q ||
      values.startFrom ||
      values.startTo ||
      values.status ||
      values.visibility ||
      values.scope ||
      values.interestIds.length
  );

const countAdvancedFilters = (values: EventSearchValues) => {
  let count = 0;
  if (values.q) count += 1;
  if (values.startFrom) count += 1;
  if (values.startTo) count += 1;
  if (values.status) count += 1;
  if (values.visibility) count += 1;
  if (values.scope) count += 1;
  count += values.interestIds.length;
  return count;
};

export default function EventSearchForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [interestsList, setInterestsList] = useState<Interest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initialValues = useMemo(
    () => readValuesFromSearch(location.search),
    [location.search]
  );
  const initialAdvancedFiltersOpen = useMemo(
    () => hasAdvancedFilters(initialValues),
    [initialValues]
  );

  const [form, setForm] = useState<EventSearchValues>(initialValues);
  const [isFiltersOpen, setIsFiltersOpen] = useState(initialAdvancedFiltersOpen);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  useEffect(() => {
    setIsFiltersOpen(initialAdvancedFiltersOpen);
  }, [initialAdvancedFiltersOpen]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/auth/interests");
        setInterestsList(res.data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la liste d'intérêts.");
      }
    })();
  }, []);

  const toggleInterest = (interestId: string) => {
    setForm((prev) => ({
      ...prev,
      interestIds: prev.interestIds.includes(interestId)
        ? prev.interestIds.filter((id) => id !== interestId)
        : [...prev.interestIds, interestId],
    }));
  };

  const applyToUrl = (values: EventSearchValues) => {
    const params = new URLSearchParams(location.search);
    setOrDeleteParam(params, EVENT_KEYS.city, values.city);
    setOrDeleteParam(params, EVENT_KEYS.q, values.q);
    setOrDeleteParam(params, EVENT_KEYS.startFrom, values.startFrom);
    setOrDeleteParam(params, EVENT_KEYS.startTo, values.startTo);
    setOrDeleteParam(params, EVENT_KEYS.status, values.status);
    setOrDeleteParam(params, EVENT_KEYS.visibility, values.visibility);
    setOrDeleteParam(params, EVENT_KEYS.scope, values.scope);

    if (values.interestIds.length) {
      params.set(EVENT_KEYS.interestIds, values.interestIds.join(","));
    } else {
      params.delete(EVENT_KEYS.interestIds);
    }

    const qs = params.toString();
    navigate(qs ? `${location.pathname}?${qs}` : location.pathname);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (form.startFrom && form.startTo) {
      const from = new Date(form.startFrom);
      const to = new Date(form.startTo);
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from > to) {
        setError("La date de début doit être antérieure à la date de fin.");
        return;
      }
    }

    applyToUrl(form);
  };

  const handleReset = () => {
    const params = new URLSearchParams(location.search);
    for (const key of Object.values(EVENT_KEYS)) {
      params.delete(key);
    }
    const qs = params.toString();
    navigate(qs ? `${location.pathname}?${qs}` : location.pathname);
  };

  const advancedFiltersCount = useMemo(() => countAdvancedFilters(form), [form]);
  const filterToggleClassName = [
    "events-search__filter-toggle",
    isFiltersOpen ? "is-open" : "",
    advancedFiltersCount ? "has-active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const panelClassName = ["events-search__panel", isFiltersOpen ? "is-open" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <form className="events-search" onSubmit={handleSubmit}>
      <div className="events-search__primary">
        <label className="events-search__city">
          <span>Ville</span>
          <div className="events-search__city-input">
            <input
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              placeholder="Ex: Lille"
            />
            <button type="submit" className="events-search__btn events-search__btn--submit">
              Valider
            </button>
          </div>
        </label>

        <button
          type="button"
          className={filterToggleClassName}
          onClick={() => setIsFiltersOpen((prev) => !prev)}
          aria-expanded={isFiltersOpen}
        >
          <span>Filtrer</span>
          {advancedFiltersCount > 0 && (
            <span className="events-search__filter-count">{advancedFiltersCount}</span>
          )}
        </button>
      </div>

      <div className={panelClassName} aria-hidden={!isFiltersOpen}>
        <div className="events-search__grid">
          <label className="events-search__field">
            <span>Recherche</span>
            <input
              value={form.q}
              onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))}
              placeholder="Titre ou description"
            />
          </label>

          <label className="events-search__field">
            <span>Début (à partir de)</span>
            <input
              type="date"
              value={form.startFrom}
              onChange={(e) => setForm((p) => ({ ...p, startFrom: e.target.value }))}
            />
          </label>

          <label className="events-search__field">
            <span>Début (jusqu'à)</span>
            <input
              type="date"
              value={form.startTo}
              onChange={(e) => setForm((p) => ({ ...p, startTo: e.target.value }))}
            />
          </label>

          <label className="events-search__field">
            <span>Statut</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value as EventSearchValues["status"] }))
              }
            >
              <option value="">Tous</option>
              <option value="disponible">Disponible</option>
              <option value="complet">Complet</option>
              <option value="clos">Clos</option>
            </select>
          </label>

          <label className="events-search__field">
            <span>Visibilité</span>
            <select
              value={form.visibility}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  visibility: e.target.value as EventSearchValues["visibility"],
                }))
              }
            >
              <option value="">Toutes</option>
              <option value="public">Public</option>
              <option value="private">Privé</option>
            </select>
          </label>

          <label className="events-search__field">
            <span>Scope</span>
            <select
              value={form.scope}
              onChange={(e) =>
                setForm((p) => ({ ...p, scope: e.target.value as EventSearchValues["scope"] }))
              }
            >
              <option value="">Recommandés</option>
              <option value="recommended">Recommandés</option>
              <option value="all">Tous</option>
              <option value="mine">Les miens</option>
            </select>
          </label>
        </div>

        <section className="events-search__interests" aria-label="Centres d'intérêt">
          <p className="events-search__interests-title">
            Centres d'intérêt {form.interestIds.length ? `(${form.interestIds.length})` : ""}
          </p>

          <div className="events-search__chips">
            {interestsList.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`events-search__chip ${
                  form.interestIds.includes(item.id) ? "is-selected" : ""
                }`}
                onClick={() => toggleInterest(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </section>

        <div className="events-search__actions">
          <button type="button" className="events-search__btn is-secondary" onClick={handleReset}>
            Réinitialiser
          </button>
          <button type="submit" className="events-search__btn">
            Appliquer
          </button>
        </div>
      </div>

      {error && <p className="events-search__error">{error}</p>}
    </form>
  );
}
