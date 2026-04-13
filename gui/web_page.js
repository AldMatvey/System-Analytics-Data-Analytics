
let stationsData = [
    {
        id: 1,
        name: "Чистые пруды",
        line: "Сокольническая",
        current_load: 3.2,
        avg_load: 5.5,
        exits: [
            { id: 1, description: "Выход №1 к Чистопрудному бульвару, к памятнику А.С. Грибоедову" },
            { id: 2, description: "Выход №2 к Мясницкой улице, к театру «Et Cetera»; к Сретенскому бульвару, к Дворцу бракосочетания №1" }
        ],
        selected_exit_id: 1
    }
];

function mockFetchStations() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(JSON.parse(JSON.stringify(stationsData)));
        }, 300);
    });
}

function mockUpdateExit(stationId, newExitId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const station = stationsData.find(s => s.id === stationId);
            if (station) {
                station.selected_exit_id = newExitId;
                resolve({ success: true, stationId, newExitId });
            } else {
                reject({ success: false, message: "Станция не найдена" });
            }
        }, 200);
    });
}

const fetchStationsFromServer = mockFetchStations;
const updateExitOnServer = mockUpdateExit;

let displayMode = 'current'; 
let currentStations = [];

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

let msgTimeout;
function showMessage(text, type = 'info') {
    const msgDiv = document.getElementById('infoMsg');
    if (!msgDiv) return;
    let bgColor = '#e9f5ef';
    if (type === 'error') bgColor = '#ffe6e5';
    if (type === 'success') bgColor = '#e0f2e9';
    msgDiv.style.backgroundColor = bgColor;
    msgDiv.textContent = text;
    if (msgTimeout) clearTimeout(msgTimeout);
    msgTimeout = setTimeout(() => {
        msgDiv.style.backgroundColor = '#e9f5ef';
        msgDiv.textContent = 'Синхронизация с сервером активна';
    }, 2500);
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const coeffHeader = document.getElementById('coeffHeader');
    if (!tbody) return;

    if (!currentStations || currentStations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Нет данных от сервера</td></tr>';
        return;
    }

    coeffHeader.textContent = displayMode === 'current' ? 'Текущий коэффициент (чел/мин)' : 'Средний коэффициент (чел/мин)';

    let html = '';
    for (const station of currentStations) {
        const loadValue = displayMode === 'current' ? station.current_load : station.avg_load;
        const loadDisplay = loadValue.toFixed(1) + ' чел/мин';

        let selectHtml = `<select class="exit-select" data-station-id="${station.id}">`;
        for (const exit of station.exits) {
            const selected = (exit.id === station.selected_exit_id) ? 'selected' : '';
            selectHtml += `<option value="${exit.id}" ${selected}>${escapeHtml(exit.description)}</option>`;
        }
        selectHtml += `</select>`;

        html += `
            <tr>
                <td>${escapeHtml(station.name)}</td>
                <td>${escapeHtml(station.line)}</td>
                <td>${loadDisplay}</td>
                <td>${selectHtml}</td>
            </tr>
        `;
    }
    tbody.innerHTML = html;

    document.querySelectorAll('.exit-select').forEach(select => {
        select.addEventListener('change', async (event) => {
            const stationId = parseInt(event.target.dataset.stationId);
            const newExitId = parseInt(event.target.value);
            const originalBg = event.target.style.backgroundColor;
            event.target.style.backgroundColor = '#fff3cd';
            try {

                currentStations = JSON.parse(JSON.stringify(stationsData));
                renderTable(); // перерисовать, чтобы отразить новый выбранный выход
                showMessage(`Выход для станции обновлён`, 'success');
            } catch (err) {
                console.error(err);
                showMessage(`Ошибка обновления выхода`, 'error');
                // Откатить select к предыдущему значению (перерисовка)
                renderTable();
            } finally {
                event.target.style.backgroundColor = originalBg;
            }
        });
    });
}

async function loadData() {
    try {
        showMessage('Загрузка данных с сервера...', 'info');
        const data = await fetchStationsFromServer();
        currentStations = data;
        if (typeof mockFetchStations === 'function') {
            stationsData = JSON.parse(JSON.stringify(data));
        }
        renderTable();
        showMessage('Данные успешно загружены', 'success');
    } catch (err) {
        console.error(err);
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="4">Ошибка соединения с сервером</td></tr>';
        showMessage('Не удалось загрузить данные', 'error');
    }
}

function toggleDisplayMode() {
    displayMode = (displayMode === 'current') ? 'avg' : 'current';
    renderTable();
    const modeName = displayMode === 'current' ? 'ТЕКУЩАЯ загруженность' : 'СРЕДНЯЯ загруженность';
    showMessage(`Режим отображения: ${modeName}`, 'info');
}

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleModeBtn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleDisplayMode);

    const mapBtn = document.querySelector('.button_r');
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            showMessage('Выбрана станция «Чистые пруды» (интерактив карты в разработке)', 'info');
        });
    }

    loadData();
});