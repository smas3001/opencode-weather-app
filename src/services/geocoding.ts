import type { City } from "../types";

interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

export async function searchCity(name: string): Promise<City | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`el servicio de geocoding respondió ${response.status}`);
  }

  const data = (await response.json()) as GeocodingResponse;
  const first = data.results?.[0];
  if (!first) {
    return null;
  }

  return {
    id: first.id,
    name: first.name,
    country: first.country ?? "",
    admin1: first.admin1,
    latitude: first.latitude,
    longitude: first.longitude,
  };
}
