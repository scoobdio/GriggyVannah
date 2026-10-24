import { grassPatches, updateGrass } from './grass.ts';
import type { GrassPatch, GrassState } from './grass.ts';
import { pondConfigs, worldConfig } from './config.ts';
import type { PondConfig } from './config.ts';
import { shadeAreas } from './habitat.ts';
import type { ShadeArea } from './habitat.ts';
import { environmentAt, environmentConfig } from './environment.ts';
import type { Environment, EnvironmentConfig } from './environment.ts';

export interface Point { x: number; z: number }
export interface SimulationConfig {
  perception: { radius: number; memorySeconds: number; interval: number };
  ponds: PondConfig[];
  grass: GrassPatch[];
  hunger: { rate: number; seek: number; satisfied: number; eatRate: number; nutrition: number };
  sleep: { startHour: number; endHour: number; urgentNeed: number; needsMultiplier: number };
  home: Point;
  ground: { width: number; depth: number };
  roaming: boolean;
  shades: ShadeArea[];
  heat: { seek: number; comfortable: number; gain: number; peakMultiplier: number; cooling: number; urgentThirst: number };
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
export type Behaviour = 'Sleeping' | 'Seeking grass' | 'Grazing' | 'Waiting for grass' | 'Roaming' | 'Resting' | 'Seeking water' | 'Drinking' | 'Waiting for water' | 'Returning' | 'Seeking shade' | 'Cooling in shade';
export interface Simulation {
  waterMemory: Record<string, { seenAt:number; available:number }>;
  grassMemory: Record<string, { seenAt:number; available:number }>;
  shadeMemory: Record<string, number>;
  nextObservation: number;
  lastGroup: (Point & { seenAt:number }) | null;
  socialMode: 'With herd' | 'Exploring' | 'Rejoining' | 'Searching for herd';
  searchRoute: Point[];
  nightRecovery: boolean;
  id: number;
  roamTarget: Point | null;
  companions: Point[];
  animal: Point & { thirst: number; hunger: number; heat: number; behaviour: Behaviour };
  ponds: { water: number }[];
  grass: GrassState[];
  targetGrass: number;
  grassRetryAt: number;
  targetPond: number;
  waterRoute: Point[];
  travelRoute: Point[];
  roamSequence: number;
  environment: Environment;
  time: number;
  cycles: number;
  retryAt: number;
  edge: Point;
  shadeId: string | null;
  shadeRetryAt: number;
}
export const simulationConfig: SimulationConfig = {
  perception: { radius: 24, memorySeconds: 600, interval: 1 },
  ponds: pondConfigs,
  grass: grassPatches,
  hunger: { rate: 0.12, seek: 55, satisfied: 15, eatRate: 0.2, nutrition: 4 },
  sleep: { startHour: 22, endHour: 6, urgentNeed: 85, needsMultiplier: 0.2 },
  ground: worldConfig.grassland, roaming: true,
  shades: shadeAreas,
  heat: { seek: 60, comfortable: 25, gain: 1, peakMultiplier: 6, cooling: 1.5, urgentThirst: 85 },
  home: { x: -7, z: -4 }, speed: 2.4, thirstRate: 0.35,
  seekThreshold: 60, satisfiedThreshold: 10,
  drinkRate: 2, hydrationPerWater: 4, environment: environmentConfig,
  drinkingRange: 0.85, edgeOffset: 0.75, retrySeconds: 1,
};
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export function createSimulation(c: SimulationConfig): Simulation {
  const state: Simulation = {
    waterMemory: {}, grassMemory: {}, shadeMemory: {}, nextObservation: 0,
    lastGroup: null, socialMode: 'With herd', searchRoute: [],
    nightRecovery: false, id: 0, roamTarget: null, companions: [],
    animal: { ...c.home, thirst: 55, hunger: 40, heat: 20, behaviour: 'Resting' },
    ponds: c.ponds.map(p => ({ water: Math.max(0, Math.min(p.capacity, p.initialWater)) })),
    grass: c.grass.map(p => ({ food: p.capacity, moisture: 0.65 })),
    targetGrass: -1, grassRetryAt: 0,
    targetPond: 0, waterRoute: [], travelRoute: [], roamSequence: 0,
    environment: environmentAt(0, c.environment),
    time: 0, cycles: 0, retryAt: 0, shadeId: null, shadeRetryAt: 0,
    edge: { ...c.home },
  };
  observeResources(state,c);
  return state;
}
export function observeResources(s: Simulation,c: SimulationConfig) {
  c.ponds.forEach((p,i)=>{if(distance(s.animal,p)<=c.perception.radius)
    s.waterMemory[p.id]={seenAt:s.time,available:p.accessible?s.ponds[i].water:0};});
  c.grass.forEach((p,i)=>{if(distance(s.animal,p)<=c.perception.radius)
    s.grassMemory[p.id]={seenAt:s.time,available:p.accessible?s.grass[i].food:0};});
  c.shades.forEach(p=>{if(distance(s.animal,p)<=c.perception.radius) s.shadeMemory[p.id]=s.time;});
  for(const memory of [s.waterMemory,s.grassMemory]) for(const id of Object.keys(memory))
    if(s.time-memory[id].seenAt>c.perception.memorySeconds) delete memory[id];
  for(const id of Object.keys(s.shadeMemory)) if(s.time-s.shadeMemory[id]>c.perception.memorySeconds) delete s.shadeMemory[id];
  s.nextObservation=s.time+c.perception.interval;
}
function knownStock(s:Simulation,c:SimulationConfig,index:number,kind:'water'|'grass') {
  const p=kind==='water'?c.ponds[index]:c.grass[index];
  if(distance(s.animal,p)<=c.perception.radius)
    return p.accessible?(kind==='water'?s.ponds[index].water:s.grass[index].food):0;
  const memory=(kind==='water'?s.waterMemory:s.grassMemory)[p.id];
  return memory && s.time-memory.seenAt<=c.perception.memorySeconds?memory.available:0;
}
function crowdCost(s:Simulation,p:Point) {
  return s.companions.reduce((cost,other)=>cost+Math.max(0,2-distance(other,p))*8,0);
}
function searchLocally(s:Simulation,c:SimulationConfig,dt:number) {
  if(!s.searchRoute.length) {
    for(let attempt=0;attempt<12;attempt++) {
      const angle=++s.roamSequence*2.399963;
      const target={x:s.animal.x+Math.cos(angle)*12,z:s.animal.z+Math.sin(angle)*12};
      const route=planRoute(s.animal,target,c);
      if(route) {s.searchRoute=route;break;}
    }
  }
  followRoute(s,s.searchRoute,c,dt);
}

export function moveTowards(position: Point, target: Point, amount: number) {
  const remaining = distance(position, target);
  if (remaining === 0 || amount <= 0) return;
  const fraction = Math.min(1, amount / remaining);
  position.x += (target.x - position.x) * fraction;
  position.z += (target.z - position.z) * fraction;
}
export function inDrinkingRange(s: Simulation, c: SimulationConfig) {
  const pond = c.ponds[s.targetPond];
  if (!pond) return false;
  const radius = distance(s.animal, pond);
  return pond.accessible && radius >= pond.radius && radius <= pond.radius + c.drinkingRange;
}
// Water units are separate from thirst points. Return the amount actually consumed.
export function drink(s: Simulation, c: SimulationConfig, requested: number) {
  if (!Number.isFinite(requested) || requested <= 0 || !inDrinkingRange(s, c)) return 0;
  const consumed = Math.min(requested, s.ponds[s.targetPond].water,
    Math.max(0, s.animal.thirst - c.satisfiedThreshold) / c.hydrationPerWater);
  s.ponds[s.targetPond].water = Math.max(0, s.ponds[s.targetPond].water - consumed);
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
  return c.ponds.every(pond => segmentDistance(pond, a, b) >= pond.radius + 0.4) &&
    c.shades.every(tree => segmentDistance(tree, a, b) >= 0.65);
}
export const shadeSpot = (shade: ShadeArea): Point => ({ x: shade.x - shade.radius * 0.65, z: shade.z });
function restingSpot(shade: ShadeArea, id: number): Point {
  if (id === 0) return shadeSpot(shade);
  const angle = id * 2.399963;
  return {x:shade.x+Math.cos(angle)*shade.radius*0.65,z:shade.z+Math.sin(angle)*shade.radius*0.65};
}
export function insideGround(p: Point, c: SimulationConfig) {
  return Math.abs(p.x) <= c.ground.width / 2 - 1 && Math.abs(p.z) <= c.ground.depth / 2 - 1;
}
// A small visibility graph is built only when choosing a destination, never per frame.
// Expanded rings leave clearance even along chords between adjacent waypoints.
export function planRoute(start: Point, target: Point, c: SimulationConfig): Point[] | undefined {
  if (!insideGround(start, c) || !insideGround(target, c)) return;
  if (clearRoute(start, target, c)) return [{ ...target }];
  const nodes: Point[] = [start, target];
  const obstacles = [...c.ponds.map(p => ({ ...p, clearance: p.radius + 0.4 })),
    ...c.shades.map(p => ({ ...p, clearance: 0.65 }))];
  for (const o of obstacles) for (let i = 0; i < 12; i++) {
    const radius = (o.clearance + 0.1) / Math.cos(Math.PI / 12);
    const p = { x: o.x + Math.cos(i * Math.PI / 6) * radius,
      z: o.z + Math.sin(i * Math.PI / 6) * radius };
    if (insideGround(p, c) && clearRoute(p, p, c)) nodes.push(p);
  }
  const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1);
  const visited = new Set<number>(); costs[0] = 0;
  for (;;) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
    if (current < 0 || !Number.isFinite(costs[current])) return;
    if (current === 1) break;
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      const cost = costs[current] + distance(nodes[current], nodes[i]);
      if (!visited.has(i) && cost < costs[i] && clearRoute(nodes[current], nodes[i], c)) {
        costs[i] = cost; previous[i] = current;
      }
    }
  }
  const route: Point[] = [];
  for (let i = 1; i !== 0; i = previous[i]) route.unshift({ ...nodes[i] });
  return route;
}
function followRoute(s: Simulation, route: Point[], c: SimulationConfig, dt: number) {
  if (!route.length) return true;
  moveTowards(s.animal, route[0], c.speed * dt);
  if (distance(s.animal, route[0]) < 1e-8) route.shift();
  return route.length === 0;
}
function chooseShade(s: Simulation, c: SimulationConfig) {
  let best: { shade:ShadeArea; route:Point[]; score:number } | undefined;
  for (const shade of c.shades) {
    if (!shade.accessible || !(shade.id in s.shadeMemory)) continue;
    for(let i=0;i<12;i++) {
      const target=restingSpot(shade,s.id+i);
      const score=distance(s.animal,target)+crowdCost(s,target);
      if(best && score>=best.score) continue;
      const route=planRoute(s.animal,target,c);
      if(route) best={shade,route,score};
    }
  }
  if(best) {s.travelRoute=best.route;return best.shade;}
}
function beginRoaming(s: Simulation, c: SimulationConfig) {
  if (s.roamTarget) {
    const route = planRoute(s.animal,s.roamTarget,c);
    if (route) { s.travelRoute = route; s.animal.behaviour = 'Roaming'; return; }
  }
  // Deterministic low-discrepancy destinations span the whole ground, with no home tether.
  for (let attempt = 0; attempt < 12; attempt++) {
    const n = ++s.roamSequence;
    const target = { x: ((n * 0.61803398875) % 1 - 0.5) * (c.ground.width - 2),
      z: ((n * 0.41421356237) % 1 - 0.5) * (c.ground.depth - 2) };
    const route = planRoute(s.animal, target, c);
    if (route) { s.travelRoute = route; s.animal.behaviour = 'Roaming'; return; }
  }
  s.retryAt = s.time + c.retrySeconds;
}

