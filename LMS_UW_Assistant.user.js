// ==UserScript==
// @name         LMS UW Assistant
// @namespace    https://github.com/PashaKrch/lms-underwriting-tools
// @version      1.7
// @description  Combined LMS underwriting helper menu with optional UW modules.
// @author       Pavlo Korochenko
// @match        *://*/*
// @updateURL    https://raw.githubusercontent.com/PashaKrch/lms-underwriting-tools/main/LMS_UW_Assistant.user.js
// @downloadURL  https://raw.githubusercontent.com/PashaKrch/lms-underwriting-tools/main/LMS_UW_Assistant.user.js
// @connect      portal.decisionlogic.com
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  const APP = {
    id: 'lms-uw-assistant',
    menuId: 'lms-uw-assistant-menu-item',
    dropdownId: 'lms-uw-assistant-dropdown',
    styleId: 'lms-uw-assistant-style',
    storageKey: 'lms-uw-assistant-settings-v1',
    defaultSettings: {
      followupHelper: true,
      dlFollowupScan: true,
      notificationStatusChecker: true,
      tbwNotesDropdown: true,
      cssBronzeHighlighter: true,
      dlStatusChecker: true,
      militaryIncomeAlert: true
    },
    modules: [
      {
        key: 'followupHelper',
        name: 'UW Follow-Up Helper',
        note: 'Canned UW follow-ups + save to small notes'
      },
      {
        key: 'dlFollowupScan',
        name: 'DL Follow-Up Scanner',
        note: 'Pending Loans Need DL / IBV highlighter'
      },
      {
        key: 'notificationStatusChecker',
        name: 'Notification Status Checker',
        note: 'Adds loan/app status to Notifications'
      },
      {
        key: 'tbwNotesDropdown',
        name: 'TBW Notes Dropdown',
        note: 'Sales/UW TBW quick notes dropdown'
      },
      {
        key: 'cssBronzeHighlighter',
        name: 'CSS Bronze Highlighter',
        note: 'Highlights new-customer Bronze CSS cases'
      },
      {
        key: 'dlStatusChecker',
        name: 'DL Status Checker',
        note: 'Checks DecisionLogic follow-up statuses'
      },
      {
        key: 'militaryIncomeAlert',
        name: 'Military Income Alert',
        note: 'Popup when a credit/income label matches DOD/military pay patterns (CRP report)'
      }
    ]
  };

  const RELEASE_NOTES = {
    version: '1.7',
    storageKey: 'lms-uw-assistant-release-notes-seen-v1',
    title: '🛠️ LMS UW Assistant updated to v1.7',
    lines: [
      "What's new:",
      '• Refreshed menu/panel layout to match native LMS style',
      '• Added Military Income Alert (CRP report)'
    ]
  };

  function isLikelyLmsPageForReleaseNotes() {
    return (
      /\/plm\.net(?:\/|$)/i.test(window.location.href) ||
      Boolean(
        document.getElementById('TopMenu') ||
        document.getElementById('standardNote') ||
        document.getElementById('maincontent_NewNoteText') ||
        document.getElementById('table_alerts')
      )
    );
  }

  function getSeenReleaseVersion() {
    try {
      return localStorage.getItem(RELEASE_NOTES.storageKey) || '';
    } catch (_) {
      return '';
    }
  }

  function setSeenReleaseVersion() {
    try {
      localStorage.setItem(RELEASE_NOTES.storageKey, RELEASE_NOTES.version);
    } catch (_) {}
  }

  function showReleaseNotesIfNeeded() {
    if (!isLikelyLmsPageForReleaseNotes()) return;
    if (getSeenReleaseVersion() === RELEASE_NOTES.version) return;
    if (document.getElementById('lms-uw-assistant-release-notes-overlay')) return;

    setSeenReleaseVersion();

    const overlay = document.createElement('div');
    overlay.id = 'lms-uw-assistant-release-notes-overlay';
    overlay.style.cssText = `
      position:fixed;
      inset:0;
      width:100%;
      height:100%;
      background:rgba(0,0,0,0.45);
      z-index:999999;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family:Segoe UI,Tahoma,Arial,sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      width:420px;
      max-width:calc(100vw - 32px);
      box-sizing:border-box;
      background:#222;
      color:#fff;
      border-radius:10px;
      box-shadow:0 8px 24px rgba(0,0,0,0.55);
      padding:16px 20px;
      font-size:13px;
      line-height:1.45;
    `;

    const title = document.createElement('div');
    title.textContent = RELEASE_NOTES.title;
    title.style.cssText = `
      font-weight:700;
      font-size:14px;
      margin-bottom:10px;
      color:#fff;
      text-transform:uppercase;
      letter-spacing:.3px;
    `;

    const body = document.createElement('div');
    body.textContent = '\n' + RELEASE_NOTES.lines.join('\n');
    body.style.cssText = `
      white-space:pre-line;
      margin-bottom:16px;
      color:#f3f3f3;
    `;

    const actions = document.createElement('div');
    actions.style.cssText = 'text-align:center;';

    const ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = 'OK';
    ok.style.cssText = `
      min-width:78px;
      padding:6px 18px;
      border-radius:20px;
      border:1px solid #00bcd4;
      background:#111;
      color:#fff;
      cursor:pointer;
      font-size:12px;
      font-weight:700;
    `;

    ok.addEventListener('mouseenter', () => {
      ok.style.background = '#00bcd4';
    });

    ok.addEventListener('mouseleave', () => {
      ok.style.background = '#111';
    });

    ok.addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('mousedown', event => {
      if (event.target === overlay) overlay.remove();
    });

    actions.appendChild(ok);
    modal.append(title, body, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return fallback;
    }
  }

  function getSettings() {
    const saved = safeJsonParse(
      localStorage.getItem(APP.storageKey) || '{}',
      {}
    );

    return {
      ...APP.defaultSettings,
      ...saved
    };
  }

  function saveSettings(settings) {
    localStorage.setItem(
      APP.storageKey,
      JSON.stringify(settings)
    );
  }

  function isEnabled(key) {
    return Boolean(getSettings()[key]);
  }

  function setEnabled(key, value) {
    const settings = getSettings();
    settings[key] = Boolean(value);
    saveSettings(settings);
  }

  function injectStyles() {
    if (document.getElementById(APP.styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = APP.styleId;
    style.textContent = `
      #${APP.menuId} {
        position: absolute;
        z-index: 1009;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: White !important;
        cursor: pointer;
        padding: 0 10px !important;
        margin: 0 !important;
        height: 30px;
        line-height: 30px;
        font-family: "Segoe UI", Arial, Helvetica, sans-serif;
        font-size: 12px;
        font-weight: normal;
        text-shadow: 1px 1px 0px rgb(0,0,0);
        text-transform: uppercase;
        letter-spacing: .2px;
        white-space: nowrap;
        background: transparent;
        border: 0;
        outline: none;
        pointer-events: auto;
      }

      #${APP.menuId}:focus,
      #${APP.menuId}:focus-visible {
        outline: none;
      }

      #${APP.menuId}.uw-open,
      #${APP.menuId}:hover {
        background: rgb(175,209,255);
        color: black !important;
        text-shadow: none;
      }

      #${APP.dropdownId} {
        position: absolute;
        z-index: 1008;
        min-width: 315px;
        max-width: 380px;
        box-sizing: border-box;
        border-collapse: collapse;
        background: rgba(8,8,8,0.9);
        color: White;
        border: 0;
        box-shadow: 0 6px 18px rgba(0,0,0,0.32);
        font-family: "Segoe UI", Arial, Helvetica, sans-serif;
        font-size: 13px;
        display: none;
      }

      #${APP.dropdownId}.uw-visible {
        display: block;
      }

      #${APP.dropdownId} .uw-body {
        padding: 0 0 3px;
      }

      #${APP.dropdownId} .uw-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 10px;
        color: White;
        cursor: default;
        transition: background .2s ease;
      }

      #${APP.dropdownId} .uw-row:hover {
        background: rgb(175,209,255);
      }

      #${APP.dropdownId} .uw-row:hover .uw-name,
      #${APP.dropdownId} .uw-row:hover .uw-note {
        color: black;
        text-shadow: none;
      }

      #${APP.dropdownId} .uw-name {
        font-weight: normal;
        font-size: 12px;
        color: White;
        text-shadow: 1px 1px 0px rgb(0,0,0);
        text-transform: uppercase;
        letter-spacing: .2px;
      }

      #${APP.dropdownId} .uw-note {
        margin-top: 2px;
        font-size: 12px;
        color: #e6e6e6;
        line-height: 1.25;
      }

      #${APP.dropdownId} .uw-switch {
        width: 36px;
        height: 18px;
        border-radius: 999px;
        border: 0;
        padding: 0;
        cursor: pointer;
        background: #ccc;
        position: relative;
        flex: 0 0 auto;
        transition: background .3s ease;
      }

      #${APP.dropdownId} .uw-switch::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #fff;
        transition: left .3s ease;
      }

      #${APP.dropdownId} .uw-switch.uw-on {
        background: #4CAF50;
      }

      #${APP.dropdownId} .uw-switch.uw-on::after {
        left: 20px;
      }

      #${APP.dropdownId} .uw-footer {
        padding: 8px 10px;
        color: #e6e6e6;
        font-size: 12px;
        line-height: 1.35;
        background: transparent;
      }

      #${APP.dropdownId} .uw-footer button {
        margin-left: 7px;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
  }

  function createDropdown() {
    let dropdown = document.getElementById(APP.dropdownId);

    if (dropdown) {
      return dropdown;
    }

    dropdown = document.createElement('div');
    dropdown.id = APP.dropdownId;

    const settings = getSettings();

    dropdown.innerHTML = `
      <div class="uw-body">
        ${APP.modules.map(module => `
          <div class="uw-row" data-module-row="${module.key}">
            <div>
              <div class="uw-name">${module.name}</div>
            </div>
            <button
              type="button"
              class="uw-switch ${settings[module.key] ? 'uw-on' : ''}"
              data-module-switch="${module.key}"
              title="${settings[module.key] ? 'Enabled' : 'Disabled'}"
            ></button>
          </div>
        `).join('')}
      </div>
      <div class="uw-footer">
        Refresh after changes
        <button type="button" id="lms-uw-assistant-refresh-btn">Refresh</button>
      </div>
    `;

    document.body.appendChild(dropdown);

    dropdown.addEventListener('click', event => {
      const switchButton = event.target.closest('[data-module-switch]');

      if (switchButton) {
        const key = switchButton.getAttribute('data-module-switch');
        const nextValue = !isEnabled(key);

        setEnabled(key, nextValue);
        switchButton.classList.toggle('uw-on', nextValue);
        switchButton.title = nextValue ? 'Enabled' : 'Disabled';

        return;
      }

      if (event.target.id === 'lms-uw-assistant-refresh-btn') {
        window.location.reload();
      }
    });

    return dropdown;
  }

  function positionDropdown(menuItem, dropdown) {
    const rect = menuItem.getBoundingClientRect();
    const width = dropdown.offsetWidth || 340;

    const viewportLeft = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - width - 8)
    );

    dropdown.style.left = `${viewportLeft + window.scrollX}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  }

  function toggleDropdown(menuItem) {
    const dropdown = createDropdown();
    const willShow = !dropdown.classList.contains('uw-visible');

    document
      .querySelectorAll(`#${APP.dropdownId}.uw-visible`)
      .forEach(el => el.classList.remove('uw-visible'));

    document
      .querySelectorAll(`#${APP.menuId}.uw-open`)
      .forEach(el => el.classList.remove('uw-open'));

    if (willShow) {
      positionDropdown(menuItem, dropdown);
      dropdown.classList.add('uw-visible');
      menuItem.classList.add('uw-open');
    }
  }

  function getMenuAnchor() {
    return (
      document.getElementById('TopMenu-menuItemLMS') ||
      document.getElementById('TopMenu-menuItem005') ||
      document.getElementById('TopMenu')
    );
  }

  function positionMenuItem() {
    const menuItem = document.getElementById(APP.menuId);
    const anchor = getMenuAnchor();

    if (!menuItem || !anchor) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const topMenu = document.getElementById('TopMenu');
    const topMenuRect = topMenu?.getBoundingClientRect?.();

    const baseTop =
      topMenuRect && topMenuRect.height
        ? topMenuRect.top
        : anchorRect.top;

    const baseHeight =
      topMenuRect && topMenuRect.height
        ? topMenuRect.height
        : anchorRect.height || 17;

    const menuWidth = menuItem.offsetWidth || 74;

    const left =
      Math.min(
        anchorRect.right + window.scrollX + 3,
        window.scrollX + window.innerWidth - menuWidth - 8
      );

    menuItem.style.left = `${Math.max(window.scrollX + 6, left)}px`;
    menuItem.style.top = `${baseTop + window.scrollY}px`;
    menuItem.style.height = `${Math.max(17, baseHeight)}px`;
    menuItem.style.lineHeight = `${Math.max(17, baseHeight)}px`;

    const dropdown = document.getElementById(APP.dropdownId);

    if (dropdown?.classList.contains('uw-visible')) {
      positionDropdown(menuItem, dropdown);
    }
  }

  function injectMenuItem() {
    if (!getMenuAnchor()) {
      return;
    }

    let button = document.getElementById(APP.menuId);

    if (!button) {
      button = document.createElement('div');
      button.id = APP.menuId;
      button.innerHTML = '&nbsp;🛠️ UW Tools&nbsp;';
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(button);
      });

      button.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(button);
      });

      document.body.appendChild(button);
    }

    positionMenuItem();
  }

  function closeOnOutsideClick() {
    document.addEventListener('click', event => {
      const dropdown = document.getElementById(APP.dropdownId);
      const menuItem = document.getElementById(APP.menuId);

      if (!dropdown || !menuItem) {
        return;
      }

      if (
        dropdown.contains(event.target) ||
        menuItem.contains(event.target)
      ) {
        return;
      }

      dropdown.classList.remove('uw-visible');
      menuItem.classList.remove('uw-open');
    });
  }

  window.LMS_UW_ASSISTANT = {
    isEnabled,
    getSettings,
    setEnabled
  };

  function bootShell() {
    injectStyles();
    injectMenuItem();
    createDropdown();
    showReleaseNotesIfNeeded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootShell);
  } else {
    bootShell();
  }

  window.addEventListener('resize', positionMenuItem);
  window.addEventListener('scroll', positionMenuItem, true);

  closeOnOutsideClick();

  const shellObserver = new MutationObserver(() => {
    injectMenuItem();
    positionMenuItem();
  });

  shellObserver.observe(
    document.documentElement || document.body,
    {
      childList: true,
      subtree: true
    }
  );
})();

