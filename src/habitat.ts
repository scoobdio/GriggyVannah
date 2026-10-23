export interface ShadeArea { id: string; x: number; z: number; radius: number; height?: number; accessible: boolean }
// Four distinct trees leave broad, open gathering spaces around the ponds.
export const shadeAreas: ShadeArea[] = [
  { id: 'west-acacia', x: -10, z: -7, radius: 3.2, height: 4.6, accessible: true },
  { id: 'north-acacia', x: -25, z: 19, radius: 2, height: 2.7, accessible: true },
  { id: 'ridge-acacia', x: -3, z: 20, radius: 2.6, height: 3.6, accessible: true },
  { id: 'east-acacia', x: 25, z: 6, radius: 3.5, height: 5.2, accessible: true },
];