// Check several bank points, keeping routes out of every pond and tree trunk.
export function findWater(s: Simulation, c: SimulationConfig) {
  let best: { index: number; edge: Point; route: Point[]; length: number } | undefined;
  c.ponds.forEach((pond, index) => {
    if (knownStock(s,c,index,'water') < 0.01) return;
    for (let i = 0; i < 24; i++) {
      const angle = i / 24 * Math.PI * 2;
      const edge = { x: pond.x + Math.cos(angle) * (pond.radius + c.edgeOffset),
        z: pond.z + Math.sin(angle) * (pond.radius + c.edgeOffset) };
      const route = planRoute(s.animal, edge, c);
      if (!route) continue;
      let length = 0, previous = s.animal as Point;
      for (const point of route) { length += distance(previous, point); previous = point; }
      length += s.companions.reduce((cost,p) => cost + Math.max(0,2-distance(p,edge))*5,0);
      if (!best || length < best.length) best = { index, edge, route, length };
    }
  });
  return best;
}
function selectWater(s: Simulation, c: SimulationConfig) {
  const choice = findWater(s, c);
  if (!choice) return false;
  s.targetPond = choice.index; s.edge = choice.edge; s.waterRoute = choice.route; s.searchRoute=[];
  return true;
}

export function graze(s: Simulation, c: SimulationConfig, requested: number) {
  const patch = c.grass[s.targetGrass], stock = s.grass[s.targetGrass];
  if (!patch?.accessible || !stock || !Number.isFinite(requested) || requested <= 0 ||
      distance(s.animal, patch) > patch.radius) return 0;
  const eaten = Math.min(requested, stock.food,
    Math.max(0, s.animal.hunger-c.hunger.satisfied)/c.hunger.nutrition);
  stock.food = Math.max(0, stock.food-eaten);
  s.animal.hunger = Math.max(0, s.animal.hunger-eaten*c.hunger.nutrition);
  return eaten;
}
function selectGrass(s: Simulation, c: SimulationConfig) {
  let best: {index:number;route:Point[];score:number} | undefined;
  c.grass.forEach((patch,index)=>{
    if(knownStock(s,c,index,'grass')<1) return;
    for(let i=0;i<12;i++) {
      const angle=(s.id+i)*2.399963;
      const target={x:patch.x+Math.cos(angle)*patch.radius*0.55,z:patch.z+Math.sin(angle)*patch.radius*0.55};
      const score=distance(s.animal,target)+crowdCost(s,target);
      if(best && score>=best.score) continue;
      const route=planRoute(s.animal,target,c);
      if(route) best={index,route,score};
    }
  });
  if(!best) return false;
  s.targetGrass=best.index;s.travelRoute=best.route;s.searchRoute=[];return true;
}

