import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

vi.mock("./components/MetroMap", () => ({
  default: function MetroMapMock({ selectedStation }) {
    return <div data-testid="metro-map">Map mock: {selectedStation?.name ?? "none"}</div>;
  }
}));

const stationsResponse = {
  stations: [
    { id: "5.82", name: "Новослободская", line: "Кольцевая", color: "#915133", coordinates: [55.77, 37.6], order: 0, currentLoad: 25 },
    { id: "5.119", name: "Проспект Мира", line: "Кольцевая", color: "#915133", coordinates: [55.78, 37.63], order: 1, currentLoad: 75 },
    { id: "5.54", name: "Комсомольская", line: "Кольцевая", color: "#915133", coordinates: [55.77, 37.65], order: 2, currentLoad: 45 },
    { id: "5.60", name: "Курская", line: "Кольцевая", color: "#915133", coordinates: [55.75, 37.66], order: 3, currentLoad: 55 }
  ]
};

const congestionResponse = {
  station: stationsResponse.stations[0],
  hourlyLoad: Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    load: 50
  }))
};

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.APP_CONFIG = { YANDEX_MAPS_API_KEY: "test-key" };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads stations and renders the selected station details", async () => {
    const fetchMock = vi.fn((url) => {
      if (url.startsWith("/api/stations?hour=")) {
        return Promise.resolve({
          ok: true,
          json: async () => stationsResponse
        });
      }

      if (url === "/api/stations/5.82/congestion") {
        return Promise.resolve({
          ok: true,
          json: async () => congestionResponse
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByText("Станций на карте: 4")).toBeInTheDocument();
    expect(await screen.findByText(/Текущее время:/)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: "Новослободская" })).toBeInTheDocument();
    expect(await screen.findByTestId("metro-map")).toHaveTextContent("Map mock: Новослободская");
    expect(await screen.findByText("Текущая загруженность: 25%")).toBeInTheDocument();
    expect(await screen.findByText("00:00")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^\/api\/stations\?hour=\d+$/));
    expect(fetchMock).toHaveBeenCalledWith("/api/stations/5.82/congestion");
  });

  it("switches station when the station chip is clicked", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url) => {
      if (url.startsWith("/api/stations?hour=")) {
        return Promise.resolve({
          ok: true,
          json: async () => stationsResponse
        });
      }

      if (url === "/api/stations/5.82/congestion") {
        return Promise.resolve({
          ok: true,
          json: async () => congestionResponse
        });
      }

      if (url === "/api/stations/5.119/congestion") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...congestionResponse,
            station: stationsResponse.stations[1]
          })
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByText("Станций на карте: 4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Проспект Мира/ }));

    await waitFor(() => {
      expect(screen.getByTestId("metro-map")).toHaveTextContent("Map mock: Проспект Мира");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/stations/5.119/congestion");
  });

  it("builds a free ring route from selected stations", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url) => {
      if (url.startsWith("/api/stations?hour=")) {
        return Promise.resolve({
          ok: true,
          json: async () => stationsResponse
        });
      }

      if (url === "/api/stations/5.82/congestion") {
        return Promise.resolve({
          ok: true,
          json: async () => congestionResponse
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByRole("heading", { level: 2, name: "Маршрут по кольцевой" })).toBeInTheDocument();
    expect(await screen.findByText("1 перегон")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Куда"), "5.54");

    expect(await screen.findByText("2 перегонов")).toBeInTheDocument();
    expect(screen.getByText("Средняя загруженность: 48%")).toBeInTheDocument();
  });
});
