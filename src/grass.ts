export interface GrassPatch { id: string; x: number; z: number; radius: number; capacity: number; accessible: boolean }
export interface GrassState { food: number; moisture: number }
export const grassPatches: GrassPatch[] = [
  { id: 'central-meadow', x: -6, z: 3, radius: 3.2, capacity: 120, accessible: true },
  { id: 'west-meadow', x: -25, z: -3, radius: 4, capacity: 180, accessible: true },
  { id: 'north-meadow', x: -10, z: 17, radius: 4.5, capacity: 220, accessible: true },
  { id: 'east-meadow', x: 13, z: 7, radius: 3.8, capacity: 160, accessible: true },
  { id: 'far-meadow', x: 28, z: 22, radius: 5, capacity: 240, accessible: true },
];
// Rates per simulated second. Moisture buffers short dry spells; bare patches can regrow.
export const grassConfig = { dryingRate: 0.0008, wettingRate: 0.025, dryThreshold: 0.2,
  witherRate: 0.035, rainGrowthRate: 0.6 };
export function updateGrass(state: GrassState, patch: GrassPatch, rain: number, dt: number, rates=grassConfig) {
  const intensity = Math.max(0, Math.min(1, rain));
  state.moisture = Math.max(0, Math.min(1, state.moisture +
    (intensity * rates.wettingRate - (1-intensity) * rates.dryingRate) * dt));
  const growth = intensity * rates.rainGrowthRate;
  const withering = state.moisture < rates.dryThreshold ? (1-intensity) * rates.witherRate : 0;
  state.food = Math.max(0, Math.min(patch.capacity, state.food + (growth-withering)*dt));
}
