import test from 'node:test';
import assert from 'node:assert/strict';
import { clearTemperature, environmentAt, environmentConfig as e } from '../src/environment.ts';
import { createSimulation, simulationConfig as defaults, stepSimulation } from '../src/simulation.ts';
const c = { ...defaults, thirstRate: 3, drinkRate: 12, heat: { ...defaults.heat, gain: 4, cooling: 5 }, sleep: { ...defaults.sleep, startHour: 24, endHour: 0 }, roaming: false, ponds: [{ ...defaults.ponds[0], radius: 3.1, capacity: 100, initialWater: 0 }] };
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('temperature trough is 02:30, peak is 14:00, continuous at midnight', () => {
  near(clearTemperature(2.5, e), e.minimumTemperature);
  near(clearTemperature(14, e), e.maximumTemperature);
  for (let hour = 0; hour < 24; hour += 0.01) {
    assert.ok(clearTemperature(hour, e) >= e.minimumTemperature);
    assert.ok(clearTemperature(hour, e) <= e.maximumTemperature);
  }
  assert.ok(clearTemperature(2.4,e) > clearTemperature(2.5,e));
  assert.ok(clearTemperature(2.6,e) > clearTemperature(2.5,e));
  assert.ok(clearTemperature(13.9,e) < clearTemperature(14,e));
  assert.ok(clearTemperature(14.1,e) < clearTemperature(14,e));
  near(clearTemperature(0, e), clearTemperature(24, e));
});
test('clock wraps through midnight and a five-minute day; nights have no sunlight', () => {
  near(environmentAt(300, e).hour, 8);
  assert.equal(environmentAt(300, e).day, 2);
  near(environmentAt(200, e).hour, 0);
  assert.equal(environmentAt(200, e).day, 2);
  for (const hour of [0, 2.5, 6, 18, 23]) {
    assert.ok(environmentAt(0, { ...e, startHour: hour }).daylight < 1e-8);
  }
});
test('rain ramps in and out, cools the baseline and repeats without discontinuity', () => {
  assert.equal(environmentAt(80, e).rain, 0);
  near(environmentAt(82.5, e).rain, 0.5);
  assert.equal(environmentAt(85, e).rain, 1);
  near(environmentAt(117.5, e).rain, 0.5);
  assert.equal(environmentAt(120, e).rain, 0);
  near(environmentAt(202.5, e).rain, 0.5);
  const rainy = environmentAt(85, e);
  near(rainy.temperature, clearTemperature(rainy.hour, e) - e.rainCooling);
});
test('evaporation is slow, peaks at 14:00 and stops at night and in rain', () => {
  for (const hour of [0, 10, 11, 17, 20]) assert.equal(environmentAt(0, {...e, startHour:hour}).evaporation, 0);
  near(environmentAt(0, { ...e, startHour:14 }).evaporation, 0.06);
  const wet = environmentAt(1, { ...e, startHour:14, clearSeconds:0, transitionSeconds:0 });
  assert.equal(wet.evaporation, 0);
  assert.equal(wet.rainfall, 4);
});
test('weather water balance is independent of drinking and capped at both ends', () => {
  const dry = { ...c, thirstRate: 0, ponds: [{ ...c.ponds[0], initialWater: 50 }],
    environment: { ...e, startHour: 14 } };
  const s = createSimulation(dry);
  stepSimulation(s, dry, 1/60);
  near(s.ponds[0].water, 50 - s.environment.evaporation / 60);
  s.ponds[0].water = 0; stepSimulation(s, dry, 1/60); assert.equal(s.ponds[0].water, 0);
  const wet = { ...dry, environment: { ...e, clearSeconds: 0, transitionSeconds: 0 } };
  stepSimulation(s, wet, 1/60); near(s.ponds[0].water, 4/60);
  s.ponds[0].water = 99.99; stepSimulation(s, wet, 1/60); assert.equal(s.ponds[0].water, 100);
});
test('six simulated days preserve bounds and recover from dry spells', () => {
  const s = createSimulation(c); let waited = false; let resumed = false;
  for (let i = 0; i < 60 * 1800; i++) {
    stepSimulation(s, c, 1/60);
    if (s.animal.behaviour === 'Waiting for water') waited = true;
    if (waited && s.cycles > 0) resumed = true;
    assert.ok(s.ponds[0].water >= 0 && s.ponds[0].water <= 100);
    assert.ok(s.animal.thirst >= 0 && s.animal.thirst <= 100);
    assert.ok(s.environment.temperature >= e.minimumTemperature - e.rainCooling);
    assert.ok(s.environment.temperature <= e.maximumTemperature);
  }
  assert.ok(waited && resumed);
  assert.ok(s.cycles > 20);
});
