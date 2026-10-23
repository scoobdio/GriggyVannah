import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { GrassPatch, GrassState } from './grass';

export function createGrassView(scene: Scene, patches: GrassPatch[]) {
  const dry = Color3.FromHexString('#a89556'), green = Color3.FromHexString('#719447');
  const views = patches.map(patch => {
    const material = new StandardMaterial(`${patch.id}-grass`, scene);
    material.diffuseColor = green.clone(); material.specularColor = Color3.Black();
    const bed = CreateCylinder(`${patch.id}-bed`, { diameter: patch.radius*2, height: 0.018, tessellation: 24 }, scene);
    bed.position.set(patch.x,0.025,patch.z); bed.material = material;
    const blades: Mesh[] = [];
    for (let i=0;i<36;i++) {
      const angle = i * 2.399963, radius = Math.sqrt((i+0.5)/36)*patch.radius*0.92;
      const blade = CreateCylinder(`${patch.id}-blade-${i}`, {
        height: 0.35+(i%4)*0.1, diameterBottom: 0.18, diameterTop: 0, tessellation: 3,
      },scene);
      blade.position.set(Math.cos(angle)*radius,0.2,Math.sin(angle)*radius);
      blade.rotation.z = (i%3-1)*0.2; blades.push(blade);
    }
    const tufts = Mesh.MergeMeshes(blades,true)!;
    tufts.name = `${patch.id}-tufts`; tufts.position.set(patch.x,0.04,patch.z); tufts.material = material;
    return { material,tufts };
  });
  return (stocks: GrassState[]) => stocks.forEach((stock,i) => {
    const fraction = stock.food/patches[i].capacity;
    Color3.LerpToRef(dry,green,fraction*(0.4+0.6*stock.moisture),views[i].material.diffuseColor);
    views[i].tufts.scaling.y = Math.max(0.03,fraction);
    views[i].tufts.setEnabled(fraction > 0.005);
  });
}
