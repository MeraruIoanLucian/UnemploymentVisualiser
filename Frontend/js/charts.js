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

        // Ensure data is sorted by county for consistent comparison
        data.sort(function (a, b) { return a.county.localeCompare(b.county); });
        if (compareData) {
            compareData.sort(function (a, b) { return a.county.localeCompare(b.county); });
        }

        labels = data.map(function (d) { return d.county; });

        var xScalesStacked = false; // Controls if groups of bars are stacked on X-axis
        var yScalesStacked = false; // Controls if bars within a group are stacked on Y-axis

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
                    borderRadius: 4,
                    stack: compareData ? 'rata_comparison_stack' : undefined, // Common stack for overlap
                    barPercentage: compareData ? 0.6 : 0.9, // Narrower if comparing
                    categoryPercentage: 0.8
                });
                if (compareData) {
                    datasets.push({
                        label: 'Rata comparativă (%)',
                        data: data.map(function (d) { // Map over 'data' to ensure order, then find compare value
                            var compareCounty = compareData.find(cd => cd.county === d.county);
                            return compareCounty ? compareCounty.unemploymentRate : null;
                        }),
                        backgroundColor: COLORS.primaryContainer + 'CC', // Slightly less transparent for visibility
                        borderColor: COLORS.primaryLight,
                        borderWidth: 1,
                        borderRadius: 4,
                        stack: 'rata_comparison_stack', // Common stack for overlap
                        barPercentage: 0.8, // Wider if comparing
                        categoryPercentage: 0.8
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
                        backgroundColor: COLORS.palette[i % COLORS.palette.length] + 'CC',
                        borderRadius: 2,
                        //stack: compareData ? 'current_group' : 'main_stack' // Stack for current group or main stack
                        stack: compareData ? "current_stack_educatie" : 'main_stack_educatie'
                    });
                    if (compareData) {
                        datasets.push({
                            label: eduLabels[i] + ' (Comparativ)',
                            data: data.map(function (d) {
                                var compareCounty = compareData.find(cd => cd.county === d.county);
                                return compareCounty ? compareCounty[key] : null;
                            }),
                            backgroundColor: COLORS.palette[i % COLORS.palette.length] + '99', // Lighter/transparent color for comparison
                            borderRadius: 2,
                            stack: 'compare_stack_educatie' // Stack for comparison group
                        });
                    }
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
                        backgroundColor: COLORS.palette[i % COLORS.palette.length] + 'CC',
                        borderRadius: 2,
                        stack: compareData ? 'current_stack_varste' : 'main_stack_varste'
                    });
                    if (compareData) {
                        datasets.push({
                            label: ageLabels[i] + ' (Comparativ)',
                            data: data.map(function (d) {
                                var compareCounty = compareData.find(function (cd) { return cd.county === d.county; });
                                return compareCounty ? compareCounty[key] : null;
                            }),
                            backgroundColor: COLORS.palette[i % COLORS.palette.length] + '99',
                            borderRadius: 2,
                            stack: 'compare_stack_varste'
                        });
                    }
                });
                break;

            case 'medii':
                labels = data.map(function (d) { return d.county; });
                datasets.push({
                    label: 'Urban',
                    data: data.map(function (d) { return d.totalUnemployedUrban; }),
                    backgroundColor: COLORS.palette[0] + 'CC',
                    borderRadius: 2,
                    stack: compareData ? 'current_stack_medii' : 'main_stack_medii'
                });
                datasets.push({
                    label: 'Rural',
                    data: data.map(function (d) { return d.totalUnemployedRural; }),
                    backgroundColor: COLORS.palette[1] + 'CC',
                    borderRadius: 2,
                    stack: compareData ? 'current_stack_medii' : 'main_stack_medii'
                });

                if (compareData) {
                    datasets.push({
                        label: 'Urban (Comparativ)',
                        data: data.map(function (d) {
                            var compareCounty = compareData.find(function (cd) { return cd.county === d.county; });
                            return compareCounty ? compareCounty.totalUnemployedUrban : null;
                        }),
                        backgroundColor: COLORS.palette[0] + '99',
                        borderRadius: 2,
                        stack: 'compare_stack_medii'
                    });
                    datasets.push({
                        label: 'Rural (Comparativ)',
                        data: data.map(function (d) {
                            var compareCounty = compareData.find(function (cd) { return cd.county === d.county; });
                            return compareCounty ? compareCounty.totalUnemployedRural : null;
                        }),
                        backgroundColor: COLORS.palette[1] + '99',
                        borderRadius: 2,
                        stack: 'compare_stack_medii'
                    });
                }
                break;
        }

        // Determine stacking behavior for scales
        var isMultiCategory = (criterion === 'educatie' || criterion === 'varste' || criterion === 'medii');
        if (compareData) {
                if (criterion === 'rata') {
                    xScalesStacked = false; // For rata, we want overlapping bars at the same X position, not stacked vertically
                    yScalesStacked = false; // Not a stacked chart
                } else {
                    xScalesStacked = false; // Grouped bars on X-axis when comparing (current stack vs compare stack)
                    yScalesStacked = isMultiCategory; // Y-axis stacked for categories within a group
                }
        } else {
            // Original behavior without comparison (stack if multiple categories)
            xScalesStacked = isMultiCategory;
            yScalesStacked = isMultiCategory;
        }

        // Reorder datasets for 'rata' to ensure wider bar is behind
        // This needs to be done after all datasets are potentially added
        if (criterion === 'rata' && compareData && datasets.length === 2) {
            // Assuming datasets[0] is current and datasets[1] is compare initially
            // We want compare (wider) to be first, then current (narrower)
            var currentRataDataset = datasets.find(d => d.label.includes('Rata șomajului'));
            var compareRataDataset = datasets.find(d => d.label.includes('Rata comparativă'));

            if (currentRataDataset && compareRataDataset) {
                datasets = [compareRataDataset, currentRataDataset];
            }
        }


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
                        stacked: xScalesStacked,
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { display: false }
                    },
                    y: { // Y-axis stacking applies to bars within a group
                        stacked: yScalesStacked,
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
