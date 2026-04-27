import express from "express";
import { healthHandler } from "./handlers/healthHandler.js";
import { stationCongestionHandler, stationsHandler } from "./handlers/stationHandlers.js";
import { addCurrentLoad, buildHourlyCongestion, ringStations } from "./services/congestionService.js";

export function createApp() {
  const app = express();

  app.get("/api/health", healthHandler);
  app.get("/api/stations", stationsHandler);
  app.get("/api/stations/:stationId/congestion", stationCongestionHandler);

  return app;
}

export { addCurrentLoad, buildHourlyCongestion, ringStations };
