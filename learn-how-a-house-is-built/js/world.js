/* world.js: the static place — a construction plot laid out as a single road,
 * with one short spur for the one branch in the whole build.
 *
 * Nothing here animates and nothing here computes the lesson. This file only
 * answers "where is everything, and what does each place mean".
 *
 * Two contracts the rest of the code depends on:
 *   routes[name]      a polyline the truck drives, parameterised by distance
 *   stations[name]    distances along that polyline that fire a model step
 * A station's `id` is a model step (it matches a phase id in js/model.js). A
 * district's `id` is a topic. They are the same everywhere except `rework`,
 * which shares no model step of its own — the cost was already charged back
 * at `inspection`; the spur is where the reader watches that cost get spent.
 */
(function (global) {
  'use strict';

  var Iso = global.Iso;
  var makeRoute = Iso.makeRoute;

  /* ---- routes ------------------------------------------------------------
     MAIN runs the site from the entrance to the inspection booth: permits,
     dirt, concrete, frame, roof, openings, then the three trades of the
     rough-in. REWORK is a short loop off the booth, only driven if the
     rough-in failed. FINAL carries on from the same booth to move-in. */

  var MAIN = makeRoute([
    [4, 10],       // 0 site entrance
    [12, 10],      // 1 site office
    [20, 10],      // 2 excavation pit
    [28, 10],      // 3 foundation yard
    [36, 8],        // 4 frame skeleton
    [44, 8],        // 5 roof deck
    [50, 12],       // 6 opening shop
    [50, 20],       // 7 utilities row
    [50, 26]        // 8 inspection booth
  ]);

  /* Only driven on a failed rough-in inspection. Starts and ends at the
     booth, so the booth is the only junction the rest of the site has to
     know about. */
  var REWORK = makeRoute([
    [50, 26],       // 0 booth
    [57, 22],       // 1 rework shed
    [50, 26]        // 2 back at the booth
  ]);

  var FINAL = makeRoute([
    [50, 26],       // 0 booth
    [44, 30],       // 1 insulation loft
    [36, 30],       // 2 drywall stacks
    [28, 30],       // 3 exterior finishes
    [20, 30],       // 4 interior finishes
    [12, 30],       // 5 fixtures & trim-out
    [6, 33]         // 6 landscaping — last waypoint, move-in fires here
  ]);

  function station(route, idx, id, dwell) {
    return { dist: route.cum[idx], id: id, dwell: dwell == null ? 0.8 : dwell };
  }

  var STATIONS = {
    main: [
      station(MAIN, 1, 'permits', 1.6),
      station(MAIN, 2, 'excavation', 1.4),
      station(MAIN, 3, 'foundation', 1.6),
      station(MAIN, 4, 'framing', 1.6),
      station(MAIN, 5, 'roofing', 1.4),
      station(MAIN, 6, 'openings', 1.4),
      station(MAIN, 7, 'utilities', 1.8),
      station(MAIN, 8, 'inspection', 1.8)
    ],
    rework: [
      station(REWORK, 1, 'rework', 1.4)
    ],
    final: [
      station(FINAL, 1, 'insulation', 1.4),
      station(FINAL, 2, 'drywall', 1.4),
      station(FINAL, 3, 'exterior', 1.6),
      station(FINAL, 4, 'interior', 1.8),
      station(FINAL, 5, 'fixtures', 1.6),
      station(FINAL, 6, 'landscaping', 1.4)
    ]
  };

  var STATION_TO_DISTRICT = {
    permits: 'permits', excavation: 'excavation', foundation: 'foundation',
    framing: 'framing', roofing: 'roofing', openings: 'openings',
    utilities: 'utilities', inspection: 'inspection', rework: 'rework',
    insulation: 'insulation', drywall: 'drywall', exterior: 'exterior',
    interior: 'interior', fixtures: 'fixtures', landscaping: 'landscaping'
  };

  /* ---- palette ----------------------------------------------------------- */

  var C = {
    clay:   '#b1673f',
    timber: '#a9834f',
    straw:  '#c2a34c',
    stone:  '#8a8b7d',
    slate:  '#5f7a86',
    copper: '#b06a4a',
    sage:   '#6d9068',
    moss:   '#5f8a52',
    plum:   '#8b6f96',
    brick:  '#a85a44',
    rose:   '#b0707a',
    steel:  '#5c7688',
    ochre:  '#c2913c',
    ink:    '#4a4540',
    paper:  '#e5e1d5',
    road:   '#c9c4b6',
    roadTop:'#d8d3c6',
    dirt:   '#8d7355',
    grass:  '#8aa96a'
  };

  /* ---- districts ----------------------------------------------------------
     `tag` is three or four words. `short` is one sentence a reader can take
     in while the truck is still slowing down. `body` is the paragraph the
     reading stop is timed against — every one names a real quantity from the
     default plan (260 sqm, standard spec, crew of 6, UK average region)
     and says why the stage exists, not just what it does. */
  var DISTRICTS = [
    {
      id: 'permits', name: 'Site Office', x: 12, y: 10, r: 4.2, color: C.stone,
      tag: 'Planning clock',
      short: 'Nothing gets built until the local authority says yes.',
      body: 'Before a shovel touches the ground, the plans go to the local authority for planning permission and a building regs check, and the plot gets surveyed — roughly £4,530 in fees and survey work on a 260 sqm house. It opens with 56 days of waiting that no crew size shortens — eight weeks is the statutory determination period, and that clock belongs to the planning office’s desk, not the job site. Every other station here has a Crew size lever; this one does not, which is why the truck just sits.'
    },
    {
      id: 'excavation', name: 'Excavation Pit', x: 20, y: 10, r: 4.2, color: C.dirt,
      tag: 'Earth moved',
      short: 'The whole footprint is cut and graded before a single block goes up.',
      body: 'The plot is cut about 1 m deep across the house’s full footprint — roughly 166 cubic metres of earth off a typical 166 sqm footprint, hauled at £28 a cubic metre. This stage is genuinely labour-bound: drag Crew size up and watch the day count actually fall, since more operators move more dirt per day. It is the last stage where that is unconditionally true.'
    },
    {
      id: 'foundation', name: 'Foundation Yard', x: 28, y: 10, r: 4.4, color: C.stone,
      tag: 'Concrete + rebar',
      short: 'Concrete cures on its own clock, and no crew size gets around that.',
      body: 'Footings and a slab go down together: about 23 cubic metres of concrete over roughly 1,370 kg of rebar, formed and finished by hand. A big crew can pour and finish that in well under a day — but the concrete itself needs about 4 days to cure, and that floor does not move no matter how many people you add. Push Crew size to maximum and watch this stage refuse to shrink.'
    },
    {
      id: 'framing', name: 'Frame Skeleton', x: 36, y: 8, r: 4.6, color: C.timber,
      tag: 'Blockwork & roof frame',
      short: 'Every inner wall, floor and roof truss the house will ever have goes up here.',
      body: 'About 281 sqm of blockwork forms the inner leaf of the cavity wall, and 7.3 cubic metres of structural timber becomes the roof trusses and floor joists — the skeleton everything else attaches to, and the surface the brick outer leaf will go up against later at Exterior Finishes. It is the largest labour stage in the build and one of the most crew-sensitive: pure construction labour, with no cure time or inspection wait to floor the schedule. The wireframe ahead is not decoration — it is every wall this house will ever have.'
    },
    {
      id: 'roofing', name: 'Roof Deck', x: 44, y: 8, r: 4.2, color: C.copper,
      tag: 'Weather-tight',
      short: 'Until the roof goes on, everything inside is one storm away from ruin.',
      body: 'The roof is cut at a 35° pitch, which stretches the tiled area to about 22% more than the footprint underneath it — call it 203 sqm on a typical plan. Concrete, clay or slate tiles are priced and bought by the square metre, which is why Finish level moves this station’s bill so much — slate runs more than four times the cost of concrete interlocking tile. Once the roof is weather-tight, every trade behind it — electrics, insulation, plastering — can work rain or shine.'
    },
    {
      id: 'openings', name: 'Opening Shop', x: 50, y: 12, r: 4.0, color: C.slate,
      tag: 'Windows & doors',
      short: 'Every window and door is a hole that has to be framed, flashed and sealed.',
      body: 'A typical plan gets one opening per 13 sqm of floor area — about 17 windows and 3 exterior doors on a 260 sqm house. Drag Finish level up and watch this station’s bill jump: a premium uPVC or timber window package runs nearly double a basic-spec one, because glazing is one of the few things buyers can actually see and price-compare. The blockwork labour barely moves.'
    },
    {
      id: 'utilities', name: 'Utilities Row', x: 50, y: 20, r: 4.6, color: C.slate,
      tag: 'Wire, pipe, boiler',
      short: 'Three trades run through the same open walls before anything closes them in.',
      body: 'Electricians pull about 988 m of cable across 9 circuits, plumbers run 416 m of pipe to 4.5 bathrooms’ worth of fixtures, and the heating engineer first-fixes a 31 kW combi boiler and its pipework through the same open blockwork — three trades paid for in one pass, which is why this is one of the most expensive stations on the site. There is no ducted air here: UK houses heat with a wet system, boiler and radiators, not forced air. None of it stays visible once the walls close.'
    },
    {
      id: 'inspection', name: 'Inspection Booth', x: 50, y: 26, r: 4.2, color: C.ochre,
      tag: 'Pass or fail',
      short: 'A building control inspector checks the wiring, pipe and boiler pipework before anything covers them for good.',
      body: 'This is the one fork in the whole road. A crew of four or more finishing standard-or-better work passes clean, in about 2 days. A crew smaller than that rushing a basic-spec job gets red-tagged — roughly £2,100 and 3 extra days to fix and re-inspect. The flag on the booth shows which way this run went. Drag Crew size below 4 with Finish level on basic spec and watch the fork happen.'
    },
    {
      id: 'rework', name: 'Rework Shed', x: 57, y: 22, r: 3.4, color: C.rose,
      tag: 'Redo it',
      short: 'A failed inspection does not stop the build — it adds a detour.',
      body: 'Wiring, pipe or boiler pipework that was rushed the first time gets corrected here before the crew is allowed back onto the main road: about £2,100 in materials and labour, and 3 days the schedule never budgeted for. Nothing about the finished house is different afterward — this loop exists purely because the first pass was not done to code. It is the only detour on the site triggered by staffing, not by the house’s size.'
    },
    {
      id: 'insulation', name: 'Insulation Loft', x: 44, y: 30, r: 4.0, color: C.straw,
      tag: 'The thermal envelope',
      short: 'Every wall cavity and roof surface gets packed before it is sealed shut for good.',
      body: 'Rigid PIR board — the sort of thing Kingspan makes — goes into about 484 sqm of cavity wall and roof deck: the house’s entire thermal envelope, done in one pass because it is the last moment those cavities are open. Push Finish level to premium and the material cost rises with it: thicker, higher-performance board costs more per square metre than the basic-spec fill. It is also the one stage a buyer never sees again after move-in.'
    },
    {
      id: 'drywall', name: 'Plasterboard Stacks', x: 36, y: 30, r: 4.2, color: C.paper,
      tag: 'Boarded & skimmed',
      short: 'The skeleton disappears behind roughly 351 sheets of plasterboard.',
      body: 'Every wall and ceiling gets boarded in 2.4 x 1.2 m sheets — about 351 of them on a typical plan, hung and skimmed with wet plaster in one continuous push. The count is sized directly off the house’s own wall and ceiling area, which is why Floor area moves this bar more than almost any other slider. Once this stage is done, the wireframe from framing is gone for good — everything from here on is finish work.'
    },
    {
      id: 'exterior', name: 'Exterior Finishes', x: 28, y: 30, r: 4.4, color: C.brick,
      tag: 'Brickwork & driveway',
      short: 'The outside of the house is the first thing anyone will ever judge it by.',
      body: 'Brick goes up over about 252 sqm of exterior wall — the outer leaf of the cavity wall, minus the openings already cut back at the Opening Shop — while the driveway is block-paved at a fixed 55 sqm. Finish level does its most visible work of the whole build here: standard, multi and stone-faced or reclaimed brick price roughly 1x, 1.4x and 2x apart per square metre, more spread than almost any other line on the panel.'
    },
    {
      id: 'interior', name: 'Interior Finishes', x: 20, y: 30, r: 4.6, color: C.plum,
      tag: 'Flooring, paint, cabinets',
      short: 'This is where the Finish level slider is felt hardest of anywhere in the budget.',
      body: 'Flooring goes down across the full 260 sqm, about 118 litres of paint cover the walls and ceilings, roughly 468 m of skirting and architrave gets fixed up, and the kitchen and bathroom cabinetry go in as one lump sum. Between basic spec and premium this station’s bill can swing by tens of thousands of pounds — carpet versus engineered wood, stock cabinets versus custom. Drag Finish level and watch this bar move most.'
    },
    {
      id: 'fixtures', name: 'Fixtures & Second Fix', x: 12, y: 30, r: 4.4, color: C.sage,
      tag: 'Final connections',
      short: 'Everything that was first-fixed months ago finally gets connected and turned on.',
      body: 'The 4.5 bathrooms get their sinks, baths and toilets, the kitchen gets its appliance package, about 23 sockets and switches get their faceplates, and 14 radiators sized back at Utilities Row get hung and connected to the boiler. A final building control inspector signs off here too, on a fixed 2-day wait no crew size shortens. Once that signature lands, the completion certificate exists and the house is legally habitable.'
    },
    {
      id: 'landscaping', name: 'Garden & Landscaping', x: 6, y: 33, r: 4.4, color: C.moss,
      tag: 'The plot, finished',
      short: 'The plot is bigger than the house — most of it still needs finishing.',
      body: 'A typical 700 sqm plot has about 479 sqm left over once the house and driveway are subtracted, and all of it gets graded, turfed and planted here. It is a small line item next to Utilities Row or Interior Finishes — a couple of thousand pounds against tens — but it is the last thing a buyer sees before they see the house itself.'
    }
  ];

  var DISTRICT_BY_ID = {};
  DISTRICTS.forEach(function (d) { DISTRICT_BY_ID[d.id] = d; });

  function readSeconds(stationId) {
    var d = DISTRICT_BY_ID[STATION_TO_DISTRICT[stationId] || stationId];
    if (!d) return 9;
    var words = (d.short + ' ' + d.body).split(/\s+/).length;
    return Math.min(26, Math.max(9, words / 3.8 + 3.5));
  }

  /* ---- buildings and props ------------------------------------------------
     Landmarks are built once, from the default plan (260 sqm, standard
     spec, crew of 6, UK average region), so the site reads as a real place
     even before the truck moves. A handful (the frame skeleton, the
     inspection flag, three prop counts) are drawn live from Sim.state in
     render.js instead, so what the reader sees there tracks whatever the
     sliders currently say. That split is declared in the About modal. */

  var buildings = [];
  var props = [];

  function put(o) { buildings.push(o); return o; }

  function block(x, y, o) {
    put({
      x: x, y: y, z: 0, w: o.w, d: o.d, h: o.h, color: o.color,
      roof: o.roof, roofH: o.roofH,
      windows: { cols: o.cols || 3, seed: Math.round(x * 7 + y * 13), color: o.lit }
    });
  }

  function distToRoutes(x, y) {
    var best = 1e9;
    [MAIN, REWORK, FINAL].forEach(function (r) {
      r.segs.forEach(function (s) {
        var vx = s.b.x - s.a.x, vy = s.b.y - s.a.y;
        var t = ((x - s.a.x) * vx + (y - s.a.y) * vy) / (vx * vx + vy * vy);
        t = Math.max(0, Math.min(1, t));
        var d = Math.hypot(x - (s.a.x + vx * t), y - (s.a.y + vy * t));
        if (d < best) best = d;
      });
    });
    return best;
  }

  function build() {
    if (buildings.length) return;

    /* -- Site Office: a trailer, set back north of the road -- */
    block(11.0, 5.6, { w: 3.0, d: 2.2, h: 2.0, color: '#cfc9b8', cols: 3, lit: C.stone, roof: '#a89a7e', roofH: 0.55 });
    put({ kind: 'signboard', x: 12.0, y: 8.2, color: C.stone });
    block(15.6, 12.8, { w: 2.2, d: 2.0, h: 1.6, color: '#d6d0c0', cols: 2, lit: C.stone });

    /* -- Excavation Pit: a sunken rectangle, dirt piles scaled to the cut --
       A negative z is still a plain box; render.js's generic pass handles it
       with no custom kind needed. */
    put({ x: 17.0, y: 6.6, z: -0.85, w: 6.0, d: 3.4, h: 0.85, color: '#6b5a44', edge: 'rgba(50,42,30,0.4)' });
    put({ kind: 'dirtPile', x: 19.0, y: 13.0, color: C.dirt });
    block(24.0, 13.2, { w: 2.2, d: 2.0, h: 1.6, color: '#cfc7b3', cols: 2, lit: C.dirt });

    /* -- Foundation Yard: a poured slab with a live rebar grid -- */
    put({ kind: 'foundationSlab', x: 25.0, y: 6.6, w: 6.0, d: 3.2, color: '#b7b2a2' });
    block(31.4, 13.0, { w: 2.4, d: 2.0, h: 1.8, color: '#c9c2ae', cols: 2, lit: C.stone });

    /* -- Frame Skeleton: the wireframe house, drawn live in render.js -- */
    put({ kind: 'frameSkeleton', x: 36, y: 8, color: C.timber });
    block(41.4, 4.0, { w: 2.2, d: 2.0, h: 1.8, color: '#d8cbab', cols: 2, lit: C.timber });

    /* -- Roof Deck: a gabled test section, plus roof tile bundles -- */
    put({
      x: 42.0, y: 4.2, z: 0, w: 3.4, d: 2.6, h: 1.7, color: '#c9bb9c',
      roof: C.copper, roofH: 0.9
    });
    put({ kind: 'shingleStack', x: 47.0, y: 6.4, color: C.copper });

    /* -- Opening Shop: a small shop with a live rack of window panes --
       Set well back (west) from the vertical road at x = 50. */
    block(45.4, 10.4, { w: 2.6, d: 2.2, h: 2.0, color: '#c3ccd2', cols: 3, lit: C.slate, roof: '#93a4ac', roofH: 0.6 });
    put({ kind: 'windowRack', x: 45.6, y: 14.6, color: C.slate });

    /* -- Utilities Row: three small huts, one per trade -- */
    put({ kind: 'elecHut', x: 45.4, y: 17.6, color: C.ochre });
    put({ kind: 'plumbHut', x: 45.4, y: 20.4, color: C.steel });
    put({ kind: 'hvacHut', x: 45.4, y: 23.2, color: C.sage });

    /* -- Inspection Booth: the flag colour is decided live -- */
    put({ kind: 'inspectBooth', x: 45.6, y: 26.0, color: C.ochre });

    /* -- Rework Shed: only ever seen on a failed run -- */
    put({ x: 57.0, y: 19.6, z: 0, w: 2.4, d: 2.0, h: 1.7, color: '#d3a89a', roof: C.rose, roofH: 0.55 });

    /* -- Insulation Loft: a stack of batt rolls, count read live -- */
    put({ kind: 'insulStack', x: 44, y: 26.2, color: C.straw });
    block(48.6, 32.6, { w: 2.2, d: 2.0, h: 1.6, color: '#ded2a8', cols: 2, lit: C.straw });

    /* -- Plasterboard Stacks: pallets of sheets, count read live -- */
    put({ kind: 'drywallPallet', x: 36, y: 26.2, color: '#e6e1d2' });
    block(40.6, 32.6, { w: 2.2, d: 2.0, h: 1.6, color: '#d9d3c2', cols: 2, lit: '#9a9484' });

    /* -- Exterior Finishes: a clad house face + the driveway slab -- */
    put({
      x: 24.4, y: 25.6, z: 0, w: 4.2, d: 2.8, h: 2.6, color: '#c98f6f',
      panels: { cols: 6, seed: 12, color: '#e3c2a6' }, roof: C.brick, roofH: 0.7
    });
    put({ kind: 'drivewaySlab', x: 28.6, y: 33.2, color: C.stone });

    /* -- Interior Finishes: a room mock-up — floor swatch, paint, trim -- */
    put({ x: 17.6, y: 26.4, z: 0, w: 3.4, d: 2.6, h: 0.16, color: '#c9a877' });
    put({ kind: 'paintCans', x: 21.4, y: 27.0, color: C.plum });
    block(15.4, 32.8, { w: 2.2, d: 2.0, h: 1.6, color: '#cfc0d2', cols: 2, lit: C.plum });

    /* -- Fixtures & Second Fix: bath and kitchen shapes -- */
    put({ kind: 'fixtureSet', x: 10.6, y: 26.2, color: C.sage });
    block(6.6, 32.8, { w: 2.2, d: 2.0, h: 1.6, color: '#c2d0bd', cols: 2, lit: C.sage });

    /* -- Garden & Landscaping: the finished show home + trees + sod -- */
    put({
      x: 2.4, y: 24.6, z: 0, w: 4.4, d: 3.4, h: 2.8, color: '#d8c3a0',
      panels: { cols: 6, seed: 21, color: '#efe0c4' }, roof: C.moss, roofH: 0.85
    });
    put({ kind: 'sodPatch', x: 7.0, y: 36.0, color: C.grass });

    /* -- background scenery, kept dull so the eye lands on the landmarks -- */
    var spots = [
      [8, 4], [18, 4], [30, 4], [8, 16], [14, 18], [22, 18], [30, 18],
      [38, 18], [10, 22], [16, 24], [24, 22], [32, 22], [40, 26],
      [4, 30], [16, 36], [24, 36], [32, 36], [40, 34], [54, 8], [54, 30]
    ];
    spots.forEach(function (s, i) {
      if (distToRoutes(s[0], s[1]) < 2.4) return;
      var n = Iso.hash2(s[0], s[1], 3);
      if (n < 0.3) {
        block(s[0], s[1], {
          w: 1.8 + n * 1.6, d: 1.6 + n, h: 1.4 + n * 1.4,
          color: n < 0.16 ? '#d3cbb6' : '#c9c1ac', cols: 2, lit: '#8b9aa4',
          roof: '#a89a7e', roofH: 0.5
        });
      } else {
        props.push({ kind: n < 0.68 ? 'tree' : 'lamp', x: s[0], y: s[1], seed: i });
      }
    });
    for (var k = 0; k < 4; k++) {
      var lx = 10 + k * 11;
      props.push({ kind: 'lamp', x: lx, y: k % 2 ? 12.6 : 6.9, seed: lx });
    }
  }

  global.World = {
    GW: 64, GH: 42,
    routes: { main: MAIN, rework: REWORK, final: FINAL },
    stations: STATIONS,
    districts: DISTRICTS,
    districtById: DISTRICT_BY_ID,
    stationToDistrict: STATION_TO_DISTRICT,
    readSeconds: readSeconds,
    buildings: buildings,
    props: props,
    palette: C,
    distToRoutes: distToRoutes,
    build: build
  };
})(window);
