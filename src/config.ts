export interface PondConfig {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  shoreWidth: number;
  capacity: number;
  initialWater: number;
  accessible: boolean;
}
export const pondConfigs: PondConfig[] = [
  { id: 'central', name: 'Central pool', x: 3, z: 1, radius: 4.8, shoreWidth: 0.8, capacity: 5500, initialWater: 5500, accessible: true },
  { id: 'west', name: 'West pool', x: -19, z: 10, radius: 4, shoreWidth: 0.7, capacity: 5000, initialWater: 5000, accessible: true },
  { id: 'east', name: 'East pool', x: 17, z: -8, radius: 4.3, shoreWidth: 0.8, capacity: 5000, initialWater: 5000, accessible: true },
];
export const worldConfig = {
  grassland: { width: 240, depth: 240 },
  ponds: pondConfigs,
  render: { maxDevicePixelRatio: 1.5 },
};

// Compressed display-time lifecycle, not a species-accurate breeding model.
export const reproductionConfig = {
  maturityDays: 3,
  gestationDays: 2,
  recoveryDays: 3,
  mateRange: 6,
  conceptionNeedLimit: 60,
  birthNeedLimit: 85,
  birthHungerCost: 15,
  birthThirstCost: 10,
};

// Stylised simulated days, not biological lifespans. Tune with predator balance later.
export const lifecycleConfig = {
  criticalNeed:95, graceSeconds:15, damagePerSecond:0.6, calfDamageMultiplier:0.5,
  recoveryNeedLimit:60, recoveryPerSecond:0.3, recoveryStopsDays:24,
  senescenceDays:30, senescenceDamagePerSecond:0.25,
  carcassSeconds:120, adultMeat:40,
};
