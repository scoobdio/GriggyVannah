import { softGround, softTexture } from './surface';
import { Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
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
  const shadow = softTexture(scene,'canopy-dapple');
  const crowns: {mesh:Mesh;phase:number}[] = [];
  const scrub = material('savannah-scrub', '#7c854e');
  for (const tree of shadeAreas) {
    const height = tree.height ?? 3.5;
    const scale = height / 3.5;
    softGround(scene,`${tree.id}-shade`,tree.x,tree.z,tree.radius,shadow,'#263521',0.5);
    const trunk = CreateCylinder(`${tree.id}-trunk`, { diameterTop:0.22*scale,diameterBottom:0.55*scale,height,tessellation:7 },scene);
    trunk.position.set(tree.x,height/2,tree.z); trunk.material=bark;
    for (let i=0;i<3;i++) {
      const canopy=CreateSphere(`${tree.id}-crown-${i}`,{diameter:2,segments:5},scene);
      canopy.scaling.set(tree.radius*(i===0?0.85:0.6),0.6*scale,tree.radius*0.65);
      canopy.position.set(tree.x+(i-1)*0.9*scale,height-0.1+(i===1?0.5*scale:0),tree.z+(i===1?0.5*scale:0));
      canopy.material=leaves;
      crowns.push({mesh:canopy,phase:tree.x+i});
      if (i !== 1) {
        const start = new Vector3(tree.x,height*0.55,tree.z);
        const end = canopy.position.clone();end.y-=0.2;
        const direction = end.subtract(start);
        const branch = CreateCylinder(`${tree.id}-branch-${i}`,{height:direction.length(),diameterTop:0.1*scale,diameterBottom:0.24*scale,tessellation:6},scene);
        branch.position.copyFrom(start.add(end).scale(0.5));
        branch.rotationQuaternion = Quaternion.FromUnitVectorsToRef(Vector3.Up(),direction.normalize(),new Quaternion());
        branch.material=bark;
      }
    }
  }
  const scatter = (seed: number) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  for (let i=0;i<91;i++) {
    // Extra low scrub gives the left foreground some texture without adding trees.
    const leftSide = i >= 75;
    const x = leftSide ? -38 + scatter(i*2)*22 : scatter(i*2)*88-44;
    const z = leftSide ? -12 + scatter(i*2+1)*24 : scatter(i*2+1)*60-14;
    // Keep the banks and central travel corridor open. Low scrub is passable scenery.
    if ((x>-13 && x<10 && z>-7 && z<5) ||
        pondConfigs.some(p => Math.hypot(x-p.x,z-p.z)<p.radius+p.shoreWidth+1.5) ||
        shadeAreas.some(t => Math.hypot(x-t.x,z-t.z)<t.radius+0.5)) continue;
    const bush=CreateSphere(`scrub-${i}`, {diameter:1,segments:4},scene);
    const size=0.6+(i%4)*0.22;
    bush.scaling.set(size*1.5,size*0.7,size);
    bush.position.set(x,size*0.23,z); bush.material=scrub;
  }
  return (time:number, rain:number) => {
    for (const crown of crowns) crown.mesh.rotation.z = Math.sin(time*0.7+crown.phase)*(0.008+rain*0.01);
  };
}
