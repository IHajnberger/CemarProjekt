// ==========================================
// 1. ZMIENNE GLOBALNE I ZABEZPIECZENIA DOM
// ==========================================
let serviceStarted = false;
let startTime = null;
let timerInterval = null;
let activePhotos = [];
let currentSortColumn = '';

const urlParams = new URLSearchParams(window.location.search);
const machineId = urlParams.get('id') || 'E59008' || '434';
const machineType = urlParams.get('type') || 'City';
const dropZone = document.getElementById('drop-zone');

// Logi maszyny:
const columnGroups = {
    power: false,    // AC Volt, Power Setpoint
    turbine: false,  // Out temp
    oil: false,      // Oil Temp, Oil Lvl, Oil Pump PWM
    fuel: false,     // Fuel Pump PWM
    starter: false   // Starter PWM
};

const expandedStages = {};
const expandedPhases = {};

// Domyślny zestaw wycen na przypadek czystej pamięci przeglądarki
const defaultWyceny = [
    {
        id: "w1",
        model: "t35",
        machineNum: "E59008",
        client: "P.H.U. Bud-Max",
        hours: "1420",
        technician: "Marek Nowak",
        date: "2026-07-15",
        activities: ["Czyszczenie skorupy", "Czyszczenie turbiny"],
        parts: ["8250", "4511"],
        notes: "Zalecana czujność przy turbinie, widoczne mikropęknięcia."
    },
    {
        id: "w2",
        model: "city",
        machineNum: "C77212",
        client: "Trans-Met Sp. z o.o.",
        hours: "890",
        technician: "Jan Kowalski",
        date: "2026-07-17",
        activities: ["Mycie boxa", "Wymiana filtra paliwa", "Wymiana dyfuzora"],
        parts: ["7601", "1240"],
        notes: "Wymiana płynów w boxie oraz kompletnego wkładu filtra."
    }
];

// Bezpieczne ustawianie tekstu
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// Bezpieczne ustawianie wartości pól formularzy (z obsługą <select>)
function safeSetValue(id, val) {
    const el = document.getElementById(id);
    if (!el) return;

    el.value = val;

    if (el.tagName === 'SELECT' && el.value !== String(val)) {
        const valLower = String(val).toLowerCase().trim();
        for (let i = 0; i < el.options.length; i++) {
            const opt = el.options[i];
            if (opt.value.toLowerCase().trim() === valLower || opt.text.toLowerCase().trim() === valLower) {
                el.selectedIndex = i;
                break;
            }
        }
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

// Bezpieczne ukrywanie elementów
function safeHide(selector) {
    const el = document.querySelector(selector);
    if (el) el.style.display = 'none';
}

// ==========================================
// 2. GŁÓWNA INICJALIZACJA PO ZAŁADOWANIU STRONY
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    // Inicjalizacja listy wycen w dropdownie
    initSavedMachinesSelect();

    // Podstawowe dane maszyn na podstronach
    safeSetText('p2-machine-number', machineId);
    safeSetText('p2-machine-type', machineType);
    safeSetText('p3-machine-number', machineId);
    safeSetText('p3-machine-type', machineType);
    safeSetText('p5-machine-number', machineId);
    safeSetText('p5-machine-type', machineType);
    safeSetText('p6-machine-number', machineId);
    safeSetText('p6-machine-type', machineType); 
    
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

    // Używamy 'let', aby móc modyfikować wartości w zależności od roli
    let homeUrl = '#';
    let kontoUrl = '#';
    let detailsUrl = '#';

    // Pomocnicza funkcja do ustawiania href
    function safeSetHref(id, url) {
        const el = document.getElementById(id);
        if (el) el.href = url;
    }

    
    // Logika przypisania adresów i widoczności na podstawie roli
    switch (userRole) {
        case 'client':
            detailsUrl = 'client-details.html';
            homeUrl = 'client-list.html';
            kontoUrl = 'konto-kilent.html'; 
            safeHide('.serwis');
            safeHide('.wycena');
            safeHide('.przypisania');
            break;

        case 'staff':
            detailsUrl = 'staff-details.html';
            homeUrl = 'staff-list.html';
            kontoUrl = 'konto-serwis.html';
            safeHide('.ai');
            safeHide('.instrukcja');
            safeHide('.pomoc');
            safeHide('.rental');
            safeHide('.przypisania');
            break;

        case 'staff0':
            detailsUrl = 'staff-details.html';
            homeUrl = 'staff-list.html';
            kontoUrl = 'konto-serwis.html';
            safeHide('.ai');
            safeHide('.instrukcja');
            safeHide('.pomoc');
            safeHide('.rental');
            safeHide('.przypisania');
            break;

        case 'caregiver':
            detailsUrl = 'staff-details.html';
            homeUrl = 'caregiver-menu.html';
            kontoUrl = 'konto-caregiver.html';
            safeHide('.ai');
            safeHide('.instrukcja');
            safeHide('.pomoc');
            safeHide('.serwis');
            safeHide('.zglos-serwis');
            safeHide('.nowe-zlecenie');
            safeHide('.admincard');
            safeHide('.userNrole');
            break;

        case 'distributor':
            detailsUrl = 'distributor-details.html';
            homeUrl = 'distributor-list.html';
            kontoUrl = 'konto-distributor.html';
            safeHide('.ai');
            safeHide('.instrukcja');
            safeHide('.pomoc');
            safeHide('.serwis');
            safeHide('.wycena');
            break;

        case 'admin':
            detailsUrl = 'admin-details.html';
            homeUrl = 'admin-home.html';
            kontoUrl = 'konto-admin.html';
            safeHide('.ai');
            safeHide('.instrukcja');
            safeHide('.pomoc');
            safeHide('.serwis');
            safeHide('.wycena');
            safeHide('.rental');
            break;

        default:
            // Domyślne wartości w przypadku nieznanej roli
            detailsUrl = 'client-details.html';
            homeUrl = 'client-list.html';
            kontoUrl = 'konto-klient.html';
            break;
    }
    // Guziki od powrotów
    window.goBack = function () {
        window.location.href = detailsUrl;
    };
    window.goBackMenu = function () {
        window.location.href = homeUrl;
    }

    // Przypisanie adresów do elementów w HTML dopieropo po ich ustaleniu w switch()
    safeSetHref('nav-logo', homeUrl);
    safeSetHref('nav-home', homeUrl);
    safeSetHref('nav-konto', kontoUrl);


    // Jeśli używasz detailsUrl w jakimś przycisku w HTML, możesz też ustawić go tak:
    safeSetHref('nav-details', detailsUrl);

    // AUTOMATYCZNE WYWOŁANIE RENDEROWANIA DANYCH RAPORTU (SERWIS ZAKOŃCZONY)
    if (document.getElementById('sum-model') || document.getElementById('sum-num')) {
        renderServiceReport();
    }

    const finishBtn = document.getElementById('btn-finish-service');
    if (finishBtn) {
        finishBtn.addEventListener('click', function (e) {
            e.preventDefault();
            finishService();
        });
    }

    // Ustawienie dzisiejszej daty w formularzu
    const today = new Date().toISOString().split('T')[0];
    safeSetValue('form-date', today);

    // Inicjalizacja poszczególnych modułów
    if (typeof initRouteMap === 'function') initRouteMap();
    if (typeof initTicketPage === 'function') initTicketPage();
    if (typeof initServiceForm === 'function') initServiceForm();
    if (typeof initValuationCalculator === 'function') initValuationCalculator();
    if (typeof updateFilterBadges === 'function') updateFilterBadges();
    if (typeof applyFilters === 'function') applyFilters();
    if (typeof scrollAiChatToBottom === 'function') scrollAiChatToBottom();

    const p7BackBtn = document.getElementById('p7-back-btn');
    if (p7BackBtn) p7BackBtn.onclick = () => window.location.href = detailsUrl;

    const mainBackBtn = document.getElementById('back-btn');
    if (mainBackBtn) mainBackBtn.onclick = () => window.location.href = homeUrl;

    renderTable();
});

// ==========================================
// 3. STAFF DETAILS / LOGI / ROZWIJANIE WIERSZY
// ==========================================
const eventPageMap = {
    serwis: 'serwis-przeprowadzony.html',
    zgloszenie: 'zgloszenie-serwisowe.html',
    odpalenie: 'machine-logs.html',
};

// staff-list:
function openSortPanel(columnKey, columnName) {
    currentSortColumn = columnKey;
    document.getElementById('sort-column-label').innerText = columnName;
    document.getElementById('sort-panel').style.display = 'block';
}

function closeSortPanel() {
    document.getElementById('sort-panel').style.display = 'none';
    currentSortColumn = '';
}

const activeFilters = {
    serwis: true,
    zgloszenie: true,
    odpalenie: true,
    blad: true
};

