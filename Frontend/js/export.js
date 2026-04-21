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
     * Foloseste html2canvas pentru captura si jsPDF pentru generare
     */
    function toPDF() {
        var mainContent = document.getElementById('main-content');
        if (!mainContent) {
            alert('Nu s-a găsit conținutul de exportat.');
            return;
        }

        // Feedback vizual
        var btn = document.getElementById('btn-pdf');
        var originalText = btn ? btn.textContent : '';
        if (btn) btn.textContent = '...';

        html2canvas(mainContent, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#f8f9ff'
        }).then(function (canvas) {
            var jsPDF = window.jspdf.jsPDF;
            var imgData = canvas.toDataURL('image/png');

            // Calculam dimensiunile pentru A4
            var pageWidth = 210; // mm
            var pageHeight = 297; // mm
            var imgWidth = pageWidth - 20; // 10mm margini
            var imgHeight = (canvas.height * imgWidth) / canvas.width;

            var pdf = new jsPDF('p', 'mm', 'a4');
            var pageNumber = 1;

            function addHeader() {
                var title = pageNumber === 1 ? 'Monitor Șomaj România - Raport' : 'Monitor Șomaj România - Raport (pag. ' + pageNumber + ')';
                pdf.setFontSize(16);
                pdf.setTextColor(12, 51, 90);
                pdf.text(title, 10, 15);
                pdf.setFontSize(9);
                pdf.setTextColor(100);
                pdf.text('Generat la: ' + new Date().toLocaleString('ro-RO'), 10, 22);
            }

            addHeader();

            var yOffset = 28;

            // Daca imaginea incape pe o pagina
            if (imgHeight + yOffset + 10 <= pageHeight) {
                pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, imgHeight);
            } else {
                // Impartim pe mai multe pagini
                var remainingHeight = imgHeight;
                var positionOnCanvas = 0; // Pozitia Y pe canvas-ul sursa, in pixeli

                while (remainingHeight > 0) {
                    var sliceHeightOnPdf = Math.min(remainingHeight, pageHeight - yOffset - 10);
                    var sliceHeightOnCanvas = (sliceHeightOnPdf / imgHeight) * canvas.height;

                    // Cream un canvas partial
                    var sliceCanvas = document.createElement('canvas');
                    sliceCanvas.width = canvas.width;
                    sliceCanvas.height = sliceHeightOnCanvas;
                    var ctx = sliceCanvas.getContext('2d');

                    // Copiem bucata din canvas-ul mare in cel partial
                    ctx.drawImage(canvas,
                        0, positionOnCanvas,
                        canvas.width, sliceHeightOnCanvas,
                        0, 0, canvas.width, sliceHeightOnCanvas
                    );

                    // Adaugam doar bucata, nu imaginea intreaga
                    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 10, yOffset, imgWidth, sliceHeightOnPdf);

                    remainingHeight -= sliceHeightOnPdf;
                    positionOnCanvas += sliceHeightOnCanvas;

                    if (remainingHeight > 0) {
                        pageNumber++;
                        pdf.addPage();
                        addHeader();
                        yOffset = 28; // Resetam pozitia Y pentru pagina noua cu header
                    }
                }
            }

            pdf.save('somaj_raport.pdf');

            if (btn) btn.textContent = originalText;
        }).catch(function (err) {
            console.error('Eroare la generarea PDF:', err);
            alert('A apărut o eroare la generarea PDF-ului.');
            if (btn) btn.textContent = originalText;
        });
    }

    /**
     * Descarca un fisier generat
     * @param {string} content - continutul fisierului
     * @param {string} fileName - numele fisierului
     * @param {string} mimeType - tipul MIME
     */
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
        toPDF: toPDF
    };
})();
