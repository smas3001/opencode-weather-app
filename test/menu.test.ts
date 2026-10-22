import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { City, WeatherInfo } from "../src/types";
import { captureConsole, makeCity, makeState } from "./helpers";
import type { ConsoleCapture } from "./helpers";

interface IoControl {
  option: number | null;
  index: number | null;
  answer: string;
}

interface ServiceControl {
  city: City | null;
  cityError: Error | null;
  weather: WeatherInfo;
  weatherError: Error | null;
}

const io: IoControl = { option: null, index: null, answer: "" };

const services: ServiceControl = {
  city: null,
  cityError: null,
  weather: { temperature: 21.3, unitSymbol: "°C", time: "2024-05-05T12:00" },
  weatherError: null,
};

mock.module("../src/io", () => ({
  ask: async (_question: string): Promise<string> => io.answer,
  readOption: async (): Promise<number | null> => io.option,
  readIndex: async (_prompt: string): Promise<number | null> => io.index,
}));

mock.module("../src/services/geocoding", () => ({
  searchCity: async (_name: string): Promise<City | null> => {
    if (services.cityError) {
      throw services.cityError;
    }
    return services.city;
  },
}));

mock.module("../src/services/forecast", () => ({
  getCurrentWeather: async (_city: City, unit: "C" | "F"): Promise<WeatherInfo> => {
    if (services.weatherError) {
      throw services.weatherError;
    }
    return { ...services.weather, unitSymbol: unit === "F" ? "°F" : "°C" };
  },
}));

const { runMenu } = await import("../src/menu");

let capture: ConsoleCapture;

beforeEach(() => {
  io.option = null;
  io.index = null;
  io.answer = "";
  services.city = null;
  services.cityError = null;
  services.weather = { temperature: 21.3, unitSymbol: "°C", time: "2024-05-05T12:00" };
  services.weatherError = null;
  capture = captureConsole();
});

afterEach(() => {
  capture.restore();
});

describe("renderizado del menú", () => {
  test("muestra las opciones 1, 2, 3, 4, 5, 8 y 9", async () => {
    await runMenu(makeState());

    const output = capture.output();
    expect(output).toContain("WEATHER CLI");
    expect(output).toContain("  1. Clima de ciudad default");
    expect(output).toContain("  2. Clima de todas las ciudades (0)");
    expect(output).toContain("  3. Buscar y agregar ciudad");
    expect(output).toContain("  4. Eliminar ciudad");
    expect(output).toContain("  5. Establecer ciudad default");
    expect(output).toContain("  8. Ajustes (°C)");
    expect(output).toContain("  9. Salir");
  });

  test("no muestra las opciones 6 ni 7", async () => {
    await runMenu(makeState());

    const output = capture.output();
    expect(output).not.toContain("  6.");
    expect(output).not.toContain("  7.");
  });

  test("muestra la cantidad de ciudades y la unidad configurada", async () => {
    const state = makeState({
      cities: [makeCity({ id: 1 }), makeCity({ id: 2 })],
      unit: "F",
    });

    await runMenu(state);

    const output = capture.output();
    expect(output).toContain("  2. Clima de todas las ciudades (2)");
    expect(output).toContain("  8. Ajustes (°F)");
  });
});

describe("opción 9", () => {
  test("termina el bucle devolviendo false", async () => {
    io.option = 9;

    expect(await runMenu(makeState())).toBe(false);
  });
});

describe("opciones inválidas", () => {
  test("una entrada no numérica muestra el aviso y sigue el bucle", async () => {
    io.option = null;

    expect(await runMenu(makeState())).toBe(true);
    expect(capture.output()).toContain("  Opción inválida. Ingresa un número del menú.");
  });

  test("una opción fuera del menú muestra el aviso y sigue el bucle", async () => {
    io.option = 6;

    expect(await runMenu(makeState())).toBe(true);
    expect(capture.output()).toContain("  Opción inválida. Ingresa un número del menú.");
  });
});

