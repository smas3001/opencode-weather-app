import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { Mock } from "bun:test";
import { searchCity } from "../src/services/geocoding";

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
  fetchSpy.mockImplementation(async () => jsonResponse({ results: [] }));
});

afterEach(() => {
  fetchSpy.mockRestore();
});

function requestedUrl(): URL {
  const input = fetchSpy.mock.calls[0]?.[0];
  expect(input).toBeInstanceOf(URL);
  return input as URL;
}

describe("searchCity", () => {
  test("consulta la API de geocoding con los parámetros esperados", async () => {
    await searchCity("Ottawa");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = requestedUrl();
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://geocoding-api.open-meteo.com/v1/search",
    );
    expect(url.searchParams.get("name")).toBe("Ottawa");
    expect(url.searchParams.get("count")).toBe("1");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("format")).toBe("json");
  });

  test("codifica el nombre de la ciudad en la URL", async () => {
    await searchCity("Ciudad Nueva");

    const url = requestedUrl();
    expect(url.searchParams.get("name")).toBe("Ciudad Nueva");
    expect(url.href).toContain("name=Ciudad+Nueva");
  });

  test("mapea el primer resultado a una ciudad", async () => {
    fetchSpy.mockImplementation(async () => 
      jsonResponse({
        results: [
          {
            id: 1234,
            name: "Ottawa",
            latitude: 45.41117,
            longitude: -75.69812,
            country: "Canadá",
            admin1: "Ontario",
          },
        ],
      }),
    );

    const city = await searchCity("Ottawa");

    expect(city).toEqual({
      id: 1234,
      name: "Ottawa",
      country: "Canadá",
      admin1: "Ontario",
      latitude: 45.41117,
      longitude: -75.69812,
    });
  });

  test("usa valores por defecto cuando el resultado no trae country ni admin1", async () => {
    fetchSpy.mockImplementation(async () => 
      jsonResponse({ results: [{ id: 9, name: "Ahorahere", latitude: 1, longitude: 2 }] }),
    );

    const city = await searchCity("Ahorahere");

    expect(city?.country).toBe("");
    expect(city?.admin1).toBeUndefined();
  });

  test("devuelve null cuando no hay resultados", async () => {
    expect(await searchCity("Ciudad Inventada")).toBeNull();
  });

  test("devuelve null cuando la respuesta no trae la propiedad results", async () => {
    fetchSpy.mockImplementation(async () => jsonResponse({}));

    expect(await searchCity("Ciudad Inventada")).toBeNull();
  });

  test("lanza un error cuando la API responde con error", async () => {
    fetchSpy.mockImplementation(async () => jsonResponse({}, 500));

    await expect(searchCity("Ottawa")).rejects.toThrow(
      "el servicio de geocoding respondió 500",
    );
  });
});
