import { environmentAt, environmentConfig } from './environment.ts';
import type { Environment, EnvironmentConfig } from './environment.ts';

export interface Point { x: number; z: number }
export interface SimulationConfig {
  pond: Point & { radius: number; capacity: number; initialWater: number; accessible: boolean };
  home: Point;
  speed: number;
  thirstRate: number;
  seekThreshold: number;
  satisfiedThreshold: number;
  drinkRate: number;
  hydrationPerWater: number;
  environment: EnvironmentConfig;
  drinkingRange: number;
  edgeOffset: number;
  retrySeconds: number;
}
export type Behaviour = 'Resting' | 'Seeking water' | 'Drinking' | 'Waiting for water' | 'Returning';
export interface Simulation {
  animal: Point & { thirst: number; behaviour: Behaviour };
  water: number;
  environment: Environment;
  time: number;
  cycles: number;
  retryAt: number;
  edge: Point;
}
export const simulationConfig: SimulationConfig = {
  pond: { x: 3, z: 1, radius: 3.1, capacity: 100, initialWater: 0, accessible: true },
  home: { x: -7, z: -4 }, speed: 2.4, thirstRate: 3,
  seekThreshold: 60, satisfiedThreshold: 10,
  drinkRate: 12, hydrationPerWater: 4, environment: environmentConfig,
  drinkingRange: 0.85, edgeOffset: 0.75, retrySeconds: 1,
};
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export function createSimulation(c: SimulationConfig): Simulation {
  const dx = c.home.x - c.pond.x;
  const dz = c.home.z - c.pond.z;
  const length = Math.hypot(dx, dz);
  const radius = c.pond.radius + c.edgeOffset;
  return {
    animal: { ...c.home, thirst: 55, behaviour: 'Resting' },
    water: Math.max(0, Math.min(c.pond.capacity, c.pond.initialWater)),
    environment: environmentAt(0, c.environment),
    time: 0, cycles: 0, retryAt: 0,
    edge: { x: c.pond.x + (length ? dx / length : -1) * radius,
      z: c.pond.z + (length ? dz / length : 0) * radius },
  };
}
export function moveTowards(position: Point, target: Point, amount: number) {
  const remaining = distance(position, target);
  if (remaining === 0 || amount <= 0) return;
  const fraction = Math.min(1, amount / remaining);
  position.x += (target.x - position.x) * fraction;
  position.z += (target.z - position.z) * fraction;
}
export function inDrinkingRange(s: Simulation, c: SimulationConfig) {
  const radius = distance(s.animal, c.pond);
  return c.pond.accessible && radius >= c.pond.radius && radius <= c.pond.radius + c.drinkingRange;
}
// Water units are separate from thirst points. Return the amount actually consumed.
export function drink(s: Simulation, c: SimulationConfig, requested: number) {
  if (!Number.isFinite(requested) || requested <= 0 || !inDrinkingRange(s, c)) return 0;
  const consumed = Math.min(requested, s.water,
    Math.max(0, s.animal.thirst - c.satisfiedThreshold) / c.hydrationPerWater);
  s.water = Math.max(0, s.water - consumed);
  s.animal.thirst = Math.max(0, s.animal.thirst - consumed * c.hydrationPerWater);
  return consumed;
}
export function stepSimulation(s: Simulation, c: SimulationConfig, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  s.time += dt;
  s.environment = environmentAt(s.time, c.environment);
  const weatherChange = (s.environment.rainfall - s.environment.evaporation) * dt;
  s.water = Math.max(0, Math.min(c.pond.capacity, s.water + weatherChange));
  const a = s.animal;
  a.thirst = Math.min(100, a.thirst + c.thirstRate * dt);
  if (a.behaviour === 'Returning') {
    moveTowards(a, c.home, c.speed * dt);
    if (distance(a, c.home) < 1e-8) a.behaviour = 'Resting';
    return;
  }
  if (a.behaviour === 'Resting') {
    if (a.thirst >= c.seekThreshold) a.behaviour = 'Seeking water';
    else return;
  }
  if (a.behaviour === 'Waiting for water') {
    if (s.time < s.retryAt) return;
    s.retryAt = s.time + c.retrySeconds;
    if (!c.pond.accessible || s.water < Math.min(5, c.pond.capacity)) return;
    a.behaviour = 'Seeking water';
  }
  if (!c.pond.accessible) {
    a.behaviour = 'Waiting for water';
    s.retryAt = s.time + c.retrySeconds;
    return;
  }
  if (a.behaviour === 'Seeking water') {
    moveTowards(a, s.edge, c.speed * dt);
    if (distance(a, s.edge) > 1e-8) return;
    a.behaviour = 'Drinking';
    return; // Arrival and drinking happen in separate ticks.
  }
  if (!inDrinkingRange(s, c)) {
    a.behaviour = 'Seeking water';
    return;
  }
  drink(s, c, c.drinkRate * dt);
  if (a.thirst <= c.satisfiedThreshold + 1e-8) {
    a.behaviour = 'Returning';
    s.cycles += 1;
  } else if (s.water < 1e-8) {
    a.behaviour = 'Waiting for water';
    s.retryAt = s.time + c.retrySeconds;
  }
}

// Hidden tabs pause. Discard elapsed time beyond 250 ms instead of catching up indefinitely.
export function createSimulationClock(update: (dt: number) => void) {
  const step = 1 / 60;
  let accumulator = 0;
  return (elapsed: number) => {
    if (!Number.isFinite(elapsed) || elapsed <= 0) return;
    accumulator += Math.min(elapsed, 0.25);
    while (accumulator + 1e-10 >= step) {
      update(step);
      accumulator = Math.max(0, accumulator - step);
    }
  };
}
