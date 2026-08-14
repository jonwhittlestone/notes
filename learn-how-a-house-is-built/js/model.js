/* model.js: what it actually takes to build a 5-bedroom brick house in the UK.
 *
 * THIS IS THE LESSON. Every number the panel shows comes out of compute()
 * below — a real construction takeoff, not a table of pre-baked results. Drag
 * a slider and the quantities, the costs and the schedule are recomputed from
 * the house's actual dimensions.
 *
 * The construction method is UK cavity-wall masonry, not US timber stick
 * framing: an inner blockwork leaf and an outer brick leaf either side of an
 * insulated cavity, with timber trusses and joists for the roof and floors,
 * concrete or clay tiles (or slate) on the roof, and a gas boiler with
 * radiators rather than ducted forced-air heating and cooling.
 *
 * The honest boundary, restated in the About modal and the README:
 *
 *   Genuinely computed   every quantity (concrete m³, blockwork and brickwork
 *                        area, plasterboard sheets, wire and pipe length,
 *                        roof tile area...) from the house's floor area and
 *                        geometry, and the cost and labour-hours built from
 *                        those quantities.
 *   Assumed              every unit cost, every productivity rate and every
 *                        rule-of-thumb ratio (structural timber per square
 *                        metre, bathrooms per bedroom count, wire length per
 *                        square metre, ...). Builders do not publish
 *                        takeoffs; these are 2025 UK national ballpark
 *                        figures. Marked `// ASSUMED` at each one.
 *   Indicative           the schedule assumes phases run back to back with no
 *                        overlap, which real schedules do not: several trades
 *                        (electrics, plumbing, heating first fix) actually
 *                        work in parallel. Treat the calendar-days total as
 *                        an upper bound, not a promise.
 */