function sortData(order) {
    if (!currentSortColumn) return;

    const tbody = document.querySelector('#devices-table tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        let valA = a.getAttribute(`data-${currentSortColumn}`) || '';
        let valB = b.getAttribute(`data-${currentSortColumn}`) || '';

        // 1. Obsługa sortowania dat (format YYYY-MM-DD)
        if (currentSortColumn === 'date') {
            let dateA = new Date(valA).getTime() || 0;
            let dateB = new Date(valB).getTime() || 0;
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // 2. Walidacja czy pełna wartość jest liczbą (zapobiega ucinaniu tekstów przez parseFloat)
        let cleanA = valA.replace(/\s+/g, '');
        let cleanB = valB.replace(/\s+/g, '');
        let isNumA = /^-?\d+(\.\d+)?$/.test(cleanA);
        let isNumB = /^-?\d+(\.\d+)?$/.test(cleanB);

        if (isNumA && isNumB) {
            let numA = parseFloat(cleanA);
            let numB = parseFloat(cleanB);
            return order === 'asc' ? numA - numB : numB - numA;
        } else {
            return order === 'asc'
                ? valA.localeCompare(valB, 'pl', { numeric: true })
                : valB.localeCompare(valA, 'pl', { numeric: true });
        }
    });

    // Ponowne wstawienie posortowanych wierszy do tabeli
    rows.forEach(row => tbody.appendChild(row));
}
// SPEECH-TO-TEXT (DYKTOWANIE NOTATKI)
let speechRecognition = null;
let isRecording = false;

function toggleSpeechToText() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        if (typeof UIkit !== 'undefined') {
            UIkit.notification({ message: 'Twoja przeglądarka nie obsługuje rozpoznawania mowy.', status: 'danger', pos: 'top-center' });
        } else {
            alert('Przeglądarka nie obsługuje rozpoznawania mowy.');
        }
        return;
    }

    if (isRecording) {
        stopSpeechToText();
        return;
    }

    if (!speechRecognition) {
        speechRecognition = new SpeechRecognition();
        speechRecognition.lang = 'pl-PL';
        speechRecognition.continuous = true;
        speechRecognition.interimResults = false;

        speechRecognition.onstart = function () {
            isRecording = true;
            updateMicButtonUI(true);
            // Wywalone powiadomienie informacyjne - brak popupu
        };

        speechRecognition.onresult = function (event) {
            const textarea = document.getElementById('technician-notes');
            if (!textarea) return;

            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript;
                }
            }

            if (transcript.trim().length > 0) {
                const currentText = textarea.value;
                const needsSpace = currentText.length > 0 && !currentText.endsWith(' ') && !currentText.endsWith('\n');
                textarea.value = currentText + (needsSpace ? ' ' : '') + transcript.trim();
            }
        };

        speechRecognition.onerror = function (event) {
            console.error('Błąd Speech-to-Text:', event.error);
            stopSpeechToText();
            // Powiadomienie tylko w przypadku błędu
            if (typeof UIkit !== 'undefined') {
                UIkit.notification({ message: 'Błąd mikrofonu lub brak uprawnień.', status: 'danger', pos: 'top-center' });
            }
        };

        speechRecognition.onend = function () {
            stopSpeechToText();
        };
    }

    try {
        speechRecognition.start();
    } catch (err) {
        console.error('Nie udało się uruchomić nagrywania:', err);
    }
}

function stopSpeechToText() {
    if (speechRecognition && isRecording) {
        speechRecognition.stop();
    }
    isRecording = false;
    updateMicButtonUI(false);
}

function updateMicButtonUI(active) {
    const btn = document.getElementById('mic-btn');
    if (!btn) return;

    const newTitle = active ? 'Nagrywam... (Kliknij, aby zatrzymać)' : 'Dyktuj uwagi';

    if (active) {
        btn.style.backgroundColor = '#ef4444'; // Czerwony kolor gdy nagrywa
    } else {
        btn.style.backgroundColor = '#E59008'; // Domyślny pomarańczowy Cemar
    }

    // Ustawienie nowego atrybutu title
    btn.setAttribute('title', newTitle);

    // Przebudowanie tooltipa UIkit, aby odczytał nowy tekst
    if (typeof UIkit !== 'undefined') {
        const tooltipInstance = UIkit.tooltip(btn);
        if (tooltipInstance) {
            tooltipInstance.$destroy(); // Usunięcie starego tooltipa z pamięci UIkit
        }
        UIkit.tooltip(btn); // Utworzenie nowego z aktualnym tekstem
    }
}

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

// ==========================================
// 6. WYCENA I KALKULATOR
// ==========================================
function savePricing() {
    // jeszcze nwm co tu
}
function initValuationCalculator() {
    if (!document.getElementById('machine-model')) return;
    toggleModelParts();
    calculateValuation();
}

