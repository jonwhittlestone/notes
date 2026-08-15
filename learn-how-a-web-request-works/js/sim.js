/* sim.js: the state machine that walks one keypress through the world.
 *
 * This is the pacing engine. Three ideas do all the work:
 *
 *   1. The trolley moves along a route by distance, and a station fires when it
 *      passes one. Stations own the model steps; travel owns nothing.
 *   2. The FIRST time a station fires, the trolley stops for as long as its
 *      write-up takes to read. Every later visit gets a short beat instead.
 *   3. What the reader has already read (`tour`) lives outside the run state,
 *      so a reset replays the run but not the reading.
 *
 * The one thing here that is not in the template: the trolley's shells. Going
 * down the stack pushes a layer id onto state.shells and grows state.bytes;
 * climbing the far stair pops them again. That array is the vehicle's cargo,
 * and render.js draws it directly.
 */
(function (global) {
  'use strict';

  var Stack = global.Stack;
  var World = global.World;
  var Iso = global.Iso;

  var BASE_SPEED = 9;        // grid units / second at 1x

  /* Which districts the reader has already had explained. This deliberately
     survives a reset, because nobody wants to re-read the tour. */
  var tour = { seen: Object.create(null), done: false };

  var state = {
    running: false,
    paused: true,
    finished: false,

    station: null,
    stationT: 0,
    stepMode: false,
    speed: 1,

    /* ---- model inputs, wired to the controls in ui.js ---- */
    query: 'how does a web request work',
    distanceKm: 1200,
    hops: 14,
    mbps: 100,
    uplinkMbps: 20,
    scanHz: 1000,
    pollHz: 125,
    refreshHz: 60,
    ipv6: false,
    tls13: true,
    shards: 400,
    serpKB: 320,
    hotQuery: false,
    maxRequests: 3,

    /* ---- what the world has learned as it runs ---- */
    warmDns: false,        // browser + OS resolver cache, after the first lookup
    coldResolver: true,    // the recursive resolver's own cache, first trip only
    reuse: false,          // keep-alive + TLS session + a warm HPACK dynamic table

    /* ---- model output ---- */
    plan: null,            // the whole waterfall for the current trip
    charged: null,         // station id -> ms actually charged this trip
    elapsedMs: 0,          // what the trolley is carrying
    shells: [],            // layer ids currently wrapped around the payload
    bytes: 0,              // what the trolley is carrying, right now, in bytes
    carrying: 'nothing',   // a word for it, for the readout
    pilots: 0,             // handshake round trips to animate on the wire
    hitThisTrip: false,
    requests: 0,
    lastTotal: 0,
    firstTotal: 0,

    /* ---- pacing ---- */
    reading: false,
    dwellLeft: 0,
    dwellTotal: 0,
    fastForward: false,
    tourDone: false
  };

  var car = {
    routeName: 'desk',
    dist: 0,
    dwell: 0,
    stationIdx: 0
  };

  var listeners = [];
  function emit(name, payload) {
    for (var i = 0; i < listeners.length; i++) listeners[i](name, payload);
  }

  /* ---- the model ---------------------------------------------------------- */

  /* Recomputed whenever it is needed rather than cached, so dragging a slider
     mid-trip changes the stations that have not been charged yet. Stations
     already paid for keep the number they were charged. */
  function planNow() {
    return Stack.compute({
      query: state.query,
      distanceKm: state.distanceKm,
      hops: state.hops,
      mbps: state.mbps,
      uplinkMbps: state.uplinkMbps,
      scanHz: state.scanHz,
      pollHz: state.pollHz,
      refreshHz: state.refreshHz,
      ipv6: state.ipv6,
      tls13: state.tls13,
      warmDns: state.warmDns,
      coldResolver: state.coldResolver,
      reuse: state.reuse,
      hotQuery: state.hotQuery,
      shards: state.shards,
      serpKB: state.serpKB
    });
  }

  function phaseOf(plan, id) {
    for (var i = 0; i < plan.phases.length; i++) {
      if (plan.phases[i].id === id) return plan.phases[i];
    }
    return null;
  }

  function charge(id) {
    state.plan = planNow();
    var ph = phaseOf(state.plan, id);
    var ms = ph ? ph.ms : 0;
    state.charged[id] = ms;
    state.elapsedMs += ms;
    return ph;
  }

  /* The unwrapping stair is six stations sharing one phase, so each pays a
     sixth of it and the panel bar fills in six steps. */
  function chargePart(id, fraction) {
    state.plan = planNow();
    var ph = phaseOf(state.plan, id);
    var ms = (ph ? ph.ms : 0) * fraction;
    state.charged[id] = (state.charged[id] || 0) + ms;
    state.elapsedMs += ms;
    return ph;
  }

  /* ---- lifecycle --------------------------------------------------------- */

  function beginTrip() {
    state.charged = Object.create(null);
    state.elapsedMs = 0;
    state.shells = [];
    state.bytes = 0;
    state.carrying = 'nothing';
    state.pilots = 0;
    state.station = null;
    state.plan = planNow();
    state.hitThisTrip = state.hotQuery;
    state.fastForward = state.requests > 0;
    car.routeName = 'desk';
    car.dist = 0;
    car.stationIdx = 0;
    car.dwell = 0;
  }

  function reset() {
    state.finished = false;
    state.requests = 0;
    state.lastTotal = 0;
    state.firstTotal = 0;
    state.warmDns = false;
    state.coldResolver = true;
    state.reuse = false;
    state.tourDone = tour.done;
    state.reading = false;
    state.dwellLeft = 0;
    state.dwellTotal = 0;
    beginTrip();
  }

  function run() {
    reset();
    state.running = true;
    state.paused = false;
    emit('reset');
  }

  /* ---- per-station work --------------------------------------------------
     This table should read like a summary of the whole journey. */

  var OPS = {
    keyswitch: function () {
      charge('keyswitch');
      state.bytes = 0;
      state.carrying = 'a closed circuit';
    },
    hid: function () {
      charge('hid');
      state.bytes = Stack.HID_REPORT;
      state.carrying = 'an 8-byte HID report';
    },
    omnibox: function () {
      charge('omnibox');
      state.bytes = state.plan.packet.pathBytes;
      state.carrying = 'a URL';
    },
    resolve: function () {
      charge('resolve');
      state.carrying = 'a URL and an IP address';
    },

    /* --- down the stack: each terrace wraps what the last one produced --- */
    l7: function () { wrap('l7', 0); },
    l6: function () { wrap('l6', 1); },
    l4: function () { wrap('l4', 2); },
    l3: function () { wrap('l3', 3); },
    l2: function () { wrap('l2', 4); },
    l1: function () { wrap('l1', 5); },

    haul: function () {
      charge('haul');
      /* One pilot run per setup round trip, animated on the wire road: these
         crossings really did happen before the request was allowed to. */
      state.pilots = state.plan.setup.tcpTrips + state.plan.setup.tlsTrips;
    },
    edge: function () {
      charge('edge');
      state.pilots = 0;
    },

    /* --- the far stair: the same six envelopes, coming off --- */
    u1: function () { unwrap(0); },
    u2: function () { unwrap(1); },
    u3: function () { unwrap(2); },
    u4: function () { unwrap(3); },
    u5: function () { unwrap(4); },
    u6: function () { unwrap(5); },

    frontend: function () {
      charge('frontend');
      /* Decided here, not at the start of the trip, so the reader watches the
         route itself change: a hit sends the trolley straight home. */
      state.hitThisTrip = state.hotQuery;
      if (state.hitThisTrip) loadResponse();
    },
    index: function () {
      charge('index');
      state.carrying = Stack.fmtBig(state.plan.search.candidates) + ' candidates';
    },
    rank: function () {
      charge('rank');
      loadResponse();
    },
    transfer: function () {
      charge('transfer');
    },
    paint: function () {
      charge('paint');
      state.shells = [];
      state.bytes = state.plan.search.serpBytes;
      state.carrying = 'a page of results';
      state.requests++;
      state.lastTotal = state.elapsedMs;
      if (state.requests === 1) state.firstTotal = state.elapsedMs;
      /* One complete trip visits every district, so the tour is over. */
      tour.done = true;
      state.tourDone = true;
      /* Everything the browser keeps between requests is now warm. This is the
         whole reason the second keypress is cheaper than the first. */
      state.warmDns = true;
      state.coldResolver = false;
      state.reuse = true;
      emit('trip', state.requests);
    }
  };

  /* "a Ethernet frame" reads as a bug even when the number beside it is right. */
  function withArticle(unit) {
    if (/^symbols/.test(unit)) return unit;
    return (/^[AEIOU]/.test(unit) ? 'an ' : 'a ') + unit;
  }

  function wrap(id, stepIdx) {
    charge(id);
    var step = state.plan.packet.steps[stepIdx];
    state.shells.push(id);
    state.bytes = step.after;
    state.carrying = withArticle(step.unit);
  }

  function unwrap(i) {
    chargePart('unwrap', 1 / 6);
    state.shells.pop();
    /* Walk the byte ledger backwards: what is left after taking layer i off. */
    var steps = state.plan.packet.steps;
    var remaining = 5 - i;                   // index of the outermost still on
    state.bytes = remaining >= 0 ? steps[remaining].before : steps[0].before;
    state.carrying = remaining >= 0 ? withArticle(steps[remaining].unit) : 'a request';
    if (i === 5) { state.bytes = state.plan.packet.hpack.bytes; state.carrying = 'a request object'; }
  }

  /* The response exists now, so the trolley has something to carry home — and
     it is wrapped again for the trip, the same six envelopes in the same
     order. */
  function loadResponse() {
    state.shells = ['l7', 'l6', 'l4', 'l3', 'l2', 'l1'];
    state.bytes = state.plan.response.onWire;
    state.carrying = 'a compressed results page';
  }

  /* ---- update ------------------------------------------------------------ */

  function routeOf(name) { return World.routes[name]; }

  /* Once every district has been explained there is nothing left to read, so
     the remaining trips run at a watchable pace instead of a readable one. */
  function travelBoost() {
    return (state.fastForward ? 2.4 : 1) * (state.tourDone ? 3.0 : 1);
  }
  function dwellBoost() {
    /* Stops stay generous even after the tour, because their numbers change. */
    return (state.fastForward ? 2.2 : 1) * (state.tourDone ? 1.4 : 1);
  }

  function fire(st) {
    state.station = st.id;
    state.stationT = 0;
    var op = OPS[st.id];
    if (op) op();
    emit('station', st.id);
  }

  /* Every route change in the whole simulation lives here. There is exactly one
     branch, at the frontend, and it is the results cache. */
  function advanceRoute() {
    var n = car.routeName;
    var next =
      n === 'desk' ? 'down' :
      n === 'down' ? 'wire' :
      n === 'wire' ? 'up' :
      n === 'up'   ? 'dc' :
      n === 'dc'   ? (state.hitThisTrip ? 'back' : 'loop') :
      n === 'loop' ? 'back' : null;

    if (next) {
      car.routeName = next;
      car.dist = 0;
      car.stationIdx = 0;
      car.dwell = next === 'back' ? 0.5 : 0.25;
      return;
    }

    /* n === 'back': the page is on screen. */
    if (state.requests >= state.maxRequests) {
      state.finished = true;
      state.paused = true;
      state.station = 'done';
      emit('station', 'done');
      return;
    }
    beginTrip();
  }

  function update(dt) {
    state.stationT += dt;
    if (!state.running || state.paused || state.finished) return;

    var sdt = dt * state.speed * travelBoost();

    if (car.dwell > 0) {
      /* A stop is measured in reading seconds, so only the speed slider scales
         it; the travel boosts must never cut a first read short. */
      car.dwell -= dt * state.speed;
      state.dwellLeft = Math.max(0, car.dwell);
      if (car.dwell <= 0) { state.reading = false; state.dwellTotal = 0; }
      return;
    }

    var route = routeOf(car.routeName);
    car.dist += BASE_SPEED * sdt;

    var sts = World.stations[car.routeName];
    if (car.stationIdx < sts.length) {
      var st = sts[car.stationIdx];
      if (car.dist >= st.dist) {
        car.dist = st.dist;
        car.stationIdx++;
        /* Keyed by district, not by station: the six unwrap stops share one
           write-up and must not charge the reader six reads for it. */
        var topic = World.stationToDistrict[st.id] || st.id;
        var firstTime = !tour.seen[topic];
        fire(st);
        tour.seen[topic] = true;
        car.dwell = firstTime ? World.readSeconds(st.id) : st.dwell / dwellBoost();
        state.reading = firstTime;
        state.dwellTotal = car.dwell;
        state.dwellLeft = car.dwell;
        if (state.stepMode) { state.paused = true; state.stepMode = false; }
        return;
      }
    }

    if (car.dist >= route.total) advanceRoute();
  }

  /* ---- queries used by the renderer and the camera ----------------------- */

  function carPosition() {
    return Iso.smoothAt(routeOf(car.routeName), car.dist, 0.8);
  }

  global.Sim = {
    state: state,
    car: car,
    run: run,
    reset: function () { reset(); emit('reset'); },
    /* forget which districts have been explained, so the slow tour replays */
    replayTour: function () { tour.seen = Object.create(null); tour.done = false; },
    update: update,
    carPosition: carPosition,
    planNow: planNow,
    on: function (fn) { listeners.push(fn); },
    play: function () { if (!state.finished) { state.paused = false; state.running = true; } },
    pause: function () { state.paused = true; },
    toggle: function () { if (state.paused) this.play(); else this.pause(); },
    step: function () {
      if (state.finished) return;
      state.running = true;
      state.stepMode = true;
      state.paused = false;
      if (car.dwell > 0) car.dwell = 0;
    }
  };
})(window);
