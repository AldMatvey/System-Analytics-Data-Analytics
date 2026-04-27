import { useEffect, useRef, useState } from "react";
import { useYandexMaps } from "../hooks/useYandexMaps";

function getLoadPreset(load) {
  if (load >= 70) {
    return "islands#redCircleDotIcon";
  }

  if (load >= 35) {
    return "islands#yellowCircleDotIcon";
  }

  return "islands#greenCircleDotIcon";
}

export default function MetroMap({ apiKey, stations, routeStations, selectedStation, selectedStationId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const placemarksRef = useRef([]);
  const routeLineRef = useRef(null);
  const hasFitBoundsRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const { isLoaded, error } = useYandexMaps(apiKey);

  useEffect(() => {
    if (!isLoaded || !window.ymaps || !containerRef.current || mapRef.current) {
      return;
    }

    window.ymaps.ready(() => {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      mapRef.current = new window.ymaps.Map(containerRef.current, {
        center: [55.751244, 37.618423],
        zoom: 11,
        controls: ["zoomControl"]
      });
      setIsMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      routeLineRef.current = null;
      placemarksRef.current = [];
      setIsMapReady(false);
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.ymaps) {
      return;
    }

    placemarksRef.current.forEach((placemark) => {
      mapRef.current.geoObjects.remove(placemark);
    });

    placemarksRef.current = stations.map((station) => {
      const placemark = new window.ymaps.Placemark(
        station.coordinates,
        {
          balloonContentHeader: station.name,
          balloonContentBody: `${station.line}<br />Текущая загруженность: ${station.currentLoad ?? 0}%<br />Нажмите, чтобы открыть почасовую загруженность.`,
          hintContent: station.name
        },
        {
          preset: getLoadPreset(station.currentLoad ?? 0),
          zIndex: station.id === selectedStationId ? 2000 : 1000
        }
      );

      placemark.events.add("click", () => {
        onSelect(station);
        placemark.balloon.open();
      });
      mapRef.current.geoObjects.add(placemark);
      return placemark;
    });

    if (!hasFitBoundsRef.current && placemarksRef.current.length > 0) {
      const bounds = mapRef.current.geoObjects.getBounds();

      if (bounds) {
        mapRef.current.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 40
        });
      }

      hasFitBoundsRef.current = true;
    }
  }, [isMapReady, stations, selectedStationId, onSelect]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.ymaps) {
      return;
    }

    if (routeLineRef.current) {
      mapRef.current.geoObjects.remove(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (!routeStations || routeStations.length < 2) {
      return;
    }

    const routeLine = new window.ymaps.Polyline(
      routeStations.map((station) => station.coordinates),
      {
        hintContent: routeStations.map((station) => station.name).join(" → ")
      },
      {
        strokeColor: "#132238",
        strokeWidth: 6,
        strokeOpacity: 0.86,
        zIndex: 500
      }
    );

    mapRef.current.geoObjects.add(routeLine);
    routeLineRef.current = routeLine;
  }, [isMapReady, routeStations]);

  useEffect(() => {
    if (!mapRef.current || !selectedStation) {
      return;
    }

    mapRef.current.panTo(selectedStation.coordinates, {
      flying: false,
      duration: 250
    });
  }, [selectedStation]);

  if (error) {
    return (
      <div className="map-placeholder">
        <p>{error}</p>
        <p>Данные по станции продолжат работать, но выбрать станцию можно только на карте.</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="map-placeholder">
        <p>Добавь `YANDEX_MAPS_API_KEY` в `.env`, чтобы включить карту.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="map" />;
}
