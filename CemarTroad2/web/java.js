// ==========================================
// 1. ZMIENNE GLOBALNE I ZABEZPIECZENIA DOM
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const machineId = urlParams.get('id') || 'E59008';
const machineType = urlParams.get('type') || 'City';

// Bezpieczne ustawianie tekstu
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// Bezpieczne ustawianie wartości pól formularzy
function safeSetValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// Bezpieczne ukrywanie elementów
function safeHide(selector) {
    const el = document.querySelector(selector);
    if (el) el.style.display = 'none';
}

// ==========================================
// 2. GLÓWNA INICJALIZACJA PO ZAŁADOWANIU STRONY
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    // Podstawowe dane maszyn
    safeSetText('p2-machine-number', machineId);
    safeSetText('p2-machine-type', machineType);
    safeSetText('p3-machine-number', machineId);
    safeSetText('p3-machine-type', machineType);
    safeSetText('p5-machine-number', machineId);
    safeSetText('p5-machine-type', machineType);

    if (machineId === 'E62441') {
        safeSetText('p3-distance', '31.2 km');
        safeSetText('p3-fuel', '9.8 l/h');
        safeSetText('p2-prod-date', '28.02.2025');
        safeSetText('p2-hours', '890 mth');
        safeSetText('p2-next-service', '110 mth');
        safeSetText('p2-last-service', '12.03.2026');
        safeSetText('p5-assigned-user', "Marek Nowak (Operator)");
        safeSetText('p5-last-service', "12.03.2026");
        safeSetText('p5-total-hours', "890 mth");
        safeSetText('p5-remaining-hours', "110 mth");
    }

    // Dynamiczna nawigacja na podstawie roli
    const userRole = localStorage.getItem('userRole') || 'client';
    const homeUrl = userRole === 'client' ? 'client-list.html' : 'staff-list.html';
    const kontoUrl = userRole === 'client' ? 'konto-kilent.html' : 'konto-serwis.html';
    const detailsUrl = userRole === 'client' ? 'client-details.html' : 'staff-details.html';

    function safeSetHref(id, url) {
        const el = document.getElementById(id);
        if (el) el.href = url;
    }

    safeSetHref('nav-logo', homeUrl);
    safeSetHref('nav-home', homeUrl);
    safeSetHref('nav-konto', kontoUrl);

    if (userRole === 'client') {
        safeHide('.serwis');
        safeHide('.wycena');
    } else {
        safeHide('.ai');
        safeHide('.instrukcja');
        safeHide('.pomoc');
    }

    // Ustawianie dzisiejszej daty w formularzach
    const today = new Date().toISOString().split('T')[0];
    safeSetValue('form-date', today);

    // Inicjalizacje specyficznych podstron (wykonają się tylko jeśli elementy istnieją)
    initRouteMap();
    initTicketPage();
    initServiceForm();
    initValuationCalculator();

    // Inicjalizacja filtrów i logów
    updateFilterBadges();
    applyFilters();

    // Przycisk powrotu
    const p7BackBtn = document.getElementById('p7-back-btn');
    if (p7BackBtn) p7BackBtn.onclick = () => window.location.href = detailsUrl;

    const mainBackBtn = document.getElementById('back-btn');
    if (mainBackBtn) mainBackBtn.onclick = () => window.location.href = homeUrl;
});

// Globalna funkcja powrotu 
window.goBack = function () {
    const userRole = localStorage.getItem('userRole') || 'client';
    const detailsUrl = userRole === 'client' ? 'client-details.html' : 'staff-details.html';
    window.location.href = detailsUrl;
};

// ==========================================
// 3. STAFF DETAILS / LOGI / ROZWIJANIE WIERSZY
// ==========================================
const eventPageMap = {
    serwis: 'serwis-przeprowadzony.html',
    zgloszenie: 'zgloszenie-serwisowe.html',
    odpalenie: 'machine-logs.html',
};

const activeFilters = {
    serwis: true,
    zgloszenie: true,
    odpalenie: true,
    blad: true
};

window.goToTelemetry = function () {
    window.location.href = `machine-logs.html?id=${encodeURIComponent(machineId)}&type=${encodeURIComponent(machineType)}`;
};

window.goToService = function () {
    window.location.href = 'zglos-serwis.html';
};

window.goToEventPage = function (type, ref) {
    const page = eventPageMap[type];
    if (page) window.location.href = page;
};

