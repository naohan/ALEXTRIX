/**
 * ALEXTRIX HealthConnect Dashboard
 * Lógica principal para conexión WebSocket y manejo de datos en tiempo real
 */

class HealthConnectDashboard {
    constructor() {
        this.socket = null;
        // Usar configuración del archivo config.js si está disponible
        this.apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://127.0.0.1:8000/api';
        this.wsUrl = window.APP_CONFIG?.WS_URL || 'ws://127.0.0.1:8000/ws/datos';
        this.map = null;
        this.marker = null;
        this.mapInitialized = false;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        
        this.init();
    }

    init() {
        // Mostrar estado inicial de conexión
        this.updateConnectionStatus('connecting');
        
        this.setupWebSocket();
        this.initMap();
        this.loadHistoricalData();
        this.setupEventListeners();
        
        // Cargar datos iniciales
        this.fetchLastRecord();
        
        // Actualizar datos históricos cada 30 segundos
        setInterval(() => this.loadHistoricalData(), 30000);
    }

    setupWebSocket() {
        try {
            // Mostrar estado de conexión
            this.updateConnectionStatus('connecting');
            
            this.socket = new WebSocket(this.wsUrl);
            
            this.socket.onopen = () => {
                console.log('WebSocket conectado');
                this.updateConnectionStatus('connected');
                this.reconnectAttempts = 0;
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Normalizar datos antes de procesar
                    const normalizedData = this.normalizeData(data);
                    this.updateMetrics(normalizedData);
                    this.updateMap(normalizedData.gps);
                } catch (error) {
                    console.error('Error parsing WebSocket data:', error);
                    console.error('Raw data received:', event.data);
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket desconectado');
                this.updateConnectionStatus('disconnected');
                this.reconnect();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('disconnected');
            };
        } catch (error) {
            console.error('Error setting up WebSocket:', error);
            this.updateConnectionStatus('disconnected');
        }
    }

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            // Mostrar estado de reconexión
            this.updateConnectionStatus('connecting');
            const statusText = document.getElementById('connectionText');
            if (statusText) {
                statusText.textContent = `Reconectando... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
            }
            
            setTimeout(() => {
                this.setupWebSocket();
            }, 3000);
        } else {
            console.error('Máximo número de intentos de reconexión alcanzado');
            this.updateConnectionStatus('disconnected');
        }
    }

    updateConnectionStatus(status) {
        // status puede ser: 'connecting', 'connected', 'disconnected'
        this.isConnected = status === 'connected';
        const statusElement = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        
        if (!statusElement || !statusText) return;
        
        const indicator = statusElement.querySelector('.status-indicator');

        switch (status) {
            case 'connecting':
                statusElement.className = 'connection-status connecting';
                statusText.textContent = 'Conectando...';
                indicator.className = 'fas fa-circle status-indicator connecting';
                // Mostrar "Conectando..." en las métricas
                this.showConnectingState();
                break;
            case 'connected':
                statusElement.className = 'connection-status connected';
                statusText.textContent = 'Conectado';
                indicator.className = 'fas fa-circle status-indicator connected';
                break;
            case 'disconnected':
            default:
                statusElement.className = 'connection-status disconnected';
                statusText.textContent = 'Desconectado';
                indicator.className = 'fas fa-circle status-indicator disconnected';
                break;
        }
    }
    
    showConnectingState() {
        // Mostrar estado de "Conectando..." en las métricas si no hay datos
        const heartRateValue = document.getElementById('heartRateValue');
        const latitudeValue = document.getElementById('latitudeValue');
        const longitudeValue = document.getElementById('longitudeValue');
        
        if (heartRateValue && heartRateValue.textContent === '--') {
            heartRateValue.textContent = '...';
        }
        if (latitudeValue && latitudeValue.textContent === '--') {
            latitudeValue.textContent = '...';
        }
        if (longitudeValue && longitudeValue.textContent === '--') {
            longitudeValue.textContent = '...';
        }
    }

    /**
     * Normaliza los datos del backend para asegurar compatibilidad
     * Maneja diferentes formatos de respuesta (objeto directo, wrapper, etc.)
     */
    normalizeData(data) {
        // Si data ya tiene la estructura esperada, retornarlo
        if (data.frecuenciaCardiaca !== undefined || data.spo2 !== undefined) {
            // Normalizar GPS: puede venir como objeto {lat, lon} o como propiedades separadas
            if (!data.gps && (data.lat || data.longitude || data.lon)) {
                data.gps = {
                    lat: data.lat || data.latitude,
                    lon: data.lon || data.longitude
                };
            }
            return data;
        }
        
        // Si viene envuelto en otra estructura
        if (data.data) {
            return this.normalizeData(data.data);
        }
        
        return data;
    }

    updateMetrics(data) {
        // Normalizar datos primero
        const normalizedData = this.normalizeData(data);
        
        // Actualizar frecuencia cardíaca
        this.updateHeartRate(normalizedData.frecuenciaCardiaca);
        
        // SpO2 y temperatura eliminados de la interfaz
        
        // Actualizar ubicación
        this.updateLocation(normalizedData.gps);
        
        // Actualizar mapa con GPS
        this.updateMap(normalizedData.gps);
    }

    updateHeartRate(bpm) {
        const valueElement = document.getElementById('heartRateValue');
        const statusElement = document.getElementById('heartRateStatus');
        const cardElement = document.getElementById('heartRateCard');

        if (valueElement) {
            valueElement.textContent = bpm || '--';
        }

        let status = 'Normal';
        let statusClass = 'normal';

        if (bpm) {
            if (bpm > 130) {
                status = 'Alerta de Estrés';
                statusClass = 'critical';
                this.showAlert('⚠️ Estrés alto detectado: ' + bpm + ' BPM', 'danger');
            } else if (bpm > 100) {
                status = 'Elevado';
                statusClass = 'warning';
            } else if (bpm < 60) {
                status = 'Bajo';
                statusClass = 'warning';
            }
        }

        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `metric-status ${statusClass}`;
        }

        if (cardElement) {
            cardElement.className = `metric-card heart-rate ${statusClass}`;
        }

        // Actualizar gráfico
        if (window.heartRateChart) {
            this.updateChart(window.heartRateChart, bpm);
        }
    }

    updateSpo2(spo2) {
        const valueElement = document.getElementById('spo2Value');
        const statusElement = document.getElementById('spo2Status');
        const cardElement = document.getElementById('spo2Card');

        if (valueElement) {
            valueElement.textContent = spo2 || '--';
        }

        let status = 'Normal';
        let statusClass = 'normal';

        if (spo2) {
            if (spo2 < 93) {
                status = 'Oxigenación Baja';
                statusClass = 'critical';
                this.showAlert('❗ Oxigenación baja: ' + spo2 + '%', 'danger');
            } else if (spo2 < 97) {
                status = 'Moderada';
                statusClass = 'warning';
            }
        }

        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `metric-status ${statusClass}`;
        }

        if (cardElement) {
            cardElement.className = `metric-card spo2 ${statusClass}`;
        }

        // Actualizar gráfico
        if (window.spo2Chart) {
            this.updateChart(window.spo2Chart, spo2);
        }
    }

    /**
     * ACTUALIZACIÓN DE TEMPERATURA CORPORAL
     * =====================================
     * Procesa y visualiza los datos de temperatura corporal en tiempo real
     * 
     * @param {number} temp - Temperatura en grados Celsius desde el sensor
     * 
     * FUNCIONALIDADES:
     * - Actualiza el valor numérico en la interfaz
     * - Evalúa el estado de salud basado en rangos médicos
     * - Cambia colores de la tarjeta según el nivel de alerta
     * - Genera alertas automáticas para valores críticos
     * - Actualiza el gráfico temporal en tiempo real
     * 
     * RANGOS DE TEMPERATURA:
     * - Normal: 36.1°C - 37.2°C (zona verde)
     * - Fiebre: 37.2°C - 38.5°C (zona amarilla)
     * - Crítico: >38.5°C (zona roja - golpe de calor)
     * - Hipotermia: <36°C (zona amarilla)
     */
    updateTemperature(temp) {
        // Obtener elementos del DOM para actualización
        const valueElement = document.getElementById('temperatureValue');
        const statusElement = document.getElementById('temperatureStatus');
        const cardElement = document.getElementById('temperatureCard');

        // Actualizar valor numérico de temperatura
        if (valueElement) {
            valueElement.textContent = temp || '--';
        }

        // Inicializar estado como normal
        let status = 'Normal';
        let statusClass = 'normal';

        // Evaluar temperatura y determinar estado de salud
        if (temp) {
            if (temp > 38) {
                // CRÍTICO: Posible golpe de calor (>38°C)
                status = 'Golpe de Calor';
                statusClass = 'critical';
                this.showAlert('🔥 Posible golpe de calor: ' + temp + '°C', 'danger');
            } else if (temp > 37.5) {
                // ALERTA: Fiebre moderada (37.5°C - 38°C)
                status = 'Fiebre';
                statusClass = 'warning';
            } else if (temp < 36) {
                // ALERTA: Hipotermia (<36°C)
                status = 'Hipotermia';
                statusClass = 'warning';
            }
        }

        // Aplicar estado visual a los elementos
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `metric-status ${statusClass}`;
        }

        if (cardElement) {
            cardElement.className = `metric-card temperature ${statusClass}`;
        }

        // Actualizar gráfico temporal con nuevo punto de datos
        if (window.temperatureChart) {
            this.updateChart(window.temperatureChart, temp);
        }
    }

    updateLocation(gps) {
        const latElement = document.getElementById('latitudeValue');
        const lonElement = document.getElementById('longitudeValue');
        const statusElement = document.getElementById('locationStatus');

        if (latElement && lonElement) {
            // Manejar GPS como objeto o propiedades individuales
            let lat = null;
            let lon = null;
            
            if (gps) {
                if (typeof gps === 'object') {
                    lat = gps.lat || gps.latitude;
                    lon = gps.lon || gps.longitude || gps.lng;
                }
            }
            
            latElement.textContent = lat ? lat.toFixed(6) : '--';
            lonElement.textContent = lon ? lon.toFixed(6) : '--';

            if (statusElement) {
                statusElement.textContent = lat && lon ? 'Ubicado' : 'Desconocida';
                statusElement.className = `metric-status ${lat && lon ? 'normal' : 'warning'}`;
            }
        }
    }

    updateMap(gps) {
        if (!this.map || !gps) return;
        
        // Normalizar GPS: puede venir como objeto {lat, lon} o {latitude, longitude}
        const lat = gps.lat || gps.latitude;
        const lon = gps.lon || gps.longitude || gps.lng;
        
        if (lat && lon) {
            const latLng = [lat, lon];
            
            if (this.marker) {
                // Actualizar posición del marcador existente
                this.marker.setLatLng(latLng);
                
                // Centrar mapa en la nueva ubicación con animación suave
                this.map.panTo(latLng);
            } else {
                // Crear marcador nuevo con icono personalizado
                const customIcon = L.divIcon({
                    className: 'custom-marker',
                    html: '<i class="fas fa-map-marker-alt" style="font-size: 32px; color: #dc2626;"></i>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32]
                });
                
                this.marker = L.marker(latLng, { icon: customIcon }).addTo(this.map);
                
                // Centrar mapa en la primera ubicación
                this.map.setView(latLng, 15);
            }
            
            // Actualizar popup con información actualizada
            this.marker.bindPopup(`
                <div style="font-family: 'Poppins', sans-serif; padding: 8px;">
                    <strong style="color: #dc2626; font-size: 14px;">📍 Ubicación Actual</strong><br><br>
                <strong>Latitud:</strong> ${lat.toFixed(6)}<br>
                <strong>Longitud:</strong> ${lon.toFixed(6)}<br>
                    <strong>Actualizado:</strong> ${new Date().toLocaleTimeString()}
                </div>
            `);
            
            // Abrir popup automáticamente en la primera ubicación
            if (!this.mapInitialized) {
                this.marker.openPopup();
                this.mapInitialized = true;
            }
        }
    }

    initMap() {
        // Coordenadas de referencia (Arequipa, Perú)
        const centerLat = -16.3989;
        const centerLon = -71.537;
        
        this.map = L.map('map').setView([centerLat, centerLon], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Marcador inicial
        this.marker = L.marker([centerLat, centerLon]).addTo(this.map);
    }

    updateChart(chart, value) {
        if (chart && value !== null && value !== undefined) {
            const now = new Date();
            const timeLabel = now.toLocaleTimeString();
            
            chart.data.labels.push(timeLabel);
            chart.data.datasets[0].data.push(value);
            
            // Mantener solo los últimos 20 puntos
            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            
            chart.update('none');
        }
    }

    showAlert(message, type = 'warning') {
        const alertBanner = document.getElementById('alertBanner');
        const alertMessage = document.getElementById('alertMessage');
        
        if (alertBanner && alertMessage) {
            alertMessage.textContent = message;
            alertBanner.className = `alert-banner ${type}`;
            alertBanner.style.display = 'block';
            
            // Auto-hide después de 5 segundos
            setTimeout(() => {
                this.closeAlert();
            }, 5000);
            
            // Reproducir sonido de alerta (opcional)
            this.playAlertSound();
        }
    }

    closeAlert() {
        const alertBanner = document.getElementById('alertBanner');
        if (alertBanner) {
            alertBanner.style.display = 'none';
        }
    }

    playAlertSound() {
        try {
            // Crear un audio temporal para la alerta
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('No se pudo reproducir el sonido de alerta:', error);
        }
    }

    async fetchLastRecord() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sensores/ultimo`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Normalizar datos si vienen en formato diferente
            const normalizedData = this.normalizeData(data);
            this.updateMetrics(normalizedData);
        } catch (error) {
            console.error('Error fetching last record:', error);
            // Mostrar mensaje al usuario si es necesario
            if (error.message.includes('Failed to fetch')) {
                console.warn('No se pudo conectar al backend. Verifica que esté ejecutándose.');
            }
        }
    }

    async loadHistoricalData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sensores`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Asegurar que data sea un array
            const records = Array.isArray(data) ? data : (data.records || data.data || []);
            this.updateHistoricalTable(records);
        } catch (error) {
            console.error('Error loading historical data:', error);
            const tbody = document.getElementById('historicalData');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="no-data">Error al cargar datos</td></tr>';
            }
        }
    }

    updateHistoricalTable(data) {
        const tbody = document.getElementById('historicalData');
        if (!tbody || !Array.isArray(data)) return;

        // La API ya entrega los registros del más nuevo al más antiguo
        const lastRecords = data.slice(0, 10);
        
        if (lastRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = lastRecords.map(record => {
            // Normalizar GPS para la tabla
            let lat = '--';
            let lon = '--';
            if (record.gps) {
                lat = (record.gps.lat || record.gps.latitude || '--');
                lon = (record.gps.lon || record.gps.longitude || record.gps.lng || '--');
                if (typeof lat === 'number') lat = lat.toFixed(4);
                if (typeof lon === 'number') lon = lon.toFixed(4);
            } else if (record.lat || record.latitude) {
                lat = (record.lat || record.latitude || '--');
                lon = (record.lon || record.longitude || record.lng || '--');
                if (typeof lat === 'number') lat = lat.toFixed(4);
                if (typeof lon === 'number') lon = lon.toFixed(4);
            }
            
            return `
            <tr>
                <td>${record.idUsuario || record.id_usuario || '--'}</td>
                <td>${record.frecuenciaCardiaca || record.frecuencia_cardiaca || '--'}</td>
                <td>${lat}</td>
                <td>${lon}</td>
                <td>${record.timestamp ? new Date(record.timestamp).toLocaleString() : '--'}</td>
            </tr>
        `;
        }).join('');
    }

    setupEventListeners() {
        // Listener para cerrar alertas
        window.closeAlert = () => this.closeAlert();
        
        // Listener para errores globales
        window.addEventListener('error', (event) => {
            console.error('Error global:', event.error);
        });
    }
}

// Función global para cerrar alertas (usada desde HTML)
function closeAlert() {
    if (window.dashboard) {
        window.dashboard.closeAlert();
    }
}

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new HealthConnectDashboard();
});
