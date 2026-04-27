import { useEffect, useState } from "react";

const SCRIPT_ID = "yandex-maps-script";

export function useYandexMaps(apiKey) {
  const [state, setState] = useState({
    isLoaded: false,
    error: null
  });

  useEffect(() => {
    if (!apiKey) {
      setState({
        isLoaded: false,
        error: "Не указан Yandex Maps API key"
      });
      return;
    }

    if (window.ymaps) {
      setState({
        isLoaded: true,
        error: null
      });
      return;
    }

    const existingScript = document.getElementById(SCRIPT_ID);

    if (existingScript) {
      const handleLoad = () => setState({ isLoaded: true, error: null });
      const handleError = () => setState({ isLoaded: false, error: "Не удалось загрузить Yandex Maps" });

      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;

    script.onload = () => {
      setState({
        isLoaded: true,
        error: null
      });
    };

    script.onerror = () => {
      setState({
        isLoaded: false,
        error: "Не удалось загрузить Yandex Maps"
      });
    };

    document.body.appendChild(script);
  }, [apiKey]);

  return state;
}

