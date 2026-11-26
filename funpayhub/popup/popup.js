const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let settings = { ...FP_DEFAULTS };
let state = {};

/* ---------- вкладки ---------- */
document.querySelectorAll('.tab').forEach((b) =>
  b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b));
    $('#tab-main').hidden = b.dataset.tab !== 'main';
    $('#tab-tpl').hidden = b.dataset.tab !== 'tpl';
  })
);

/* ---------- главная ---------- */
function fmtLeft(ms) {
  if (ms <= 0) return 'сейчас';
  const m = Math.ceil(ms / 60000);
  const h = Math.floor(m / 60);
  return h ? `${h} ч ${m % 60} мин` : `${m} мин`;
}

function renderNext() {
  const el = $('#next');
  if (!settings.autoRaise) el.textContent = 'Выключено';
  else if (!state.nextRaiseAt) el.textContent = 'Первый запуск — в течение минуты';
  else el.textContent = 'Следующее поднятие: ' + (state.nextRaiseAt - Date.now() <= 0 ? 'сейчас' : 'через ' + fmtLeft(state.nextRaiseAt - Date.now()));
}

function renderCats() {
  const box = $('#cats');
  const cats = state.categories || [];
  if (!cats.length) {
    box.innerHTML = '<div class="empty">Список пуст. Войдите на funpay.com и нажмите «Обновить».</div>';
    return;
  }
  const picked = settings.raiseCategories || [];
  box.innerHTML = cats
    .map((c) => {
      const on = !picked.length || picked.includes(c.id);
      return `<label class="cat"><input type="checkbox" data-id="${esc(c.id)}" ${on ? 'checked' : ''}><span>${esc(c.name)}</span></label>`;
    })
    .join('');
}

function renderLog() {
  const items = state.log || [];
  $('#log').innerHTML = items.length
    ? items
        .slice(0, 15)
        .map((l) => {
          const t = new Date(l.t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          return `<div><time>${t}</time><span class="${esc(l.level)}">${esc(l.msg)}</span></div>`;
        })
        .join('')
    : '<div class="muted">Пока пусто</div>';
}

function renderMain() {
  $('#acc').textContent =
    state.authOk === false
      ? 'Не авторизован на funpay.com'
      : state.username
      ? `${state.username} · ID ${state.userId}`
      : state.userId
      ? `ID ${state.userId}`
      : 'Войдите в аккаунт на funpay.com';
  renderNext();
  renderCats();
  renderLog();
}

function bindSwitch(id, key) {
  const el = $('#' + id);
  el.checked = !!settings[key];
  el.addEventListener('change', async () => {
    settings = await fpSetSettings({ [key]: el.checked });
    renderNext();
  });
}

/* ---------- шаблоны ---------- */
function addTplRow(t) {
  const d = document.createElement('div');
  d.className = 'tpl';
  d.innerHTML =
    `<div class="row"><input class="t-title" placeholder="Название кнопки" value="${esc(t.title)}">` +
    `<button class="btn ghost del" title="Удалить">✕</button></div>` +
    `<textarea class="t-text" rows="3" placeholder="Текст сообщения">${esc(t.text)}</textarea>`;
  $('#tplList').appendChild(d);
}
function collectTpl() {
  return [...document.querySelectorAll('.tpl')]
    .map((d) => ({ title: d.querySelector('.t-title').value.trim(), text: d.querySelector('.t-text').value }))
    .filter((t) => t.title || t.text);
}
let saveTimer = null;
function saveTplSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    settings = await fpSetSettings({ templates: collectTpl() });
  }, 300);
}

/* ---------- запуск ---------- */
async function init() {
  settings = await fpGetSettings();
  state = (await chrome.storage.local.get('state')).state || {};

  bindSwitch('autoRaise', 'autoRaise');
  bindSwitch('notifyMessages', 'notifyMessages');
  bindSwitch('notifyOrders', 'notifyOrders');
  bindSwitch('ordersStats', 'ordersStats');
  bindSwitch('sendInstantly', 'sendInstantly');

  $('#interval').value = String(settings.raiseIntervalHours || 4);
  $('#interval').addEventListener('change', async (e) => {
    settings = await fpSetSettings({ raiseIntervalHours: Number(e.target.value) });
  });

  $('#raiseNow').addEventListener('click', async () => {
    const b = $('#raiseNow');
    b.disabled = true;
    b.textContent = 'Поднимаю…';
    try {
      await chrome.runtime.sendMessage({ type: 'raiseNow' });
    } finally {
      b.disabled = false;
      b.textContent = 'Поднять сейчас';
    }
  });

  $('#refreshCats').addEventListener('click', async () => {
    const b = $('#refreshCats');
    b.disabled = true;
    try {
      await chrome.runtime.sendMessage({ type: 'refreshCategories' });
    } finally {
      b.disabled = false;
    }
  });

  $('#cats').addEventListener('change', async () => {
    const boxes = [...document.querySelectorAll('#cats input')];
    const ids = boxes.filter((x) => x.checked).map((x) => x.dataset.id);
    settings = await fpSetSettings({ raiseCategories: ids.length === boxes.length ? [] : ids });
  });

  settings.templates.forEach(addTplRow);
  $('#addTpl').addEventListener('click', () => addTplRow({ title: '', text: '' }));
  $('#tplList').addEventListener('input', saveTplSoon);
  $('#tplList').addEventListener('click', (e) => {
    if (e.target.classList.contains('del')) {
      e.target.closest('.tpl').remove();
      saveTplSoon();
    }
  });

  renderMain();
  setInterval(renderNext, 1000);
  chrome.storage.onChanged.addListener((ch) => {
    if (ch.state) {
      state = ch.state.newValue || {};
      renderMain();
    }
  });
}
init();
