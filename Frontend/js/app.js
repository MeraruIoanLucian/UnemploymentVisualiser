// app.js - fisierul principal
// facem fetch, punem pe harta, pe charturi etc.

'use strict';

// ==================== CONFIGURARE ====================
var CONFIG = {
    API_BASE: '/api-proxy.php',
    ITEMS_PER_PAGE: 10,
    // Mapare criteriu -> fisier CSV
    CRITERION_FILE: {
        'rata': 'rata.csv',
        'educatie': 'nivel-educatie.csv',
        'varste': 'varste.csv',
        'medii': 'medii.csv'
    },
    // Mapare criteriu -> titlu grafic principal
    CRITERION_TITLE: {
        'rata': 'Rata Șomajului pe Județe',
        'educatie': 'Distribuție pe Nivel de Educație',
        'varste': 'Distribuție pe Grupe de Vârstă',
        'medii': 'Distribuție Urban vs. Rural'
    },
    // Mapare criteriu -> titlu donut
    DONUT_TITLE: {
        'rata': 'Distribuție Bărbați / Femei',
        'educatie': 'Distribuție pe Nivel de Educație',
        'varste': 'Distribuție pe Grupe de Vârstă',
        'medii': 'Distribuție Urban / Rural'
    },
    // Coloane tabel per criteriu
    TABLE_COLUMNS: {
        'rata': [
            { key: 'county', label: 'Județ', align: 'left' },
            { key: 'nrUnemployed', label: 'Total Șomeri', align: 'right', format: 'number' },
            { key: 'unemploymentRate', label: 'Rata (%)', align: 'right', format: 'rate' },
            { key: 'nrMaleUnemployed', label: 'Bărbați', align: 'right', format: 'number' },
            { key: 'nrFemaleUnemployed', label: 'Femei', align: 'right', format: 'number' }
        ],
        'educatie': [
            { key: 'county', label: 'Județ', align: 'left' },
            { key: 'noStudy', label: 'Fără studii', align: 'right', format: 'number' },
            { key: 'primaryStudy', label: 'Primar', align: 'right', format: 'number' },
            { key: 'middleStudy', label: 'Gimnazial', align: 'right', format: 'number' },
            { key: 'highStudy', label: 'Liceal', align: 'right', format: 'number' },
            { key: 'universityStudy', label: 'Universitar', align: 'right', format: 'number' }
        ],
        'varste': [
            { key: 'county', label: 'Județ', align: 'left' },
            { key: 'under25', label: 'Sub 25', align: 'right', format: 'number' },
            { key: 'from25to29', label: '25-29', align: 'right', format: 'number' },
            { key: 'from30to39', label: '30-39', align: 'right', format: 'number' },
            { key: 'from40to49', label: '40-49', align: 'right', format: 'number' },
            { key: 'from50to59', label: '50-59', align: 'right', format: 'number' }
        ],
        'medii': [
            { key: 'county', label: 'Județ', align: 'left' },
            { key: 'totalUnemployed', label: 'Total', align: 'right', format: 'number' },
            { key: 'totalUnemployedUrban', label: 'Urban', align: 'right', format: 'number' },
            { key: 'totalUnemployedRural', label: 'Rural', align: 'right', format: 'number' },
            { key: 'totalFemaleUnemployed', label: 'Femei', align: 'right', format: 'number' },
            { key: 'totalMaleUnemployed', label: 'Bărbați', align: 'right', format: 'number' }
        ]
    }
};

// ==================== STARE GLOBALA ====================
var state = {
    currentMonth: '',
    compareMonth: null,
    isComparing: false,
    currentCounty: 'all',
    currentCriterion: 'rata',
    data: null,           // Datele curente (criteriul selectat)
    rataData: null,       // Datele rata.csv (mereu necesare pentru statistici)
    compareData: null,    // Date pentru comparare
    compareRataData: null,
    tableSort: { column: 'county', direction: 'asc' },
    tableSearch: '',
    tablePage: 1
};

