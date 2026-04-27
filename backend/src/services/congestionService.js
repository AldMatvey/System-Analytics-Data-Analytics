import { hourlyDemandProfile, maxEstimatedDailyPassengers, passengerFlowByStation } from "../passengerFlow.js";
import { stations } from "../stations.js";

const NIGHT_HOURS = new Set([1, 2, 3, 4, 5]);

export const ringStations = stations.filter((station) => station.line === "Кольцевая");

function getWeekendMultiplier(date) {
  const day = date.getDay();

  return day === 0 || day === 6 ? 0.72 : 1;
}

export function buildHourlyCongestion(station, date = new Date()) {
  const flow = passengerFlowByStation[station.name];
  const estimatedDailyPassengers = flow?.estimatedDailyPassengers ?? maxEstimatedDailyPassengers * 0.35;
  const stationPressure = Math.sqrt(estimatedDailyPassengers / maxEstimatedDailyPassengers);
  const dayMultiplier = getWeekendMultiplier(date);

  return Array.from({ length: 24 }, (_, hour) => {
    if (NIGHT_HOURS.has(hour)) {
      return {
        hour: `${String(hour).padStart(2, "0")}:00`,
        load: 0
      };
    }

    const profile = hourlyDemandProfile[hour] ?? 0.35;
    const rawValue = Math.round(100 * stationPressure * profile * dayMultiplier);
    const load = Math.max(5, Math.min(100, rawValue));

    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      load
    };
  });
}

export function getRequestedHour(value) {
  const hour = Number(value);

  if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
    return hour;
  }

  return new Date().getHours();
}

export function addCurrentLoad(station, currentHour = new Date().getHours(), generatedLoad = null) {
  const hourlyLoad = buildHourlyCongestion(station);
  const flow = passengerFlowByStation[station.name];
  const currentLoad = Number.isFinite(generatedLoad) ? generatedLoad : hourlyLoad[currentHour]?.load ?? 0;

  return {
    ...station,
    currentLoad,
    passengerFlow: flow
  };
}