describe("opción 1: clima de la ciudad default", () => {
  test("avisa cuando no hay ciudad default", async () => {
    io.option = 1;

    await runMenu(makeState());

    expect(capture.output()).toContain("  No hay ciudad por defecto. Usa la opción 5 para establecer una.");
  });

  test("muestra el clima de la ciudad default", async () => {
    io.option = 1;
    const city = makeCity({ id: 10, name: "Ottawa" });
    const state = makeState({ cities: [city], defaultCityId: 10 });

    await runMenu(state);

    expect(capture.output()).toContain("  Ottawa, Ontario (Canada): 21.3 °C");
  });

  test("informa cuando la API de clima falla", async () => {
    io.option = 1;
    services.weatherError = new Error("sin conexión");
    const city = makeCity({ id: 10, name: "Ottawa" });
    const state = makeState({ cities: [city], defaultCityId: 10 });

    await runMenu(state);

    expect(capture.output()).toContain(
      "  No se pudo obtener el clima de Ottawa, Ontario (Canada): sin conexión.",
    );
  });
});

describe("opción 2: clima de todas las ciudades", () => {
  test("avisa cuando no hay ciudades registradas", async () => {
    io.option = 2;

    await runMenu(makeState());

    expect(capture.output()).toContain("  No hay ciudades registradas. Usa la opción 3 para agregar una.");
  });

  test("muestra una línea por ciudad", async () => {
    io.option = 2;
    const state = makeState({
      cities: [makeCity({ id: 1, name: "Ottawa" }), makeCity({ id: 2, name: "Caracas" })],
    });

    await runMenu(state);

    const output = capture.output();
    expect(output).toContain("  Ottawa, Ontario (Canada): 21.3 °C");
    expect(output).toContain("  Caracas, Ontario (Canada): 21.3 °C");
  });
});

describe("opción 3: buscar y agregar ciudad", () => {
  test("pide un nombre y avisa si está vacío", async () => {
    io.option = 3;
    io.answer = "   ";

    await runMenu(makeState());

    expect(capture.output()).toContain("  Debes ingresar un nombre.");
  });

  test("informa cuando la búsqueda falla", async () => {
    io.option = 3;
    io.answer = "Ottawa";
    services.cityError = new Error("el servicio de geocoding respondió 500");

    await runMenu(makeState());

    expect(capture.output()).toContain('  Error al buscar "Ottawa": el servicio de geocoding respondió 500.');
  });

  test("informa cuando no se encuentra la ciudad", async () => {
    io.option = 3;
    io.answer = "Ciudad Inventada";
    services.city = null;

    await runMenu(makeState());

    expect(capture.output()).toContain('  No se encontró ninguna ciudad con el nombre "Ciudad Inventada".');
  });

  test("informa cuando la ciudad ya está registrada", async () => {
    io.option = 3;
    io.answer = "Ottawa";
    services.city = makeCity({ id: 1, name: "Ottawa" });
    const state = makeState({ cities: [makeCity({ id: 1, name: "Ottawa" })] });

    await runMenu(state);

    expect(capture.output()).toContain("  Ottawa, Ontario (Canada) ya está registrada.");
    expect(state.cities).toHaveLength(1);
  });

  test("agrega la ciudad encontrada", async () => {
    io.option = 3;
    io.answer = "Ottawa";
    services.city = makeCity({ id: 99, name: "Ottawa" });
    const state = makeState();

    await runMenu(state);

    expect(state.cities).toHaveLength(1);
    expect(state.cities[0]?.id).toBe(99);
    expect(capture.output()).toContain("  Ciudad agregada: Ottawa, Ontario (Canada).");
  });

  test("establece la primera ciudad agregada como default", async () => {
    io.option = 3;
    io.answer = "Ottawa";
    services.city = makeCity({ id: 99, name: "Ottawa" });
    const state = makeState();

    await runMenu(state);

    expect(state.defaultCityId).toBe(99);
    expect(capture.output()).toContain("  Se estableció como ciudad por defecto.");
  });

  test("no cambia el default si ya existía uno", async () => {
    io.option = 3;
    io.answer = "Caracas";
    services.city = makeCity({ id: 99, name: "Caracas" });
    const state = makeState({ cities: [makeCity({ id: 1, name: "Ottawa" })], defaultCityId: 1 });

    await runMenu(state);

    expect(state.defaultCityId).toBe(1);
    expect(capture.output()).not.toContain("  Se estableció como ciudad por defecto.");
  });
});

