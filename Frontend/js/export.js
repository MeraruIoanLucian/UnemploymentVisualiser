/**
 * MonitorExport - Modul pentru exportul datelor
 * 
 * Suporta 3 formate de export:
 * - CSV: date tabelare
 * - SVG: grafice vectoriale
 * - PDF: raport complet cu grafice si statistici
 */

var MonitorExport = (function () {

    /**
     * Exporta datele curente ca fisier CSV
     * @param {Array} data - array de obiecte din API
     * @param {string} criterion - tipul de date ('rata', 'educatie', 'varste', 'medii')
     * @param {string} fileName - numele fisierului
     */
    function toCSV(data, criterion, fileName) {
        if (!data || data.length === 0) {
            alert('Nu sunt date disponibile pentru export.');
            return;
        }

        var headers = [];
        var rows = [];

        switch (criterion) {
            case 'rata':
                headers = ['Județ', 'Total Șomeri', 'Femei', 'Bărbați', 'Indemnizați', 'Neindemnizați', 'Rata (%)', 'Rata Femei (%)', 'Rata Bărbați (%)'];
                rows = data.map(function (d) {
                    return [
                        d.county, d.nrUnemployed, d.nrFemaleUnemployed, d.nrMaleUnemployed,
                        d.nrCompensatedUnemployed, d.nrNonCompensatedUnemployed,
                        d.unemploymentRate, d.femaleUnemploymentRate, d.maleUnemploymentRate
                    ];
                });
                break;
            case 'educatie':
                headers = ['Județ', 'Fără studii', 'Primar', 'Gimnazial', 'Liceal', 'Postliceal', 'Profesional', 'Universitar'];
                rows = data.map(function (d) {
                    return [d.county, d.noStudy, d.primaryStudy, d.middleStudy, d.highStudy, d.postHighStudy, d.professionalStudy, d.universityStudy];
                });
                break;
            case 'varste':
                headers = ['Județ', 'Sub 25', '25-29', '30-39', '40-49', '50-59', 'Peste 50'];
                rows = data.map(function (d) {
                    return [d.county, d.under25, d.from25to29, d.from30to39, d.from40to49, d.from50to59, d.over50];
                });
                break;
            case 'medii':
                headers = ['Județ', 'Total', 'Femei', 'Bărbați', 'Urban', 'Urban Femei', 'Urban Bărbați', 'Rural', 'Rural Femei', 'Rural Bărbați'];
                rows = data.map(function (d) {
                    return [
                        d.county, d.totalUnemployed, d.totalFemaleUnemployed, d.totalMaleUnemployed,
                        d.totalUnemployedUrban, d.totalFemaleUnemployedUrban, d.totalMaleUnemployedUrban,
                        d.totalUnemployedRural, d.totalFemaleUnemployedRural, d.totalMaleUnemployedRural
                    ];
                });
                break;
        }

        // Construim CSV-ul
        var csvContent = '\uFEFF'; // BOM pentru diacritice in Excel
        csvContent += headers.join(';') + '\n';
        rows.forEach(function (row) {
            csvContent += row.map(function (cell) {
                // Escapam valorile care contin separator
                var val = String(cell);
                if (val.indexOf(';') !== -1 || val.indexOf('"') !== -1) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                return val;
            }).join(';') + '\n';
        });

        downloadFile(csvContent, fileName || 'somaj_export.csv', 'text/csv;charset=utf-8');
    }

    /**
     * Exporta graficul principal ca SVG
     * @param {string} fileName - numele fisierului
     */
    function toSVG(fileName) {
        var barChart = MonitorCharts.getBarChart();
        if (!barChart) {
            alert('Nu există grafic de exportat.');
            return;
        }

        // Chart.js randeaza pe canvas, nu SVG nativ
        // Convertim canvas-ul in imagine si cream un SVG wrapper
        var canvas = barChart.canvas;
        var dataUrl = canvas.toDataURL('image/png');
        var width = canvas.width;
        var height = canvas.height;

        var svgContent = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">\n' +
            '  <title>Monitor Șomaj - Grafic Export</title>\n' +
            '  <image href="' + dataUrl + '" width="' + width + '" height="' + height + '"/>\n' +
            '</svg>';

        downloadFile(svgContent, fileName || 'somaj_grafic.svg', 'image/svg+xml');
    }

    /**
     * Exporta dashboard-ul ca PDF
     * Foloseste jsPDF + autoTable pentru un raport profesional
     */
    function toPDF() {
        // Accesam datele globale din app.js (state si CONFIG)
        if (typeof state === 'undefined' || typeof CONFIG === 'undefined') {
            alert('Datele aplicației nu sunt disponibile.');
            return;
        }

        var data = state.data;
        if (!data || data.length === 0) {
            alert('Nu sunt date disponibile pentru export.');
            return;
        }

        // Feedback vizual
        var btn = document.getElementById('btn-pdf');
        var originalText = btn ? btn.textContent : '';
        if (btn) btn.textContent = '...';

        // Folosim un timeout scurt pentru a lasa UI-ul sa se actualizeze (feedback-ul cu '...')
        setTimeout(function() {
            try {
                var jsPDF = window.jspdf.jsPDF;
                var pdf = new jsPDF('p', 'mm', 'a4');

                // Incarcam fonturile pentru suport diacritice (Romanian)
                var hasRoboto = false;
                try {
                    if (typeof FONT_ROBOTO_REGULAR !== 'undefined' && FONT_ROBOTO_REGULAR.length > 1000) {
                        pdf.addFileToVFS('Roboto-Regular.ttf', FONT_ROBOTO_REGULAR);
                        pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                        hasRoboto = true;
                    }
                    if (typeof FONT_ROBOTO_BOLD !== 'undefined' && FONT_ROBOTO_BOLD.length > 1000) {
                        pdf.addFileToVFS('Roboto-Bold.ttf', FONT_ROBOTO_BOLD);
                        pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
                    }
                } catch (e) {
                    console.error('Eroare la incarcarea fonturilor:', e);
                }
                
                var mainFont = hasRoboto ? 'Roboto' : 'helvetica';
                pdf.setFont(mainFont, 'normal');

                var pageWidth = pdf.internal.pageSize.width;
                var pageHeight = pdf.internal.pageSize.height;

                // 1. HEADER
                pdf.setFillColor(12, 51, 90);
                pdf.rect(0, 0, pageWidth, 40, 'F');
                
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(22);
                pdf.setFont(mainFont, 'bold');
                pdf.text('Monitor Șomaj România', 15, 20);
                
                pdf.setFontSize(10);
                pdf.setFont(mainFont, 'normal');
                pdf.text('Raport Generat la: ' + new Date().toLocaleString('ro-RO'), 15, 30);
                
                // Info filtre
                var periodSelect = document.getElementById('period-select');
                var periodLabel = periodSelect ? periodSelect.options[periodSelect.selectedIndex].text : state.currentMonth;
                var countySelect = document.getElementById('county-select');
                var countyLabel = countySelect ? countySelect.options[countySelect.selectedIndex].text : 'Toate Județele';
                var criterionLabel = CONFIG.CRITERION_TITLE[state.currentCriterion];
                
                pdf.setFontSize(11);
                pdf.text('Perioada: ' + periodLabel + '  |  Județ: ' + countyLabel, 15, 36);

                var y = 50;

                // 2. GRAFICE (Main Chart)
                var barChart = MonitorCharts.getBarChart();
                if (barChart && barChart.canvas) {
                    pdf.setTextColor(12, 51, 90);
                    pdf.setFontSize(14);
                    pdf.setFont(mainFont, 'bold');
                    pdf.text(criterionLabel, 15, y);
                    y += 5;

                    var barCanvas = barChart.canvas;
                    // Folosim JPEG si calitate mai mica pentru a evita crash-ul la rezolutii mari
                    var barImgData = barCanvas.toDataURL('image/jpeg', 0.8);
                    var barWidth = pageWidth - 30;
                    var barHeight = (barCanvas.height * barWidth) / barCanvas.width;
                    
                    if (barHeight > 85) barHeight = 85;

                    pdf.addImage(barImgData, 'JPEG', 15, y, barWidth, barHeight);
                    y += barHeight + 15;
                }

                // 3. GRAFIC DONUT (Daca exista si incape)
                var donutChart = MonitorCharts.getDonutChart();
                if (donutChart && donutChart.canvas) {
                    pdf.setFontSize(14);
                    pdf.setFont(mainFont, 'bold');
                    pdf.text(CONFIG.DONUT_TITLE[state.currentCriterion], 15, y);
                    y += 5;

                    var donutCanvas = donutChart.canvas;
                    var donutImgData = donutCanvas.toDataURL('image/jpeg', 0.8);
                    var donutSize = 55;
                    
                    pdf.addImage(donutImgData, 'JPEG', 15, y, donutSize, donutSize);
                    
                    // Adaugam legenda langa donut
                    pdf.setFontSize(9);
                    pdf.setFont(mainFont, 'normal');
                    pdf.setTextColor(60, 60, 60);
                    
                    var breakdown = computeBreakdown(state.data, state.currentCriterion, state.currentCounty);
                    var totalCount = breakdown.values.reduce(function(a, b) { return a + b; }, 0);
                    
                    breakdown.labels.forEach(function(label, i) {
                        if (i < 8) { // Limitam numarul de randuri in legenda sa nu iasa din pagina
                            var pct = totalCount > 0 ? Math.round((breakdown.values[i] / totalCount) * 100) : 0;
                            pdf.text('• ' + label + ': ' + pct + '%', 15 + donutSize + 10, y + 10 + (i * 6));
                        }
                    });

                    y += donutSize + 15;
                }

                // 4. TABEL COMPLET
                pdf.addPage();
                pdf.setTextColor(12, 51, 90);
                pdf.setFontSize(16);
                pdf.setFont(mainFont, 'bold');
                pdf.text('Statistici Detaliate pe Județe', 15, 20);

                var columns = CONFIG.TABLE_COLUMNS[state.currentCriterion];
                var tableHeaders = [columns.map(function(col) { return col.label; })];
                var tableData = state.data.map(function(row) {
                    return columns.map(function(col) {
                        var val = row[col.key];
                        if (col.format === 'number') return (val || 0).toLocaleString('ro-RO');
                        if (col.format === 'rate') return val + '%';
                        return val;
                    });
                });

                pdf.autoTable({
                    startY: 25,
                    head: tableHeaders,
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [12, 51, 90], textColor: 255, fontStyle: 'bold', font: mainFont },
                    styles: { fontSize: 8, cellPadding: 2, font: mainFont },
                    margin: { left: 15, right: 15 },
                    didDrawPage: function (data) {
                        // Footer pagina
                        pdf.setFontSize(8);
                        pdf.setFont(mainFont, 'normal');
                        pdf.setTextColor(150);
                        pdf.text('Pagina ' + pdf.internal.getNumberOfPages(), 15, pageHeight - 10);
                    }
                });

                // 5. PREVIEW & PRINT
                // Auto-print pentru CUPS-PDF
                pdf.autoPrint();
                
                // Generam Blob-ul o singura data
                var pdfOutput = pdf.output('blob');
                var blobUrl = URL.createObjectURL(pdfOutput);
                
                // Deschidem in fereastra noua
                var newWindow = window.open(blobUrl, '_blank');
                if (!newWindow) {
                    // Daca popup blocker e activ, facem fallback la download
                    pdf.save('somaj_raport_complet.pdf');
                    alert('Vă rugăm să permiteți pop-up-urile pentru a vedea previzualizarea PDF.');
                }

                if (btn) btn.textContent = originalText;
            } catch (err) {
                console.error('Eroare la generarea PDF:', err);
                alert('A apărut o eroare la generarea PDF-ului. Datele ar putea fi prea mari pentru browser.');
                if (btn) btn.textContent = originalText;
            }
        }, 100);
    }

    /**
     * Functie helper pentru a recalcula distributia (copiata din app.js sau facuta accesibila)
     * In mod normal ar trebui sa fie intr-un modul de date comun.
     */
    function computeBreakdown(data, criterion, county) {
        var filtered = data;
        if (county && county !== 'all') {
            filtered = data.filter(function (d) {
                return d.county.toUpperCase() === county.toUpperCase();
            });
        }

        var labels, values;
        switch (criterion) {
            case 'rata':
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

    // export SQL - creare tabel + insert linie cu linie
    function toSQL(data, criterion, fileName) {
        if (!data || data.length === 0) {
            alert('Nu sunt date disponibile pentru export.');
            return;
        }

        var tableName = 'somaj_' + criterion;
        var columns = [];
        var colTypes = [];

        switch (criterion) {
            case 'rata':
                columns = ['county', 'nr_unemployed', 'nr_female_unemployed', 'nr_male_unemployed',
                            'nr_compensated', 'nr_non_compensated',
                            'unemployment_rate', 'female_rate', 'male_rate'];
                colTypes = ['VARCHAR(100)', 'INT', 'INT', 'INT', 'INT', 'INT', 'DECIMAL(5,2)', 'DECIMAL(5,2)', 'DECIMAL(5,2)'];
                break;
            case 'educatie':
                columns = ['county', 'no_study', 'primary_study', 'middle_study', 'high_study',
                            'post_high_study', 'professional_study', 'university_study'];
                colTypes = ['VARCHAR(100)', 'INT', 'INT', 'INT', 'INT', 'INT', 'INT', 'INT'];
                break;
            case 'varste':
                columns = ['county', 'under_25', 'from_25_to_29', 'from_30_to_39',
                            'from_40_to_49', 'from_50_to_59', 'over_50'];
                colTypes = ['VARCHAR(100)', 'INT', 'INT', 'INT', 'INT', 'INT', 'INT'];
                break;
            case 'medii':
                columns = ['county', 'total_unemployed', 'total_female', 'total_male',
                            'urban_total', 'urban_female', 'urban_male',
                            'rural_total', 'rural_female', 'rural_male'];
                colTypes = ['VARCHAR(100)', 'INT', 'INT', 'INT', 'INT', 'INT', 'INT', 'INT', 'INT', 'INT'];
                break;
        }

        // CREATE TABLE
        var sql = '-- Export SQL generat de Monitor Somaj\n';
        sql += '-- Data: ' + new Date().toLocaleString('ro-RO') + '\n\n';
        sql += 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (\n';
        sql += '    id INT AUTO_INCREMENT PRIMARY KEY,\n';
        for (var i = 0; i < columns.length; i++) {
            sql += '    ' + columns[i] + ' ' + colTypes[i];
            sql += ',\n';
        }
        // scoatem ultima virgula si adaugam inchiderea
        sql = sql.slice(0, -2) + '\n);\n\n';

        // INSERT INTO linie cu linie
        data.forEach(function (row) {
            var vals = [];
            switch (criterion) {
                case 'rata':
                    vals = [
                        "'" + (row.county || '').replace(/'/g, "''") + "'",
                        row.nrUnemployed || 0, row.nrFemaleUnemployed || 0, row.nrMaleUnemployed || 0,
                        row.nrCompensatedUnemployed || 0, row.nrNonCompensatedUnemployed || 0,
                        row.unemploymentRate || 0, row.femaleUnemploymentRate || 0, row.maleUnemploymentRate || 0
                    ];
                    break;
                case 'educatie':
                    vals = [
                        "'" + (row.county || '').replace(/'/g, "''") + "'",
                        row.noStudy || 0, row.primaryStudy || 0, row.middleStudy || 0,
                        row.highStudy || 0, row.postHighStudy || 0, row.professionalStudy || 0, row.universityStudy || 0
                    ];
                    break;
                case 'varste':
                    vals = [
                        "'" + (row.county || '').replace(/'/g, "''") + "'",
                        row.under25 || 0, row.from25to29 || 0, row.from30to39 || 0,
                        row.from40to49 || 0, row.from50to59 || 0, row.over50 || 0
                    ];
                    break;
                case 'medii':
                    vals = [
                        "'" + (row.county || '').replace(/'/g, "''") + "'",
                        row.totalUnemployed || 0, row.totalFemaleUnemployed || 0, row.totalMaleUnemployed || 0,
                        row.totalUnemployedUrban || 0, row.totalFemaleUnemployedUrban || 0, row.totalMaleUnemployedUrban || 0,
                        row.totalUnemployedRural || 0, row.totalFemaleUnemployedRural || 0, row.totalMaleUnemployedRural || 0
                    ];
                    break;
            }
            sql += 'INSERT INTO ' + tableName + ' (' + columns.join(', ') + ') VALUES (' + vals.join(', ') + ');\n';
        });

        downloadFile(sql, fileName || 'somaj_export.sql', 'text/sql;charset=utf-8');
    }

    // export JSON
    function toJSON(data, criterion, fileName) {
        if (!data || data.length === 0) {
            alert('Nu sunt date disponibile pentru export.');
            return;
        }

        var jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, fileName || 'somaj_export.json', 'application/json;charset=utf-8');
    }

    // descarca un fisier generat
    function downloadFile(content, fileName, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Public API
    return {
        toCSV: toCSV,
        toSVG: toSVG,
        toPDF: toPDF,
        toSQL: toSQL,
        toJSON: toJSON
    };
})();
