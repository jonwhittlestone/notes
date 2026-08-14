/* render.js: a canvas 2D painter's-algorithm renderer.
 *
 * There is no z-buffer and no 3D library. Everything with a footprint on the
 * ground goes into one list, that list is sorted by x + y (distance from the
 * camera in this projection), and it is painted back to front.
 *
 * Layers, in order: sky, ground, district washes, roads, THE SORTED PASS,
 * overlays, then screen-space labels with the world transform removed.
 */
(function (global) {
  'use strict';

  var Iso = global.Iso, World = global.World, Sim = global.Sim, House = global.House;
  var P = Iso.project;

  var cam = null, ctx = null, t = 0;
  var labels = [];
  var showLabels = true;
  var C = World.palette;

  /* ------------------------------------------------------------------ sky */

  function drawSky(w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#eef3f6');
    g.addColorStop(0.55, '#eaeee9');
    g.addColorStop(1, '#e6e4dc');
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

  function drawZones(activeId) {
    for (var i = 0; i < World.districts.length; i++) {
      var d = World.districts[i];
      var on = d.id === activeId;
      ctx.fillStyle = Iso.rgba(d.color, on ? 0.16 : 0.055);
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

  function drawRoute(route, opts) {
    var width = opts.width, i, s;

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

  function drawRoads() {
    drawRoute(World.routes.main, { width: 2.8 });
    drawRoute(World.routes.rework, { width: 2.0, surface: '#e3ccc4', dash: 'rgba(176,112,90,0.5)' });
    drawRoute(World.routes.final, { width: 2.6, surface: '#d6d0c0' });
  }

  /* ----------------------------------------------------------- landmarks
     One function per custom `kind` in world.js. A handful read Sim.planNow()
     so what is drawn tracks the sliders even before the truck reaches that
     station; the rest are built once from the default plan and are
     declared as indicative scenery in the About modal. */

  function livePhase(id) { return House.phaseOf(Sim.planNow(), id); }

  function drawSignboard(b) {
    Iso.cylinder(ctx, { x: b.x, y: b.y, z: 0, r: 0.1, h: 1.9, color: '#9c9686' });
    Iso.box(ctx, { x: b.x - 0.9, y: b.y - 0.12, z: 1.5, w: 1.8, d: 0.24, h: 0.9, color: '#eee7d4' });
    ctx.strokeStyle = 'rgba(74,69,64,0.4)';
    ctx.lineWidth = 1;
    var p = P(b.x, b.y, 1.95);
    ctx.beginPath();
    ctx.moveTo(p.x - 12, p.y - 4); ctx.lineTo(p.x + 12, p.y - 4);
    ctx.moveTo(p.x - 12, p.y + 2); ctx.lineTo(p.x + 8, p.y + 2);
    ctx.stroke();
  }

  function drawDirtPile(b) {
    var ph = livePhase('excavation');
    var m3 = ph ? (ph.qtyLabel.match(/[\d.]+/) || [140])[0] * 1 : 140;
    var n = Math.max(2, Math.min(6, Math.round(m3 / 32)));
    for (var i = 0; i < n; i++) {
      var ox = (i % 3) * 1.1, oy = ((i / 3) | 0) * 1.1;
      var h = 0.7 + Iso.hash2(i, 7, 2) * 0.5;
      Iso.cylinder(ctx, { x: b.x + ox, y: b.y + oy, z: 0, r: 0.55, h: h, color: b.color, topShade: 0.9 });
    }
  }

  function drawFoundationSlab(b) {
    Iso.box(ctx, { x: b.x, y: b.y, z: 0, w: b.w, d: b.d, h: 0.16, color: b.color });
    /* a rebar grid on top, drawn in screen space across the slab's own face */
    var cols = 6, rows = 3, i;
    ctx.strokeStyle = 'rgba(90,84,70,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i <= cols; i++) {
      var u = b.x + (b.w * i / cols);
      var p0 = P(u, b.y, 0.165), p1 = P(u, b.y + b.d, 0.165);
      ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
    }
    for (i = 0; i <= rows; i++) {
      var v = b.y + (b.d * i / rows);
      var q0 = P(b.x, v, 0.165), q1 = P(b.x + b.w, v, 0.165);
      ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y);
    }
    ctx.stroke();
  }

  /* The wireframe skeleton: box edges only, no fill, sized from the truck's
     own live geometry so a bigger Floor area slider visibly grows the frame
     that is standing on the plot right now — not just the numbers beside it. */
  function drawFrameSkeleton(b) {
    var plan = Sim.planNow();
    var w = Math.max(2.6, plan.length / 3.1), d = Math.max(2.0, plan.width / 3.1);
    var storeys = 2, storeyH = 1.15;
    var x = b.x - w / 2, y = b.y - d / 2;
    ctx.strokeStyle = Iso.shade(b.color, 0.62);
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';

    function edge(x0, y0, z0, x1, y1, z1) {
      var p0 = P(x0, y0, z0), p1 = P(x1, y1, z1);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }

    var top = storeys * storeyH;
    /* vertical lines, spaced to suggest coursed blockwork and roof trusses */
    var studsX = Math.max(3, Math.round(w * 2)), studsY = Math.max(2, Math.round(d * 2));
    var i;
    for (i = 0; i <= studsX; i++) {
      var sx = x + (w * i / studsX);
      edge(sx, y, 0, sx, y, top);
      edge(sx, y + d, 0, sx, y + d, top);
    }
    for (i = 0; i <= studsY; i++) {
      var sy = y + (d * i / studsY);
      edge(x, sy, 0, x, sy, top);
    }
    /* plates: sills, the mid-floor line and the top plate */
    edge(x, y, 0, x + w, y, 0); edge(x, y + d, 0, x + w, y + d, 0); edge(x, y, 0, x, y + d, 0); edge(x + w, y, 0, x + w, y + d, 0);
    [storeyH, top].forEach(function (z) {
      edge(x, y, z, x + w, y, z); edge(x, y + d, z, x + w, y + d, z);
      edge(x, y, z, x, y + d, z); edge(x + w, y, z, x + w, y + d, z);
    });
  }

  function drawShingleStack(b) {
    for (var i = 0; i < 4; i++) {
      Iso.box(ctx, { x: b.x, y: b.y, z: i * 0.16, w: 1.3, d: 0.9, h: 0.15, color: Iso.mix(b.color, '#ffffff', i * 0.08) });
    }
  }

  function drawWindowRack(b) {
    var ph = livePhase('openings');
    var count = ph ? Math.max(2, Math.min(8, Math.round((ph.qtyLabel.match(/\d+/) || [6])[0] / 3))) : 5;
    Iso.box(ctx, { x: b.x - 0.2, y: b.y - 1.0, z: 0, w: 0.3, d: 2.0, h: 1.6, color: '#a89a80', edge: false });
    for (var i = 0; i < count; i++) {
      var oy = -0.85 + i * (1.7 / Math.max(1, count - 1));
      Iso.box(ctx, { x: b.x + 0.05, y: b.y + oy - 0.12, z: 0.15, w: 0.08, d: 0.24, h: 1.1, color: '#bcd3de', edge: 'rgba(74,69,64,0.35)' });
    }
  }

  function drawElecHut(b) {
    Iso.box(ctx, { x: b.x - 0.7, y: b.y - 0.6, z: 0, w: 1.4, d: 1.2, h: 1.5, color: '#d8c78e' });
    Iso.box(ctx, { x: b.x + 0.75, y: b.y - 0.15, z: 0.3, w: 0.18, d: 0.6, h: 0.9, color: '#4a4540' });
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? '#e8b34a' : '#c07a3c';
      var p = P(b.x + 0.83, b.y - 0.05 + i * 0.16, 0.4 + i * 0.16);
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.2832); ctx.fill();
    }
  }

  function drawPlumbHut(b) {
    Iso.box(ctx, { x: b.x - 0.7, y: b.y - 0.6, z: 0, w: 1.4, d: 1.2, h: 1.3, color: '#c7d3d8' });
    Iso.cylinder(ctx, { x: b.x + 0.55, y: b.y + 0.5, z: 0, r: 0.16, h: 1.5, color: '#7f96a0' });
    Iso.cylinder(ctx, { x: b.x + 0.95, y: b.y + 0.5, z: 0, r: 0.16, h: 1.1, color: '#8fa6ae' });
  }

  function drawHvacHut(b) {
    Iso.box(ctx, { x: b.x - 0.6, y: b.y - 0.55, z: 0, w: 1.2, d: 1.1, h: 1.05, color: '#9db79a' });
    Iso.cylinder(ctx, { x: b.x + 0.85, y: b.y + 0.55, z: 0, r: 0.45, h: 0.7, color: '#87a684', ring: 0.4 });
  }

  function drawInspectBooth(b) {
    Iso.box(ctx, { x: b.x - 0.65, y: b.y - 0.55, z: 0, w: 1.3, d: 1.1, h: 1.7, color: '#d9cba0' });
    var s = Sim.state;
    var known = s.station === 'inspection' || s.station === 'rework' ||
      (s.charged && s.charged.inspection);
    var flagColor = known ? (s.failed ? '#c05a48' : '#5f8a52') : '#a9a190';
    Iso.cylinder(ctx, { x: b.x, y: b.y + 1.1, z: 0, r: 0.08, h: 2.3, color: '#9c9686' });
    var p = P(b.x, b.y + 1.1, 2.25);
    ctx.fillStyle = flagColor;
    var wave = known ? Math.sin(t * 4) * 2 : 0;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 16, p.y + 3 + wave);
    ctx.lineTo(p.x, p.y + 9);
    ctx.closePath();
    ctx.fill();
  }

  function drawInsulStack(b) {
    for (var i = 0; i < 5; i++) {
      var oy = i * 0.42;
      Iso.cylinder(ctx, { x: b.x, y: b.y + oy, z: 0, r: 0.32, h: 0.55, color: Iso.mix(b.color, '#ffffff', 0.25 * (i % 2)), edge: 'rgba(120,100,60,0.3)' });
    }
  }

  function drawDrywallPallet(b) {
    var ph = livePhase('drywall');
    var sheets = ph ? (ph.qtyLabel.match(/\d+/) || [200])[0] * 1 : 200;
    var count = Math.max(2, Math.min(8, Math.round(sheets / 60)));
    for (var i = 0; i < count; i++) {
      Iso.box(ctx, { x: b.x, y: b.y, z: i * 0.1, w: 1.6, d: 1.1, h: 0.08, color: Iso.mix(b.color, '#c9c2ae', 0.06 * i) });
    }
  }

  function drawDrivewaySlab(b) {
    Iso.box(ctx, { x: b.x - 1.1, y: b.y - 0.9, z: 0, w: 2.2, d: 1.8, h: 0.08, color: b.color, edge: 'rgba(90,84,70,0.3)' });
  }

  function drawPaintCans(b) {
    for (var i = 0; i < 3; i++) {
      Iso.cylinder(ctx, { x: b.x + i * 0.4, y: b.y, z: 0, r: 0.16, h: 0.34, color: i % 2 ? '#cfc4d6' : '#e6e1d2', ring: 0.5 });
    }
  }

  function drawFixtureSet(b) {
    Iso.box(ctx, { x: b.x - 0.6, y: b.y - 0.4, z: 0, w: 1.0, d: 0.7, h: 0.5, color: '#eae6da' });
    Iso.cylinder(ctx, { x: b.x - 0.1, y: b.y, z: 0.5, r: 0.25, h: 0.22, color: '#f4f1e6' });
    Iso.box(ctx, { x: b.x + 0.5, y: b.y - 0.5, z: 0, w: 1.3, d: 0.9, h: 0.42, color: '#dfe4e2' });
  }

  function drawSodPatch(b) {
    var colors = ['#8aa96a', '#93b073', '#7ea25e'];
    for (var i = 0; i < 5; i++) {
      var a = i / 5 * 6.2832, r = 1.4 + Iso.hash2(i, 4, 9) * 0.6;
      ctx.fillStyle = colors[i % colors.length];
      Iso.disc(ctx, b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 0, 0.9 + Iso.hash2(i, 5, 3) * 0.4);
    }
  }

  var KIND = {
    signboard: drawSignboard, dirtPile: drawDirtPile, foundationSlab: drawFoundationSlab,
    frameSkeleton: drawFrameSkeleton, shingleStack: drawShingleStack, windowRack: drawWindowRack,
    elecHut: drawElecHut, plumbHut: drawPlumbHut, hvacHut: drawHvacHut,
    inspectBooth: drawInspectBooth, insulStack: drawInsulStack, drywallPallet: drawDrywallPallet,
    drivewaySlab: drawDrivewaySlab, paintCans: drawPaintCans, fixtureSet: drawFixtureSet,
    sodPatch: drawSodPatch
  };

  /* -------------------------------------------------------- small props  */

  function drawLamp(p) {
    Iso.cylinder(ctx, { x: p.x, y: p.y, z: 0, r: 0.13, h: 2.5, color: '#9c968a' });
    Iso.box(ctx, { x: p.x - 0.26, y: p.y - 0.2, z: 2.5, w: 0.52, d: 0.4, h: 0.16, color: '#c8c2b2' });
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

  /* --------------------------------------------------------------- the truck
     The point of the vehicle is that it carries the state, not that it is a
     truck: the gauge on its flank is the fraction of the budget spent so
     far, and the crates in the bed are that station's own material spend. */

  function drawTruck(v) {
    var s = Sim.state;
    var hx = v.dx, hy = v.dy;
    var z = v.z || 0;

    ctx.fillStyle = 'rgba(80,76,66,0.22)';
    Iso.disc(ctx, v.x, v.y, z + 0.01, 1.05);

    Iso.orientedBox(ctx, { x: v.x, y: v.y, z: z + 0.16, hx: hx, hy: hy, len: 2.6, wid: 1.3, h: 0.3, color: '#5c6a72' });
    /* flatbed */
    Iso.orientedBox(ctx, { x: v.x - hx * 0.3, y: v.y - hy * 0.3, z: z + 0.46, hx: hx, hy: hy, len: 1.9, wid: 1.28, h: 0.55, color: '#c9c2ae' });
    /* cab */
    Iso.orientedBox(ctx, { x: v.x + hx * 0.95, y: v.y + hy * 0.95, z: z + 0.46, hx: hx, hy: hy, len: 0.9, wid: 1.15, h: 0.85, color: '#b8503f' });

    /* The gauge: how much of the whole build's budget the truck has already
       spent. Both +x and +y lean toward the camera, so px+py>0 picks the
       visible flank. */
    var frac = s.plan && s.plan.totalCost ? Math.min(1, s.elapsedCost / s.plan.totalCost) : 0;
    var px = -hy, py = hx;
    var side = (px + py) > 0 ? 1 : -1;
    var gx = v.x - hx * 0.3 + px * side * 0.66;
    var gy = v.y - hy * 0.3 + py * side * 0.66;
    var GLEN = 1.7;
    Iso.orientedBox(ctx, { x: gx, y: gy, z: z + 0.7, hx: hx, hy: hy, len: GLEN, wid: 0.03, h: 0.4, color: '#6d675c', edge: false });
    if (frac > 0) {
      Iso.orientedBox(ctx, {
        x: gx - hx * (GLEN * (1 - frac) / 2), y: gy - hy * (GLEN * (1 - frac) / 2),
        z: z + 0.72, hx: hx, hy: hy, len: Math.max(0.07, GLEN * frac - 0.06), wid: 0.05, h: 0.32,
        color: frac > 0.66 ? '#e4643f' : frac > 0.33 ? '#e8b34a' : '#7fc06a', edge: false
      });
    }

    /* the cargo: this station's own material spend, one crate per £4,000 */
    var ph = s.station && s.charged ? s.charged[s.station] : null;
    var crates = ph ? Math.max(0, Math.min(8, Math.round(ph.materialCost / 4000))) : 0;
    for (var i = 0; i < crates; i++) {
      var row = i % 2, col = (i / 2) | 0;
      Iso.orientedBox(ctx, {
        x: v.x - hx * (0.85 - col * 0.42) + px * (row ? 0.28 : -0.28),
        y: v.y - hy * (0.85 - col * 0.42) + py * (row ? 0.28 : -0.28),
        z: z + 1.05, hx: hx, hy: hy, len: 0.38, wid: 0.4, h: 0.32,
        color: i % 3 === 0 ? '#c2913c' : i % 3 === 1 ? '#a8926a' : '#b8a577'
      });
    }

    ctx.fillStyle = '#3f3a34';
    [[0.85, 0.55], [0.85, -0.55], [-0.85, 0.55], [-0.85, -0.55]].forEach(function (o) {
      Iso.disc(ctx, v.x + hx * o[0] + px * o[1], v.y + hy * o[0] + py * o[1], z + 0.13, 0.22);
    });
  }

  /* -------------------------------------------------------------- labels  */

  function drawLabels() {
    ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
    ctx.textBaseline = 'middle';

    labels.sort(function (a, b) { return (b.pri || 0) - (a.pri || 0); });

    var placed = [];
    var i;
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
    var ax = L.ax, ay = L.ay, sy = L.sy, size = L.px;
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

    var items = [];
    var i, s = Sim.state;

    for (i = 0; i < World.buildings.length; i++) {
      var b = World.buildings[i];
      if (b.kind && KIND[b.kind]) items.push({ k: b.x + b.y, f: KIND[b.kind], a: b });
      else items.push({ k: key(b), f: null, a: b });
    }
    for (i = 0; i < World.props.length; i++) {
      var pr = World.props[i];
      items.push({ k: pr.x + pr.y, f: pr.kind === 'tree' ? drawTree : drawLamp, a: pr });
    }
    var v = Sim.vanPosition();
    items.push({ k: v.x + v.y + 0.2, f: drawTruck, a: v });

    items.sort(function (p, q) { return p.k - q.k; });
    for (i = 0; i < items.length; i++) {
      if (items[i].f) { items[i].f(items[i].a); continue; }
      var o = items[i].a;
      Iso.box(ctx, o);
      if (o.roof) {
        Iso.gableRoof(ctx, {
          x: o.x - 0.08, y: o.y - 0.08, z: o.z + o.h,
          w: o.w + 0.16, d: o.d + 0.16, h: o.roofH || 0.45, color: o.roof
        });
      }
    }

    if (showLabels) {
      var declutter = cam.scale < 0.34;
      for (i = 0; i < World.districts.length; i++) {
        var d = World.districts[i];
        var isActive = d.id === activeDistrict || d.id === hoverDistrict;
        if (declutter && !isActive) continue;
        var sub = isActive ? d.tag : null;
        if (s.charged && s.charged[d.id] != null) sub = '+' + House.fmtGBP(s.charged[d.id].cost);
        labels.push({
          x: d.x, y: d.y, z: 0, lift: isActive ? 34 : 26,
          text: d.name, sub: sub,
          color: isActive ? d.color : '#3d3831',
          tint: d.color,
          size: isActive ? 16.5 : 14, bold: isActive,
          pri: isActive ? 2 : 1
        });
      }
    }

    if (s.running) {
      labels.push({
        x: v.x, y: v.y, z: (v.z || 0) + 2.2, lift: 8,
        text: House.fmtGBP(s.elapsedCost),
        sub: House.fmtDays(s.elapsedDays) + ' so far',
        color: '#3d3831', tint: '#8a8272', size: 14, bold: true, mono: true,
        pri: 3
      });
    }

    drawLabels();
  }

  global.Renderer = {
    draw: draw,
    setLabels: function (v) { showLabels = v; }
  };
})(window);
