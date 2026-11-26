// FunpayHub: тяжёлая панель. Подгружается из gui.js только при первом открытии (через background -> scripting).
(() => {
  'use strict';
  if (window.top !== window.self || globalThis.__fphPanel) return;

  /* ---------- иконки ---------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    general: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    accounts: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.3c2 .7 3.5 2.4 3.5 5.7"/>',
    needs: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    slash: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 10l3 2-3 2M12 15h5"/>',
    telegram: '<path d="M21.5 3.5L2.5 10.8l6.2 2.4 2.3 6.8 3.3-4.3 4.9 3.6z"/>',
    public: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6"/>',
    custom: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2-.5-1 0-2.5 1.5-2.5H18a3 3 0 003-3c0-5-4-10.5-9-10.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    effects: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    chat: '<path d="M4 5h12v8H9l-3 3v-3H4z"/><path d="M18 9h2v8h-2v3l-3-3h-5v-2"/>',
    templates: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    autoreply: '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13v1M15 13v1M9 17h6"/>',
    autodeliver: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    lots: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11h14V8M10 12h4"/>',
    raise: '<path d="M12 3c3 2 5 5 5 9l-2 3H9l-2-3c0-4 2-7 5-9z"/><circle cx="12" cy="10" r="1.5"/><path d="M9 15l-2 4 3-1M15 15l2 4-3-1"/>',
    audit: '<path d="M4 20V10M10 20V4M16 20v-8"/><circle cx="18" cy="17" r="3"/><path d="M20 19l2 2"/>',
    blacklist: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    piggy: '<path d="M5 12c0-3 3-5 7-5h3l2-2v3.5c1 .8 2 2 2 3.5s-1 2.5-2 3v3h-3v-2h-4v2H6v-3c-.6-.6-1-1.5-1-2.5z"/><circle cx="15" cy="11" r=".8"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2M16 12v4"/>',
    currency: '<path d="M20 8a8 8 0 00-14-2M4 4v4h4M4 16a8 8 0 0014 2M20 20v-4h-4"/><path d="M13.5 9.5h-2.5a1.5 1.5 0 000 3h2a1.5 1.5 0 010 3H10.5M12 8v1.5M12 15.5V17"/>',
    notes: '<path d="M4 6h12M4 11h8M4 16h5"/><path d="M14 18l1-3 6-6 2 2-6 6z"/>',
    settings: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3 3 7 3s7-1.3 7-3v-6"/>'
  };
  const ico = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  const SECTIONS = [
    { t: '', items: [['general', 'Общие'], ['accounts', 'Аккаунты'], ['needs', 'Что тебе нужно'], ['slash', 'Слэш-команды'], ['telegram', 'Telegram', 1]] },
    { t: 'Эксклюзив', items: [['public', 'Это увидят все', 1]] },
    { t: 'Интерфейс', items: [['custom', 'Кастомизация'], ['effects', 'Эффекты']] },
    { t: 'Чат и продажи', items: [['chat', 'Общий чат'], ['templates', 'Шаблоны'], ['autoreply', 'Авто-ответы'], ['autodeliver', 'Авто-выдача']] },
    { t: 'Торговля', items: [['lots', 'Лоты'], ['raise', 'Авто-поднятие'], ['audit', 'ИИ-аудит'], ['blacklist', 'Чёрный список']] },
    { t: 'Финансы', items: [['piggy', 'Копилки'], ['calc', 'Калькулятор'], ['currency', 'Валюты', 1]] },
    { t: 'Прочее', items: [['notes', 'Заметки'], ['settings', 'Настройки']] }
  ];
  const LABELS = {};
  SECTIONS.forEach((s) => s.items.forEach(([id, l]) => (LABELS[id] = l)));

  /* ---------- утилиты ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const debounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };
  const num = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const money = (n) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  function fmtLeft(ms) {
    const m = Math.ceil(ms / 60000);
    const h = Math.floor(m / 60);
    return h ? `${h} ч ${m % 60} мин` : `${m} мин`;
  }

  let S = { ...FP_DEFAULTS };
  let ST = {};
  let cur = 'general';
  let isOpen = false;
  let isMin = false;
  let host = null, root = null, wrap = null, panel = null, side = null, nav = null, body = null, crumb = null, minBtn = null, splash = null, toastEl = null;

  async function load() {
    S = await fpGetSettings();
    ST = (await chrome.storage.local.get('state')).state || {};
  }
  async function save(patch) {
    S = await fpSetSettings(patch);
    toast('Сохранено');
  }

  /* ---------- акцент ---------- */
  function applyAccent() {
    if (wrap) wrap.style.setProperty('--acc', S.accent || '#e8590c');
  }

  /* ---------- оболочка (Shadow DOM, чтобы стили FunPay не мешали) ---------- */
  const CSS = `
:host{all:initial}
*{box-sizing:border-box}
button{font:inherit;color:inherit}
[hidden]{display:none!important}
.wrap{position:fixed;inset:0;z-index:2147483000;display:none;--acc:#e8590c}
.wrap.open{display:block;background:rgba(7,9,15,.6);animation:fade .18s ease-out}
.wrap.min{background:none;pointer-events:none;animation:none}
.panel{position:fixed;left:50%;top:50%;translate:-50% -50%;width:min(920px,calc(100vw - 32px));height:min(660px,calc(100vh - 48px));display:grid;grid-template-columns:208px 1fr;pointer-events:auto;contain:layout style paint;background:#1b1c23;color:#e9e9ee;border:1px solid rgba(255,255,255,.08);border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.65);font:13px/1.45 "Segoe UI",system-ui,-apple-system,sans-serif;overflow:hidden;animation:pop .24s cubic-bezier(.2,.8,.2,1)}
.panel::before{content:"";position:absolute;inset:0 0 auto 0;height:2px;z-index:4;background:linear-gradient(90deg,transparent,var(--acc),transparent)}
.panel.min{translate:none;left:auto;top:auto;right:18px;bottom:18px;width:270px;height:auto;grid-template-columns:1fr;border-radius:14px;animation:pop .2s ease-out}
.panel.min .side,.panel.min .body,.panel.min .toast{display:none}
.panel.min .top{border-bottom:0;padding:10px 12px 10px 14px}
@keyframes fade{from{opacity:0}}
@keyframes pop{from{opacity:0;transform:translateY(12px) scale(.96)}}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

.side{position:relative;display:flex;flex-direction:column;background:#16171c;overflow-y:auto;padding:12px 10px 0;border-right:1px solid rgba(255,255,255,.06);scrollbar-width:thin;scrollbar-color:#34343e transparent}
.sbox{position:relative;margin:2px 2px 4px}
.sbox svg{position:absolute;left:10px;top:50%;translate:0 -50%;width:15px;height:15px;color:#7d7d89;pointer-events:none}
.srch{width:100%;background:#1f2027;border:1px solid #2c2d36;border-radius:10px;padding:8px 10px 8px 32px;color:#f2f2f5;font:inherit}
.srch::placeholder{color:#7d7d89}
.sec{margin:16px 6px 6px;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7d7d89}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:74px;padding:10px 2px;border:0;border-radius:11px;background:transparent;cursor:pointer;font-weight:700;font-size:11.5px;line-height:1.2;text-align:center;overflow-wrap:anywhere;transition:background .12s}
.tile svg{width:24px;height:24px;flex:none;transition:color .12s}
.tile:hover{background:#22232a}
.tile.on{background:#2b2b35;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.tile.on svg{color:var(--acc)}
.tile.wide{grid-column:1/-1;flex-direction:row;min-height:46px;gap:10px}
.tile.wide svg{width:18px;height:18px}
.foot{position:sticky;bottom:0;margin:auto -10px 0;padding:10px 16px 12px;display:flex;align-items:center;gap:8px;background:#16171c;border-top:1px solid rgba(255,255,255,.06);font-size:12px;color:#9a9aa6;margin-top:auto}
.foot span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.foot em{margin-left:auto;font-style:normal;opacity:.65}
.dot{flex:none;width:8px;height:8px;border-radius:50%;background:#6b6b78}
.dot.ok{background:#4ade80;box-shadow:0 0 8px #4ade80}
.dot.bad{background:#f87171}
.tile:focus-visible,.btn:focus-visible,a:focus-visible,.cb:focus-visible,.srch:focus-visible{outline:2px solid var(--acc);outline-offset:2px}

.main{display:flex;flex-direction:column;min-width:0;min-height:0;background:radial-gradient(520px 200px at 90% -60px,color-mix(in srgb,var(--acc) 15%,transparent),transparent)}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 16px 13px 18px;border-bottom:1px solid rgba(255,255,255,.06)}
.top h1{display:flex;align-items:center;margin:0;font-size:16px;font-weight:700}
.top h1 span.logo{width:26px;height:26px;margin-right:10px;border-radius:8px;display:grid;place-items:center;font-size:11px;color:#fff;background:linear-gradient(135deg,var(--acc),color-mix(in srgb,var(--acc) 55%,#000))}
.top h1 span#crumb{color:#8b8b97;font-weight:500;font-size:13px;margin-left:6px}
.ctl{display:flex;gap:6px}
.cb{width:28px;height:28px;border:0;border-radius:8px;background:#2a2a32;color:#c9c9d3;display:grid;place-items:center;cursor:pointer;transition:background .12s,color .12s}
.cb:hover{background:#363640;color:#fff}
.cb.close:hover{background:#e5484d;color:#fff}
.cb svg{width:14px;height:14px}
.body{padding:16px 18px 24px;overflow-y:auto;flex:1;scrollbar-width:thin;scrollbar-color:#34343e transparent}
.body>*{animation:rise .22s both}
.body>:nth-child(2){animation-delay:.03s}.body>:nth-child(3){animation-delay:.06s}.body>:nth-child(n+4){animation-delay:.09s}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
@media (max-width:760px){.stats{grid-template-columns:1fr 1fr}.panel{grid-template-columns:168px 1fr}}
.stat{background:linear-gradient(160deg,#292a34,#20212a);border:1px solid #30313b;border-radius:12px;padding:12px}
.stat small{color:#9a9aa6}
.stat b{display:block;font-size:21px;margin-top:2px}
.card{background:#22232b;border:1px solid #2f303a;border-radius:12px;padding:14px;margin-bottom:12px}
.card>b{font-size:13.5px}
.row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.row.gap{margin-top:12px;justify-content:flex-start}
.sws{padding:7px 0;cursor:pointer}
.sws b{display:block;font-weight:600}
.muted{color:#9a9aa6}
small{display:block;font-size:12px}
.mt{margin-top:10px}
label.f{display:block;margin-top:10px;font-size:12px;color:#9a9aa6}
label.f>input,label.f>textarea,label.f>select{margin-top:4px}
input[type=text],input[type=number],input[type=password],textarea,select{width:100%;background:#16171c;border:1px solid #34353f;color:#f2f2f5;border-radius:8px;padding:8px 10px;font:inherit}
textarea{resize:vertical;min-height:70px}
input:focus,textarea:focus,select:focus{outline:2px solid var(--acc);outline-offset:0;border-color:transparent}
.btn{background:#2c2d36;border:1px solid #3b3c47;border-radius:8px;padding:7px 13px;cursor:pointer;transition:filter .12s,border-color .12s}
.btn:hover{border-color:var(--acc)}
.btn.acc{background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 85%,#fff),var(--acc));border-color:var(--acc);color:#fff;font-weight:600}
.btn.acc:hover{filter:brightness(1.08)}
.btn:disabled{opacity:.6;cursor:default}
.sw{position:relative;flex:none;width:40px;height:23px}
.sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}
.sw i{position:absolute;inset:0;background:#44444f;border-radius:999px;transition:background .15s}
.sw i::after{content:"";position:absolute;top:3px;left:3px;width:17px;height:17px;background:#fff;border-radius:50%;transition:transform .15s}
.sw input:checked+i{background:var(--acc)}
.sw input:checked+i::after{transform:translateX(17px)}
.sw input:focus-visible+i{outline:2px solid var(--acc);outline-offset:2px}
.inl{color:#9a9aa6}
.inl select{width:auto;margin:0 4px}
.cats,.log{margin-top:10px;display:flex;flex-direction:column;gap:3px;max-height:150px;overflow-y:auto}
.cat{display:flex;align-items:center;gap:8px;padding:3px 0;cursor:pointer}
.log div{display:flex;gap:8px;font-size:12px}
.log time{color:#7d7d89;flex:none}
.ok{color:#4ade80}.warn{color:#fbbf24}.error,.bad{color:#f87171}
.tag{font-size:11.5px;padding:2px 9px;border-radius:999px;background:#2c2d36}
.tag.ok{background:rgba(74,222,128,.14)}.tag.bad{background:rgba(248,113,113,.14)}
.links{display:flex;flex-wrap:wrap;gap:8px}
.links a{color:#f2f2f5;background:#2c2d36;border:1px solid #3b3c47;border-radius:8px;padding:7px 13px;text-decoration:none}
.links a:hover{border-color:var(--acc)}
.needs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.need{text-align:left;background:#22232b;border:1px solid #2f303a;border-radius:12px;padding:12px;cursor:pointer;transition:border-color .12s}
.need:hover{border-color:var(--acc)}
.need b{display:block}
.cmd{display:flex;gap:10px;align-items:baseline;padding:5px 0;border-top:1px solid #2f303a}
.cmd:first-child{border-top:0}
code{background:#16171c;border-radius:5px;padding:1px 6px;color:var(--acc)}
.swatches{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center}
.sq{width:32px;height:32px;border-radius:9px;border:2px solid transparent;cursor:pointer;padding:0}
.sq.on{border-color:#fff}
input[type=color]{width:42px;height:32px;padding:0;border:0;background:none;cursor:pointer}
.tpl{border-top:1px solid #2f303a;padding:10px 0}
.tpl:first-of-type{border-top:0;padding-top:0}
.tpl .row input{flex:1}
.bar{height:8px;background:#16171c;border-radius:999px;overflow:hidden;margin:10px 0}
.bar i{display:block;height:100%;background:var(--acc);transition:width .2s}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end}
.big{font-size:20px;font-weight:700;margin-top:4px}
.soon{text-align:center;padding:30px 16px}
.soon .ic{width:52px;height:52px;margin:0 auto 10px;color:var(--acc)}
.soon .ic svg{width:100%;height:100%}
.bl{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid #2f303a}
.bl:first-child{border-top:0}

.toast{position:absolute;left:calc(50% + 104px);bottom:18px;z-index:8;translate:-50% 0;background:#2b2c36;border:1px solid #3b3c47;border-radius:999px;padding:7px 16px;font-size:12.5px;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .18s,transform .18s}
.toast.on{opacity:1;transform:none}

.splash{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;padding:clamp(26px,7vh,52px) 24px 22px;color:#fff;text-align:center;cursor:pointer;background:#1a2030 center/cover no-repeat;transition:opacity .5s ease,transform .5s ease}
.splash.out{opacity:0;transform:scale(1.03);pointer-events:none}
.sp-date{font-size:17px;font-weight:600;text-shadow:0 1px 8px rgba(0,0,0,.45);animation:rise .5s both}
.sp-time{font-size:clamp(72px,17vh,112px);font-weight:600;letter-spacing:-.03em;line-height:1.02;font-variant-numeric:tabular-nums;text-shadow:0 2px 20px rgba(0,0,0,.4);animation:rise .55s .05s both}
.sp-hello{margin-top:auto;font-size:19px;font-weight:500;line-height:1.3;text-shadow:0 1px 10px rgba(0,0,0,.55);animation:rise .6s .2s both}
.sp-hello b{display:block;font-size:32px;font-weight:700;letter-spacing:-.01em}
.sp-foot{margin-top:18px;display:flex;flex-direction:column;align-items:center;gap:12px;font-size:12.5px;opacity:.9;text-shadow:0 1px 6px rgba(0,0,0,.5)}
.sp-foot i{width:134px;height:5px;border-radius:3px;background:#fff;opacity:.85}
`;

  const MIN_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>';
  const RESTORE_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>';
  const X_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function build() {
    if (host) return;
    host = document.createElement('div');
    host.id = 'fph-root';
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>
<div class="wrap" id="wrap"><div class="panel" role="dialog" aria-modal="true" aria-label="FunpayHub">
  <aside class="side" id="side">
    <div class="sbox">${ico('search')}<input class="srch" id="srch" type="text" placeholder="Поиск по разделам…" autocomplete="off" aria-label="Поиск по разделам"></div>
    <nav id="nav"></nav>
    <div class="foot"><i class="dot" id="dot"></i><span id="who">FunPay</span><em>v${esc(chrome.runtime.getManifest().version)}</em></div>
  </aside>
  <section class="main">
    <div class="top"><h1><span class="logo">▲</span><b>FunpayHub</b><span id="crumb"></span></h1>
      <div class="ctl"><button class="cb" id="min" title="Свернуть" aria-label="Свернуть">${MIN_ICO}</button><button class="cb close" id="cls" title="Закрыть" aria-label="Закрыть">${X_ICO}</button></div></div>
    <div class="body" id="body"></div>
  </section>
  <div class="toast" id="toast" role="status"></div>
  <div class="splash" id="splash" hidden>
    <div class="sp-date" id="spd"></div>
    <div class="sp-time" id="spt"></div>
    <div class="sp-hello">Добро пожаловать на<b>FunpayHub</b></div>
    <div class="sp-foot"><span>Нажмите, чтобы продолжить</span><i></i></div>
  </div>
</div></div>`;
    wrap = root.getElementById('wrap');
    panel = root.querySelector('.panel');
    side = root.getElementById('side');
    nav = root.getElementById('nav');
    body = root.getElementById('body');
    crumb = root.getElementById('crumb');
    minBtn = root.getElementById('min');
    splash = root.getElementById('splash');
    toastEl = root.getElementById('toast');
    splash.style.backgroundImage = `linear-gradient(rgba(10,14,24,.22),rgba(10,14,24,.62)),url("${chrome.runtime.getURL('assets/welcome.jpg')}")`;

    nav.innerHTML = SECTIONS.map(
      (sec) =>
        `<div class="s">${sec.t ? `<div class="sec">${sec.t}</div>` : ''}<div class="grid">${sec.items
          .map(([id, label, wide]) => `<button class="tile${wide ? ' wide' : ''}" data-id="${id}" data-l="${label.toLowerCase()}">${ico(id)}<span>${label}</span></button>`)
          .join('')}</div></div>`
    ).join('');
    // делегирование: один обработчик на всё меню
    nav.addEventListener('click', (e) => {
      const t = e.target.closest('.tile');
      if (t) show(t.dataset.id);
    });
    const srch = root.getElementById('srch');
    srch.addEventListener('input', () => {
      const q = srch.value.trim().toLowerCase();
      nav.querySelectorAll('.s').forEach((s) => {
        let any = false;
        s.querySelectorAll('.tile').forEach((t) => {
          const m = !q || t.dataset.l.includes(q);
          t.hidden = !m;
          if (m) any = true;
        });
        s.hidden = !any;
      });
    });
    srch.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.stopPropagation();
      const first = nav.querySelector('.tile:not([hidden])');
      if (first) show(first.dataset.id);
    });
    root.getElementById('cls').addEventListener('click', close);
    minBtn.addEventListener('click', () => setMin(!isMin));
    splash.addEventListener('click', hideSplash);
    wrap.addEventListener('mousedown', (e) => {
      if (e.target === wrap) close();
    });
    document.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') close();
      else if ((e.key === 'Enter' || e.key === ' ') && !splash.hidden && !splash.classList.contains('out')) {
        e.preventDefault();
        hideSplash();
      }
    });
    applyAccent();
  }

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove('on'), 1400);
  }

  function setMin(v) {
    isMin = v;
    panel.classList.toggle('min', v);
    wrap.classList.toggle('min', v);
    minBtn.innerHTML = v ? RESTORE_ICO : MIN_ICO;
    minBtn.title = minBtn.ariaLabel = v ? 'Развернуть' : 'Свернуть';
    crumb.hidden = v;
    if (v) hideSplash();
  }

  /* ---------- приветственный экран в стиле iPhone ---------- */
  let spTimer = 0;
  let spClock = 0;
  function showSplash() {
    if (!S.welcomeEnabled) {
      splash.hidden = true;
      return;
    }
    const t = root.getElementById('spt');
    const d = root.getElementById('spd');
    const upd = () => {
      const now = new Date();
      t.textContent = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const ds = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
      d.textContent = ds.charAt(0).toUpperCase() + ds.slice(1);
    };
    upd();
    splash.classList.remove('out');
    splash.hidden = false;
    clearInterval(spClock);
    spClock = setInterval(upd, 1000);
    clearTimeout(spTimer);
    spTimer = setTimeout(hideSplash, 2600);
  }
  function hideSplash() {
    clearTimeout(spTimer);
    clearInterval(spClock);
    if (!splash || splash.hidden) return;
    splash.classList.add('out');
    setTimeout(() => {
      if (splash.classList.contains('out')) splash.hidden = true;
    }, 520);
  }

  /* ---------- вкладки ---------- */
  const RENDER = {};
  const swRow = (key, label, desc) =>
    `<label class="row sws"><span><b>${label}</b>${desc ? `<small class="muted">${desc}</small>` : ''}</span><span class="sw"><input type="checkbox" data-key="${key}" ${S[key] ? 'checked' : ''}><i></i></span></label>`;
  function bindKeys(b) {
    b.querySelectorAll('input[type=checkbox][data-key]').forEach((el) => el.addEventListener('change', () => save({ [el.dataset.key]: el.checked })));
  }
  function soon(b, id, text) {
    b.innerHTML = `<div class="card soon"><div class="ic">${ico(id)}</div><b>В разработке</b><p class="muted">${text}</p></div>`;
  }

  RENDER.general = (b) => {
    const c = ST.counters || {};
    const next = !S.autoRaise ? 'выкл.' : !ST.nextRaiseAt ? '—' : ST.nextRaiseAt - Date.now() <= 0 ? 'сейчас' : fmtLeft(ST.nextRaiseAt - Date.now());
    b.innerHTML = `<div class="stats">
      <div class="stat"><small>Чаты (непрочитанные)</small><b>${c.chat == null ? '—' : c.chat}</b></div>
      <div class="stat"><small>Заказы в работе</small><b>${c.orders == null ? '—' : c.orders}</b></div>
      <div class="stat"><small>Поднятие</small><b>${next}</b></div>
      <div class="stat"><small>Категорий</small><b>${(ST.categories || []).length}</b></div></div>
    <div class="card">
      ${swRow('notifyMessages', 'Уведомления о сообщениях', 'Уведомление браузера о новых чатах')}
      ${swRow('notifyOrders', 'Уведомления о заказах', 'О новых заказах в работе')}
      ${swRow('ordersStats', 'Статистика на странице «Продажи»', 'Суммы по статусам над списком заказов')}
      ${swRow('sendInstantly', 'Отправлять быстрые ответы сразу', 'Иначе текст только вставляется в поле ввода')}
      ${swRow('welcomeEnabled', 'Приветственный экран', 'Время и «Добро пожаловать на FunpayHub» при открытии панели')}
    </div>`;
    bindKeys(b);
  };

  RENDER.accounts = (b) => {
    const id = ST.userId;
    const status = ST.authOk === true ? ['ok', 'подключён'] : ST.authOk === false ? ['bad', 'не авторизован'] : ['', 'нет данных'];
    b.innerHTML = `<div class="card"><div class="row"><div><b>${esc(ST.username || 'Аккаунт не определён')}</b><small class="muted">${id ? 'ID ' + esc(id) : 'Войдите на funpay.com'}</small></div><span class="tag ${status[0]}">${status[1]}</span></div></div>` +
      (id ? `<div class="links"><a href="/users/${esc(id)}/">Профиль</a><a href="/orders/trade">Продажи</a><a href="/orders/">Покупки</a><a href="/account/balance">Баланс</a></div>` : '');
  };

  RENDER.needs = (b) => {
    const cards = [
      ['raise', 'Поднимать лоты', 'Автоподнятие по таймеру'],
      ['templates', 'Отвечать быстрее', 'Шаблоны и слэш-команды'],
      ['telegram', 'Заказы в Telegram', 'Уведомления в мессенджер'],
      ['calc', 'Считать прибыль', 'Цена с учётом комиссии'],
      ['blacklist', 'Беречь нервы', 'Чёрный список покупателей'],
      ['notes', 'Всё записать', 'Заметки под рукой']
    ];
    b.innerHTML = `<div class="needs">${cards.map(([id, t, d]) => `<button class="need" data-go="${id}"><b>${t}</b><small class="muted">${d}</small></button>`).join('')}</div>`;
    b.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', () => show(el.dataset.go)));
  };

  RENDER.slash = (b) => {
    const list = (S.templates || []).filter((t) => t.title);
    b.innerHTML = `<div class="card">${swRow('slashEnabled', 'Слэш-команды в чате', 'Введите /команду и пробел в поле чата — подставится текст шаблона')}</div>
      <div class="card"><b>Доступные команды</b><div class="mt">${
        list.length ? list.map((t) => `<div class="cmd"><code>/${esc(fpSlug(t.title))}</code><span class="muted">${esc(t.text.slice(0, 80))}</span></div>`).join('') : '<span class="muted">Шаблонов пока нет</span>'
      }</div><small class="muted mt">Команды берутся из названий шаблонов — меняются на вкладке «Шаблоны».</small></div>`;
    bindKeys(b);
  };

  RENDER.telegram = (b) => {
    b.innerHTML = `<div class="card">${swRow('tgEnabled', 'Дублировать уведомления в Telegram', 'О новых сообщениях и заказах')}
      <label class="f">Токен бота<input type="password" id="tgt" value="${esc(S.tgToken)}" placeholder="123456:ABC-DEF…" autocomplete="off"></label>
      <label class="f">Chat ID<input type="text" id="tgc" value="${esc(S.tgChatId)}" placeholder="например 123456789"></label>
      <div class="row gap"><button class="btn acc" id="tgs">Сохранить</button><button class="btn" id="tgx">Отправить тест</button><span id="tgr" class="muted"></span></div></div>
      <div class="card"><small class="muted">1) Создайте бота у @BotFather и скопируйте токен.<br>2) Напишите своему боту /start.<br>3) Узнайте свой Chat ID, например у @userinfobot.<br>Токен хранится только в браузере (chrome.storage).</small></div>`;
    bindKeys(b);
    const out = b.querySelector('#tgr');
    const grab = () => ({ tgToken: b.querySelector('#tgt').value.trim(), tgChatId: b.querySelector('#tgc').value.trim() });
    b.querySelector('#tgs').addEventListener('click', async () => {
      await save(grab());
      out.textContent = 'Сохранено';
    });
    b.querySelector('#tgx').addEventListener('click', async () => {
      await save(grab());
      out.textContent = 'Отправляю…';
      const r = await chrome.runtime.sendMessage({ type: 'tgTest' });
      out.innerHTML = r && r.ok ? '<span class="ok">Отправлено ✓</span>' : `<span class="bad">${esc((r && r.error) || 'ошибка')}</span>`;
    });
  };

  RENDER.public = (b) => {
    b.innerHTML = `<div class="card">${swRow('signatureEnabled', 'Подпись к быстрым ответам', 'Добавляется в конец каждого шаблона — её увидят покупатели')}
      <label class="f">Текст подписи<textarea id="sig" placeholder="Например: Спасибо, что выбрали меня! 🙌">${esc(S.signature)}</textarea></label></div>`;
    bindKeys(b);
    b.querySelector('#sig').addEventListener('input', debounce((e) => save({ signature: e.target.value }), 300));
  };

  RENDER.custom = (b) => {
    const colors = ['#e8590c', '#2f7df6', '#16a34a', '#9333ea', '#e11d48', '#0891b2'];
    b.innerHTML = `<div class="card"><b>Акцентный цвет</b><small class="muted">Кнопки, переключатели и значок в шапке</small>
      <div class="swatches">${colors.map((c) => `<button class="sq ${c === S.accent ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<input type="color" id="cc" value="${esc(S.accent)}" aria-label="Свой цвет"></div></div>`;
    const set = async (c) => {
      await save({ accent: c });
      b.querySelectorAll('.sq').forEach((s) => s.classList.toggle('on', s.dataset.c === c));
    };
    b.querySelectorAll('.sq').forEach((s) => s.addEventListener('click', () => set(s.dataset.c)));
    b.querySelector('#cc').addEventListener('input', (e) => set(e.target.value));
  };

  RENDER.effects = (b) => {
    b.innerHTML = `<div class="card">${swRow('effectSnow', 'Снегопад на сайте', 'Лёгкая анимация поверх страницы (не мешает кликам)')}</div>`;
    bindKeys(b);
  };

  RENDER.chat = (b) => {
    b.innerHTML = `<div class="card"><b>Общий чат FunPay</b><p class="muted">Открыть общий чат сообщества в этой вкладке.</p><div class="links"><a href="/chat/?node=flood">Открыть общий чат</a></div></div>`;
  };

  RENDER.templates = (b) => {
    b.innerHTML = `<div class="card"><small class="muted">Кнопки появятся над полем ввода в чате. <code>{buyer}</code> — ник покупателя.</small><div id="tl" class="mt"></div><button class="btn mt" id="ta">+ Добавить шаблон</button></div>`;
    const box = b.querySelector('#tl');
    const addRow = (t) => {
      const d = document.createElement('div');
      d.className = 'tpl';
      d.innerHTML = `<div class="row"><input type="text" class="tt" placeholder="Название кнопки" value="${esc(t.title)}"><button class="btn tx" title="Удалить">✕</button></div><textarea class="tv mt" rows="3" placeholder="Текст сообщения">${esc(t.text)}</textarea>`;
      box.appendChild(d);
    };
    (S.templates || []).forEach(addRow);
    const collect = () =>
      [...box.querySelectorAll('.tpl')].map((d) => ({ title: d.querySelector('.tt').value.trim(), text: d.querySelector('.tv').value })).filter((t) => t.title || t.text);
    const saveSoon = debounce(() => save({ templates: collect() }), 300);
    box.addEventListener('input', saveSoon);
    box.addEventListener('click', (e) => {
      if (e.target.classList.contains('tx')) {
        e.target.closest('.tpl').remove();
        saveSoon();
      }
    });
    b.querySelector('#ta').addEventListener('click', () => addRow({ title: '', text: '' }));
  };

  RENDER.autoreply = (b) => soon(b, 'autoreply', 'Автоматические ответы на входящие сообщения по ключевым словам. Пока доступны быстрые ответы и слэш-команды.');
  RENDER.autodeliver = (b) => soon(b, 'autodeliver', 'Автовыдача товара после оплаты заказа. Пока выдавайте вручную — быстрые ответы помогут сделать это за пару кликов.');
  RENDER.audit = (b) => soon(b, 'audit', 'ИИ-разбор ваших лотов: заголовки, описания, цены. Пока недоступно.');

  RENDER.lots = (b) => {
    const cats = ST.categories || [];
    b.innerHTML = `<div class="card"><div class="row"><b>Ваши категории</b><button class="btn" id="rc">Обновить список</button></div><div class="mt">${
      cats.length
        ? cats.map((c) => `<div class="bl"><span>${esc(c.name)}</span><a href="/lots/${esc(c.id)}/trade" style="color:var(--acc)">Открыть</a></div>`).join('')
        : '<span class="muted">Список пуст. Войдите на funpay.com и нажмите «Обновить список».</span>'
    }</div></div>`;
    b.querySelector('#rc').addEventListener('click', async (e) => {
      e.target.disabled = true;
      await chrome.runtime.sendMessage({ type: 'refreshCategories' });
    });
  };

  RENDER.raise = (b) => {
    const cats = ST.categories || [];
    const picked = S.raiseCategories || [];
    const logs = (ST.log || []).slice(0, 15);
    b.innerHTML = `<div class="card">${swRow('autoRaise', 'Автоподнятие лотов', '<span id="nx"></span>')}
      <div class="row gap"><button class="btn acc" id="rn">Поднять сейчас</button>
        <label class="inl">каждые <select id="iv">${[4, 5, 6, 8, 12].map((h) => `<option ${h === S.raiseIntervalHours ? 'selected' : ''}>${h}</option>`).join('')}</select> ч</label></div></div>
      <div class="card"><div class="row"><b>Категории</b><button class="btn" id="rc">Обновить</button></div><div class="cats" id="cl">${
        cats.length
          ? cats.map((c) => `<label class="cat"><input type="checkbox" data-id="${esc(c.id)}" ${!picked.length || picked.includes(c.id) ? 'checked' : ''}><span>${esc(c.name)}</span></label>`).join('')
          : '<span class="muted">Список пуст. Нажмите «Обновить».</span>'
      }</div></div>
      <div class="card"><b>Журнал</b><div class="log">${
        logs.length
          ? logs.map((l) => `<div><time>${new Date(l.t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</time><span class="${esc(l.level)}">${esc(l.msg)}</span></div>`).join('')
          : '<span class="muted">Пока пусто</span>'
      }</div></div>`;
    bindKeys(b);
    b.querySelector('#iv').addEventListener('change', (e) => save({ raiseIntervalHours: Number(e.target.value) }));
    b.querySelector('#rn').addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Поднимаю…';
      try {
        await chrome.runtime.sendMessage({ type: 'raiseNow' });
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Поднять сейчас';
      }
    });
    b.querySelector('#rc').addEventListener('click', async (e) => {
      e.target.disabled = true;
      await chrome.runtime.sendMessage({ type: 'refreshCategories' });
    });
    b.querySelector('#cl').addEventListener('change', () => {
      const boxes = [...b.querySelectorAll('#cl input')];
      const ids = boxes.filter((x) => x.checked).map((x) => x.dataset.id);
      save({ raiseCategories: ids.length === boxes.length ? [] : ids });
    });
    tickRaise();
    stopTick();
    tickT = setInterval(tickRaise, 1000);
  };
  function tickRaise() {
    const el = body.querySelector('#nx');
    if (!el) return;
    el.textContent = !S.autoRaise
      ? 'Выключено'
      : !ST.nextRaiseAt
      ? 'Первый запуск — в течение минуты'
      : ST.nextRaiseAt - Date.now() <= 0
      ? 'Следующее поднятие: сейчас'
      : 'Следующее поднятие: через ' + fmtLeft(ST.nextRaiseAt - Date.now());
  }
  let tickT = 0;
  function stopTick() {
    clearInterval(tickT);
    tickT = 0;
  }

  RENDER.blacklist = (b) => {
    const draw = () => {
      const list = S.blacklist || [];
      b.innerHTML = `<div class="card"><div class="row"><input type="text" id="bn" placeholder="Ник покупателя"><button class="btn acc" id="ba">Добавить</button></div>
        <small class="muted mt">В чате с таким покупателем появится предупреждение.</small></div>
        <div class="card">${list.length ? list.map((n, i) => `<div class="bl"><span>${esc(n)}</span><button class="btn" data-i="${i}">Убрать</button></div>`).join('') : '<span class="muted">Список пуст</span>'}</div>`;
      const add = async () => {
        const v = b.querySelector('#bn').value.trim();
        if (!v || list.some((n) => n.toLowerCase() === v.toLowerCase())) return;
        await save({ blacklist: [...list, v] });
        draw();
      };
      b.querySelector('#ba').addEventListener('click', add);
      b.querySelector('#bn').addEventListener('keydown', (e) => e.key === 'Enter' && add());
      b.querySelectorAll('[data-i]').forEach((el) =>
        el.addEventListener('click', async () => {
          await save({ blacklist: list.filter((_, i) => i !== Number(el.dataset.i)) });
          draw();
        })
      );
    };
    draw();
  };

  RENDER.piggy = (b) => {
    let goals = (S.goals || []).map((g) => ({ ...g }));
    const persist = debounce(() => save({ goals }), 300);
    const draw = () => {
      b.innerHTML = `<div class="card"><button class="btn acc" id="ga">+ Новая копилка</button></div>` +
        (goals.length
          ? goals
              .map((g, i) => {
                const p = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
                return `<div class="card goal" data-i="${i}"><div class="row"><input type="text" class="gn" value="${esc(g.name)}" placeholder="На что копим"><button class="btn gx" aria-label="Удалить">✕</button></div>
                  <div class="bar"><i style="width:${p}%"></i></div>
                  <div class="two"><label class="f">Накоплено<input type="number" class="gs" value="${g.saved}"></label><label class="f">Цель<input type="number" class="gt" value="${g.target}"></label></div>
                  <div class="big gp">${p}%</div></div>`;
              })
              .join('')
          : '<div class="muted">Копилок пока нет.</div>');
      b.querySelector('#ga').addEventListener('click', () => {
        goals.push({ name: '', target: 0, saved: 0 });
        persist();
        draw();
      });
      b.querySelectorAll('.goal').forEach((el) => {
        const g = goals[Number(el.dataset.i)];
        el.querySelector('.gx').addEventListener('click', () => {
          goals.splice(Number(el.dataset.i), 1);
          persist();
          draw();
        });
        el.addEventListener('input', () => {
          g.name = el.querySelector('.gn').value;
          g.saved = num(el.querySelector('.gs').value);
          g.target = num(el.querySelector('.gt').value);
          const p = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
          el.querySelector('.bar i').style.width = p + '%';
          el.querySelector('.gp').textContent = p + '%';
          persist();
        });
      });
    };
    draw();
  };

  RENDER.calc = (b) => {
    b.innerHTML = `<div class="card"><label class="f" style="margin-top:0">Комиссия, % <small class="muted">укажите свою (зависит от аккаунта и способа вывода)</small><input type="number" id="fee" step="any" value="${S.feePercent}"></label></div>
      <div class="card"><b>Цена → сколько получу</b><label class="f">Цена для покупателя<input type="number" id="p1" step="any" placeholder="0"></label><div class="big" id="o1">—</div></div>
      <div class="card"><b>Хочу получить → какую цену ставить</b><label class="f">Желаемая сумма<input type="number" id="p2" step="any" placeholder="0"></label><div class="big" id="o2">—</div></div>`;
    const fee = () => Math.min(99, Math.max(0, num(b.querySelector('#fee').value)));
    const calc = () => {
      const f = fee();
      const p1 = num(b.querySelector('#p1').value);
      const p2 = num(b.querySelector('#p2').value);
      b.querySelector('#o1').textContent = p1 ? money(p1 * (1 - f / 100)) : '—';
      b.querySelector('#o2').textContent = p2 ? money(Math.ceil((p2 / (1 - f / 100)) * 100) / 100) : '—';
    };
    b.addEventListener('input', calc);
    b.querySelector('#fee').addEventListener('input', debounce(() => save({ feePercent: fee() }), 300));
  };

  RENDER.currency = (b) => {
    const r = { RUB: 1, ...(S.rates || {}) };
    b.innerHTML = `<div class="card"><b>Курсы к рублю</b><small class="muted">Введите актуальные значения вручную: сколько ₽ стоит 1 единица</small>
      <div class="two"><label class="f">1 USD = ₽<input type="number" step="any" data-r="USD" value="${r.USD || ''}"></label><label class="f">1 EUR = ₽<input type="number" step="any" data-r="EUR" value="${r.EUR || ''}"></label></div>
      <div class="two"><label class="f">1 UAH = ₽<input type="number" step="any" data-r="UAH" value="${r.UAH || ''}"></label></div></div>
      <div class="card"><b>Конвертер</b><div class="two"><label class="f">Сумма<input type="number" step="any" id="am" placeholder="0"></label><label class="f">Валюта<select id="fr"><option>RUB</option><option>USD</option><option>EUR</option><option>UAH</option></select></label></div><div id="res" class="mt"></div></div>`;
    const conv = () => {
      const rates = { RUB: 1 };
      b.querySelectorAll('[data-r]').forEach((i) => (rates[i.dataset.r] = num(i.value)));
      const a = num(b.querySelector('#am').value);
      const from = b.querySelector('#fr').value;
      const rub = rates[from] ? a * rates[from] : 0;
      b.querySelector('#res').innerHTML = !a
        ? '<span class="muted">Введите сумму</span>'
        : ['RUB', 'USD', 'EUR', 'UAH'].map((c) => `<div class="bl"><span>${c}</span><b>${rates[c] ? money(rub / rates[c]) : '— (нет курса)'}</b></div>`).join('');
    };
    const persist = debounce(() => {
      const rates = {};
      b.querySelectorAll('[data-r]').forEach((i) => (rates[i.dataset.r] = num(i.value)));
      save({ rates });
    }, 300);
    b.addEventListener('input', () => {
      conv();
      persist();
    });
    conv();
  };

  RENDER.notes = (b) => {
    let notes = [...(S.notes || [])];
    const persist = debounce(() => save({ notes }), 300);
    const draw = () => {
      b.innerHTML = `<div class="card"><button class="btn acc" id="na">+ Новая заметка</button></div>` +
        (notes.length
          ? notes.map((n, i) => `<div class="card"><textarea data-i="${i}" rows="4" placeholder="Текст заметки">${esc(n)}</textarea><div class="row gap"><button class="btn" data-x="${i}">Удалить</button></div></div>`).join('')
          : '<div class="muted">Заметок пока нет.</div>');
      b.querySelector('#na').addEventListener('click', () => {
        notes.unshift('');
        persist();
        draw();
      });
      b.querySelectorAll('textarea').forEach((t) =>
        t.addEventListener('input', () => {
          notes[Number(t.dataset.i)] = t.value;
          persist();
        })
      );
      b.querySelectorAll('[data-x]').forEach((x) =>
        x.addEventListener('click', () => {
          notes.splice(Number(x.dataset.x), 1);
          persist();
          draw();
        })
      );
    };
    draw();
  };

  RENDER.settings = (b) => {
    b.innerHTML = `<div class="card"><b>Резервная копия</b><small class="muted">В копию входят шаблоны, заметки, копилки и токен Telegram — не отправляйте её посторонним.</small>
      <div class="row gap"><button class="btn acc" id="ex">Скопировать настройки</button></div>
      <label class="f">Импорт (вставьте JSON)<textarea id="im" placeholder="{ … }"></textarea></label>
      <div class="row gap"><button class="btn" id="imb">Импортировать</button><span id="st" class="muted"></span></div></div>
      <div class="card"><b>Сброс</b><small class="muted">Вернёт все настройки к значениям по умолчанию.</small><div class="row gap"><button class="btn" id="rs">Сбросить всё</button></div></div>`;
    const out = b.querySelector('#st');
    b.querySelector('#ex').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(S, null, 2));
        out.textContent = 'Скопировано в буфер обмена';
      } catch (e) {
        b.querySelector('#im').value = JSON.stringify(S, null, 2);
        out.textContent = 'Скопируйте текст из поля ниже';
      }
    });
    b.querySelector('#imb').addEventListener('click', async () => {
      try {
        const o = JSON.parse(b.querySelector('#im').value);
        if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('bad');
        await save(o);
        out.innerHTML = '<span class="ok">Импортировано ✓</span>';
      } catch (e) {
        out.innerHTML = '<span class="bad">Не удалось прочитать JSON</span>';
      }
    });
    b.querySelector('#rs').addEventListener('click', async () => {
      if (!confirm('Сбросить все настройки FunpayHub?')) return;
      await chrome.storage.local.set({ settings: FP_DEFAULTS });
      await load();
      applyAccent();
      out.textContent = 'Сброшено';
    });
  };

  /* ---------- показ ---------- */
  function updateFoot() {
    if (!host) return;
    root.getElementById('dot').className = 'dot ' + (ST.authOk === true ? 'ok' : ST.authOk === false ? 'bad' : '');
    root.getElementById('who').textContent = ST.username || (ST.authOk === false ? 'не авторизован' : 'FunPay');
  }
  async function show(id) {
    cur = id;
    stopTick();
    await load();
    if (!isOpen) return;
    nav.querySelectorAll('.tile').forEach((t) => t.classList.toggle('on', t.dataset.id === id));
    crumb.textContent = ' / ' + (LABELS[id] || '');
    body.innerHTML = '';
    body.scrollTop = 0;
    (RENDER[id] || (() => {}))(body);
    updateFoot();
  }
  function setBtnActive(on) {
    const b = document.getElementById('fph-open-btn');
    if (b) b.classList.toggle('active', on);
  }
  function open() {
    build();
    if (!host.isConnected) document.documentElement.appendChild(host);
    isOpen = true;
    wrap.classList.add('open');
    setBtnActive(true);
    applyAccent();
    setMin(false);
    showSplash();
    show(cur);
  }
  function close() {
    isOpen = false;
    stopTick();
    hideSplash();
    wrap.classList.remove('open');
    body.innerHTML = ''; // освобождаем память, пока панель закрыта
    setBtnActive(false);
  }
  function toggle() {
    if (!isOpen) open();
    else if (isMin) setMin(false);
    else close();
  }

  chrome.storage.onChanged.addListener((ch) => {
    if (ch.settings) {
      S = { ...FP_DEFAULTS, ...(ch.settings.newValue || {}) };
      applyAccent();
    }
    if (ch.state) {
      ST = ch.state.newValue || {};
      updateFoot();
      if (isOpen && !isMin && ['raise', 'lots', 'accounts', 'general'].includes(cur)) RENDER[cur](body);
    }
  });

  globalThis.__fphPanel = { open, close, toggle };
})();
