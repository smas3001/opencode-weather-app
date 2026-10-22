import type { AppState, City, Unit, WeatherInfo } from "./types";
import { ask, readIndex, readOption } from "./io";
import { searchCity } from "./services/geocoding";
import { getCurrentWeather } from "./services/forecast";

const MENU_WIDTH = 40;

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function unitSymbol(unit: Unit): string {
  return unit === "F" ? "°F" : "°C";
}

function formatCity(city: City): string {
  const region = city.admin1 ? `, ${city.admin1}` : "";
  const country = city.country ? ` (${city.country})` : "";
  return `${city.name}${region}${country}`;
}

function printSeparator(): void {
  console.log("═".repeat(MENU_WIDTH));
}

function printWeatherLine(city: City, weather: WeatherInfo): void {
  console.log(`  ${formatCity(city)}: ${weather.temperature.toFixed(1)} ${weather.unitSymbol}`);
}

function printMenu(state: AppState): void {
  printSeparator();
  console.log("         WEATHER CLI");
  printSeparator();
  console.log("  1. Clima de ciudad default");
  console.log(`  2. Clima de todas las ciudades (${state.cities.length})`);
  console.log("  3. Buscar y agregar ciudad");
  console.log("  4. Eliminar ciudad");
  console.log("  5. Establecer ciudad default");
  console.log(`  8. Ajustes (${unitSymbol(state.unit)})`);
  console.log("  9. Salir");
  printSeparator();
}

function listCities(state: AppState): void {
  state.cities.forEach((city, index) => {
    const marker = city.id === state.defaultCityId ? " *" : "";
    console.log(`  ${index + 1}. ${formatCity(city)}${marker}`);
  });
}

async function showWeather(city: City, state: AppState): Promise<void> {
  try {
    const weather = await getCurrentWeather(city, state.unit);
    printWeatherLine(city, weather);
  } catch (error) {
    console.log(`  No se pudo obtener el clima de ${formatCity(city)}: ${message(error)}.`);
  }
}

async function handleDefault(state: AppState): Promise<void> {
  const city = state.cities.find((c) => c.id === state.defaultCityId);
  if (!city) {
    console.log("  No hay ciudad por defecto. Usa la opción 5 para establecer una.");
    return;
  }
  await showWeather(city, state);
}

async function handleAll(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log("  No hay ciudades registradas. Usa la opción 3 para agregar una.");
    return;
  }
  for (const city of state.cities) {
    await showWeather(city, state);
  }
}

async function handleAdd(state: AppState): Promise<void> {
  const name = (await ask("  Nombre de la ciudad: ")).trim();
  if (name === "") {
    console.log("  Debes ingresar un nombre.");
    return;
  }

  let found: City | null;
  try {
    found = await searchCity(name);
  } catch (error) {
    console.log(`  Error al buscar "${name}": ${message(error)}.`);
    return;
  }

  const city = found;
  if (!city) {
    console.log(`  No se encontró ninguna ciudad con el nombre "${name}".`);
    return;
  }
  if (state.cities.some((c) => c.id === city.id)) {
    console.log(`  ${formatCity(city)} ya está registrada.`);
    return;
  }

  state.cities.push(city);
  console.log(`  Ciudad agregada: ${formatCity(city)}.`);
  if (state.defaultCityId === null) {
    state.defaultCityId = city.id;
    console.log("  Se estableció como ciudad por defecto.");
  }
}

async function handleDelete(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log("  No hay ciudades para eliminar.");
    return;
  }
  listCities(state);
  const index = await readIndex("  Número de la ciudad a eliminar: ");
  if (index === null || index < 1 || index > state.cities.length) {
    console.log("  Número inválido.");
    return;
  }

  const removed = state.cities[index - 1];
  if (!removed) {
    console.log("  Número inválido.");
    return;
  }
  state.cities.splice(index - 1, 1);
  if (state.defaultCityId === removed.id) {
    state.defaultCityId = state.cities[0]?.id ?? null;
  }
  console.log(`  Ciudad eliminada: ${formatCity(removed)}.`);
}

async function handleSetDefault(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log("  No hay ciudades registradas.");
    return;
  }
  listCities(state);
  const index = await readIndex("  Número de la ciudad por defecto: ");
  if (index === null || index < 1 || index > state.cities.length) {
    console.log("  Número inválido.");
    return;
  }

  const city = state.cities[index - 1];
  if (!city) {
    console.log("  Número inválido.");
    return;
  }
  state.defaultCityId = city.id;
  console.log(`  Ciudad por defecto: ${formatCity(city)}.`);
}

async function handleSettings(state: AppState): Promise<void> {
  state.unit = state.unit === "C" ? "F" : "C";
  console.log(`  Unidad cambiada a ${unitSymbol(state.unit)}.`);
}

export async function runMenu(state: AppState): Promise<boolean> {
  printMenu(state);
  const option = await readOption();

  if (option === null) {
    console.log("  Opción inválida. Ingresa un número del menú.");
    return true;
  }

  switch (option) {
    case 1:
      await handleDefault(state);
      break;
    case 2:
      await handleAll(state);
      break;
    case 3:
      await handleAdd(state);
      break;
    case 4:
      await handleDelete(state);
      break;
    case 5:
      await handleSetDefault(state);
      break;
    case 8:
      await handleSettings(state);
      break;
    case 9:
      return false;
    default:
      console.log("  Opción inválida. Ingresa un número del menú.");
  }
  return true;
}
