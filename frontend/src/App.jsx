import { useEffect, useMemo, useState } from "react";
import MetroMap from "./components/MetroMap";
import HourlyLoadChart from "./components/HourlyLoadChart";

const apiKey = window.APP_CONFIG?.YANDEX_MAPS_API_KEY || "";

function getLoadColor(load) {
  if (load >= 70) {
    return "#d25332";
  }

  if (load >= 35) {
    return "#f0b429";
  }

  return "#2f8f5b";
}

function buildRingRoute(stations, fromId, toId) {
  if (!fromId || !toId || fromId === toId) {
    return [];
  }

  const sortedStations = [...stations].sort((a, b) => a.order - b.order);
  const fromIndex = sortedStations.findIndex((station) => station.id === fromId);
  const toIndex = sortedStations.findIndex((station) => station.id === toId);

  if (fromIndex === -1 || toIndex === -1) {
    return [];
  }

  const forwardRoute = [];
  for (let index = fromIndex; ; index = (index + 1) % sortedStations.length) {
    forwardRoute.push(sortedStations[index]);
    if (index === toIndex) {
      break;
    }
  }

  const backwardRoute = [];
  for (let index = fromIndex; ; index = (index - 1 + sortedStations.length) % sortedStations.length) {
    backwardRoute.push(sortedStations[index]);
    if (index === toIndex) {
      break;
    }
  }

  return forwardRoute.length <= backwardRoute.length ? forwardRoute : backwardRoute;
}

export default function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [routeFromId, setRouteFromId] = useState("");
  const [routeToId, setRouteToId] = useState("");
  const [congestion, setCongestion] = useState([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [isLoadingCongestion, setIsLoadingCongestion] = useState(false);
  const [error, setError] = useState("");
  const routeStations = useMemo(
    () => buildRingRoute(stations, routeFromId, routeToId),
    [stations, routeFromId, routeToId]
  );
  const routeAverageLoad = routeStations.length > 0
    ? Math.round(routeStations.reduce((sum, station) => sum + (station.currentLoad ?? 0), 0) / routeStations.length)
    : 0;
  const routeStops = Math.max(routeStations.length - 1, 0);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    async function loadStations() {
      try {
        setIsLoadingStations(true);
        setError("");
        const response = await fetch(`/api/stations?hour=${new Date().getHours()}`);

        if (!response.ok) {
          throw new Error("Не удалось загрузить станции");
        }

        const payload = await response.json();
        setStations(payload.stations);
        setSelectedStation(payload.stations[0] || null);
        setRouteFromId(payload.stations[0]?.id || "");
        setRouteToId(payload.stations[Math.min(3, payload.stations.length - 1)]?.id || "");
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingStations(false);
      }
    }

    loadStations();
  }, []);

  useEffect(() => {
    if (!selectedStation?.id) {
      return;
    }

    async function loadCongestion() {
      try {
        setIsLoadingCongestion(true);
        setError("");
        const response = await fetch(`/api/stations/${encodeURIComponent(selectedStation.id)}/congestion`);

        if (!response.ok) {
          throw new Error("Не удалось загрузить загруженность станции");
        }

        const payload = await response.json();
        setCongestion(payload.hourlyLoad);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingCongestion(false);
      }
    }

    loadCongestion();
  }, [selectedStation]);

  return (
    <main className="layout">
      <section className="panel panel-main">
        <div className="hero">
          <p className="eyebrow">Metro Load Monitor</p>
          <h1>Оценка загруженности станций метро по часам</h1>
          <p className="hero-text">
            Выбери станцию из списка или кликни по карте, чтобы увидеть загруженность по часам.
          </p>
          <p className="hero-meta">
            {isLoadingStations ? "Загружаем станции..." : `Станций на карте: ${stations.length}`}
          </p>
          <p className="current-time">
            Текущее время:{" "}
            {currentTime.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>

        <section className="load-legend" aria-label="Легенда загруженности">
          <span><i className="legend-dot green" /> Низкая</span>
          <span><i className="legend-dot yellow" /> Средняя</span>
          <span><i className="legend-dot red" /> Высокая</span>
        </section>

        <section className="station-selector">
          {stations.map((station) => (
            <button
              key={station.id}
              type="button"
              className={`station-chip ${selectedStation?.id === station.id ? "selected" : ""}`}
              onClick={() => setSelectedStation(station)}
            >
              <span className="station-chip-dot" style={{ backgroundColor: getLoadColor(station.currentLoad ?? 0) }} />
              <span>{station.name}</span>
              <small>{station.currentLoad ?? 0}%</small>
            </button>
          ))}
        </section>

        <section className="route-panel" aria-label="Построение маршрута">
          <div className="route-copy">
            <h2>Маршрут по кольцевой</h2>
          </div>
          <div className="route-controls">
            <label>
              Откуда
              <select value={routeFromId} onChange={(event) => setRouteFromId(event.target.value)}>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Куда
              <select value={routeToId} onChange={(event) => setRouteToId(event.target.value)}>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {routeStations.length > 0 ? (
            <div className="route-summary">
              <span>{routeStops} {routeStops === 1 ? "перегон" : "перегонов"}</span>
              <span>Средняя загруженность: {routeAverageLoad}%</span>
              <ol className="route-stations">
                {routeStations.map((station) => (
                  <li key={station.id}>{station.name}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="route-empty">Выбери разные станции отправления и назначения.</p>
          )}
        </section>

        <MetroMap
          apiKey={apiKey}
          stations={stations}
          routeStations={routeStations}
          selectedStation={selectedStation}
          selectedStationId={selectedStation?.id}
          onSelect={setSelectedStation}
        />
        <section className="details-card">
          <div className="details-head">
            <div>
              <h2>{selectedStation?.name || "Станция не выбрана"}</h2>
              <p className="station-line">{selectedStation?.line || "Выбери станцию на карте"}</p>
              {selectedStation ? (
                <p className="current-load">
                  Текущая загруженность: {selectedStation.currentLoad ?? 0}%
                </p>
              ) : null}
            </div>
            {selectedStation ? (
              <span className="line-badge" style={{ backgroundColor: selectedStation.color }}>
                {selectedStation.line}
              </span>
            ) : null}
          </div>

          {isLoadingCongestion ? <p>Загружаем данные по часам...</p> : null}
          {!isLoadingCongestion && selectedStation ? <HourlyLoadChart data={congestion} /> : null}
          {!isLoadingCongestion && !selectedStation ? <p>Нажми на станцию на карте.</p> : null}

          {error ? <div className="error-box">{error}</div> : null}
        </section>
      </section>
    </main>
  );
}
