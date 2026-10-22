export interface ShadeArea { id: string; x: number; z: number; radius: number; accessible: boolean }
export const shadeAreas: ShadeArea[] = [
  { id: 'west-acacia', x: -10, z: -7, radius: 2.8, accessible: true },
  { id: 'north-acacia', x: -9, z: 4, radius: 3, accessible: true },
  { id: 'ridge-acacia', x: -3, z: 8, radius: 2.6, accessible: true },
  { id: 'east-acacia', x: 11, z: 6, radius: 3, accessible: true },
];
