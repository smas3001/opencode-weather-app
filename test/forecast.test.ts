import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { Mock } from "bun:test";
import { getCurrentWeather } from "../src/services/forecast";
import { makeCity } from "./helpers";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type FetchFn = (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) => Promise<Response>;

let fetchSpy: Mock<FetchFn>;

beforeEach(() => {
  fetchSpy = spyOn(globalThis, "fetch") as unknown as Mock<FetchFn>;
  fetchSpy.mockImplementation(async () =>
    jsonResponse({
      current: { time: "2024-05-05T12:00", temperature_2m: 21.3 },
      current_units: { temperature_2m: "°C" },
    }),
  );
});

afterEach(() => {
  fetchSpy.mockRestore();
});

function requestedUrl(): URL {
  const input = fetchSpy.mock.calls[0]?.[0];
  expect(input).toBeInstanceOf(URL);
  return input as URL;
}

const city = makeCity({ latitude: 45.41117, longitude: -75.69812 });

describe("getCurrentWeather", () => {
  test("consulta la API de pronóstico con las coordenadas de la ciudad", async () => {
    await getCurrentWeather(city, "C");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = requestedUrl();
    expect(`${url.origin}${url.pathname}`).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("45.41117");
    expect(url.searchParams.get("longitude")).toBe("-75.69812");
    expect(url.searchParams.get("current")).toBe("temperature_2m");
  });

  test("no pide fahrenheit cuando la unidad es Celsius", async () => {
    await getCurrentWeather(city, "C");

    expect(requestedUrl().searchParams.get("temperature_unit")).toBeNull();
  });

  test("pide fahrenheit cuando la unidad es Fahrenheit", async () => {
    await getCurrentWeather(city, "F");

    expect(requestedUrl().searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("devuelve la temperatura, el símbolo de unidad y la hora", async () => {
    const weather = await getCurrentWeather(city, "C");

    expect(weather).toEqual({
      temperature: 21.3,
      unitSymbol: "°C",
      time: "2024-05-05T12:00",
    });
  });

  test("usa el símbolo de unidad devuelto por la API", async () => {
    fetchSpy.mockImplementation(async () => 
      jsonResponse({
        current: { time: "2024-05-05T12:00", temperature_2m: 70.2 },
        current_units: { temperature_2m: "°F" },
      }),
    );

    const weather = await getCurrentWeather(city, "F");

    expect(weather.unitSymbol).toBe("°F");
    expect(weather.temperature).toBe(70.2);
  });

  test("hace fallback al símbolo de unidad cuando la API no lo devuelve", async () => {
    fetchSpy.mockImplementation(async () => 
      jsonResponse({ current: { time: "2024-05-05T12:00", temperature_2m: 21.3 } }),
    );

    expect((await getCurrentWeather(city, "C")).unitSymbol).toBe("°C");
    expect((await getCurrentWeather(city, "F")).unitSymbol).toBe("°F");
  });

  test("usa una hora vacía cuando la API no devuelve current.time", async () => {
    fetchSpy.mockImplementation(async () => jsonResponse({ current: { temperature_2m: 15 } }));

    expect((await getCurrentWeather(city, "C")).time).toBe("");
  });

  test("lanza un error cuando la API responde con error", async () => {
    fetchSpy.mockImplementation(async () => jsonResponse({}, 404));

    await expect(getCurrentWeather(city, "C")).rejects.toThrow(
      "el servicio de clima respondió 404",
    );
  });

  test("lanza un error cuando la API no devuelve la temperatura actual", async () => {
    fetchSpy.mockImplementation(async () => jsonResponse({ current: { time: "2024-05-05T12:00" } }));

    await expect(getCurrentWeather(city, "C")).rejects.toThrow(
      "la API no devolvió la temperatura actual",
    );
  });
});
