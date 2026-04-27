import {
  addCurrentLoad,
  buildHourlyCongestion,
  getRequestedHour,
  ringStations
} from "../services/congestionService.js";
import { stations } from "../stations.js";
import { getLatestStationLoads } from "../repositories/stationRepository.js";

async function safeGetLatestLoads(stationIds) {
  try {
    return await getLatestStationLoads(stationIds);
  } catch {
    return new Map();
  }
}

export async function stationsHandler(req, res) {
  const currentHour = getRequestedHour(req.query.hour);
  const browserCurrentHour = new Date().getHours();
  const latestLoads = currentHour === browserCurrentHour
    ? await safeGetLatestLoads(ringStations.map((station) => station.id))
    : new Map();

  res.json({
    stations: ringStations.map((station) => addCurrentLoad(station, currentHour, latestLoads.get(station.id)))
  });
}

export async function stationCongestionHandler(req, res) {
  const station = stations.find((item) => item.id === req.params.stationId);

  if (!station) {
    res.status(404).json({ message: "Station not found" });
    return;
  }

  const date = new Date();
  const currentHour = date.getHours();
  const latestLoads = await safeGetLatestLoads([station.id]);
  const generatedCurrentLoad = latestLoads.get(station.id);
  const hourlyLoad = buildHourlyCongestion(station, date);

  if (Number.isFinite(generatedCurrentLoad)) {
    hourlyLoad[currentHour] = {
      ...hourlyLoad[currentHour],
      load: generatedCurrentLoad
    };
  }

  res.json({
    station: addCurrentLoad(station, currentHour, generatedCurrentLoad),
    generatedAt: new Date().toISOString(),
    date: date.toISOString().slice(0, 10),
    model: Number.isFinite(generatedCurrentLoad)
      ? "generated_station_snapshot_x_daily_flow_profile"
      : "station_daily_passenger_flow_x_hourly_profile",
    hourlyLoad
  });
}
