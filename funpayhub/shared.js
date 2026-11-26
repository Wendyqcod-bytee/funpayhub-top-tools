// Общие настройки по умолчанию + хелперы (подключается в background, popup и content)
const FP_DEFAULTS = {
  autoRaise: false,
  raiseIntervalHours: 4,
  raiseCategories: [], // пусто = все категории
  notifyMessages: true,
  notifyOrders: true,
  sendInstantly: false,
  ordersStats: true,
  welcomeEnabled: true,
  tgEnabled: false,
  tgToken: '',
  tgChatId: '',
  signature: '',
  signatureEnabled: false,
  accent: '#e8590c',
  effectSnow: false,
  slashEnabled: true,
  blacklist: [],
  notes: [],
  goals: [],
  feePercent: 10,
  rates: { USD: 0, EUR: 0, UAH: 0 },
  templates: [
    { title: 'Приветствие', text: 'Здравствуйте, {buyer}! Чем могу помочь?' },
    { title: 'Секунду', text: 'Одну минуту, уже проверяю.' },
    { title: 'Выдача', text: 'Спасибо за покупку, {buyer}! Всё выдано. Если всё в порядке, подтвердите, пожалуйста, заказ и оставьте отзыв ⭐' },
    { title: 'Нет в наличии', text: 'К сожалению, сейчас этого нет в наличии. Могу предложить похожий вариант.' }
  ]
};

const fpSlug = (title) => String(title || '').toLowerCase().trim().replace(/\s+/g, '-');

async function fpGetSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return { ...FP_DEFAULTS, ...(settings || {}) };
}

async function fpSetSettings(patch) {
  const cur = await fpGetSettings();
  const next = { ...cur, ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}
