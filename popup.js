/**
 * Safe Image Format Converter — Popup Script
 *
 * Loads current settings from chrome.storage.local on every open.
 * Saves changes immediately. Shows rate prompt after 5 conversions.
 */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const settings = await chrome.storage.local.get({
    defaultFormat: 'png',
    jpgQuality: 85,
    conversionCount: 0,
    ratePromptDismissed: false
  });

  // --- Format Buttons ---
  const formatButtons = document.querySelectorAll('.format-btn');
  setActiveFormat(formatButtons, settings.defaultFormat);

  formatButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-format');
      setActiveFormat(formatButtons, format);
      chrome.storage.local.set({ defaultFormat: format });
    });
  });

  // --- Quality Slider ---
  const slider = document.getElementById('quality-slider');
  const qualityValue = document.getElementById('quality-value');

  slider.value = settings.jpgQuality;
  qualityValue.textContent = settings.jpgQuality + '%';

  slider.addEventListener('input', () => {
    const val = parseInt(slider.value, 10);
    qualityValue.textContent = val + '%';
    chrome.storage.local.set({ jpgQuality: val });
  });

  // --- Conversion Counter ---
  updateCounter(settings.conversionCount);

  // --- Rate Prompt ---
  const rateSection = document.getElementById('rate-section');
  const rateLink = document.getElementById('rate-link');
  const rateDismiss = document.getElementById('rate-dismiss');

  if (settings.conversionCount >= 5 && !settings.ratePromptDismissed) {
    rateSection.hidden = false;
  }

  rateLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Open Chrome Web Store listing using runtime ID for auto-resolution
    chrome.tabs.create({
      url: `https://chromewebstore.google.com/detail/${chrome.runtime.id}`
    });
  });

  rateDismiss.addEventListener('click', () => {
    rateSection.hidden = true;
    chrome.storage.local.set({ ratePromptDismissed: true });
  });
}

function setActiveFormat(buttons, activeFormat) {
  buttons.forEach((btn) => {
    const isActive = btn.getAttribute('data-format') === activeFormat;
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function updateCounter(count) {
  const counterText = document.getElementById('counter-text');
  const counterSection = counterText.closest('.counter-section');
  const label = count === 1 ? '1 image converted' : count + ' images converted';
  counterText.textContent = label;
  counterSection.setAttribute('aria-label', label);
}
