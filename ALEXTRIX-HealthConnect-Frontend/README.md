# ALEXTRIX HealthConnect — Dashboard

Panel estático del monitoreo de un smartwatch. No tiene build: el navegador carga HTML, CSS y JavaScript, y habla con la API por HTTP y WebSocket.

## Pantalla

`index.html` es el panel de uso. Muestra el pulso, el estado, el GPS en un mapa de Leaflet, un gráfico de los últimos puntos y una tabla con los 10 registros más recientes.

`realtime.html` es una vista corta: pulso, coordenadas, id de usuario y lista de alertas.

`test-sender.html` manda lecturas de prueba al mismo endpoint que usa el reloj. Sirve para probar la VPS antes de cambiar el dispositivo.

## A qué servidor apunta

Todo sale de `config.js`.

| Variable | Efecto |
| --- | --- |
| `VPS_HOST` vacío | Sigue en Render: `alextrix-healthconnect-v475.onrender.com` |
| `VPS_HOST = 'tu-dominio-o-ip'` | API en `http://tu-dominio-o-ip/api` y WebSocket en `ws://tu-dominio-o-ip/ws/datos` |
| `VPS_HTTPS = true` | Cambia a `https` y `wss` |
| Host con puerto, por ejemplo `203.0.113.10:8000` | Habla directo con Uvicorn, sin Nginx |

Para la VPS que ya existe, deja el host escrito y vuelve a subir estos archivos al directorio que sirve Nginx (`/var/www/alextrix` en la guía del backend).

En local, puedes forzar la API de tu máquina cambiando en `config.js` la línea del entorno:

```javascript
ENVIRONMENT: 'development',
```

Eso usa `http://127.0.0.1:8000`.

## Cómo abrirlo

Con la API ya corriendo:

```powershell
cd ALEXTRIX-HealthConnect-Frontend
python -m http.server 5500
```

Abre `http://127.0.0.1:5500`. El indicador superior debe decir **Conectado**. Si se queda en desconectado, la URL de `config.js` no coincide con donde está la API, o el proxy no reenvía `/ws/` con upgrade de WebSocket.

## Archivos

| Archivo | Rol |
| --- | --- |
| `index.html` | Estructura del panel |
| `styles.css` | Estilos |
| `config.js` | Host de la API y del WebSocket |
| `dashboard.js` | Conexión, métricas, mapa e historial |
| `charts.js` | Gráfico de pulso |
| `test-sender.html` | Simula el smartwatch |
