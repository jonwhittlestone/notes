/* model.js: what it actually costs to turn one keypress into a page of results.
 *
 * THIS IS THE LESSON. Every number the panel shows comes out of compute()
 * below. There are no tables of pre-baked results anywhere in this file, so a
 * slider moves the panel because the arithmetic moved.
 *
 * There are two ledgers here, and they teach opposite things:
 *
 *   BYTES  the encapsulation ledger. Going down the stack costs bytes and
 *          almost no time: every layer wraps the one above it in a header, and
 *          for a search query the thing you actually typed ends up a small
 *          fraction of what goes on the wire.
 *   TIME   the latency waterfall. The layers are nearly free; the clocks (USB
 *          polling, display refresh) and the distance (speed of light in glass)
 *          are what you actually wait for.
 *
 * The honest boundary is restated in the About modal and the README. Anything
 * that is not derived from a measured or mandated constant is marked ASSUMED at
 * its point of definition below.
 */
(function (global) {
  'use strict';

  /* ---- exact physical constants ------------------------------------------ */

  var C_KMS   = 299792.458;          // speed of light in vacuum, km/s (defined)
  var FIBRE_N = 1.4675;              // group index of a silica core at 1550 nm
  var V_FIBRE = C_KMS / FIBRE_N;     // 204,287 km/s — light in a fibre

  /* ---- exact protocol constants (RFC / IEEE mandated) -------------------- */

  var ETH_MTU      = 1500;   // IEEE 802.3 default payload
  var ETH_HDR      = 14;     // dst 6 + src 6 + ethertype 2
  var ETH_FCS      = 4;      // frame check sequence
  var ETH_PREAMBLE = 8;      // 7 preamble + 1 start-frame delimiter
  var ETH_IFG      = 12;     // interframe gap, 96 bit times
  var ETH_MIN      = 60;     // minimum frame length excluding the FCS
  var IP4_HDR      = 20;     // RFC 791, no options
  var IP6_HDR      = 40;     // RFC 8200, fixed
  var TCP_HDR      = 20;     // RFC 9293, no options
  var TCP_OPTS     = 12;     // RFC 7323 timestamps — what Linux sends by default
  var H2_FRAME     = 9;      // RFC 9113 frame header
  var TLS_HDR      = 5;      // RFC 8446 record header
  var TLS_TAG      = 16;     // AES-128-GCM authentication tag
  var TLS_CTYPE    = 1;      // TLS 1.3 inner content type octet
  var USB_FS_MBPS  = 12;     // USB 2.0 full speed — what a keyboard enumerates at
  var HID_REPORT   = 8;      // boot-protocol keyboard report: modifiers, pad, 6 keys
  var INIT_CWND    = 10;     // segments. RFC 6928; Linux has shipped this since 2011

  /* ---- ASSUMED constants -------------------------------------------------
     Real arithmetic sits on top of every one of these, but the value itself is
     a judgement call rather than something anybody publishes. */

  var ROUTE_FACTOR   = 1.4;    // ASSUMED: fibre follows roads and coasts, not great circles
  var PER_HOP_MS     = 0.12;   // ASSUMED: forwarding + queueing at one router
  var HUFF_RATIO     = 0.78;   // ASSUMED: HPACK Huffman coding on ASCII header text
  var DEBOUNCE_MS    = 5;      // ASSUMED: typical keyboard firmware debounce window
  var KEY_TRAVEL_MS  = 2.5;    // ASSUMED: switch actuation, MX-style, from first touch
  var KERNEL_MS      = 0.9;    // ASSUMED: URB completion -> input subsystem -> compositor -> renderer
  var OMNIBOX_MS     = 2.0;    // ASSUMED: omnibox scoring, URL synthesis, request creation
  var HPACK_MS       = 0.02;   // ASSUMED: encoding nine headers
  var CRYPTO_MS      = 0.015;  // ASSUMED: AES-GCM over a few hundred bytes with AES-NI
  var STACK_MS       = 0.01;   // ASSUMED: per-layer kernel work, routing lookup, framing
  var GFE_MS         = 0.45;   // ASSUMED: edge TLS termination + backend selection
  var UNWRAP_MS      = 0.06;   // ASSUMED: the whole decapsulation climb, server side
  var CACHE_MS       = 0.8;    // ASSUMED: results-cache lookup at the frontend
  var SHARD_MS       = 6;      // ASSUMED: median posting-list intersection on one shard
  /* Two tail tiers, because measured server latency distributions have more
     than one. A fan-out waits for its slowest member, so the chance of hitting
     a tail is 1 - (1 - p)^shards for each tier: the arithmetic is exact, the
     two probabilities are ASSUMED. */
  var P_SLOW         = 0.01;    // ASSUMED: chance any one shard is having a bad moment
  var TAIL_MS        = 55;      // ASSUMED: what that costs when it happens
  var P_STALL        = 0.0004;  // ASSUMED: chance one is really stuck (GC, disk, reboot)
  var STALL_MS       = 240;     // ASSUMED: what that costs
  var DOCS_PER_SHARD = 8e6;    // ASSUMED: documents held by one index shard
  var CAND_PER_SHARD = 40;     // ASSUMED: candidates each shard returns to the mixer
  var NS_PER_CAND    = 420;    // ASSUMED: scoring + merge cost per candidate
  var SERP_ASSEMBLE  = 9;      // ASSUMED: templating the results page
  var BROTLI_RATIO   = 4.2;    // ASSUMED: brotli on search-results HTML
  var PARSE_MS_PER_KB= 0.05;   // ASSUMED: HTML tokenise + DOM build
  var STYLE_MS_PER_KB= 0.022;  // ASSUMED: style resolution + layout
  var PAINT_MS       = 4.5;    // ASSUMED: raster + composite of one viewport
  var DECOMP_MS_PER_KB = 0.006;// ASSUMED: brotli decode
  var PIXEL_MS       = 5;      // ASSUMED: LCD grey-to-grey response
  var RESOLVER_KM    = 40;     // ASSUMED: the ISP's recursive resolver is local
  var RESOLVER_RECURSE_MS = 55;// ASSUMED: resolver's own walk to an authoritative server
  var RESP_HDR_BYTES = 190;    // ASSUMED: HPACK-encoded response headers

  /* ---- the OSI stack, as this explainer walks it -------------------------
     Layers 5 and 6 have no separate implementation in TCP/IP. TLS is what
     actually occupies that space, so it is modelled as one terrace and named
     honestly. */

  var LAYERS = [
    { id: 'l7', n: 7,   layer: 'Application',  unit: 'message' },
    { id: 'l6', n: 6.5, layer: 'Presentation / Session', unit: 'record' },
    { id: 'l4', n: 4,   layer: 'Transport',    unit: 'segment' },
    { id: 'l3', n: 3,   layer: 'Network',      unit: 'packet'  },
    { id: 'l2', n: 2,   layer: 'Data link',    unit: 'frame'   },
    { id: 'l1', n: 1,   layer: 'Physical',     unit: 'symbols' }
  ];

  /* ---- helpers ----------------------------------------------------------- */

  function utf8Len(s) {
    var n = 0, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff) { i++; n += 4; continue; }
      n += c < 0x80 ? 1 : c < 0x800 ? 2 : 3;
    }
    return n;
  }

  function pathFor(query) {
    return '/search?q=' + encodeURIComponent(query).replace(/%20/g, '+') + '&sourceid=chrome&ie=UTF-8';
  }

  /* ---- HPACK ------------------------------------------------------------
     A real, if abbreviated, HPACK encoder (RFC 7541). Nine headers a browser
     genuinely sends. `stat` is an exact static-table entry, which costs a
     single indexed byte; `nameIdx` is a static entry whose name matches but
     whose value does not, which costs one byte for the name plus a length and
     the Huffman-coded value. On a reused connection everything the previous
     request already sent sits in the dynamic table and collapses to one byte —
     everything except :path, which changes with every query you type. */

  var COOKIE = 'SEARCH_SAMESITE=CgQIup0B; SID=g.a000swi9Xh1Q_kX3nJ8bT2mQvR7pL4dY6cF0aZ; ' +
               '__Secure-1PSID=g.a000swi9Xh1Q_kX3nJ8bT2mQvR7pL4dY6cF0aZ-mK; ' +
               'NID=515=Zt4mQ9pL0xR2vN8kD6cH3jF7bW1yS5aG-oU4iE9tP; AEC=AVh_V0kQ2mR8nT4';

  function headerSet(path) {
    return [
      { name: ':method',         value: 'GET',            stat: 2  },
      { name: ':scheme',         value: 'https',          stat: 7  },
      { name: ':authority',      value: 'www.google.com', nameIdx: 1  },
      { name: ':path',           value: path,             nameIdx: 4, volatile: true },
      /* static entry 16 is exactly "gzip, deflate", so adding br costs a literal */
      { name: 'accept-encoding', value: 'gzip, deflate, br, zstd', nameIdx: 16 },
      { name: 'accept',          value: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', nameIdx: 19 },
      { name: 'accept-language', value: 'en-GB,en;q=0.9', nameIdx: 17 },
      { name: 'user-agent',      value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', nameIdx: 58 },
      { name: 'cookie',          value: COOKIE,           nameIdx: 32 }
    ];
  }

  /* An HPACK integer with an N-bit prefix: one octet up to (2^N - 1), then
     seven bits per continuation octet. */
  function intLen(value, prefixBits) {
    var max = Math.pow(2, prefixBits) - 1;
    if (value < max) return 1;
    var n = 1, v = value - max;
    while (v >= 128) { v = Math.floor(v / 128); n++; }
    return n + 1;
  }

  function hpack(path, warm) {
    var items = [], total = 0;
    var set = headerSet(path);
    for (var i = 0; i < set.length; i++) {
      var h = set[i], bytes, how;
      var vlen = utf8Len(h.value);
      var huff = Math.ceil(vlen * HUFF_RATIO);
      if (h.stat) {
        bytes = intLen(h.stat, 7);
        how = 'static index ' + h.stat;
      } else if (warm && !h.volatile) {
        /* seen on this connection already: one indexed byte from the dynamic table */
        bytes = 1;
        how = 'dynamic table';
      } else {
        bytes = intLen(h.nameIdx, 6) + intLen(huff, 7) + huff;
        how = (warm ? 'changed, so literal' : 'literal, indexed for next time') +
              ' (' + vlen + ' B → ' + huff + ' B Huffman)';
      }
      items.push({ name: h.name, raw: utf8Len(h.name) + 2 + vlen, bytes: bytes, how: how });
      total += bytes;
    }
    return { bytes: total, items: items, raw: items.reduce(function (a, b) { return a + b.raw; }, 0) };
  }

  /* ---- encapsulation ----------------------------------------------------- */

  /* Walks the request down the stack and records what each layer adds. This is
     the byte ledger: every constant used here is mandated by a standard. */
  function encapsulate(p) {
    var query = String(p.query || '');
    var queryBytes = utf8Len(query);
    var path = pathFor(query);
    var hp = hpack(path, !!p.reuse);
    var ipHdr = p.ipv6 ? IP6_HDR : IP4_HDR;

    var steps = [];
    var size = hp.bytes;

    steps.push({
      id: 'l7', layer: 'Application', unit: 'HEADERS frame', add: H2_FRAME,
      before: hp.bytes, after: hp.bytes + H2_FRAME,
      note: 'nine headers HPACK-encoded to ' + hp.bytes + ' B from ' + hp.raw +
            ' B of text, then an HTTP/2 frame header'
    });
    size += H2_FRAME;

    var tlsAdd = TLS_CTYPE + TLS_TAG + TLS_HDR;
    steps.push({
      id: 'l6', layer: 'Presentation / Session', unit: 'TLS record', add: tlsAdd,
      before: size, after: size + tlsAdd,
      note: '5 B record header, 1 B inner content type, 16 B AES-GCM tag'
    });
    size += tlsAdd;

    var tcpAdd = TCP_HDR + TCP_OPTS;
    steps.push({
      id: 'l4', layer: 'Transport', unit: 'TCP segment', add: tcpAdd,
      before: size, after: size + tcpAdd,
      note: '20 B header plus 12 B of timestamp options'
    });
    size += tcpAdd;

    steps.push({
      id: 'l3', layer: 'Network', unit: (p.ipv6 ? 'IPv6' : 'IPv4') + ' packet', add: ipHdr,
      before: size, after: size + ipHdr,
      note: p.ipv6 ? '40 B fixed header, no checksum, no fragmentation'
                   : '20 B header with addresses, TTL and a checksum'
    });
    size += ipHdr;

    var payloadInFrame = size;
    var framed = Math.max(ETH_MIN, size + ETH_HDR) + ETH_FCS;
    var padding = Math.max(0, ETH_MIN - (size + ETH_HDR));
    steps.push({
      id: 'l2', layer: 'Data link', unit: 'Ethernet frame', add: framed - size,
      before: size, after: framed,
      note: '14 B header + 4 B checksum' + (padding ? ' + ' + padding + ' B of padding to the 60 B minimum' : '')
    });
    size = framed;

    var onWire = size + ETH_PREAMBLE + ETH_IFG;
    steps.push({
      id: 'l1', layer: 'Physical', unit: 'symbols on glass', add: ETH_PREAMBLE + ETH_IFG,
      before: size, after: onWire,
      note: '8 B preamble to lock the receiver clock, then a 12 B gap before the next frame'
    });

    return {
      query: query,
      queryBytes: queryBytes,
      path: path,
      pathBytes: utf8Len(path),
      hpack: hp,
      steps: steps,
      framed: framed,
      onWire: onWire,
      padding: padding,
      overhead: onWire - queryBytes,
      efficiency: onWire ? queryBytes / onWire : 0,
      mtuOk: payloadInFrame <= ETH_MTU,
      mss: ETH_MTU - ipHdr - TCP_HDR - TCP_OPTS
    };
  }

  /* ---- the keyboard ------------------------------------------------------
     Everything before the browser has even heard of the key. Two of the three
     costs here are waits on a clock, not work. */

  function keyboard(p) {
    var scanWait = 1000 / p.scanHz / 2;        // mean wait for the next matrix sweep
    var pollWait = 1000 / p.pollHz / 2;        // mean wait for the next USB IN token
    var usbXfer  = HID_REPORT * 8 / (USB_FS_MBPS * 1e6) * 1000;
    return {
      travel: KEY_TRAVEL_MS,
      scanWait: scanWait,
      debounce: DEBOUNCE_MS,
      pollWait: pollWait,
      usbXfer: usbXfer,
      kernel: KERNEL_MS,
      switchMs: KEY_TRAVEL_MS + scanWait + DEBOUNCE_MS,
      hidMs: pollWait + usbXfer + KERNEL_MS,
      reportBytes: HID_REPORT
    };
  }

  /* ---- the wire ---------------------------------------------------------- */

  function wire(p, bytesOut) {
    var pathKm = p.distanceKm * ROUTE_FACTOR;
    var propMs = pathKm / V_FIBRE * 1000;
    var hopMs  = p.hops * PER_HOP_MS;
    var owd    = propMs + hopMs;
    var rtt    = 2 * owd;
    /* Getting the bits out of your own house is a real, separate cost: the
       access link is almost always the narrowest part of the path. */
    var serialiseMs = bytesOut * 8 / (p.uplinkMbps * 1e6) * 1000;
    return {
      pathKm: pathKm, propMs: propMs, hopMs: hopMs,
      owd: owd, rtt: rtt, serialiseMs: serialiseMs
    };
  }

  /* How many round trips a response of `segments` segments needs before TCP
     will let the sender fire the lot. The window doubles each round, so after
     n rounds it has been allowed (2^n - 1) * 10 segments. */
  function slowStartRounds(segments) {
    if (segments <= INIT_CWND) return 1;
    return Math.ceil(Math.log(segments / INIT_CWND + 1) / Math.LN2);
  }

  /* ---- the whole thing --------------------------------------------------- */

  function compute(p) {
    var pk  = encapsulate(p);
    var kb  = keyboard(p);
    var w   = wire(p, pk.onWire);

    /* -- the search back end ---------------------------------------------- */
    var pSlow    = 1 - Math.pow(1 - P_SLOW, p.shards);
    var pStall   = 1 - Math.pow(1 - P_STALL, p.shards);
    var indexMs  = SHARD_MS + pSlow * TAIL_MS + pStall * STALL_MS;
    var docs     = p.shards * DOCS_PER_SHARD;
    var cands    = p.shards * CAND_PER_SHARD;
    var rankMs   = cands * NS_PER_CAND / 1e6 + SERP_ASSEMBLE;

    /* -- the response ------------------------------------------------------ */
    var serpBytes = p.serpKB * 1024;
    var wireBody  = Math.round(serpBytes / BROTLI_RATIO) + RESP_HDR_BYTES;
    var segments  = Math.ceil(wireBody / pk.mss);
    var respFrames = segments;
    var respOnWire = wireBody + respFrames *
      (TCP_HDR + TCP_OPTS + (p.ipv6 ? IP6_HDR : IP4_HDR) + ETH_HDR + ETH_FCS + ETH_PREAMBLE + ETH_IFG);
    var rounds    = slowStartRounds(segments);
    var bwMs      = respOnWire * 8 / (p.mbps * 1e6) * 1000;
    var startMs   = (rounds - 1) * w.rtt;
    /* Slow start and the width of the pipe overlap. On a fat pipe the round
       trips bind; on a thin one the bytes do. Take whichever is larger. */
    var transferMs = Math.max(bwMs, startMs);

    /* -- handshakes, charged where they physically happen: on the wire ----- */
    var tcpTrips = p.reuse ? 0 : 1;
    var tlsTrips = p.reuse ? 0 : (p.tls13 ? 1 : 2);
    var setupMs  = (tcpTrips + tlsTrips) * w.rtt;

    /* -- DNS --------------------------------------------------------------- */
    var dnsOwd = RESOLVER_KM * ROUTE_FACTOR / V_FIBRE * 1000 + 2 * PER_HOP_MS;
    var dnsMs  = p.warmDns ? 0 : (2 * dnsOwd + (p.coldResolver ? RESOLVER_RECURSE_MS : 0));

    /* -- painting ---------------------------------------------------------- */
    var decompMs = (wireBody / 1024) * DECOMP_MS_PER_KB;
    var parseMs  = p.serpKB * PARSE_MS_PER_KB;
    var styleMs  = p.serpKB * STYLE_MS_PER_KB;
    var vsyncMs  = 1000 / p.refreshHz / 2;      // mean wait for the next scan-out
    var frameMs  = 1000 / p.refreshHz;          // the scan-out itself
    var paintMs  = decompMs + parseMs + styleMs + PAINT_MS + vsyncMs + frameMs + PIXEL_MS;

    /* -- the waterfall, one phase per station ------------------------------ */
    var phases = [];
    function phase(id, label, ms, note) {
      phases.push({ id: id, label: label, ms: ms, note: note });
      return ms;
    }

    phase('keyswitch', 'Key switch', kb.switchMs,
      'switch travel, then a mean wait of ' + fmtMs(kb.scanWait) + ' for the matrix sweep, then ' +
      DEBOUNCE_MS + ' ms of debounce');
    phase('hid', 'USB + kernel', kb.hidMs,
      'mean wait of ' + fmtMs(kb.pollWait) + ' for the host to poll, then the report and the driver stack');
    phase('omnibox', 'Omnibox', OMNIBOX_MS, 'deciding this is a search and building the URL');
    phase('resolve', 'DNS', dnsMs,
      p.warmDns ? 'already in the browser and OS caches'
                : (p.coldResolver ? 'resolver had to walk the delegation chain' : 'one round trip to the local resolver'));

    phase('l7', 'L7 encode', HPACK_MS, pk.steps[0].note);
    phase('l6', 'L6/5 encrypt', CRYPTO_MS, pk.steps[1].note);
    phase('l4', 'L4 segment', STACK_MS, pk.steps[2].note);
    phase('l3', 'L3 route', STACK_MS, pk.steps[3].note);
    phase('l2', 'L2 frame', STACK_MS, pk.steps[4].note);
    phase('l1', 'L1 serialise', w.serialiseMs,
      pk.onWire + ' B onto a ' + p.uplinkMbps + ' Mbps uplink');

    phase('haul', 'The wire', setupMs + w.owd,
      (tcpTrips + tlsTrips) + ' setup round trip' + (tcpTrips + tlsTrips === 1 ? '' : 's') +
      ' at ' + fmtMs(w.rtt) + ', then ' + fmtMs(w.owd) + ' one way over ' +
      Math.round(w.pathKm) + ' km of glass');
    phase('edge', 'Edge (GFE)', GFE_MS, 'anycast landing, TLS terminated, backend chosen');
    phase('unwrap', 'Decapsulate', UNWRAP_MS, 'six headers stripped, back up to a request object');
    phase('frontend', 'Frontend', CACHE_MS,
      p.hotQuery ? 'served from the results cache' : 'results cache missed, going to the index');

    if (p.hotQuery) {
      phase('index', 'Index shards', 0, 'skipped: the results cache had this query');
      phase('rank', 'Rank + assemble', 0, 'skipped: the results cache had this query');
    } else {
      phase('index', 'Index shards', indexMs,
        p.shards + ' shards in parallel; ' + (pSlow * 100).toFixed(1) +
        '% chance at least one is slow, ' + (pStall * 100).toFixed(1) + '% that one is stuck');
      phase('rank', 'Rank + assemble', rankMs,
        cands.toLocaleString() + ' candidates scored, then the page is built and compressed');
    }

    phase('transfer', 'Response', w.owd + transferMs,
      rounds === 1 ? 'fits in the initial 10-segment window'
                   : rounds + ' slow-start rounds to open the window to ' + segments + ' segments');
    phase('paint', 'Parse + paint', paintMs,
      'parse and layout, then a mean ' + fmtMs(vsyncMs) + ' wait for the next refresh at ' + p.refreshHz + ' Hz');

    /* -- derived ----------------------------------------------------------- */
    var total = 0, i, ttfb = 0;
    for (i = 0; i < phases.length; i++) {
      if (phases[i].id === 'transfer') ttfb = total + w.owd;
      total += phases[i].ms;
    }

    var inputMs   = kb.switchMs + kb.hidMs + OMNIBOX_MS;
    var networkMs = dnsMs + w.serialiseMs + setupMs + w.owd + GFE_MS + UNWRAP_MS +
                    w.owd + transferMs;
    var serverMs  = CACHE_MS + (p.hotQuery ? 0 : indexMs + rankMs);
    var clientMs  = paintMs;

    /* Waiting on a clock rather than on work or on distance: the two polling
       intervals plus the wait for the display to scan out. */
    var clockMs = kb.scanWait + kb.pollWait + vsyncMs + frameMs;
    /* Pure speed of light, both directions plus every setup round trip. */
    var lightMs = (2 + 2 * (tcpTrips + tlsTrips)) * w.propMs +
                  (p.warmDns ? 0 : 2 * (RESOLVER_KM * ROUTE_FACTOR / V_FIBRE * 1000));

    return {
      packet: pk, keys: kb, wire: w, layers: LAYERS,
      phases: phases,
      dns: { owd: dnsOwd, ms: dnsMs },
      search: {
        shards: p.shards, docs: docs, candidates: cands,
        pSlow: pSlow, pStall: pStall, indexMs: indexMs, rankMs: rankMs,
        serpBytes: serpBytes, wireBody: wireBody, ratio: BROTLI_RATIO
      },
      response: {
        segments: segments, rounds: rounds, onWire: respOnWire,
        bwMs: bwMs, startMs: startMs, transferMs: transferMs
      },
      setup: { tcpTrips: tcpTrips, tlsTrips: tlsTrips, ms: setupMs, rtt: w.rtt },
      paint: { decompMs: decompMs, parseMs: parseMs, styleMs: styleMs, vsyncMs: vsyncMs, frameMs: frameMs, ms: paintMs },
      totals: {
        total: total, ttfb: ttfb,
        input: inputMs, network: networkMs, server: serverMs, client: clientMs,
        clock: clockMs, light: lightMs,
        roundTrips: (p.warmDns ? 0 : 1) + tcpTrips + tlsTrips + 1 + (rounds - 1)
      }
    };
  }

  /* ---- formatting -------------------------------------------------------- */

  function fmtMs(ms) {
    if (ms >= 1000) return (ms / 1000).toFixed(2) + ' s';
    if (ms >= 100) return Math.round(ms) + ' ms';
    if (ms >= 1) return (Math.round(ms * 10) / 10) + ' ms';
    if (ms >= 0.001) return Math.round(ms * 1000) + ' µs';
    return (ms * 1e6).toFixed(0) + ' ns';
  }

  function fmtBytes(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB';
    if (b >= 1024) return (b / 1024).toFixed(1) + ' KB';
    return Math.round(b) + ' B';
  }

  function fmtBig(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' billion';
    if (n >= 1e6) return (n / 1e6).toFixed(0) + ' million';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
    return String(n);
  }

  var api = {
    C_KMS: C_KMS, FIBRE_N: FIBRE_N, V_FIBRE: V_FIBRE,
    ETH_MTU: ETH_MTU, INIT_CWND: INIT_CWND, BROTLI_RATIO: BROTLI_RATIO,
    DOCS_PER_SHARD: DOCS_PER_SHARD, HID_REPORT: HID_REPORT,
    LAYERS: LAYERS,
    utf8Len: utf8Len, pathFor: pathFor, hpack: hpack,
    encapsulate: encapsulate, keyboard: keyboard, wire: wire,
    slowStartRounds: slowStartRounds, compute: compute,
    fmtMs: fmtMs, fmtBytes: fmtBytes, fmtBig: fmtBig
  };

  global.Stack = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
