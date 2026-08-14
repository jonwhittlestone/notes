/* sim.js: the state machine that drives one truck around the plot.
 *
 * Three ideas do all the work, same as any explainer built on this skill:
 *
 *   1. The truck moves along a route by distance, and a station fires when it
 *      passes one. Stations own the model steps; travel owns nothing.
 *   2. The FIRST time a station fires, the truck stops for as long as its
 *      write-up takes to read. Every later visit gets a short beat instead.
 *   3. What the reader has already read (`tour`) lives outside the run state,
 *      so a reset replays the run but not the reading.
 *
 * Unlike a request/response town, a house is only built once per run: there
 * is no repeat-trip fast-forward. The only speed-up is `tourDone`, once every
 * district has been explained on an earlier run.
 */
(function (global) {
  'use strict';

  var House = global.House;
  var World = global.World;
  var Iso = global.Iso;

  var BASE_SPEED = 6;        // grid units / second at 1x

  /* Which districts the reader has already had explained. Deliberately
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

    /* ---- model inputs, wired to the sliders in ui.js ---- */
    floorAreaSqm: 260,
    finishLevel: 1,       // 0 basic spec, 1 standard, 2 premium
    crewSize: 6,
    regionIndex: 1,        // 0 North & Scotland, 1 UK average, 2 London & South East

    /* ---- model output ---- */
    plan: null,             // the whole build for the current parameters
    charged: null,           // station id -> the phase snapshot actually charged
    elapsedCost: 0,          // what the truck is carrying, running total
    elapsedDays: 0,
    failed: false,           // decided at the inspection station

    /* ---- pacing ---- */
    reading: false,
    dwellLeft: 0,
    dwellTotal: 0,
    tourDone: false
  };

  var van = {
    routeName: 'main',
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
     mid-build changes the stations not yet reached. Stages already charged
     keep the number they were charged. */
  function planNow() {
    return House.compute({
      floorAreaSqm: state.floorAreaSqm,
      finishLevel: state.finishLevel,
      crewSize: state.crewSize,
      regionIndex: state.regionIndex
    });
  }

  function charge(id) {
    state.plan = planNow();
    var ph = House.phaseOf(state.plan, id);
    if (ph) {
      state.charged[id] = ph;
      state.elapsedCost += ph.cost;
      state.elapsedDays += ph.days;
    }
    return ph;
  }

  /* ---- lifecycle --------------------------------------------------------- */

  function reset() {
    state.finished = false;
    state.failed = false;
    state.charged = Object.create(null);
    state.elapsedCost = 0;
    state.elapsedDays = 0;
    state.station = null;
    state.plan = planNow();
    state.tourDone = tour.done;
    state.reading = false;
    state.dwellLeft = 0;
    state.dwellTotal = 0;
    van.routeName = 'main';
    van.dist = 0;
    van.stationIdx = 0;
    van.dwell = 0;
  }

  function run() {
    reset();
    state.running = true;
    state.paused = false;
    emit('reset');
  }

  /* ---- per-station work -------------------------------------------------- */

  var OPS = {
    permits: function () { charge('permits'); },
    excavation: function () { charge('excavation'); },
    foundation: function () { charge('foundation'); },
    framing: function () { charge('framing'); },
    roofing: function () { charge('roofing'); },
    openings: function () { charge('openings'); },
    utilities: function () { charge('utilities'); },

    inspection: function () {
      var ph = charge('inspection');
      /* Decided here, not before, so the reader watches the fork itself
         change: a fail sends the truck onto the loop on the right. */
      state.failed = !!(state.plan && state.plan.failed);
    },

    /* The rework station charges nothing of its own — the cost and the days
       were already added back at `inspection`. This stop is where the
       reader watches that cost actually get spent. */
    rework: function () {},

    insulation: function () { charge('insulation'); },
    drywall: function () { charge('drywall'); },
    exterior: function () { charge('exterior'); },
    interior: function () { charge('interior'); },
    fixtures: function () { charge('fixtures'); },

    landscaping: function () {
      charge('landscaping');
      /* One complete run visits every district, so the tour is over. */
      tour.done = true;
      state.tourDone = true;
      emit('built');
    }
  };

  /* ---- update ------------------------------------------------------------ */

  function routeOf(name) { return World.routes[name]; }

  /* Once every district has been explained there is nothing left to read, so
     later runs move at a watchable pace instead of a readable one. */
  function travelBoost() { return state.tourDone ? 3.0 : 1; }
  function dwellBoost() { return state.tourDone ? 1.4 : 1; }

  function fire(st) {
    state.station = st.id;
    state.stationT = 0;
    var op = OPS[st.id];
    if (op) op();
    emit('station', st.id);
  }

  /* The one branch in the whole site lives here, same as every other
     explainer built on this skill: one `if` per fork, nowhere else. */
  function advanceRoute() {
    if (van.routeName === 'main') {
      van.routeName = state.failed ? 'rework' : 'final';
      van.dist = 0;
      van.stationIdx = 0;
      van.dwell = state.failed ? 0.5 : 0.3;
    } else if (van.routeName === 'rework') {
      van.routeName = 'final';
      van.dist = 0;
      van.stationIdx = 0;
      van.dwell = 0.3;
    } else if (van.routeName === 'final') {
      state.finished = true;
      state.paused = true;
      state.station = 'done';
      emit('station', 'done');
    }
  }

  function update(dt) {
    state.stationT += dt;
    if (!state.running || state.paused || state.finished) return;

    var sdt = dt * state.speed * travelBoost();

    if (van.dwell > 0) {
      /* A reading stop is measured in reading seconds, so only the speed
         slider scales it; the travel boost must never cut a first read
         short. */
      van.dwell -= dt * state.speed;
      state.dwellLeft = Math.max(0, van.dwell);
      if (van.dwell <= 0) { state.reading = false; state.dwellTotal = 0; }
      return;
    }

    var route = routeOf(van.routeName);
    van.dist += BASE_SPEED * sdt;

    var sts = World.stations[van.routeName];
    if (van.stationIdx < sts.length) {
      var st = sts[van.stationIdx];
      if (van.dist >= st.dist) {
        van.dist = st.dist;
        van.stationIdx++;
        var topic = World.stationToDistrict[st.id] || st.id;
        var firstTime = !tour.seen[topic];
        fire(st);
        tour.seen[topic] = true;
        van.dwell = firstTime ? World.readSeconds(st.id) : st.dwell / dwellBoost();
        state.reading = firstTime;
        state.dwellTotal = van.dwell;
        state.dwellLeft = van.dwell;
        if (state.stepMode) { state.paused = true; state.stepMode = false; }
        return;
      }
    }

    if (van.dist >= route.total) advanceRoute();
  }

  /* ---- queries used by the renderer and the camera ----------------------- */

  function vanPosition() {
    return Iso.smoothAt(routeOf(van.routeName), van.dist, 0.8);
  }

  global.Sim = {
    state: state,
    van: van,
    run: run,
    reset: function () { reset(); emit('reset'); },
    replayTour: function () { tour.seen = Object.create(null); tour.done = false; },
    update: update,
    vanPosition: vanPosition,
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
      if (van.dwell > 0) van.dwell = 0;
    }
  };
})(window);
