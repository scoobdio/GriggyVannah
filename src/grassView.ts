import { softGround, softTexture, scatter } from './surface';
import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { GrassPatch, GrassState } from './grass';

export function createGrassView(scene: Scene, patches: GrassPatch[]) {
  const dry = Color3.FromHexString('#a89556'), green = Color3.FromHexString('#719447');
  const coverage = softTexture(scene,'grass-feathering');
  const views = patches.map(patch => {
    const material = new StandardMaterial(`${patch.id}-grass`, scene);
    material.diffuseColor = green.clone(); material.specularColor = Color3.Black();
    const bed = softGround(scene,`${patch.id}-bed`,patch.x,patch.z,patch.radius,coverage,'#839550',0.65,0.021);
    const blades: Mesh[] = [];
    for (let i=0;i<110;i++) {
      const angle = i * 2.399963, radius = Math.sqrt(scatter(i+100))*patch.radius*(0.65+scatter(i+300)*0.4);
      const blade = CreateCylinder(`${patch.id}-blade-${i}`, {
        height: 0.2+scatter(i+7)*0.45, diameterBottom: 0.09, diameterTop: 0, tessellation: 3,
      },scene);
      blade.position.set(Math.cos(angle)*radius,0.2,Math.sin(angle)*radius);
      blade.rotation.z = (i%3-1)*0.2; blades.push(blade);
    }
    const tufts = Mesh.MergeMeshes(blades,true)!;
    tufts.name = `${patch.id}-tufts`; tufts.position.set(patch.x,0.04,patch.z); tufts.material = material;
    return { material,tufts,bed };
  });
  return (stocks: GrassState[], time: number) => stocks.forEach((stock,i) => {
    const fraction = stock.food/patches[i].capacity;
    Color3.LerpToRef(dry,green,fraction*(0.4+0.6*stock.moisture),views[i].material.diffuseColor);
    views[i].bed.material.diffuseColor.copyFrom(views[i].material.diffuseColor);
    views[i].bed.material.alpha = 0.15+fraction*0.5;
    views[i].tufts.rotation.z = Math.sin(time*1.3+i)*0.025;
    views[i].tufts.scaling.y = Math.max(0.03,fraction);
    views[i].tufts.setEnabled(fraction > 0.005);
  });
}
