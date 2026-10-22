export type Unit = "C" | "F";

export interface City {
  id: number;
  name: string;
  country: string;
  admin1: string | undefined;
  latitude: number;
  longitude: number;
}

export interface AppState {
  cities: City[];
  defaultCityId: number | null;
  unit: Unit;
}

export interface WeatherInfo {
  temperature: number;
  unitSymbol: string;
  time: string;
}
