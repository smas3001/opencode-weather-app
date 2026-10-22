import type { City, Unit, WeatherInfo } from "../types";

interface ForecastResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
  };
  current_units?: {
    temperature_2m?: string;
  };
}

export async function getCurrentWeather(city: City, unit: Unit): Promise<WeatherInfo> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", "temperature_2m");
  if (unit === "F") {
    url.searchParams.set("temperature_unit", "fahrenheit");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`el servicio de clima respondió ${response.status}`);
  }

  const data = (await response.json()) as ForecastResponse;
  const temperature = data.current?.temperature_2m;
  if (temperature === undefined) {
    throw new Error("la API no devolvió la temperatura actual");
  }

  return {
    temperature,
    unitSymbol: data.current_units?.temperature_2m ?? `°${unit}`,
    time: data.current?.time ?? "",
  };
}
