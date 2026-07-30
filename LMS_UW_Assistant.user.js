// ==UserScript==
// @name         LMS UW Assistant
// @namespace    https://github.com/PashaKrch/lms-underwriting-tools
// @version      1.2
// @description  Combined LMS underwriting helper menu with optional UW modules.
// @author       Pavlo Korochenko
// @match        *://*/*
// @updateURL    https://raw.githubusercontent.com/PashaKrch/lms-underwriting-tools/main/LMS_UW_Assistant.user.js
// @downloadURL  https://raw.githubusercontent.com/PashaKrch/lms-underwriting-tools/main/LMS_UW_Assistant.user.js
// @run-at       document-idle
// @grant        none
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
      notificationStatusChecker: true
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
      }
    ]
  };

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
        padding: 0 8px !important;
        margin: 0 !important;
        height: 17px;
        line-height: 17px;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        font-weight: normal;
        text-shadow: none;
        text-transform: none;
        white-space: nowrap;
        background: transparent;
        border: 0;
        pointer-events: auto;
      }

      #${APP.menuId}.uw-open,
      #${APP.menuId}:hover {
        background: rgba(255,255,255,0.16);
      }

      #${APP.dropdownId} {
        position: absolute;
        z-index: 1008;
        min-width: 315px;
        max-width: 380px;
        box-sizing: border-box;
        border-collapse: collapse;
        background: #1f1f1f;
        color: White;
        border: 1px solid #050505;
        box-shadow: 2px 3px 8px rgba(0,0,0,0.35);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        display: none;
      }

      #${APP.dropdownId}.uw-visible {
        display: block;
      }

      #${APP.dropdownId} .uw-head {
        padding: 6px 9px;
        background: #101010;
        color: White;
        font-weight: bold;
        font-size: 12px;
        border-bottom: 1px solid #3a3a3a;
      }

      #${APP.dropdownId} .uw-body {
        padding: 0;
      }

      #${APP.dropdownId} .uw-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 6px 9px;
        border-bottom: 1px solid rgba(255,255,255,0.16);
        color: White;
        cursor: default;
      }

      #${APP.dropdownId} .uw-row:hover {
        background: rgba(255,255,255,0.14);
      }

      #${APP.dropdownId} .uw-row:last-child {
        border-bottom: 0;
      }

      #${APP.dropdownId} .uw-name {
        font-weight: normal;
        font-size: 12px;
        color: White;
        text-transform: none;
      }

      #${APP.dropdownId} .uw-note {
        margin-top: 2px;
        font-size: 11px;
        color: #e6e6e6;
        line-height: 1.25;
      }

      #${APP.dropdownId} .uw-switch {
        width: 39px;
        height: 20px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.65);
        padding: 0;
        cursor: pointer;
        background: #6b6b6b;
        position: relative;
        flex: 0 0 auto;
        transition: background .15s ease;
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
        transition: left .15s ease;
      }

      #${APP.dropdownId} .uw-switch.uw-on {
        background: #36a853;
      }

      #${APP.dropdownId} .uw-switch.uw-on::after {
        left: 21px;
      }

      #${APP.dropdownId} .uw-footer {
        padding: 6px 9px;
        border-top: 1px solid rgba(255,255,255,0.16);
        color: #e6e6e6;
        font-size: 11px;
        line-height: 1.35;
        background: #141414;
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
      <div class="uw-head">🛠️ LMS UW Assistant</div>
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
        Refresh after changes.
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

  function updatePreview() {
    const preview = qs('#uw-preview');
    if (preview) preview.value = getFinalText();
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
      updatePreview();
      return;
    }

    const label = document.createElement('label');
    label.textContent = cfg.label;
    label.style.cssText = 'display:block;font-weight:bold;margin-bottom:3px;';

    const input = document.createElement('input');
    input.id = 'uw-extra';
    input.placeholder = cfg.placeholder;
    input.style.cssText = 'width:100%;box-sizing:border-box;';
    input.addEventListener('input', updatePreview);

    wrap.append(label, input);
    updatePreview();
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
      <div style="font-weight:bold;margin-bottom:6px;color:#006ea8;font-size:14px;">UW Canned Follow-Up</div>
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
      }

      #${PANEL_ID} button {
        border: 0;
        border-radius: 4px;
        padding: 6px 9px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
        margin-right: 5px;
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
        `Rows/customers: ${state.total}`,
        `Checked: ${state.checked}`,
        `Found: ${state.found}`,
        `Failed: ${state.failed}`
      ];

      if (state.skipped) {
        parts.push(`Skipped: ${state.skipped}`);
      }

      status.innerHTML = `
        <div>${parts.join(' / ')}</div>
        <div>${extraText || (state.running ? 'Scanning...' : 'Ready.')}</div>
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
      <div class="uw-title">DL follow up scan</div>

      <div style="margin-bottom:7px;">
        <button id="uw-need-dl-scan-btn" type="button">Scan visible rows</button>
        <button id="uw-need-dl-stop-btn" type="button" disabled>Stop</button>
        <button id="uw-need-dl-clear-btn" type="button">Clear</button>
      </div>


      <div style="font-size:11px; color:#666;">
        Read-only. Yellow row = matching Need DL follow-up. Drag the title to move this panel.
      </div>

      <div id="uw-need-dl-progress-wrap">
        <div id="uw-need-dl-progress"></div>
      </div>

      <div id="uw-need-dl-status">Ready.</div>
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
    updateStatus('Ready. Apply the Bank account verification = Yes filter, then scan.');
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
