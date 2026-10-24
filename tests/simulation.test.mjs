import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, createSimulationClock, simulationConfig as defaults, stepSimulation, drink, moveTowards, distance } from '../src/simulation.ts';
const c = { ...defaults, thirstRate: 3, drinkRate: 12, heat: { ...defaults.heat, gain: 4, cooling: 5 }, sleep: { ...defaults.sleep, startHour: 24, endHour: 0 }, roaming: false, ponds: [{ ...defaults.ponds[0], radius: 3.1, capacity: 100, initialWater: 0 }] };

test('movement clamps arrival at different speeds and step sizes', () => {
  for (const speed of [0.1, 2.4, 100]) for (const dt of [1/120, 1/30, 1]) {
    const p = { x: 0, z: 0 }, target = { x: 1, z: 1 };
    for (let i = 0; i < 2000; i++) moveTowards(p, target, speed * dt);
    assert.ok(distance(p, target) < 1e-8);
  }
});
test('drinking checks range, accessibility, requests and actual available stock', () => {
  const s = createSimulation(c); s.ponds[0].water = 10;
  assert.equal(drink(s, c, 10), 0);
  Object.assign(s.animal, { x: c.ponds[0].x + c.ponds[0].radius + c.drinkingRange + 0.001, z: c.ponds[0].z });
  assert.equal(drink(s, c, 10), 0);
  s.animal.x -= 0.002;
  assert.equal(drink(s, { ...c, ponds: [{ ...c.ponds[0], accessible: false }] }, 10), 0);
  for (const n of [-1, 0, NaN, Infinity]) assert.equal(drink(s, c, n), 0);
  assert.equal(drink(s, c, 20), 10);
  assert.equal(s.ponds[0].water, 0); assert.equal(s.animal.thirst, 15);
  assert.equal(drink(s, c, 10), 0);
  s.ponds[0].water = 100;
  assert.equal(drink(s, c, 100), 1.25);
  assert.equal(s.animal.thirst, 10);
  s.animal.x = c.ponds[0].x;
  assert.equal(drink(s, c, 10), 0);
});
test('empty pond recovers and at least three autonomous cycles complete within bounds', () => {
  const s = createSimulation(c);
  const seen = new Set();
  for (let i = 0; i < 60 * 180; i++) {
    stepSimulation(s, c, 1/60); seen.add(s.animal.behaviour);
    assert.ok(s.ponds[0].water >= 0 && s.ponds[0].water <= c.ponds[0].capacity);
    assert.ok(s.animal.thirst >= 0 && s.animal.thirst <= 100);
    assert.ok(distance(s.animal, c.ponds[0]) >= c.ponds[0].radius);
  }
  assert.ok(s.cycles >= 3, `Only ${s.cycles} cycles`);
  assert.ok(seen.has('Waiting for water'));
  assert.ok(seen.has('Drinking')); assert.ok(seen.has('Returning'));
});
test('unavailable water waits safely; restoring accessibility recovers', () => {
  const blocked = { ...c, ponds: [{ ...c.ponds[0], accessible: false }], environment: { ...c.environment, rainfallRate: 0 } };
  const s = createSimulation(blocked);
  for (let i = 0; i < 6000; i++) stepSimulation(s, blocked, 1/60);
  assert.equal(s.animal.behaviour, 'Waiting for water');
  assert.equal(s.ponds[0].water, 0); assert.equal(s.animal.thirst, 100);
  assert.equal(distance(s.animal, c.home), 0);
  for (let i = 0; i < 6000; i++) stepSimulation(s, c, 1/60);
  assert.ok(s.cycles > 0);
});
test('fixed clock matches across render schedules and caps long gaps', () => {
  const run = hz => {
    const s = createSimulation(c);
    const clock = createSimulationClock(dt => stepSimulation(s, c, dt));
    for (let i = 0; i < hz * 120; i++) clock(1/hz);
    return s;
  };
  assert.deepEqual(run(30), run(144));
  let elapsed = 0;
  const clock = createSimulationClock(dt => elapsed += dt);
  clock(3600); clock(-1); clock(NaN);
  assert.ok(Math.abs(elapsed - 0.25) < 1e-8);
});
test('refill caps at capacity and non-positive time does nothing', () => {
  const s = createSimulation(c);
  const before = structuredClone(s);
  stepSimulation(s, c, 0); stepSimulation(s, c, -1);
  assert.deepEqual(s, before);
  const resting = { ...c, thirstRate: 0, environment: { ...c.environment, clearSeconds: 0, rainSeconds: 10000, transitionSeconds: 0 } };
  for (let i=0; i<10000; i++) stepSimulation(s, resting, 1/60);
  assert.equal(s.ponds[0].water, c.ponds[0].capacity);
});
