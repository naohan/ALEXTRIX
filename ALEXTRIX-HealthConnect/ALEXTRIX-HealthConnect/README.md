# ALEXTRIX HealthConnect API

API del monitoreo de un smartwatch. Recibe pulso y GPS, los guarda en PostgreSQL y los empuja al dashboard por WebSocket.

```
POST /api/sensores  --->  PostgreSQL (tabla registros)
                    \--->  WebSocket /ws/datos  --->  dashboard
```

Un solo dispositivo en la vista en vivo: `GET /api/sensores/ultimo` devuelve el último envío de cualquier reloj. El historial guarda cada lectura.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/` | Comprueba que el proceso está vivo |
| `POST` | `/api/sensores` | Lectura del smartwatch |
| `GET` | `/api/sensores/ultimo` | Última lectura |
| `GET` | `/api/sensores` | Últimos 50 registros, del más nuevo al más antiguo |
| `WS` | `/ws/datos` | Mismas lecturas, en el momento en que llegan |
| `GET` | `/docs` | Swagger |

Cuerpo que debe mandar el reloj:

```json
{
  "idUsuario": "user123",
  "frecuenciaCardiaca": 75,
  "alerta": "Normal",
  "gps": { "lat": -16.3989, "lon": -71.537 },
  "timestamp": "2026-10-07T12:00:00"
}
```

Si falta `lat` o `lon`, la API responde `422`. Con pulso mayor que 130 la respuesta incluye `"alerta": "⚠️ Estrés alto"`. Con pulso menor que 50, `"alerta": "⚠️ Frecuencia cardíaca baja"`.

La base usa la variable `DATABASE_URL`. Si no existe, arma la URL con `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST` y `DB_PORT` (ver `env.example`).

## Arranque local

Hace falta Python 3.12 y PostgreSQL con una base `alextrix_db`.

```powershell
cd ALEXTRIX-HealthConnect
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy env.example .env
```

Edita `.env` con el usuario y la clave locales. Luego:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Abre `http://127.0.0.1:8000`. Debe responder `Servidor ALEXTRIX activo`. Las tablas se crean al arrancar.

## Publicar en la VPS

Estos pasos asumen Ubuntu, la API en `/opt/alextrix` y el panel servido por Nginx en el mismo host. Un solo worker: los WebSocket viven en memoria del proceso. Con varios workers, el dashboard conectado a un proceso no vería la lectura que guardó otro.

### 1. Código y dependencias

```bash
sudo mkdir -p /opt/alextrix
sudo chown $USER:$USER /opt/alextrix
git clone https://github.com/naohan/ALEXTRIX-HealthConnect.git /opt/alextrix
cd /opt/alextrix
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

El repositorio incluye la carpeta del proyecto en la raíz del clone. Si `main.py` queda en un subdirectorio, entra ahí antes de crear el servicio. El `WorkingDirectory` de systemd tiene que ser la carpeta donde está `main.py`.

### 2. PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER alextrix WITH PASSWORD 'elige-una-clave';"
sudo -u postgres psql -c "CREATE DATABASE alextrix_db OWNER alextrix;"
```

Crea `/opt/alextrix/.env` (o en el subdirectorio de `main.py`):

```env
DATABASE_URL=postgresql://alextrix:elige-una-clave@localhost:5432/alextrix_db
```

### 3. Servicio

`/etc/systemd/system/alextrix.service`:

```ini
[Unit]
Description=ALEXTRIX HealthConnect API
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/alextrix
EnvironmentFile=/opt/alextrix/.env
ExecStart=/opt/alextrix/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1
Restart=always

[Install]
WantedBy=multi-user.target
```

Ajusta `WorkingDirectory`, `EnvironmentFile` y la ruta de `uvicorn` si el clone dejó `main.py` dentro de `ALEXTRIX-HealthConnect/`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now alextrix
sudo systemctl status alextrix
```

### 4. Nginx (API, WebSocket y dashboard)

Copia el frontend a `/var/www/alextrix` (`index.html`, `config.js`, `dashboard.js`, `charts.js`, `styles.css`). En `config.js`:

```javascript
const VPS_HOST = 'tu-dominio-o-ip';
const VPS_HTTPS = false;
```

`/etc/nginx/sites-available/alextrix`:

```nginx
server {
    listen 80;
    server_name tu-dominio-o-ip;

    root /var/www/alextrix;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/alextrix /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Abre el puerto 80 (y 443 si más adelante pones certificado). El 8000 puede quedarse solo en localhost.

### 5. Cambiar el smartwatch

En la configuración del reloj, sustituye la URL anterior (local o Render) por:

```text
http://tu-dominio-o-ip/api/sensores
```

Método `POST`, cuerpo JSON como el ejemplo de arriba. Prueba antes con curl:

```bash
curl -s -X POST http://tu-dominio-o-ip/api/sensores \
  -H "Content-Type: application/json" \
  -d '{"idUsuario":"reloj-1","frecuenciaCardiaca":78,"alerta":"Normal","gps":{"lat":-16.3989,"lon":-71.537},"timestamp":"2026-10-07T12:00:00"}'
```

Luego abre el dashboard en `http://tu-dominio-o-ip`. El estado debe pasar a **Conectado** y, al llegar una lectura, mover el pulso y el mapa.

## Estructura

```text
main.py                          Aplicación, CORS y WebSocket
backend/database.py              Conexión PostgreSQL
backend/models.py                Tabla registros
backend/routers/sensores.py      POST y consultas
backend/utils/alerts.py          Umbrales 130 y 50 BPM
backend/utils/websocket_manager.py
```

El archivo `RENDER_DEPLOYMENT.md` describe el despliegue anterior en Render. La clave de esa base no debe quedar escrita en el repositorio: si llegó a subirse, cámbiala en el panel de Render.
