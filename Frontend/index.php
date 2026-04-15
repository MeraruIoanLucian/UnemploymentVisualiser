<?php
/**
 * Monitor Somaj - Pagina principala (Dashboard)
 * 
 * Vizualizator interactiv al datelor de somaj din Romania.
 * Datele sunt preluate de la API-ul backend prin api-proxy.php.
 */

// Configurare: lunile si judetele disponibile
$availableMonths = [
    'mai2025' => 'Mai 2025',
    'aprilie2025' => 'Aprilie 2025',
    'martie2025' => 'Martie 2025',
    'februarie2025' => 'Februarie 2025',
    'ianuarie2025' => 'Ianuarie 2025',
    'decembrie2024' => 'Decembrie 2024',
    'iulie2024' => 'Iulie 2024',
    'iunie2024' => 'Iunie 2024',
    'mai2024' => 'Mai 2024',
    'aprilie2024' => 'Aprilie 2024',
    'martie2024' => 'Martie 2024',
    'februarie2024' => 'Februarie 2024',
    'noiembrie2023' => 'Noiembrie 2023',
    'octombrie2023' => 'Octombrie 2023',
    'august2023' => 'August 2023',
    'iulie2023' => 'Iulie 2023',
    'iunie2023' => 'Iunie 2023',
    'februarie2023' => 'Februarie 2023',
];

