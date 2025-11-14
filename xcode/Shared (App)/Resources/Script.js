function getVariant(key) {
  const tpl = document.getElementById('i18n-variants');
  if (!tpl) return null;
  const el = tpl.content.querySelector(`[data-key="${key}"]`);
  return el ? el.textContent : null;
}

function show(platform, enabled, useSettingsInsteadOfPreferences) {
  document.body.classList.add(`platform-${platform}`);

  if (useSettingsInsteadOfPreferences) {
    const on = getVariant('macOnSettings');
    const off = getVariant('macOffSettings');
    const unk = getVariant('macUnknownSettings');
    const btn = getVariant('openSettingsBtn');

    if (on)   document.querySelector('.platform-mac.state-on').innerText = on;
    if (off)  document.querySelector('.platform-mac.state-off').innerText = off;
    if (unk)  document.querySelector('.platform-mac.state-unknown').innerText = unk;
    if (btn)  document.querySelector('.platform-mac.open-preferences').innerText = btn;
  }

  if (typeof enabled === 'boolean') {
    document.body.classList.toggle('state-on', enabled);
    document.body.classList.toggle('state-off', !enabled);
  } else {
    document.body.classList.remove('state-on', 'state-off');
  }
}

function openPreferences() {
  webkit.messageHandlers.controller.postMessage('open-preferences');
}

document.querySelector('button.open-preferences').addEventListener('click', openPreferences);
