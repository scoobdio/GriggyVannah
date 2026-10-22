import type { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';

export function createHerbivore(scene: Scene) {
  const root = new TransformNode('herbivore', scene);
  const coat = new StandardMaterial('herbivore-coat', scene);
  coat.diffuseColor = Color3.FromHexString('#a16b42');
  coat.specularColor = Color3.Black();
  function part(name: string, width: number, height: number, depth: number, x: number, y: number, z: number) {
    const mesh = CreateBox(name, { width, height, depth }, scene);
    mesh.parent = root;
    mesh.position.set(x, y, z);
    mesh.material = coat;
    return mesh;
  }
  part('body', 0.8, 0.65, 1.3, 0, 0.85, 0);
  const head = part('head', 0.48, 0.5, 0.55, 0, 1.3, 0.65);
  for (const x of [-0.28, 0.28]) {
    for (const z of [-0.45, 0.45]) part('leg', 0.17, 0.6, 0.17, x, 0.3, z);
    part('ear', 0.13, 0.3, 0.16, x, 1.65, 0.65);
  }
  return { root, head };
}
