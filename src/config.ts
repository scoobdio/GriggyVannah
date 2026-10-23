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
