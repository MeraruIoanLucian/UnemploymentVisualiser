// map.js - logica pt harta leaflet

var MonitorMap = (function () {
    var map = null;
    var geojsonLayer = null;
    var currentData = null;

    // URL catre GeoJSON-ul cu judetele Romaniei (valida wgs84 pt leaflet)
    var GEOJSON_URL = 'https://raw.githubusercontent.com/GabrielRondelli/geojson/main/romania-counties.geojson';

    // Callback cand se da click pe un judet
    var onCountyClick = null;

    // init la harta
    function init(containerId, clickCallback) {
        onCountyClick = clickCallback;

        if (map) {
            map.remove();
        }

        // Centram pe Romania
        map = L.map(containerId, {
            center: [45.9432, 24.9668],
            zoom: 7,
            minZoom: 6,
            maxZoom: 10
        });

        // Tile layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Incarcam GeoJSON-ul un singur data
        loadGeoJSON();

        return map;
    }

    // aduce geojsonul cu judetele
    function loadGeoJSON() {
        fetch(GEOJSON_URL)
            .then(function (response) {
                if (!response.ok) throw new Error('GeoJSON fetch failed');
                return response.json();
            })
            .then(function (geojsonData) {
                geojsonLayer = L.geoJSON(geojsonData, {
                    style: defaultStyle,
                    onEachFeature: onEachFeature
                }).addTo(map);

                // Daca avem deja date, aplicam culorile
                if (currentData) {
                    updateColors(currentData);
                }
            })
            .catch(function (err) {
                console.warn('Nu s-a putut incarca GeoJSON-ul:', err.message);
                // Harta va functiona fara granitele judetelor
            });
    }

    /**
     * Stilul implicit pentru un judet (fara date)
     */
    function defaultStyle() {
        return {
            fillColor: '#dbe1ff',
            weight: 1,
            opacity: 0.8,
            color: '#5c7da8',
            fillOpacity: 0.5
        };
    }

    /**
     * Returneaza culoarea pentru o anumita valoare a ratei
     * Scala: verde (< 2%) -> galben (3-5%) -> rosu (> 8%)
     */
    function getColor(rate) {
        if (rate > 8) return '#b91c1c';
        if (rate > 6) return '#dc2626';
        if (rate > 5) return '#f97316';
        if (rate > 4) return '#eab308';
        if (rate > 3) return '#84cc16';
        if (rate > 2) return '#22c55e';
        return '#15803d';
    }

    /**
     * Extrage numele judetului din proprietatile GeoJSON
     * GeoJSON-urile de Romania au diverse formate de proprietati
     */
    function getCountyName(properties) {
        return (properties.name || properties.NAME || properties.NAME_1 || properties.name_1 || properties.mnemonic || properties.MNEMONIC || '').toUpperCase();
    }

    /**
     * Normalizeaza numele judetului pentru comparatie
     * Elimina diacritice si caractere speciale
     */
    function normalizeCounty(name) {
        if (!name) return '';
        var upper = name.toUpperCase();
        if (upper === 'BUCHAREST' || upper === 'BUCURESTI') {
            return 'MUN. BUC.';
        }
        
        return upper
            .replace(/Ă/g, 'A').replace(/Â/g, 'A')
            .replace(/Î/g, 'I').replace(/Ș/g, 'S').replace(/Ş/g, 'S')
            .replace(/Ț/g, 'T').replace(/Ţ/g, 'T')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Gaseste datele pentru un judet din array-ul de date API
     */
    function findCountyData(countyName, data) {
        var normalized = normalizeCounty(countyName);
        for (var i = 0; i < data.length; i++) {
            if (normalizeCounty(data[i].county) === normalized) {
                return data[i];
            }
        }
        // Incercare cu potrivire partiala
        for (var j = 0; j < data.length; j++) {
            if (normalized.indexOf(normalizeCounty(data[j].county)) !== -1 ||
                normalizeCounty(data[j].county).indexOf(normalized) !== -1) {
                return data[j];
            }
        }
        return null;
    }

    // pt mouseover / click pe harta
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: function (e) {
                var l = e.target;
                l.setStyle({
                    weight: 3,
                    color: '#0053db',
                    fillOpacity: 0.8
                });
                l.bringToFront();
            },
            mouseout: function (e) {
                if (geojsonLayer) {
                    geojsonLayer.resetStyle(e.target);
                }
                // Re-aplicam culorile daca avem date
                if (currentData) {
                    var countyName = getCountyName(e.target.feature.properties);
                    var countyData = findCountyData(countyName, currentData);
                    if (countyData && countyData.unemploymentRate !== undefined) {
                        e.target.setStyle({
                            fillColor: getColor(countyData.unemploymentRate),
                            fillOpacity: 0.7
                        });
                    }
                }
            },
            click: function (e) {
                var countyName = getCountyName(e.target.feature.properties);
                if (onCountyClick) {
                    onCountyClick(countyName);
                }
            }
        });

        // Tooltip cu numele judetului
        var name = getCountyName(feature.properties);
        if (name) {
            layer.bindTooltip(
                '<span class="county-tooltip">' + name + '</span>',
                { sticky: true, direction: 'top', offset: [0, -10] }
            );
        }
    }

    // actualizeaza culorile pt date
    function updateColors(data) {
        currentData = data;

        if (!geojsonLayer) return;

        geojsonLayer.eachLayer(function (layer) {
            var countyName = getCountyName(layer.feature.properties);
            var countyData = findCountyData(countyName, data);

            if (countyData && countyData.unemploymentRate !== undefined) {
                layer.setStyle({
                    fillColor: getColor(countyData.unemploymentRate),
                    fillOpacity: 0.7,
                    weight: 1,
                    color: '#5c7da8'
                });

                // Actualizeaza tooltip-ul cu informatii
                layer.bindTooltip(
                    '<span class="county-tooltip">' +
                    countyName + '<br>' +
                    'Rata: ' + countyData.unemploymentRate + '%<br>' +
                    'Total: ' + (countyData.nrUnemployed || 0).toLocaleString('ro-RO') +
                    '</span>',
                    { sticky: true, direction: 'top', offset: [0, -10] }
                );
            }
        });
    }

    /**
     * Evidentiaza un judet specific pe harta
     * @param {string} countyName - numele judetului
     */
    function highlightCounty(countyName) {
        if (!geojsonLayer || !countyName || countyName === 'all') {
            // Reset la zoom initial
            if (map) map.setView([45.9432, 24.9668], 7);
            return;
        }

        geojsonLayer.eachLayer(function (layer) {
            var name = getCountyName(layer.feature.properties);
            if (normalizeCounty(name) === normalizeCounty(countyName)) {
                // S-a sters map.fitBounds ca sa nu se mai miste harta
                layer.setStyle({
                    weight: 3,
                    color: '#0053db',
                    fillOpacity: 0.9
                });
                layer.bringToFront();
                layer.openTooltip();
            }
        });
    }

    /**
     * Returneaza referinta la harta Leaflet (pentru export)
     */
    function getMap() {
        return map;
    }

    // Public API
    return {
        init: init,
        updateColors: updateColors,
        highlightCounty: highlightCounty,
        getMap: getMap
    };
})();