$counties = [
    'ALBA', 'ARAD', 'ARGES', 'BACAU', 'BIHOR', 'BISTRITA-NASAUD',
    'BOTOSANI', 'BRAILA', 'BRASOV', 'BUZAU', 'CALARASI', 'CARAS-SEVERIN',
    'CLUJ', 'CONSTANTA', 'COVASNA', 'DAMBOVITA', 'DOLJ', 'GALATI',
    'GIURGIU', 'GORJ', 'HARGHITA', 'HUNEDOARA', 'IALOMITA', 'IASI',
    'ILFOV', 'MARAMURES', 'MEHEDINTI', 'MURES', 'NEAMT', 'OLT',
    'PRAHOVA', 'SALAJ', 'SATU MARE', 'SIBIU', 'SUCEAVA', 'TELEORMAN',
    'TIMIS', 'TULCEA', 'VALCEA', 'VASLUI', 'VRANCEA', 'BUCURESTI'
];
sort($counties);
?>
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitor Șomaj - Vizualizator Șomaj România</title>
    <meta name="description" content="Instrument web de vizualizare și comparare multi-criterială a datelor publice referitoare la șomajul din România.">

    <!-- Fonturi -->
    <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">

    <!-- Stiluri proprii -->
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>

    <!-- ========== HEADER ========== -->
    <header class="header" id="header">
        <div class="header-brand">
            <div class="header-logo">📊</div>
            <h1 class="header-title">Monitor Șomaj</h1>
        </div>
        <div class="header-actions">
            <button class="btn btn-primary" id="btn-export-main" title="Exportă toate datele vizibile">
                Exportă Date
            </button>
        </div>
    </header>

    <!-- ========== MAIN ========== -->
    <main class="main" id="main-content">

        <!-- Titlu Dashboard -->
        <div class="dashboard-title">
            <h2>Vizualizator Șomaj România</h2>
            <p class="dashboard-subtitle">Sistemul centralizat de analiză a forței de muncă.</p>
        </div>

        <!-- ========== FILTRE ========== -->
        <section class="filter-section" id="filters">
            <!-- Perioada -->
            <div class="filter-group">
                <label class="filter-label" for="period-select">Perioadă</label>
                <select class="filter-select" id="period-select">
                    <?php foreach ($availableMonths as $key => $label): ?>
                        <option value="<?= htmlspecialchars($key) ?>"><?= htmlspecialchars($label) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <!-- Judet -->
            <div class="filter-group">
                <label class="filter-label" for="county-select">Județ</label>
                <select class="filter-select" id="county-select">
                    <option value="all">Toate Județele</option>
                    <?php foreach ($counties as $county): ?>
                        <option value="<?= htmlspecialchars($county) ?>"><?= htmlspecialchars(ucwords(mb_strtolower($county, 'UTF-8'))) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <!-- Criteriu -->
            <div class="filter-group">
                <label class="filter-label" for="criterion-select">Criteriu</label>
                <select class="filter-select" id="criterion-select">
                    <option value="rata">Rata șomajului</option>
                    <option value="educatie">Nivel educație</option>
                    <option value="varste">Grupe de vârstă</option>
                    <option value="medii">Mediu urban/rural</option>
                </select>
            </div>

            <!-- Perioada de comparare (ascunsa implicit) -->
            <div class="compare-panel" id="compare-panel">
                <label class="filter-label" for="compare-select">Compară cu</label>
                <select class="filter-select" id="compare-select">
                    <?php foreach ($availableMonths as $key => $label): ?>
                        <option value="<?= htmlspecialchars($key) ?>"><?= htmlspecialchars($label) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <!-- Actiuni -->
            <div class="filter-actions">
                <button class="btn btn-primary" id="btn-compare" title="Compară două perioade">
                    Compară
                </button>
                <div class="btn-export-group">
                    <button class="btn-export" id="btn-csv" title="Exportă CSV">CSV</button>
                    <button class="btn-export" id="btn-svg" title="Exportă SVG">SVG</button>
                    <button class="btn-export" id="btn-pdf" title="Exportă PDF">PDF</button>
                </div>
            </div>
        </section>

        <!-- ========== MAIN GRID (Grafic + Statistici) ========== -->
        <div class="grid-main">

            <!-- Grafic Principal -->
            <div class="card flex-col" id="main-chart-card">
                <div class="card-header">
                    <h3 class="card-title" id="main-chart-title">Evoluția Ratei Șomajului</h3>
                    <div class="chart-legend" id="main-chart-legend">
                        <span class="legend-badge">
                            <span class="legend-dot"></span> Rata actuală
                        </span>
                    </div>
                </div>
                <div class="chart-container" id="main-chart-container">
                    <canvas id="main-chart"></canvas>
                </div>
            </div>

            <!-- Coloana Statistici -->
            <div class="stats-column">
                <!-- Card mare: Total someri -->
                <div class="card-stat-highlight" id="stat-total-card">
                    <div style="position: relative; z-index: 1;">
                        <h4 class="stat-label">Total Șomeri Înregistrați</h4>
                        <div class="stat-value" id="stat-total-value">—</div>
                        <div class="stat-change" id="stat-change">
                            <span id="stat-change-icon">—</span>
                            <span id="stat-change-text">Se încarcă...</span>
                        </div>
                    </div>
                    <div class="stat-icon-bg">👥</div>
                </div>

                <!-- Indicatori cheie -->
                <div class="card-indicators">
                    <h4 class="indicators-title">Indicatori Cheie</h4>
                    <div>
                        <div class="indicator-row">
                            <div>
                                <p class="indicator-label">Rata Șomajului</p>
                                <p class="indicator-value" id="stat-rate">—</p>
                            </div>
                            <div class="indicator-icon">%</div>
                        </div>
                        <div class="indicator-row">
                            <div>
                                <p class="indicator-label">Șomeri Neindemnizați</p>
                                <p class="indicator-value" id="stat-non-compensated">—</p>
                            </div>
                            <div class="indicator-icon">📋</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========== SECONDARY GRID (Harta + Donut) ========== -->
        <div class="grid-secondary">

            <!-- Harta -->
            <div class="card flex-col" id="map-card">
                <div class="card-header">
                    <h3 class="card-title">Harta România pe Județe</h3>
                </div>
                <div class="map-container">
                    <div id="map"></div>
                </div>
            </div>

            <!-- Grafic Donut -->
            <div class="card flex-col" id="donut-card">
                <div class="card-header">
                    <h3 class="card-title" id="donut-chart-title">Distribuție pe Nivel de Educație</h3>
                </div>
                <div class="donut-area">
                    <div class="donut-canvas-wrapper">
                        <canvas id="donut-chart"></canvas>
                        <div class="donut-center-label">
                            <div class="donut-center-value" id="donut-center-value">—</div>
                            <div class="donut-center-text" id="donut-center-text"></div>
                        </div>
                    </div>
                    <div class="donut-legend" id="donut-legend">
                        <!-- Populat din JS -->
                    </div>
                </div>
            </div>
        </div>

        <!-- ========== TABEL DATE ========== -->
        <section class="table-section" id="table-section">
            <div class="table-header">
                <h3 class="card-title">Statistici Detaliate pe Județe</h3>
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input class="search-input" id="table-search" type="text" placeholder="Caută județ...">
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table class="data-table" id="data-table">
                    <thead>
                        <tr id="table-head-row">
                            <!-- Generat din JS in functie de criteriu -->
                        </tr>
                    </thead>
                    <tbody id="table-body">
                        <!-- Populat din JS -->
                    </tbody>
                </table>
            </div>
            <div class="table-footer">
                <span id="table-info">Se încarcă...</span>
                <div class="pagination" id="table-pagination">
                    <!-- Butoane paginare generate din JS -->
                </div>
            </div>
        </section>

    </main>

    <!-- ========== FOOTER ========== -->
    <footer class="footer">
        <p>© <?= date('Y') ?> Proiect Universitar - Monitorizare Șomaj România</p>
        <div class="footer-links">
            <a href="https://data.gov.ro" target="_blank" rel="noopener">Sursă Date: data.gov.ro</a>
            <a href="https://www.anofm.ro" target="_blank" rel="noopener">ANOFM</a>
        </div>
    </footer>

    <!-- ========== SCRIPTS ========== -->
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <!-- Leaflet -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <!-- jsPDF + html2canvas (pentru export PDF) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

    <!-- Scripturi proprii -->
    <script src="/js/charts.js"></script>
    <script src="/js/map.js"></script>
    <script src="/js/export.js"></script>
    <script src="/js/app.js"></script>

</body>
</html>
