import test from 'node:test';
import assert from 'node:assert/strict';
import { simulationConfig as c, createSimulation, stepSimulation, planRoute, clearRoute, insideGround, findWater, distance } from '../src/simulation.ts';

test('all corners of the expanded ground have safe routes to water', () => {
  for (const x of [-118, 118]) for (const z of [-118, 118]) {
    const s = createSimulation(c); Object.assign(s.animal, { x, z });
    const choice = findWater(s, c); assert.ok(choice);
    let previous = s.animal;
    for (const point of choice.route) {
      assert.ok(insideGround(point, c)); assert.ok(clearRoute(previous, point, c)); previous = point;
    }
  }
});
test('blocked straight paths detour around a pond and reject off-ground destinations', () => {
  const start = { x: -8, z: 1 }, end = { x: 14, z: 1 };
  assert.equal(clearRoute(start, end, c), false);
  const route = planRoute(start, end, c); assert.ok(route.length > 1);
  let previous = start;
  for (const point of route) { assert.ok(clearRoute(previous, point, c)); previous = point; }
  assert.equal(distance(previous, end), 0);
  assert.equal(planRoute(start, { x: 121, z: 0 }, c), undefined);
});
test('short roaming run leaves the original square and thirst interrupts exploration', () => {
  const config = { ...c, thirstRate: 0, heat: { ...c.heat, seek: 101 } };
  const s = createSimulation(config); s.animal.thirst = 10;
  for (let i = 0; i < 60 * 20; i++) {
    const previous = { ...s.animal }; stepSimulation(s, config, 1/60);
    assert.ok(insideGround(s.animal, config)); assert.ok(clearRoute(previous, s.animal, config));
  }
  assert.ok(Math.abs(s.animal.x) > 16 || Math.abs(s.animal.z) > 16);
  s.animal.thirst = 90; stepSimulation(s, config, 1/60);
  assert.equal(s.animal.behaviour, 'Seeking water');
  for (let i = 0; i < 60 * 35; i++) stepSimulation(s, config, 1/60);
  assert.ok(s.cycles > 0);
  assert.equal(s.animal.behaviour, 'Roaming');
});
