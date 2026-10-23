import type { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import type { PondConfig } from './config';

function material(scene: Scene, name: string, hex: string) {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = Color3.FromHexString(hex);
  result.specularColor = Color3.Black();
  return result;
}

export function createGrassland(scene: Scene, config: { width: number; depth: number }) {
  const ground = CreateGround('grassland', { width: config.width, height: config.depth }, scene);
  ground.material = material(scene, 'dry-grass', '#b6af69');
  return ground;
}

export function createPond(scene: Scene, config: PondConfig) {
  const shore = CreateCylinder(`${config.id}-shore`, {
    diameter: (config.radius + config.shoreWidth) * 2,
    height: 0.08,
    tessellation: 32,
  }, scene);
  shore.position.set(config.x, 0.04, config.z);
  shore.material = material(scene, 'sand', '#d6bf83');

  const water = CreateCylinder(`${config.id}-water`, {
    diameter: config.radius * 2,
    height: 0.025,
    tessellation: 32,
  }, scene);
  water.position.set(config.x, 0.0925, config.z);
  water.material = material(scene, 'water', '#5e9695');
  return { shore, water };
}
