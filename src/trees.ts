import type { Scene } from '@babylonjs/core/scene';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { pondConfigs } from './config';
import { shadeAreas } from './habitat';

export function createTrees(scene: Scene) {
  const material = (name: string, hex: string) => {
    const m = new StandardMaterial(name, scene); m.diffuseColor = Color3.FromHexString(hex);
    m.specularColor = Color3.Black(); return m;
  };
  const bark = material('acacia-bark', '#69553b');
  const leaves = material('acacia-leaves', '#607344');
  const shade = material('canopy-shade', '#65733e');
  const scrub = material('savannah-scrub', '#7c854e');
  for (const tree of shadeAreas) {
    const height = tree.height ?? 3.5;
    const scale = height / 3.5;
    const footprint = CreateCylinder(`${tree.id}-shade`, { diameter: tree.radius*2, height:0.012, tessellation:32 },scene);
    footprint.position.set(tree.x,0.015,tree.z); footprint.material=shade;
    const trunk = CreateCylinder(`${tree.id}-trunk`, { diameterTop:0.22*scale,diameterBottom:0.55*scale,height,tessellation:7 },scene);
    trunk.position.set(tree.x,height/2,tree.z); trunk.material=bark;
    for (let i=0;i<3;i++) {
      const canopy=CreateSphere(`${tree.id}-crown-${i}`,{diameter:2,segments:5},scene);
      canopy.scaling.set(tree.radius*(i===0?0.85:0.6),0.6*scale,tree.radius*0.65);
      canopy.position.set(tree.x+(i-1)*0.9*scale,height-0.1+(i===1?0.5*scale:0),tree.z+(i===1?0.5*scale:0));
      canopy.material=leaves;
    }
  }
  const scatter = (seed: number) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  for (let i=0;i<75;i++) {
    const x = scatter(i*2)*88-44;
    const z = scatter(i*2+1)*60-14;
    // Keep the banks and central travel corridor open. Low scrub is passable scenery.
    if ((x>-13 && x<10 && z>-7 && z<5) ||
        pondConfigs.some(p => Math.hypot(x-p.x,z-p.z)<p.radius+p.shoreWidth+1.5) ||
        shadeAreas.some(t => Math.hypot(x-t.x,z-t.z)<1)) continue;
    const bush=CreateSphere(`scrub-${i}`, {diameter:1,segments:4},scene);
    const size=0.6+(i%4)*0.22;
    bush.scaling.set(size*1.5,size*0.7,size);
    bush.position.set(x,size*0.23,z); bush.material=scrub;
  }

}
