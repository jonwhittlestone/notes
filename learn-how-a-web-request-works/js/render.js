/* render.js: a canvas 2D painter's-algorithm renderer.
 *
 * There is no z-buffer and no 3D library. Everything with a footprint on the
 * ground goes into one list, that list is sorted by x + y (distance from the
 * camera in this projection), and it is painted back to front.
 *
 * Layers, in order: sky, ground, district washes, roads and their pillars,
 * THE SORTED PASS, overlays meant to sit on top of everything, then
 * screen-space labels with the world transform removed.
 *
 * Almost every landmark here is drawn from a number in the model rather than
 * from a constant: the plate stacks are the bytes each layer adds, the hopper
 * mouth is the candidate count, the congestion-window gantries are the actual
 * slow-start rounds, and the shells on the trolley are the actual encapsulation
 * state. If a landmark could be deleted without losing information, it should
 * not have been drawn.
 */
(function (global) {
  'use strict';

  var Iso = global.Iso, World = global.World, Sim = global.Sim, Stack = global.Stack;
  var P = Iso.project;

  var cam = null, ctx = null, t = 0;
  var labels = [];
  var showLabels = true;
  var C = World.palette;

  /* The angle of a wall in screen space, and how long a grid unit is along it.
     Anything painted onto a face needs these; guessing pixel offsets instead is
     how face decoration ends up floating next to a building rather than on it. */
  var FACE_ANG = Math.atan2(Iso.TH, Iso.TW);
  var FACE_U = Math.hypot(Iso.TW, Iso.TH);

  /* ------------------------------------------------------------------ sky */

  function drawSky(w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#eef3f6');
    g.addColorStop(0.55, '#e9eef0');
    g.addColorStop(1, '#e3e6e2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  /* --------------------------------------------------------------- ground */

  function plate(inset, z) {
    return [
      P(inset, inset, z), P(World.GW - inset, inset, z),
      P(World.GW - inset, World.GH - inset, z), P(inset, World.GH - inset, z)
    ];
  }

  var GRASS = ['#8aa96a', '#93b073', '#83a463', '#9ab77c'];

  function drawGround() {
    ctx.fillStyle = 'rgba(120,124,110,0.30)';
    Iso.poly(ctx, plate(-0.9, -0.35));

    ctx.fillStyle = '#93b073';
    Iso.poly(ctx, plate(0, 0));

    /* Deterministic tufts: hash2, never Math.random(), or the whole field
       shimmers on every frame. */
    for (var gx = 1; gx < World.GW; gx += 2) {
      for (var gy = 1; gy < World.GH; gy += 2) {
        var n = Iso.hash2(gx, gy, 17);
        if (n < 0.45) continue;
        ctx.fillStyle = GRASS[(n * 4) | 0];
        Iso.disc(ctx, gx + n, gy + (1 - n), 0, 0.7 + n * 0.5);
      }
    }

    ctx.strokeStyle = 'rgba(74,69,64,0.28)';
    ctx.lineWidth = 1.4;
    Iso.polyLine(ctx, plate(0, 0), true);
  }

  /* A wash under the district being narrated, so the eye knows where to look
     even when the label is off screen. */
  function drawZones(activeId) {
    for (var i = 0; i < World.districts.length; i++) {
      var d = World.districts[i];
      var on = d.id === activeId;
      ctx.fillStyle = Iso.rgba(d.color, on ? 0.16 : 0.05);
      Iso.disc(ctx, d.x, d.y, 0.01, d.r);
      if (on) {
        ctx.strokeStyle = Iso.rgba(d.color, 0.5);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        var p = P(d.x, d.y, 0.01);
        ctx.ellipse(p.x, p.y, d.r * Iso.TW * 1.41421, d.r * Iso.TH * 1.41421, 0, 0, 6.2832);
        ctx.stroke();
      }
    }
  }

  /* ---------------------------------------------------------------- roads */

  function roadQuad(a, b, width, dz) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len * width / 2, ny = dx / len * width / 2;
    var za = (a.z || 0) + (dz || 0), zb = (b.z || 0) + (dz || 0);
    Iso.poly(ctx, [
      P(a.x + nx, a.y + ny, za), P(b.x + nx, b.y + ny, zb),
      P(b.x - nx, b.y - ny, zb), P(a.x - nx, a.y - ny, za)
    ]);
  }

  /* The near fascia of an elevated deck: the side facing the camera, dropped by
     the deck's thickness. Without it the road reads as a floating ribbon. */
  function deckFascia(a, b, width, thick) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len * width / 2, ny = dx / len * width / 2;
    var s = (nx + ny) > 0 ? 1 : -1;              /* the edge nearer the camera */
    var ax = a.x + nx * s, ay = a.y + ny * s;
    var bx = b.x + nx * s, by = b.y + ny * s;
    var za = a.z || 0, zb = b.z || 0;
    ctx.fillStyle = '#a49c8c';
    Iso.poly(ctx, [
      P(ax, ay, za), P(bx, by, zb), P(bx, by, zb - thick), P(ax, ay, za - thick)
    ]);
  }

  function drawRoute(route, opts) {
    var width = opts.width, i, s;
    var elevated = false;
    for (i = 0; i < route.segs.length; i++) {
      if ((route.segs[i].a.z || 0) > 0.25 || (route.segs[i].b.z || 0) > 0.25) { elevated = true; break; }
    }

    if (elevated) {
      ctx.fillStyle = 'rgba(90,88,78,0.14)';
      for (i = 0; i < route.segs.length; i++) {
        s = route.segs[i];
        Iso.ribbon(ctx, s.a.x + 0.5, s.a.y + 0.5, s.b.x + 0.5, s.b.y + 0.5, width, 0.02);
      }
      for (i = 0; i < route.segs.length; i++) {
        s = route.segs[i];
        if ((s.a.z || 0) > 0.25 || (s.b.z || 0) > 0.25) deckFascia(s.a, s.b, width, 0.34);
      }
    }

    ctx.fillStyle = opts.shoulder || C.road;
    for (i = 0; i < route.segs.length; i++) {
      s = route.segs[i];
      roadQuad(s.a, s.b, width + 0.5, 0);
      Iso.disc(ctx, s.a.x, s.a.y, s.a.z || 0, (width + 0.5) / 2);
    }
    var last = route.pts[route.pts.length - 1];
    Iso.disc(ctx, last.x, last.y, last.z || 0, (width + 0.5) / 2);

    ctx.fillStyle = opts.surface || C.roadTop;
    for (i = 0; i < route.segs.length; i++) {
      s = route.segs[i];
      roadQuad(s.a, s.b, width, 0.005);
      Iso.disc(ctx, s.a.x, s.a.y, (s.a.z || 0) + 0.005, width / 2);
    }
    Iso.disc(ctx, last.x, last.y, (last.z || 0) + 0.005, width / 2);

    ctx.strokeStyle = opts.dash || 'rgba(96,90,78,0.35)';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([6, 7]);
    ctx.beginPath();
    for (i = 0; i < route.pts.length; i++) {
      var p = P(route.pts[i].x, route.pts[i].y, (route.pts[i].z || 0) + 0.01);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* The deck height above a given point, so a pillar is exactly as tall as it
     needs to be rather than a guessed constant. */
  function deckZAt(route, x, y) {
    var best = 1e9, z = 0;
    for (var i = 0; i < route.segs.length; i++) {
      var s = route.segs[i];
      var vx = s.b.x - s.a.x, vy = s.b.y - s.a.y;
      var tt = ((x - s.a.x) * vx + (y - s.a.y) * vy) / (vx * vx + vy * vy);
      tt = Math.max(0, Math.min(1, tt));
      var d = Math.hypot(x - (s.a.x + vx * tt), y - (s.a.y + vy * tt));
      if (d < best) { best = d; z = (s.a.z || 0) + ((s.b.z || 0) - (s.a.z || 0)) * tt; }
    }
    return z;
  }

  /* Pillars belong to the road layer, painted before the sorted pass, so a deck
     covers a pillar's top instead of a pillar capping the deck. */
  function drawPillars() {
    for (var i = 0; i < World.pillars.length; i++) {
      var group = World.pillars[i];
      var route = World.routes[group.r];
      for (var j = 0; j < group.p.length; j++) {
        var p = group.p[j];
        var h = deckZAt(route, p[0], p[1]) - 0.2;
        if (h < 0.35) continue;
        Iso.cylinder(ctx, { x: p[0], y: p[1], z: 0, r: 0.4, h: h, color: '#b3ab9a' });
      }
    }
  }

  var ROAD_STYLE = {
    desk: { width: 2.4 },
    down: { width: 2.4, surface: '#d5cfc1' },
    wire: { width: 2.8, surface: '#cfc9ba', dash: 'rgba(70,100,120,0.45)' },
    up:   { width: 2.4, surface: '#d5cfc1' },
    dc:   { width: 2.4 },
    loop: { width: 2.2, surface: '#d2ccbd' },
    back: { width: 2.4, surface: '#dcd2c4', dash: 'rgba(140,90,120,0.45)' }
  };

  function drawRoads() {
    drawPillars();
    for (var i = 0; i < World.routeOrder.length; i++) {
      var n = World.routeOrder[i];
      drawRoute(World.routes[n], ROAD_STYLE[n]);
    }
  }

  /* ----------------------------------------------------------- landmarks  */

  /* One function per custom `kind` in world.js. Each takes the building record
     and draws in grid space; the sorted pass decides when. */

  function plan() { return Sim.state.plan || Sim.planNow(); }

  /* -- the desk ---------------------------------------------------------- */

  function drawKeycap(b) {
    var s = Sim.state;
    /* pressed while the station is live: the switch is the only moving part
       in this district and the press is what the write-up is about */
    var down = s.station === 'keyswitch' ? 0.22 : 0;
    Iso.box(ctx, { x: b.x - 1.3, y: b.y - 1.0, z: 0, w: 2.6, d: 2.0, h: 0.5, color: '#b9b2a2' });
    Iso.box(ctx, { x: b.x - 0.5, y: b.y - 0.42, z: 0.5, w: 1.0, d: 0.84, h: 0.5, color: '#8e8878' });
    Iso.box(ctx, {
      x: b.x - 0.85, y: b.y - 0.7, z: 1.0 - down, w: 1.7, d: 1.4, h: 0.62,
      color: down ? Iso.mix(b.color, '#ffffff', 0.15) : '#e8e2d3', topShade: 1.03
    });
    /* the contact closing */
    if (down) {
      var p = P(b.x, b.y, 1.0);
      ctx.fillStyle = Iso.rgba('#ffe9a8', 0.85);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + Math.abs(Math.sin(t * 12)) * 3, 0, 6.2832);
      ctx.fill();
    }
  }

  /* The wiring matrix the controller sweeps. One row and one column light in
     turn, at the real scan rate, which is the point of the write-up. */
  function drawMatrix(b) {
    var s = Sim.state;
    var cols = 6, rows = 4, i, j;
    ctx.strokeStyle = 'rgba(96,88,70,0.45)';
    ctx.lineWidth = 1.1;
    for (i = 0; i < rows; i++) {
      var y = b.y + i * 0.62;
      Iso.polyLine(ctx, [P(b.x, y, 0.03), P(b.x + (cols - 1) * 0.62, y, 0.03)], false);
    }
    for (j = 0; j < cols; j++) {
      var x = b.x + j * 0.62;
      Iso.polyLine(ctx, [P(x, b.y, 0.03), P(x, b.y + (rows - 1) * 0.62, 0.03)], false);
    }
    /* the sweep: a column at a time, wrapping */
    var live = s.station === 'keyswitch';
    var col = Math.floor(t * 6) % cols;
    for (j = 0; j < cols; j++) {
      for (i = 0; i < rows; i++) {
        var on = live && j === col;
        ctx.fillStyle = on ? Iso.rgba(b.color, 0.95) : 'rgba(120,112,96,0.35)';
        Iso.disc(ctx, b.x + j * 0.62, b.y + i * 0.62, 0.05, on ? 0.19 : 0.13);
      }
    }
  }

  /* The poll clock. Its hand turns at the real polling rate, scaled so it is
     watchable: the wait for this hand is most of the HID Bench's bar. */
  function drawPollClock(b) {
    var z = b.z || 0;
    Iso.cylinder(ctx, { x: b.x, y: b.y, z: z, r: 0.42, h: 2.6, color: '#bdb5a4' });
    var face = P(b.x, b.y, z + 2.6);
    var rr = 0.95 * Iso.TW * 1.41421 * 0.5;
    ctx.fillStyle = '#f3efe3';
    ctx.beginPath();
    ctx.ellipse(face.x, face.y, rr, rr * Iso.TH / Iso.TW, 0, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = Iso.rgba(b.color, 0.8);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    /* one turn per poll interval, slowed by 40x so the eye can follow it */
    var hz = Sim.state.pollHz / 40;
    var a = t * hz * 6.2832;
    ctx.strokeStyle = Iso.rgba(b.color, 0.95);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(face.x, face.y);
    ctx.lineTo(face.x + Math.cos(a) * rr * 0.8, face.y + Math.sin(a) * rr * 0.8 * Iso.TH / Iso.TW);
    ctx.stroke();
  }

  /* A screen standing across the view. Used for the omnibox and the monitor:
     `text` is drawn on it, in screen space, on the face itself. */
  function screenPanel(x, y, z, color, lit, w, h, lines, mono) {
    Iso.box(ctx, { x: x - 1.4, y: y - 1.0, z: z, w: 2.8, d: 2.0, h: 0.4, color: '#b9b2a2' });
    Iso.box(ctx, { x: x - 0.22, y: y - 0.18, z: z + 0.4, w: 0.44, d: 0.36, h: 0.7, color: '#8e8878' });
    Iso.orientedBox(ctx, {
      x: x, y: y, z: z + 1.1, hx: 1, hy: -1, len: w + 0.24, wid: 0.2, h: h + 0.2,
      color: '#efeade'
    });
    Iso.orientedBox(ctx, {
      x: x, y: y, z: z + 1.2, hx: 1, hy: -1, len: w, wid: 0.07, h: h,
      color: lit ? Iso.mix('#e9f0f4', color, 0.35) : '#ccd3d6', edge: false
    });
    if (!lines || !lines.length) return;
    /* Text on the glass. The screen faces (1,-1), so its surface runs along the
       +x/-y diagonal, which in screen space is horizontal. */
    var p = P(x, y, z + 1.2 + h * 0.5);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < lines.length; i++) {
      var fs = i === 0 ? 9 : 7.5;
      ctx.font = (mono ? fs + 'px ui-monospace, Menlo, Consolas, monospace'
                       : fs + 'px "Iowan Old Style", Palatino, Georgia, serif');
      ctx.fillStyle = i === 0 ? Iso.shade(color, 0.75) : 'rgba(70,66,58,0.7)';
      ctx.fillText(lines[i], 0, (i - (lines.length - 1) / 2) * (fs + 2.5));
    }
    ctx.restore();
  }

  function ellipsis(s, n) {
    s = String(s);
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function drawOmniScreen(b) {
    var s = Sim.state;
    var q = s.query || '';
    screenPanel(b.x, b.y, b.z || 0, b.color, true, 3.4, 1.5,
      ['🔍 ' + ellipsis(q, 26), ellipsis(plan().packet.path, 34)], true);
  }

  /* The monitor at the end of the journey, with a scan line running down it at
     the real refresh rate — the last wait in the whole model. */
  function drawMonitor(b) {
    var s = Sim.state;
    var done = s.charged && s.charged.paint != null;
    screenPanel(b.x, b.y, b.z || 0, b.color, done, 4.2, 2.2,
      done ? ['google.com/search', ellipsis(s.query, 30), '10 results'] : ['…'], false);
    if (s.station !== 'paint') return;
    /* one sweep per frame period, slowed 12x to be visible */
    var ph = (t * s.refreshHz / 12) % 1;
    var p = P(b.x, b.y, (b.z || 0) + 1.2 + 2.2 * (1 - ph));
    ctx.strokeStyle = Iso.rgba('#ffffff', 0.75);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 4.2 * FACE_U * 0.5, p.y + 4.2 * 0.5 * Iso.TH);
    ctx.lineTo(p.x + 4.2 * FACE_U * 0.5, p.y - 4.2 * 0.5 * Iso.TH);
    ctx.stroke();
  }

  /* A card-index tower: DNS is a lookup table that happens to be spread over
     the planet. */
  function drawRegistry(b) {
    var z = b.z || 0;
    Iso.box(ctx, { x: b.x - 1.5, y: b.y - 1.2, z: z, w: 3.0, d: 2.4, h: 3.4, color: '#cdd3ac',
      panels: { cols: 5, seed: 6, color: '#e4e8c9' } });
    /* drawers on the camera-facing wall */
    var p = P(b.x, b.y + 1.2, z + 1.7);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(FACE_ANG);
    ctx.strokeStyle = 'rgba(70,66,50,0.45)';
    ctx.lineWidth = 1;
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 3; c++) {
        ctx.strokeRect(-1.35 * FACE_U + c * 0.9 * FACE_U, -1.5 * Iso.TZ + r * 0.78 * Iso.TZ,
                       0.8 * FACE_U, 0.62 * Iso.TZ);
      }
    }
    ctx.restore();
    /* one drawer lit while the lookup is happening */
    if (Sim.state.station === 'resolve') {
      ctx.fillStyle = Iso.rgba(b.color, 0.8);
      Iso.disc(ctx, b.x, b.y + 1.4, z + 3.6, 0.35);
    }
  }

  function drawDish(b) {
    var z = b.z || 0;
    Iso.cylinder(ctx, { x: b.x, y: b.y, z: z, r: 0.35, h: 1.5, color: '#b6b0a0' });
    var p = P(b.x, b.y, z + 1.5);
    ctx.fillStyle = Iso.shade(b.color, 1.02);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 9, 17, 10, -0.5, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = 'rgba(74,69,64,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = Iso.rgba('#ffffff', 0.5);
    ctx.beginPath();
    ctx.ellipse(p.x - 3, p.y - 11.5, 6, 3.5, -0.5, 0, 6.2832);
    ctx.fill();
  }

  /* -- the gantries the road drives under -------------------------------- */

  function gateHeight(b) { return b.big ? 3.8 : 3.0; }

  /* A congestion-window gantry only exists if the response actually needed that
     many slow-start rounds. Beyond that it is drawn as a ghost, which is the
     honest picture: the road is there, the window never opened that far. */
  function cwndAlpha(b) {
    if (b.round == null) return 1;
    return b.round < plan().response.rounds ? 1 : 0.22;
  }

  function drawGatePost(b) {
    var h = gateHeight(b);
    Iso.box(ctx, {
      x: b.x - 0.26, y: b.y - 0.26, z: b.z || 0, w: 0.52, d: 0.52, h: h,
      color: b.color, alpha: cwndAlpha(b)
    });
  }

  function drawGateBeam(b) {
    var h = gateHeight(b);
    var span = (b.span || 1.9) * 2 + 0.6;
    var a = cwndAlpha(b);
    Iso.box(ctx, {
      x: b.x - (b.axis === 'x' ? 0.3 : span / 2),
      y: b.y - (b.axis === 'x' ? span / 2 : 0.3),
      z: (b.z || 0) + h,
      w: b.axis === 'x' ? 0.6 : span,
      d: b.axis === 'x' ? span : 0.6,
      h: 0.42, color: Iso.mix(b.color, '#ffffff', 0.25), alpha: a
    });
    if (!b.label) return;
    var p = P(b.x, b.y, (b.z || 0) + h + 0.42);
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(p.x, p.y - 5);
    /* the beam runs across the road: along -y for an x-road, along +x otherwise */
    ctx.rotate(b.axis === 'x' ? -FACE_ANG : FACE_ANG);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 8px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = Iso.shade(b.color, 0.7);
    ctx.fillText(b.label, 0, 0);
    ctx.restore();
  }

  /* The header this layer adds, as a stack of plates. One plate per four bytes,
     read straight out of the model's byte ledger — so the TCP stack really is
     taller than the Ethernet one, and IPv6 really does grow when you toggle it. */
  function drawPlates(b) {
    var steps = plan().packet.steps;
    var add = 0, i;
    for (i = 0; i < steps.length; i++) if (steps[i].id === b.id) add = steps[i].add;
    var n = Math.max(1, Math.round(add / 4));
    var z = b.z || 0;
    Iso.box(ctx, { x: b.x - 0.9, y: b.y - 0.7, z: z, w: 1.8, d: 1.4, h: 0.22, color: '#b8b1a1' });
    for (i = 0; i < n; i++) {
      Iso.box(ctx, {
        x: b.x - 0.7 + (i % 2) * 0.04, y: b.y - 0.55, z: z + 0.22 + i * 0.15,
        w: 1.4, d: 1.1, h: 0.13,
        color: i % 2 ? b.color : Iso.mix(b.color, '#ffffff', 0.22)
      });
    }
    var p = P(b.x, b.y, z + 0.3 + n * 0.15);
    ctx.save();
    ctx.translate(p.x, p.y - 9);
    ctx.textAlign = 'center';
    ctx.font = '600 9px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = Iso.shade(b.color, 0.72);
    ctx.fillText('+' + add + ' B', 0, 0);
    ctx.restore();
  }

  /* -- the wire ---------------------------------------------------------- */

  function drawRepeater(b) {
    Iso.box(ctx, { x: b.x - 1.0, y: b.y - 0.8, z: 0, w: 2.0, d: 1.6, h: 1.4, color: '#b7c3cc',
      panels: { cols: 3, seed: 8, color: '#d6e0e6' } });
    Iso.cylinder(ctx, { x: b.x + 0.7, y: b.y + 0.5, z: 1.4, r: 0.16, h: 1.6, color: '#9aa3a9' });
    /* a slow pulse, because a repeater is the one thing on this road that acts */
    var ph = (t * 0.6) % 1;
    var p = P(b.x + 0.7, b.y + 0.5, 3.0);
    ctx.fillStyle = Iso.rgba(b.color, 0.5 * (1 - ph));
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 + ph * 12, 0, 6.2832);
    ctx.fill();
  }

  function drawKmPost(p) {
    Iso.box(ctx, { x: p.x - 0.09, y: p.y - 0.09, z: 0, w: 0.18, d: 0.18, h: 0.8, color: '#cfc8b8' });
    Iso.box(ctx, { x: p.x - 0.22, y: p.y - 0.14, z: 0.8, w: 0.44, d: 0.28, h: 0.26, color: '#eae4d4' });
  }

  /* -- the datacentre ----------------------------------------------------- */

  function drawVault(b) {
    var z = b.z || 0;
    Iso.box(ctx, { x: b.x - 2.0, y: b.y - 1.5, z: z, w: 4.0, d: 3.0, h: 2.8, color: '#d9c6a6',
      panels: { cols: 5, seed: 4, color: '#eddcbe' } });

    var p = P(b.x, b.y + 1.5, z + 1.35);
    var rx = 1.05 * FACE_U, ry = 1.2 * Iso.TZ;
    ctx.fillStyle = Iso.shade(b.color, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, FACE_ANG, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = 'rgba(64,54,40,0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    /* the wheel turns only while the cache is being consulted */
    var spin = Sim.state.station === 'frontend' ? t * 1.4 : 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(FACE_ANG);
    ctx.strokeStyle = 'rgba(64,54,40,0.55)';
    ctx.lineWidth = 1.8;
    for (var i = 0; i < 4; i++) {
      var a = spin + i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(-Math.cos(a) * rx * 0.72, -Math.sin(a) * ry * 0.72);
      ctx.lineTo(Math.cos(a) * rx * 0.72, Math.sin(a) * ry * 0.72);
      ctx.stroke();
    }
    /* green when the query was in the cache — the branch, made visible */
    ctx.fillStyle = Sim.state.hitThisTrip ? 'rgba(120,200,140,0.85)' : 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.22, ry * 0.22, 0, 0, 6.2832);
    ctx.fill();
    ctx.restore();
  }

  /* One hall per shard. They all light at once — the fan-out is parallel — and
     the ones the model's tail probabilities say are struggling light red. */
  function drawShard(b) {
    var s = Sim.state;
    var live = s.station === 'index' && !s.hitThisTrip;
    var pl = plan();
    /* Deterministic, so the same halls are ill on every frame. Twenty halls
       stand in for hundreds, so drawing each one's own 1% chance would show
       nothing at all. Instead a couple of laggards appear once the model says
       the fan-out is large enough to be near-certain of having them — which is
       the actual lesson: everybody waits for the slowest. */
    var n = Iso.hash2(b.idx * 7 + 1, b.idx * 13 + 5, 21);
    var slow = live && n < 0.14 && pl.search.pSlow > 0.25;
    var stuck = live && n > 0.95 && pl.search.pStall > 0.08;
    var z = b.z || 0;
    var lit = stuck ? '#c05a4a' : slow ? '#c9973f' : b.color;
    Iso.box(ctx, {
      x: b.x - 0.75, y: b.y - 0.65, z: z, w: 1.5, d: 1.3, h: 1.5 + (b.idx % 3) * 0.22,
      color: live ? Iso.mix('#c8d6c6', lit, 0.35) : '#c8d6c6',
      windows: { cols: 2, seed: b.idx + 3, color: lit }
    });
    if (!live) return;
    var p = P(b.x, b.y, z + 2.0 + (b.idx % 3) * 0.22);
    var puls = stuck ? 1 : 0.4 + 0.5 * Math.abs(Math.sin(t * 4 + b.idx));
    ctx.fillStyle = Iso.rgba(lit, puls);
    ctx.beginPath();
    ctx.arc(p.x, p.y - 4, stuck ? 4.5 : 3, 0, 6.2832);
    ctx.fill();
  }

  /* Candidates in at the top, ten out at the bottom. The mouth is drawn from
     the real candidate count (log-scaled, or it would leave the map). */
  function drawHopper(b) {
    var pl = plan();
    var cands = Math.max(1, pl.search.candidates);
    /* Log-scaled, or 160,000 candidates would put a funnel across the ring
       road. Even so the mouth has to stay inside its own district. */
    var mouth = Math.min(2.2, 0.8 + Math.log(cands) / Math.log(10) * 0.32);
    var z = b.z || 0;
    /* legs */
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (o) {
      Iso.cylinder(ctx, { x: b.x + o[0] * 0.9, y: b.y + o[1] * 0.75, z: z, r: 0.13, h: 1.5, color: '#a89c88' });
    });
    /* the funnel: a wide top ring tapering to a narrow chute */
    var steps = 6;
    for (var i = 0; i < steps; i++) {
      var f = i / (steps - 1);
      var r = mouth * (1 - f) + 0.42 * f;
      Iso.cylinder(ctx, {
        x: b.x, y: b.y, z: z + 3.6 - f * 1.9, r: r, h: 0.34,
        color: Iso.mix(b.color, '#ffffff', 0.35 - f * 0.3), edge: i === 0
      });
    }
    Iso.cylinder(ctx, { x: b.x, y: b.y, z: z + 1.5, r: 0.42, h: 0.34, color: b.color });
    /* ten results dropping out of the chute */
    if (Sim.state.station === 'rank' && !Sim.state.hitThisTrip) {
      for (var k = 0; k < 10; k++) {
        var ph = ((t * 1.2 + k * 0.1) % 1);
        var p = P(b.x, b.y, z + 1.5 - ph * 1.4);
        ctx.fillStyle = Iso.rgba(b.color, 0.9 * (1 - ph * 0.5));
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, 6.2832);
        ctx.fill();
      }
    }
    var lp = P(b.x, b.y, z + 4.3);
    ctx.save();
    ctx.translate(lp.x, lp.y);
    ctx.textAlign = 'center';
    ctx.font = '600 9px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = Iso.shade(b.color, 0.7);
    ctx.fillText(Stack.fmtBig(cands) + ' → 10', 0, 0);
    ctx.restore();
  }

  function drawRooftop(o) {
    var m = 0.5;
    Iso.box(ctx, {
      x: o.x + m, y: o.y + m, z: (o.z || 0) + o.h, w: Math.max(0.8, o.w - m * 2),
      d: Math.max(0.8, o.d - m * 2), h: 0.4, color: Iso.mix(o.rooftop, '#ffffff', 0.35)
    });
  }

  var KIND = {
    keycap: drawKeycap, matrix: drawMatrix, pollclock: drawPollClock,
    omniscreen: drawOmniScreen, registry: drawRegistry, dish: drawDish,
    gatePost: drawGatePost, gateBeam: drawGateBeam, plates: drawPlates,
    repeater: drawRepeater, vault: drawVault, shard: drawShard,
    hopper: drawHopper, monitor: drawMonitor
  };

  /* -------------------------------------------------------- small props  */

  function drawLamp(p) {
    Iso.cylinder(ctx, { x: p.x, y: p.y, z: 0, r: 0.13, h: 2.7, color: '#9c968a' });
    Iso.box(ctx, { x: p.x - 0.28, y: p.y - 0.22, z: 2.7, w: 0.56, d: 0.44, h: 0.18, color: '#c8c2b2' });
  }

  function drawTree(p) {
    var n = Iso.hash2(p.x, p.y, p.seed || 1);
    Iso.cylinder(ctx, { x: p.x, y: p.y, z: 0, r: 0.18, h: 0.9 + n * 0.4, color: '#8a7358' });
    var r = 0.85 + n * 0.5;
    ctx.fillStyle = n < 0.5 ? '#5f8a52' : '#6d9068';
    Iso.disc(ctx, p.x, p.y, 1.5 + n * 0.8, r);
    ctx.fillStyle = Iso.rgba('#ffffff', 0.16);
    Iso.disc(ctx, p.x - r * 0.25, p.y - r * 0.25, 1.62 + n * 0.8, r * 0.6);
  }

  var PROP = { tree: drawTree, lamp: drawLamp, kmpost: drawKmPost };

  /* --------------------------------------------------------- the trolley
     The point of the vehicle is that it carries the state. The shells around
     its bed are the actual encapsulation stack: one ring per header currently
     applied, in that layer's colour, added on the way down and taken off on the
     far stair. The gauge on its flank is the millisecond budget spent. */

  function drawCar(v) {
    var s = Sim.state;
    var hx = v.dx, hy = v.dy;
    var z = v.z || 0;
    var shells = s.shells || [];

    ctx.fillStyle = 'rgba(80,76,66,0.22)';
    Iso.disc(ctx, v.x, v.y, z + 0.01, 1.05);

    /* chassis */
    Iso.orientedBox(ctx, { x: v.x, y: v.y, z: z + 0.16, hx: hx, hy: hy, len: 2.6, wid: 1.3, h: 0.3, color: '#5c6a72' });
    /* cab */
    Iso.orientedBox(ctx, { x: v.x + hx * 0.95, y: v.y + hy * 0.95, z: z + 0.46, hx: hx, hy: hy, len: 0.7, wid: 1.05, h: 0.7, color: '#b8503f' });

    /* The load: one tier per header currently applied, outermost at the bottom,
       with the payload sitting on top. Concentric solids would be truer to what
       encapsulation does, but each one hides the last — the reader would see a
       single coloured box and learn nothing. A stepped stack shows all six at
       once, which is the whole reason the trolley is worth watching. */
    var bx = v.x - hx * 0.42, by = v.y - hy * 0.42;
    var n = shells.length, i, zt = z + 0.46;
    for (i = 0; i < n; i++) {
      var col = World.palette[shells[n - 1 - i]] || '#888';
      Iso.orientedBox(ctx, {
        x: bx, y: by, z: zt, hx: hx, hy: hy,
        len: 1.72 - i * 0.2, wid: 1.12 - i * 0.115, h: 0.17, color: col
      });
      zt += 0.17;
    }
    /* the payload itself: the same size however deep in the stack it is */
    Iso.orientedBox(ctx, {
      x: bx, y: by, z: zt, hx: hx, hy: hy,
      len: 0.56, wid: 0.46, h: 0.3, color: '#f4efe0'
    });

    /* The gauge: how much of this trip's total has already been spent. It goes
       on whichever flank faces the camera — both +x and +y lean toward it, so
       the side whose perpendicular has px + py > 0 is the visible one. */
    var frac = s.plan && s.plan.totals.total ? Math.min(1, s.elapsedMs / s.plan.totals.total) : 0;
    var px = -hy, py = hx;
    var side = (px + py) > 0 ? 1 : -1;
    var gx = v.x - hx * 0.4 + px * side * 0.72;
    var gy = v.y - hy * 0.4 + py * side * 0.72;
    var GLEN = 1.6;
    Iso.orientedBox(ctx, {
      x: gx, y: gy, z: z + 0.5, hx: hx, hy: hy, len: GLEN, wid: 0.03, h: 0.38,
      color: '#6d675c', edge: false
    });
    if (frac > 0) {
      Iso.orientedBox(ctx, {
        x: gx - hx * (GLEN * (1 - frac) / 2), y: gy - hy * (GLEN * (1 - frac) / 2),
        z: z + 0.52, hx: hx, hy: hy, len: Math.max(0.07, GLEN * frac - 0.06),
        wid: 0.05, h: 0.3,
        color: frac > 0.66 ? '#e4643f' : frac > 0.33 ? '#e8b34a' : '#7fc06a', edge: false
      });
    }

    ctx.fillStyle = '#3f3a34';
    [[0.85, 0.52], [0.85, -0.52], [-0.85, 0.52], [-0.85, -0.52]].forEach(function (o) {
      Iso.disc(ctx, v.x + hx * o[0] + px * o[1], v.y + hy * o[0] + py * o[1], z + 0.14, 0.22);
    });
  }

  /* ------------------------------------------------------------ overlays
     Painted after the sorted pass, so they sit on top of everything. */

  /* The handshake round trips, shuttling down the wire road. These are not
     decoration: there is one run per round trip the model charged, and they are
     why the wire's bar is the size it is. */
  function drawPilots() {
    var s = Sim.state;
    if (s.station !== 'haul' || !s.pilots) return;
    var route = World.routes.wire;
    for (var i = 0; i < s.pilots * 2; i++) {
      var ph = ((t * 0.85 + i * 0.28) % 1);
      var out = i % 2 === 0;
      var d = (out ? ph : 1 - ph) * route.total;
      var q = route.at(d);
      var p = P(q.x, q.y, (q.z || 0) + 0.6 + Math.sin(ph * Math.PI) * 0.5);
      ctx.fillStyle = Iso.rgba(out ? '#4a7a9b' : '#b0546e', 0.85);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = Iso.rgba('#ffffff', 0.5);
      ctx.beginPath();
      ctx.arc(p.x - 1.2, p.y - 1.2, 1.4, 0, 6.2832);
      ctx.fill();
    }
  }

  /* -------------------------------------------------------------- labels  */

  function drawLabels() {
    /* Screen space, but still dpr-scaled: cam.ox and cam.scale are in CSS
       pixels, so an identity transform would read them as device pixels and
       every plate would land at half its true position on a 2x display. */
    ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
    ctx.textBaseline = 'middle';

    labels.sort(function (a, b) { return (b.pri || 0) - (a.pri || 0); });

    var placed = [], i;
    for (i = 0; i < labels.length; i++) {
      var L = labels[i];
      var p = P(L.x, L.y, L.z);
      L.ax = p.x * cam.scale + cam.ox;
      L.ay = p.y * cam.scale + cam.oy;

      L.px = (L.size || 12) * Math.min(1.15, Math.max(0.92, cam.scale));
      ctx.font = (L.bold ? '600 ' : '') + L.px + 'px ' + fontOf(L);
      var wpx = ctx.measureText(L.text).width;
      var subw = L.sub ? ctx.measureText(L.sub).width * 0.85 : 0;
      L.boxW = Math.max(wpx, subw) + 16;
      L.boxH = L.sub ? L.px * 2.4 : L.px * 1.75;

      /* Plates are oversized on purpose (they stay legible when zoomed out), so
         one centred on its anchor swallows the landmark underneath. Sit it on
         its bottom edge a constant gap above the anchor instead. */
      L.sy = L.lift ? L.ay - L.lift - L.boxH / 2 : L.ay;

      for (var tries = 0; tries < 10 && overlaps(L, placed); tries++) {
        L.sy -= L.boxH * 0.92;
      }
      placed.push(L);
    }

    for (i = 0; i < labels.length; i++) drawPlate(labels[i]);
  }

  function fontOf(L) {
    return L.mono
      ? 'ui-monospace, Menlo, Consolas, monospace'
      : '"Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif';
  }

  function overlaps(L, placed) {
    for (var i = 0; i < placed.length; i++) {
      var o = placed[i];
      if (Math.abs(L.ax - o.ax) < (L.boxW + o.boxW) / 2 + 2 &&
          Math.abs(L.sy - o.sy) < (L.boxH + o.boxH) / 2 + 2) return true;
    }
    return false;
  }

  function drawPlate(L) {
    var ax = L.ax, sy = L.sy, ay = L.ay, size = L.px;
    var boxW = L.boxW, boxH = L.boxH;
    ctx.textAlign = 'center';
    ctx.font = (L.bold ? '600 ' : '') + size + 'px ' + fontOf(L);

    if (L.lift) {
      ctx.strokeStyle = Iso.rgba(L.tint || '#6e6250', 0.6);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ax, sy + boxH / 2);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.fillStyle = Iso.rgba(L.tint || '#6e6250', 0.85);
      ctx.beginPath();
      ctx.arc(ax, ay, 2.4, 0, 6.2832);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(96,84,66,0.26)';
    roundRect(ax - boxW / 2 + 1, sy - boxH / 2 + 2.5, boxW, boxH, 5);
    ctx.fill();

    ctx.fillStyle = L.tint ? Iso.mix('#fffdf7', L.tint, 0.14) : '#fffdf7';
    roundRect(ax - boxW / 2, sy - boxH / 2, boxW, boxH, 5);
    ctx.fill();
    ctx.strokeStyle = Iso.rgba(L.tint || '#6e6250', 0.85);
    ctx.lineWidth = L.bold ? 1.7 : 1.2;
    roundRect(ax - boxW / 2, sy - boxH / 2, boxW, boxH, 5);
    ctx.stroke();

    ctx.fillStyle = L.color || '#3a352e';
    ctx.fillText(L.text, ax, sy + (L.sub ? -size * 0.42 : 0));
    if (L.sub) {
      ctx.font = (size * 0.85) + 'px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillStyle = 'rgba(88,80,68,0.75)';
      ctx.fillText(L.sub, ax, sy + size * 0.62);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------------------------------------------------------------- draw  */

  /* Depth key. A box's visual depth is its near corner, not its origin, hence
     the half-footprint term; anything drawn from its centre uses x + y. */
  function key(o) { return o.x + o.y + ((o.w || 0) + (o.d || 0)) * 0.5; }

  function draw(canvas, camera, time, activeDistrict, hoverDistrict) {
    ctx = canvas.getContext('2d');
    cam = camera;
    t = time;
    labels.length = 0;

    var w = canvas.width / cam.dpr, h = canvas.height / cam.dpr;
    ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
    drawSky(w, h);

    ctx.setTransform(cam.scale * cam.dpr, 0, 0, cam.scale * cam.dpr,
                     cam.ox * cam.dpr, cam.oy * cam.dpr);

    drawGround();
    drawZones(activeDistrict);
    drawRoads();

    /* ---- one sorted pass over everything with a footprint ---- */
    var items = [];
    var i, s = Sim.state;

    for (i = 0; i < World.buildings.length; i++) {
      var b = World.buildings[i];
      if (b.kind && KIND[b.kind]) items.push({ k: b.x + b.y, f: KIND[b.kind], a: b });
      else items.push({ k: key(b), f: null, a: b });
    }
    for (i = 0; i < World.props.length; i++) {
      var pr = World.props[i];
      items.push({ k: pr.x + pr.y, f: PROP[pr.kind] || drawLamp, a: pr });
    }
    var v = Sim.carPosition();
    items.push({ k: v.x + v.y + 0.2, f: drawCar, a: v });

    items.sort(function (p, q) { return p.k - q.k; });
    for (i = 0; i < items.length; i++) {
      if (items[i].f) { items[i].f(items[i].a); continue; }
      var o = items[i].a;
      Iso.box(ctx, o);
      if (o.roof) {
        Iso.gableRoof(ctx, {
          x: o.x - 0.08, y: o.y - 0.08, z: (o.z || 0) + o.h,
          w: o.w + 0.16, d: o.d + 0.16, h: o.roofH || 0.45, color: o.roof
        });
      } else if (o.rooftop) {
        drawRooftop(o);
      }
    }

    drawPilots();

    /* ---- district plates -------------------------------------------------
       Zoomed far out (where a phone starts) every plate at once is an
       unreadable pile, so show only the live one. */
    if (showLabels) {
      var declutter = cam.scale < 0.34;
      for (i = 0; i < World.districts.length; i++) {
        var d = World.districts[i];
        var isActive = d.id === activeDistrict || d.id === hoverDistrict;
        if (declutter && !isActive) continue;
        /* Once a station has been paid for, its plate carries the price. That is
           the number the reader came for, so it outranks the tagline. */
        var sub = isActive ? d.tag : null;
        if (s.charged && s.charged[d.id] != null) sub = '+' + Stack.fmtMs(s.charged[d.id]);
        labels.push({
          x: d.x, y: d.y, z: districtZ(d.id), lift: isActive ? 34 : 26,
          text: d.name, sub: sub,
          color: isActive ? d.color : '#3d3831',
          tint: d.color,
          size: isActive ? 16.5 : 14, bold: isActive,
          pri: isActive ? 2 : 1
        });
      }
    }

    /* The live readout, riding above the trolley. Highest priority: it is the
       one thing that changes every frame, so it keeps its place and the static
       plates move out of its way. */
    if (s.running) {
      labels.push({
        x: v.x, y: v.y, z: (v.z || 0) + 2.2, lift: 8,
        text: Stack.fmtMs(s.elapsedMs),
        sub: s.bytes ? Stack.fmtBytes(s.bytes) + ' · ' + s.carrying : s.carrying,
        color: '#3d3831', tint: '#8a8272', size: 14, bold: true, mono: true,
        pri: 3
      });
    }

    drawLabels();
  }

  /* A district's plate has to float above its own terrace, not above the
     ground, or half the labels on the descent point at grass. */
  var DISTRICT_Z = {
    omnibox: 4.2, resolve: 4.2, l7: 4.2, l6: 3.4, l4: 2.6, l3: 1.8, l2: 1.0,
    hid: 1.6, unwrap: 2.6, frontend: 4.2, index: 4.2, rank: 4.2,
    transfer: 7.2, paint: 4.2
  };
  function districtZ(id) { return DISTRICT_Z[id] || 0; }

  global.Renderer = {
    draw: draw,
    setLabels: function (v) { showLabels = v; }
  };
})(window);
