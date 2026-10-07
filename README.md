# ALEXTRIX HealthConnect

Plataforma de monitoreo de salud que recibe la frecuencia cardíaca y la ubicación de un smartwatch, las guarda y las muestra en un dashboard en tiempo real.

El reloj envía cada lectura a una API en FastAPI. Esa API la persiste en PostgreSQL y la publica al panel por WebSocket, sin recargar la página.

```
smartwatch  --POST /api/sensores-->  API (FastAPI)  --guarda-->  PostgreSQL
                                         |
                                         +--WebSocket /ws/datos-->  Dashboard
```

## Funcionalidades

- ❤️ Monitoreo de frecuencia cardíaca en tiempo real
- 📍 Visualización de ubicación GPS
- ⚡ Actualización instantánea mediante WebSocket
- 🚨 Detección automática de frecuencia cardíaca fuera de rango
- 📊 Gráfico de las últimas lecturas
- 🗃️ Historial de mediciones almacenadas en PostgreSQL
- 🧪 Simulador de smartwatch para pruebas
- 🌐 Despliegue mediante Nginx y Uvicorn

El panel está pensado para un smartwatch. Las tarjetas, el mapa y el gráfico muestran la última lectura recibida. El historial conserva los últimos 50 envíos.

## Qué ve el dashboard

| Zona | Qué muestra |
| --- | --- |
| Frecuencia cardíaca | BPM de la última lectura y estado (normal, elevado, alerta) |
| GPS | Latitud, longitud y marcador en el mapa (Arequipa como centro inicial) |
| Gráfico | Últimos 20 puntos de pulso que llegan por WebSocket |
| Historial | Los 10 registros más recientes |
| Banner | Aviso sonoro si el pulso supera 130 BPM |

Páginas:

- `index.html` — panel principal
- `realtime.html` — vista reducida (pulso, GPS, id de usuario y alertas)
- `test-sender.html` — simula el reloj sin tener el dispositivo a mano

## Qué envía el smartwatch

`POST /api/sensores` con `Content-Type: application/json`.

```json
{
  "idUsuario": "user123",
  "frecuenciaCardiaca": 75,
  "alerta": "Normal",
  "gps": { "lat": -16.3989, "lon": -71.537 },
  "timestamp": "2026-10-07T12:00:00"
}
```

`gps.lat` y `gps.lon` son obligatorios. Si `alerta` viene vacía o como `"Normal"`, el servidor la recalcula:

| Pulso | Alerta del servidor |
| --- | --- |
| Mayor que 130 | Estrés alto |
| Menor que 50 | Frecuencia cardíaca baja |
| Entre 50 y 130 | Normal |

El dashboard, por su lado, marca el pulso como elevado a partir de 100 BPM y como bajo por debajo de 60. El aviso rojo del banner sale desde 130 BPM.

## Repositorios

| Carpeta | Repositorio | Rol |
| --- | --- | --- |
| `ALEXTRIX-HealthConnect/ALEXTRIX-HealthConnect` | [ALEXTRIX-HealthConnect](https://github.com/naohan/ALEXTRIX-HealthConnect) | API, base de datos y WebSocket |
| `ALEXTRIX-HealthConnect-Frontend` | [ALEXTRIX-HealthConnect-Frontend](https://github.com/naohan/ALEXTRIX-HealthConnect-Frontend) | Dashboard estático |

La guía de la API y el despliegue está en el README del backend. La del panel, en el README del frontend.

## Dirección en la VPS

El panel y la API están publicados en la carpeta `alextrix`:

- Dashboard: `http://2.25.102.3/alextrix/`
- Smartwatch: `POST http://2.25.102.3/alextrix/api/sensores`

En `ALEXTRIX-HealthConnect-Frontend/config.js` eso ya está escrito como `VPS_HOST` y `VPS_BASE`.

Comprobación desde cualquier máquina:

```bash
curl -X POST http://2.25.102.3/alextrix/api/sensores \
  -H "Content-Type: application/json" \
  -d "{\"idUsuario\":\"reloj-1\",\"frecuenciaCardiaca\":78,\"alerta\":\"Normal\",\"gps\":{\"lat\":-16.3989,\"lon\":-71.537},\"timestamp\":\"2026-10-07T12:00:00\"}"
```

La respuesta correcta es `{"status":"ok","mensaje":"Dato guardado correctamente"}`. El panel debe mover el pulso y el marcador sin recargar.

Los pasos de PostgreSQL, systemd y Nginx están en el README del backend.