// ==================== ELEMENTE DOM ====================
var elements = {};

function cacheElements() {
    elements.periodSelect = document.getElementById('period-select');
    elements.countySelect = document.getElementById('county-select');
    elements.criterionSelect = document.getElementById('criterion-select');
    elements.comparePanel = document.getElementById('compare-panel');
    elements.compareSelect = document.getElementById('compare-select');
    elements.btnCompare = document.getElementById('btn-compare');
    elements.btnCSV = document.getElementById('btn-csv');
    elements.btnSVG = document.getElementById('btn-svg');
    elements.btnPDF = document.getElementById('btn-pdf');
    elements.btnExportMain = document.getElementById('btn-export-main');
    elements.mainChartTitle = document.getElementById('main-chart-title');
    elements.donutChartTitle = document.getElementById('donut-chart-title');
    elements.statTotalValue = document.getElementById('stat-total-value');
    elements.statChangeIcon = document.getElementById('stat-change-icon');
    elements.statChangeText = document.getElementById('stat-change-text');
    elements.statRate = document.getElementById('stat-rate');
    elements.statNonCompensated = document.getElementById('stat-non-compensated');
    elements.tableHeadRow = document.getElementById('table-head-row');
    elements.tableBody = document.getElementById('table-body');
    elements.tableInfo = document.getElementById('table-info');
    elements.tablePagination = document.getElementById('table-pagination');
    elements.tableSearch = document.getElementById('table-search');
}

// ==================== API ====================

// ia datele de la api
function fetchData(packageName, fileName) {
    var url = CONFIG.API_BASE + '?package=' + encodeURIComponent(packageName) + '&file=' + encodeURIComponent(fileName);

    return fetch(url)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Eroare API: ' + response.status);
            }
            return response.json();
        });
}

// ==================== ACTUALIZARE DASHBOARD ====================

// incarca datele si da update la UI
function updateDashboard() {
    var month = state.currentMonth;
    var criterion = state.currentCriterion;
    var file = CONFIG.CRITERION_FILE[criterion];

    // Actualizeaza titlurile
    if (elements.mainChartTitle) {
        elements.mainChartTitle.textContent = CONFIG.CRITERION_TITLE[criterion];
    }
    if (elements.donutChartTitle) {
        elements.donutChartTitle.textContent = CONFIG.DONUT_TITLE[criterion];
    }

    // Fetch datele pentru criteriul selectat
    var promises = [fetchData(month, file)];

    // Mereu fetch rata.csv pentru statistici (daca nu e deja criteriul)
    if (criterion !== 'rata') {
        promises.push(fetchData(month, 'rata.csv'));
    }

    // Daca comparam, fetch si datele celei de-a doua luni
    if (state.isComparing && state.compareMonth && state.compareMonth !== month) {
        promises.push(fetchData(state.compareMonth, file));
        if (criterion !== 'rata') {
            promises.push(fetchData(state.compareMonth, 'rata.csv'));
        }
    }

    Promise.all(promises)
        .then(function (results) {
            state.data = results[0];

            if (criterion !== 'rata') {
                state.rataData = results[1];
            } else {
                state.rataData = results[0];
            }

            // Date comparare
            if (state.isComparing && results.length > (criterion !== 'rata' ? 2 : 1)) {
                state.compareData = results[criterion !== 'rata' ? 2 : 1];
                if (criterion !== 'rata' && results.length > 3) {
                    state.compareRataData = results[3];
                } else if (criterion === 'rata') {
                    state.compareRataData = state.compareData;
                }
            } else {
                state.compareData = null;
                state.compareRataData = null;
            }

            // Actualizam toate componentele
            updateStats();
            updateMainChart();
            updateDonutChart();
            updateMap();
            updateTable();
        })
        .catch(function (err) {
            console.error('Eroare la incarcarea datelor:', err);
            showError('Nu s-au putut încărca datele. Verificați conexiunea la API.');
        });
}