describe("opción 4: eliminar ciudad", () => {
  test("avisa cuando no hay ciudades para eliminar", async () => {
    io.option = 4;

    await runMenu(makeState());

    expect(capture.output()).toContain("  No hay ciudades para eliminar.");
  });

  test("avisa con un número inválido", async () => {
    io.option = 4;
    io.index = 5;
    const state = makeState({ cities: [makeCity({ id: 1 })] });

    await runMenu(state);

    expect(capture.output()).toContain("  Número inválido.");
    expect(state.cities).toHaveLength(1);
  });

  test("elimina la ciudad elegida", async () => {
    io.option = 4;
    io.index = 2;
    const state = makeState({
      cities: [makeCity({ id: 1, name: "Ottawa" }), makeCity({ id: 2, name: "Caracas" })],
      defaultCityId: 1,
    });

    await runMenu(state);

    expect(state.cities).toHaveLength(1);
    expect(state.cities[0]?.name).toBe("Ottawa");
    expect(capture.output()).toContain("  Ciudad eliminada: Caracas, Ontario (Canada).");
  });

  test("reasigna el default cuando se elimina la ciudad default", async () => {
    io.option = 4;
    io.index = 1;
    const state = makeState({
      cities: [makeCity({ id: 1, name: "Ottawa" }), makeCity({ id: 2, name: "Caracas" })],
      defaultCityId: 1,
    });

    await runMenu(state);

    expect(state.defaultCityId).toBe(2);
  });

  test("deja el default en null si era la última ciudad", async () => {
    io.option = 4;
    io.index = 1;
    const state = makeState({ cities: [makeCity({ id: 1, name: "Ottawa" })], defaultCityId: 1 });

    await runMenu(state);

    expect(state.defaultCityId).toBeNull();
  });
});

describe("opción 5: establecer ciudad default", () => {
  test("avisa cuando no hay ciudades registradas", async () => {
    io.option = 5;

    await runMenu(makeState());

    expect(capture.output()).toContain("  No hay ciudades registradas.");
  });

  test("avisa con un número inválido", async () => {
    io.option = 5;
    io.index = 0;
    const state = makeState({ cities: [makeCity({ id: 1 })] });

    await runMenu(state);

    expect(capture.output()).toContain("  Número inválido.");
    expect(state.defaultCityId).toBeNull();
  });

  test("establece la ciudad elegida como default", async () => {
    io.option = 5;
    io.index = 2;
    const state = makeState({
      cities: [makeCity({ id: 1, name: "Ottawa" }), makeCity({ id: 2, name: "Caracas" })],
    });

    await runMenu(state);

    expect(state.defaultCityId).toBe(2);
    expect(capture.output()).toContain("  Ciudad por defecto: Caracas, Ontario (Canada).");
  });
});

describe("opción 8: ajustes", () => {
  test("cambia de Celsius a Fahrenheit", async () => {
    io.option = 8;
    const state = makeState({ unit: "C" });

    await runMenu(state);

    expect(state.unit).toBe("F");
    expect(capture.output()).toContain("  Unidad cambiada a °F.");
  });

  test("cambia de Fahrenheit a Celsius", async () => {
    io.option = 8;
    const state = makeState({ unit: "F" });

    await runMenu(state);

    expect(state.unit).toBe("C");
    expect(capture.output()).toContain("  Unidad cambiada a °C.");
  });
});