window.togglePillFilter = function (category) {
    const pill = document.querySelector(`.filter-pill[data-filter="${category}"]`);
    activeFilters[category] = !activeFilters[category];

    if (pill) {
        pill.classList.toggle('active', activeFilters[category]);
    }
    applyFilters();
};

function applyFilters() {
    const rows = document.querySelectorAll('#p5-logs-tbody .log-row');
    rows.forEach(row => {
        const rowType = row.dataset.type;
        const detailsRow = row.nextElementSibling;

        if (!rowType || activeFilters[rowType]) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (detailsRow && detailsRow.classList.contains('log-details-row')) {
                detailsRow.style.display = 'none';
                const chevron = row.querySelector('.chevron-icon');
                if (chevron) chevron.classList.remove('rotated');
            }
        }
    });
}

window.toggleLogDetails = function (row) {
    const detailsRow = row.nextElementSibling;
    if (!detailsRow) return;

    const chevron = row.querySelector('.chevron-icon');
    const isOpening = detailsRow.style.display !== 'table-row';

    document.querySelectorAll('.log-details-row').forEach(item => {
        if (item !== detailsRow) {
            item.style.display = 'none';
            const otherRow = item.previousElementSibling;
            const otherChevron = otherRow ? otherRow.querySelector('.chevron-icon') : null;
            if (otherChevron) otherChevron.classList.remove('rotated');
        }
    });

    detailsRow.style.display = isOpening ? 'table-row' : 'none';
    if (chevron) chevron.classList.toggle('rotated', isOpening);
};

window.showLogDetails = function (detailsText) {
    if (typeof UIkit !== 'undefined') {
        UIkit.notification({
            message: `<span uk-icon='info' class='uk-margin-small-right'></span> ${detailsText}`,
            status: 'primary',
            pos: 'top-center',
            timeout: 3000
        });
    }
};

// ==========================================
// 4. INSTRUKCJE & BADGE'E
// ==========================================
let instrActiveCategory = 'wszystkie';
let instrActiveFormat = 'wszystkie';

window.setInstrCategory = function (el) {
    document.querySelectorAll('#instr-categories .instr-filter-pill').forEach(p => p.classList.remove('active', 'accented'));
    el.classList.add('active');
    if (el.getAttribute('data-cat') === 'wszystkie') el.classList.add('accented');
    instrActiveCategory = el.getAttribute('data-cat');
    filterInstructions();
};

window.setInstrFormat = function (el) {
    document.querySelectorAll('#instr-formats .instr-filter-pill').forEach(p => p.classList.remove('active', 'accented'));
    el.classList.add('active');
    if (el.getAttribute('data-format') === 'wszystkie') el.classList.add('accented');
    instrActiveFormat = el.getAttribute('data-format');
    filterInstructions();
};

