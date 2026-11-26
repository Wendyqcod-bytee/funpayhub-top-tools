importScripts('shared.js');

const BASE = 'https://funpay.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randTag = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0');

/* ---------- состояние (с очередью записи, чтобы параллельные апдейты не затирали друг друга) ---------- */
let stateChain = Promise.resolve();
function updateState(fn) {
  stateChain = stateChain
    .then(async () => {
      const { state } = await chrome.storage.local.get('state');
      const cur = state || {};
      const next = fn(cur) || cur;
      await chrome.storage.local.set({ state: next });
    })
    .catch(() => {});
  return stateChain;
}
async function getState() {
  const { state } = await chrome.storage.local.get('state');
  return state || {};
}
function log(msg, level = 'info') {
  return updateState((s) => ({
    ...s,
    log: [{ t: Date.now(), msg, level }, ...(s.log || [])].slice(0, 40)
  }));
}

/* ---------- утилиты ---------- */
function decodeHtml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
function stripTags(s) {
  return decodeHtml(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}
// «Подождите 1 час 20 минут» -> миллисекунды
function parseWaitMs(text) {
  let ms = 0;
  const re = /(\d+)\s*([а-яё]+)/gi;
  let m;
  while ((m = re.exec(text))) {
    const n = Number(m[1]);
    const u = m[2][0].toLowerCase();
    if (u === 'с') ms += n * 1000;
    else if (u === 'м') ms += n * 60000;
    else if (u === 'ч') ms += n * 3600000;
    else if (u === 'д') ms += n * 86400000;
  }
  return ms;
}

/* ---------- авторизация (csrf-токен и userId лежат в data-app-data на главной) ---------- */
let authCache = null;
async function getAuth(force = false) {
  if (!force && authCache && Date.now() - authCache.at < 10 * 60 * 1000) return authCache;

  const res = await fetch(BASE + '/', { credentials: 'include' });
  const html = await res.text();
  const m = html.match(/data-app-data=(?:"([^"]*)"|'([^']*)')/);
  let data = null;
  try {
    data = m ? JSON.parse(decodeHtml(m[1] ?? m[2])) : null;
  } catch (e) {}

  if (!data || !data.userId) {
    authCache = null;
    await updateState((s) => ({ ...s, authOk: false }));
    throw new Error('Вы не авторизованы на funpay.com');
  }
  const nameMatch = html.match(/user-link-name[^>]*>([^<]+)</);
  authCache = { csrf: data['csrf-token'], userId: data.userId, at: Date.now() };
  await updateState((s) => ({
    ...s,
    authOk: true,
    userId: data.userId,
    username: nameMatch ? decodeHtml(nameMatch[1]).trim() : s.username
  }));
  return authCache;
}

/* ---------- категории продавца ---------- */
async function fetchCategories() {
  const { userId } = await getAuth();
  const html = await (await fetch(`${BASE}/users/${userId}/`, { credentials: 'include' })).text();
  const re = /offer-list-title[\s\S]*?<a[^>]+href="[^"]*?\/lots\/(\d+)\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  const seen = new Map();
  let m;
  while ((m = re.exec(html))) {
    if (!seen.has(m[1])) seen.set(m[1], stripTags(m[2]) || `Категория ${m[1]}`);
  }
  const cats = [...seen].map(([id, name]) => ({ id, name }));
  if (!cats.length) await log('Не нашёл категории в профиле — проверьте, что у вас есть активные лоты', 'warn');
  return cats;
}