// Smooth afternoon boost, matching the existing 11:00–17:00 peak-sun window.
export function peakHeatStrength(hour:number) {
  return Math.abs(hour-14)<3 ? Math.cos((hour-14)/3*Math.PI/2)**2 : 0;
}

export function stepSimulation(s: Simulation, c: SimulationConfig, dt: number, updateResources = true) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  s.time += dt;
  s.environment = environmentAt(s.time, c.environment);
  if (updateResources) {
  const weatherChange = (s.environment.rainfall - s.environment.evaporation) * dt;
  s.ponds.forEach((pond, i) => { pond.water = Math.max(0, Math.min(c.ponds[i].capacity, pond.water + weatherChange)); });
  s.grass.forEach((stock,i) => updateGrass(stock, c.grass[i], s.environment.rain, dt));
  }
  if(s.time>=s.nextObservation) observeResources(s,c);
  const a = s.animal;
  const sleeping = a.behaviour === 'Sleeping';
  const metabolism = sleeping ? c.sleep.needsMultiplier : 1;
  a.hunger = Math.min(100, a.hunger + c.hunger.rate * metabolism * dt);
  a.thirst = Math.min(100, a.thirst + c.thirstRate * metabolism * dt);
  const shaded = isShaded(a, c);
  const exposure = Math.max(0, (s.environment.temperature - 24) / 11) *
    s.environment.daylight * (1 - s.environment.rain);
  const peakHeat = peakHeatStrength(s.environment.hour);
  const heating = c.heat.gain * (1 + (c.heat.peakMultiplier-1)*peakHeat);
  const shelterFromPeak = peakHeat > 0.35 && exposure > 0 && s.environment.rain <= 0.1;
  const heatChange = shaded ? -c.heat.cooling : exposure * heating - (1-exposure) * 0.3;
  a.heat = Math.max(0, Math.min(100, a.heat + heatChange * dt));
  const night = s.environment.hour >= c.sleep.startHour || s.environment.hour < c.sleep.endHour;
  const urgentNeed = a.thirst >= c.sleep.urgentNeed || a.hunger >= c.sleep.urgentNeed;
  if (!night) {
    s.nightRecovery = false;
    if (sleeping) { a.behaviour = 'Resting'; s.travelRoute = []; }
  } else {
    if (urgentNeed) s.nightRecovery = true;
    // Finish the current recovery bout before settling again: no sleep/wake oscillation.
    const recovering = ['Seeking water','Drinking','Waiting for water','Seeking grass','Grazing','Waiting for grass'].includes(a.behaviour);
    if (s.nightRecovery && !urgentNeed && !recovering && a.thirst < c.seekThreshold && a.hunger < c.hunger.seek)
      s.nightRecovery = false;
    if (!s.nightRecovery && a.heat < c.heat.seek) {
      a.behaviour = 'Sleeping'; s.travelRoute = []; s.waterRoute = []; s.shadeId = null;
      return;
    }
    if (sleeping) { a.behaviour = 'Resting'; s.travelRoute = []; }
  }
  const wantsWater = a.thirst >= c.seekThreshold && c.ponds.some((_,i) => knownStock(s,c,i,'water') >= 5);
  const urgentWater = a.thirst >= c.heat.urgentThirst && wantsWater;
  const shadeBehaviour = a.behaviour === 'Seeking shade' || a.behaviour === 'Cooling in shade';
  if (shadeBehaviour && urgentWater) {
    a.behaviour = selectWater(s, c) ? 'Seeking water' : 'Waiting for water';
    s.shadeId = null;
  } else if (shadeBehaviour) {
    const shade = c.shades.find(item => item.id === s.shadeId && item.accessible);
    if (!shade || (a.heat <= c.heat.comfortable && !shelterFromPeak) || s.environment.rain > 0.1 || exposure <= 0) {
      s.shadeId = null;
      a.behaviour = wantsWater && selectWater(s, c) ? 'Seeking water' : c.roaming ? 'Resting' : 'Returning';
      s.travelRoute = a.behaviour === 'Returning' ? planRoute(a, c.home, c) ?? [] : [];
    } else {
      const arrived = followRoute(s, s.travelRoute, c, dt);
      a.behaviour = arrived ? 'Cooling in shade' : 'Seeking shade';
      return;
    }
  }
  if (a.heat >= c.heat.seek && exposure > 0 && s.environment.rain <= 0.1 &&
      !urgentWater && a.behaviour !== 'Drinking' && s.time >= s.shadeRetryAt) {
    s.shadeRetryAt = s.time + c.retrySeconds;
    const shade = chooseShade(s, c);
    if (shade) { s.shadeId = shade.id; a.behaviour = 'Seeking shade'; return; }
  }
  const feeding = a.behaviour === 'Seeking grass' || a.behaviour === 'Grazing' || a.behaviour === 'Waiting for grass';
  if (feeding && a.thirst >= c.seekThreshold) {
    a.behaviour = selectWater(s, c) ? 'Seeking water' : 'Waiting for water';
    s.retryAt = s.time + c.retrySeconds;
  } else if (feeding || ((a.behaviour === 'Resting' || a.behaviour === 'Roaming') &&
      a.hunger >= c.hunger.seek && a.thirst < c.seekThreshold)) {
    if (!feeding || a.behaviour === 'Waiting for grass') {
      if (s.time < s.grassRetryAt) { searchLocally(s,c,dt); return; }
      s.grassRetryAt = s.time + c.retrySeconds;
      a.behaviour = selectGrass(s,c) ? 'Seeking grass' : 'Waiting for grass';
      if (a.behaviour === 'Waiting for grass') {searchLocally(s,c,dt);return;}
    }
    const patch = c.grass[s.targetGrass];
    if (!patch || knownStock(s,c,s.targetGrass,'grass') < 0.001) {
      a.behaviour = 'Waiting for grass'; s.grassRetryAt = s.time + c.retrySeconds; return;
    }
    if (a.behaviour === 'Seeking grass') {
      if (followRoute(s,s.travelRoute,c,dt)) a.behaviour = 'Grazing';
      return;
    }
    if (distance(a,patch) > patch.radius) { a.behaviour = 'Waiting for grass'; return; }
    graze(s,c,c.hunger.eatRate*dt);
    if (a.hunger <= c.hunger.satisfied + 1e-8) { a.behaviour = 'Resting'; s.travelRoute = []; }
    return;
  }
  if (a.behaviour === 'Returning') {
    if (!s.travelRoute.length) s.travelRoute = planRoute(a, c.home, c) ?? [];
    if (followRoute(s, s.travelRoute, c, dt)) a.behaviour = 'Resting';
    return;
  }
  if (a.behaviour === 'Resting' || a.behaviour === 'Roaming') {
    if (a.thirst >= c.seekThreshold) {
      a.behaviour = selectWater(s, c) ? 'Seeking water' : 'Waiting for water';
      s.retryAt = s.time + c.retrySeconds;
    }
    else {
      if (c.roaming && !s.travelRoute.length && s.time >= s.retryAt) beginRoaming(s, c);
      if (a.behaviour === 'Roaming' && followRoute(s, s.travelRoute, c, dt)) a.behaviour = 'Resting';
      return;
    }
  }
  if (a.behaviour === 'Waiting for water') {
    if (s.time < s.retryAt) {searchLocally(s,c,dt);return;}
    s.retryAt = s.time + c.retrySeconds;
    if (!selectWater(s, c)) {searchLocally(s,c,dt);return;}
    a.behaviour = 'Seeking water';
  }
  if (!c.ponds[s.targetPond] || knownStock(s,c,s.targetPond,'water') < 0.01) {
    a.behaviour = 'Waiting for water';
    s.retryAt = s.time + c.retrySeconds;
    return;
  }
  if (a.behaviour === 'Seeking water') {
    if (!s.waterRoute.length && !selectWater(s, c)) { a.behaviour = 'Waiting for water'; return; }
    const target = s.waterRoute[0];
    moveTowards(a, target, c.speed * dt);
    if (distance(a, target) > 1e-8) return;
    s.waterRoute.shift();
    if (s.waterRoute.length) return;
    a.behaviour = 'Drinking';
    return; // Arrival and drinking happen in separate ticks.
  }
  if (!inDrinkingRange(s, c)) {
    a.behaviour = 'Seeking water';
    return;
  }
  drink(s, c, c.drinkRate * dt);
  if (a.thirst <= c.satisfiedThreshold + 1e-8) {
    a.behaviour = c.roaming ? 'Resting' : 'Returning';
    s.travelRoute = [];
    s.cycles += 1;
  } else if (s.ponds[s.targetPond].water < 1e-8) {
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