function filterInstructions() {
    const searchInput = document.getElementById('instr-search');
    if (!searchInput) return;

    const query = searchInput.value.trim().toLowerCase();
    const items = document.querySelectorAll('.instr-item');
    let visibleCount = 0;

    items.forEach(item => {
        const matchesCategory = instrActiveCategory === 'wszystkie' || item.getAttribute('data-cat') === instrActiveCategory;
        const matchesFormat = instrActiveFormat === 'wszystkie' || item.getAttribute('data-format') === instrActiveFormat;
        const matchesQuery = !query || item.getAttribute('data-title').includes(query);

        const visible = matchesCategory && matchesFormat && matchesQuery;
        item.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    const emptyState = document.getElementById('instr-empty-state');
    const grid = document.getElementById('instr-grid');

    if (emptyState) emptyState.hidden = visibleCount !== 0;
    if (grid) {
        grid.style.display = visibleCount === 0 ? 'none' : '';
        if (visibleCount > 0 && typeof UIkit !== 'undefined') UIkit.grid(grid).update();
    }
}

function updateFilterBadges() {
    const items = document.querySelectorAll('.instr-item');
    const catCounts = { wszystkie: items.length, obsluga: 0, serwis: 0, bezpieczenstwo: 0, bledy: 0, instalacja: 0 };
    const fmtCounts = { wszystkie: items.length, pdf: 0, video: 0 };

    items.forEach(item => {
        const cat = item.getAttribute('data-cat');
        const fmt = item.getAttribute('data-format');
        if (catCounts[cat] !== undefined) catCounts[cat]++;
        if (fmtCounts[fmt] !== undefined) fmtCounts[fmt]++;
    });

    const counts = { serwis: 0, zgloszenie: 0, odpalenie: 0, blad: 0 };
    const rows = document.querySelectorAll('#p5-logs-tbody .log-row');

    rows.forEach(row => {
        const type = row.getAttribute('data-type');
        if (counts[type] !== undefined) counts[type]++;
    });

    for (const [cat, count] of Object.entries(catCounts)) safeSetText(`badge-cat-${cat}`, count);
    for (const [fmt, count] of Object.entries(fmtCounts)) safeSetText(`badge-fmt-${fmt}`, count);
    for (const [key, val] of Object.entries(counts)) safeSetText(`badge-${key}`, val);
}

// ==========================================
// 5. ZGŁOSZENIE SERWISOWE (P7 & P8)
// ==========================================
function initTicketPage() {
    if (!document.getElementById('p8-ticket-id')) return;

    const sampleTicket = {
        id: urlParams.get('ticket') || 'SRV-10423',
        createdAt: '15.07.2026 09:42',
        status: 'nowe',
        machineNumber: urlParams.get('id') || '434',
        machineType: urlParams.get('type') || 'City',
        reporterName: urlParams.get('reporter') || 'Jan Kowalski',
        reporterContact: urlParams.get('contact') || '+48 600 000 000',
        priority: urlParams.get('priority') || 'sredni',
        availability: urlParams.get('availability') || '18.07.2026',
        description: urlParams.get('description') || 'Maszyna wydaje nietypowy dźwięk podczas pracy pompy wtryskowej, spadek ciśnienia na zaworze głównym.',
        media: []
    };

    safeSetText('p8-ticket-id', `#${sampleTicket.id}`);
    safeSetText('p8-created-at', sampleTicket.createdAt);
    safeSetText('p8-machine-number', sampleTicket.machineNumber);
    safeSetText('p8-machine-type', sampleTicket.machineType);
    safeSetText('p8-reporter-name', sampleTicket.reporterName);
    safeSetText('p8-reporter-contact', sampleTicket.reporterContact);
    safeSetText('p8-availability', sampleTicket.availability);
    safeSetText('p8-description', sampleTicket.description);

    const statusBadge = document.getElementById('p8-status-badge');
    if (statusBadge) {
        const statusMap = { nowe: 'Nowe', trakcie: 'W trakcie', zakonczone: 'Zakończone' };
        statusBadge.innerText = statusMap[sampleTicket.status] || 'Nowe';
        statusBadge.className = `status-badge status-${sampleTicket.status}`;
    }

    const priorityBadge = document.getElementById('p8-priority-badge');
    if (priorityBadge) {
        const priorityMap = { niski: 'Niski', sredni: 'Średni', wysoki: 'Wysoki' };
        priorityBadge.innerText = priorityMap[sampleTicket.priority] || 'Średni';
        priorityBadge.className = `priority-badge priority-${sampleTicket.priority}`;
    }
}

function initServiceForm() {
    safeSetValue('p7-machine-number', machineId);
    safeSetValue('p7-machine-type', machineType);

    const dropzone = document.getElementById('p7-dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag-over'); });
    });
    dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
}

let attachedFiles = [];
function handleFiles(fileList) {
    Array.from(fileList).forEach(file => {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
        attachedFiles.push(file);
        renderPreview(file);
    });
}

function renderPreview(file) {
    const grid = document.getElementById('p7-media-preview');
    if (!grid) return;

    const item = document.createElement('div');
    item.className = 'media-preview-item';
    const url = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
        item.innerHTML = `<img src="${url}" alt="${file.name}">`;
    } else {
        item.innerHTML = `<video src="${url}" muted></video>`;
    }

    const filenameTag = document.createElement('div');
    filenameTag.className = 'media-filename';
    filenameTag.innerText = file.name;
    item.appendChild(filenameTag);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'media-remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = () => {
        attachedFiles = attachedFiles.filter(f => f !== file);
        item.remove();
        URL.revokeObjectURL(url);
    };
    item.appendChild(removeBtn);

    grid.appendChild(item);
}

window.handleSubmit = function (event) {
    event.preventDefault();
    if (typeof UIkit !== 'undefined') {
        UIkit.notification({
            message: `<span uk-icon='icon: check; ratio: 1' class='uk-margin-small-right'></span> Zgłoszenie serwisowe zostało przygotowane (${attachedFiles.length} zał.).`,
            status: 'success',
            pos: 'top-center',
            timeout: 4000
        });
    }
};