/* ---------- поднятие лотов ---------- */
async function raiseCategory(nodeId, csrf, allowed) {
  const page = await (await fetch(`${BASE}/lots/${nodeId}/trade`, { credentials: 'include' })).text();
  const btn = (page.match(/<[^>]*js-lot-raise[^>]*>/) || [])[0];
  const game = btn && (btn.match(/data-game="(\d+)"/) || [])[1];
  if (!game) return { ok: false, msg: 'нет кнопки «Поднять» (возможно, нет активных лотов)' };

  const post = async (ids) => {
    const body = new URLSearchParams();
    body.set('game_id', game);
    body.set('node_id', nodeId);
    ids.forEach((id) => body.append('node_ids[]', id));
    body.set('csrf_token', csrf);
    const r = await fetch(BASE + '/lots/raise', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Accept: '*/*'
      },
      body
    });
    try {
      return await r.json();
    } catch (e) {
      return { error: 1, msg: 'неожиданный ответ сервера (HTTP ' + r.status + ')' };
    }
  };

  let j = await post([]);
  let covered = [nodeId];
  if (j.modal) {
    // FunPay предлагает выбрать, какие категории игры поднять
    let ids = [...String(j.modal).matchAll(/<input[^>]*name="node_ids\[\]"[^>]*>/g)]
      .map((x) => (x[0].match(/value="(\d+)"/) || [])[1])
      .filter(Boolean);
    if (allowed) ids = ids.filter((id) => allowed.has(id) || id === nodeId);
    if (!ids.length) ids = [nodeId];
    covered = ids;
    j = await post(ids);
  }

  const msg = stripTags(String(j.msg || ''));
  if (j.url) return { ok: false, msg: 'сессия истекла — войдите на funpay.com заново' };
  if (j.error || /подождите/i.test(msg)) return { ok: false, msg, waitMs: parseWaitMs(msg) };
  return { ok: true, covered, msg };
}

let raising = false;
async function raiseAll(manual) {
  if (raising) return;
  raising = true;
  try {
    const settings = await fpGetSettings();
    const { csrf } = await getAuth(true);
    const st = await getState();
    let cats = st.categories || [];
    if (!cats.length) {
      cats = await fetchCategories();
      await updateState((s) => ({ ...s, categories: cats }));
    }
    const picked = settings.raiseCategories || [];
    const selected = picked.length ? cats.filter((c) => picked.includes(c.id)) : cats;
    if (!selected.length) {
      await log('Нет категорий для поднятия', 'warn');
      await updateState((s) => ({ ...s, nextRaiseAt: Date.now() + 30 * 60000 }));
      return;
    }
    const allowed = new Set(selected.map((c) => c.id));
    const done = new Set();
    const waits = [];
    let okCount = 0;
    let errCount = 0;

    for (const c of selected) {
      if (done.has(c.id)) continue;
      let r;
      try {
        r = await raiseCategory(c.id, csrf, allowed);
      } catch (e) {
        r = { ok: false, msg: e.message };
      }
      if (r.ok) {
        okCount++;
        r.covered.forEach((id) => done.add(id));
        await log(`Поднято: ${c.name}`, 'ok');
      } else if (r.waitMs) {
        waits.push(r.waitMs);
        await log(`${c.name}: ${r.msg}`, 'warn');
      } else {
        errCount++;
        await log(`${c.name}: ${r.msg}`, 'error');
      }
      await sleep(800 + Math.random() * 700);
    }

    const interval = (settings.raiseIntervalHours || 4) * 3600000;
    let delay = interval;
    if (waits.length) delay = Math.min(...waits) + 30000;
    else if (errCount && !okCount) delay = 30 * 60000;
    await updateState((s) => ({ ...s, nextRaiseAt: Date.now() + delay, lastRaiseAt: Date.now() }));
  } catch (e) {
    await log('Поднятие: ' + e.message, 'error');
    await updateState((s) => ({ ...s, nextRaiseAt: Date.now() + 15 * 60000 }));
  } finally {
    raising = false;
  }
}

