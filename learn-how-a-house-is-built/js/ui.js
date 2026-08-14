/* ui.js: DOM panels, controls, narration.
 *
 * The canvas shows the mechanism; this file shows the numbers. Every widget
 * here reads Sim.state or calls House directly — nothing is stored twice, so
 * the panel can never disagree with the map.
 */
(function (global) {
  'use strict';

  var Sim = global.Sim, World = global.World, House = global.House;

  var $ = function (id) { return document.getElementById(id); };

  var el = {};
  var activeDistrict = null;
  var pinnedDistrict = null;
  var lastPaint = 0;
  var flyTo = null;
  var sheetOpen = false;

  var STATION_LABEL = {
    permits: 'planning', excavation: 'dirt', foundation: 'concrete',
    framing: 'frame', roofing: 'roof', openings: 'openings',
    utilities: 'rough-in', inspection: 'inspect', rework: 'rework',
    insulation: 'insulation', drywall: 'plaster', exterior: 'exterior',
    interior: 'interior', fixtures: 'fixtures', landscaping: 'garden',
    done: 'done'
  };

  var FINISH_LABEL = ['Basic spec', 'Standard spec', 'Premium spec'];
  var REGION_LABEL = ['North & Scotland', 'UK average', 'London & South East'];

  /* ------------------------------------------------------------------ init */

  function init() {
    [
      'stage-chip', 'stage-tag', 'stage-name', 'stage-short', 'stage-body',
      'dwell', 'dwell-bar', 'dwell-hint',
      'wf-list', 'wf-hint', 'sum-cost', 'sum-days', 'sum-sqm', 'sum-mandays',
      'sum-note', 'district-chips',
      'hud-phase', 'hud-day', 'hud-spent', 'hud-state', 'hud-note',
      'inspector', 'btn-run', 'btn-play', 'play-glyph', 'btn-step', 'btn-reset',
      'speed', 'floorarea', 'finish', 'crew', 'region',
      'v-speed', 'v-floorarea', 'v-finish', 'v-crew', 'v-region',
      'follow', 'labels',
      'btn-about', 'about', 'about-close', 'btn-panel', 'tooltip',
      'sheet-handle', 'btn-tune', 'dock', 'dock-tune'
    ].forEach(function (id) { el[id] = $(id); });

    buildChips();
    wire();
    applyResponsiveLabels();

    Sim.on(function (name, payload) {
      if (name === 'station') onStation(payload);
      if (name === 'reset') { pinnedDistrict = null; paint(true); }
    });
  }

  function buildChips() {
    World.districts.forEach(function (d) {
      var b = document.createElement('button');
      b.textContent = d.name;
      b.dataset.id = d.id;
      b.addEventListener('click', function () {
        showDistrict(d, true);
        flyTo = { x: d.x, y: d.y };
      });
      el['district-chips'].appendChild(b);
    });
  }

  function wire() {
    el['btn-run'].addEventListener('click', function () { Sim.run(); paint(true); });
    el['btn-play'].addEventListener('click', function () { Sim.toggle(); paint(true); });
    el['btn-step'].addEventListener('click', function () { Sim.step(); });
    el['btn-reset'].addEventListener('click', function () { Sim.replayTour(); Sim.run(); paint(true); });

    bindRange('speed', 'v-speed', function (v) { Sim.state.speed = v; return v.toFixed(2) + '×'; });
    bindRange('floorarea', 'v-floorarea', function (v) {
      Sim.state.floorAreaSqm = v; return Math.round(v).toLocaleString() + ' sqm';
    });
    bindRange('finish', 'v-finish', function (v) { Sim.state.finishLevel = v | 0; return FINISH_LABEL[v | 0]; });
    bindRange('crew', 'v-crew', function (v) { Sim.state.crewSize = v | 0; return (v | 0) + ' people'; });
    bindRange('region', 'v-region', function (v) { Sim.state.regionIndex = v | 0; return REGION_LABEL[v | 0]; });

    el.labels.addEventListener('change', function () { global.Renderer.setLabels(el.labels.checked); });

    el['btn-about'].addEventListener('click', function () { el.about.hidden = false; });
    el['about-close'].addEventListener('click', function () { el.about.hidden = true; });
    el.about.addEventListener('click', function (e) { if (e.target === el.about) el.about.hidden = true; });

    el['btn-panel'].addEventListener('click', function () {
      var hidden = el.inspector.classList.toggle('hidden');
      el['btn-panel'].setAttribute('aria-expanded', String(!hidden));
      applyResponsiveLabels();
    });
    window.addEventListener('resize', applyResponsiveLabels);

    el['sheet-handle'].addEventListener('click', function () { setSheet(!sheetOpen); });

    el['btn-tune'].addEventListener('click', function () {
      var open = el.dock.classList.toggle('tune-open');
      el['btn-tune'].setAttribute('aria-expanded', String(open));
      el['btn-tune'].title = open ? 'Hide settings' : 'Show settings';
    });
  }

  function isMobile() { return window.matchMedia('(max-width: 900px)').matches; }

  function applyResponsiveLabels() {
    var hidden = el.inspector.classList.contains('hidden');
    var narrow = isMobile();
    el['btn-panel'].textContent = narrow ? (hidden ? 'Panel' : 'Hide')
                                         : (hidden ? 'Show panel' : 'Hide panel');
    el['btn-about'].textContent = narrow ? 'About' : 'About & accuracy';
    el['dwell-hint'].innerHTML = narrow
      ? 'reading stop: tap <b>❚❚</b> below to hold it here'
      : 'reading stop: press <kbd>Space</kbd> to hold it here';
  }

  function setSheet(open) {
    sheetOpen = open;
    el.inspector.classList.toggle('open', open);
    el['sheet-handle'].setAttribute('aria-expanded', String(open));
    if (open) el.inspector.scrollTop = 0;
  }

  function bindRange(id, out, fn) {
    var input = el[id];
    var apply = function () { el[out].textContent = fn(parseFloat(input.value)); };
    input.addEventListener('input', apply);
    apply();
  }

  /* -------------------------------------------------------------- narration */

  function onStation(station) {
    var id = station === 'done' ? null : (World.stationToDistrict[station] || station);
    activeDistrict = id;
    if (!pinnedDistrict && id) {
      var d = World.districtById[id];
      if (d) writeCard(d, station);
    }
    if (station === 'done') writeDone();
    paint(true);
  }

  function writeCard(d, station) {
    el['stage-chip'].textContent = STATION_LABEL[station] || d.id;
    el['stage-chip'].style.color = d.color;
    el['stage-chip'].style.background = global.Iso.rgba(d.color, 0.14);
    el['stage-chip'].style.borderColor = global.Iso.rgba(d.color, 0.3);
    el['stage-tag'].textContent = d.tag;
    el['stage-name'].textContent = d.name;
    el['stage-short'].textContent = d.short;
    el['stage-body'].textContent = d.body;
  }

  function writeDone() {
    var s = Sim.state, plan = s.plan;
    el['stage-chip'].textContent = 'done';
    el['stage-tag'].textContent = 'move-in';
    el['stage-name'].textContent = 'Move-in';
    el['stage-short'].textContent = 'This house cost ' + House.fmtGBP(plan.totalCost) +
      ' — ' + House.fmtGBP(plan.costPerSqm) + '/sqm — and took ' + House.fmtDays(plan.totalCalendarDays) + '.';
    el['stage-body'].textContent = 'That ran ' + House.fmtDays(plan.totalManDays) + ' of actual labour through ' +
      Math.round(plan.totalCalendarDays) + ' calendar days: the gap between those two numbers is exactly what a ' +
      'bigger crew buys back, and exactly what planning, concrete cure and inspections refuse to sell at any price. ' +
      'This model prices materials and trade labour only — it leaves out land, utility hookups and the ' +
      'main contractor’s own margin, which is most of why an all-in quote runs well above the number on this panel. ' +
      'Move a slider and press Run to build it again.';
  }

  function showDistrict(d, pin) {
    pinnedDistrict = pin ? d.id : null;
    writeCard(d, Sim.state.station);
    if (pin) {
      el['stage-chip'].textContent = 'pinned';
      el['stage-tag'].textContent = d.tag + ' · tap empty ground to resume';
      if (isMobile()) setSheet(true);
    }
    updateChips();
  }

  function updateChips() {
    var kids = el['district-chips'].children;
    for (var i = 0; i < kids.length; i++) {
      kids[i].classList.toggle('on', kids[i].dataset.id === (pinnedDistrict || activeDistrict));
    }
  }

  /* ------------------------------------------------------------------ paint */

  function paint(force) {
    var now = performance.now();
    if (!force && now - lastPaint < 90) return;
    lastPaint = now;

    var s = Sim.state;
    var plan = s.plan || Sim.planNow();

    el['play-glyph'].textContent = s.paused || s.finished ? '▶' : '❚❚';

    el['hud-phase'].textContent = s.station ? (STATION_LABEL[s.station] || s.station) : 'idle';
    el['hud-day'].textContent = House.fmtDays(s.elapsedDays);
    el['hud-spent'].textContent = House.fmtGBP(s.elapsedCost);
    el['hud-state'].textContent = state(s);
    el['hud-note'].textContent = hudNote(s);

    var showing = s.reading && s.dwellTotal > 0 && s.dwellLeft > 0;
    el.dwell.hidden = !showing;
    if (showing) {
      el['dwell-bar'].style.width = (s.dwellLeft / s.dwellTotal * 100).toFixed(1) + '%';
    }

    paintPhases(s, plan);
    paintSummary(s, plan);
    updateChips();
  }

  function state(s) {
    if (s.finished) return 'move-in';
    if (s.station === 'inspection') return s.failed ? 'failed' : 'passed';
    if (s.station === 'rework') return 'reworking';
    return 'building';
  }

  function hudNote(s) {
    if (s.finished) return '';
    if (s.reading) return '⏸ holding here so you can read the panel';
    if (!s.running) return 'Press Run to break ground.';
    if (s.station === 'inspection' && s.failed) return '↩ failed inspection: the truck peels off onto the rework loop';
    if (s.station === 'rework') return '⏩ fixing the rough-in before the crew is allowed back onto the main road';
    if (s.tourDone) return '⏩ every station explained, running the rest at speed (drag Speed down to slow it)';
    return '';
  }

  function paintPhases(s, plan) {
    var max = 1;
    plan.phases.forEach(function (p) { if (p.cost > max) max = p.cost; });

    el['wf-hint'].textContent = s.charged
      ? Object.keys(s.charged).length + ' of ' + plan.phases.length + ' paid'
      : 'projected';

    el['wf-list'].innerHTML = plan.phases.map(function (p) {
      var paid = s.charged && s.charged[p.id] != null;
      var live = s.station === p.id;
      var cost = paid ? s.charged[p.id].cost : p.cost;
      var zero = cost < 0.5;
      return '<div class="bar' + (paid ? ' paid' : '') + (live ? ' live' : '') + (zero ? ' cut' : '') + '"' +
        ' title="' + escapeHtml(p.qtyLabel + ' — ' + p.note) + '">' +
        '<span class="lbl">' + escapeHtml(p.label) + '</span>' +
        '<span class="track"><span class="fill" style="width:' +
        (cost / max * 100).toFixed(1) + '%"></span></span>' +
        '<span class="val">' + (zero ? '—' : House.fmtGBP(cost)) + '</span></div>';
    }).join('');
  }

  function paintSummary(s, plan) {
    el['sum-cost'].textContent = House.fmtGBP(plan.totalCost);
    el['sum-days'].textContent = House.fmtDays(plan.totalCalendarDays);
    el['sum-sqm'].textContent = House.fmtGBP(plan.costPerSqm) + '/sqm';
    el['sum-mandays'].textContent = House.fmtDays(plan.totalManDays);

    var note = 'At a crew of ' + s.crewSize + ', this house takes ' + House.fmtDays(plan.totalCalendarDays) +
      ' for ' + House.fmtDays(plan.totalManDays) + ' of actual labour. Push Crew size up and the gap narrows — ' +
      'until it hits the planning wait, the concrete cure and the inspections, which no crew size shortens. ' +
      House.fmtGBP(plan.costPerSqm) + '/sqm here is materials and trade labour only; real builders quote ' +
      '£1,800–£2,800/sqm all-in once land, utility hookups and their own margin are added.';
    el['sum-note'].textContent = note;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------------------------------------------------------- exports */

  global.UI = {
    init: init,
    paint: paint,
    run: function () { Sim.run(); paint(true); },
    resetAll: function () { Sim.replayTour(); Sim.run(); paint(true); },
    showDistrict: showDistrict,
    unpin: function () { pinnedDistrict = null; updateChips(); },
    activeDistrict: function () { return pinnedDistrict || activeDistrict; },
    takeFlyTo: function () { var f = flyTo; flyTo = null; return f; },
    el: el
  };
})(window);
