/* world.js: the static place — routes, stations, districts, buildings, props.
 *
 * Nothing here animates and nothing here computes the lesson. This file only
 * answers "where is everything, and what does each place mean".
 *
 * The shape of the place is the shape of the journey. A keypress starts on the
 * ground at the keyboard and climbs to the application plateau, because that is
 * a rise in abstraction: copper, then a report, then a URL. Then the whole
 * stack descends again, one terrace per OSI layer, back down to copper at the
 * water's edge. The wire runs flat and long. The far side climbs the same six
 * terraces in reverse. The response comes home on a high viaduct.
 *
 * Two contracts the rest of the code depends on:
 *   routes[name]      a polyline the trolley drives, parameterised by distance
 *   stations[name]    distances along that polyline that fire a model step
 * A station's `id` is a model step; a district's `id` is a topic. The six
 * unwrap stations share one district, so the reader is not made to read the
 * same paragraph six times.
 */
(function (global) {
  'use strict';

  var Iso = global.Iso;
  var makeRoute = Iso.makeRoute;

  /* ---- routes ------------------------------------------------------------ */

  /* The desk. Ground level at the key, rising to the application plateau. */
  var DESK = makeRoute([
    [5, 10, 0],        // 0 the keycap
    [11, 10, 0],       // 1 KEY SWITCH YARD — still copper
    [16, 10, 1.6],     // 2 HID BENCH — a byte exists now
    [22, 10, 4.2],     // 3 OMNIBOX — top of the client hill
    [28, 10, 4.2],     // 4 NAME REGISTRY — DNS is up here; it is an application
    [33, 10, 4.2]      // 5 the lip of the descent
  ]);

  /* Down the stack. Six terraces, each one lower than the last, because that
     is what encapsulation is: handing your message to something less abstract
     than you are. */
  var DOWN = makeRoute([
    [33, 10, 4.2],     // 0
    [37, 10, 4.2],     // 1 L7  APPLICATION TERRACE
    [40.5, 10, 4.2],   // 2 corner
    [40.5, 15, 3.4],   // 3 L6  CIPHER TERRACE
    [40.5, 18, 3.4],   // 4 corner
    [45, 18, 2.6],     // 5 L4  SEGMENT TERRACE
    [48.5, 18, 2.6],   // 6 corner
    [48.5, 23, 1.8],   // 7 L3  PACKET TERRACE
    [48.5, 26, 1.8],   // 8 corner
    [53, 26, 1.0],     // 9 L2  FRAME YARD
    [56.5, 26, 1.0],   // 10 corner
    [56.5, 31, 0.15]   // 11 L1 PHYSICAL WORKS — back on the ground
  ]);

  /* The wire. Deliberately the longest straight in the world: this is the only
     leg where the speed of light is the thing you are waiting for. */
  var WIRE = makeRoute([
    [56.5, 31, 0.15],  // 0
    [68, 31, 0.1],     // 1 THE LONG HAUL
    [80, 31, 0.15]     // 2 EDGE GATE
  ]);

  /* The same six terraces mirrored, climbing. One district, six stops: the
     animation carries the repetition so the text does not have to. */
  var UP = makeRoute([
    [80, 31, 0.15],    // 0
    [83, 31, 0.9],     // 1 strip the frame
    [83, 28, 1.6],     // 2 strip the IP header
    [86.5, 28, 2.3],   // 3 strip the TCP header
    [86.5, 25, 3.0],   // 4 decrypt the record
    [90, 25, 3.7],     // 5 decode HPACK
    [90, 21, 4.2],     // 6 a request object again
    [93, 21, 4.2]      // 7 the datacentre floor
  ]);

  var DC = makeRoute([
    [93, 21, 4.2],     // 0
    [97, 21, 4.2]      // 1 FRONTEND HALL — the junction
  ]);

  /* The index ring. A loop in the road, because a fan-out is a loop — though
     a parallel one; see the Index Halls write-up. */
  var LOOP = makeRoute([
    [97, 21, 4.2],     // 0 out of the frontend
    [104, 21, 4.2],    // 1
    [108, 25, 4.2],    // 2 INDEX HALLS
    [108, 31, 4.2],    // 3
    [104, 35, 4.2],    // 4 RANKING FLOOR
    [98, 35, 4.2],     // 5
    [94, 31, 4.2],     // 6
    [94, 25, 4.2],     // 7
    [97, 21, 4.2]      // 8 back at the frontend, carrying a page
  ]);

  /* Home on a high viaduct, so the response is visibly a different journey
     from the request and flies over everything it cost to get there. */
  var BACK = makeRoute([
    [97, 21, 4.2],     // 0
    [97, 17, 6.2],     // 1 up the ramp
    [92, 14, 7.2],     // 2
    [62, 14, 7.2],     // 3 RETURN VIADUCT — the transfer itself happens here
    [30, 14, 7.2],     // 4
    [22, 14, 6.0],     // 5
    [13, 17, 4.8],     // 6
    [6, 20, 4.2],      // 7 SCREEN WORKS — pixels
    [4, 15, 1.2],      // 8 down to the desk again
    [5, 10, 0]         // 9 back at the key
  ]);

  /* `dwell` is how long the trolley waits once the reader has already read this
     district. The much longer first-visit stop comes from readSeconds(). */
  function station(route, idx, id, dwell) {
    return { dist: route.cum[idx], id: id, dwell: dwell == null ? 0.8 : dwell };
  }

  var STATIONS = {
    desk: [
      station(DESK, 1, 'keyswitch', 1.6),
      station(DESK, 2, 'hid', 1.4),
      station(DESK, 3, 'omnibox', 1.4),
      station(DESK, 4, 'resolve', 1.4)
    ],
    down: [
      station(DOWN, 1, 'l7', 1.2),
      station(DOWN, 3, 'l6', 1.2),
      station(DOWN, 5, 'l4', 1.2),
      station(DOWN, 7, 'l3', 1.2),
      station(DOWN, 9, 'l2', 1.2),
      station(DOWN, 11, 'l1', 1.4)
    ],
    wire: [
      station(WIRE, 1, 'haul', 2.0),
      station(WIRE, 2, 'edge', 1.4)
    ],
    up: [
      station(UP, 1, 'u1', 0.45), station(UP, 2, 'u2', 0.45),
      station(UP, 3, 'u3', 0.45), station(UP, 4, 'u4', 0.45),
      station(UP, 5, 'u5', 0.45), station(UP, 6, 'u6', 0.6)
    ],
    dc: [
      station(DC, 1, 'frontend', 1.4)
    ],
    loop: [
      station(LOOP, 2, 'index', 1.8),
      station(LOOP, 4, 'rank', 1.6)
    ],
    back: [
      station(BACK, 3, 'transfer', 2.0),
      station(BACK, 7, 'paint', 1.8)
    ]
  };

  /* Six model steps, one write-up. Without this the reader is charged six
     reading stops for one idea. */
  var STATION_TO_DISTRICT = {
    u1: 'unwrap', u2: 'unwrap', u3: 'unwrap',
    u4: 'unwrap', u5: 'unwrap', u6: 'unwrap'
  };

  /* Which layer each unwrap stop takes off, for the trolley's readout. */
  var UNWRAP_ORDER = ['l1', 'l2', 'l3', 'l4', 'l6', 'l7'];

  /* ---- palette ----------------------------------------------------------- */

  /* A printed-diagram palette: muted, low-chroma hues that read as ink on
     paper. The six layer colours run warm at the top of the stack to cool at
     the bottom, so a glance at the trolley tells you how deep it is. */
  var C = {
    key:    '#c2913c',
    usb:    '#b8703a',
    brow:   '#a04a52',
    dns:    '#7a8c3f',

    l7:     '#b0546e',
    l6:     '#8b5f96',
    l4:     '#6f63a8',
    l3:     '#4a7a9b',
    l2:     '#3f8a86',
    l1:     '#5f8a52',

    haul:   '#5d7f95',
    edge:   '#2f7d70',
    unwrap: '#86909c',
    front:  '#9b6f3f',
    index:  '#4d8a6a',
    rank:   '#b0803a',
    xfer:   '#8d5a7a',
    paint:  '#3f6f9b',

    ink:    '#4a4540',
    road:   '#c9c4b6',
    roadTop:'#d8d3c6'
  };

  /* The six shells the trolley wears, innermost first. render.js draws one ring
     per applied layer in these colours; ui.js colours the byte ledger with
     them. Same list, one place. */
  var SHELL_COLORS = [C.l7, C.l6, C.l4, C.l3, C.l2, C.l1];

  /* ---- districts (clickable, narrated) ----------------------------------- */

  /* `tag` is three or four words. `short` is one sentence a reader can take in
     while the trolley is still slowing down. `body` is the paragraph the
     reading stop is timed against: concrete, numbered, and honest about what it
     is leaving out. The six layer terraces are deliberately terser than the
     rest — they are a rhythm, not six essays. */
  var DISTRICTS = [
    {
      id: 'keyswitch', name: 'Key Switch Yard', x: 11, y: 10, r: 4.2, color: C.key,
      tag: 'Copper closes',
      short: 'Nothing digital has happened yet. A spring is pushing two pieces of metal together.',
      body: 'Under the keycap, two contacts close a circuit in a grid of rows and columns. The controller is not watching your key: it sweeps the whole matrix about a thousand times a second and finds out on its next pass. Then it waits out five milliseconds of debounce, because contacts really do chatter and would otherwise report one press as four. That is not slow code. It is metal.'
    },
    {
      id: 'hid', name: 'HID Bench', x: 16, y: 10, r: 3.8, color: C.usb,
      tag: 'Eight bytes, when asked',
      short: 'The keyboard never speaks first. It waits to be asked.',
      body: 'USB is strictly polled: the host asks, the device answers. A keyboard enumerating at 125 Hz is asked every eight milliseconds, so four more go on average to waiting for a clock nobody watches. The report is eight bytes — modifier bits, a reserved byte, six key slots — and pushing it down a 12 Mbps link takes five microseconds. Drag the poll rate to 1000 Hz and see which of those two numbers moves.'
    },
    {
      id: 'omnibox', name: 'The Omnibox', x: 22, y: 10, r: 4.2, color: C.brow,
      tag: 'Text becomes a URL',
      short: 'The browser has to guess whether you typed an address or a question.',
      body: 'One box takes both hostnames and sentences, so every keystroke is scored against your history, your bookmarks and the shape of the string itself. A space and no dots means a search: the text is percent-encoded into a query parameter and hung off your default engine. Autocomplete fires here too, so by the time you press Return several requests have already crossed the road ahead of you.'
    },
    {
      id: 'resolve', name: 'Name Registry', x: 28, y: 10, r: 4.0, color: C.dns,
      tag: 'Name → address',
      short: 'The road has no idea what "google" means.',
      body: 'DNS sits up on the application plateau because it is an application: its own protocol, its own servers, riding the same stack as everything else. Warm, the answer is already in the browser and the OS and costs nothing. Cold, the resolver may have to walk from the root to .com to Google first, which is more like 50 ms than 1. That is why this bar drops to zero on the second request and stays there.'
    },

    {
      id: 'l7', name: 'Application Terrace', x: 37, y: 10, r: 3.6, color: C.l7,
      tag: 'Layer 7 · the message',
      short: 'The only layer that knows what you asked for.',
      body: 'Your request becomes headers — method, scheme, authority, path, cookies, user-agent — roughly 600 bytes as text. HPACK indexes the common ones down to single bytes and remembers the rest, so on a warm connection almost all of it collapses to the one header that changed: the path, carrying your query.'
    },
    {
      id: 'l6', name: 'Cipher Terrace', x: 40.5, y: 15, r: 3.6, color: C.l6,
      tag: 'Layers 6 and 5 · the record',
      short: 'The two floors of the OSI model nobody rents. TLS moved in.',
      body: 'Presentation and session have no separate implementation in TCP/IP, which is how the seven-layer model earned its reputation. TLS occupies the space instead: it encrypts the record and adds 22 bytes — a header, an inner content type, and a tag proving nobody edited the ciphertext. Encryption costs microseconds; the handshake costs round trips.'
    },
    {
      id: 'l4', name: 'Segment Terrace', x: 45, y: 18, r: 3.6, color: C.l4,
      tag: 'Layer 4 · the segment',
      short: 'A promise that nothing arrives twice or out of order.',
      body: 'TCP adds 20 bytes plus 12 of timestamp options: ports, a sequence number so the far end can put the pieces back in order, and a window saying how much may be in flight. This is the layer that turns a pile of packets into a stream you can read — and the one that will throttle your response.'
    },
    {
      id: 'l3', name: 'Packet Terrace', x: 48.5, y: 23, r: 3.6, color: C.l3,
      tag: 'Layer 3 · the packet',
      short: 'It knows where the far end is. It has no idea how to get there.',
      body: 'IP adds addresses and a hop counter: 20 bytes for IPv4, a flat 40 for IPv6, bigger but simpler. No router knows the whole route; each reads the destination and forwards one hop. Flip IPv6 and watch two numbers move together — the header grows and the usable segment size shrinks by exactly as much.'
    },
    {
      id: 'l2', name: 'Frame Yard', x: 53, y: 26, r: 3.6, color: C.l2,
      tag: 'Layer 2 · the frame',
      short: 'Addressed not to Google but to the box in your hallway.',
      body: 'Ethernet wraps the packet in 14 bytes and a 4-byte checksum, addressed to your router’s MAC — one hop, no further. The router strips it and writes a new one. That is the whole trick of layering: the envelope is rewritten at every hop while the letter inside is never opened.'
    },
    {
      id: 'l1', name: 'Physical Works', x: 56.5, y: 31, r: 3.8, color: C.l1,
      tag: 'Layer 1 · the symbols',
      short: 'Back to copper and glass, where we started.',
      body: 'The frame becomes voltage or light: eight bytes of preamble so the receiver can lock its clock, then the frame, then a twelve-byte gap. Here bandwidth finally means something — 531 bytes onto a 20 Mbps uplink takes about 200 microseconds. Note that this journey has now crossed two physical layers: the keyboard’s, and this one.'
    },

    {
      id: 'haul', name: 'The Long Haul', x: 68, y: 31, r: 5.5, color: C.haul,
      tag: 'The speed of light, in glass',
      short: 'The only place in this world where a physical constant sets the bill.',
      body: 'Light in silica travels at about 204,000 km/s, two-thirds of its vacuum speed, and fibre follows coastlines rather than great circles — roughly 1.4 times the map distance. The setup round trips are charged here because this is where they happen: the pilot runs crossing the road are handshakes that had to finish before your request could move at all.'
    },
    {
      id: 'edge', name: 'Edge Gate', x: 80, y: 31, r: 4.4, color: C.edge,
      tag: 'Anycast landing',
      short: 'You did not reach Google. You reached the nearest building that answers to its address.',
      body: 'The same IP address is announced from hundreds of sites and routing delivers you to the closest — that is anycast, and it is why the distance slider is about the edge rather than California. Drop it to 50 km and the journey loses about 50 ms without one byte changing. Your TLS session ends here, at a front end holding connections onward permanently open.'
    },
    {
      id: 'unwrap', name: 'Unwrapping Stair', x: 86.5, y: 26, r: 5.5, color: C.unwrap,
      tag: 'Six envelopes, in reverse',
      short: 'Every header added on the way down comes off here, in the opposite order.',
      body: 'The frame is checked and discarded, the IP header read and dropped, the TCP header used to reassemble a stream, the record decrypted, HPACK decoded back into headers. Six stops, a few tens of microseconds, and at the top there is a request object again — exactly what the browser had before it packed it.'
    },
    {
      id: 'frontend', name: 'Frontend Hall', x: 97, y: 21, r: 4.0, color: C.front,
      tag: 'The junction',
      short: 'Popular queries never reach the index at all.',
      body: 'A small share of queries account for a large share of traffic, so the front end checks a results cache before doing anything expensive: a hit costs under a millisecond against the 110 ms the index and ranking want. On a miss the query is parsed, spelling-corrected, expanded and fanned out. Toggle Popular query and watch the map rather than the number: the saving is the shape of the route changing.'
    },
    {
      id: 'index', name: 'Index Halls', x: 108, y: 27, r: 5.0, color: C.index,
      tag: 'Scatter and gather',
      short: 'Far too big for one machine, so every machine gets asked at once.',
      body: 'The web is split across thousands of shards, each holding a slice of an inverted index — word to the documents containing it. Every shard is asked simultaneously and the fan-out ends when the slowest answers. If one shard in a hundred is having a bad moment, four hundred shards makes hitting one near-certain. Drag Index shards up and watch a bar grow that owes nothing to the network.'
    },
    {
      id: 'rank', name: 'Ranking Floor', x: 102, y: 35, r: 4.4, color: C.rank,
      tag: 'Many, then ten',
      short: 'Finding the documents is the easy half. Ordering them is the product.',
      body: 'Each shard returns a few dozen candidates, so the mixer sees tens of thousands and has to get to ten. Candidates are scored, the winners merged into one ordered list, the page templated around them and compressed — brotli takes search HTML down about fourfold. The hopper here is drawn to the real candidate count; the chute is always ten.'
    },
    {
      id: 'transfer', name: 'Return Viaduct', x: 62, y: 14, r: 6.0, color: C.xfer,
      tag: 'Slow start',
      short: 'A fresh connection does not get your bandwidth. It has to earn it.',
      body: 'TCP will not fire a large response down a new connection at full speed. It sends ten segments, about 14 kB, waits for the acknowledgement, then doubles the window, and doubles again. On a long link it is those round trips, not the width of the pipe, that set the transfer time. Drag Bandwidth up at 8,000 km and watch this bar refuse to move.'
    },
    {
      id: 'paint', name: 'Screen Works', x: 6, y: 20, r: 4.4, color: C.paint,
      tag: 'Bytes become photons',
      short: 'The last wait is for glass that only changes sixty times a second.',
      body: 'The response is decompressed, tokenised into a DOM, styled, laid out and rasterised — and then it sits there, finished, waiting. A display accepts a frame only at its refresh interval, so 60 Hz means an average 8.3 ms of nothing and another 16.7 ms to scan out. Drag Refresh to 240 Hz: you cannot buy a faster speed of light, but you can buy a faster clock.'
    }
  ];

  var DISTRICT_BY_ID = {};
  DISTRICTS.forEach(function (d) { DISTRICT_BY_ID[d.id] = d; });

  /* First-visit stop, in seconds, scaled to how much there is to read. The
     floor keeps a short district on screen long enough to notice; the ceiling
     stops the longest write-up parking the trolley for a minute. */
  function readSeconds(stationId) {
    var d = DISTRICT_BY_ID[STATION_TO_DISTRICT[stationId] || stationId];
    if (!d) return 9;
    var words = (d.short + ' ' + d.body).split(/\s+/).length;
    return Math.min(26, Math.max(9, words / 3.8 + 3.5));
  }

  /* ---- buildings and props ----------------------------------------------- */

  var buildings = [];
  var props = [];

  function put(o) { buildings.push(o); return o; }

  /* A background block: something with windows that makes the place read as a
     place. Deliberately dull — the eye must land on the landmarks. */
  function block(x, y, o) {
    put({
      x: x, y: y, z: o.z || 0, w: o.w, d: o.d, h: o.h, color: o.color,
      roof: o.roof, roofH: o.roofH,
      windows: { cols: o.cols || 3, seed: Math.round(x * 7 + y * 13), color: o.lit }
    });
  }

  var ROUTE_LIST = [DESK, DOWN, WIRE, UP, DC, LOOP, BACK];

  /* How far (x, y) is from the nearest road, so scenery can be scattered
     without landing on the carriageway. */
  function distToRoutes(x, y) {
    var best = 1e9;
    ROUTE_LIST.forEach(function (r) {
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

  /* A gantry the road drives under, registered as three separate pieces so
     each sorts on its own depth. One key for the whole thing and the near post
     draws behind a trolley that should be passing under it.
     `axis` is the direction of travel: 'x' puts the posts either side in y. */
  function gantry(x, y, z, axis, color, label, extra) {
    var span = (extra && extra.span) || 1.9;
    var ox = axis === 'x' ? 0 : span;
    var oy = axis === 'x' ? span : 0;
    function piece(kind, px, py) {
      var o = { kind: kind, x: px, y: py, z: z, axis: axis, color: color, label: label, span: span };
      if (extra) { for (var k in extra) if (extra.hasOwnProperty(k)) o[k] = extra[k]; }
      return put(o);
    }
    piece('gatePost', x - ox, y - oy);
    piece('gateBeam', x, y);
    piece('gatePost', x + ox, y + oy);
  }

  /* One terrace of the descent: the gantry the trolley drives under, a stack of
     header plates whose height is the bytes that layer adds, and a shed set
     well back. In this projection a solid at (mx, my) hides the road point at
     (mx, by) once half its footprint exceeds its setback, so nothing wide gets
     to stand near the carriageway. */
  function terrace(id, x, y, z, axis, color, label, plateSide) {
    gantry(x, y, z, axis, color, label);
    var px = axis === 'x' ? x - 1.2 : x + plateSide * 4.6;
    var py = axis === 'x' ? y + plateSide * 4.6 : y - 1.2;
    put({ kind: 'plates', id: id, x: px, y: py, z: z, color: color });
  }

  /* The index ring: where each shard hall stands. Twenty of them, drawn around
     the outside of the loop, standing in for however many the slider says. */
  var SHARD_COUNT = 20;
  function shardPos(i) {
    var ring = [
      [111.4, 22.6], [113.4, 25.4], [113.4, 28.4], [113.4, 31.4],
      [111.0, 34.2], [108.2, 36.6], [105.2, 38.4], [101.6, 38.6],
      [98.2, 38.4], [95.0, 37.0], [92.2, 34.6], [90.4, 31.6],
      [90.0, 28.4], [99.0, 26.4], [89.0, 34.4], [100.6, 24.4],
      [104.2, 24.6], [104.4, 28.2], [104.2, 31.6], [100.4, 31.4]
    ];
    return { x: ring[i % ring.length][0], y: ring[i % ring.length][1] };
  }

  function build() {
    if (buildings.length) return;

    /* -- Key Switch Yard: a keycap on a switch, over a wiring matrix -------- */
    put({ kind: 'keycap', x: 11, y: 6.4, color: C.key });
    put({ kind: 'matrix', x: 8.6, y: 13.4, color: C.key });
    block(6.4, 4.2, { w: 3.0, d: 2.4, h: 2.0, color: '#ddc79a', cols: 3, lit: C.key, roof: '#b09a86', roofH: 0.6 });

    /* -- HID Bench: the poll clock is the landmark, because the wait is the
          lesson. Set back on the far side so it never covers the trolley. --- */
    put({ kind: 'pollclock', x: 16.4, y: 5.8, z: 1.6, color: C.usb });
    block(12.8, 3.0, { z: 1.6, w: 2.8, d: 2.2, h: 1.8, color: '#e0bfa2', cols: 3, lit: C.usb });

    /* -- The Omnibox: a screen standing on the plateau showing the query ---- */
    put({ kind: 'omniscreen', x: 22, y: 5.6, z: 4.2, color: C.brow });
    block(18.8, 2.8, { z: 4.2, w: 2.8, d: 2.2, h: 2.2, color: '#dcb5b3', cols: 3, lit: C.brow });

    /* -- Name Registry: a card-index tower and a dish that asks upstream ---- */
    put({ kind: 'registry', x: 28, y: 5.2, z: 4.2, color: C.dns });
    put({ kind: 'dish', x: 30.8, y: 5.6, z: 4.2, color: C.dns });

    /* -- the six terraces of the descent ----------------------------------- */
    terrace('l7', 37,   10, 4.2,  'x', C.l7, 'L7  APPLICATION', -1);
    terrace('l6', 40.5, 15, 3.4,  'y', C.l6, 'L6/5  TLS RECORD', 1);
    terrace('l4', 45,   18, 2.6,  'x', C.l4, 'L4  TCP SEGMENT', -1);
    terrace('l3', 48.5, 23, 1.8,  'y', C.l3, 'L3  IP PACKET', 1);
    terrace('l2', 53,   26, 1.0,  'x', C.l2, 'L2  ETHERNET FRAME', -1);
    terrace('l1', 56.5, 31, 0.15, 'y', C.l1, 'L1  ON THE WIRE', 1);

    /* Sheds behind each terrace, well clear of the road. */
    block(34.0, 5.2, { z: 4.2, w: 2.6, d: 2.2, h: 2.0, color: '#d8b0bd', cols: 2, lit: C.l7 });
    block(36.0, 17.6, { z: 3.4, w: 2.4, d: 2.2, h: 2.2, color: '#c9b4d1', cols: 2, lit: C.l6 });
    block(43.0, 23.0, { z: 2.6, w: 2.6, d: 2.2, h: 1.8, color: '#bdb7d6', cols: 3, lit: C.l4 });
    block(53.6, 20.2, { z: 1.8, w: 2.4, d: 2.2, h: 2.0, color: '#aec3d3', cols: 2, lit: C.l3 });
    block(51.0, 31.0, { z: 1.0, w: 2.6, d: 2.2, h: 1.8, color: '#a9cdc9', cols: 3, lit: C.l2 });
    block(61.4, 24.6, { w: 2.8, d: 2.4, h: 2.0, color: '#b4cdac', cols: 3, lit: C.l1 });

    /* -- The Long Haul: repeater huts and kilometre posts down a long wire -- */
    put({ kind: 'repeater', x: 63.0, y: 35.6, color: C.haul });
    put({ kind: 'repeater', x: 74.0, y: 26.4, color: C.haul });
    for (var m = 0; m < 8; m++) {
      props.push({ kind: 'kmpost', x: 58.5 + m * 2.8, y: 33.2, seed: m });
    }

    /* -- Edge Gate: a wide arch with the anycast fan behind it -------------- */
    gantry(80, 31, 0.15, 'x', C.edge, 'EDGE  ANYCAST', { span: 2.4, big: true });
    put({
      x: 76.6, y: 35.4, z: 0, w: 5.2, d: 3.0, h: 2.4, color: '#a3c6c0',
      panels: { cols: 5, seed: 5, color: '#cfe4de' }, rooftop: C.edge
    });
    put({ kind: 'dish', x: 84.4, y: 34.8, color: C.edge });

    /* -- Unwrapping Stair: an arch at each landing, shedding a shell -------- */
    var stair = [[83, 31, 0.9], [83, 28, 1.6], [86.5, 28, 2.3],
                 [86.5, 25, 3.0], [90, 25, 3.7], [90, 21, 4.2]];
    var stairAxis = ['y', 'y', 'x', 'y', 'x', 'y'];
    stair.forEach(function (s, i) {
      gantry(s[0], s[1], s[2], stairAxis[i], C.unwrap, null);
    });
    block(80.4, 24.0, { z: 1.6, w: 2.6, d: 2.4, h: 2.2, color: '#c2c8cf', cols: 2, lit: C.unwrap });
    block(88.4, 31.6, { z: 2.3, w: 2.4, d: 2.2, h: 2.0, color: '#c8ced4', cols: 2, lit: C.unwrap });

    /* -- Frontend Hall: the results-cache vault beside the junction --------- */
    put({ kind: 'vault', x: 100.6, y: 16.0, z: 4.2, color: C.front });
    block(105.0, 15.6, { z: 4.2, w: 2.6, d: 2.2, h: 2.0, color: '#dcc3a0', cols: 2, lit: C.front });

    /* -- Index Halls: one hall per shard, around the outside of the ring ---- */
    for (var s2 = 0; s2 < SHARD_COUNT; s2++) {
      var sp = shardPos(s2);
      put({ kind: 'shard', x: sp.x, y: sp.y, z: 4.2, idx: s2, color: C.index });
    }

    /* -- Ranking Floor: a hopper narrowing to a chute of ten --------------- */
    put({ kind: 'hopper', x: 102.4, y: 30.6, z: 4.2, color: C.rank });

    /* -- Return Viaduct: a gantry per slow-start round, widening ----------- */
    /* One gantry per slow-start round, each wider than the last, because the
       window doubles. render.js lights only as many as the model says this
       response actually needed. */
    for (var r = 0; r < 5; r++) {
      gantry(70 - r * 4, 14, 7.2, 'x', C.xfer, r === 0 ? 'CWND  10 SEG' : null,
             { span: 1.5 + r * 0.42, round: r });
    }

    /* -- Screen Works: the monitor the whole journey was for ---------------- */
    put({ kind: 'monitor', x: 6.0, y: 24.6, z: 4.2, color: C.paint });
    block(10.6, 24.2, { z: 4.2, w: 2.6, d: 2.2, h: 1.8, color: '#b7c8da', cols: 2, lit: C.paint });

    /* -- scenery ----------------------------------------------------------- */
    var spots = [
      [8, 30], [14, 30], [20, 24], [26, 24], [30, 30], [36, 22], [34, 30],
      [42, 6], [46, 6], [52, 8], [56, 12], [60, 8], [64, 14], [44, 34],
      [50, 36], [56, 38], [62, 22], [68, 22], [72, 36], [76, 20], [84, 18],
      [88, 34], [92, 38], [26, 34], [18, 36], [10, 36], [70, 40], [80, 40],
      [40, 40], [30, 40], [12, 40], [66, 6], [72, 10], [78, 8], [86, 12]
    ];
    spots.forEach(function (sp2, i) {
      if (distToRoutes(sp2[0], sp2[1]) < 3.0) return;
      var n = Iso.hash2(sp2[0], sp2[1], 3);
      if (n < 0.3) {
        block(sp2[0], sp2[1], {
          w: 1.8 + n * 1.6, d: 1.6 + n, h: 1.4 + n * 1.6,
          color: n < 0.16 ? '#d8cfbe' : '#cfc7b6', cols: 2, lit: '#8b9aa4',
          roof: '#b09a86', roofH: 0.5
        });
      } else {
        props.push({ kind: n < 0.7 ? 'tree' : 'lamp', x: sp2[0], y: sp2[1], seed: i });
      }
    });
  }

  /* Where the elevated decks need holding up. Drawn with the roads, not with
     the buildings, so the deck covers a pillar's top rather than the other way
     round. Each entry names the route it supports. */
  var PILLARS = [
    { r: 'desk', p: [[19, 10], [25, 10], [31, 10]] },
    { r: 'down', p: [[35, 10], [39, 10], [40.5, 12.5], [40.5, 17], [43, 18],
                     [47, 18], [48.5, 21], [48.5, 25], [51, 26], [55, 26]] },
    { r: 'up',   p: [[83, 29.5], [86.5, 27], [86.5, 24], [90, 23.5], [90, 21.5], [92, 21]] },
    { r: 'dc',   p: [[94.5, 21], [96.5, 21]] },
    { r: 'loop', p: [[100, 21], [104, 21], [107, 23], [108, 28], [107, 33],
                     [104, 35], [100, 35], [96, 34], [94, 30], [94, 26], [95.5, 22.5]] },
    { r: 'back', p: [[97, 18], [94, 15], [86, 14], [78, 14], [70, 14], [62, 14],
                     [54, 14], [46, 14], [38, 14], [30, 14], [24, 14], [17, 15.6],
                     [10, 18.4], [5, 17]] }
  ];

  global.World = {
    GW: 118, GH: 44,
    routes: { desk: DESK, down: DOWN, wire: WIRE, up: UP, dc: DC, loop: LOOP, back: BACK },
    routeOrder: ['desk', 'down', 'wire', 'up', 'dc', 'loop', 'back'],
    pillars: PILLARS,
    stations: STATIONS,
    districts: DISTRICTS,
    districtById: DISTRICT_BY_ID,
    stationToDistrict: STATION_TO_DISTRICT,
    unwrapOrder: UNWRAP_ORDER,
    readSeconds: readSeconds,
    buildings: buildings,
    props: props,
    palette: C,
    shellColors: SHELL_COLORS,
    shardPos: shardPos, SHARD_COUNT: SHARD_COUNT,
    distToRoutes: distToRoutes,
    build: build
  };
})(window);
