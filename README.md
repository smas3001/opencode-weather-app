## Weather CLI APP

El objetivo de esta aplicación es que creemos una aplicación de consola que pida que ingresemos la ciudad, Al final, generaremos un binario ejecutable.

## Opciones:

Ingresar el nombre de una ciudad.
Guardar la ciudad por defecto.
Registrar varias otras ciudades para buscar el clima en esas otras ciudades.
Stack
Bun.js
OpenMeteo

## Ejemplo de petición http:

Paso 1: Geocoding API.
Paso 2: OpenMeteo API.
https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=1&language=es&format=json
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m

## Inicializar proyecto

```bash
bun init
```

## Releases

Al actualizar `version` en `package.json` y subir el cambio a `main`, GitHub Actions ejecuta `bun run build` y publica el binario Linux x64 `weather` en un release con la etiqueta `v<version>`. También se puede iniciar el workflow manualmente desde la pestaña **Actions**. Cada versión debe ser única; si la etiqueta ya existe, hay que actualizar la versión antes de publicar de nuevo.

## Ejemplo del menú
Esta es la apariencia que deseamos crear

```bash 

════════════════════════════════════════
         WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades (1)
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════
  Selecciona una opción: 5

  ```