// calculeaza si pune in ui la statistici
function updateStats() {
    var data = state.rataData;
    if (!data || data.length === 0) return;

    var filteredData = data;
    if (state.currentCounty !== 'all') {
        filteredData = data.filter(function (d) {
            return d.county.toUpperCase() === state.currentCounty.toUpperCase();
        });
    }

    // Calculam totaluri
    var totalUnemployed = 0;
    var totalCompensated = 0;
    var totalNonCompensated = 0;
    var rateSum = 0;

    filteredData.forEach(function (d) {
        totalUnemployed += d.nrUnemployed || 0;
        totalCompensated += d.nrCompensatedUnemployed || 0;
        totalNonCompensated += d.nrNonCompensatedUnemployed || 0;
        rateSum += d.unemploymentRate || 0;
    });

    var avgRate = filteredData.length > 0 ? (rateSum / filteredData.length).toFixed(1) : '—';

    // Actualizare DOM
    if (elements.statTotalValue) {
        elements.statTotalValue.textContent = totalUnemployed.toLocaleString('ro-RO');
    }

    if (elements.statRate) {
        elements.statRate.textContent = avgRate + '%';
    }

    if (elements.statNonCompensated) {
        elements.statNonCompensated.textContent = totalNonCompensated.toLocaleString('ro-RO');
    }

    // Comparatie cu luna anterioara
    if (state.compareRataData && elements.statChangeText) {
        var compareTotal = 0;
        var compareFiltered = state.compareRataData;
        if (state.currentCounty !== 'all') {
            compareFiltered = state.compareRataData.filter(function (d) {
                return d.county.toUpperCase() === state.currentCounty.toUpperCase();
            });
        }
        compareFiltered.forEach(function (d) { compareTotal += d.nrUnemployed || 0; });

        if (compareTotal > 0) {
            var change = ((totalUnemployed - compareTotal) / compareTotal * 100).toFixed(1);
            var isPositive = change > 0;
            elements.statChangeIcon.textContent = isPositive ? '↑' : '↓';
            elements.statChangeText.textContent = (isPositive ? '+' : '') + change + '% față de perioada comparată';
            elements.statChangeIcon.style.color = isPositive ? '#9f403d' : '#15803d';
        }
    } else if (elements.statChangeText) {
        elements.statChangeIcon.textContent = '';
        elements.statChangeText.textContent = filteredData.length + ' județe analizate';
    }
}

// chartu principal bar
function updateMainChart() {
    var data = state.data;
    if (!data || data.length === 0) return;

    var displayData = data;
    var compareDisplayData = state.compareData;

    // Daca e selectat un judet specific, tot le aratam pe toate dar evidentiind
    // (filtrarea singulara nu face sens pe bar chart)

    MonitorCharts.renderBarChart(displayData, state.currentCriterion, compareDisplayData);
}

// donut chart
function updateDonutChart() {
    var data = state.data;
    if (!data || data.length === 0) return;

    var breakdown = computeBreakdown(data, state.currentCriterion, state.currentCounty);
    MonitorCharts.renderDonutChart(breakdown);
}

