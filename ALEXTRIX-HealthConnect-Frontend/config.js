/**
 * ALEXTRIX HealthConnect - Configuración del Frontend
 *
 * Para publicar en la VPS, escribe el host en VPS_HOST (IP o dominio, sin http://).
 * Si lleva puerto directo de Uvicorn, inclúyelo: '203.0.113.10:8000'.
 * Con VPS_HOST vacío, el dashboard sigue usando Render.
 */

const VPS_HOST = '2.25.102.3';
const VPS_BASE = '/alextrix';
const VPS_HTTPS = false;

const CONFIG = {
    ENVIRONMENT: 'vps',

    development: {
        API_BASE_URL: 'http://127.0.0.1:8010/api',
        WS_URL: 'ws://127.0.0.1:8010/ws/datos'
    },

    vps: {
        API_BASE_URL: `${VPS_HTTPS ? 'https' : 'http'}://${VPS_HOST}${VPS_BASE}/api`,
        WS_URL: `${VPS_HTTPS ? 'wss' : 'ws'}://${VPS_HOST}${VPS_BASE}/ws/datos`
    },

    production: {
        API_BASE_URL: 'https://alextrix-healthconnect-v475.onrender.com/api',
        WS_URL: 'wss://alextrix-healthconnect-v475.onrender.com/ws/datos'
    },
    
    // Método para obtener la configuración actual
    get() {
        return this[this.ENVIRONMENT];
    }
};

// Exportar configuración
window.APP_CONFIG = CONFIG.get();

