import { shadeAreas } from './habitat.ts';
import type { ShadeArea } from './habitat.ts';
import { environmentAt, environmentConfig } from './environment.ts';
import type { Environment, EnvironmentConfig } from './environment.ts';

export interface Point { x: number; z: number }
export interface SimulationConfig {
  pond: Point & { radius: number; capacity: number; initialWater: number; accessible: boolean };
  home: Point;
  shades: ShadeArea[];
  heat: { seek: number; comfortable: number; gain: number; cooling: number; urgentThirst: number };
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
export type Behaviour = 'Resting' | 'Seeking water' | 'Drinking' | 'Waiting for water' | 'Returning' | 'Seeking shade' | 'Cooling in shade';
export interface Simulation {
  animal: Point & { thirst: number; heat: number; behaviour: Behaviour };
  water: number;
  environment: Environment;
  time: number;
  cycles: number;
  retryAt: number;
  edge: Point;
  shadeId: string | null;
  shadeRetryAt: number;
}
export const simulationConfig: SimulationConfig = {
  pond: { x: 3, z: 1, radius: 3.1, capacity: 100, initialWater: 0, accessible: true },
  shades: shadeAreas,
  heat: { seek: 60, comfortable: 25, gain: 4, cooling: 5, urgentThirst: 85 },
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
    animal: { ...c.home, thirst: 55, heat: 20, behaviour: 'Resting' },
    water: Math.max(0, Math.min(c.pond.capacity, c.pond.initialWater)),
    environment: environmentAt(0, c.environment),
    time: 0, cycles: 0, retryAt: 0, shadeId: null, shadeRetryAt: 0,
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

export function isShaded(position: Point, c: SimulationConfig) {
  return c.shades.some(shade => distance(position, shade) <= shade.radius);
}
function segmentDistance(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((point.x-a.x)*dx + (point.z-a.z)*dz) / length)) : 0;
  return distance(point, { x: a.x + t * dx, z: a.z + t * dz });
}
export function clearRoute(a: Point, b: Point, c: SimulationConfig) {
  return segmentDistance(c.pond, a, b) >= c.pond.radius + 0.4 &&
    c.shades.every(tree => segmentDistance(tree, a, b) >= 0.65);
}
export const shadeSpot = (shade: ShadeArea): Point => ({ x: shade.x - shade.radius * 0.65, z: shade.z });
function chooseShade(s: Simulation, c: SimulationConfig) {
  return c.shades.filter(shade => {
    const spot = shadeSpot(shade);
    return shade.accessible && clearRoute(s.animal, spot, c) &&
      clearRoute(spot, s.edge, c) && clearRoute(spot, c.home, c);
  }).sort((a,b) => distance(s.animal, shadeSpot(a)) - distance(s.animal, shadeSpot(b)))[0];
}

export function stepSimulation(s: Simulation, c: SimulationConfig, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  s.time += dt;
  s.environment = environmentAt(s.time, c.environment);
  const weatherChange = (s.environment.rainfall - s.environment.evaporation) * dt;
  s.water = Math.max(0, Math.min(c.pond.capacity, s.water + weatherChange));
  const a = s.animal;
  a.thirst = Math.min(100, a.thirst + c.thirstRate * dt);
  const shaded = isShaded(a, c);
  const exposure = Math.max(0, (s.environment.temperature - 24) / 11) *
    s.environment.daylight * (1 - s.environment.rain);
  const heatChange = shaded ? -c.heat.cooling : exposure * c.heat.gain - (1-exposure) * 1.5;
  a.heat = Math.max(0, Math.min(100, a.heat + heatChange * dt));
  const wantsWater = a.thirst >= c.seekThreshold && c.pond.accessible && s.water >= 5;
  const urgentWater = a.thirst >= c.heat.urgentThirst && wantsWater;
  const shadeBehaviour = a.behaviour === 'Seeking shade' || a.behaviour === 'Cooling in shade';
  if (shadeBehaviour && urgentWater) {
    a.behaviour = 'Seeking water';
    s.shadeId = null;
  } else if (shadeBehaviour) {
    const shade = c.shades.find(item => item.id === s.shadeId && item.accessible);
    if (!shade || a.heat <= c.heat.comfortable || s.environment.rain > 0.1 || exposure <= 0) {
      s.shadeId = null;
      a.behaviour = wantsWater ? 'Seeking water' : 'Returning';
    } else {
      const spot = shadeSpot(shade);
      if (!clearRoute(a, spot, c)) {
        a.behaviour = 'Resting'; s.shadeId = null; s.shadeRetryAt = s.time + c.retrySeconds;
      } else {
        moveTowards(a, spot, c.speed * dt);
        a.behaviour = distance(a, spot) < 1e-8 ? 'Cooling in shade' : 'Seeking shade';
        return;
      }
    }
  }
  if (a.heat >= c.heat.seek && exposure > 0 && s.environment.rain <= 0.1 &&
      !urgentWater && a.behaviour !== 'Drinking' && s.time >= s.shadeRetryAt) {
    s.shadeRetryAt = s.time + c.retrySeconds;
    const shade = chooseShade(s, c);
    if (shade) { s.shadeId = shade.id; a.behaviour = 'Seeking shade'; return; }
  }
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
