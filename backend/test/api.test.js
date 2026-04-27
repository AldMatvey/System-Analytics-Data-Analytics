import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp, ringStations } from "../src/app.js";

const app = createApp();

test("GET /api/health returns ok", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});

test("GET /api/stations returns only ring line stations", async () => {
  const response = await request(app).get("/api/stations?hour=8");

  assert.equal(response.status, 200);
  assert.equal(response.body.stations.length, ringStations.length);
  assert.ok(response.body.stations.length > 0);
  assert.ok(response.body.stations.every((station) => station.line === "Кольцевая"));
  assert.ok(response.body.stations.every((station) => station.currentLoad >= 0 && station.currentLoad <= 100));

  const station = response.body.stations[0];
  const congestion = await request(app).get(`/api/stations/${encodeURIComponent(station.id)}/congestion`);
  const matchingHour = congestion.body.hourlyLoad.find((item) => item.hour === "08:00");

  assert.equal(station.currentLoad, matchingHour.load);
});

test("GET /api/stations/:stationId/congestion returns 24 hourly values", async () => {
  const response = await request(app).get(`/api/stations/${encodeURIComponent(ringStations[0].id)}/congestion`);

  assert.equal(response.status, 200);
  assert.equal(response.body.station.id, ringStations[0].id);
  assert.ok(response.body.station.currentLoad >= 0 && response.body.station.currentLoad <= 100);
  assert.equal(response.body.hourlyLoad.length, 24);
  assert.ok(response.body.hourlyLoad.every((item) => typeof item.hour === "string"));
  assert.ok(response.body.hourlyLoad.every((item) => item.load >= 0 && item.load <= 100));
  assert.ok(response.body.hourlyLoad.filter((item) => ["01:00", "02:00", "03:00", "04:00", "05:00"].includes(item.hour)).every((item) => item.load === 0));
  assert.ok(response.body.hourlyLoad.filter((item) => !["01:00", "02:00", "03:00", "04:00", "05:00"].includes(item.hour)).every((item) => item.load >= 10));
});

test("GET /api/stations/:stationId/congestion returns 404 for unknown station", async () => {
  const response = await request(app).get("/api/stations/unknown-station/congestion");

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { message: "Station not found" });
});
