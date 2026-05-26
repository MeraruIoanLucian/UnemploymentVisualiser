/**
 * MonitorExport - Modul pentru exportul datelor
 * 
 * Suporta 3 formate de export:
 * - CSV: date tabelare
 * - SVG: grafice vectoriale
 * - PDF: raport complet cu grafice si statistici
 */

var MonitorExport = (function () {

    var cachedRobotoRegular = null;
    var cachedRobotoBold = null;

    /**
     * Incarca fonturile Roboto Regular si Bold asincron si le converteste in Base64
     * @returns {Promise} Rezolva cu un obiect ce contine base64-urile celor doua fonturi
     */
    function loadRobotoFonts() {
        if (cachedRobotoRegular && cachedRobotoBold) {
            return Promise.resolve({ regular: cachedRobotoRegular, bold: cachedRobotoBold });
        }

        var regUrl = 'fonts/Roboto-Regular.ttf';
        var boldUrl = 'fonts/Roboto-Bold.ttf';

        function fetchFont(url) {
            return fetch(url)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Nu s-a putut descarca fontul de la adresa: ' + url);
                    }
                    return response.arrayBuffer();
                })
                .then(function (arrayBuffer) {
                    var bytes = new Uint8Array(arrayBuffer);
                    var binary = '';
                    var len = bytes.byteLength;
                    for (var i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return window.btoa(binary);
                });
        }

        return Promise.all([fetchFont(regUrl), fetchFont(boldUrl)])
            .then(function (results) {
                cachedRobotoRegular = results[0];
                cachedRobotoBold = results[1];
                return { regular: cachedRobotoRegular, bold: cachedRobotoBold };
            });
    }

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
     * @param {Array} data - datele de exportat
     * @param {string} criterion - criteriul curent
     * @param {string} month - luna curenta
     * @param {HTMLElement} triggerBtn - butonul care a declansat exportul (optional)
     * @param {Array} compareData - datele comparative (optional)
     * @param {string} compareMonth - luna comparativa (optional)
     */
    function toPDF(data, criterion, month, triggerBtn, compareData, compareMonth) {
        if (!data || data.length === 0) {
            alert('Nu sunt date disponibile pentru export.');
            return;
        }

        // Feedback vizual pe butonul care a declansat actiunea
        var btn = triggerBtn || document.getElementById('btn-pdf');
        var originalText = btn ? btn.textContent : '';
        if (btn) btn.textContent = '...';

        // Folosim un timeout scurt pentru a lasa UI-ul sa se actualizeze
        setTimeout(function() {
            loadRobotoFonts()
                .then(function (fonts) {
                    generatePDFWithFonts(fonts.regular, fonts.bold);
                })
                .catch(function (error) {
                    console.error('Eroare la incarcarea fonturilor Roboto (se foloseste helvetica ca fallback):', error);
                    generatePDFWithFonts(null, null);
                });
        }, 100);

        function generatePDFWithFonts(regBase64, boldBase64) {
            try {
                var jsPDF = window.jspdf.jsPDF;
                var pdf = new jsPDF('p', 'mm', 'a4');

                // Incarcam fonturile pentru suport diacritice (Romanian)
                var hasRoboto = false;
                try {
                    if (regBase64) {
                        pdf.addFileToVFS('Roboto-Regular.ttf', regBase64);
                        pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                        hasRoboto = true;
                    }
                    if (boldBase64) {
                        pdf.addFileToVFS('Roboto-Bold.ttf', boldBase64);
                        pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
                    }
                } catch (e) {
                    console.error('Eroare la adaugarea fonturilor in VFS:', e);
                }
                
                var mainFont = hasRoboto ? 'Roboto' : 'helvetica';
                pdf.setFont(mainFont, 'normal');

                var pageWidth = pdf.internal.pageSize.width;
                var pageHeight = pdf.internal.pageSize.height;

                // Helper pentru label-uri luni
                function getMonthLabel(m) {
                    var select = document.getElementById('period-select');
                    if (select) {
                        for (var i = 0; i < select.options.length; i++) {
                            if (select.options[i].value === m) return select.options[i].text;
                        }
                    }
                    return m;
                }

                var monthLabel = getMonthLabel(month);
                var compareMonthLabel = compareData ? getMonthLabel(compareMonth) : null;
                var countySelect = document.getElementById('county-select');
                var criterionLabel = CONFIG.CRITERION_TITLE[criterion] || 'Statistici Șomaj';

                var currentCounty = countySelect ? countySelect.value : 'all';
                var countyLabel = 'Toate Județele';
                if (currentCounty && currentCounty !== 'all') {
                    if (countySelect) {
                        var opt = countySelect.options[countySelect.selectedIndex];
                        if (opt) countyLabel = opt.text;
                    } else {
                        countyLabel = currentCounty;
                    }
                }

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
                
                pdf.setFontSize(11);
                var headerText = 'Perioada: ' + monthLabel;
                if (compareData) headerText += ' vs ' + compareMonthLabel;
                headerText += ' | Județ: ' + countyLabel;
                pdf.text(headerText, 15, 36);

                var y = 50;

                // 2. GRAFIC PRINCIPAL (Bar Chart - include comparatia daca e activa)
                var barChart = MonitorCharts.getBarChart();
                if (barChart && barChart.canvas) {
                    pdf.setTextColor(12, 51, 90);
                    pdf.setFontSize(14);
                    pdf.setFont(mainFont, 'bold');
                    pdf.text(criterionLabel + (compareData ? ' (Comparativ)' : ''), 15, y);
                    y += 5;

                    var barCanvas = barChart.canvas;
                    var barImgData = barCanvas.toDataURL('image/png');
                    var barWidth = pageWidth - 30;
                    var barHeight = (barCanvas.height * barWidth) / barCanvas.width;
                    if (barHeight > 85) barHeight = 85;

                    pdf.addImage(barImgData, 'PNG', 15, y, barWidth, barHeight);
                    y += barHeight + 15;
                }

                // 3. GRAFICE RING / DONUT
                if (compareData) {
                    pdf.setFontSize(14);
                    pdf.setFont(mainFont, 'bold');
                    pdf.text('Distribuție Comparație', 15, y);
                    y += 7;
                    
                    // Donut 1 (Luna curenta)
                    var donut1 = generateDonutImage(data, criterion, currentCounty);
                    pdf.addImage(donut1.imgData, 'PNG', 15, y, 50, 50);
                    
                    // Donut 2 (Luna comparativa)
                    var donut2 = generateDonutImage(compareData, criterion, currentCounty);
                    pdf.addImage(donut2.imgData, 'PNG', pageWidth - 15 - 50, y, 50, 50);

                    // Legendă partajată în mijloc
                    pdf.setFontSize(8);
                    pdf.setFont(mainFont, 'normal');
                    var labels = donut1.breakdown.labels;
                    var colors = MonitorCharts.COLORS.palette;
                    
                    labels.forEach(function(label, i) {
                        if (i < 8) {
                            var legY = y + 10 + (i * 6);
                            // Căsuța de culoare
                            pdf.setFillColor(colors[i % colors.length]);
                            pdf.rect(pageWidth / 2 - 25, legY - 3, 3, 3, 'F');
                            // Text legendă
                            pdf.setTextColor(60, 60, 60);
                            pdf.text(label, pageWidth / 2 - 20, legY);
                        }
                    });

                    // Label-uri Luni sub grafice
                    pdf.setFontSize(10);
                    pdf.setFont(mainFont, 'bold');
                    pdf.setTextColor(12, 51, 90);
                    pdf.text(monthLabel, 15 + 25, y + 55, { align: 'center' });
                    pdf.text(compareMonthLabel, pageWidth - 15 - 25, y + 55, { align: 'center' });

                    y += 65;
                } else {
                    // Un singur ring chart
                    var donut = generateDonutImage(data, criterion, currentCounty);
                    pdf.setFontSize(14);
                    pdf.setFont(mainFont, 'bold');
                    pdf.text(CONFIG.DONUT_TITLE[criterion] || 'Distribuție', 15, y);
                    y += 5;

                    pdf.addImage(donut.imgData, 'PNG', 15, y, 55, 55);
                    
                    var totalCount = donut.breakdown.values.reduce(function(a, b) { return a + b; }, 0);
                    
                    pdf.setFontSize(9);
                    pdf.setFont(mainFont, 'normal');
                    pdf.setTextColor(60, 60, 60);
                    donut.breakdown.labels.forEach(function(label, i) {
                        if (i < 8) {
                            var pct = totalCount > 0 ? Math.round((donut.breakdown.values[i] / totalCount) * 100) : 0;
                            pdf.text('• ' + label + ': ' + pct + '%', 15 + 65, y + 10 + (i * 6));
                        }
                    });
                    y += 65;
                }

                // 4. TABEL(E) DETALIATE (afișează doar județul selectat dacă este cazul)
                var columns = CONFIG.TABLE_COLUMNS[criterion] || [];
                var tableHeaders = [columns.map(function(col) { return col.label; })];

                // Filtrare pentru Tabelul 1 (Luna curentă)
                var filteredData1 = data;
                if (currentCounty && currentCounty !== 'all') {
                    var canonicalTarget = canonicalizeCounty(currentCounty);
                    filteredData1 = data.filter(function(row) {
                        return canonicalizeCounty(row.county) === canonicalTarget;
                    });
                }

                // Tabel 1: Luna Curenta
                pdf.addPage();
                pdf.setTextColor(12, 51, 90);
                pdf.setFontSize(16);
                pdf.setFont(mainFont, 'bold');
                pdf.text('Date Detaliate: ' + monthLabel, 15, 20);

                var tableData1 = filteredData1.map(function(row) {
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
                    body: tableData1,
                    theme: 'striped',
                    headStyles: { fillColor: [12, 51, 90], textColor: 255, fontStyle: 'bold', font: mainFont },
                    styles: { fontSize: 8, cellPadding: 2, font: mainFont },
                    margin: { left: 15, right: 15 },
                    didDrawPage: function (d) {
                        pdf.setFontSize(8);
                        pdf.setFont(mainFont, 'normal');
                        pdf.setTextColor(150);
                        pdf.text('Raport ' + monthLabel + ' | Pagina ' + pdf.internal.getNumberOfPages(), 15, pageHeight - 10);
                    }
                });

                // Tabel 2: Luna Comparativa (Daca exista)
                if (compareData) {
                    pdf.addPage();
                    pdf.setTextColor(12, 51, 90);
                    pdf.setFontSize(16);
                    pdf.setFont(mainFont, 'bold');
                    pdf.text('Date Detaliate: ' + compareMonthLabel, 15, 20);

                    // Filtrare pentru Tabelul 2 (Luna comparativă)
                    var filteredData2 = compareData;
                    if (currentCounty && currentCounty !== 'all') {
                        var canonicalTarget = canonicalizeCounty(currentCounty);
                        filteredData2 = compareData.filter(function(row) {
                            return canonicalizeCounty(row.county) === canonicalTarget;
                        });
                    }

                    var tableData2 = filteredData2.map(function(row) {
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
                        body: tableData2,
                        theme: 'striped',
                        headStyles: { fillColor: [64, 97, 138], textColor: 255, fontStyle: 'bold', font: mainFont },
                        styles: { fontSize: 8, cellPadding: 2, font: mainFont },
                        margin: { left: 15, right: 15 },
                        didDrawPage: function (d) {
                            pdf.setFontSize(8);
                            pdf.setFont(mainFont, 'normal');
                            pdf.setTextColor(150);
                            pdf.text('Raport ' + compareMonthLabel + ' | Pagina ' + pdf.internal.getNumberOfPages(), 15, pageHeight - 10);
                        }
                    });
                }

                // 5. PREVIEW & PRINT
                pdf.autoPrint();
                var pdfOutput = pdf.output('blob');
                var blobUrl = URL.createObjectURL(pdfOutput);
                var newWindow = window.open(blobUrl, '_blank');
                
                if (!newWindow) {
                    var outName = 'somaj_raport_' + month;
                    if (compareMonth) outName += '_vs_' + compareMonth;
                    pdf.save(outName + '.pdf');
                    alert('Vă rugăm să permiteți pop-up-urile pentru a vedea previzualizarea PDF.');
                }

                if (btn) btn.textContent = originalText;
            } catch (err) {
                console.error('Eroare la generarea PDF:', err);
                alert('A apărut o eroare la generarea PDF-ului.');
                if (btn) btn.textContent = originalText;
            }
        }
    }

    /**
     * Helper pentru a genera o imagine a unui grafic donut pentru PDF folosind un canvas off-screen
     */
    function generateDonutImage(data, criterion, county) {
        var breakdown = computeBreakdown(data, criterion, county);
        var imgData = MonitorCharts.generateDonutImage(breakdown);
        return { imgData: imgData, breakdown: breakdown };
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
        for (var i = 0; i < columns.length; i++) {
            sql += '    ' + columns[i] + ' ' + colTypes[i];
            if (i < columns.length - 1) sql += ',';
            sql += '\n';
        }
        sql += ');\n\n';

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