// ==========================================
// 6. WYCENA I KALKULATOR
// ==========================================
function initValuationCalculator() {
    if (!document.getElementById('machine-model')) return;
    toggleModelParts();
    calculateValuation();
}

window.toggleModelParts = function () {
    const modelEl = document.getElementById('machine-model');
    if (!modelEl) return;

    const model = modelEl.value;
    const diffT35 = document.getElementById('part-diffuser-t35');
    const diffCity24 = document.getElementById('part-diffuser-city-24');
    const diffCity30 = document.getElementById('part-diffuser-city-30');

    if (diffT35) diffT35.style.display = (model === 't35') ? 'flex' : 'none';
    if (diffCity24) diffCity24.style.display = (model === 't35') ? 'none' : 'flex';
    if (diffCity30) diffCity30.style.display = (model === 't35') ? 'none' : 'flex';

    filterParts();
    calculateValuation();
};

window.filterActivities = function () {
    const input = document.getElementById('activity-search');
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    const sections = document.querySelectorAll('#activities-container .activity-section');

    sections.forEach(section => {
        const items = section.querySelectorAll('.activity-item');
        let visibleCount = 0;

        items.forEach(item => {
            const name = item.querySelector('.activity-name').innerText.toLowerCase();
            const desc = item.querySelector('.activity-desc') ? item.querySelector('.activity-desc').innerText.toLowerCase() : '';

            if (name.includes(query) || desc.includes(query)) {
                item.style.setProperty('display', 'flex', 'important');
                visibleCount++;
            } else {
                item.style.setProperty('display', 'none', 'important');
            }
        });
        section.style.display = visibleCount === 0 ? 'none' : 'block';
    });
};

window.filterParts = function () {
    const input = document.getElementById('parts-search');
    if (!input) return;

    const query = input.value.toLowerCase().trim();
    const sections = document.querySelectorAll('#parts-container .part-section');
    const modelEl = document.getElementById('machine-model');
    const model = modelEl ? modelEl.value : '';

    sections.forEach(section => {
        const items = section.querySelectorAll('.part-item');
        let visibleCount = 0;

        items.forEach(item => {
            const code = item.querySelector('.part-code') ? item.querySelector('.part-code').innerText.toLowerCase() : '';
            const name = item.querySelector('.part-name') ? item.querySelector('.part-name').innerText.toLowerCase() : '';

            if (code.includes(query) || name.includes(query)) {
                if (item.id && item.id.startsWith('part-diffuser-')) {
                    if (model === 't35' && (item.id === 'part-diffuser-city-24' || item.id === 'part-diffuser-city-30')) {
                        item.style.setProperty('display', 'none', 'important');
                        return;
                    }
                    if (model === 'city' && item.id === 'part-diffuser-t35') {
                        item.style.setProperty('display', 'none', 'important');
                        return;
                    }
                }
                item.style.setProperty('display', 'flex', 'important');
                visibleCount++;
            } else {
                item.style.setProperty('display', 'none', 'important');
            }
        });
        section.style.display = visibleCount === 0 ? 'none' : 'block';
    });
};

window.calculateValuation = function () {
    let totalMinutes = 0;
    const activities = document.querySelectorAll('input[type="checkbox"][data-time]');

    activities.forEach(checkbox => {
        if (checkbox.checked) {
            totalMinutes += parseInt(checkbox.getAttribute('data-time'));
        }
    });

    const workHours = (totalMinutes / 60).toFixed(2);
    safeSetText('summary-work-time', `${totalMinutes} min (${workHours} godz.)`);

    const baselineCheckbox = document.getElementById('base-service-baseline');
    if (baselineCheckbox && baselineCheckbox.checked) {
        totalMinutes += 480;
    }

    const finalHours = (totalMinutes / 60).toFixed(2);
    safeSetText('summary-total-time', `${finalHours} godz.`);

    const partsListContainer = document.getElementById('summary-parts-list');
    if (!partsListContainer) return;

    partsListContainer.innerHTML = '';
    let checkedPartsCount = 0;

    document.querySelectorAll('.part-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
            const parent = checkbox.closest('[id^="part-diffuser-"]');
            if (parent && parent.style.display === 'none') return;

            checkedPartsCount++;
            const code = checkbox.getAttribute('data-code');
            const name = checkbox.getAttribute('data-name');

            const optionSelect = checkbox.closest('.part-item').querySelector('.part-option');
            const optionVal = optionSelect ? optionSelect.value : 'W';

            let statusLabel = '';
            if (optionVal === 'W') statusLabel = '<span class="text-red-400 font-bold ml-1">[Wymagane]</span>';
            if (optionVal === 'O') statusLabel = '<span class="text-amber-400 font-bold ml-1">[Opcjonalne]</span>';

            const li = document.createElement('div');
            li.innerHTML = `• <span class="font-mono text-amber-500">${code}</span> ${name} ${statusLabel}`;
            partsListContainer.appendChild(li);
        }
    });

    if (checkedPartsCount === 0) {
        partsListContainer.innerHTML = 'Brak wybranych części.';
    }
};

