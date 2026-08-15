/* ui.js: DOM panels, controls, narration.
 *
 * The canvas shows the mechanism; this file shows the numbers. Every widget
 * here reads Sim.state or calls Stack directly — nothing is stored twice, so
 * the panel can never disagree with the map.
 *
 * There are two ledgers, and the whole point is that they disagree about where
 * the cost is. The time waterfall says the layers are free and the distance is
 * everything. The byte ledger says the layers are most of what you send. Both
 * are true, and a reader who has only ever seen one of them is missing half the
 * picture.
 */
(function (global) {
  'use strict';

  var Sim = global.Sim, World = global.World, Stack = global.Stack, Iso = global.Iso;

  var $ = function (id) { return document.getElementById(id); };

  var el = {};
  var activeDistrict = null;
  var pinnedDistrict = null;      // set when the reader clicks a district
  var lastPaint = 0;
  var flyTo = null;
  var sheetOpen = false;          // mobile bottom sheet

  var STATION_LABEL = {
    keyswitch: 'switch', hid: 'USB', omnibox: 'browser', resolve: 'DNS',
    l7: 'L7', l6: 'L6/5', l4: 'L4', l3: 'L3', l2: 'L2', l1: 'L1',
    haul: 'wire', edge: 'edge',
    u1: 'L1→L2', u2: 'L2→L3', u3: 'L3→L4', u4: 'L4→TLS', u5: 'TLS→L7', u6: 'request',
    frontend: 'cache', index: 'index', rank: 'rank',
    transfer: 'transfer', paint: 'paint', done: 'done'
  };

  /* The waterfall, grouped so eighteen bars read as five ideas. */
  var GROUPS = [
    { name: 'At the desk', ids: ['keyswitch', 'hid', 'omnibox', 'resolve'] },
    { name: 'Down the stack', ids: ['l7', 'l6', 'l4', 'l3', 'l2', 'l1'] },
    { name: 'Across the wire', ids: ['haul', 'edge', 'unwrap'] },
    { name: 'In the datacentre', ids: ['frontend', 'index', 'rank'] },
    { name: 'Home again', ids: ['transfer', 'paint'] }
  ];

  /* ------------------------------------------------------------------ init */

  function init() {
    [
      'stage-chip', 'stage-tag', 'stage-name', 'stage-short', 'stage-body',
      'dwell', 'dwell-bar', 'dwell-hint',
      'wf-list', 'wf-hint', 'pk-list', 'pk-hint', 'pk-note',
      'sum-total', 'sum-ttfb', 'sum-wire', 'sum-eff', 'sum-note', 'district-chips',
      'hud-phase', 'hud-trip', 'hud-elapsed', 'hud-state', 'hud-note',
      'inspector', 'btn-run', 'btn-play', 'play-glyph', 'btn-step', 'btn-reset',
      'query', 'speed', 'dist', 'mbps', 'poll', 'refresh', 'shards', 'serp',
      'v-speed', 'v-dist', 'v-mbps', 'v-poll', 'v-refresh', 'v-shards', 'v-serp',
      'ipv6', 'tls13', 'hotq', 'follow', 'labels',
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
      b.style.setProperty('--chip', d.color);
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
    /* Run keeps what you have already read; Reset starts the slow tour over. */
    el['btn-reset'].addEventListener('click', function () { Sim.replayTour(); Sim.run(); paint(true); });

    /* The query is a real model input: its bytes are counted, it is
       percent-encoded into the path, and the path is what HPACK cannot
       compress away on a warm connection. */
    el.query.addEventListener('input', function () {
      Sim.state.query = el.query.value || ' ';
      paint(true);
    });

    bindRange('speed', 'v-speed', function (v) { Sim.state.speed = v; return v.toFixed(2) + '×'; });
    bindRange('dist', 'v-dist', function (v) {
      Sim.state.distanceKm = v;
      /* hops grow with distance: roughly one every 150 km, floored at 6 */
      Sim.state.hops = Math.max(6, Math.round(6 + v / 150));
      return v.toLocaleString('en-GB') + ' km';
    });
    bindRange('mbps', 'v-mbps', function (v) {
      Sim.state.mbps = v;
      /* ASSUMED: consumer links are asymmetric, uplink about a fifth of down */
      Sim.state.uplinkMbps = Math.max(1, v / 5);
      return v + ' Mbps';
    });
    bindRange('poll', 'v-poll', function (v) { Sim.state.pollHz = v; return v + ' Hz'; });
    bindRange('refresh', 'v-refresh', function (v) { Sim.state.refreshHz = v; return v + ' Hz'; });
    bindRange('shards', 'v-shards', function (v) { Sim.state.shards = v | 0; return (v | 0) + ''; });
    bindRange('serp', 'v-serp', function (v) { Sim.state.serpKB = v; return v + ' KB'; });

    el.ipv6.addEventListener('change', function () { Sim.state.ipv6 = el.ipv6.checked; paint(true); });
    el.tls13.addEventListener('change', function () { Sim.state.tls13 = el.tls13.checked; paint(true); });
    el.hotq.addEventListener('change', function () { Sim.state.hotQuery = el.hotq.checked; paint(true); });
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
    /* The zoom buttons are fixed to the left edge and would otherwise sit on
       top of the write-up once the sheet covers that part of the screen. */
    document.body.classList.toggle('sheet-open', open);
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
    el['stage-chip'].style.background = Iso.rgba(d.color, 0.14);
    el['stage-chip'].style.borderColor = Iso.rgba(d.color, 0.3);
    el['stage-tag'].textContent = d.tag;
    el['stage-name'].textContent = d.name;
    el['stage-short'].textContent = d.short;
    el['stage-body'].textContent = d.body;
  }

  function writeDone() {
    var s = Sim.state;
    el['stage-chip'].textContent = 'done';
    el['stage-tag'].textContent = s.requests + ' keystrokes';
    el['stage-name'].textContent = 'On screen';
    el['stage-short'].textContent = 'The last one took ' + Stack.fmtMs(s.lastTotal) +
      ', against ' + Stack.fmtMs(s.firstTotal) + ' for the first.';
    el['stage-body'].textContent =
      'Nothing about the network changed between them. DNS was already answered, the ' +
      'connection was still open so there were no handshake round trips, and HPACK’s ' +
      'dynamic table had every header but the path — which is why the request itself ' +
      'shrank by most of its size. Change a slider and press Run again, or press ⟲ to ' +
      'replay the whole tour at reading speed.';
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
    if (!force && now - lastPaint < 100) return;
    lastPaint = now;

    var s = Sim.state;
    var plan = s.plan || Sim.planNow();

    el['play-glyph'].textContent = s.paused || s.finished ? '▶' : '❚❚';

    el['hud-phase'].textContent = s.station ? (STATION_LABEL[s.station] || s.station) : 'idle';
    el['hud-trip'].textContent = Math.min(s.requests + (s.finished ? 0 : 1), s.maxRequests) +
      ' / ' + s.maxRequests;
    el['hud-elapsed'].textContent = Stack.fmtMs(s.elapsedMs);
    el['hud-state'].textContent = warmth(s);
    el['hud-note'].textContent = hudNote(s);

    var showing = s.reading && s.dwellTotal > 0 && s.dwellLeft > 0;
    el.dwell.hidden = !showing;
    if (showing) {
      el['dwell-bar'].style.width = (s.dwellLeft / s.dwellTotal * 100).toFixed(1) + '%';
    }

    paintWaterfall(s, plan);
    paintPacket(s, plan);
    paintSummary(s, plan);
    updateChips();
  }

  function warmth(s) {
    var bits = [];
    if (s.warmDns) bits.push('DNS');
    if (s.reuse) bits.push('conn');
    if (s.reuse) bits.push('HPACK');
    return bits.length ? bits.join(' + ') + ' warm' : 'cold';
  }

  function hudNote(s) {
    if (s.finished) return '';
    if (s.reading) return '⏸ holding here so you can read the panel';
    if (!s.running) return 'Press Run to send one keystroke across the world.';
    if (s.station === 'haul' && s.pilots) {
      return '↔ ' + s.pilots + ' handshake round trip' + (s.pilots === 1 ? '' : 's') +
             ' crossing before the request may follow';
    }
    if (s.station === 'frontend' && s.hitThisTrip) return '↩ cache hit: the trolley turns for home without touching the index';
    if (s.fastForward) return '⏩ warm request: no DNS, no handshakes, and HPACK remembers the headers';
    if (s.tourDone) return '⏩ every district explained, running the rest at speed (drag Speed down to slow it)';
    return '';
  }

  /* -- the time ledger ---------------------------------------------------- */

  function paintWaterfall(s, plan) {
    var byId = {};
    plan.phases.forEach(function (p) { byId[p.id] = p; });

    var max = 1;
    plan.phases.forEach(function (p) { if (p.ms > max) max = p.ms; });

    var paid = s.charged ? Object.keys(s.charged).length : 0;
    el['wf-hint'].textContent = paid ? paid + ' of ' + plan.phases.length + ' paid' : 'projected';

    var html = '';
    GROUPS.forEach(function (g) {
      var sum = 0;
      g.ids.forEach(function (id) { if (byId[id]) sum += byId[id].ms; });
      html += '<div class="grp"><span>' + g.name + '</span><b>' + Stack.fmtMs(sum) + '</b></div>';
      g.ids.forEach(function (id) {
        var p = byId[id];
        if (!p) return;
        var isPaid = s.charged && s.charged[id] != null;
        var live = s.station === id ||
                   (id === 'unwrap' && String(s.station).charAt(0) === 'u');
        var ms = isPaid ? s.charged[id] : p.ms;
        var tiny = ms < 0.05;
        var dd = World.districtById[id];
        var col = dd ? dd.color : null;
        html += '<div class="bar' + (isPaid ? ' paid' : '') + (live ? ' live' : '') +
          (tiny ? ' cut' : '') + '" title="' + escapeHtml(p.note) + '">' +
          '<span class="lbl">' + escapeHtml(p.label) + '</span>' +
          '<span class="track"><span class="fill" style="width:' +
          (ms / max * 100).toFixed(1) + '%' + (col ? ';background:' + col : '') + '"></span></span>' +
          '<span class="val">' + (tiny ? '—' : Stack.fmtMs(ms)) + '</span></div>';
      });
    });
    el['wf-list'].innerHTML = html;
  }

  /* -- the byte ledger ----------------------------------------------------- */

  function paintPacket(s, plan) {
    var pk = plan.packet;
    var max = pk.onWire || 1;
    var shells = s.shells || [];

    el['pk-hint'].textContent = pk.hpack.bytes + ' B of headers' +
      (s.reuse ? ' (warm)' : ' (cold)');

    var html = '<div class="pk-row core' + (s.running ? '' : ' idle') + '">' +
      '<span class="pk-l">your query</span>' +
      '<span class="pk-track"><i style="width:' +
      (pk.queryBytes / max * 100).toFixed(2) + '%;background:#8a8272"></i></span>' +
      '<span class="pk-v">' + pk.queryBytes + ' B</span></div>';

    pk.steps.forEach(function (st) {
      var on = shells.indexOf(st.id) >= 0;
      var col = (World.districtById[st.id] || {}).color || '#888';
      html += '<div class="pk-row' + (on ? ' on' : '') + '" title="' + escapeHtml(st.note) + '">' +
        '<span class="pk-l"><i class="sw" style="background:' + col + '"></i>' +
        escapeHtml(st.layer) + '</span>' +
        '<span class="pk-track"><i style="width:' +
        (st.after / max * 100).toFixed(2) + '%;background:' + col + '"></i></span>' +
        '<span class="pk-v">+' + st.add + '</span></div>';
    });

    el['pk-note'].textContent =
      'On the wire: ' + pk.onWire + ' bytes carrying ' + pk.queryBytes +
      ' bytes of question — ' + (pk.efficiency * 100).toFixed(1) + '% payload. ' +
      (s.reuse
        ? 'Warm, HPACK has every header but the path in its dynamic table.'
        : 'Cold, the cookie and user-agent alone are most of the request.') +
      ' Usable segment size on this path: ' + pk.mss + ' B.';
  }

  function paintSummary(s, plan) {
    var pk = plan.packet;
    el['sum-total'].textContent = Stack.fmtMs(plan.totals.total);
    el['sum-ttfb'].textContent = Stack.fmtMs(plan.totals.ttfb);
    el['sum-wire'].textContent = pk.onWire + ' B';
    el['sum-eff'].textContent = (pk.efficiency * 100).toFixed(1) + '%';

    /* The one sentence worth taking away, chosen from what actually binds. */
    var T = plan.totals;
    var parts = [
      { k: 'the keyboard and the browser', v: T.input },
      { k: 'the network', v: T.network },
      { k: 'the search back end', v: T.server },
      { k: 'parsing and painting', v: T.client }
    ].sort(function (a, b) { return b.v - a.v; });

    var note = 'Biggest share: ' + parts[0].k + ', ' +
      Math.round(parts[0].v / T.total * 100) + '% of the ' + Stack.fmtMs(T.total) + ' total. ';

    if (plan.response.startMs > plan.response.bwMs) {
      note += 'The response is latency-bound — ' + Stack.fmtMs(plan.response.startMs) +
        ' opening the congestion window against ' + Stack.fmtMs(plan.response.bwMs) +
        ' actually pushing bytes, so more bandwidth would change nothing. ';
    } else {
      note += 'The response is bandwidth-bound — ' + Stack.fmtBytes(plan.response.onWire) +
        ' at ' + s.mbps + ' Mbps costs ' + Stack.fmtMs(plan.response.bwMs) +
        ', more than slow start does, so a fatter pipe would help. ';
    }

    note += Stack.fmtMs(T.clock) + ' of the total (' +
      Math.round(T.clock / T.total * 100) + '%) is spent waiting for a clock — the USB poll ' +
      'and the display refresh — and ' + Stack.fmtMs(T.light) + ' (' +
      Math.round(T.light / T.total * 100) + '%) is light in glass, which nothing can improve.';

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
