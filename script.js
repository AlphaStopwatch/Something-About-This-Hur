const START_TIME_UTC = Date.UTC(2026, 9, 29, 0, 30, 0);
const ZERO_PARTS = { days: '000000', hours: '00', minutes: '00', seconds: '00' };

const elements = {
  days: document.getElementById('daysValue'),
  hours: document.getElementById('hoursValue'),
  minutes: document.getElementById('minutesValue'),
  seconds: document.getElementById('secondsValue'),
  syncStatus: document.getElementById('syncStatus'),
  srStatus: document.getElementById('srStatus')
};

const state = {
  offsetMs: 0,
  lastSyncLabel: 'Offline estimate • local device time',
  refreshTimer: null,
  lastDisplayedText: ''
};

function formatPart(value, minimumLength) {
  return String(value).padStart(minimumLength, '0');
}

function getCurrentTimeMs() {
  return Date.now() + state.offsetMs;
}

function getElapsedMs() {
  const now = getCurrentTimeMs();
  return Math.max(0, now - START_TIME_UTC);
}

function formatElapsedMs(elapsedMs) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const remainder = totalSeconds % 86400;
  const hours = Math.floor(remainder / 3600);
  const minutes = Math.floor((remainder % 3600) / 60);
  const seconds = remainder % 60;

  return {
    days: formatPart(days, 6),
    hours: formatPart(hours, 2),
    minutes: formatPart(minutes, 2),
    seconds: formatPart(seconds, 2)
  };
}

function updateDisplay(force = false) {
  const elapsedMs = getElapsedMs();
  const values = formatElapsedMs(elapsedMs);

  const nextText = `${values.days} ${values.hours} ${values.minutes} ${values.seconds}`;

  if (!force && nextText === state.lastDisplayedText) {
    return;
  }

  elements.days.textContent = values.days;
  elements.hours.textContent = values.hours;
  elements.minutes.textContent = values.minutes;
  elements.seconds.textContent = values.seconds;

  state.lastDisplayedText = nextText;

  const spoken = `${values.days} days, ${values.hours} hours, ${values.minutes} minutes, ${values.seconds} seconds elapsed`;
  elements.srStatus.textContent = spoken;
}

function scheduleNextRefresh() {
  if (state.refreshTimer) {
    clearTimeout(state.refreshTimer);
  }

  const now = new Date();
  const msUntilNextSecond = 1000 - (now.getTime() % 1000);

  state.refreshTimer = setTimeout(() => {
    updateDisplay(true);
    scheduleNextRefresh();
  }, msUntilNextSecond);
}

function setSyncStatus(label) {
  state.lastSyncLabel = label;
  elements.syncStatus.textContent = label;
}

async function syncTimeSource() {
  const timeoutMs = 4000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
      cache: 'no-store',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const iso = payload.utc_datetime || payload.datetime;

    if (!iso || Number.isNaN(Date.parse(iso))) {
      throw new Error('Missing valid utc_datetime');
    }

    const serverTime = Date.parse(iso);
    const localNow = Date.now();
    state.offsetMs = serverTime - localNow;
    setSyncStatus('Synchronized • worldtimeapi.org');
    return true;
  } catch (error) {
    state.offsetMs = 0;
    setSyncStatus('Offline estimate • local device time');
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    return;
  }

  updateDisplay(true);
  syncTimeSource();
}

document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('online', () => syncTimeSource());
window.addEventListener('offline', () => setSyncStatus('Offline estimate • local device time'));

(async function init() {
  updateDisplay(true);
  await syncTimeSource();
  scheduleNextRefresh();
  window.addEventListener('resize', () => updateDisplay(true));
})();

window.__jannatiStopwatch = {
  START_TIME_UTC,
  getElapsedMs,
  formatElapsedMs,
  getCurrentTimeMs,
  syncTimeSource
};