window.generateReportText = function () {
    const modelSelect = document.getElementById('machine-model');
    if (!modelSelect) return;

    const modelName = modelSelect.options[modelSelect.selectedIndex].text;
    const machineNum = document.getElementById('form-machine-num')?.value || '---';
    const client = document.getElementById('form-client')?.value || '---';
    const hours = document.getElementById('form-hours')?.value || '---';
    const technician = document.getElementById('form-technician')?.value || '---';
    const date = document.getElementById('form-date')?.value || '---';
    const notes = document.getElementById('technician-notes')?.value || 'Brak dodatkowych uwag.';

    let selectedActivities = [];
    document.querySelectorAll('input[type="checkbox"][data-time]').forEach(cb => {
        if (cb.checked) {
            selectedActivities.push(`- ${cb.getAttribute('data-name')} (${cb.getAttribute('data-time')} min)`);
        }
    });

    let selectedParts = [];
    document.querySelectorAll('.part-checkbox').forEach(cb => {
        if (cb.checked) {
            const parent = cb.closest('[id^="part-diffuser-"]');
            if (parent && parent.style.display === 'none') return;
            const optionSelect = cb.closest('.part-item')?.querySelector('.part-option');
            const optionVal = optionSelect ? optionSelect.value : 'W';
            selectedParts.push(`- [${cb.getAttribute('data-code')}] ${cb.getAttribute('data-name')} (Opcja: ${optionVal})`);
        }
    });

    const includeBaseline = document.getElementById('base-service-baseline')?.checked;
    const finalTime = document.getElementById('summary-total-time')?.innerText || '0.00 godz.';

    let report = `=======================================\n`;
    report += `    WYCENA SERWISOWA CEMAR\n`;
    report += `=======================================\n`;
    report += `Model: ${modelName}\n`;
    report += `Nr Maszyny: ${machineNum}\n`;
    report += `Klient: ${client}\n`;
    report += `Roboczogodziny: ${hours} mth\n`;
    report += `Sporządził: ${technician}\n`;
    report += `Data: ${date}\n`;
    report += `---------------------------------------\n`;
    report += `WYBRANE CZYNNOŚCI SERWISOWE:\n`;
    report += selectedActivities.length > 0 ? selectedActivities.join('\n') + '\n' : 'Brak wybranych czynności\n';
    report += `---------------------------------------\n`;
    report += `WYBRANE CZĘŚCI ZAMIENNE:\n`;
    report += selectedParts.length > 0 ? selectedParts.join('\n') + '\n' : 'Brak wybranych części\n';
    report += `---------------------------------------\n`;
    report += `Baseline +8h (testy/pakowanie): ${includeBaseline ? 'TAK' : 'NIE'}\n`;
    report += `CAŁKOWITY CZAS PRACY: ${finalTime}\n`;
    report += `---------------------------------------\n`;
    report += `UWAGI SERWISANTA:\n`;
    report += `${notes}\n`;
    report += `=======================================`;

    const textarea = document.createElement('textarea');
    textarea.value = report;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        if (typeof UIkit !== 'undefined') {
            UIkit.notification({ message: "<span uk-icon='check'></span> Raport wyceny skopiowany do schowka!", status: 'success', pos: 'top-center', timeout: 3000 });
        }
    } catch (err) {
        if (typeof UIkit !== 'undefined') {
            UIkit.notification({ message: "<span uk-icon='close'></span> Błąd zapisu do schowka.", status: 'danger', pos: 'top-center' });
        }
    }
    document.body.removeChild(textarea);
};

window.clearAllForm = function () {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    const baseline = document.getElementById('base-service-baseline');
    if (baseline) baseline.checked = true;

    safeSetValue('form-machine-num', '');
    safeSetValue('form-client', '');
    safeSetValue('form-hours', '');
    safeSetValue('technician-notes', '');
    safeSetValue('activity-search', '');
    safeSetValue('parts-search', '');

    filterActivities();
    filterParts();
    calculateValuation();

    if (typeof UIkit !== 'undefined') {
        UIkit.notification({ message: "Kalkulator został wyczyszczony.", status: 'primary', pos: 'bottom-center' });
    }
};