// imparte datele pt donut
function computeBreakdown(data, criterion, county) {
    var filtered = data;
    if (county !== 'all') {
        filtered = data.filter(function (d) {
            return d.county.toUpperCase() === county.toUpperCase();
        });
    }

    var labels, values;

    switch (criterion) {
        case 'rata':
            // Pentru rata, aratam distributia barbati/femei
            var totalFemale = 0, totalMale = 0;
            filtered.forEach(function (d) {
                totalFemale += d.nrFemaleUnemployed || 0;
                totalMale += d.nrMaleUnemployed || 0;
            });
            labels = ['Femei', 'Bărbați'];
            values = [totalFemale, totalMale];
            break;

        case 'educatie':
            var sums = { noStudy: 0, primaryStudy: 0, middleStudy: 0, highStudy: 0, postHighStudy: 0, professionalStudy: 0, universityStudy: 0 };
            filtered.forEach(function (d) {
                sums.noStudy += d.noStudy || 0;
                sums.primaryStudy += d.primaryStudy || 0;
                sums.middleStudy += d.middleStudy || 0;
                sums.highStudy += d.highStudy || 0;
                sums.postHighStudy += d.postHighStudy || 0;
                sums.professionalStudy += d.professionalStudy || 0;
                sums.universityStudy += d.universityStudy || 0;
            });
            labels = ['Fără studii', 'Primar', 'Gimnazial', 'Liceal', 'Postliceal', 'Profesional', 'Universitar'];
            values = [sums.noStudy, sums.primaryStudy, sums.middleStudy, sums.highStudy, sums.postHighStudy, sums.professionalStudy, sums.universityStudy];
            break;

        case 'varste':
            var ageSums = { under25: 0, from25to29: 0, from30to39: 0, from40to49: 0, from50to59: 0, over50: 0 };
            filtered.forEach(function (d) {
                ageSums.under25 += d.under25 || 0;
                ageSums.from25to29 += d.from25to29 || 0;
                ageSums.from30to39 += d.from30to39 || 0;
                ageSums.from40to49 += d.from40to49 || 0;
                ageSums.from50to59 += d.from50to59 || 0;
                ageSums.over50 += d.over50 || 0;
            });
            labels = ['Sub 25', '25-29', '30-39', '40-49', '50-59', 'Peste 50'];
            values = [ageSums.under25, ageSums.from25to29, ageSums.from30to39, ageSums.from40to49, ageSums.from50to59, ageSums.over50];
            break;

        case 'medii':
            var urbanTotal = 0, ruralTotal = 0;
            filtered.forEach(function (d) {
                urbanTotal += d.totalUnemployedUrban || 0;
                ruralTotal += d.totalUnemployedRural || 0;
            });
            labels = ['Urban', 'Rural'];
            values = [urbanTotal, ruralTotal];
            break;

        default:
            labels = [];
            values = [];
    }

    return { labels: labels, values: values };
}

// coloram harta dupa somaj
function updateMap() {
    if (state.rataData) {
        MonitorMap.updateColors(state.rataData);
    }
    if (state.currentCounty !== 'all') {
        MonitorMap.highlightCounty(state.currentCounty);
    }
}

// ==================== TABEL ====================

// functie pt tabel
function updateTable() {
    var data = state.data;
    if (!data || data.length === 0) return;

    var columns = CONFIG.TABLE_COLUMNS[state.currentCriterion];

    // Genereaza header
    renderTableHeader(columns);

    // Filtru de cautare
    var filtered = data;
    if (state.tableSearch) {
        var search = state.tableSearch.toLowerCase();
        filtered = data.filter(function (d) {
            return d.county.toLowerCase().indexOf(search) !== -1;
        });
    }

    // Filtru de judet
    if (state.currentCounty !== 'all') {
        filtered = filtered.filter(function (d) {
            return d.county.toUpperCase() === state.currentCounty.toUpperCase();
        });
    }

    // Sortare
    var sortCol = state.tableSort.column;
    var sortDir = state.tableSort.direction;
    filtered.sort(function (a, b) {
        var valA = a[sortCol];
        var valB = b[sortCol];

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = (valB || '').toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        }

        return sortDir === 'asc' ? (valA - valB) : (valB - valA);
    });

    // Paginare
    var totalItems = filtered.length;
    var totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);
    if (state.tablePage > totalPages) state.tablePage = 1;

    var start = (state.tablePage - 1) * CONFIG.ITEMS_PER_PAGE;
    var pageData = filtered.slice(start, start + CONFIG.ITEMS_PER_PAGE);

    // Rand body
    renderTableBody(pageData, columns);

    // Info si paginare
    renderTableFooter(start, pageData.length, totalItems, totalPages);
}

/**
 * Genereaza header-ul tabelului
 */
