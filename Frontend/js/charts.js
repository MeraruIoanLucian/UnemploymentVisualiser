/**
 * MonitorCharts - Modul pentru randarea graficelor cu Chart.js
 * 
 * Contine functii pentru crearea si actualizarea graficelor:
 * - Bar chart (graficul principal - rata somajului pe judete)
 * - Donut chart (distributie pe educatie/varste/mediu)
 */

var MonitorCharts = (function () {
    // Referinte catre instantele Chart.js
    var barChart = null;
    var donutChart = null;

    // Paleta de culori consistenta cu design system-ul
    var COLORS = {
        primary: '#0053db',
        primaryLight: '#618bff',
        primaryContainer: '#dbe1ff',
        secondary: '#40618a',
        surface: '#e6eeff',
        error: '#9f403d',
        // Paleta pentru donut/stacked charts
        palette: [
            '#0053db',
            '#618bff',
            '#94b4e2',
            '#dbe1ff',
            '#0c335a',
            '#40618a',
            '#5c7da8'
        ]
    };

    // Randeaza graficul principal (bar chart)
    function renderBarChart(data, criterion, compareData) {
        var canvas = document.getElementById('main-chart');
        if (!canvas) return;

        // Distruge graficul vechi daca exista
        if (barChart) {
            barChart.destroy();
            barChart = null;
        }

        var config = buildBarConfig(data, criterion, compareData);

        barChart = new Chart(canvas, config);
    }

    // Construieste configuratia Chart.js pentru bar chart in functie de criteriu
    function buildBarConfig(data, criterion, compareData) {
        var labels = [];
        var datasets = [];

        switch (criterion) {
            case 'rata':
                labels = data.map(function (d) { return d.county; });
                datasets.push({
                    label: 'Rata șomajului (%)',
                    data: data.map(function (d) { return d.unemploymentRate; }),
                    backgroundColor: data.map(function (d) {
                        return d.unemploymentRate > 5 ? COLORS.error + '99' : COLORS.primary + '99';
                    }),
                    borderColor: data.map(function (d) {
                        return d.unemploymentRate > 5 ? COLORS.error : COLORS.primary;
                    }),
                    borderWidth: 1,
                    borderRadius: 4
                });
                if (compareData) {
                    datasets.push({
                        label: 'Rata comparativă (%)',
                        data: compareData.map(function (d) { return d.unemploymentRate; }),
                        backgroundColor: COLORS.primaryContainer + '99',
                        borderColor: COLORS.primaryLight,
                        borderWidth: 1,
                        borderRadius: 4
                    });
                }
                break;

            case 'educatie':
                labels = data.map(function (d) { return d.county; });
                var eduLabels = ['Fără studii', 'Primar', 'Gimnazial', 'Liceal', 'Postliceal', 'Profesional', 'Universitar'];
                var eduKeys = ['noStudy', 'primaryStudy', 'middleStudy', 'highStudy', 'postHighStudy', 'professionalStudy', 'universityStudy'];
                eduKeys.forEach(function (key, i) {
                    datasets.push({
                        label: eduLabels[i],
                        data: data.map(function (d) { return d[key]; }),
                        backgroundColor: COLORS.palette[i] + 'CC',
                        borderRadius: 2
                    });
                });
                break;

            case 'varste':
                labels = data.map(function (d) { return d.county; });
                var ageLabels = ['Sub 25', '25-29', '30-39', '40-49', '50-59', 'Peste 50'];
                var ageKeys = ['under25', 'from25to29', 'from30to39', 'from40to49', 'from50to59', 'over50'];
                ageKeys.forEach(function (key, i) {
                    datasets.push({
                        label: ageLabels[i],
                        data: data.map(function (d) { return d[key]; }),
                        backgroundColor: COLORS.palette[i] + 'CC',
                        borderRadius: 2
                    });
                });
                break;

            case 'medii':
                labels = data.map(function (d) { return d.county; });
                datasets.push({
                    label: 'Urban',
                    data: data.map(function (d) { return d.totalUnemployedUrban; }),
                    backgroundColor: COLORS.primary + '99',
                    borderRadius: 4
                });
                datasets.push({
                    label: 'Rural',
                    data: data.map(function (d) { return d.totalUnemployedRural; }),
                    backgroundColor: COLORS.primaryLight + '99',
                    borderRadius: 4
                });
                break;
        }

        var isStacked = (criterion === 'educatie' || criterion === 'varste');

        return {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: datasets.length > 1,
                        position: 'top',
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 11 },
                            boxWidth: 12,
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0c335a',
                        titleFont: { family: "'Inter', sans-serif" },
                        bodyFont: { family: "'Inter', sans-serif" },
                        padding: 12,
                        cornerRadius: 6
                    }
                },
                scales: {
                    x: {
                        stacked: isStacked,
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { display: false }
                    },
                    y: {
                        stacked: isStacked,
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 11 }
                        },
                        grid: {
                            color: 'rgba(148, 180, 226, 0.15)'
                        }
                    }
                }
            }
        };
    }

    // Randeaza gogoasa (donut)
    function renderDonutChart(breakdown) {
        var canvas = document.getElementById('donut-chart');
        if (!canvas) return;

        if (donutChart) {
            donutChart.destroy();
            donutChart = null;
        }

        var labels = breakdown.labels;
        var values = breakdown.values;
        var total = values.reduce(function (sum, v) { return sum + v; }, 0);

        // Actualizeaza centrul donut-ului
        var centerValue = document.getElementById('donut-center-value');
        var centerText = document.getElementById('donut-center-text');
        if (centerValue && total > 0) {
            // Afiseaza procentul celei mai mari categorii
            var maxVal = Math.max.apply(null, values);
            var maxPercent = Math.round((maxVal / total) * 100);
            centerValue.textContent = maxPercent + '%';
            centerText.textContent = labels[values.indexOf(maxVal)];
        }

        // Actualizeaza legenda
        var legendContainer = document.getElementById('donut-legend');
        if (legendContainer) {
            legendContainer.innerHTML = '';
            labels.forEach(function (label, i) {
                var percent = total > 0 ? Math.round((values[i] / total) * 100) : 0;
                var item = document.createElement('div');
                item.className = 'donut-legend-item';
                item.innerHTML =
                    '<div class="donut-legend-color" style="background:' + COLORS.palette[i % COLORS.palette.length] + '"></div>' +
                    '<span>' + label + ' (' + percent + '%)</span>';
                legendContainer.appendChild(item);
            });
        }

        donutChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map(function (_, i) {
                        return COLORS.palette[i % COLORS.palette.length];
                    }),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0c335a',
                        titleFont: { family: "'Inter', sans-serif" },
                        bodyFont: { family: "'Inter', sans-serif" },
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: function (context) {
                                var val = context.parsed;
                                var pct = total > 0 ? Math.round((val / total) * 100) : 0;
                                return context.label + ': ' + val.toLocaleString('ro-RO') + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    // Returneaza instanta bar chart (pentru export SVG)
    function getBarChart() {
        return barChart;
    }

    // Returneaza instanta donut chart (pentru export SVG)
    function getDonutChart() {
        return donutChart;
    }

    /**
     * Distruge toate graficele
     */
    function destroyAll() {
        if (barChart) { barChart.destroy(); barChart = null; }
        if (donutChart) { donutChart.destroy(); donutChart = null; }
    }

    // Public API
    return {
        renderBarChart: renderBarChart,
        renderDonutChart: renderDonutChart,
        getBarChart: getBarChart,
        getDonutChart: getDonutChart,
        destroyAll: destroyAll,
        COLORS: COLORS
    };
})();