// ==========================================
// 7. INNE POMOCNICZE FUNKCJE STRON
// ==========================================
function initRouteMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    const mapCenter = [51.107885, 17.038538];
    window.cemarMap = L.map('map').setView(mapCenter, 14);
    const map = window.cemarMap;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { crossOrigin: true }).addTo(map);

    const waypointIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#dca31a; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);'></div>",
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    const routeCoordinates = [
        [51.111, 17.030],
        [51.109, 17.034],
        [51.107, 17.036],
        [51.104, 17.042]
    ];

    const polyline = L.polyline(routeCoordinates, { color: '#dca31a', weight: 5 }).addTo(map);
    routeCoordinates.forEach(coord => L.marker(coord, { icon: waypointIcon }).addTo(map));
    map.fitBounds(polyline.getBounds());
}

function download() {
    const btn = document.getElementById('btn-download-report');
    if (btn) btn.style.visibility = 'hidden';

    UIkit.notification({ message: 'Generowanie PDF...', status: 'primary', pos: 'top-center' });

    const mapDiv = document.getElementById('map');

    function generatePdf() {
        setTimeout(() => {
            var element = document.getElementById('element-to-print');
            var opt = {
                margin: 10,
                filename: `raport-gps-${machineId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                const snap = document.getElementById('map-snapshot');
                if (snap) snap.remove();
                mapDiv.style.display = '';
                if (btn) btn.style.visibility = 'visible';
            }).catch(err => {
                console.error('Błąd html2pdf:', err);
                const snap = document.getElementById('map-snapshot');
                if (snap) snap.remove();
                mapDiv.style.display = '';
                if (btn) btn.style.visibility = 'visible';
                UIkit.notification({ message: 'Błąd generowania PDF.', status: 'danger', pos: 'top-center' });
            });
        }, 300);
    }

    try {
        leafletImage(window.cemarMap, function (err, canvas) {
            if (err) {
                console.error('leafletImage error:', err);
                generatePdf(); // generujemy PDF mimo błędu mapy
                return;
            }

            try {
                const dataUrl = canvas.toDataURL(); // to jest miejsce gdzie zwykle wywala SecurityError

                const img = new Image();
                img.src = dataUrl;
                img.id = 'map-snapshot';
                img.style.width = '100%';
                img.style.height = mapDiv.offsetHeight + 'px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';

                mapDiv.style.display = 'none';
                mapDiv.parentNode.insertBefore(img, mapDiv);

            } catch (canvasErr) {
                console.error('Canvas tainted, nie można pobrać obrazu mapy:', canvasErr);
                // mapa zostaje ukryta, PDF generuje się bez niej
            }

            generatePdf();
        });
    } catch (outerErr) {
        console.error('Błąd ogólny leafletImage:', outerErr);
        generatePdf();
    }
}
function onRangeChange() {
    UIkit.notification({
        message: '<span uk-icon=\'refresh\'></span> Aktualizowanie trasy GPS dla wybranego okresu...',
        status: 'primary',
        pos: 'bottom-right',
        timeout: 2000
    });
}

window.goToDetails = function (num, type) {
    window.location.href = `client-details.html?id=${encodeURIComponent(num)}&type=${encodeURIComponent(type)}`;
};

window.goToReport = function (num, type) {
    window.location.href = `client-report.html?id=${encodeURIComponent(num)}&type=${encodeURIComponent(type)}`;
};

window.goToDiagnostics = function (num, type) {
    window.location.href = `staff-details.html?id=${encodeURIComponent(num)}&type=${encodeURIComponent(type)}`;
};

window.showPlaceholder = function (title) {
    if (typeof UIkit !== 'undefined') {
        UIkit.modal.dialog(`<div class="uk-modal-body"><h2 class="uk-text-bold">System CEMAR</h2><p>${title}</p></div>`);
    }
};

window.showContact = function () {
    if (typeof UIkit !== 'undefined') {
        UIkit.modal.dialog(`<div class="uk-modal-body"><h2 class="uk-text-bold">Kontakt Serwis</h2><p>Infolinia pilna: +48 123 456 789. Formularz zgłoszeniowy został aktywowany.</p></div>`);
    }
};