function renderTableHeader(columns) {
    if (!elements.tableHeadRow) return;

    var html = '';
    columns.forEach(function (col) {
        var sortClass = '';
        if (state.tableSort.column === col.key) {
            sortClass = state.tableSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc';
        }
        var alignClass = col.align === 'right' ? ' text-right' : '';
        html += '<th class="' + sortClass + alignClass + '" data-sort="' + col.key + '">';
        html += col.label + ' <span class="sort-icon"></span>';
        html += '</th>';
    });
    // Coloana actiuni
    html += '<th class="text-right">Acțiuni</th>';

    elements.tableHeadRow.innerHTML = html;

    // Event listeners pentru sortare
    var ths = elements.tableHeadRow.querySelectorAll('th[data-sort]');
    ths.forEach(function (th) {
        th.addEventListener('click', function () {
            var key = th.getAttribute('data-sort');
            if (state.tableSort.column === key) {
                state.tableSort.direction = state.tableSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                state.tableSort.column = key;
                state.tableSort.direction = 'asc';
            }
            updateTable();
        });
    });
}

/**
 * Genereaza body-ul tabelului
 */
function renderTableBody(pageData, columns) {
    if (!elements.tableBody) return;

    var html = '';
    pageData.forEach(function (row) {
        html += '<tr>';
        columns.forEach(function (col) {
            var value = row[col.key];
            var alignClass = col.align === 'right' ? ' text-right' : '';
            var cellContent = '';

            if (col.format === 'number') {
                cellContent = (value || 0).toLocaleString('ro-RO');
            } else if (col.format === 'rate') {
                var badgeClass = value > 5 ? 'high' : 'low';
                cellContent = '<span class="rate-badge ' + badgeClass + '">' + value + '%</span>';
            } else {
                cellContent = value || '';
            }

            html += '<td class="' + alignClass + '">' + cellContent + '</td>';
        });
        // Buton vizualizare
        html += '<td class="text-right">';
        html += '<button class="btn-view" data-county="' + (row.county || '') + '" title="Selectează ' + (row.county || '') + '">👁</button>';
        html += '</td>';
        html += '</tr>';
    });

    elements.tableBody.innerHTML = html;

    // Event listeners pentru butoanele de vizualizare
    var btns = elements.tableBody.querySelectorAll('.btn-view');
    btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var county = btn.getAttribute('data-county');
            selectCounty(county);
        });
    });
}

/**
 * Genereaza footer-ul tabelului (info + paginare)
 */
function renderTableFooter(start, count, total, totalPages) {
    if (elements.tableInfo) {
        elements.tableInfo.textContent = 'Afișare ' + (start + 1) + '-' + (start + count) + ' din ' + total + ' județe';
    }

    if (!elements.tablePagination) return;

    var html = '';

    // Buton Inapoi
    html += '<button ' + (state.tablePage <= 1 ? 'disabled' : '') + ' data-page="' + (state.tablePage - 1) + '">Înapoi</button>';

    // Numere pagini
    for (var i = 1; i <= totalPages; i++) {
        html += '<button class="' + (i === state.tablePage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }

    // Buton Inainte
    html += '<button ' + (state.tablePage >= totalPages ? 'disabled' : '') + ' data-page="' + (state.tablePage + 1) + '">Înainte</button>';

    elements.tablePagination.innerHTML = html;

    // Event listeners paginare
    var pageBtns = elements.tablePagination.querySelectorAll('button:not([disabled])');
    pageBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            state.tablePage = parseInt(btn.getAttribute('data-page'));
            updateTable();
        });
    });
}

// ==================== SELECTIE JUDET ====================

/**
 * Selecteaza un judet (din tabel, harta, sau dropdown)
 */
function selectCounty(countyName) {
    state.currentCounty = countyName.toUpperCase();
    if (elements.countySelect) {
        // Cautam optiunea corespunzatoare
        var options = elements.countySelect.options;
        for (var i = 0; i < options.length; i++) {
            if (options[i].value.toUpperCase() === state.currentCounty) {
                elements.countySelect.selectedIndex = i;
                break;
            }
        }
    }
    state.tablePage = 1;
    updateStats();
    updateDonutChart();
    updateTable();
    MonitorMap.highlightCounty(state.currentCounty);
}

