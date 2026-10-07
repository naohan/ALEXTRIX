/**
 * ALEXTRIX HealthConnect Charts
 * Configuración de gráficos Chart.js para visualización de datos en tiempo real
 */

class HealthCharts {
    constructor() {
        this.charts = {};
        this.chartColors = {
            heartRate: '#e91e63',
            spo2: '#2196f3',
            temperature: '#ff9800',
            gridLines: '#374151',
            text: '#ffffff'
        };
        
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createCharts());
        } else {
            this.createCharts();
        }
    }

    createCharts() {
        this.createHeartRateChart();
        // Gráficos de SpO2 y temperatura eliminados de la interfaz
        // this.createSpo2Chart();
        // this.createTemperatureChart();
        
        // Guardar referencias globales para acceso desde dashboard.js
        window.heartRateChart = this.charts.heartRate;
        // window.spo2Chart = this.charts.spo2;
        // window.temperatureChart = this.charts.temperature;
    }

    getChartOptions(title, color, unit = '') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: color,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${title}: ${context.parsed.y}${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: this.chartColors.gridLines,
                        drawBorder: false
                    },
                    ticks: {
                        color: this.chartColors.text,
                        maxTicksLimit: 8
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: this.chartColors.gridLines,
                        drawBorder: false
                    },
                    ticks: {
                        color: this.chartColors.text
                    },
                    title: {
                        display: true,
                        text: unit,
                        color: this.chartColors.text,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6,
                    borderWidth: 2,
                    backgroundColor: color,
                    borderColor: color
                },
                line: {
                    borderWidth: 3,
                    borderColor: color,
                    backgroundColor: this.addAlpha(color, 0.1),
                    tension: 0.4
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        };
    }

    createHeartRateChart() {
        const ctx = document.getElementById('heartRateChart');
        if (!ctx) return;

        this.charts.heartRate = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Frecuencia Cardíaca',
                    data: [],
                    fill: true,
                    borderColor: this.chartColors.heartRate,
                    backgroundColor: this.addAlpha(this.chartColors.heartRate, 0.1),
                    pointBackgroundColor: this.chartColors.heartRate,
                    pointBorderColor: this.chartColors.heartRate,
                    tension: 0.4
                }]
            },
            options: {
                ...this.getChartOptions('Frecuencia Cardíaca', this.chartColors.heartRate, ' BPM'),
                scales: {
                    ...this.getChartOptions('Frecuencia Cardíaca', this.chartColors.heartRate, ' BPM').scales,
                    y: {
                        ...this.getChartOptions('Frecuencia Cardíaca', this.chartColors.heartRate, ' BPM').scales.y,
                        min: 40,
                        max: 140,
                        ticks: {
                            ...this.getChartOptions('Frecuencia Cardíaca', this.chartColors.heartRate, ' BPM').scales.y.ticks,
                            callback: function(value) {
                                return value + ' BPM';
                            }
                        }
                    }
                },
                plugins: {
                    ...this.getChartOptions('Frecuencia Cardíaca', this.chartColors.heartRate, ' BPM').plugins,
                    annotation: {
                        annotations: {
                            normalZone: {
                                type: 'box',
                                yMin: 60,
                                yMax: 100,
                                backgroundColor: this.addAlpha('#4caf50', 0.1),
                                borderColor: '#4caf50',
                                borderWidth: 1,
                                label: {
                                    content: 'Zona Normal',
                                    enabled: true,
                                    color: '#4caf50'
                                }
                            },
                            warningZone: {
                                type: 'box',
                                yMin: 100,
                                yMax: 130,
                                backgroundColor: this.addAlpha('#ff9800', 0.1),
                                borderColor: '#ff9800',
                                borderWidth: 1,
                                label: {
                                    content: 'Alerta',
                                    enabled: true,
                                    color: '#ff9800'
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    createSpo2Chart() {
        const ctx = document.getElementById('spo2Chart');
        if (!ctx) return;

        this.charts.spo2 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Saturación de Oxígeno',
                    data: [],
                    fill: true,
                    borderColor: this.chartColors.spo2,
                    backgroundColor: this.addAlpha(this.chartColors.spo2, 0.1),
                    pointBackgroundColor: this.chartColors.spo2,
                    pointBorderColor: this.chartColors.spo2,
                    tension: 0.4
                }]
            },
            options: {
                ...this.getChartOptions('SpO₂', this.chartColors.spo2, '%'),
                scales: {
                    ...this.getChartOptions('SpO₂', this.chartColors.spo2, '%').scales,
                    y: {
                        ...this.getChartOptions('SpO₂', this.chartColors.spo2, '%').scales.y,
                        min: 85,
                        max: 100,
                        ticks: {
                            ...this.getChartOptions('SpO₂', this.chartColors.spo2, '%').scales.y.ticks,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    ...this.getChartOptions('SpO₂', this.chartColors.spo2, '%').plugins,
                    annotation: {
                        annotations: {
                            normalZone: {
                                type: 'box',
                                yMin: 97,
                                yMax: 100,
                                backgroundColor: this.addAlpha('#4caf50', 0.1),
                                borderColor: '#4caf50',
                                borderWidth: 1,
                                label: {
                                    content: 'Normal (97-100%)',
                                    enabled: true,
                                    color: '#4caf50'
                                }
                            },
                            warningZone: {
                                type: 'box',
                                yMin: 93,
                                yMax: 97,
                                backgroundColor: this.addAlpha('#ff9800', 0.1),
                                borderColor: '#ff9800',
                                borderWidth: 1,
                                label: {
                                    content: 'Moderado (93-97%)',
                                    enabled: true,
                                    color: '#ff9800'
                                }
                            },
                            criticalZone: {
                                type: 'box',
                                yMin: 85,
                                yMax: 93,
                                backgroundColor: this.addAlpha('#f44336', 0.1),
                                borderColor: '#f44336',
                                borderWidth: 1,
                                label: {
                                    content: 'Crítico (<93%)',
                                    enabled: true,
                                    color: '#f44336'
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * CREACIÓN DEL GRÁFICO DE TEMPERATURA CORPORAL
     * ============================================
     * Configura un gráfico de línea temporal para visualizar la temperatura corporal
     * con zonas de alerta médica y rangos de salud estándar.
     * 
     * CARACTERÍSTICAS DEL GRÁFICO:
     * - Tipo: Línea temporal con relleno degradado
     * - Rango Y: 34°C - 40°C (cubre hipotermia a hipertermia)
     * - Color: Naranja (#ff9800) para identificación visual
     * - Animación: Suave y responsiva
     * - Zonas de alerta: Normal, Fiebre, Crítico
     * 
     * ZONAS DE ALERTA MÉDICA:
     * - Verde (36.1-37.2°C): Temperatura normal
     * - Amarillo (37.2-38.5°C): Fiebre moderada
     * - Rojo (>38.5°C): Estado crítico
     */
    createTemperatureChart() {
        const ctx = document.getElementById('temperatureChart');
        if (!ctx) return;

        this.charts.temperature = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperatura Corporal',
                    data: [],
                    fill: true,
                    borderColor: this.chartColors.temperature,
                    backgroundColor: this.addAlpha(this.chartColors.temperature, 0.1),
                    pointBackgroundColor: this.chartColors.temperature,
                    pointBorderColor: this.chartColors.temperature,
                    tension: 0.4
                }]
            },
            options: {
                ...this.getChartOptions('Temperatura', this.chartColors.temperature, '°C'),
                scales: {
                    ...this.getChartOptions('Temperatura', this.chartColors.temperature, '°C').scales,
                    y: {
                        ...this.getChartOptions('Temperatura', this.chartColors.temperature, '°C').scales.y,
                        min: 34,  // Rango mínimo para detectar hipotermia
                        max: 40,  // Rango máximo para detectar hipertermia
                        ticks: {
                            ...this.getChartOptions('Temperatura', this.chartColors.temperature, '°C').scales.y.ticks,
                            callback: function(value) {
                                return value + '°C';
                            }
                        }
                    }
                },
                plugins: {
                    ...this.getChartOptions('Temperatura', this.chartColors.temperature, '°C').plugins,
                    annotation: {
                        annotations: {
                            // ZONA NORMAL: Temperatura corporal saludable
                            normalZone: {
                                type: 'box',
                                yMin: 36.1,
                                yMax: 37.2,
                                backgroundColor: this.addAlpha('#4caf50', 0.1),
                                borderColor: '#4caf50',
                                borderWidth: 1,
                                label: {
                                    content: 'Normal (36.1-37.2°C)',
                                    enabled: true,
                                    color: '#4caf50'
                                }
                            },
                            // ZONA DE FIEBRE: Temperatura elevada que requiere atención
                            feverZone: {
                                type: 'box',
                                yMin: 37.2,
                                yMax: 38.5,
                                backgroundColor: this.addAlpha('#ff9800', 0.1),
                                borderColor: '#ff9800',
                                borderWidth: 1,
                                label: {
                                    content: 'Fiebre (37.2-38.5°C)',
                                    enabled: true,
                                    color: '#ff9800'
                                }
                            },
                            // ZONA CRÍTICA: Temperatura peligrosa que requiere intervención inmediata
                            criticalZone: {
                                type: 'box',
                                yMin: 38.5,
                                yMax: 40,
                                backgroundColor: this.addAlpha('#f44336', 0.1),
                                borderColor: '#f44336',
                                borderWidth: 1,
                                label: {
                                    content: 'Crítico (>38.5°C)',
                                    enabled: true,
                                    color: '#f44336'
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    // Función auxiliar para agregar transparencia a los colores
    addAlpha(color, alpha) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Método para actualizar un gráfico específico
    updateChart(chartName, value, timestamp = null) {
        const chart = this.charts[chartName];
        if (!chart) return;

        const now = new Date();
        const timeLabel = timestamp ? new Date(timestamp).toLocaleTimeString() : now.toLocaleTimeString();
        
        // Agregar nuevo punto
        chart.data.labels.push(timeLabel);
        chart.data.datasets[0].data.push(value);
        
        // Mantener solo los últimos 20 puntos para mejor rendimiento
        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        
        // Actualizar el gráfico con animación suave
        chart.update('none');
    }

    // Método para limpiar todos los gráficos
    clearAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.data.labels = [];
                chart.data.datasets.forEach(dataset => {
                    dataset.data = [];
                });
                chart.update();
            }
        });
    }

    // Método para exportar datos de gráficos (opcional)
    exportChartData() {
        const data = {};
        Object.keys(this.charts).forEach(chartName => {
            const chart = this.charts[chartName];
            if (chart) {
                data[chartName] = {
                    labels: chart.data.labels,
                    data: chart.data.datasets[0].data
                };
            }
        });
        return data;
    }
}

// Inicializar gráficos
let healthCharts;
document.addEventListener('DOMContentLoaded', () => {
    healthCharts = new HealthCharts();
});

// Exportar para uso global
window.HealthCharts = HealthCharts;
