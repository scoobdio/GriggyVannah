import type { Scene } from '@babylonjs/core/scene';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { shadeAreas } from './habitat';

export function createTrees(scene: Scene) {
  const material = (name: string, hex: string) => {
    const m = new StandardMaterial(name, scene); m.diffuseColor = Color3.FromHexString(hex);
    m.specularColor = Color3.Black(); return m;
  };
  const bark = material('acacia-bark', '#69553b');
  const leaves = material('acacia-leaves', '#607344');
  const shade = material('canopy-shade', '#65733e');
  for (const tree of shadeAreas) {
    const footprint = CreateCylinder(`${tree.id}-shade`, { diameter: tree.radius*2, height:0.012, tessellation:32 },scene);
    footprint.position.set(tree.x,0.015,tree.z); footprint.material=shade;
    const trunk = CreateCylinder(`${tree.id}-trunk`, { diameterTop:0.22,diameterBottom:0.55,height:3.5,tessellation:7 },scene);
    trunk.position.set(tree.x,1.75,tree.z); trunk.material=bark;
    for (let i=0;i<3;i++) {
      const canopy=CreateSphere(`${tree.id}-crown-${i}`,{diameter:2,segments:5},scene);
      canopy.scaling.set(tree.radius*(i===0?0.85:0.6),0.6,tree.radius*0.65);
      canopy.position.set(tree.x+(i-1)*0.9,3.4+(i===1?0.5:0),tree.z+(i===1?0.5:0));
      canopy.material=leaves;
    }
  }
}