// ==================== ERORI ====================

function showError(message) {
    var container = document.getElementById('main-chart-container');
    if (container) {
        container.innerHTML = '<div class="error-message">' + message + '</div>';
    }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Schimbare perioada
    if (elements.periodSelect) {
        elements.periodSelect.addEventListener('change', function () {
            state.currentMonth = this.value;
            state.tablePage = 1;
            updateDashboard();
        });
    }

    // Schimbare judet
    if (elements.countySelect) {
        elements.countySelect.addEventListener('change', function () {
            state.currentCounty = this.value;
            state.tablePage = 1;
            updateStats();
            updateDonutChart();
            updateTable();
            if (this.value === 'all') {
                MonitorMap.highlightCounty(null);
            } else {
                MonitorMap.highlightCounty(this.value);
            }
        });
    }

    // Schimbare criteriu
    if (elements.criterionSelect) {
        elements.criterionSelect.addEventListener('change', function () {
            state.currentCriterion = this.value;
            state.tableSort = { column: 'county', direction: 'asc' };
            state.tablePage = 1;
            updateDashboard();
        });
    }

    // Buton Compara
    if (elements.btnCompare) {
        elements.btnCompare.addEventListener('click', function () {
            state.isComparing = !state.isComparing;
            this.classList.toggle('active', state.isComparing);
            this.textContent = state.isComparing ? 'Anulează' : 'Compară';

            if (elements.comparePanel) {
                elements.comparePanel.classList.toggle('active', state.isComparing);
            }

            if (state.isComparing) {
                state.compareMonth = elements.compareSelect ? elements.compareSelect.value : null;
            } else {
                state.compareMonth = null;
                state.compareData = null;
                state.compareRataData = null;
            }

            updateDashboard();
        });
    }

    // Schimbare luna de comparare
    if (elements.compareSelect) {
        elements.compareSelect.addEventListener('change', function () {
            state.compareMonth = this.value;
            if (state.isComparing) {
                updateDashboard();
            }
        });
    }

    // Cautare in tabel
    if (elements.tableSearch) {
        var searchTimeout;
        elements.tableSearch.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            var self = this;
            searchTimeout = setTimeout(function () {
                state.tableSearch = self.value;
                state.tablePage = 1;
                updateTable();
            }, 300);
        });
    }

    // Export CSV
    if (elements.btnCSV) {
        elements.btnCSV.addEventListener('click', function () {
            var fileName = 'somaj_' + state.currentCriterion + '_' + state.currentMonth + '.csv';
            MonitorExport.toCSV(state.data, state.currentCriterion, fileName);
        });
    }

    // Export SVG
    if (elements.btnSVG) {
        elements.btnSVG.addEventListener('click', function () {
            var fileName = 'somaj_' + state.currentCriterion + '_' + state.currentMonth + '.svg';
            MonitorExport.toSVG(fileName);
        });
    }

    // Export PDF
    if (elements.btnPDF) {
        elements.btnPDF.addEventListener('click', function () {
            MonitorExport.toPDF();
        });
    }

    // Buton principal Export (exporta CSV ca default)
    // Ionut uita-te la cum exportezi ca PDF, imi crapa PC-ul 
    if (elements.btnExportMain) {
        elements.btnExportMain.addEventListener('click', function () {
            MonitorExport.toCSV();
        });
    }
}

//Initializare

function init() {
    cacheElements();

    // Setam luna initiala din primul dropdown
    if (elements.periodSelect) {
        state.currentMonth = elements.periodSelect.value;
    }

    // Setam luna de comparare la a doua optiune
    if (elements.compareSelect && elements.compareSelect.options.length > 1) {
        elements.compareSelect.selectedIndex = 1;
    }

    setupEventListeners();

    // Initializeaza harta cu callback de click pe judet
    MonitorMap.init('map', function (countyName) {
        selectCounty(countyName);
    });

    // Incarcam datele initiale
    updateDashboard();
}

// Pornim aplicatia cand DOM-ul e gata
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