function lmsUwAssistantModuleEnabled(key) {
  try {
    return window.LMS_UW_ASSISTANT?.isEnabled(key) !== false;
  } catch (_) {
    return true;
  }
}



/* ============================================================
   MODULE: UW Follow-Up Helper
   Source: lms-uw-followup-helper.txt
   ============================================================ */
if (lmsUwAssistantModuleEnabled('followupHelper')) {
  try {

(function () {
  'use strict';

  const FOLLOW_UP_TYPES = [
    { separator: 'Cool Off' },
    'Cool off till (mm/dd)',
    'COOL OFF - no way to expedite',

    { separator: 'Main UW Requests' },
    'Need New Esig (due changed, etc)',
    'Need Recent DD',
    'Need Last 4 DDs',
    'Need Recent Payment',
    'Need DL or redo Yodlee',
    'Need DL // empty IBV',
    'Need DL // short IBV',
    'Need Bank ACC Confirmation',
    'Need PF Confirmation',

    { separator: 'Other / Confirmations' },
    'Need comment from collection',
    'Need Collection comment confirmation',
    'Duplicates',
    'Need SSN confirmation',
    'Need Correct Bank ACC Confirmation (Reversed R03-R04)',
    'Need ACC Holder Confirmation',
    'Need ACC with DDs // (xxxx1234) Confirmation',
    'Need POR',
    'Need Acceptable Bank ACC (bank name // checking // duplicate)',
    'Need to Ask Why Recent DD lower'
  ];

  const S = {
    followUpsLink: '#ctl00_FollowUpsLink',
    admin: '#maincontent_NewAdmin',
    date: '#maincontent_Date_Date',
    standard: '#standardFollowUpComment',
    comment: '#maincontent_NewCommentText',
    addToNotes: '#maincontent_ShowInNotes',
    submitFollowUp: '#maincontent_Btn_AddFollowUpAndClose',
    processingAdminLink: 'a[id*="ProcessingAdminLink"], a[href*="editprocessingadmin"]',
    smallNotesLink: 'a[id*="LoansRepeater_NotesLink"][href*="openLoanNotes"]',
    noteText: '#maincontent_NewNoteText',
    submitNote: '#maincontent_Btn_AddNoteAndClose'
  };

  const PANEL_ID = 'uw-followup-panel-v3';
  const PENDING_NOTE_KEY = 'uw-followup-pending-note-v3';

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function clean(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function norm(text) {
    return clean(text).toLowerCase();
  }

  function fireChange(el) {
    if (!el) return;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setValue(el, value) {
    if (!el) return;
    el.value = value;
    fireChange(el);
  }

  function setChecked(el, value) {
    if (!el) return;
    el.checked = value;
    fireChange(el);
  }

  function today() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
  }

  function docs() {
    const list = [document];
    [window.parent, window.top, window.opener].forEach(w => {
      try {
        if (w && w.document && !list.includes(w.document)) list.push(w.document);
      } catch (_) {}
    });
    return list;
  }

  function cleanAdminCell(cell) {
    if (!cell) return '';
    const clone = cell.cloneNode(true);
    qsa('img, script, style', clone).forEach(x => x.remove());

    let text = clean(clone.textContent)
      .replace(/DM in Slack/gi, '')
      .replace(/[^\w\s.'’\-]/g, ' ');

    text = clean(text);

    if (!text || text === '-' || text.length < 2) return '';
    if (/processing admin|reviewing admin|closing admin|denied admin|collections admin/i.test(text)) return '';

    return text;
  }

  function detectProcessingAdminInDoc(doc) {
    const links = qsa(S.processingAdminLink, doc).filter(a =>
      /processing admin/i.test(clean(a.textContent))
    );

    for (const link of links) {
      const row = link.closest('tr');
      if (!row) continue;

      const slackCell = qs('td[data-cc-slack-dm="1"], span[data-cc-slack-dm="1"]', row);
      const slackName = cleanAdminCell(slackCell);
      if (slackName) return slackName;

      const cells = qsa('td, th', row);
      const linkCell = link.closest('td, th');
      const index = cells.indexOf(linkCell);

      if (index >= 0) {
        for (let i = index + 1; i < cells.length && i <= index + 4; i++) {
          const candidate = cleanAdminCell(cells[i]);
          if (candidate) return candidate;
        }
      }
    }

    return '';
  }

  function detectProcessingAdmin() {
    for (const doc of docs()) {
      const name = detectProcessingAdminInDoc(doc);
      if (name) return name;
    }
    return '';
  }

  function selectProcessingAdmin(force = false) {
    const admin = qs(S.admin);
    const status = qs('#uw-detected-admin');

    if (!admin) return;

    if (!force && admin.dataset.uwDefaultDone === 'true') return;

    const detected = detectProcessingAdmin();

    if (status) {
      status.textContent = detected
        ? `Detected Processing Admin: ${detected}`
        : 'Detected Processing Admin: not found';
    }

    if (!detected) {
      admin.dataset.uwDefaultDone = 'true';
      return;
    }

    const target = norm(detected);
    const options = Array.from(admin.options);

    const match =
      options.find(o => norm(o.textContent) === target) ||
      options.find(o => {
        const t = norm(o.textContent);
        return t && (t.includes(target) || target.includes(t));
      });

    if (match) setValue(admin, match.value);

    admin.dataset.uwDefaultDone = 'true';
  }

  function setTodayIfEmpty() {
    const date = qs(S.date);
    if (date && !date.value.trim()) setValue(date, today());
  }

  function getExtraConfig(type) {
    const map = {
      'Need ACC with DDs // (xxxx1234) Confirmation': ['Account last 4:', '1234', true],
      'Need Recent DD': ['Recent DD date:', '07/30', true],
      'Need Acceptable Bank ACC (bank name // checking // duplicate)': ['Bank details:', 'Chime // checking // duplicate', true],
      'Cool off till (mm/dd)': ['Cool off till:', '07/25', true],
      'COOL OFF - no way to expedite': ['Cool off date:', '07/30', true],
      'Need New Esig (due changed, etc)': ['Reason/details:', 'due changed', false]
    };

    if (!map[type]) return null;

    return {
      label: map[type][0],
      placeholder: map[type][1],
      required: map[type][2]
    };
  }

  function getFinalText() {
    const type = qs('#uw-type')?.value || '';
    const extra = qs('#uw-extra')?.value.trim() || '';

    if (type === 'Need ACC with DDs // (xxxx1234) Confirmation') {
      const last4 = extra.replace(/\D/g, '').slice(-4);
      return last4 ? `Need ACC with DDs // (${last4}) Confirmation` : type;
    }

    if (type === 'Need Recent DD') {
      return extra ? `Need Recent DD (${extra})` : type;
    }

    if (type === 'Need Acceptable Bank ACC (bank name // checking // duplicate)') {
      return extra ? `Need Acceptable Bank ACC (${extra})` : type;
    }

    if (type === 'Cool off till (mm/dd)') {
      return extra ? `Cool off till ${extra}` : type;
    }

    if (type === 'COOL OFF - no way to expedite') {
      return extra ? `COOL OFF - no way to expedite (${extra})` : type;
    }

    if (type === 'Need New Esig (due changed, etc)') {
      return extra ? `Need New Esig (${extra})` : type;
    }

    return type;
  }

  function updatePreview(force = false) {
    const preview = qs('#uw-preview');
    if (!preview) return;

    if (!force && preview.dataset.uwManualEdit === 'true') {
      return;
    }

    preview.value = getFinalText();
  }

  function resetPreviewToGenerated() {
    const preview = qs('#uw-preview');
    if (preview) {
      preview.dataset.uwManualEdit = 'false';
    }

    updatePreview(true);
  }

  function getPreviewTextForSave() {
    const preview = qs('#uw-preview');
    const editedText = preview?.value.trim() || '';
    return editedText || getFinalText();
  }

  function renderExtra() {
    const wrap = qs('#uw-extra-wrap');
    const type = qs('#uw-type')?.value || '';
    if (!wrap) return;

    wrap.innerHTML = '';
    const cfg = getExtraConfig(type);

    if (!cfg) {
      resetPreviewToGenerated();
      return;
    }

    const label = document.createElement('label');
    label.textContent = cfg.label;
    label.style.cssText = 'display:block;font-weight:bold;margin-bottom:3px;';

    const input = document.createElement('input');
    input.id = 'uw-extra';
    input.placeholder = cfg.placeholder;
    input.style.cssText = 'width:100%;box-sizing:border-box;';
    input.addEventListener('input', resetPreviewToGenerated);

    wrap.append(label, input);
    resetPreviewToGenerated();
  }

  function formOpen() {
    return qs(S.admin) && qs(S.date) && qs(S.comment) && qs(S.submitFollowUp);
  }

  function getLoanIdFromDoc(doc) {
    const link = qs(S.processingAdminLink, doc) || qs(S.smallNotesLink, doc);
    const href = link?.getAttribute('href') || '';
    const m = href.match(/\((\d+)\)/);
    if (m) return m[1];

    const text = doc.body?.innerText || '';
    const lm = text.match(/LOAN#\s*(\d+)/i);
    return lm ? lm[1] : '';
  }

  function getLoanId() {
    for (const doc of docs()) {
      const id = getLoanIdFromDoc(doc);
      if (id) return id;
    }
    return '';
  }

  function savePendingNote(text) {
    localStorage.setItem(PENDING_NOTE_KEY, JSON.stringify({
      text,
      loanId: getLoanId(),
      createdAt: Date.now(),
      opened: false,
      submitted: false
    }));
  }

  function getPendingNote() {
    try {
      return JSON.parse(localStorage.getItem(PENDING_NOTE_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function clearPendingNote() {
    localStorage.removeItem(PENDING_NOTE_KEY);
  }

  function findSmallNotesLink(loanId) {
    for (const doc of docs()) {
      const links = qsa(S.smallNotesLink, doc).filter(a => clean(a.textContent).toLowerCase() === 'notes');

      const exact = links.find(a => (a.getAttribute('href') || '').includes(loanId));
      if (exact) return exact;

      if (links[0]) return links[0];
    }

    return null;
  }

  function runNoteFlow() {
    const pending = getPendingNote();
    if (!pending) return;

    if (Date.now() - pending.createdAt > 90000) {
      clearPendingNote();
      return;
    }

    const noteText = qs(S.noteText);
    const submitNote = qs(S.submitNote);

    if (noteText && submitNote && !pending.submitted) {
      pending.submitted = true;
      localStorage.setItem(PENDING_NOTE_KEY, JSON.stringify(pending));

      setValue(noteText, pending.text);
      clearPendingNote();

      setTimeout(() => submitNote.click(), 30);
      return;
    }

    if (!pending.opened) {
      const link = findSmallNotesLink(pending.loanId);
      if (!link) return;

      pending.opened = true;
      localStorage.setItem(PENDING_NOTE_KEY, JSON.stringify(pending));

      try {
        const win = link.ownerDocument.defaultView || window;
        if (pending.loanId && typeof win.openLoanNotes === 'function') {
          win.openLoanNotes(Number(pending.loanId));
        } else {
          link.click();
        }
      } catch (_) {
        link.click();
      }
    }
  }

  function injectPanel() {
    if (!formOpen()) return;
    if (qs(`#${PANEL_ID}`)) {
      setTodayIfEmpty();
      updatePreview();
      return;
    }

    const comment = qs(S.comment);
    if (!comment) return;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
      display:block;
      width:360px;
      max-width:calc(100vw - 125px);
      max-height:300px;
      overflow-y:auto;
      overflow-x:hidden;
      box-sizing:border-box;
      margin:6px 0 8px 0;
      padding:9px;
      background:#eef8ff;
      border:2px solid #35a9e0;
      border-radius:4px;
      font-family:Arial,sans-serif;
      font-size:13px;
      color:#222;
      clear:both;
    `;

    panel.innerHTML = `
      <div style="font-weight:bold;margin-bottom:6px;color:#006ea8;font-size:14px;text-transform:uppercase;letter-spacing:.3px;">UW Canned Follow-Up</div>
      <div id="uw-detected-admin" style="font-size:11px;color:#666;margin-bottom:6px;">Detected Processing Admin: checking...</div>

      <label style="font-weight:bold;display:block;margin-bottom:3px;">UW Type:</label>
      <select id="uw-type" style="width:100%;box-sizing:border-box;margin-bottom:7px;">
        <option value="">-- Choose UW follow-up type --</option>
      </select>

      <div id="uw-extra-wrap" style="margin-bottom:7px;"></div>

      <span style="font-weight:bold;">Preview / editable final text:</span>
      <textarea id="uw-preview" rows="2" style="width:100%;box-sizing:border-box;margin-top:3px;margin-bottom:7px;resize:vertical;"></textarea>

      <label style="display:block;margin-bottom:8px;font-size:12px;">
        <input id="uw-save-note" type="checkbox" checked> Save to small Loan Notes
      </label>

      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <button id="uw-save" type="button" style="background:#35a9e0;color:white;border:0;padding:6px 10px;cursor:pointer;font-weight:bold;">
          Save UW Follow-Up
        </button>
        <button id="uw-detect" type="button" style="padding:5px 8px;cursor:pointer;">
          Detect admin
        </button>
      </div>
    `;

    comment.parentNode.insertBefore(panel, comment);

    const typeSelect = qs('#uw-type');
    FOLLOW_UP_TYPES.forEach(type => {
      const opt = document.createElement('option');

      if (typeof type === 'object' && type.separator) {
        opt.value = '';
        opt.textContent = `── ${String(type.separator).toUpperCase()} ──`;
        opt.disabled = true;
        opt.style.color = '#111';
        opt.style.background = '#e3e3e3';
        opt.style.fontWeight = 'bold';
        opt.style.fontSize = '11px';
        typeSelect.appendChild(opt);
        return;
      }

      opt.value = type;
      opt.textContent = type;
      typeSelect.appendChild(opt);
    });

    typeSelect.addEventListener('change', renderExtra);

    const previewBox = qs('#uw-preview');
    if (previewBox) {
      previewBox.addEventListener('input', () => {
        previewBox.dataset.uwManualEdit = 'true';
      });
    }

    qs('#uw-detect').addEventListener('click', () => {
      const admin = qs(S.admin);
      if (admin) admin.dataset.uwDefaultDone = 'false';
      selectProcessingAdmin(true);
    });

    qs('#uw-save').addEventListener('click', () => {
      const selectedType = qs('#uw-type').value;
      const admin = qs(S.admin);
      const date = qs(S.date);
      const commentBox = qs(S.comment);
      const addToNotes = qs(S.addToNotes);
      const submit = qs(S.submitFollowUp);
      const saveNote = qs('#uw-save-note');

      if (!selectedType) return alert('Please choose UW follow-up type.');
      if (!admin?.value) return alert('Please choose assignee/admin.');
      if (!date?.value.trim()) return alert('Please choose due date.');

      const cfg = getExtraConfig(selectedType);
      const extra = qs('#uw-extra');

      if (cfg?.required && !extra?.value.trim()) {
        return alert('Please fill: ' + cfg.label);
      }

      const text = getPreviewTextForSave();

      setValue(qs(S.standard), 'nothing');
      setValue(commentBox, text);
      setChecked(addToNotes, false);

      if (saveNote?.checked) savePendingNote(text);
      else clearPendingNote();

      const btn = qs('#uw-save');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      submit.click();

      setTimeout(runNoteFlow, 300);
      setTimeout(runNoteFlow, 900);
      setTimeout(runNoteFlow, 1700);
    });

    selectProcessingAdmin();
    setTodayIfEmpty();
    updatePreview();
  }

  function hookFollowUpsButton() {
    const link = qs(S.followUpsLink);
    if (!link || link.dataset.uwHooked === 'true') return;

    link.dataset.uwHooked = 'true';

    link.addEventListener('click', () => {
      setTimeout(injectPanel, 100);
      setTimeout(injectPanel, 300);
      setTimeout(injectPanel, 700);
      setTimeout(injectPanel, 1200);
    });
  }

  function boot() {
    hookFollowUpsButton();

    if (formOpen()) injectPanel();

    runNoteFlow();
  }

  boot();
  setInterval(boot, 1000);
})();

  } catch (error) {
    console.warn('[LMS UW Assistant] UW Follow-Up Helper failed to start:', error);
  }
}


/* ============================================================
   MODULE: DL Follow-Up Scan
   Source: DL Follow-Up Highlighter.txt
   ============================================================ */
if (lmsUwAssistantModuleEnabled('dlFollowupScan')) {
  try {

(function () {
  'use strict';

  const PANEL_ID = 'uw-need-dl-followup-panel';
  const STYLE_ID = 'uw-need-dl-followup-style';
  const PANEL_POS_KEY = 'uw-need-dl-followup-panel-position-v1';

  const TARGET_FOLLOWUPS = [
    {
      label: 'Need DL or redo Yodlee',
      regex: /Need\s*DL\s*or\s*redo\s*Yodlee/i
    },
    {
      label: 'Need DL // empty IBV',
      regex: /Need\s*DL\s*\/\s*\/\s*empty\s*IBV/i
    },
    {
      label: 'Need DL // short IBV',
      regex: /Need\s*DL\s*\/\s*\/\s*short\s*IBV/i
    }
  ];

  const SETTINGS = {
    concurrency: 8,
    delayBetweenRequestsMs: 35,
    fetchTimeoutMs: 12000,
    largeScanWarningLimit: 350
  };

  const state = {
    running: false,
    runId: 0,
    total: 0,
    checked: 0,
    found: 0,
    failed: 0,
    skipped: 0,
    controllers: new Set(),
    cache: new Map()
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function clean(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function isPendingLoansReport() {
    return /\/plm\.net\/reports\/LoansReport\.aspx/i.test(window.location.href) &&
      /(?:\?|&)reportpreset=pending(?:&|$)/i.test(window.location.search || window.location.href);
  }

  function isVisible(el) {
    if (!el) return false;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function extractCustomerIdFromHref(href) {
    try {
      const url = new URL(href, window.location.href);
      return url.searchParams.get('customerid') || '';
    } catch (_) {
      const match = String(href || '').match(/[?&]customerid=(\d+)/i);
      return match ? match[1] : '';
    }
  }

  function makeAbsoluteUrl(href) {
    try {
      return new URL(href, window.location.href).toString();
    } catch (_) {
      return '';
    }
  }

  function addLoanIdToCustomerUrl(customerUrl, loanId) {
    if (!customerUrl || !loanId) return '';

    try {
      const url = new URL(customerUrl, window.location.href);
      if (!url.searchParams.get('loanid')) {
        url.searchParams.set('loanid', loanId);
      }
      return url.toString();
    } catch (_) {
      return '';
    }
  }

  function getLoanIdFromRow(row) {
    if (!row) return '';

    const cells = Array.from(row.children).filter(child => /^(td|th)$/i.test(child.tagName || ''));
    const likelyLoanId = clean(cells[1]?.textContent || '');

    if (/^\d{4,}$/.test(likelyLoanId)) {
      return likelyLoanId;
    }

    const inputWithLoan =
      row.querySelector('input[name$="LoanIds"][value]') ||
      row.querySelector('input[name="letterLoanIds"][value]') ||
      row.querySelector('input[value]');

    const value = clean(inputWithLoan?.value || '');
    return /^\d{4,}$/.test(value) ? value : '';
  }

  function getCustomerNameFromLink(link) {
    return clean(link?.textContent || '') || 'Customer';
  }

  function collectReportRows(visibleOnly = true) {
    const links = qsa('a[href*="CustomerDetails.aspx?customerid="]');
    const byCustomer = new Map();

    for (const link of links) {
      const row = link.closest('tr');
      if (!row) continue;
      if (visibleOnly && !isVisible(row)) continue;

      const href = link.getAttribute('href') || '';
      const customerId = extractCustomerIdFromHref(href);
      const customerUrl = makeAbsoluteUrl(href);

      if (!customerId || !customerUrl) continue;

      if (!byCustomer.has(customerId)) {
        byCustomer.set(customerId, {
          customerId,
          customerUrl,
          name: getCustomerNameFromLink(link),
          loanIds: new Set(),
          rows: [],
          links: []
        });
      }

      const entry = byCustomer.get(customerId);
      entry.rows.push(row);
      entry.links.push(link);

      const loanId = getLoanIdFromRow(row);
      if (loanId) entry.loanIds.add(loanId);
    }

    return Array.from(byCustomer.values());
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        left: 395px;
        top: 235px;
        z-index: 99999;
        width: 365px;
        box-sizing: border-box;
        padding: 10px;
        background: #fffdf5;
        border: 2px solid #d39b00;
        border-radius: 6px;
        box-shadow: 0 3px 14px rgba(0,0,0,0.18);
        font-family: Arial, sans-serif;
        color: #222;
        font-size: 12px;
      }

      #${PANEL_ID} .uw-title {
        font-weight: bold;
        font-size: 14px;
        color: #8a5500;
        margin-bottom: 7px;
        cursor: move;
        user-select: none;
        text-transform: uppercase;
        letter-spacing: .3px;
      }

      #${PANEL_ID} .uw-dl-toolbar {
        display: flex;
        gap: 6px;
        margin-bottom: 7px;
      }

      #${PANEL_ID} .uw-dl-toolbar button {
        flex: 1;
        margin-right: 0;
      }

      #${PANEL_ID} button {
        border: 0;
        border-radius: 4px;
        padding: 6px 9px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
        margin-right: 5px;
        text-transform: uppercase;
        letter-spacing: .2px;
      }

      #uw-need-dl-scan-btn {
        background: #d39b00;
        color: white;
      }

      #uw-need-dl-stop-btn {
        background: #a33;
        color: white;
      }

      #uw-need-dl-clear-btn {
        background: #777;
        color: white;
      }

      #${PANEL_ID} button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      #uw-need-dl-status {
        margin-top: 7px;
        line-height: 1.35;
        color: #333;
      }

      #uw-need-dl-progress-wrap {
        width: 100%;
        height: 8px;
        background: #eee;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        margin-top: 7px;
      }

      #uw-need-dl-progress {
        height: 100%;
        width: 0%;
        background: #d39b00;
      }

      tr.uw-need-dl-found > td {
        background: #fff0bd !important;
      }
    `;

    document.head.appendChild(style);
  }

  function applySavedPanelPosition(panel) {
    if (!panel) return;

    try {
      const saved = JSON.parse(localStorage.getItem(PANEL_POS_KEY) || 'null');
      if (!saved || typeof saved.left !== 'number' || typeof saved.top !== 'number') return;

      const maxLeft = Math.max(10, window.innerWidth - 80);
      const maxTop = Math.max(10, window.innerHeight - 60);

      panel.style.left = `${Math.min(Math.max(10, saved.left), maxLeft)}px`;
      panel.style.top = `${Math.min(Math.max(10, saved.top), maxTop)}px`;
      panel.style.right = 'auto';
    } catch (_) {}
  }

  function makePanelDraggable(panel) {
    const handle = qs('.uw-title', panel);
    if (!panel || !handle) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.addEventListener('mousedown', event => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = panel.offsetLeft;
      startTop = panel.offsetTop;
      event.preventDefault();
    });

    document.addEventListener('mousemove', event => {
      if (!dragging) return;

      const nextLeft = Math.max(5, Math.min(window.innerWidth - 60, startLeft + event.clientX - startX));
      const nextTop = Math.max(5, Math.min(window.innerHeight - 40, startTop + event.clientY - startY));

      panel.style.left = `${nextLeft}px`;
      panel.style.top = `${nextTop}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;

      try {
        localStorage.setItem(PANEL_POS_KEY, JSON.stringify({
          left: panel.offsetLeft,
          top: panel.offsetTop
        }));
      } catch (_) {}
    });
  }

  function updateStatus(extraText = '') {
    const status = qs('#uw-need-dl-status');
    const progress = qs('#uw-need-dl-progress');
    const scanBtn = qs('#uw-need-dl-scan-btn');
    const stopBtn = qs('#uw-need-dl-stop-btn');

    if (status) {
      const parts = [
        `Checked: ${state.checked} / ${state.total}`,
        `Found: ${state.found}`
      ];

      status.innerHTML = `
        <div>${parts.join(' / ')}</div>
        <div>${extraText || (state.running ? 'Scanning...' : '')}</div>
      `;
    }

    if (progress) {
      const percent = state.total > 0 ? Math.round((state.checked / state.total) * 100) : 0;
      progress.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }

    if (scanBtn) scanBtn.disabled = state.running;
    if (stopBtn) stopBtn.disabled = !state.running;
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    installStyles();

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="uw-title">DL Follow-Up Scan</div>

      <div class="uw-dl-toolbar">
        <button id="uw-need-dl-scan-btn" type="button">Scan Visible Rows</button>
        <button id="uw-need-dl-stop-btn" type="button" disabled>Stop</button>
        <button id="uw-need-dl-clear-btn" type="button">Clear</button>
      </div>

      <div style="font-size:11px; color:#666;">
        Yellow row = matching Need DL follow-up.
      </div>

      <div id="uw-need-dl-progress-wrap">
        <div id="uw-need-dl-progress"></div>
      </div>

      <div id="uw-need-dl-status"></div>
    `;

    document.body.appendChild(panel);
    applySavedPanelPosition(panel);
    makePanelDraggable(panel);

    qs('#uw-need-dl-scan-btn').addEventListener('click', startScan);
    qs('#uw-need-dl-stop-btn').addEventListener('click', stopScan);
    qs('#uw-need-dl-clear-btn').addEventListener('click', () => {
      stopScan();
      clearMarks();
      state.cache.clear();
      resetCounters();
      updateStatus('Marks cleared.');
    });
  }

  function resetCounters() {
    state.total = 0;
    state.checked = 0;
    state.found = 0;
    state.failed = 0;
    state.skipped = 0;
  }

  function clearMarks() {
    qsa('tr.uw-need-dl-found, tr.uw-need-dl-checking, tr.uw-need-dl-error').forEach(row => {
      row.classList.remove('uw-need-dl-found', 'uw-need-dl-checking', 'uw-need-dl-error');
      row.removeAttribute('data-uw-need-dl-result');
      row.removeAttribute('title');
    });

  }

  function setEntryVisualState(entry, status, matches = [], mode = '') {
    const matchedText = matches.length ? matches.join(' | ') : '';

    for (const row of entry.rows) {
      row.classList.remove('uw-need-dl-found', 'uw-need-dl-checking', 'uw-need-dl-error');
      row.removeAttribute('title');

      if (status === 'found') {
        row.classList.add('uw-need-dl-found');
        row.dataset.uwNeedDlResult = matchedText;
      } else if (status === 'error') {
        row.dataset.uwNeedDlResult = 'error';
      } else if (status === 'checking') {
        row.dataset.uwNeedDlResult = 'checking';
      } else {
        row.removeAttribute('data-uw-need-dl-result');
      }
    }
  }

  function collectMatchesFromText(text) {
    const source = clean(text);
    if (!source) return [];

    const matches = [];

    for (const target of TARGET_FOLLOWUPS) {
      if (target.regex.test(source) && !matches.includes(target.label)) {
        matches.push(target.label);
      }
    }

    return matches;
  }

  function getFollowUpSearchRoots(doc) {
    const roots = [];

    qsa('tr.tr-followup, .tr-followup', doc).forEach(el => {
      if (el && !roots.includes(el)) roots.push(el);
    });

    qsa('table.gridtwocolumns', doc).forEach(el => {
      if (el && /Need\s*DL|Follow-Ups|followup/i.test(el.textContent || '') && !roots.includes(el)) {
        roots.push(el);
      }
    });

    const followupsLink =
      doc.querySelector('#ctl00_FollowUpsLink') ||
      qsa('a', doc).find(a => /follow-ups\s*:/i.test(clean(a.textContent || '')));

    const container =
      followupsLink?.closest('td')?.parentElement ||
      followupsLink?.closest('table');

    if (container && !roots.includes(container)) {
      roots.push(container);
    }

    return roots;
  }

  function findTargetFollowUpsInDoc(doc) {
    if (!doc) return { matches: [], mode: 'no-doc' };

    const roots = getFollowUpSearchRoots(doc);

    for (const root of roots) {
      const matches = collectMatchesFromText(root.textContent || '');
      if (matches.length) {
        return { matches, mode: 'follow-up-block' };
      }
    }

    // Fallback: sometimes LMS does not expose the exact follow-up table selector after fetch,
    // but the Follow-Ups section text is still present in the page HTML.
    const bodyText = clean(doc.body?.textContent || doc.documentElement?.textContent || '');
    const markerIndex = bodyText.toLowerCase().indexOf('follow-ups');

    if (markerIndex >= 0) {
      const sectionText = bodyText.slice(markerIndex, markerIndex + 9000);
      const sectionMatches = collectMatchesFromText(sectionText);

      if (sectionMatches.length) {
        return { matches: sectionMatches, mode: 'follow-ups-section-fallback' };
      }
    }

    // Last fallback: only accept a full-page match when the page also contains
    // actual follow-up row/table markers. This keeps it read-only but avoids most dropdown false positives.
    if (/tr-followup|FollowUpsLink|gridtwocolumns/i.test(doc.documentElement?.innerHTML || '')) {
      const pageMatches = collectMatchesFromText(bodyText);

      if (pageMatches.length) {
        return { matches: pageMatches, mode: 'full-page-fallback' };
      }
    }

    return { matches: [], mode: 'none' };
  }

  async function fetchDoc(url, runId) {
    const controller = new AbortController();
    state.controllers.add(controller);

    const timer = setTimeout(() => {
      try {
        controller.abort();
      } catch (_) {}
    }, SETTINGS.fetchTimeoutMs);

    try {
      const response = await fetch(url, {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      if (runId !== state.runId || !state.running) {
        return null;
      }

      if (!html || !/CustomerDetails|Customer|Follow-Ups|FollowUps|Loan|Application/i.test(html)) {
        throw new Error('Unexpected page HTML');
      }

      return new DOMParser().parseFromString(html, 'text/html');
    } finally {
      clearTimeout(timer);
      state.controllers.delete(controller);
    }
  }

  async function checkEntryUrls(entry, runId) {
    const urls = [];

    urls.push({
      url: entry.customerUrl,
      mode: 'customer'
    });

    for (const loanId of Array.from(entry.loanIds)) {
      const withLoanId = addLoanIdToCustomerUrl(entry.customerUrl, loanId);

      if (withLoanId && !urls.some(item => item.url === withLoanId)) {
        urls.push({
          url: withLoanId,
          mode: `customer+loan ${loanId}`
        });
      }
    }

    let lastMode = 'none';

    for (const item of urls) {
      if (runId !== state.runId || !state.running) {
        return { matches: [], mode: 'stopped' };
      }

      const doc = await fetchDoc(item.url, runId);
      if (!doc) continue;

      const result = findTargetFollowUpsInDoc(doc);
      lastMode = `${item.mode}/${result.mode}`;

      if (result.matches.length) {
        return {
          matches: result.matches,
          mode: lastMode
        };
      }
    }

    return {
      matches: [],
      mode: lastMode
    };
  }

  async function scanEntry(entry, runId) {
    if (!entry || runId !== state.runId || !state.running) return;

    setEntryVisualState(entry, 'checking');

    try {
      const cacheKey = `${entry.customerId}:${Array.from(entry.loanIds).sort().join(',')}`;
      let result;

      if (state.cache.has(cacheKey)) {
        result = state.cache.get(cacheKey);
      } else {
        result = await checkEntryUrls(entry, runId);
        state.cache.set(cacheKey, result);
      }

      if (runId !== state.runId || !state.running) {
        return;
      }

      if (result.matches.length) {
        state.found += 1;
        setEntryVisualState(entry, 'found', result.matches, result.mode);
      } else {
        setEntryVisualState(entry, 'clear');
      }
    } catch (error) {
      if (runId !== state.runId || !state.running) {
        return;
      }

      state.failed += 1;
      setEntryVisualState(entry, 'error');
      console.warn('[DL follow up scan] Customer check failed:', {
        customerId: entry.customerId,
        name: entry.name,
        loanIds: Array.from(entry.loanIds),
        url: entry.customerUrl,
        error
      });
    } finally {
      if (runId === state.runId && state.running) {
        state.checked += 1;
        updateStatus();
      }
    }
  }

  async function runWorker(queue, runId) {
    while (state.running && runId === state.runId && queue.length > 0) {
      const entry = queue.shift();
      await scanEntry(entry, runId);

      if (state.running && runId === state.runId && queue.length > 0) {
        await sleep(SETTINGS.delayBetweenRequestsMs);
      }
    }
  }

  async function startScan() {
    if (state.running) return;

    const entries = collectReportRows(true);

    if (!entries.length) {
      updateStatus('No customer rows found on this page.');
      return;
    }

    if (
      entries.length > SETTINGS.largeScanWarningLimit &&
      !window.confirm(`This will check ${entries.length} customer pages. Continue?`)
    ) {
      updateStatus('Scan cancelled.');
      return;
    }

    clearMarks();
    state.cache.clear();
    resetCounters();

    state.running = true;
    state.runId += 1;
    state.total = entries.length;

    const runId = state.runId;
    const queue = entries.slice();

    updateStatus(`Scanning ${entries.length} customer page(s)...`);

    const workerCount = Math.min(SETTINGS.concurrency, queue.length);
    const workers = Array.from({ length: workerCount }, () => runWorker(queue, runId));

    await Promise.all(workers);

    if (runId === state.runId) {
      state.running = false;
      updateStatus(`Done. Found ${state.found} customer(s) with Need DL follow-up.`);
    }
  }

  function stopScan() {
    if (!state.running) return;

    state.running = false;
    state.runId += 1;

    for (const controller of Array.from(state.controllers)) {
      try {
        controller.abort();
      } catch (_) {}
    }

    state.controllers.clear();

    qsa('tr.uw-need-dl-checking').forEach(row => {
      row.classList.remove('uw-need-dl-checking');
    });


    updateStatus('Stopped.');
  }

  function boot() {
    if (!isPendingLoansReport()) return;
    createPanel();
    updateStatus('Apply the Bank account verification = Yes filter, then scan.');
  }

  boot();
})();

  } catch (error) {
    console.warn('[LMS UW Assistant] DL Follow-Up Scan failed to start:', error);
  }
}


/* ============================================================
   MODULE: Notification Status Checker
   Source: Notifications checker..txt
   ============================================================ */
if (lmsUwAssistantModuleEnabled('notificationStatusChecker')) {
  try {

(function () {
  'use strict';

  const TABLE_ID = 'table_alerts';
  const PANE_ID = 'div_alerts';
  const BUTTON_ID = 'uw-notification-status-scan-btn';
  const INFO_ID = 'uw-notification-status-scan-info';
  const BADGE_ATTR = 'data-uw-notification-status-badge';

  const SETTINGS = {
    concurrency: 8,
    fetchTimeoutMs: 9000,
    debug: false
  };

  let scanInFlight = false;

  const STATUS_STYLES = {
    pending: { text: '#7a4a00', bg: '#fff1c2', border: '#d8a800' },
    active: { text: '#106b2f', bg: '#e8f8e8', border: '#43a047' },
    pastdue: { text: '#9b0000', bg: '#ffe4e4', border: '#d00000' },
    denied: { text: '#8a1f1f', bg: '#f2dddd', border: '#b85b5b' },
    withdrawn: { text: '#555', bg: '#eeeeee', border: '#999' },
    reversed: { text: '#4b2673', bg: '#eee3ff', border: '#8e63c7' },
    paid: { text: '#185f78', bg: '#e2f5fb', border: '#37a6c7' },
    writtenoff: { text: '#6b2b00', bg: '#ffe8d8', border: '#bf6b2c' },
    unknown: { text: '#444', bg: '#eeeeee', border: '#999' },
    error: { text: '#8a1f1f', bg: '#ffecec', border: '#cc7777' },
    loading: { text: '#555', bg: '#f2f2f2', border: '#aaa' }
  };

  const KNOWN_STATUS_REGEX =
    /(Pending(?:\s+Application)?|Active|Past\s*Due|Denied|Withdrawn|Reversed|Paid(?:\s*Off)?|Written\s*Off|Charged\s*Off|Charge\s*Off)/i;

  function debugLog(...args) {
    if (!SETTINGS.debug) {
      return;
    }

    try {
      console.log('[Notification Status Checker]', ...args);
    } catch (_) {}
  }

  function clean(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function decodeHtml(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(text || '');

    return textarea.value;
  }

  function stripTags(text) {
    return clean(
      decodeHtml(
        String(text || '').replace(/<[^>]*>/g, ' ')
      )
    );
  }

  function removeScriptsAndStyles(html) {
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  }

  function htmlToText(html) {
    return stripTags(
      removeScriptsAndStyles(html)
    );
  }

  function decodeLmsEscapedHtml(text) {
    let output = String(text || '');

    output = output
      .replace(/\\u003c/gi, '<')
      .replace(/\\u003e/gi, '>')
      .replace(/\\u0026/gi, '&')
      .replace(/\\u0027/gi, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, ' ');

    return output;
  }

  function getCustomerIdFromLink(link) {
    const href =
      link?.getAttribute('href') ||
      link?.href ||
      '';

    const match = href.match(/[?&]customerid=(\d+)/i);

    return match ? match[1] : '';
  }

  function addUrlCandidate(list, url) {
    if (!url) {
      return;
    }

    try {
      const absolute = new URL(url, window.location.href).toString();

      if (!list.includes(absolute)) {
        list.push(absolute);
      }
    } catch (_) {}
  }

  function makeUrlCandidates(link, customerId) {
    const candidates = [];
    const rawHref = link?.getAttribute('href') || '';
    const origin = window.location.origin;

    // Same idea as the working follow-up scanner: start from the real LMS link.
    addUrlCandidate(candidates, rawHref);
    addUrlCandidate(candidates, link?.href || '');

    // LMS sometimes writes links as "..//customers/...".
    // Keep normalized and explicit /plm.net variants as fallbacks.
    addUrlCandidate(candidates, rawHref.replace(/\.\.\/\//g, '../'));

    const currentPath = window.location.pathname;
    const plmMatch = currentPath.match(/^(.*?\/plm\.net)(?:\/|$)/i);
    const plmRoot = plmMatch?.[1] || '/plm.net';

    if (customerId) {
      addUrlCandidate(
        candidates,
        `${origin}${plmRoot}//customers/CustomerDetails.aspx?customerid=${encodeURIComponent(customerId)}`
      );

      addUrlCandidate(
        candidates,
        `${origin}${plmRoot}/customers/CustomerDetails.aspx?customerid=${encodeURIComponent(customerId)}`
      );

      addUrlCandidate(
        candidates,
        `/plm.net//customers/CustomerDetails.aspx?customerid=${encodeURIComponent(customerId)}`
      );

      addUrlCandidate(
        candidates,
        `/plm.net/customers/CustomerDetails.aspx?customerid=${encodeURIComponent(customerId)}`
      );

      addUrlCandidate(
        candidates,
        `/customers/CustomerDetails.aspx?customerid=${encodeURIComponent(customerId)}`
      );
    }

    return candidates;
  }

  function getNotificationRows() {
    const table = document.getElementById(TABLE_ID);

    if (!table) {
      return [];
    }

    return Array.from(table.querySelectorAll('tr')).filter(row =>
      row.querySelector('a.CustomerAccountLink[href*="CustomerDetails.aspx"][href*="customerid="]')
    );
  }

  function getCustomerGroups() {
    const map = new Map();

    for (const row of getNotificationRows()) {
      const link = row.querySelector(
        'a.CustomerAccountLink[href*="CustomerDetails.aspx"][href*="customerid="]'
      );

      const customerId = getCustomerIdFromLink(link);

      if (!customerId) {
        continue;
      }

      if (!map.has(customerId)) {
        map.set(customerId, {
          customerId,
          urlCandidates: makeUrlCandidates(link, customerId),
          items: []
        });
      }

      map.get(customerId).items.push({
        row,
        link
      });
    }

    return Array.from(map.values());
  }

  function normalizeStatus(statusText) {
    const raw = clean(statusText)
      .replace(/^Status\s*:\s*/i, '')
      .replace(/,$/, '')
      .trim();

    if (!raw) {
      return { label: 'Unknown', key: 'unknown' };
    }

    const lower = raw.toLowerCase();

    if (/pending/.test(lower)) {
      return { label: 'Pending', key: 'pending' };
    }

    if (/past\s*due/.test(lower)) {
      return { label: 'Past Due', key: 'pastdue' };
    }

    if (/active/.test(lower)) {
      return { label: 'Active', key: 'active' };
    }

    if (/denied/.test(lower)) {
      return { label: 'Denied', key: 'denied' };
    }

    if (/withdrawn|withdraw/.test(lower)) {
      return { label: 'Withdrawn', key: 'withdrawn' };
    }

    if (/reversed|reverse/.test(lower)) {
      return { label: 'Reversed', key: 'reversed' };
    }

    if (/written\s*off|write\s*off|charged\s*off|charge\s*off/.test(lower)) {
      return { label: 'Written Off', key: 'writtenoff' };
    }

    if (/paid\s*off|paid|closed/.test(lower)) {
      return { label: raw, key: 'paid' };
    }

    return { label: raw, key: 'unknown' };
  }

  function makeStatus(statusText, details = {}) {
    const parsed = normalizeStatus(statusText);

    return {
      status: parsed.label,
      key: parsed.key,
      loanId: details.loanId || '',
      source: details.source || '',
      url: details.url || '',
      debug: details.debug || ''
    };
  }

  function isUsefulStatus(statusInfo) {
    return Boolean(
      statusInfo &&
      statusInfo.status &&
      statusInfo.status !== 'Unknown' &&
      statusInfo.key !== 'unknown'
    );
  }

  function getLastLoanHtmlScope(html) {
    const source = String(html || '');

    const markers = [
      'id="LastLoanSection"',
      "id='LastLoanSection'",
      'id="section_maincontent_li_LastLoan"',
      "id='section_maincontent_li_LastLoan'",
      'id="ctl00_tr_lastloan"',
      "id='ctl00_tr_lastloan'",
      'Span_Loan_Status2_0',
      'Span_Loan_Status_0'
    ];

    let startIndex = -1;

    for (const marker of markers) {
      const index = source.indexOf(marker);

      if (index >= 0) {
        startIndex = Math.max(0, index - 12000);
        break;
      }
    }

    if (startIndex < 0) {
      return source;
    }

    return source.slice(
      startIndex,
      Math.min(source.length, startIndex + 320000)
    );
  }

  function extractLoanIdFromScope(scope) {
    const source = String(scope || '');

    const idMatch =
      source.match(/<div[^>]+id=["']loan_(\d+)["']/i) ||
      source.match(/Loan#\s*(\d+)/i) ||
      source.match(/loan_(\d+)/i);

    return idMatch?.[1] || '';
  }

  function extractStatusFromOneHtmlVersion(html, url, sourceLabel) {
    const scope = getLastLoanHtmlScope(html);
    const loanId = extractLoanIdFromScope(scope);

    const spanMatches = Array.from(
      scope.matchAll(/<span\b[^>]*id=["'][^"']*Span_Loan_Status2?_\d+["'][^>]*>([\s\S]*?)<\/span>/gi)
    );

    for (const match of spanMatches) {
      const text = stripTags(match[1]);
      const statusMatch = text.match(KNOWN_STATUS_REGEX);

      if (statusMatch) {
        return makeStatus(statusMatch[1], {
          loanId,
          source: `${sourceLabel}/status-span-word`,
          url
        });
      }
    }

    const statusRowMatches = Array.from(
      scope.matchAll(/<tr[\s\S]{0,5000}?Status\s*:[\s\S]{0,5000}?<\/tr>/gi)
    );

    for (const rowMatch of statusRowMatches) {
      const rowText = htmlToText(rowMatch[0]);
      const match =
        rowText.match(/Status\s*:\s*(Pending(?:\s+Application)?|Active|Past\s*Due|Denied|Withdrawn|Reversed|Paid(?:\s*Off)?|Written\s*Off|Charged\s*Off|Charge\s*Off)\b/i) ||
        rowText.match(KNOWN_STATUS_REGEX);

      if (match?.[1]) {
        return makeStatus(match[1], {
          loanId,
          source: `${sourceLabel}/status-row-word`,
          url
        });
      }
    }

    const textScope = htmlToText(scope);

    const headerMatch = textScope.match(
      /Loan#\s*(\d+)\s*\/\s*(Pending(?:\s+Application)?|Active|Past\s*Due|Denied|Withdrawn|Reversed|Paid(?:\s*Off)?|Written\s*Off|Charged\s*Off|Charge\s*Off)\b/i
    );

    if (headerMatch?.[2]) {
      return makeStatus(headerMatch[2], {
        loanId: headerMatch[1] || loanId,
        source: `${sourceLabel}/loan-header-word`,
        url
      });
    }

    return {
      status: 'Unknown',
      key: 'unknown',
      loanId,
      source: `${sourceLabel}/not-found`,
      url,
      debug: textScope.slice(0, 700)
    };
  }

  function extractStatusFromRawHtml(html, url) {
    const versions = [
      {
        label: 'raw',
        html: String(html || '')
      },
      {
        label: 'decoded-cached-section',
        html: decodeLmsEscapedHtml(html)
      }
    ];

    let lastUnknown = null;

    for (const version of versions) {
      const result = extractStatusFromOneHtmlVersion(
        version.html,
        url,
        version.label
      );

      if (isUsefulStatus(result)) {
        return result;
      }

      lastUnknown = result;
    }

    return lastUnknown || {
      status: 'Unknown',
      key: 'unknown',
      loanId: '',
      source: 'not-found',
      url,
      debug: ''
    };
  }

  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchCustomerStatus(group) {
    let lastUnknown = null;
    const errors = [];

    for (const url of group.urlCandidates) {
      try {
        const html = await fetchWithTimeout(
          url,
          SETTINGS.fetchTimeoutMs
        );

        const result = extractStatusFromRawHtml(html, url);

        debugLog(
          `customer ${group.customerId}`,
          result.status,
          result.source,
          url,
          result.debug || ''
        );

        if (isUsefulStatus(result)) {
          return result;
        }

        lastUnknown = result;
      } catch (error) {
        errors.push(`${url}: ${error?.message || error}`);
      }
    }

    if (lastUnknown) {
      return lastUnknown;
    }

    return {
      status: 'Status error',
      key: 'error',
      loanId: '',
      source: 'fetch-error',
      url: '',
      debug: errors.join(' | ')
    };
  }

  function removeOldBadges(row) {
    row.querySelectorAll(`span[${BADGE_ATTR}]`).forEach(badge => {
      badge.remove();
    });
  }

  function getStatusTargetCell(row) {
    return row.cells?.[1] || row.querySelector('td:nth-child(2)') || row.cells?.[0] || row;
  }

  function setRowBadge(row, statusInfo) {
    removeOldBadges(row);

    const targetCell = getStatusTargetCell(row);
    const key = statusInfo.key || 'unknown';
    const style = STATUS_STYLES[key] || STATUS_STYLES.unknown;

    const badge = document.createElement('span');
    badge.setAttribute(BADGE_ATTR, '1');
    badge.textContent = ` ${statusInfo.status || 'Unknown'}`;

    if (statusInfo.loanId && statusInfo.status !== 'Unknown') {
      badge.title = `Top loan/application status. Loan #${statusInfo.loanId}`;
    } else if (statusInfo.status === 'Unknown' || statusInfo.key === 'error') {
      badge.title = [
        statusInfo.source ? `source: ${statusInfo.source}` : '',
        statusInfo.url || '',
        statusInfo.debug ? `debug: ${statusInfo.debug}` : ''
      ].filter(Boolean).join(' | ') || 'Status could not be detected';
    } else {
      badge.title = 'Top loan/application status';
    }

    Object.assign(badge.style, {
      display: 'inline-block',
      marginLeft: '14px',
      padding: '1px 6px',
      borderRadius: '10px',
      border: `1px solid ${style.border}`,
      background: style.bg,
      color: style.text,
      fontSize: '11px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      lineHeight: '1.25'
    });

    targetCell.appendChild(badge);
  }

  function setLoadingRowBadge(row) {
    setRowBadge(row, {
      status: 'checking...',
      key: 'loading',
      loanId: ''
    });
  }

  function setInfo(text, type = 'normal') {
    const info = document.getElementById(INFO_ID);

    if (!info) {
      return;
    }

    info.textContent = text;

    if (type === 'error') {
      info.style.color = '#ffb3b3';
    } else if (type === 'success') {
      info.style.color = '#9be7a3';
    } else {
      info.style.color = '#ddd';
    }
  }

  async function runQueue(items, worker, concurrency) {
    let index = 0;

    const workers = Array.from(
      { length: Math.min(Math.max(concurrency, 1), items.length) },
      async () => {
        while (index < items.length) {
          const current = items[index];
          index += 1;
          await worker(current);
        }
      }
    );

    await Promise.all(workers);
  }

  async function scanNotifications() {
    if (scanInFlight) {
      return;
    }

    installPaneControls();

    const groups = getCustomerGroups();

    if (!groups.length) {
      setInfo('No customer notifications found.', 'error');
      return;
    }

    scanInFlight = true;

    for (const group of groups) {
      for (const item of group.items) {
        setLoadingRowBadge(item.row);
      }
    }

    let done = 0;

    try {
      setInfo(`Checking: 0/${groups.length}`);

      await runQueue(
        groups,
        async group => {
          try {
            const statusInfo = await fetchCustomerStatus(group);

            for (const item of group.items) {
              setRowBadge(item.row, statusInfo);
            }
          } catch (error) {
            for (const item of group.items) {
              setRowBadge(item.row, {
                status: 'Status error',
                key: 'error',
                source: 'scan-error',
                debug: error?.message || String(error)
              });
            }
          } finally {
            done += 1;
            setInfo(`Checking: ${done}/${groups.length}`);
          }
        },
        SETTINGS.concurrency
      );

      setInfo(`Done: ${groups.length} customer(s).`, 'success');
    } finally {
      scanInFlight = false;
    }
  }

  function installPaneControls() {
    const pane = document.getElementById(PANE_ID);

    if (!pane) {
      return;
    }

    const header = pane.querySelector('.NotificationPaneHeader');

    if (!header) {
      return;
    }

    if (!document.getElementById(BUTTON_ID)) {
      const button = document.createElement('button');
      button.id = BUTTON_ID;
      button.type = 'button';
      button.textContent = 'Check statuses';

      Object.assign(button.style, {
        marginLeft: '8px',
        padding: '2px 7px',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: 'pointer',
        verticalAlign: 'middle'
      });

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        scanNotifications();
      });

      header.appendChild(button);
    }

    if (!document.getElementById(INFO_ID)) {
      const info = document.createElement('span');
      info.id = INFO_ID;
      info.textContent = '';

      Object.assign(info.style, {
        marginLeft: '8px',
        fontSize: '11px',
        color: '#ddd',
        fontWeight: 'normal'
      });

      header.appendChild(info);
    }
  }

  function boot() {
    installPaneControls();

    document.addEventListener(
      'click',
      event => {
        const button = event.target.closest(
          'a.HeaderButton[onclick*="toggleNotificationPane"][onclick*="alerts"]'
        );

        if (!button) {
          return;
        }

        setTimeout(installPaneControls, 150);
        setTimeout(installPaneControls, 500);
      },
      true
    );

    const observer = new MutationObserver(() => {
      installPaneControls();
    });

    observer.observe(
      document.documentElement || document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

  } catch (error) {
    console.warn('[LMS UW Assistant] Notification Status Checker failed to start:', error);
  }
}


/* ============================================================
   MODULE: TBW Notes Dropdown
   Source: TBW Notes Dropdown Sales/UW
   ============================================================ */
if (lmsUwAssistantModuleEnabled('tbwNotesDropdown')) {
  try {

(function () {
    'use strict';

    const TBW_OPTIONS_SALES = [
        'TBW - Cust not interested',
        'TBW - Amount too low',
        'TBW - Loan too expensive',
        'TBW - Cust did not apply',
        'TBW - Cannot verify online banking',
        'TBW - Cust has an active loan with us',
        'TBW - Unacceptable bank',
        'TBW - Cust Not Cooperating',
        'TBW - No Direct Deposit',
        'TBW - Unacceptable Pay Frequency',
        'TBW - Bank account is not unique',
        'TBW - No Checking account',
        'TBW - New Bank Account',
        'TBW - Unemployed',
        'TBW - Minimum Income Requirement Not Met',
        'TBW - Defaulted with us on the last payment',
        'TBW - Cool off by collections',
        'TBW - DO NOT LOAN',
        'TBW - Not approved by collections',
        'TBW - Cust in Military',
        'TBW - Verified different SSN',
        'TBW - Fraud',
        'TBW - Other: '
    ];

    const TBW_OPTIONS_UW = [
        'TBW - Cust has an active loan with us',
        'TBW - Cannot verify online banking',
        'TBW - Unacceptable bank',
        'TBW - Multiple Open Loan',
        'TBW - Multiple inactive loans',
        'TBW - Recently received a loan',
        'TBW - Multiple Defaults',
        'TBW - Stop payment',
        'TBW - Low EOD balances',
        'TBW - Last EOD is low',
        'TBW - No Direct deposits',
        'TBW - No last DD',
        'TBW - Last DD is low',
        'TBW - Negative account balance',
        'TBW - Bank account is not unique',
        'TBW - Business account',
        'TBW - Minimum Income Requirement Not Met',
        'TBW - Unacceptable payment frequency',
        'TBW - Inconsistent income',
        'TBW - Irregular online banking behavior',
        'TBW - Withdraws funds after DDs',
        'TBW - Transfers funds to another account',
        'TBW - Low banking activity',
        'TBW - No checking account',
        'TBW - New bank account',
        'TBW - New job',
        'TBW - Cust in collection',
        'TBW - Defaulted with us on the last payment',
        'TBW - Cool off by collections',
        'TBW - Not approved by collections',
        'TBW - DO NOT LOAN',
        'TBW - Cust in Military',
        'TBW - Unemployed',
        'TBW - Fraud',
        'TBW - Other: '
    ];

    const MODE_STORAGE_KEY = 'tbwNotesDropdown_mode';


    const HOST_ID = 'tbw-quick-host-sales';
    const INPUT_ID = 'tbwQuickSearchSales';
    const LIST_ID = 'tbwQuickListSales';
    const STYLE_ID = 'tbwQuickStylesSales';
    const HIGHLIGHT_CLASS = 'tbw-active';

    function norm(s) {
        return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function fillNotes(notesTextarea, value) {
        if (!notesTextarea || !value) return;

        notesTextarea.value = value;
        notesTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        notesTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        notesTextarea.focus();

        if (value === 'TBW - Other: ') {
            try {
                notesTextarea.setSelectionRange(value.length, value.length);
            } catch (e) {}
        }
    }

    function injectStyles() {
        const existingStyle = document.getElementById(STYLE_ID);
        if (existingStyle && existingStyle.dataset.lmsUwAssistantTbw === 'true') return;
        if (existingStyle) existingStyle.remove();

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.dataset.lmsUwAssistantTbw = 'true';
        style.textContent = `
          #${HOST_ID}{
              position: relative;
              display: inline-flex;
              align-items: flex-start;
              gap: 6px;
              margin-left: 8px;
              vertical-align: top;
          }

          #${HOST_ID} .tbw-input-wrap{
              position: relative;
              display: inline-block;
          }

          #${INPUT_ID}{
              width: 27ex;
              height: 24px;
              padding: 2px 24px 2px 8px;
              box-sizing: border-box;
              border: 1px solid #b7b7b7;
              background: #fff;
              color: #111;
              font-size: 11px;
              font-family: Arial, sans-serif;
              line-height: 20px;
          }

          #${INPUT_ID}::placeholder{
              color: #222;
              opacity: 1;
          }

          #${INPUT_ID}:focus{
              outline: none;
              border-color: #8f8f8f;
          }

          #${HOST_ID} .tbw-arrow{
              position: absolute;
              right: 9px;
              top: 50%;
              transform: translateY(-50%);
              pointer-events: none;
              color: #000;
              font-size: 10px;
              line-height: 1;
          }

          #${HOST_ID} .tbw-mode-toggle{
              height: 24px;
              min-width: 48px;
              padding: 2px 9px;
              box-sizing: border-box;
              border: 1px solid #1d5fbf;
              border-radius: 12px;
              background: #2f80ed;
              color: #fff;
              font-size: 11px;
              font-family: Arial, sans-serif;
              line-height: 18px;
              cursor: pointer;
              font-weight: bold;
          }

          #${HOST_ID} .tbw-mode-toggle:hover{
              filter: brightness(0.95);
          }

          #${HOST_ID}[data-mode="uw"] .tbw-mode-toggle{
              background: #2e9d4f;
              color: #fff;
              border-color: #237d3e;
          }

          #${LIST_ID}{
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: max-content;
    min-width: 320px;
    max-width: none; /* 👈 важно */
    max-height: 260px;
    overflow-y: auto;
    overflow-x: hidden;
    background: #ffffff; /* 👈 белый */
    color: #000000;
    border: 1px solid #c8c8c8;
    border-radius: 4px;
    box-shadow: 0 4px 10px rgba(0,0,0,.15);
    padding: 4px 0;
    z-index: 99999;
    display: none;
    font-family: Arial, sans-serif;
    white-space: nowrap;
}

          #${LIST_ID}.show{
              display: block;
          }

         #${LIST_ID} .tbw-item{
    padding: 6px 10px;
    font-size: 11px;
    cursor: pointer;
    color: #000;
}

#${LIST_ID} .tbw-item:hover{
    background: #e6f0ff;
}

#${LIST_ID} .tbw-item.${HIGHLIGHT_CLASS}{
    background: #cce0ff;
    color: #000;
}

#${LIST_ID} .tbw-separator{
    padding: 4px 10px;
    font-size: 10px;
    font-weight: bold;
    letter-spacing: .2px;
    color: #111;
    background: #e3e3e3;
    cursor: default;
}
          #${LIST_ID} .tbw-empty{
              padding: 8px 14px;
              font-size: 11px;
              color: #9fb2b8;
          }

          #${LIST_ID}::-webkit-scrollbar{
              width: 8px;
          }

          #${LIST_ID}::-webkit-scrollbar-thumb{
              background: rgba(255,255,255,0.18);
              border-radius: 8px;
          }
        `;
        document.head.appendChild(style);
    }

    function buildUI(standardSelect, notesTextarea) {
        const existingHost = document.getElementById(HOST_ID);
        if (existingHost) {
            if (existingHost.dataset.lmsUwAssistantTbw === 'true') return;
            existingHost.remove();
        }

        const legacyUwHost = document.getElementById('tbw-quick-host');
        if (legacyUwHost) {
            legacyUwHost.remove();
        }

        const host = document.createElement('div');
        host.id = HOST_ID;
        host.dataset.lmsUwAssistantTbw = 'true';

        let currentMode = localStorage.getItem(MODE_STORAGE_KEY) === 'uw' ? 'uw' : 'sales';

        const inputWrap = document.createElement('div');
        inputWrap.className = 'tbw-input-wrap';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = INPUT_ID;
        input.autocomplete = 'off';

        input.addEventListener('focus', () => {
            input.placeholder = '';
        });

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                input.placeholder = getPlaceholder();
            }
        });

        const arrow = document.createElement('span');
        arrow.className = 'tbw-arrow';
        arrow.textContent = '▼';

        const modeToggle = document.createElement('button');
        modeToggle.type = 'button';
        modeToggle.className = 'tbw-mode-toggle';

        const list = document.createElement('div');
        list.id = LIST_ID;

        inputWrap.appendChild(input);
        inputWrap.appendChild(arrow);
        inputWrap.appendChild(list);

        host.appendChild(inputWrap);
        host.appendChild(modeToggle);

        standardSelect.parentNode.insertBefore(host, standardSelect.nextSibling);

        let filtered = [];
        let activeIndex = -1;

        function isSeparator(item) {
            return typeof item === 'object' && item && item.separator;
        }

        function isSelectable(item) {
            return typeof item === 'string' && item.trim();
        }

        function getOptions() {
            return currentMode === 'uw' ? TBW_OPTIONS_UW : TBW_OPTIONS_SALES;
        }

        function getPlaceholder() {
            return currentMode === 'uw' ? '-- UW Notes --' : '-- Sales TBW Notes --';
        }

        function firstSelectableIndex(items) {
            return items.findIndex(isSelectable);
        }

        function moveActive(direction) {
            if (!filtered.length) return;

            let next = activeIndex;

            for (let i = 0; i < filtered.length; i++) {
                next += direction;

                if (next < 0) next = filtered.length - 1;
                if (next >= filtered.length) next = 0;

                if (isSelectable(filtered[next])) {
                    activeIndex = next;
                    updateHighlight();
                    return;
                }
            }
        }

        function renderList(items) {
            filtered = items;
            activeIndex = firstSelectableIndex(items);

            if (!items.length || activeIndex < 0) {
                list.innerHTML = `<div class="tbw-empty">No matches</div>`;
                return;
            }

            list.innerHTML = items.map((item, idx) => {
                if (isSeparator(item)) {
                    return `<div class="tbw-separator">── ${String(item.separator).toUpperCase()} ──</div>`;
                }

                return `
                    <div class="tbw-item ${idx === activeIndex ? HIGHLIGHT_CLASS : ''}" data-index="${idx}">
                        ${item}
                    </div>
                `;
            }).join('');
        }

        function positionList() {
            const rect = host.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const availableBelow = viewportHeight - rect.bottom - 20;
            list.style.maxHeight = Math.max(180, Math.min(availableBelow, 300)) + 'px';
        }

        function openList() {
            positionList();
            list.classList.add('show');
        }

        function closeList() {
            list.classList.remove('show');
            if (!input.value.trim() && document.activeElement !== input) {
                input.placeholder = getPlaceholder();
            }
        }

        function applyItem(value) {
            fillNotes(notesTextarea, value);
            input.value = '';
            input.placeholder = getPlaceholder();
            closeList();
            input.blur();
        }

        function cleanLabel(text) {
            return norm(text).replace(/^tbw\s*-\s*/, '');
        }

        function filterItems(term) {
            const q = norm(term);
            const options = getOptions();

            if (!q) return [...options];

            const scored = options
                .filter(isSelectable)
                .map(item => {
                    const full = norm(item);
                    const clean = cleanLabel(item);
                    const words = clean.split(/\s+/);

                    let score = 999;

                    if (clean === q) score = 0;
                    else if (clean.startsWith(q)) score = 1;
                    else if (words.some(w => w.startsWith(q))) score = 2;
                    else if (clean.includes(q)) score = 3;
                    else if (full.includes(q)) score = 4;
                    else return null;

                    return { item, score, clean };
                })
                .filter(Boolean)
                .sort((a, b) => {
                    if (a.score !== b.score) return a.score - b.score;
                    return a.clean.localeCompare(b.clean);
                });

            return scored.map(x => x.item);
        }

        function refreshList() {
            renderList(filterItems(input.value));
            positionList();
        }

        function updateHighlight() {
            const nodes = Array.from(list.querySelectorAll('.tbw-item'));
            nodes.forEach((node, idx) => {
                node.classList.toggle(HIGHLIGHT_CLASS, idx === activeIndex);
            });

            const activeNode = nodes[activeIndex];
            if (activeNode) {
                activeNode.scrollIntoView({ block: 'nearest' });
            }
        }

        input.addEventListener('focus', () => {
            refreshList();
            openList();
        });

        input.addEventListener('input', () => {
            refreshList();
            openList();
        });

        input.addEventListener('keydown', (e) => {
            if (!list.classList.contains('show') && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                refreshList();
                openList();
            }

            if (!filtered.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                moveActive(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                moveActive(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const chosen = filtered[Math.max(activeIndex, 0)];
                if (isSelectable(chosen)) applyItem(chosen);
            } else if (e.key === 'Escape') {
                closeList();
            }
        });

        list.addEventListener('mousemove', (e) => {
            const item = e.target.closest('.tbw-item');
            if (!item) return;

            const idx = Number(item.dataset.index);
            if (idx !== activeIndex) {
                activeIndex = idx;
                updateHighlight();
            }
        });

        list.addEventListener('mousedown', (e) => {
            const item = e.target.closest('.tbw-item');
            if (!item) return;

            e.preventDefault();
            const idx = Number(item.dataset.index);
            const chosen = filtered[idx];
            if (isSelectable(chosen)) applyItem(chosen);
        });

        document.addEventListener('mousedown', (e) => {
            if (!host.contains(e.target)) {
                closeList();
            }
        });

        arrow.addEventListener('mousedown', (e) => {
            e.preventDefault();

            if (list.classList.contains('show')) {
                closeList();
            } else {
                refreshList();
                openList();
                input.focus();
            }
        });

        function updateModeUI() {
            host.dataset.mode = currentMode;
            modeToggle.textContent = currentMode === 'uw' ? 'UW' : 'Sales';
            modeToggle.title = currentMode === 'uw' ? 'Switch to Sales notes' : 'Switch to UW notes';

            if (!input.value.trim() && document.activeElement !== input) {
                input.placeholder = getPlaceholder();
            }
        }

        modeToggle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            currentMode = currentMode === 'uw' ? 'sales' : 'uw';
            localStorage.setItem(MODE_STORAGE_KEY, currentMode);

            input.value = '';
            updateModeUI();
            refreshList();
            closeList();
            modeToggle.focus();
        });

        updateModeUI();

        window.addEventListener('resize', () => {
            if (list.classList.contains('show')) positionList();
        });
    }

    function initTBWQuickSearch() {
        const standardSelect = document.getElementById('standardNote');
        const notesTextarea = document.getElementById('maincontent_NewNoteText');

        if (!standardSelect || !notesTextarea) return;

        injectStyles();
        buildUI(standardSelect, notesTextarea);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTBWQuickSearch);
    } else {
        initTBWQuickSearch();
    }
})();

  } catch (error) {
    console.warn('[LMS UW Assistant] TBW Notes Dropdown failed to start:', error);
  }
}


/* ============================================================
   MODULE: CSS Bronze highlighter
   Source: LMS Bronze CSS Highlighter v0.9
   ============================================================ */
if (lmsUwAssistantModuleEnabled('cssBronzeHighlighter')) {
  try {

(function () {
  'use strict';

  const STYLE_ID = 'uw-bronze-css-highlighter-style';
  const HIGHLIGHT_CLASS = 'uw-bronze-css-highlight';
  const ROW_ATTR = 'data-uw-bronze-css-match';

  const SETTINGS = {
    showCounterBadge: false,

    // Pending Loans table:
    // Loan Type = column 4  => 0-based index 3
    // New/Renew = column 7  => 0-based index 6
    // Origin    = column 12 => 0-based index 11
    fallbackLoanTypeIndex: 3,
    fallbackNewRenewIndex: 6,
    fallbackOriginIndex: 11
  };

  const TARGET_ORIGINS = [
    'customer site service',
    'customer site',
    'mobile site'
  ];

  function clean(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function norm(text) {
    return clean(text).toLowerCase();
  }

  function isTargetOrigin(text) {
    return TARGET_ORIGINS.includes(norm(text));
  }

  function isLmsPage() {
    return /\/plm\.net(?:\/|$)/i.test(window.location.href);
  }

  function isPendingLoansPage() {
    const href = window.location.href;
    const pathOk = /\/plm\.net\/reports\/LoansReport\.aspx/i.test(href);
    const pendingOk = /(?:\?|&)reportpreset=pending(?:&|$)/i.test(window.location.search || href);

    return pathOk && pendingOk;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        color: #ff1493 !important;
        font-weight: 600 !important;
      }
    `;

    document.head.appendChild(style);
  }

  function getCells(row) {
    return Array.from(row.children).filter(cell =>
      /^(td|th)$/i.test(cell.tagName || '')
    );
  }

  function getHeaderCells(table) {
    const headerRow =
      table.querySelector('thead tr') ||
      Array.from(table.querySelectorAll('tr')).find(row =>
        /Loan\s*Date\/Time/i.test(clean(row.textContent || '')) &&
        /Origin/i.test(clean(row.textContent || ''))
      );

    return headerRow ? getCells(headerRow) : [];
  }

  function headerCellText(cell) {
    return clean(cell?.textContent || '').replace(/\s+/g, ' ');
  }

  function getColumnIndexes(table) {
    const headers = getHeaderCells(table);

    let loanTypeIndex = -1;
    let newRenewIndex = -1;
    let originIndex = -1;

    headers.forEach((cell, index) => {
      const text = headerCellText(cell);
      const sortClick = cell.querySelector('a.sortheader')?.getAttribute('onclick') || '';

      if (
        /Loan\s*Type/i.test(text) ||
        /sort\s*\(\s*3\s*\)/i.test(sortClick)
      ) {
        loanTypeIndex = index;
      }

      if (
        /^New\/Renew$/i.test(text) ||
        /sort\s*\(\s*64\s*\)/i.test(sortClick)
      ) {
        newRenewIndex = index;
      }

      if (
        /^Origin$/i.test(text) ||
        /sort\s*\(\s*175\s*\)/i.test(sortClick)
      ) {
        originIndex = index;
      }
    });

    return {
      loanTypeIndex: loanTypeIndex >= 0 ? loanTypeIndex : SETTINGS.fallbackLoanTypeIndex,
      newRenewIndex: newRenewIndex >= 0 ? newRenewIndex : SETTINGS.fallbackNewRenewIndex,
      originIndex: originIndex >= 0 ? originIndex : SETTINGS.fallbackOriginIndex
    };
  }

  function getReportTables() {
    const exact = Array.from(document.querySelectorAll('table.DataTable.FixedHeader'));

    if (exact.length) {
      return exact;
    }

    return Array.from(document.querySelectorAll('table')).filter(table => {
      const text = clean(table.textContent || '');
      return /Loan\s*Date\/Time/i.test(text) &&
        /Loan\s*Type/i.test(text) &&
        /Origin/i.test(text);
    });
  }

  function getReportRows(table) {
    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));

    if (bodyRows.length) {
      return bodyRows;
    }

    return Array.from(table.querySelectorAll('tr')).filter(row =>
      row.querySelectorAll('td').length >= 12
    );
  }

  function isPendingTargetRow(row, indexes) {
    const cells = getCells(row);

    if (cells.length <= Math.max(
      indexes.loanTypeIndex,
      indexes.newRenewIndex,
      indexes.originIndex
    )) {
      return false;
    }

    const loanTypeText = norm(cells[indexes.loanTypeIndex]?.textContent);
    const newRenewText = norm(cells[indexes.newRenewIndex]?.textContent);
    const originText = norm(cells[indexes.originIndex]?.textContent);

    return loanTypeText === 'bronze' &&
      newRenewText === 'n' &&
      isTargetOrigin(originText);
  }

  function setBronzeHighlight(cell, enabled) {
    if (!cell) return false;

    const isBronze = /^bronze$/i.test(clean(cell.textContent || ''));

    if (!isBronze) {
      cell.classList.remove(HIGHLIGHT_CLASS);
      return false;
    }

    cell.classList.toggle(HIGHLIGHT_CLASS, Boolean(enabled));

    return Boolean(enabled);
  }

  function scanPendingLoans() {
    if (!isPendingLoansPage()) return 0;

    let count = 0;

    for (const table of getReportTables()) {
      const indexes = getColumnIndexes(table);

      for (const row of getReportRows(table)) {
        const cells = getCells(row);
        const loanTypeCell = cells[indexes.loanTypeIndex];

        if (!isPendingTargetRow(row, indexes)) {
          row.removeAttribute(ROW_ATTR);
          setBronzeHighlight(loanTypeCell, false);
          continue;
        }

        row.setAttribute(ROW_ATTR, '1');

        if (setBronzeHighlight(loanTypeCell, true)) {
          count += 1;
        }
      }
    }

    return count;
  }

  function getNextTd(cell) {
    let node = cell?.nextElementSibling || null;

    while (node && !/^td$/i.test(node.tagName || '')) {
      node = node.nextElementSibling;
    }

    return node || null;
  }

  function findValueCellAfterLabel(labelRegex) {
    const cells = Array.from(document.querySelectorAll('td'));

    for (const cell of cells) {
      const text = clean(cell.textContent || '');

      if (!labelRegex.test(text)) continue;

      const next = getNextTd(cell);
      if (next) return next;
    }

    return null;
  }

  function hasTargetOriginInsideApplication() {
    const rows = Array.from(document.querySelectorAll('tr'));

    for (const row of rows) {
      const cells = getCells(row);

      for (let i = 0; i < cells.length - 1; i++) {
        const label = clean(cells[i].textContent || '');
        const value = clean(cells[i + 1].textContent || '');

        if (/^Origin\s*:$/i.test(label) && isTargetOrigin(value)) {
          return true;
        }
      }
    }

    return false;
  }

  function scanInsideApplication() {
    if (isPendingLoansPage()) return 0;

    const statusCell = findValueCellAfterLabel(/^Loyalty Status\s*:$/i);
    const currentPointsCell = findValueCellAfterLabel(/^Loyalty Current Points\s*:$/i);
    const requiredPointsCell = findValueCellAfterLabel(/^Loyalty Required Points\s*:$/i);

    if (!statusCell || !currentPointsCell || !requiredPointsCell) {
      return 0;
    }

    const hasBronzeStatus = /^Bronze$/i.test(clean(statusCell.textContent || ''));
    const hasCurrentPoints = /^200$/i.test(clean(currentPointsCell.textContent || ''));
    const hasRequiredPoints = /^500$/i.test(clean(requiredPointsCell.textContent || ''));
    const hasTargetOrigin = hasTargetOriginInsideApplication();

    const shouldHighlight =
      hasBronzeStatus &&
      hasCurrentPoints &&
      hasRequiredPoints &&
      hasTargetOrigin;

    return setBronzeHighlight(statusCell, shouldHighlight) ? 1 : 0;
  }

  function scan() {
    if (!isLmsPage()) return 0;

    injectStyles();

    const pendingCount = scanPendingLoans();
    const applicationCount = scanInsideApplication();

    return pendingCount + applicationCount;
  }

  function boot() {
    if (!isLmsPage()) return;

    // No MutationObserver on purpose:
    // adding/removing DOM wrappers caused a visible second render on application pages.
    // This version only toggles a CSS class on the exact Bronze cell.
    scan();

    setTimeout(scan, 700);
    setTimeout(scan, 1600);

    window.addEventListener('focus', scan);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

  } catch (error) {
    console.error('[LMS UW Assistant] CSS Bronze highlighter failed:', error);
  }
}


/* ============================================================
   MODULE: DL Status Checker
   Source: LMS DL Follow-Up Status Checker v1.3
   ============================================================ */
if (lmsUwAssistantModuleEnabled('dlStatusChecker')) {
  try {

(function () {
  'use strict';

  const STYLE_ID = 'lms-dl-followup-status-checker-style';
  const ROW_PROCESSED_ATTR = 'data-dl-followup-checker-processed';
  const CODE_ATTR = 'data-dl-request-code';
  const TOOLBAR_ID = 'lms-dl-followup-toolbar';

  const DL_REPORTS_URL = 'https://portal.decisionlogic.com/Reports.aspx';
  const DL_LOGIN_URL = 'https://portal.decisionlogic.com/Login.aspx';
  const CRP_REPORT_BASE_URL = 'https://ibv.creditsense.ai/report/DecisionLogic/';

  const STATUS_BY_COLOR = {
    '#228822': {
      label: 'Login, Verified',
      className: 'dl-status-ok'
    },
    '#FFBF00': {
      label: 'Account Error',
      className: 'dl-status-warning'
    },
    '#CC3333': {
      label: 'Bank Error',
      className: 'dl-status-error'
    },
    '#A0A0A0': {
      label: 'Started, Not Completed',
      className: 'dl-status-muted'
    },
    '#D0D0D0': {
      label: 'Not Started',
      className: 'dl-status-light'
    }
  };

  const resultCache = new Map();
  let scanTimer = null;
  let isCheckingAll = false;

  function clean(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function isLmsCustomerPage() {
    return /\/plm\.net\/customers\/CustomerDetails\.aspx/i.test(window.location.href) ||
      Boolean(document.getElementById('ctl00_FollowUpsLink')) ||
      Boolean(document.querySelector('.tr-followup'));
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${TOOLBAR_ID} {
        display: none;
        margin-top: 17px;
        margin-left: -5px;
        clear: both;
        white-space: nowrap;
        position: relative;
        top: 7px;
        left: 0;
      }

      #${TOOLBAR_ID}.dl-has-codes {
        display: block;
      }

      .dl-followup-action-cell {
        white-space: nowrap;
        padding-left: 4px;
      }

      .dl-followup-btn {
        display: inline-block;
        padding: 3px 9px;
        border: 1px solid #777;
        border-radius: 0;
        background: #f5f5f5;
        color: #111 !important;
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
        text-decoration: none !important;
        cursor: pointer;
        user-select: none;
        vertical-align: middle;
        white-space: nowrap;
      }

      .dl-followup-btn:hover {
        filter: brightness(0.96);
      }

      .dl-followup-btn[aria-disabled="true"] {
        opacity: 0.65;
        cursor: default;
        pointer-events: none;
      }

      .dl-followup-open-crp-btn {
        border-color: #7952b3;
        background: #f1eafd;
        color: #4b2c7a !important;
        box-shadow: 0 0 0 1px rgba(121, 82, 179, 0.14);
      }

      .dl-followup-open-crp-btn:hover {
        background: #e6d8fb;
        border-color: #4b2c7a;
      }

      .dl-followup-check-all-btn {
        box-sizing: border-box;
        width: 82px;
        min-width: 82px;
        padding-left: 2px;
        padding-right: 2px;
        text-align: center;
        border-color: #0d6efd;
        background: #e7f1ff;
        color: #084298 !important;
        box-shadow: 0 0 0 1px rgba(13, 110, 253, 0.16);
      }

      .dl-followup-check-all-btn:hover {
        background: #d8eaff;
        border-color: #084298;
      }

      .dl-followup-status-pill {
        display: inline-block;
        box-sizing: border-box;
        min-height: 21px;
        margin-left: 5px;
        padding: 3px 6px;
        border-radius: 0;
        border: 1px solid #aaa;
        background: #f5f5f5;
        color: #111;
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
        vertical-align: middle;
        white-space: nowrap;
      }

      .dl-status-ok {
        border-color: #228822;
        background: #e8f5e8;
        color: #145c14;
      }

      .dl-status-warning {
        border-color: #d49a00;
        background: #fff5d6;
        color: #7a5600;
      }

      .dl-status-error {
        border-color: #cc3333;
        background: #fde7e7;
        color: #992424;
      }

      .dl-status-muted {
        border-color: #777;
        background: #eeeeee;
        color: #444;
      }

      .dl-status-light {
        border-color: #b5b5b5;
        background: #f7f7f7;
        color: #777;
      }

      .dl-status-info {
        border-color: #337ab7;
        background: #e8f2fb;
        color: #23527c;
      }
    `;

    document.head.appendChild(style);
  }

  function extractRequestCode(text) {
    const source = clean(text);

    const requestCodeMatch = source.match(/\bRequest\s*Code\s*[:#-]?\s*([A-Z0-9]{6})\b/i);
    if (requestCodeMatch) {
      return requestCodeMatch[1].toUpperCase();
    }

    const dlUrlMatch = source.match(/(?:app\.decisionlogic\.com|DecisionLogic)\/([A-Z0-9]{6})\b/i);
    if (dlUrlMatch) {
      return dlUrlMatch[1].toUpperCase();
    }

    const candidates = source.match(/\b[A-Z0-9]{6}\b/g) || [];

    for (const candidate of candidates) {
      // DecisionLogic request codes can be mixed letters/numbers like BMQ6AR
      // or letters-only like VHZLQS.
      if (/^[A-Z0-9]{6}$/.test(candidate)) {
        return candidate.toUpperCase();
      }
    }

    return null;
  }

  function getFollowUpText(row) {
    const textCell = row.querySelector('.td1') || row.cells?.[0] || row;
    return clean(textCell.textContent || '');
  }

  function getActionRow(row) {
    const actionTableRow = row.querySelector('.td2 table tr');
    if (actionTableRow) return actionTableRow;

    const td2 = row.querySelector('.td2');
    if (td2) return td2;

    return row;
  }

  function setStatus(row, status, code) {
    let pill = row.querySelector('.dl-followup-status-pill');

    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'dl-followup-status-pill dl-status-info';

      const actionCell = row.querySelector('.dl-followup-action-cell');
      if (actionCell) {
        actionCell.appendChild(pill);
      } else {
        row.appendChild(pill);
      }
    }

    pill.className = `dl-followup-status-pill ${status.className || 'dl-status-info'}`;
    pill.textContent = code ? `${code}: ${status.label}` : status.label;
    pill.title = status.title || '';
  }

  function getDetectedRows() {
    return Array.from(document.querySelectorAll('.tr-followup'))
      .map(row => {
        const code = row.getAttribute(CODE_ATTR) || extractRequestCode(getFollowUpText(row));
        return code ? { row, code: code.toUpperCase() } : null;
      })
      .filter(Boolean);
  }

  function openCrp(code) {
    window.open(CRP_REPORT_BASE_URL + encodeURIComponent(code), '_blank');
  }

  function addOpenCrpButtonToRow(row, code) {
    const currentCode = row.getAttribute(CODE_ATTR);

    if (row.getAttribute(ROW_PROCESSED_ATTR) === '1' && currentCode === code) {
      return;
    }

    row.setAttribute(ROW_PROCESSED_ATTR, '1');
    row.setAttribute(CODE_ATTR, code);

    const oldCell = row.querySelector('.dl-followup-action-cell');
    if (oldCell) oldCell.remove();

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dl-followup-btn dl-followup-open-crp-btn';
    button.textContent = 'Open in CRP';
    button.title = `Open CRP report for ${code}`;

    const actionCell = document.createElement('td');
    actionCell.className = 'dl-followup-action-cell';
    actionCell.appendChild(button);

    const actionRow = getActionRow(row);

    if (/^tr$/i.test(actionRow.tagName || '')) {
      actionRow.appendChild(actionCell);
    } else {
      actionRow.appendChild(button);
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCrp(code);
    });
  }

  function findFollowUpsLabel() {
    return document.getElementById('ctl00_FollowUpsLink') ||
      Array.from(document.querySelectorAll('a, div, span, td, label, b, strong')).find(el =>
        clean(el.textContent || '').startsWith('Follow-Ups')
      );
  }

  function ensureToolbar() {
    const label = findFollowUpsLabel();
    if (!label) return null;

    let toolbar = document.getElementById(TOOLBAR_ID);

    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = TOOLBAR_ID;

      const checkAllButton = document.createElement('button');
      checkAllButton.type = 'button';
      checkAllButton.className = 'dl-followup-btn dl-followup-check-all-btn';
      checkAllButton.textContent = 'Check DLs';
      checkAllButton.title = 'Check all detected DecisionLogic follow-up request codes.';

      toolbar.appendChild(checkAllButton);

      const labelCell = label.closest('td');
      if (labelCell) {
        labelCell.appendChild(toolbar);
      } else {
        label.insertAdjacentElement('afterend', toolbar);
      }

      checkAllButton.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await checkAllDetectedCodes();
      });
    }

    updateToolbarVisibility();

    return toolbar;
  }

  function updateToolbarVisibility() {
    const toolbar = document.getElementById(TOOLBAR_ID);
    if (!toolbar) return;

    const rows = getDetectedRows();
    const uniqueCodes = new Set(rows.map(item => item.code));

    toolbar.classList.toggle('dl-has-codes', uniqueCodes.size > 0);
  }

  function setCheckAllButtonBusy(busy, label = null) {
    const toolbar = document.getElementById(TOOLBAR_ID);
    const button = toolbar?.querySelector('.dl-followup-check-all-btn');

    if (!button) return;

    button.setAttribute('aria-disabled', busy ? 'true' : 'false');
    button.textContent = label || (busy ? 'Loading...' : 'Check DLs');
  }

  async function checkAllDetectedCodes() {
    if (isCheckingAll) return;

    const items = getDetectedRows();

    if (!items.length) {
      alert('No DecisionLogic request codes were detected in Follow-Ups.');
      return;
    }

    const grouped = new Map();

    for (const item of items) {
      if (!grouped.has(item.code)) grouped.set(item.code, []);
      grouped.get(item.code).push(item.row);
    }

    isCheckingAll = true;
    setCheckAllButtonBusy(true, 'Loading...');

    let index = 0;

    try {
      for (const [code, rows] of grouped.entries()) {
        index += 1;
        setCheckAllButtonBusy(true, 'Loading...');

        rows.forEach(row => {
          setStatus(row, { label: 'Checking...', className: 'dl-status-info' }, code);
        });

        let result;

        try {
          result = await checkDecisionLogicStatus(code);
        } catch (error) {
          result = {
            loginNeeded: false,
            status: {
              label: 'Error',
              className: 'dl-status-error',
              title: error?.message || String(error || 'Unknown error')
            }
          };
        }

        if (result.loginNeeded) {
          rows.forEach(row => {
            setStatus(row, {
              label: 'Login needed',
              className: 'dl-status-warning',
              title: 'Please log in to DecisionLogic first.'
            }, code);
          });

          alert('Please log in to DecisionLogic first, then click Check DLs again.');
          window.open(DL_LOGIN_URL, '_blank');
          break;
        }

        rows.forEach(row => {
          setStatus(row, result.status, code);
        });
      }
    } finally {
      isCheckingAll = false;
      setCheckAllButtonBusy(false, 'Check DLs');
    }
  }

  function scanFollowUps() {
    if (!isLmsCustomerPage()) return;

    injectStyles();

    const rows = Array.from(document.querySelectorAll('.tr-followup'));

    for (const row of rows) {
      const text = getFollowUpText(row);
      const code = extractRequestCode(text);

      if (!code) continue;

      addOpenCrpButtonToRow(row, code);
    }

    ensureToolbar();
  }

  function scheduleScan() {
    if (scanTimer) clearTimeout(scanTimer);

    scanTimer = setTimeout(() => {
      scanTimer = null;
      scanFollowUps();
    }, 250);
  }

  function gmRequest(options) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        ...options,
        timeout: options.timeout || 20000,
        anonymous: false,
        onload: resolve,
        onerror: reject,
        ontimeout: () => reject(new Error('DecisionLogic request timed out.'))
      });
    });
  }

  function parseHtml(html) {
    return new DOMParser().parseFromString(String(html || ''), 'text/html');
  }

  function isLoginResponse(response, doc) {
    const finalUrl = response?.finalUrl || response?.responseURL || '';

    if (/\/Login\.aspx/i.test(finalUrl)) return true;
    if (doc.querySelector('input[type="password"]')) return true;
    if (doc.querySelector('form[action*="Login.aspx" i]')) return true;

    const title = clean(doc.title || '');
    const bodyText = clean(doc.body?.textContent || '');

    return /login/i.test(title) && /password/i.test(bodyText);
  }

  function buildReportsPostPayload(doc, code) {
    const form = doc.querySelector('form');

    if (!form) {
      throw new Error('DecisionLogic Reports form was not found.');
    }

    const params = new URLSearchParams();

    form.querySelectorAll('input, select, textarea').forEach(element => {
      const name = element.getAttribute('name');
      if (!name) return;

      const tag = (element.tagName || '').toLowerCase();
      const type = (element.getAttribute('type') || '').toLowerCase();

      if (type === 'submit' || type === 'button' || type === 'image' || type === 'file') {
        return;
      }

      if ((type === 'checkbox' || type === 'radio') && !element.checked) {
        return;
      }

      if (tag === 'select') {
        const selected = Array.from(element.options || []).filter(option => option.selected);

        if (element.multiple) {
          selected.forEach(option => params.append(name, option.value));
        } else {
          params.append(name, selected[0]?.value || element.value || '');
        }

        return;
      }

      params.append(name, element.value || '');
    });

    const requestInput =
      form.querySelector('#ctl00_ctl00_MainContent_MainContent_tbRequestCode') ||
      form.querySelector('input[name$="$tbRequestCode"]') ||
      form.querySelector('input[id$="_tbRequestCode"]');

    const requestName =
      requestInput?.getAttribute('name') ||
      'ctl00$ctl00$MainContent$MainContent$tbRequestCode';

    params.set(requestName, code);

    const updateButton =
      form.querySelector('#ctl00_ctl00_MainContent_MainContent_btnUpdate') ||
      form.querySelector('input[name$="$btnUpdate"]') ||
      form.querySelector('input[id$="_btnUpdate"]');

    const buttonName =
      updateButton?.getAttribute('name') ||
      'ctl00$ctl00$MainContent$MainContent$btnUpdate';

    params.set(buttonName, updateButton?.getAttribute('value') || 'Update');

    const action = form.getAttribute('action') || 'Reports.aspx';
    const actionUrl = new URL(action, DL_REPORTS_URL).href;

    return {
      actionUrl,
      body: params.toString()
    };
  }

  function normalizeHexColor(color) {
    const raw = clean(color).toUpperCase();

    if (!raw) return '';

    if (raw.startsWith('#')) {
      if (/^#[0-9A-F]{3}$/i.test(raw)) {
        return '#' + raw.slice(1).split('').map(ch => ch + ch).join('').toUpperCase();
      }

      return raw;
    }

    const rgbMatch = raw.match(/RGBA?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);

    if (rgbMatch) {
      return '#' + [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map(value => {
        const n = Math.max(0, Math.min(255, Number(value) || 0));
        return n.toString(16).padStart(2, '0').toUpperCase();
      }).join('');
    }

    return raw;
  }

  function getBackgroundColorFromStyle(element) {
    const styleText = element.getAttribute('style') || '';
    const inlineMatch = styleText.match(/background(?:-color)?\s*:\s*([^;]+)/i);

    if (inlineMatch) {
      return normalizeHexColor(inlineMatch[1]);
    }

    return normalizeHexColor(element.style?.backgroundColor || '');
  }

  function parseDecisionLogicStatus(html, code) {
    const doc = parseHtml(html);

    const links = Array.from(doc.querySelectorAll('a[id$="_hyRequestCode"], a[href*="requestCode="]'));

    const reportLink = links.find(link => {
      const linkText = clean(link.textContent).toUpperCase();
      const href = link.getAttribute('href') || '';

      return linkText === code.toUpperCase() ||
        new RegExp(`requestCode=${code}\\b`, 'i').test(href);
    });

    if (!reportLink) {
      return {
        label: 'Not found',
        className: 'dl-status-muted',
        title: 'No matching DecisionLogic report was found.'
      };
    }

    const row = reportLink.closest('tr');

    if (!row) {
      return {
        label: 'Found, status unknown',
        className: 'dl-status-info',
        title: 'Report was found, but result row was not detected.'
      };
    }

    const colorDivs = Array.from(row.querySelectorAll('div')).filter(div =>
      /background/i.test(div.getAttribute('style') || '') ||
      div.style?.backgroundColor
    );

    for (const div of colorDivs) {
      const color = getBackgroundColorFromStyle(div);
      const mapped = STATUS_BY_COLOR[color];

      if (mapped) {
        return {
          ...mapped,
          title: `DecisionLogic color: ${color}`
        };
      }
    }

    return {
      label: 'Found, status unknown',
      className: 'dl-status-info',
      title: 'Report was found, but status color was not recognized.'
    };
  }

  async function checkDecisionLogicStatus(code) {
    const normalizedCode = String(code || '').toUpperCase();

    if (resultCache.has(normalizedCode)) {
      return resultCache.get(normalizedCode);
    }

    const reportsResponse = await gmRequest({
      method: 'GET',
      url: DL_REPORTS_URL,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const reportsDoc = parseHtml(reportsResponse.responseText);

    if (isLoginResponse(reportsResponse, reportsDoc)) {
      return { loginNeeded: true };
    }

    const post = buildReportsPostPayload(reportsDoc, normalizedCode);

    const searchResponse = await gmRequest({
      method: 'POST',
      url: post.actionUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      data: post.body
    });

    const searchDoc = parseHtml(searchResponse.responseText);

    if (isLoginResponse(searchResponse, searchDoc)) {
      return { loginNeeded: true };
    }

    const status = parseDecisionLogicStatus(searchResponse.responseText, normalizedCode);
    const result = { loginNeeded: false, status };

    resultCache.set(normalizedCode, result);
    return result;
  }

  function boot() {
    if (!isLmsCustomerPage()) return;

    scanFollowUps();

    setTimeout(scanFollowUps, 800);
    setTimeout(scanFollowUps, 2000);
    setTimeout(scanFollowUps, 4000);

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('focus', scheduleScan);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

  } catch (error) {
    console.error('[LMS UW Assistant] DL Status Checker failed:', error);
  }
}

/* ============================================================
   MODULE: Military Income Alert
   Source: new (CRP report page, not LMS)
   ============================================================ */
if (lmsUwAssistantModuleEnabled('militaryIncomeAlert')) {
  try {

(function () {
  'use strict';

  const STYLE_ID = 'uw-military-income-alert-style';
  const CONTAINER_ID = 'uw-military-income-alert-toast';

  const PATTERNS = [
    { label: 'DFAS-CLEVELAND', regex: /\bDFAS[\s-]*CLEVELAND\b/i },
    { label: 'DFAS-IN', regex: /\bDFAS[\s-]*IN\b/i },
    { label: 'DFAS', regex: /\bDFAS\b/i },
    { label: 'Department of Defense', regex: /\bDEPARTMENT\s+OF\s+DEFENSE\b/i },
    { label: 'Dept of Defense', regex: /\bDEPT\.?\s+OF\s+DEFENSE\b/i },
    { label: 'DOD', regex: /\bDOD\b/i },
    { label: 'ARMY RC', regex: /\bARMY[\s-]*RC\b/i },
    { label: 'ARMY ACT', regex: /\bARMY[\s-]*ACT\b/i },
    { label: 'NAVY ACT', regex: /\bNAVY[\s-]*ACT\b/i },
    { label: 'CIVFED SAL', regex: /\bCIVFED[\s-]*SAL\b/i },
    { label: 'DCPS', regex: /\bDCPS\b/i },
    { label: 'Marine Corps Total Fitness', regex: /\bMARINE\s+CORPS\s+TOTAL\s+FITNESS\b/i },
    { label: 'MCTF', regex: /\bMCTF\b/i },
    { label: 'Military Payroll Income', regex: /\bMILITARY\s+PAYROLL\s+INCOME\b/i }
  ];

  const ROW_SELECTOR = 'tr[data-testid^="BankReport.Transactions.TransactionsTable-"][data-testid$=".TableRow"]';
  const RISK_FACTOR_SELECTOR = '[data-testid^="BankReport.ExposureRiskFactors.RiskFactor-"][data-testid$=".Chip"]';

  const state = {
    processedRows: new Set(),
    processedRiskFactors: new Set(),
    // Transactions are the primary signal. Once a transaction-based match has
    // fired, the Risk Factors chip is never used as a fallback trigger again.
    transactionMatchFound: false,
    scheduled: null
  };

  function isCrpReportPage() {
    return /(^|\.)ibv\.creditsense\.ai$/i.test(window.location.hostname) &&
      /^\/report(?:\/|$)/i.test(window.location.pathname);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTAINER_ID} {
        position: fixed;
        top: 13px;
        right: 563px;
        z-index: 999999;
        max-width: 320px;
      }

      #${CONTAINER_ID} .uw-mia-card {
        position: relative;
        background: #ffffff;
        border-left: 5px solid #d9534f;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        padding: 14px 34px 14px 16px;
        font-family: -apple-system, "Segoe UI", Arial, sans-serif;
        color: #26324a;
        animation: uw-mia-slide-in .2s ease-out;
      }

      @keyframes uw-mia-slide-in {
        from { transform: translateX(24px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      #${CONTAINER_ID} .uw-mia-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 15px;
        margin-bottom: 6px;
        color: #a4312b;
      }

      #${CONTAINER_ID} .uw-mia-matches {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        background: #fdecea;
        font-size: 14px;
        font-weight: 700;
        color: #a4312b;
        word-break: break-word;
      }

      #${CONTAINER_ID} .uw-mia-close {
        position: absolute;
        top: 8px;
        right: 10px;
        border: 0;
        background: transparent;
        font-size: 15px;
        line-height: 1;
        cursor: pointer;
        color: #8a93a6;
        padding: 2px;
      }

      #${CONTAINER_ID} .uw-mia-close:hover {
        color: #26324a;
      }
    `;

    document.head.appendChild(style);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function ensureContainer() {
    injectStyles();

    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      document.body.appendChild(container);
    }
    return container;
  }

  // Only one popup is shown at a time: a new match replaces whatever is
  // currently displayed instead of stacking another card underneath it.
  function showToast(matches) {
    const container = ensureContainer();
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'uw-mia-card';
    card.innerHTML = `
      <button type="button" class="uw-mia-close" aria-label="Close">&times;</button>
      <div class="uw-mia-title">\u{1F396}️ Possible Military Income</div>
      <div class="uw-mia-matches">${escapeHtml(matches.map(m => m.toUpperCase()).join(', '))}</div>
    `;

    container.appendChild(card);

    card.querySelector('.uw-mia-close').addEventListener('click', () => {
      card.remove();
    });
  }

  function matchPatterns(text) {
    const found = [];
    for (const pattern of PATTERNS) {
      if (pattern.regex.test(text) && !found.includes(pattern.label)) {
        found.push(pattern.label);
      }
    }
    return found;
  }

  function getRowPrefix(row) {
    const testId = row.getAttribute('data-testid') || '';
    const suffix = '.TableRow';
    if (!testId.endsWith(suffix)) return null;
    return testId.slice(0, testId.length - suffix.length);
  }

  function getCellText(row, prefix, field) {
    const cell = row.querySelector(`[data-testid="${prefix}-${field}.TableCell"]`);
    if (!cell) return '';
    return (cell.innerText || cell.textContent || '').trim();
  }

  function parseAmount(text) {
    if (!text) return NaN;
    const cleaned = text.replace(/[^0-9.\-]/g, '');
    if (!cleaned) return NaN;
    return parseFloat(cleaned);
  }

  // Source 1: individual credit/income transaction rows.
  function scanTransactions() {
    const rows = Array.from(document.querySelectorAll(ROW_SELECTOR));

    for (const row of rows) {
      const prefix = getRowPrefix(row);
      if (!prefix) continue;

      const rowId = row.getAttribute('data-row-id') || prefix;
      if (state.processedRows.has(rowId)) continue;

      const amount = parseAmount(getCellText(row, prefix, 'amount'));
      // Only credit/income transactions (money coming in), not debits.
      if (!(amount > 0)) continue;

      const description = getCellText(row, prefix, 'description');
      const company = getCellText(row, prefix, 'company');
      const label = [description, company].filter(Boolean).join(' ');
      if (!label) continue;

      const matches = matchPatterns(label);
      if (matches.length) {
        state.processedRows.add(rowId);
        state.transactionMatchFound = true;
        showToast(matches);
      }
    }
  }

  // Source 2 (fallback only): CRP's own "Risk Factors" chips, e.g.
  // "DFAS / Military Payroll Income Detected". This only runs when the
  // transactions table hasn't produced a match (transactions are primary).
  function scanRiskFactors() {
    const chips = Array.from(document.querySelectorAll(RISK_FACTOR_SELECTOR));

    for (const chip of chips) {
      const chipId = chip.getAttribute('data-testid') || '';
      if (!chipId || state.processedRiskFactors.has(chipId)) continue;

      const text = (chip.innerText || chip.textContent || '').trim();
      if (!text) continue;

      const matches = matchPatterns(text);
      if (matches.length) {
        state.processedRiskFactors.add(chipId);
        showToast(matches);
      }
    }
  }

  function scan() {
    scanTransactions();

    // Fallback: only look at Risk Factors chips if no transaction-based
    // match has ever fired (transactions are the primary signal).
    if (!state.transactionMatchFound) {
      scanRiskFactors();
    }
  }

  function scheduleScan() {
    if (state.scheduled) return;

    state.scheduled = setTimeout(() => {
      state.scheduled = null;
      scan();
    }, 600);
  }

  function boot() {
    if (!isCrpReportPage()) return;

    scan();
    setTimeout(scan, 1500);
    setTimeout(scan, 3500);

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

  } catch (error) {
    console.warn('[LMS UW Assistant] Military Income Alert failed to start:', error);
  }
}