/* ---------- уведомления (опрос runner — тот же, что использует сам сайт) ---------- */
function setBadge(n) {
  chrome.action.setBadgeText({ text: n > 0 ? String(n) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#e8590c' });
}
async function tgSend(text, force) {
  const s = await fpGetSettings();
  if (!s.tgToken || !s.tgChatId || (!force && !s.tgEnabled)) return { ok: false, error: 'Заполните токен и Chat ID' };
  try {
    const r = await fetch(`https://api.telegram.org/bot${s.tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: s.tgChatId, text })
    });
    const j = await r.json();
    return j.ok ? { ok: true } : { ok: false, error: j.description || 'ошибка Telegram' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function notify(kind, title, message) {
  tgSend(`${title}\n${message}`);
  chrome.notifications.create(`${kind}-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 1
  });
}
chrome.notifications.onClicked.addListener((id) => {
  chrome.tabs.create({ url: id.startsWith('order') ? `${BASE}/orders/trade` : `${BASE}/chat/` });
  chrome.notifications.clear(id);
});

async function poll() {
  const settings = await fpGetSettings();
  if (!settings.notifyMessages && !settings.notifyOrders) {
    setBadge(0);
    return;
  }
  const auth = await getAuth();
  const st = await getState();
  const tags = st.tags || {};
  const objects = [
    { type: 'orders_counters', id: auth.userId, tag: tags.orders_counters || randTag(), data: false },
    { type: 'chat_counter', id: auth.userId, tag: tags.chat_counter || randTag(), data: false }
  ];
  const body = new URLSearchParams({
    objects: JSON.stringify(objects),
    request: 'false',
    csrf_token: auth.csrf
  });
  const res = await fetch(BASE + '/runner/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body
  });
  if (!res.ok) throw new Error('runner: HTTP ' + res.status);
  const j = await res.json();

  const counters = { ...(st.counters || {}) };
  const newTags = { ...tags };
  const events = [];
  for (const o of j.objects || []) {
    newTags[o.type] = o.tag;
    if (o.type === 'chat_counter') {
      const c = Number((o.data && o.data.counter) || 0);
      if (typeof counters.chat === 'number' && c > counters.chat) events.push(['msg', c]);
      counters.chat = c;
    } else if (o.type === 'orders_counters') {
      const c = Number((o.data && o.data.seller) || 0);
      if (typeof counters.orders === 'number' && c > counters.orders) events.push(['order', c]);
      counters.orders = c;
    }
  }
  await updateState((s) => ({ ...s, counters, tags: newTags, lastPoll: Date.now(), authOk: true }));
  setBadge((counters.chat || 0) + (counters.orders || 0));

  for (const [kind, n] of events) {
    if (kind === 'msg' && settings.notifyMessages) notify('msg', 'FunpayHub: новое сообщение', `Непрочитанных чатов: ${n}`);
    if (kind === 'order' && settings.notifyOrders) notify('order', 'FunpayHub: новый заказ', `Заказов в работе: ${n}`);
  }
}

/* ---------- планировщик ---------- */
let lastErr = '';
async function tick() {
  try {
    const settings = await fpGetSettings();
    const st = await getState();
    if (settings.autoRaise && Date.now() >= (st.nextRaiseAt || 0)) await raiseAll(false);
    await poll();
    lastErr = '';
  } catch (e) {
    if (e.message !== lastErr) {
      lastErr = e.message;
      await log(e.message, 'error');
    }
  }
}

function ensureAlarm() {
  chrome.alarms.get('tick', (a) => {
    if (!a) chrome.alarms.create('tick', { periodInMinutes: 1, delayInMinutes: 0.1 });
  });
}
chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) await chrome.storage.local.set({ settings: FP_DEFAULTS });
  ensureAlarm();
});
chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  tick();
});
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === 'tick') tick();
});
ensureAlarm();

/* ---------- сообщения из popup ---------- */
chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  (async () => {
    try {
      if (msg.type === 'raiseNow') {
        await raiseAll(true);
        send({ ok: true });
      } else if (msg.type === 'loadPanel') {
        await chrome.scripting.executeScript({ target: { tabId: _sender.tab.id }, files: ['content/panel.js'] });
        send({ ok: true });
      } else if (msg.type === 'tgTest') {
        send(await tgSend('FunpayHub: тестовое сообщение ✅', true));
      } else if (msg.type === 'refreshCategories') {
        const cats = await fetchCategories();
        await updateState((s) => ({ ...s, categories: cats }));
        send({ ok: true, categories: cats });
      } else {
        send({ ok: false, error: 'unknown message' });
      }
    } catch (e) {
      await log(e.message, 'error');
      send({ ok: false, error: e.message });
    }
  })();
  return true;
});
