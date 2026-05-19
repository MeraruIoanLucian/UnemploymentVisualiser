# UnemploymentVisualiser (Monitor Șomaj România)

Un instrument web interactiv pentru vizualizarea și analizarea datelor referitoare la șomajul din România, utilizând date publice de pe [data.gov.ro](https://data.gov.ro).

## Project Overview

Proiectul este o aplicație web de tip dashboard care preia, procesează și vizualizează datele oficiale despre șomaj. Este structurat într-o arhitectură pe două niveluri (Frontend și API), containerizată cu Docker.

### Core Technologies
- **Backend (API)**: PHP 8.x, cURL pentru data fetching, sistem de caching local bazat pe fișiere.
- **Frontend**: HTML5/Vanilla CSS, JavaScript (ES6+), Chart.js (grafice), Leaflet (hărți), jsPDF & jspdf-autotable (export PDF).
- **Infrastructure**: Docker & Docker Compose.

## Architecture & Project Structure

### Backend (API/)
- **`index.php`**: Punctul central de intrare, router și gestionarul politicii de cache.
- **`service/`**:
  - `UnemploymentDataFetching.php`: Logica de orchestrare pentru preluarea datelor (verifica cache-ul, apelează cURL, parsează și curăță datele).
  - `FileParser.php`: Utilitar pentru cereri HTTP și parsare CSV (suportă delimitatori `;` și `,`).
  - `CacheSystem.php`: Implementează stocarea locală în `API/cache/` cu o politică de Time-To-Live (TTL) de 7 zile.
- **`models/`**: Obiecte de date (DTO) tipizate care implementează `JsonSerializable`:
  - `UnemploymentDataBasic`: Date generale (rata șomajului).
  - `UnemploymentDataPerAgeRange`: Distribuție pe grupe de vârstă.
  - `UnemploymentDataPerEducationLevel`: Distribuție pe nivel de studii.
  - `UnemploymentDataPerMedium`: Distribuție Urban vs. Rural.

### Frontend (Frontend/)
- **`index.php`**: Structura dashboard-ului, incluzând filtrele și containerele pentru vizualizări.
- **`api-proxy.php`**: Proxy PHP care facilitează comunicarea securizată cu containerul API din rețeaua Docker.
- **`js/`**:
  - `app.js`: Motorul principal al aplicației; gestionează starea globală (`state`), event listeners și coordonează actualizarea componentelor UI.
  - `charts.js`: Modul pentru configurarea Chart.js (Bar și Donut charts).
  - `map.js`: Integrarea Leaflet pentru thematic mapping (colorarea județelor în funcție de rată).
  - `export.js`: Implementează logica de export în formate multiple (CSV, SVG, PDF, SQL, JSON).
  - `fonts.js`: Conține fontul Roboto (Base64) pentru suportul caracterelor speciale în PDF.
- **`css/`**: Styling modern cu variabile CSS și optimizări pentru printare (`@media print`).

## API Endpoints

- `GET /api/{package}/{file}`: Fetch date procesate. (ex: `/api/mai2025/rata.csv`)
- `GET /api/cache`: Listare fișiere în cache.
- `DELETE /api/cache[/filename]`: Ștergere cache (totală sau parțială).

## Development Conventions

- **Data Integrity**: API-ul curăță automat datele sursă (ex: corecția encoding-ului pentru "Caraș-Severin").
- **State Flow**: Orice schimbare de filtru în UI declanșează un `Promise.all` pentru a sincroniza datele de bază și cele de statistici.
- **Robust Exporting**: Toate funcțiile de export primesc datele ca argumente explicite pentru a asigura consistența între vizualizarea curentă și fișierul generat.
- **Unicode Support**: Exportul PDF folosește fonturi embedate pentru a reda corect diacriticele românești (ș, ț, ă, î, â).

## Building and Running

1.  **Lansarea aplicației**:
    ```bash
    docker-compose up --build
    ```
2.  **Acces Dashboard**: [http://localhost:3000](http://localhost:3000)
3.  **Acces API**: [http://localhost:8080](http://localhost:8080)