window.toggleModelParts = function () {
    const modelEl = document.getElementById('machine-model');
    if (!modelEl) return;

    const model = modelEl.value.toLowerCase();
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
            const name = item.querySelector('.activity-name')?.innerText.toLowerCase() || '';
            const desc = item.querySelector('.activity-desc')?.innerText.toLowerCase() || '';

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
    const query = input ? input.value.toLowerCase().trim() : '';
    const sections = document.querySelectorAll('#parts-container .part-section');
    const modelEl = document.getElementById('machine-model');
    const model = modelEl ? modelEl.value.toLowerCase() : '';

    sections.forEach(section => {
        const items = section.querySelectorAll('.part-item');
        let visibleCount = 0;

        items.forEach(item => {
            const code = item.querySelector('.part-code')?.innerText.toLowerCase() || '';
            const name = item.querySelector('.part-name')?.innerText.toLowerCase() || '';

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
            totalMinutes += parseInt(checkbox.getAttribute('data-time') || '0', 10);
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

            const optionSelect = checkbox.closest('.part-item')?.querySelector('.part-option');
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

// ==========================================
// 7. POBIERANIE I WYPEŁNIANIE DANYCH RAPORTU
// ==========================================
function getReportDataFromStorage() {
    const saved = localStorage.getItem('cemar_active_summary');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
}

window.renderServiceReport = function (dataOverride = null) {
    let data = dataOverride || getReportDataFromStorage();

    // FALLBACK: Jeśli w cemar_active_summary nic nie ma, wczytaj domyślną wycenę z localStorage
    if (!data) {
        try {
            const wyceny = JSON.parse(localStorage.getItem('cemar_wyceny') || '[]');
            if (wyceny.length > 0) {
                const first = wyceny[0];
                data = {
                    duration: '01:45:00',
                    model: first.model || 'City',
                    machineNum: first.machineNum || 'E59008',
                    client: first.client || 'P.H.U. Bud-Max',
                    hours: first.hours || '1420',
                    technician: first.technician || 'Marek Nowak',
                    date: first.date || '2026-07-15',
                    notes: first.notes || 'Brak uwag.',
                    activities: first.activities || [],
                    parts: first.parts || [],
                    photos: []
                };
            }
        } catch (e) {
            console.error("Błąd odczytu wycen fallback:", e);
        }
    }

    if (!data) return;

    // Wypełnianie pól w HTML
    safeSetText('sum-duration', data.duration || '00:00:00');
    safeSetText('sum-model', (data.model || '---').toUpperCase());
    safeSetText('sum-num', data.machineNum || '---');
    safeSetText('sum-client', data.client || '---');
    safeSetText('sum-hours', data.hours ? `${data.hours} mth` : '--- mth');
    safeSetText('sum-tech', data.technician || '---');
    safeSetText('sum-date', data.date || '---');
    safeSetText('sum-notes', data.notes || 'Brak dodatkowych uwag.');

    // Wykonane procedury
    const activitiesUl = document.getElementById('sum-activities');
    if (activitiesUl) {
        activitiesUl.innerHTML = '';
        if (data.activities && data.activities.length > 0) {
            data.activities.forEach(act => {
                const li = document.createElement('li');
                li.textContent = act;
                activitiesUl.appendChild(li);
            });
        } else {
            activitiesUl.innerHTML = '<li class="text-gray-400 italic">Brak zaznaczonych procedur</li>';
        }
    }

    // Wykorzystane części
    const partsUl = document.getElementById('sum-parts');
    if (partsUl) {
        partsUl.innerHTML = '';
        if (data.parts && data.parts.length > 0) {
            data.parts.forEach(part => {
                const li = document.createElement('li');
                li.className = 'flex items-center space-x-2';

                let partText = '';
                if (typeof part === 'object' && part !== null) {
                    partText = part.code ? `[${part.code}] ${part.name}` : (part.name || 'Część zamienna');
                } else {
                    partText = String(part);
                }

                li.innerHTML = `<span class="text-amber-500 font-bold">•</span> <span>${partText}</span>`;
                partsUl.appendChild(li);
            });
        } else {
            partsUl.innerHTML = '<li class="text-gray-400 italic">Nie zużyto żadnych części</li>';
        }
    }

    // Zdjęcia
    const photosContainer = document.getElementById('sum-photos-container');
    const photosGrid = document.getElementById('sum-photos');
    if (photosContainer && photosGrid) {
        photosGrid.innerHTML = '';
        if (data.photos && data.photos.length > 0) {
            photosContainer.classList.remove('hidden');
            data.photos.forEach(photoSrc => {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'relative rounded-lg overflow-hidden border border-gray-200 h-28 bg-gray-100';
                imgDiv.innerHTML = `<img src="${photoSrc}" class="w-full h-full object-cover cursor-pointer" onclick="openPhotoLightbox('${photoSrc}')" alt="Dokumentacja serwisowa">`;
                photosGrid.appendChild(imgDiv);
            });
        } else {
            photosContainer.classList.add('hidden');
        }
    }
};

// INICJALIZACJA LISTY ROZWIJANEJ W FORMULARZU
function initSavedMachinesSelect() {
    const selectEl = document.getElementById('select-saved-machine');
    if (!selectEl) return;

    let savedWyceny = localStorage.getItem('cemar_wyceny');
    if (!savedWyceny) {
        localStorage.setItem('cemar_wyceny', JSON.stringify(defaultWyceny));
        savedWyceny = JSON.stringify(defaultWyceny);
    }

    let wyceny = [];
    try { wyceny = JSON.parse(savedWyceny); } catch (e) { wyceny = defaultWyceny; }

    selectEl.innerHTML = '<option value="" disabled selected>-- Wybierz zlecenie z Wyceny --</option>';

    wyceny.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.machineNum || 'Brak NR'} - ${item.client || 'Klient'} (${(item.model || '').toUpperCase()})`;
        selectEl.appendChild(opt);
    });

    selectEl.onchange = window.loadSelectedMachine;
}

// ŁADOWANIE DANYCH Z WYCENY DO FORMULARZA
window.loadSelectedMachine = function () {
    const selectEl = document.getElementById('select-saved-machine');
    if (!selectEl || !selectEl.value) return;

    let wyceny = [];
    try { wyceny = JSON.parse(localStorage.getItem('cemar_wyceny') || '[]'); } catch (e) { wyceny = defaultWyceny; }

    let selected = wyceny.find(x => String(x.id) === String(selectEl.value));
    if (!selected && typeof defaultWyceny !== 'undefined') {
        selected = defaultWyceny.find(x => String(x.id) === String(selectEl.value));
    }

    if (!selected) return;

    if (selected.model) safeSetValue('machine-model', selected.model);
    if (selected.machineNum) safeSetValue('form-machine-num', selected.machineNum);
    if (selected.client) safeSetValue('form-client', selected.client);
    if (selected.hours) safeSetValue('form-hours', selected.hours);
    if (selected.technician) safeSetValue('form-technician', selected.technician);
    if (selected.date) safeSetValue('form-date', selected.date);
    if (selected.notes) safeSetValue('technician-notes', selected.notes);

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

    if (Array.isArray(selected.activities)) {
        selected.activities.forEach(actName => {
            if (!actName) return;
            const actLower = String(actName).toLowerCase().trim();

            document.querySelectorAll('#activities-container input[type="checkbox"], input[data-time]').forEach(checkbox => {
                const dataName = (checkbox.getAttribute('data-name') || '').toLowerCase().trim();
                const val = (checkbox.value || '').toLowerCase().trim();
                const parentLabel = (checkbox.closest('label')?.innerText || checkbox.parentElement?.innerText || '').toLowerCase().trim();

                if ((dataName && dataName.includes(actLower)) ||
                    (val && val.includes(actLower)) ||
                    (parentLabel && parentLabel.includes(actLower))) {
                    checkbox.checked = true;
                }
            });
        });
    }

    if (Array.isArray(selected.parts)) {
        selected.parts.forEach(part => {
            if (!part) return;
            const partCode = ((typeof part === 'object' && part !== null) ? part.code : String(part)).toLowerCase().trim();
            const partName = ((typeof part === 'object' && part !== null) ? part.name : '').toLowerCase().trim();

            document.querySelectorAll('.part-checkbox, #parts-container input[type="checkbox"]').forEach(checkbox => {
                const code = (checkbox.getAttribute('data-code') || '').toLowerCase().trim();
                const val = (checkbox.value || '').toLowerCase().trim();
                const name = (checkbox.getAttribute('data-name') || '').toLowerCase().trim();
                const parentText = (checkbox.closest('.part-item')?.innerText || checkbox.parentElement?.innerText || '').toLowerCase().trim();

                if ((code && code === partCode) ||
                    (val && val === partCode) ||
                    (name && partName && name.includes(partName)) ||
                    (partCode && parentText.includes(partCode))) {
                    checkbox.checked = true;
                }
            });
        });
    }

    if (typeof toggleModelParts === 'function') toggleModelParts();
    if (typeof calculateValuation === 'function') calculateValuation();

    if (typeof UIkit !== 'undefined') {
        UIkit.notification({
            message: `<span uk-icon='icon: check'></span> Wczytano dane dla: <b>${selected.machineNum}</b>`,
            status: 'success',
            pos: 'top-center',
            timeout: 2500
        });
    }
};

// ==========================================
// 8. AI ASYSTENT
// ==========================================
function fillAiInput(text) {
    const input = document.getElementById('ai-input');
    if (!input) return;
    input.value = text;
    input.focus();
}

function handleAiKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAiMessage(e);
    }
}

function scrollAiChatToBottom() {
    const scrollEl = document.getElementById('ai-chat-scroll');
    if (!scrollEl) return;
    scrollEl.scrollTop = scrollEl.scrollHeight;
}

function currentTime() {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function sendAiMessage(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('ai-input');
    if (!input) return false;
    const text = input.value.trim();
    if (!text) return false;

    const scrollEl = document.getElementById('ai-chat-scroll');
    if (!scrollEl) return false;

    const userRow = document.createElement('div');
    userRow.className = 'ai-msg-row user';
    userRow.innerHTML = `
                        <div>
                        <div class="ai-bubble"></div>
                        <div class="ai-msg-meta uk-text-right">Ty · ${currentTime()}</div>
                        </div>
                        <div class="ai-avatar user">TY</div>`;
    userRow.querySelector('.ai-bubble').innerText = text;
    scrollEl.appendChild(userRow);

    input.value = '';
    scrollAiChatToBottom();

    const typingRow = document.createElement('div');
    typingRow.className = 'ai-msg-row bot';
    typingRow.id = 'ai-typing-row';
    typingRow.innerHTML = `
                        <div class="ai-avatar bot">AI</div>
                        <div>
                        <div class="ai-bubble ai-typing"><span></span><span></span><span></span></div>
                        </div>`;
    scrollEl.appendChild(typingRow);
    scrollAiChatToBottom();

    setTimeout(() => {
        const row = document.getElementById('ai-typing-row');
        if (row) row.remove();

        const botRow = document.createElement('div');
        botRow.className = 'ai-msg-row bot';
        botRow.innerHTML = `
                        <div class="ai-avatar bot">AI</div>
                        <div>
                        <div class="ai-bubble"></div>
                        <div class="ai-msg-meta">Asystent AI · ${currentTime()}</div>
                        </div>`;
        botRow.querySelector('.ai-bubble').innerText = 'To jest odpowiedź demonstracyjna. Podłącz backend Asystenta AI, aby otrzymywać rzeczywiste odpowiedzi.';
        scrollEl.appendChild(botRow);
        scrollAiChatToBottom();
    }, 900);

    return false;
}

// ==========================================
// 9. OBSŁUGA ZDJĘĆ
// ==========================================
if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handlePhotoUpload(files);
    }, false);
}

function handlePhotoUpload(files) {
    const grid = document.getElementById('photos-grid');
    if (!grid) return;

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            if (typeof UIkit !== 'undefined') {
                UIkit.notification({
                    message: "<span uk-icon='warning'></span> Wybrany plik nie jest obrazem!",
                    status: 'danger'
                });
            }
            return;
        }

        const imageUrl = URL.createObjectURL(file);
        activePhotos.push(imageUrl);

        const photoDiv = document.createElement('div');
        photoDiv.className = "photo-container relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-32 flex items-center justify-center transition hover:shadow-md animate-fade-in";

        photoDiv.innerHTML = `
        <img src="${imageUrl}" class="w-full h-full object-cover cursor-pointer" onclick="openPhotoLightbox(this.src)" alt="Zdjęcie serwisanta">
        <span class="absolute bottom-1 left-1 bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">Serwisant</span>
        <button type="button" class="delete-photo-btn absolute top-1.5 right-1.5 bg-red-600 text-white p-1.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-700" onclick="deletePhoto(this)">
        <span uk-icon="icon: trash; ratio: 0.75"></span>
        </button>
        `;

        grid.appendChild(photoDiv);
    });

    if (typeof UIkit !== 'undefined') {
        UIkit.notification({
            message: "<span uk-icon='check'></span> Zdjęcia dodane do zlecenia.",
            status: 'success',
            timeout: 2000
        });
    }
}

function deletePhoto(button) {
    const container = button.closest('.photo-container');
    if (container) {
        const img = container.querySelector('img');
        if (img && img.src) {
            activePhotos = activePhotos.filter(src => src !== img.src);
        }
        container.style.transform = 'scale(0.9)';
        container.style.opacity = '0';
        setTimeout(() => {
            container.remove();
        }, 200);
    }
}

function openPhotoLightbox(src) {
    const img = document.getElementById('lightbox-img');
    if (img && typeof UIkit !== 'undefined') {
        img.src = src;
        UIkit.modal('#photo-lightbox').show();
    }
}

// ==========================================
// 10. STOPER, ZAKOŃCZENIE SERWISU, LEAFLET I PDF
// ==========================================
window.startService = function () {
    const selectEl = document.getElementById('select-saved-machine');
    if (selectEl && !selectEl.value) {
        if (typeof UIkit !== 'undefined') {
            UIkit.notification({ message: "Wybierz maszynę przed startem serwisu!", status: 'warning' });
        }
        return;
    }

    serviceStarted = true;
    startTime = new Date();

    const formContainer = document.getElementById('service-form-container');
    if (formContainer) {
        formContainer.classList.remove('opacity-40', 'pointer-events-none');
    }

    const btnStart = document.getElementById('btn-start-service');
    if (btnStart) {
        btnStart.disabled = true;
        btnStart.className = "bg-gray-400 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 cursor-not-allowed";
        btnStart.innerHTML = `<span uk-icon="icon: check"></span> SERWIS W TOKU`;
    }

    const timerEl = document.getElementById('service-timer');
    if (timerEl) {
        timerEl.classList.remove('hidden');
        timerEl.style.display = 'block';

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            const diff = new Date() - startTime;
            const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
            const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
            const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            timerEl.textContent = `${hrs}:${mins}:${secs}`;
        }, 1000);
    }
};

window.finishService = function () {
    if (timerInterval) clearInterval(timerInterval);
    const timerEl = document.getElementById('service-timer');
    const finalDurationStr = timerEl ? timerEl.textContent : '01:45:00';

    let finalActivities = [];
    document.querySelectorAll('input[type="checkbox"][data-time]:checked, #activities-container input[type="checkbox"]:checked').forEach(cb => {
        const name = cb.getAttribute('data-name') || cb.value;
        if (name && !finalActivities.includes(name)) finalActivities.push(name);
    });

    let finalParts = [];
    document.querySelectorAll('.part-checkbox:checked').forEach(cb => {
        finalParts.push({
            code: cb.getAttribute('data-code') || 'CZĘŚĆ',
            name: cb.getAttribute('data-name') || cb.value || 'Część zamienna'
        });
    });

    const getVal = (id) => document.getElementById(id)?.value || document.getElementById(id)?.innerText || '';

    const modelSelect = document.getElementById('machine-model');
    let modelText = '---';
    if (modelSelect) {
        modelText = modelSelect.tagName === 'SELECT' && modelSelect.selectedIndex >= 0
            ? modelSelect.options[modelSelect.selectedIndex].text
            : modelSelect.value || '---';
    }

    let photoArr = Array.isArray(activePhotos) ? [...activePhotos] : [];
    document.querySelectorAll('#photos-grid img, #p7-media-preview img').forEach(img => {
        if (img.src && !photoArr.includes(img.src)) photoArr.push(img.src);
    });

    const summaryData = {
        model: modelText,
        machineNum: getVal('form-machine-num') || getVal('p5-machine-number') || '---',
        client: getVal('form-client') || '---',
        hours: getVal('form-hours') || '',
        technician: getVal('form-technician') || '---',
        date: getVal('form-date') || new Date().toISOString().split('T')[0],
        notes: getVal('technician-notes') || 'Brak uwag.',
        duration: finalDurationStr,
        activities: finalActivities,
        parts: finalParts,
        photos: photoArr
    };

    localStorage.setItem('cemar_active_summary', JSON.stringify(summaryData));
    window.location.href = 'serwis-przeprowadzony.html';
};

// OBSŁUGA MAPY LEAFLET
window.initRouteMap = function initRouteMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    if (window.cemarMap) {
        window.cemarMap.remove();
    }

    const mapCenter = [51.107885, 17.038538];
    window.cemarMap = L.map('map').setView(mapCenter, 14);
    const map = window.cemarMap;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { crossOrigin: true }).addTo(map);

    const waypointIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#dca31a; width:6px; height:6px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);'></div>",
        iconSize: [3, 3],
        iconAnchor: [3, 3]
    });
    const waypointIconNew = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#de4635; width:6px; height:6px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);'></div>",
        iconSize: [3, 3],
        iconAnchor: [3, 3]
    });

    const routeCoordinates = [
        [51.11191924880391, 17.054661007892758],
        [51.11189229423304, 17.05474679409482],
        [51.1118552316724, 17.054854026847455],
        [51.11180806109769, 17.054988067788205],
        [51.11174067447887, 17.05504704580216],
        [51.11165307172751, 17.055106023816066],
        [51.1115924235716, 17.055122108728987],
        [51.11150145118848, 17.055127470366607],
        [51.11143069476671, 17.055100662178457],
        [51.1113633075976, 17.05506313071504],
        [51.11129592033025, 17.05502559925162],
        [51.111245379815266, 17.054993429425856],
        [51.11118810049812, 17.054950536324785],
        [51.111134190487675, 17.054907643223757],
        [51.11108028041439, 17.054864750122725],
        [51.11101289273436, 17.05480577210877]
    ];

    const routeCoordinatesNew = [
        [51.11171846541026, 17.05773757132773],
        [51.11182291447217, 17.05787810221761],
        [51.111903778259055, 17.058071121172315],
        [51.11191051690158, 17.05823197030125],
        [51.1118801930025, 17.058344617519044],
        [51.11183976110612, 17.058473416379343],
        [51.11180269850335, 17.058596739605655],
        [51.1117588972072, 17.05870939794507],
        [51.1117218345396, 17.05882741236135],
        [51.11166792515181, 17.058945429558],
        [51.111597168984915, 17.059015192015973],
        [51.11152641270967, 17.05911173763851],
        [51.11146576438753, 17.059176152360866],
        [51.11136805303444, 17.059240500353642]
    ];

    const polyline = L.polyline(routeCoordinates, { color: '#dca31a', weight: 5 }).addTo(map);
    routeCoordinates.forEach(coord => L.marker(coord, { icon: waypointIcon }).addTo(map));
    map.fitBounds(polyline.getBounds());

    const polyline2 = L.polyline(routeCoordinatesNew, { color: '#de4635', weight: 5 }).addTo(map);
    routeCoordinatesNew.forEach(coord => L.marker(coord, { icon: waypointIconNew }).addTo(map));
    map.fitBounds(polyline.getBounds());
};
// LOGI TELEMETRYCZNE (PRZYKŁADOWE DANE)
let telemetryCycles = [
    {
        cycleId: "Cykl 1",
        phases: [
            {
                phaseName: "Rozruch",
                stages: [
                    {
                        stageId: 0,
                        logs: [
                            { time: "14:20:00", ac_volt: "228 V", rpm: "450", power: "12 kW", temp_turb: "110 °C", temp_out: "85 °C", temp_oil: "22 °C", oil_lvl: "92%", oil_press: "1.8 bar", pwm_oil: "15%", fuel: "84%", pwm_fuel: "12%", pwm_start: "95%", current_start: "45 A", air_press: "1.1 bar", error: "0x00", timestamp: "14200021" },
                            { time: "14:20:02", ac_volt: "228 V", rpm: "480", power: "13 kW", temp_turb: "112 °C", temp_out: "86 °C", temp_oil: "22 °C", oil_lvl: "92%", oil_press: "1.9 bar", pwm_oil: "16%", fuel: "84%", pwm_fuel: "12%", pwm_start: "93%", current_start: "43 A", air_press: "1.1 bar", error: "0x00", timestamp: "14200221" },
                            { time: "14:20:04", ac_volt: "229 V", rpm: "520", power: "13 kW", temp_turb: "114 °C", temp_out: "88 °C", temp_oil: "23 °C", oil_lvl: "92%", oil_press: "2.0 bar", pwm_oil: "17%", fuel: "84%", pwm_fuel: "13%", pwm_start: "91%", current_start: "41 A", air_press: "1.2 bar", error: "0x00", timestamp: "14200421" },
                            { time: "14:20:06", ac_volt: "229 V", rpm: "600", power: "14 kW", temp_turb: "125 °C", temp_out: "91 °C", temp_oil: "23 °C", oil_lvl: "92%", oil_press: "2.1 bar", pwm_oil: "18%", fuel: "84%", pwm_fuel: "13%", pwm_start: "88%", current_start: "40 A", air_press: "1.2 bar", error: "0x00", timestamp: "14200621" }
                        ]
                    },
                    {
                        stageId: 2,
                        logs: [
                            { time: "14:20:10", ac_volt: "230 V", rpm: "820", power: "15 kW", temp_turb: "150 °C", temp_out: "95 °C", temp_oil: "24 °C", oil_lvl: "92%", oil_press: "2.4 bar", pwm_oil: "20%", fuel: "84%", pwm_fuel: "15%", pwm_start: "85%", current_start: "38 A", air_press: "1.3 bar", error: "0x00", timestamp: "14201021" },
                            { time: "14:20:12", ac_volt: "230 V", rpm: "890", power: "16 kW", temp_turb: "158 °C", temp_out: "99 °C", temp_oil: "24 °C", oil_lvl: "92%", oil_press: "2.5 bar", pwm_oil: "21%", fuel: "84%", pwm_fuel: "16%", pwm_start: "80%", current_start: "34 A", air_press: "1.4 bar", error: "0x00", timestamp: "14201221" },
                            { time: "14:20:14", ac_volt: "230 V", rpm: "980", power: "17 kW", temp_turb: "170 °C", temp_out: "102 °C", temp_oil: "24 °C", oil_lvl: "92%", oil_press: "2.6 bar", pwm_oil: "22%", fuel: "84%", pwm_fuel: "16%", pwm_start: "78%", current_start: "32 A", air_press: "1.4 bar", error: "0x00", timestamp: "14201421" }
                        ]
                    },
                    {
                        stageId: 5,
                        logs: [
                            { time: "14:20:20", ac_volt: "229 V", rpm: "1250", power: "22 kW", temp_turb: "210 °C", temp_out: "115 °C", temp_oil: "25 °C", oil_lvl: "91%", oil_press: "3.1 bar", pwm_oil: "28%", fuel: "83%", pwm_fuel: "18%", pwm_start: "70%", current_start: "25 A", air_press: "1.6 bar", error: "0x00", timestamp: "14202021" },
                            { time: "14:20:22", ac_volt: "229 V", rpm: "1350", power: "24 kW", temp_turb: "232 °C", temp_out: "122 °C", temp_oil: "25 °C", oil_lvl: "91%", oil_press: "3.2 bar", pwm_oil: "30%", fuel: "83%", pwm_fuel: "19%", pwm_start: "65%", current_start: "22 A", air_press: "1.7 bar", error: "0x00", timestamp: "14202221" },
                            { time: "14:20:24", ac_volt: "229 V", rpm: "1450", power: "26 kW", temp_turb: "250 °C", temp_out: "135 °C", temp_oil: "26 °C", oil_lvl: "91%", oil_press: "3.4 bar", pwm_oil: "32%", fuel: "83%", pwm_fuel: "20%", pwm_start: "60%", current_start: "20 A", air_press: "1.7 bar", error: "0x00", timestamp: "14202421" }
                        ]
                    },
                    {
                        stageId: 8,
                        logs: [
                            { time: "14:20:30", ac_volt: "231 V", rpm: "1800", power: "35 kW", temp_turb: "320 °C", temp_out: "155 °C", temp_oil: "28 °C", oil_lvl: "91%", oil_press: "3.7 bar", pwm_oil: "35%", fuel: "83%", pwm_fuel: "22%", pwm_start: "40%", current_start: "12 A", air_press: "1.9 bar", error: "0x00", timestamp: "14203021" },
                            { time: "14:20:32", ac_volt: "231 V", rpm: "1910", power: "39 kW", temp_turb: "344 °C", temp_out: "172 °C", temp_oil: "28 °C", oil_lvl: "91%", oil_press: "3.8 bar", pwm_oil: "36%", fuel: "83%", pwm_fuel: "24%", pwm_start: "35%", current_start: "10 A", air_press: "2.0 bar", error: "0x00", timestamp: "14203221" },
                            { time: "14:20:34", ac_volt: "231 V", rpm: "2000", power: "42 kW", temp_turb: "360 °C", temp_out: "175 °C", temp_oil: "29 °C", oil_lvl: "91%", oil_press: "3.9 bar", pwm_oil: "38%", fuel: "83%", pwm_fuel: "24%", pwm_start: "30%", current_start: "8 A", air_press: "2.0 bar", error: "0x00", timestamp: "14203421" }
                        ]
                    },
                    {
                        stageId: 11,
                        logs: [
                            { time: "14:20:40", ac_volt: "230 V", rpm: "2350", power: "55 kW", temp_turb: "450 °C", temp_out: "210 °C", temp_oil: "32 °C", oil_lvl: "91%", oil_press: "4.1 bar", pwm_oil: "42%", fuel: "83%", pwm_fuel: "28%", pwm_start: "10%", current_start: "4 A", air_press: "2.2 bar", error: "0x00", timestamp: "14204021" },
                            { time: "14:20:42", ac_volt: "230 V", rpm: "2440", power: "59 kW", temp_turb: "468 °C", temp_out: "225 °C", temp_oil: "33 °C", oil_lvl: "91%", oil_press: "4.2 bar", pwm_oil: "44%", fuel: "83%", pwm_fuel: "30%", pwm_start: "8%", current_start: "3 A", air_press: "2.3 bar", error: "0x00", timestamp: "14204221" },
                            { time: "14:20:44", ac_volt: "230 V", rpm: "2550", power: "63 kW", temp_turb: "490 °C", temp_out: "240 °C", temp_oil: "34 °C", oil_lvl: "91%", oil_press: "4.2 bar", pwm_oil: "46%", fuel: "83%", pwm_fuel: "32%", pwm_start: "5%", current_start: "2 A", air_press: "2.3 bar", error: "0x00", timestamp: "14204421" }
                        ]
                    },
                    {
                        stageId: 13,
                        logs: [
                            { time: "14:20:50", ac_volt: "230 V", rpm: "2800", power: "75 kW", temp_turb: "520 °C", temp_out: "260 °C", temp_oil: "36 °C", oil_lvl: "91%", oil_press: "4.3 bar", pwm_oil: "50%", fuel: "82%", pwm_fuel: "35%", pwm_start: "0%", current_start: "0 A", air_press: "2.5 bar", error: "0x00", timestamp: "14205021" },
                            { time: "14:20:52", ac_volt: "230 V", rpm: "2920", power: "78 kW", temp_turb: "542 °C", temp_out: "285 °C", temp_oil: "37 °C", oil_lvl: "91%", oil_press: "4.3 bar", pwm_oil: "52%", fuel: "82%", pwm_fuel: "36%", pwm_start: "0%", current_start: "0 A", air_press: "2.5 bar", error: "0x00", timestamp: "14205221" },
                            { time: "14:20:54", ac_volt: "230 V", rpm: "3000", power: "79 kW", temp_turb: "560 °C", temp_out: "290 °C", temp_oil: "40 °C", oil_lvl: "91%", oil_press: "4.4 bar", pwm_oil: "53%", fuel: "82%", pwm_fuel: "37%", pwm_start: "0%", current_start: "0 A", air_press: "2.6 bar", error: "0x00", timestamp: "14205421" }
                        ]
                    }
                ]
            },
            {
                phaseName: "Praca",
                stages: [
                    {
                        stageId: 14,
                        logs: [
                            { time: "14:21:00", ac_volt: "230 V", rpm: "3100", power: "80 kW", temp_turb: "580 °C", temp_out: "310 °C", temp_oil: "42 °C", oil_lvl: "91%", oil_press: "4.4 bar", pwm_oil: "55%", fuel: "82%", pwm_fuel: "38%", pwm_start: "0%", current_start: "0 A", air_press: "2.6 bar", error: "0x00", timestamp: "14210021" },
                            { time: "14:25:00", ac_volt: "231 V", rpm: "3150", power: "82 kW", temp_turb: "595 °C", temp_out: "325 °C", temp_oil: "45 °C", oil_lvl: "90%", oil_press: "4.4 bar", pwm_oil: "58%", fuel: "78%", pwm_fuel: "40%", pwm_start: "0%", current_start: "0 A", air_press: "2.6 bar", error: "0x00", timestamp: "14250021" },
                            { time: "14:30:00", ac_volt: "229 V", rpm: "3120", power: "80 kW", temp_turb: "605 °C", temp_out: "330 °C", temp_oil: "48 °C", oil_lvl: "90%", oil_press: "4.5 bar", pwm_oil: "60%", fuel: "74%", pwm_fuel: "42%", pwm_start: "0%", current_start: "0 A", air_press: "2.7 bar", error: "0x00", timestamp: "14300021" },
                            { time: "14:35:00", ac_volt: "230 V", rpm: "3100", power: "80 kW", temp_turb: "610 °C", temp_out: "335 °C", temp_oil: "50 °C", oil_lvl: "89%", oil_press: "4.5 bar", pwm_oil: "60%", fuel: "70%", pwm_fuel: "42%", pwm_start: "0%", current_start: "0 A", air_press: "2.7 bar", error: "0x00", timestamp: "14350021" },
                            { time: "14:40:00", ac_volt: "230 V", rpm: "3140", power: "81 kW", temp_turb: "608 °C", temp_out: "332 °C", temp_oil: "51 °C", oil_lvl: "89%", oil_press: "4.5 bar", pwm_oil: "60%", fuel: "66%", pwm_fuel: "41%", pwm_start: "0%", current_start: "0 A", air_press: "2.7 bar", error: "0x00", timestamp: "14400021" }
                        ]
                    }
                ]
            },
            {
                phaseName: "Cooling",
                stages: [
                    {
                        stageId: 40,
                        logs: [
                            { time: "14:41:10", ac_volt: "228 V", rpm: "1800", power: "20 kW", temp_turb: "450 °C", temp_out: "220 °C", temp_oil: "48 °C", oil_lvl: "89%", oil_press: "3.2 bar", pwm_oil: "30%", fuel: "65%", pwm_fuel: "12%", pwm_start: "0%", current_start: "0 A", air_press: "1.8 bar", error: "0x00", timestamp: "14411021" },
                            { time: "14:41:15", ac_volt: "228 V", rpm: "1500", power: "15 kW", temp_turb: "400 °C", temp_out: "200 °C", temp_oil: "46 °C", oil_lvl: "89%", oil_press: "2.8 bar", pwm_oil: "25%", fuel: "65%", pwm_fuel: "10%", pwm_start: "0%", current_start: "0 A", air_press: "1.6 bar", error: "0x00", timestamp: "14411521" },
                            { time: "14:41:20", ac_volt: "229 V", rpm: "1200", power: "10 kW", temp_turb: "350 °C", temp_out: "180 °C", temp_oil: "44 °C", oil_lvl: "89%", oil_press: "2.5 bar", pwm_oil: "20%", fuel: "65%", pwm_fuel: "8%", pwm_start: "0%", current_start: "0 A", air_press: "1.4 bar", error: "0x00", timestamp: "14412021" }
                        ]
                    },
                    {
                        stageId: 41,
                        logs: [
                            { time: "14:41:30", ac_volt: "230 V", rpm: "600", power: "2 kW", temp_turb: "220 °C", temp_out: "120 °C", temp_oil: "39 °C", oil_lvl: "89%", oil_press: "1.8 bar", pwm_oil: "10%", fuel: "64%", pwm_fuel: "4%", pwm_start: "0%", current_start: "0 A", air_press: "1.1 bar", error: "0x00", timestamp: "14413021" },
                            { time: "14:41:33", ac_volt: "230 V", rpm: "400", power: "1 kW", temp_turb: "180 °C", temp_out: "100 °C", temp_oil: "37 °C", oil_lvl: "89%", oil_press: "1.2 bar", pwm_oil: "5%", fuel: "64%", pwm_fuel: "2%", pwm_start: "0%", current_start: "0 A", air_press: "0.8 bar", error: "0x00", timestamp: "14413321" },
                            { time: "14:41:36", ac_volt: "230 V", rpm: "200", power: "0 kW", temp_turb: "140 °C", temp_out: "80 °C", temp_oil: "35 °C", oil_lvl: "89%", oil_press: "0.6 bar", pwm_oil: "2%", fuel: "64%", pwm_fuel: "1%", pwm_start: "0%", current_start: "0 A", air_press: "0.4 bar", error: "0x00", timestamp: "14413621" },
                            { time: "14:41:40", ac_volt: "230 V", rpm: "0", power: "0 kW", temp_turb: "95 °C", temp_out: "60 °C", temp_oil: "34 °C", oil_lvl: "89%", oil_press: "0.2 bar", pwm_oil: "0%", fuel: "64%", pwm_fuel: "0%", pwm_start: "0%", current_start: "0 A", air_press: "0.0 bar", error: "0x00", timestamp: "14414021" }
                        ]
                    }
                ]
            }
        ]
    }
];

function toggleColumnGroup(groupName) {
    columnGroups[groupName] = !columnGroups[groupName];
    applyColumnVisibility();
}

function toggleAllHorizontal(expand) {
    for (let key in columnGroups) {
        columnGroups[key] = expand;
    }
    applyColumnVisibility();
}

function applyColumnVisibility() {
    const colspans = {
        power: { collapsed: 1, expanded: 3 },
        turbine: { collapsed: 1, expanded: 2 },
        oil: { collapsed: 1, expanded: 4 },
        fuel: { collapsed: 1, expanded: 2 },
        starter: { collapsed: 1, expanded: 2 }
    };

    for (let key in columnGroups) {
        const isExpanded = columnGroups[key];

        const header = document.getElementById(`hdr-group-${key}`);
        const indicator = document.getElementById(`indicator-${key}`);

        if (header) {
            header.colSpan = isExpanded ? colspans[key].expanded : colspans[key].collapsed;
            if (isExpanded) {
                header.classList.add('bg-amber-500', 'text-white');
                header.classList.remove('bg-gray-900');
            } else {
                header.classList.remove('bg-amber-500', 'text-white');
                header.classList.add('bg-gray-900');
            }
        }

        if (indicator) {
            indicator.innerHTML = isExpanded ? ' < > ' : ' ⇄ ';
        }

        const cells = document.querySelectorAll(`.col-${key}`);
        cells.forEach(cell => {
            if (isExpanded) {
                cell.classList.remove('hidden');
            } else {
                cell.classList.add('hidden');
            }
        });
    }
}

function toggleStageVertical(cycleId, phaseName, stageId) {
    const key = `${cycleId}_${phaseName}_${stageId}`;
    expandedStages[key] = !expandedStages[key];
    renderTable();
}

// Przełączanie widoczności pojedynczej fazy
function togglePhaseVertical(cycleId, phaseName) {
    const key = `${cycleId}_${phaseName}`;
    expandedPhases[key] = !expandedPhases[key];
    renderTable();
}

function toggleAllVertical(expand) {
    telemetryCycles.forEach(cycle => {
        cycle.phases.forEach(phase => {
            phase.stages.forEach(stage => {
                const key = `${cycle.cycleId}_${phase.phaseName}_${stage.stageId}`;
                expandedStages[key] = expand;
            });
        });
    });
    renderTable();
}
window.renderTable = function renderTable() {
    const tbody = document.getElementById('p6-telemetry-tbody');
    const emptyState = document.getElementById('p6-empty-state');

    tbody.innerHTML = '';

    if (telemetryCycles.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    telemetryCycles.forEach(cycle => {
        cycle.phases.forEach(phase => {
            const phaseKey = `${cycle.cycleId}_${phase.phaseName}`;
            const isPhaseExpanded = !!expandedPhases[phaseKey];

            const phaseSeparatorRow = document.createElement('tr');
            phaseSeparatorRow.className = "bg-gray-100 border-t-2 border-b border-gray-200";

            let displayPhaseName = phase.phaseName;
            if (displayPhaseName.toLowerCase() === 'cooling') {
                displayPhaseName = 'Chłodzenie';
            }

            phaseSeparatorRow.innerHTML = `
        <td colspan="18" class="p-1.5 px-3 bg-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    Faza pracy agregatu: ${displayPhaseName}
                </div>
                <button onclick="togglePhaseVertical('${cycle.cycleId}', '${phase.phaseName}')" class="text-[9px] bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold px-2 py-0.5 rounded transition">
                    ${isPhaseExpanded ? '▲ Zwiń fazę' : '▼ Rozwiń fazę'}
                </button>
            </div>
        </td>
        `;
            tbody.appendChild(phaseSeparatorRow);

            if (!isPhaseExpanded) {
                return;
            }

            phase.stages.forEach(stage => {
                const totalLogs = stage.logs.length;
                const stageKey = `${cycle.cycleId}_${phase.phaseName}_${stage.stageId}`;
                const isExpanded = !!expandedStages[stageKey];

                // Stage Subheader row (No Emojis!)
                const sectionHeaderRow = document.createElement('tr');
                sectionHeaderRow.className = "phase-header-row font-semibold text-gray-700 text-[11px]";
                sectionHeaderRow.innerHTML = `
        <td colspan="18" class="p-2 border-b border-gray-200">
        <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
        <span class="font-bold text-gray-950">${cycle.cycleId} - Etap ${stage.stageId}</span>
        <span class="text-xs text-gray-400 font-normal">(${totalLogs} pakietów telemetrycznych)</span>
        </div>
        <button onclick="toggleStageVertical('${cycle.cycleId}', '${phase.phaseName}', ${stage.stageId})" class="text-[10px] bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-bold px-2 py-0.5 rounded transition">
        ${isExpanded ? 'Zwiń etap' : 'Rozwiń etap'}
        </button>
        </div>
        </td>
        `;
                tbody.appendChild(sectionHeaderRow);

                // Stage log processing
                stage.logs.forEach((log, index) => {
                    const isFirst = index === 0;
                    const isLast = index === totalLogs - 1;
                    const isMiddle = !isFirst && !isLast;

                    // When collapsed, render only 1st and last elements with an expanding row placeholder in-between
                    if (isMiddle && !isExpanded) {
                        if (index === 1) {
                            const placeholderRow = document.createElement('tr');
                            placeholderRow.className = "bg-amber-50/50 hover:bg-amber-100/70 cursor-pointer text-center font-bold text-amber-800 transition text-[10px]";
                            placeholderRow.onclick = () => toggleStageVertical(cycle.cycleId, phase.phaseName, stage.stageId);
                            placeholderRow.innerHTML = `
        <td colspan="18" class="p-2 border-t border-b border-amber-200 text-center">
        [Rozwiń] Pokaż pozostałe ${totalLogs - 2} logów etapu ${stage.stageId}
        </td>
        `;
                            tbody.appendChild(placeholderRow);
                        }
                        return;
                    }

                    // Telemetry Log Record Row
                    const row = document.createElement('tr');
                    row.className = `hover:bg-gray-50/80 transition ${isMiddle ? 'bg-amber-50/10' : ''}`;

                    row.innerHTML = `
        <td class="p-2.5 font-semibold text-gray-800">${log.time}</td>
        <td class="p-2.5 border-r border-gray-100">
        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
        Etap ${stage.stageId}
        </span>
        </td>

        <!-- Zasilanie -->
        <td class="p-2.5 col-power collapsible-col text-gray-600">${log.ac_volt}</td>
        <td class="p-2.5 font-bold text-gray-900 bg-gray-50/40">${log.rpm}</td>
        <td class="p-2.5 col-power collapsible-col text-gray-600 border-r border-gray-100">${log.power}</td>

        <!-- Turbina -->
        <td class="p-2.5 font-bold text-red-600">${log.temp_turb}</td>
        <td class="p-2.5 col-turbine collapsible-col text-gray-600 border-r border-gray-100">${log.temp_out}</td>

        <!-- Olej -->
        <td class="p-2.5 col-oil collapsible-col text-gray-600">${log.temp_oil}</td>
        <td class="p-2.5 col-oil collapsible-col text-gray-600">${log.oil_lvl}</td>
        <td class="p-2.5 font-bold text-blue-600">${log.oil_press}</td>
        <td class="p-2.5 col-oil collapsible-col text-gray-600 border-r border-gray-100">${log.pwm_oil}</td>

        <!-- Paliwo -->
        <td class="p-2.5 font-bold text-gray-700">${log.fuel}</td>
        <td class="p-2.5 col-fuel collapsible-col text-gray-600 border-r border-gray-100">${log.pwm_fuel}</td>

        <!-- Starter -->
        <td class="p-2.5 col-starter collapsible-col text-gray-600">${log.pwm_start}</td>
        <td class="p-2.5 font-bold text-gray-700 border-r border-gray-100">${log.current_start}</td>

        <!-- Diagnostyka/Misc -->
        <td class="p-2.5 text-gray-600">${log.air_press}</td>
        <td class="p-2.5"><span class="px-1.5 py-0.5 rounded font-mono font-bold ${log.error !== '0x00' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}">${log.error}</span></td>
        <td class="p-2.5 font-mono text-gray-400">${log.timestamp}</td>
        `;
                    tbody.appendChild(row);
                });
            });
        });
    });

    applyColumnVisibility();
}

// Simulation packet generator appended directly to the active live stage (Cooling, Etap 41)
function simulateNewLog() {
    const lastCycle = telemetryCycles[telemetryCycles.length - 1];
    const lastPhase = lastCycle.phases[lastCycle.phases.length - 1];
    const lastStage = lastPhase.stages[lastPhase.stages.length - 1];

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const timestampVal = Math.floor(now.getTime() / 1000).toString().slice(-8);

    const newLog = {
        time: timeStr,
        ac_volt: `${228 + Math.floor(Math.random() * 5)} V`,
        rpm: "0",
        power: "0 kW",
        temp_turb: `${85 - Math.floor(Math.random() * 10)} °C`,
        temp_out: `${55 - Math.floor(Math.random() * 8)} °C`,
        temp_oil: `${33 - Math.floor(Math.random() * 3)} °C`,
        oil_lvl: "89%",
        oil_press: "0.1 bar",
        pwm_oil: "0%",
        fuel: "64%",
        pwm_fuel: "0%",
        pwm_start: "0%",
        current_start: "0 A",
        air_press: "0.0 bar",
        error: Math.random() > 0.95 ? "0x12" : "0x00",
        timestamp: timestampVal
    };

    lastStage.logs.push(newLog);

    UIkit.notification({
        message: `<span uk-icon='icon: check; ratio: 0.8'></span> Otrzymano nowy pakiet telemetryczny: ${timeStr} (Etap ${lastStage.stageId})`,
        status: 'success',
        pos: 'bottom-right',
        timeout: 2000
    });

    renderTable();
}

// GENEROWANIE PDF
window.download = function download() {
    const btn = document.getElementById('btn-download-report');
    if (btn) btn.style.visibility = 'hidden';

    if (typeof UIkit !== 'undefined') {
        UIkit.notification({ message: 'Generowanie PDF...', status: 'primary', pos: 'top-center' });
    }

    const element = document.getElementById('element-to-print');
    if (!element) {
        if (btn) btn.style.visibility = 'visible';
        return;
    }

    // Pobranie numeru maszyny do nazwy pliku
    const machineIdEl = document.getElementById('p3-machine-number');
    const machineId = machineIdEl ? machineIdEl.innerText.trim() : 'E59008';

    // 1. Znajdujemy sekcję z mapą i podsumowaniem
    const mapGrid = document.getElementById('map')?.closest('.uk-grid-medium');

    // 2. Tworzymy tymczasowy napis z linkiem (wyłącznie do PDF)
    const tempFooter = document.createElement('div');
    tempFooter.id = 'temp-pdf-footer';
    tempFooter.style.textAlign = 'center';
    tempFooter.style.marginTop = '25px';
    tempFooter.style.paddingTop = '15px';
    tempFooter.style.borderTop = '1px dashed #cbd5e1';
    tempFooter.style.fontSize = '13px';
    tempFooter.style.color = '#475569';
    tempFooter.style.fontFamily = 'sans-serif';
    tempFooter.innerHTML = 'Po więcej informacji <a href="https://TWOJ-LINK-PLACEHOLDER.PL" target="_blank" style="color: #E59008; font-weight: bold; text-decoration: underline;">LINK</a>';

    // Wstawiamy tymczasową stopkę na dół drukowanej sekcji
    element.appendChild(tempFooter);

    // 3. Całkowicie zwijamy sekcję mapy na czas generowania PDF (żeby nie zostawiała pustej przestrzeni)
    if (mapGrid) {
        mapGrid.style.display = 'none';
    }

    // Funkcja czyszcząca – przywraca widok strony do stanu początkowego
    const cleanup = () => {
        if (mapGrid) {
            mapGrid.style.display = '';
        }
        const footer = document.getElementById('temp-pdf-footer');
        if (footer) {
            footer.remove();
        }
        if (btn) btn.style.visibility = 'visible';
    };

    const opt = {
        margin: 10,
        filename: `raport-gps-${machineId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Dajemy przeglądarce 50ms na przeliczenie układu bez mapy
    setTimeout(() => {
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save()
                .then(cleanup)
                .catch(err => {
                    console.error('Błąd html2pdf:', err);
                    cleanup();
                    if (typeof UIkit !== 'undefined') {
                        UIkit.notification({ message: 'Błąd generowania PDF.', status: 'danger', pos: 'top-center' });
                    }
                });
        } else {
            cleanup();
        }
    }, 50);
};

// METODY POMOCNICZE WIDOKÓW
window.submitContactForm = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof UIkit !== 'undefined') {
        UIkit.notification({
            message: 'Twoje zgłoszenie zostało wysłane. Odpowiemy najszybciej jak to możliwe.',
            status: 'success',
            pos: 'top-center',
            timeout: 2500
        });
    }
    const safeClear = (id) => { const el = document.getElementById(id); if (el) el.value = ''; };
    safeClear('cf-name');
    safeClear('cf-email');
    safeClear('cf-message');
    const topic = document.getElementById('cf-topic');
    if (topic) topic.selectedIndex = 0;
    return false;
};

window.filterServices = function () {
    const input = document.getElementById('service-search-input');
    if (!input) return;

    const query = input.value.toLowerCase();
    const items = document.querySelectorAll('#services-accordion .service-item');

    items.forEach(item => {
        const nameEl = item.querySelector('.service-name');
        const dateEl = item.querySelector('.service-date');

        const name = nameEl ? nameEl.innerText.toLowerCase() : '';
        const date = dateEl ? dateEl.innerText.toLowerCase() : '';

        item.style.display = (name.includes(query) || date.includes(query)) ? '' : 'none';
    });
};

// Generowanie czystego raportu tekstowego do schowka
window.generateReportText = function () {
    const modelSelect = document.getElementById('machine-model');
    let modelName = '---';
    if (modelSelect && modelSelect.selectedIndex >= 0) {
        modelName = modelSelect.options[modelSelect.selectedIndex].text;
    }

    const machineNum = document.getElementById('form-machine-num')?.value || '---';
    const client = document.getElementById('form-client')?.value || '---';
    const hours = document.getElementById('form-hours')?.value || '---';
    const technician = document.getElementById('form-technician')?.value || '---';
    const date = document.getElementById('form-date')?.value || '---';
    const notes = document.getElementById('technician-notes')?.value || 'Brak dodatkowych uwag.';

    // Pobranie zaznaczonych procedur
    const activities = [];
    document.querySelectorAll('#activities-container input[type="checkbox"]:checked, input[data-time]:checked').forEach(cb => {
        const name = cb.getAttribute('data-name') || cb.value;
        if (name && !activities.includes(name)) activities.push(name);
    });

    // Pobranie zaznaczonych części
    const parts = [];
    document.querySelectorAll('.part-checkbox:checked').forEach(cb => {
        const code = cb.getAttribute('data-code') || '';
        const name = cb.getAttribute('data-name') || cb.value || '';
        parts.push(code ? `[${code}] ${name}` : name);
    });

    // Sformatowanie szablonu tekstu
    const reportText =
        `=== KARTA PRACY SERWISOWEJ ===
Model: ${modelName}
Nr maszyny: ${machineNum}
Klient: ${client}
MTH: ${hours} mth
Serwisant: ${technician}
Data: ${date}

--- WYKONANE PROCEDURY ---
${activities.length > 0 ? activities.map(a => `• ${a}`).join('\n') : 'Brak'}

--- ZUŻYTE CZĘŚCI ---
${parts.length > 0 ? parts.map(p => `• ${p}`).join('\n') : 'Brak'}

--- UWAGI ---
${notes}
==============================`;

    // Zapis do schowka i powiadomienie
    navigator.clipboard.writeText(reportText).then(() => {
        if (typeof UIkit !== 'undefined') {
            UIkit.notification({
                message: "<span uk-icon='icon: check'></span> Raport skopiowany do schowka!",
                status: 'success',
                pos: 'top-center',
                timeout: 2500
            });
        } else {
            alert('Raport został skopiowany do schowka!');
        }
    }).catch(err => {
        console.error('Błąd kopiowania do schowka:', err);
    });
};

// Resetowanie formularza i wszystkich zaznaczeń
window.clearAllForm = function clearAllForm() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    document.getElementById('base-service-baseline').checked = true;
    document.getElementById('form-machine-num').value = '';
    document.getElementById('form-client').value = '';
    document.getElementById('form-hours').value = '';
    document.getElementById('technician-notes').value = '';
    document.getElementById('activity-search').value = '';
    document.getElementById('parts-search').value = '';

    filterActivities();
    filterParts();
    calculateValuation();

    UIkit.notification({
        message: "Kalkulator został wyczyszczony.",
        status: 'primary',
        pos: 'bottom-center'
    });
}

window.onRangeChange = function () {
    if (typeof UIkit !== 'undefined') {
        UIkit.notification({
            message: '<span uk-icon=\'refresh\'></span> Aktualizowanie trasy GPS dla wybranego okresu...',
            status: 'primary',
            pos: 'bottom-right',
            timeout: 2000
        });
    }
};

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


// ==========================================
// 10. ADMIN - FUNKCJE
// ==========================================

        function filterMachinesTable() {
        const query = document.getElementById('admin-search-input').value.toLowerCase().trim();
        const rows = document.querySelectorAll('#all-machines-tbody tr');

        rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
        });
        }

        function handleMachineSubmit(e) {
            e.preventDefault();
            const id = document.getElementById('admin-m-id').value;
            const type = document.getElementById('admin-m-type').value;

            UIkit.notification({
                message: `<span uk-icon='icon: check'></span> Zapisano dane karty maszyny <b>${id} (${type})</b>`,
                status: 'success',
                pos: 'top-center',
                timeout: 3000
            });

            resetMachineForm();
            return false;
        }

        function loadMachineToEdit(id, type, sim, prodDate, hours, nextService, notes) {
            document.getElementById('machine-form-title').innerText = `Edycja Karty Maszyny: ${id}`;
            safeSetValue('admin-m-id', id);
            safeSetValue('admin-m-type', type);
            safeSetValue('admin-m-sim', sim);
            safeSetValue('admin-m-prod-date', prodDate);
            safeSetValue('admin-m-hours', hours);
            safeSetValue('admin-m-next-service', nextService);
            safeSetValue('admin-m-notes', notes);

            UIkit.notification({
                message: `<span uk-icon='icon: file-edit'></span> Wczytano dane maszyny ${id}`,
                status: 'primary',
                pos: 'top-center',
                timeout: 2000
            });
        }

        function resetMachineForm() {
            document.getElementById('machine-form-title').innerText = 'Wprowadzanie Danych Nowej Maszyny';
            document.getElementById('form-machine-edit').reset();
        }

        function filterMachineList() {
            const query = document.getElementById('machine-search-filter').value.toLowerCase();
            const items = document.querySelectorAll('#machine-quick-list li');
            items.forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(query) ? 'flex' : 'none';
            });
        }


               function onMachineSelectChange(selectEl) {
            const selectedOpt = selectEl.options[selectEl.selectedIndex];
            const sim = selectedOpt.getAttribute('data-sim') || '';
            safeSetValue('assign-sim-card', sim);
        }

        function handleAssignEntities(e) {
            e.preventDefault();
            const machine = document.getElementById('assign-machine-id').value;
            const techSelect = document.getElementById('assign-tech-id');
            const techName = techSelect.selectedIndex >= 0 ? techSelect.options[techSelect.selectedIndex].text : '';

            UIkit.notification({
                message: `<span uk-icon='icon: check'></span> Przypisano podmioty oraz serwisanta (<b>${techName}</b>) do maszyny <b>${machine}</b>`,
                status: 'success',
                pos: 'top-center',
                timeout: 3000
            });

            return false;
        }

        function editAssignment(machineId, simCard, distId, clientId, techId) {
            safeSetValue('assign-machine-id', machineId);
            safeSetValue('assign-sim-card', simCard || '');
            safeSetValue('assign-distributor-id', distId || '');
            safeSetValue('assign-client-id', clientId || '');
            safeSetValue('assign-tech-id', techId || '');

            UIkit.notification({
                message: `Wczytano powiązania dla maszyny ${machineId}`,
                status: 'info',
                pos: 'top-center',
                timeout: 2000
            });
        }
                function handleUserSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('user-fullname').value;
            const email = document.getElementById('user-email').value;

            UIkit.notification({
                message: `<span uk-icon='icon: check'></span> Zapisano dane użytkownika <b>${name}</b> (${email})`,
                status: 'success',
                pos: 'top-center',
                timeout: 3000
            });

            resetUserForm();
            return false;
        }

        function loadUserToEdit(fullname, email, phone, role) {
            document.getElementById('user-form-title').innerText = `Edycja Użytkownika: ${fullname}`;
            safeSetValue('user-fullname', fullname);
            safeSetValue('user-email', email);
            safeSetValue('user-phone', phone);
            safeSetValue('user-role', role);

            UIkit.notification({
                message: `<span uk-icon='icon: user'></span> Wczytano dane użytkownika ${fullname}`,
                status: 'primary',
                pos: 'top-center',
                timeout: 2000
            });
        }

        function resetUserForm() {
            document.getElementById('user-form-title').innerText = 'Tworzenie Nowego Konta';
            document.getElementById('form-user-edit').reset();
        }

        function filterUserList() {
            const query = document.getElementById('user-search-filter').value.toLowerCase();
            const items = document.querySelectorAll('#user-quick-list li');
            items.forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(query) ? 'flex' : 'none';
            });
        }

// ==========================================
// 11. Dystrybutor i Opiekun
// ==========================================
