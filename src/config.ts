export interface PondConfig {
  x: number;
  z: number;
  radius: number;
  shoreWidth: number;
}

// World distances are arbitrary scene units. These describe visuals, not water stock.
export const worldConfig = {
  grassland: { width: 32, depth: 26 },
  pond: { x: 3, z: 1, radius: 3.1, shoreWidth: 0.65 } satisfies PondConfig,
  render: { maxDevicePixelRatio: 1.5 },
};