(function (global) {
  'use strict';

  var REG = {
    storeys: 2,                      // fixed: this house is a two-storey plan
    garageSqm: 36,                   // ASSUMED: attached 6x6 m double garage
    aspectRatio: 1.35,               // ASSUMED: typical rectangular footprint, length:width
    wallHeightM: 2.7,                // ASSUMED: floor-to-floor height, each storey
    roofPitchDeg: 35,                // ASSUMED: pitch for concrete/clay interlocking roof tiles
    bedroomCount: 5,                 // fixed: this is the 5-bedroom house
    bathCount: 4.5,                  // ASSUMED: family bathroom + 3 en-suites + 1 downstairs WC, typical 5-bed detached
    openingSqmPerWindow: 13,         // ASSUMED: one window/door opening per 13 sqm of floor area
    extDoorCount: 3,                 // ASSUMED: front, back, garage-to-house
    plotSqm: 700,                    // ASSUMED: typical detached plot
    drivewaySqm: 55,                 // ASSUMED: block-paved double driveway
    laborRatePerHr: 30,              // ASSUMED: blended trade labour rate (£/hr), before region adjustment

    regionMultiplier: [0.85, 1.00, 1.55],   // ASSUMED: North & Scotland / UK average / London & South East
    finishMultiplier: [0.82, 1.00, 1.42],   // ASSUMED: basic spec / standard spec / premium spec

    // -- excavation --
    excavationCutM: 1.0,             // ASSUMED: average cut depth for foundations + slab prep
    excavationCostPerM3: 28,         // ASSUMED £/m³, incl. muck-away
    excavationM3PerManHour: 1.3,     // ASSUMED productivity

    // -- foundation (strip foundation + ground-bearing slab) --
    footingWidthM: 0.4, footingDepthM: 0.3,   // 400mm x 300mm perimeter strip footing
    slabThicknessM: 0.1,                       // 100mm ground floor slab
    concreteCostPerM3: 135,          // ASSUMED £/m³, poured and finished
    rebarKgPerM3: 60, rebarCostPerKg: 1.05,   // ASSUMED
    foundationHrsPerM3: 4.2,         // ASSUMED: form, pour, strip, finish
    concreteCureDaysMin: 4,          // NOT reducible by adding crew — concrete cures on its own clock

    // -- structure: blockwork inner leaf + timber roof/floor structure --
    blockworkCostPerM2: 40,          // ASSUMED £/m² of inner blockwork leaf, supply + lay
    blockworkHrsPerM2: 0.9,          // ASSUMED
    timberM3PerSqm: 0.028,           // ASSUMED m³ of structural timber (roof trusses + floor joists) per m² floor area
    timberCostPerM3: 520,            // ASSUMED £/m³ structural softwood
    timberHrsPerM3: 14,              // ASSUMED

    // -- roofing (concrete / clay / slate, by finish level) --
    roofTileCostPerM2: [18, 34, 78], // ASSUMED £/m²: concrete interlocking / clay plain tile / natural slate
    roofingHrsPerM2: 0.34,           // ASSUMED

    // -- windows & doors (uPVC double glazing) --
    windowCost: 480, extDoorCost: 1050,   // ASSUMED, before finish multiplier
    openingHrsEach: 2.4,             // ASSUMED

    // -- electrical first fix --
    sqmPerCircuit: 28,               // ASSUMED
    wireMPerSqm: 3.8, wireCostPerM: 1.3,      // ASSUMED
    consumerUnitCost: 400,           // ASSUMED: consumer unit + tails
    electricalHrsPerSqm: 0.48,       // ASSUMED

    // -- plumbing first fix --
    pipeMPerSqm: 1.6, pipeCostPerM: 4.2,      // ASSUMED: hot/cold water + heating pipework
    fixtureStubCost: 300,            // ASSUMED, per bathroom's worth of rough plumbing
    plumbingHrsPerSqm: 0.54,         // ASSUMED

    // -- heating first fix: gas combi boiler + radiators, not ducted air --
    kwPer100Sqm: 12,                 // ASSUMED: rough boiler sizing off heat loss
    boilerCost: 1800,                // ASSUMED: combi boiler unit + first-fix install
    heatingHrsPerSqm: 0.38,          // ASSUMED

    inspectionWaitDays: 2,           // NOT reducible by crew size — the inspector's calendar, not the builder's
    reworkCostFlat: 2100, reworkDays: 3,      // ASSUMED cost/time of a failed rough-in inspection

    // -- insulation: PIR board (Kingspan-style) in the cavity and roof --
    insulationCostPerSqm: 20,        // ASSUMED, rigid PIR board average
    insulationHrsPerSqm: 0.15,       // ASSUMED

    // -- plasterboard & skim --
    boardSqm: 2.88,                  // a 2400 x 1200mm plasterboard sheet
    drywallSheetCost: 30,            // ASSUMED, material + hang + tape + skim, installed
    drywallHrsPerSheet: 0.58,        // ASSUMED

    // -- exterior finishes: brickwork outer leaf + driveway --
    brickworkCostPerSqm: [70, 95, 140],   // ASSUMED, by finish level: standard facing brick / multi facing brick / stone-faced or reclaimed
    brickworkHrsPerSqm: 0.34,        // ASSUMED
    windowOpeningSqm: 1.4, doorOpeningSqm: 2.0,   // ASSUMED, deducted from brickwork area
    drivewayCostPerSqm: 90,          // ASSUMED, block paving

    // -- interior finishes --
    flooringCostPerSqm: [38, 68, 130],            // ASSUMED, by finish level
    paintCostPerLitre: 14, paintSqmPerLitre: 8.6,  // ASSUMED
    trimMPerSqm: 1.8, trimCostPerM: 5,     // ASSUMED: skirting + architrave
    cabinetCost: [7000, 13000, 24000],            // ASSUMED, by finish level
    interiorHrsPerSqm: 0.97,         // ASSUMED

    // -- fixtures & second fix --
    bathFixtureCost: 2000,           // ASSUMED, per bathroom
    kitchenApplianceCost: [3600, 6200, 11000],    // ASSUMED, by finish level
    socketsPerSqm: 0.09, socketCost: 50,          // ASSUMED
    sqmPerRadiator: 18, radiatorCost: 140,        // ASSUMED
    fixtureHrsPerSqm: 0.32,          // ASSUMED
    finalInspectionWaitDays: 2,      // NOT reducible by crew size

    // -- garden & landscaping --
    landscapeCostPerSqm: 20,         // ASSUMED, turf + planting
    landscapePackage: 2500,          // ASSUMED, trees, beds, mulch
    landscapeHrsPer100Sqm: 9.7,      // ASSUMED

    // -- planning & building control --
    permitFeeBase: 1600, permitFeePerSqm: 8, surveyFee: 850,  // ASSUMED
    permitWaitDays: 56               // NOT reducible by crew size — 8 weeks, the local authority's statutory determination period
  };

  /* One crew works one phase at a time; man-hours divided by the crew tells
     you how many calendar days that takes. A few phases (concrete curing,
     planning review, inspections) run on a clock nobody's crew controls, so
     `minDays` puts a floor under the crew's answer — the model's one clear
     demonstration that more workers buys speed only where the constraint is
     labour, not time itself. */
  function crewDays(laborHrs, crew, minDays) {
    var byCrew = laborHrs / (Math.max(2, crew) * 8);
    return Math.max(minDays || 0, byCrew);
  }

  /* p = { floorAreaSqm, finishLevel (0/1/2), crewSize, regionIndex (0/1/2) }
   * Returns one phase per construction step, in build order, plus totals. */
  function compute(p) {
    var region = REG.regionMultiplier[p.regionIndex];
    var finishMult = REG.finishMultiplier[p.finishLevel];
    var floorArea = p.floorAreaSqm;
    var crew = p.crewSize;

    /* ---- the house's actual geometry, derived once, used everywhere ---- */
    var footprint = floorArea / REG.storeys + REG.garageSqm;
    var width = Math.sqrt(footprint / REG.aspectRatio);
    var length = footprint / width;
    var perimeter = 2 * (length + width);
    var exteriorWallArea = perimeter * REG.wallHeightM * REG.storeys;  // one wall area, shared by the blockwork inner leaf and the brick outer leaf
    var pitchFactor = 1 / Math.cos(REG.roofPitchDeg * Math.PI / 180);
    var roofArea = footprint * pitchFactor;
    var interiorPartitionArea = floorArea * 0.9;            // ASSUMED: sqm of partition wall per sqm of floor
    var ceilingArea = floorArea;                              // one ceiling per storey, sums to floor area
    var envelopeArea = exteriorWallArea + roofArea;           // what the PIR insulation actually wraps
    var paintedArea = exteriorWallArea + interiorPartitionArea * 2 + ceilingArea;
    var openingCount = Math.round(floorArea / REG.openingSqmPerWindow);
    var windowCount = Math.max(0, openingCount - REG.extDoorCount);
    var boilerKw = floorArea / 100 * REG.kwPer100Sqm;
    var radiatorCount = Math.round(floorArea / REG.sqmPerRadiator);

    var phases = [];
    var totalCost = 0, totalHrs = 0, totalDays = 0;

    function phase(o) {
      var laborCost = o.laborHrs * REG.laborRatePerHr * region;
      var cost = o.materialCost + laborCost;
      totalCost += cost;
      totalHrs += o.laborHrs;
      totalDays += o.days;
      phases.push({
        id: o.id, label: o.label, qtyLabel: o.qtyLabel,
        materialCost: o.materialCost, laborCost: laborCost, cost: cost,
        laborHrs: o.laborHrs, days: o.days, note: o.note
      });
      return cost;
    }

    /* -- 1. Site Office: nothing is built here, the clock just runs -- */
    phase({
      id: 'permits', label: 'Planning & building control',
      qtyLabel: 'planning application + building regs review + site survey',
      materialCost: (REG.permitFeeBase + REG.permitFeePerSqm * floorArea + REG.surveyFee) * region,
      laborHrs: 0,
      days: REG.permitWaitDays,
      note: 'the local authority’s calendar, not the builder’s — 8 weeks is the statutory determination period'
    });

    /* -- 2. Excavation -- */
    var cutM3 = footprint * REG.excavationCutM;
    var excHrs = cutM3 / REG.excavationM3PerManHour;
    phase({
      id: 'excavation', label: 'Excavation & groundworks',
      qtyLabel: Math.round(cutM3) + ' m³ of earth cut',
      materialCost: cutM3 * REG.excavationCostPerM3 * region,
      laborHrs: excHrs,
      days: crewDays(excHrs, crew, 0),
      note: cutM3.toFixed(0) + ' cubic metres moved off a ' + Math.round(footprint) + ' sqm footprint'
    });

    /* -- 3. Foundation -- */
    var footingM3 = perimeter * REG.footingWidthM * REG.footingDepthM;
    var slabM3 = footprint * REG.slabThicknessM;
    var concreteM3 = footingM3 + slabM3;
    var rebarKg = concreteM3 * REG.rebarKgPerM3;
    var foundationHrs = concreteM3 * REG.foundationHrsPerM3;
    phase({
      id: 'foundation', label: 'Foundation',
      qtyLabel: concreteM3.toFixed(1) + ' m³ concrete, ' + Math.round(rebarKg) + ' kg rebar',
      materialCost: concreteM3 * REG.concreteCostPerM3 * region + rebarKg * REG.rebarCostPerKg * region,
      laborHrs: foundationHrs,
      days: crewDays(foundationHrs, crew, REG.concreteCureDaysMin),
      note: 'floored at ' + REG.concreteCureDaysMin + ' days no matter the crew — concrete cures on its own clock'
    });

    /* -- 4. Structure: blockwork inner leaf + timber roof & floor frame -- */
    var timberM3 = floorArea * REG.timberM3PerSqm;
    var framingHrs = exteriorWallArea * REG.blockworkHrsPerM2 + timberM3 * REG.timberHrsPerM3;
    phase({
      id: 'framing', label: 'Blockwork & roof frame',
      qtyLabel: Math.round(exteriorWallArea) + ' m² blockwork, ' + timberM3.toFixed(1) + ' m³ structural timber',
      materialCost: exteriorWallArea * REG.blockworkCostPerM2 * region + timberM3 * REG.timberCostPerM3 * region,
      laborHrs: framingHrs,
      days: crewDays(framingHrs, crew, 0),
      note: 'the ' + length.toFixed(1) + '×' + width.toFixed(1) + ' m footprint, built ' + REG.storeys + ' storeys tall — the inner leaf of the cavity wall, plus the trusses and joists the brick outer leaf will go up against later'
    });

    /* -- 5. Roofing -- */
    var roofingHrs = roofArea * REG.roofingHrsPerM2;
    phase({
      id: 'roofing', label: 'Roofing',
      qtyLabel: roofArea.toFixed(0) + ' m² of tiled roof',
      materialCost: roofArea * REG.roofTileCostPerM2[p.finishLevel] * region,
      laborHrs: roofingHrs,
      days: crewDays(roofingHrs, crew, 0),
      note: roofArea.toFixed(0) + ' sqm of deck at a ' + REG.roofPitchDeg + '° pitch (×' + pitchFactor.toFixed(2) + ' over the footprint)'
    });

    /* -- 6. Openings -- */
    var openingHrs = openingCount * REG.openingHrsEach;
    phase({
      id: 'openings', label: 'Windows & doors',
      qtyLabel: windowCount + ' windows, ' + REG.extDoorCount + ' exterior doors',
      materialCost: windowCount * REG.windowCost * finishMult * region + REG.extDoorCount * REG.extDoorCost * finishMult * region,
      laborHrs: openingHrs,
      days: crewDays(openingHrs, crew, 0),
      note: 'one opening per ' + REG.openingSqmPerWindow + ' sqm of floor area'
    });

    /* -- 7. Utilities first fix: electrics, plumbing, heating — one station -- */
    var wireM = floorArea * REG.wireMPerSqm;
    var circuits = Math.round(floorArea / REG.sqmPerCircuit);
    var electricalHrs = floorArea * REG.electricalHrsPerSqm;
    var electricalMaterial = wireM * REG.wireCostPerM * region + REG.consumerUnitCost * region;

    var pipeM = floorArea * REG.pipeMPerSqm;
    var plumbingHrs = floorArea * REG.plumbingHrsPerSqm;
    var plumbingMaterial = pipeM * REG.pipeCostPerM * region + REG.bathCount * REG.fixtureStubCost * region;

    var heatingHrs = floorArea * REG.heatingHrsPerSqm;
    var heatingMaterial = REG.boilerCost * region;

    var utilHrs = electricalHrs + plumbingHrs + heatingHrs;
    phase({
      id: 'utilities', label: 'Utilities first fix',
      qtyLabel: Math.round(wireM) + ' m wire, ' + Math.round(pipeM) + ' m pipe, ' + boilerKw.toFixed(0) + ' kW boiler',
      materialCost: electricalMaterial + plumbingMaterial + heatingMaterial,
      laborHrs: utilHrs,
      days: crewDays(utilHrs, crew, 0),
      note: circuits + ' circuits, ' + REG.bathCount + ' bathrooms’ worth of drain stubs, a ' + boilerKw.toFixed(0) + ' kW combi boiler sized off the floor area'
    });

    /* -- 8. Rough-in inspection: the one branch in the whole build --
       A deterministic, not random, pass/fail: a crew of fewer than 4 people
       finishing a basic-spec job is the one combination this model treats
       as rushed enough to fail. Every other combination passes clean. Drag
       Crew size up past 4 and the fail line disappears from the road. */
    var failed = crew < 4 && p.finishLevel === 0;
    phase({
      id: 'inspection', label: 'Building control inspection',
      qtyLabel: failed ? 'failed — rework required' : 'passed',
      materialCost: failed ? REG.reworkCostFlat * region : 0,
      laborHrs: 0,
      days: REG.inspectionWaitDays + (failed ? REG.reworkDays : 0),
      note: failed
        ? 'a ' + crew + '-person crew on a basic-spec job: rushed enough to get red-tagged'
        : 'wiring, pipe and boiler pipework checked before anything closes over them'
    });

    /* -- 9. Insulation -- */
    var insulationHrs = envelopeArea * REG.insulationHrsPerSqm;
    phase({
      id: 'insulation', label: 'Insulation',
      qtyLabel: Math.round(envelopeArea) + ' m² of envelope',
      materialCost: envelopeArea * REG.insulationCostPerSqm * finishMult * region,
      laborHrs: insulationHrs,
      days: crewDays(insulationHrs, crew, 0),
      note: 'rigid PIR board — the sort of thing Kingspan makes — packed into the cavity and the roof before it is sealed shut'
    });

    /* -- 10. Plasterboard & skim -- */
    var drywallSheets = Math.ceil(paintedArea / REG.boardSqm);
    var drywallHrs = drywallSheets * REG.drywallHrsPerSheet;
    phase({
      id: 'drywall', label: 'Plasterboard & skim',
      qtyLabel: drywallSheets + ' sheets',
      materialCost: drywallSheets * REG.drywallSheetCost * region,
      laborHrs: drywallHrs,
      days: crewDays(drywallHrs, crew, 0),
      note: Math.round(paintedArea) + ' sqm of wall and ceiling, hung and skimmed in one continuous push'
    });

    /* -- 11. Exterior finishes: brickwork outer leaf + driveway -- */
    var openingDeduction = windowCount * REG.windowOpeningSqm + REG.extDoorCount * REG.doorOpeningSqm;
    var brickArea = Math.max(0, exteriorWallArea - openingDeduction);
    var brickHrs = brickArea * REG.brickworkHrsPerSqm;
    phase({
      id: 'exterior', label: 'Brickwork & driveway',
      qtyLabel: Math.round(brickArea) + ' m² brickwork, ' + REG.drivewaySqm + ' m² driveway',
      materialCost: brickArea * REG.brickworkCostPerSqm[p.finishLevel] * region
        + REG.drivewaySqm * REG.drivewayCostPerSqm * region,
      laborHrs: brickHrs,
      days: crewDays(brickHrs, crew, 0),
      note: 'the outer leaf of the cavity wall, less ' + windowCount + ' window and ' + REG.extDoorCount + ' door openings'
    });

    /* -- 12. Interior finishes -- */
    var litres = Math.ceil(paintedArea / REG.paintSqmPerLitre);
    var trimM = floorArea * REG.trimMPerSqm;
    var interiorHrs = floorArea * REG.interiorHrsPerSqm;
    var interiorMaterial = floorArea * REG.flooringCostPerSqm[p.finishLevel] * region
      + litres * REG.paintCostPerLitre * region
      + trimM * REG.trimCostPerM * region
      + REG.cabinetCost[p.finishLevel] * region;
    phase({
      id: 'interior', label: 'Interior finishes',
      qtyLabel: floorArea + ' sqm flooring, ' + litres + ' litres paint, ' + Math.round(trimM) + ' m trim',
      materialCost: interiorMaterial,
      laborHrs: interiorHrs,
      days: crewDays(interiorHrs, crew, 0),
      note: 'flooring and cabinets are where the finish-level slider is felt hardest'
    });

    /* -- 13. Fixtures & second fix -- */
    var sockets = Math.round(floorArea * REG.socketsPerSqm);
    var fixtureHrs = floorArea * REG.fixtureHrsPerSqm;
    var fixtureMaterial = REG.bathCount * REG.bathFixtureCost * region
      + REG.kitchenApplianceCost[p.finishLevel] * region
      + sockets * REG.socketCost * region
      + radiatorCount * REG.radiatorCost * region;
    phase({
      id: 'fixtures', label: 'Fixtures & second fix',
      qtyLabel: REG.bathCount + ' bathrooms, ' + sockets + ' sockets/switches, ' + radiatorCount + ' radiators connected',
      materialCost: fixtureMaterial,
      laborHrs: fixtureHrs,
      days: crewDays(fixtureHrs, crew, REG.finalInspectionWaitDays),
      note: 'the final building control sign-off and completion certificate happen here, on the inspector’s clock'
    });

    /* -- 14. Garden & landscaping -- */
    var landscapeArea = Math.max(0, REG.plotSqm - footprint - REG.drivewaySqm);
    var landscapeHrs = landscapeArea / 100 * REG.landscapeHrsPer100Sqm;
    phase({
      id: 'landscaping', label: 'Garden & landscaping',
      qtyLabel: Math.round(landscapeArea) + ' sqm turf & beds',
      materialCost: landscapeArea * REG.landscapeCostPerSqm * region + REG.landscapePackage * region,
      laborHrs: landscapeHrs,
      days: crewDays(landscapeHrs, crew, 0),
      note: (REG.plotSqm).toLocaleString() + ' sqm plot, less the house and the driveway'
    });

    return {
      phases: phases,
      floorArea: floorArea, footprint: footprint,
      length: length, width: width, perimeter: perimeter,
      roofArea: roofArea, exteriorWallArea: exteriorWallArea,
      bathCount: REG.bathCount, boilerKw: boilerKw, failed: failed,
      totalCost: totalCost,
      totalManHours: totalHrs,
      totalManDays: totalHrs / 8,
      totalCalendarDays: totalDays,
      costPerSqm: totalCost / floorArea
    };
  }

  function phaseOf(plan, id) {
    for (var i = 0; i < plan.phases.length; i++) {
      if (plan.phases[i].id === id) return plan.phases[i];
    }
    return null;
  }

  function fmtGBP(n) {
    if (Math.abs(n) >= 1000) return '£' + Math.round(n).toLocaleString('en-GB');
    return '£' + Math.round(n);
  }

  function fmtDays(d) {
    if (d < 1) return Math.round(d * 8) + ' hrs';
    return (Math.round(d * 10) / 10) + (d === 1 ? ' day' : ' days');
  }

  global.House = {
    REG: REG,
    compute: compute,
    phaseOf: phaseOf,
    fmtGBP: fmtGBP,
    fmtDays: fmtDays
  };
})(window);
