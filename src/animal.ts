import type { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type { Simulation } from './simulation';
import { softGround } from './surface';

export function createHerbivore(scene: Scene, id: number, shadowTexture: DynamicTexture) {
  const root = new TransformNode(`herbivore-${id}`,scene);
  const body = new TransformNode(`herbivore-${id}-body-pivot`,scene);body.parent=root;
  const makeMaterial = (name:string,hex:string) => {
    const m=new StandardMaterial(`herbivore-${id}-${name}`,scene);
    m.diffuseColor=Color3.FromHexString(hex);m.specularColor=Color3.Black();return m;
  };
  const coat=makeMaterial('coat',['#ad8055','#b59368','#936d48'][id%3]);
  const dark=makeMaterial('dark','#3c3529'), cream=makeMaterial('belly','#d8c39c');
  const ellipsoid = (name:string,parent:TransformNode,x:number,y:number,z:number,sx:number,sy:number,sz:number,mat=coat) => {
    const mesh=CreateSphere(`herbivore-${id}-${name}`,{diameter:1,segments:4},scene);
    mesh.parent=parent;mesh.position.set(x,y,z);mesh.scaling.set(sx,sy,sz);mesh.material=mat;return mesh;
  };
  ellipsoid('torso',body,0,0.98,0,0.78,0.8,1.55);
  ellipsoid('belly',body,0,0.79,0.05,0.6,0.42,1.2,cream);
  const neck=ellipsoid('neck',body,0,1.28,0.53,0.43,0.9,0.5);neck.rotation.x=-0.3;
  const head=new TransformNode(`herbivore-${id}-head-pivot`,scene);head.parent=body;head.position.set(0,1.6,0.61);
  ellipsoid('head',head,0,0,0.12,0.38,0.4,0.65);
  ellipsoid('muzzle',head,0,-0.09,0.39,0.28,0.23,0.22,dark);
  for(const side of [-1,1]) {
    const ear=ellipsoid(`ear-${side}`,head,side*0.25,0.16,-0.04,0.17,0.34,0.12);ear.rotation.z=-side*0.65;
    ellipsoid(`eye-${side}`,head,side*0.185,0.04,0.2,0.055,0.06,0.055,dark);
    const horn=CreateCylinder(`herbivore-${id}-horn-${side}`,{height:0.36,diameterBottom:0.075,diameterTop:0.018,tessellation:5},scene);
    horn.parent=head;horn.position.set(side*0.11,0.34,-0.09);horn.rotation.x=-0.23;horn.material=dark;
  }
  const legs:TransformNode[]=[];
  for(const x of [-0.26,0.26]) for(const z of [-0.5,0.5]) {
    const pivot=new TransformNode(`herbivore-${id}-leg-${legs.length}`,scene);pivot.parent=body;pivot.position.set(x,0.88,z);
    ellipsoid('leg',pivot,0,-0.39,0,0.14,0.78,0.16);
    ellipsoid('hoof',pivot,0,-0.79,0.025,0.17,0.14,0.23,dark);legs.push(pivot);
  }
  const tail=ellipsoid('tail',body,0,0.95,-0.88,0.09,0.57,0.1,dark);tail.rotation.x=-0.3;
  const shadow=softGround(scene,`herbivore-${id}-shadow`,0,0,0.9,shadowTexture,'#343a25',0.3,0.029).mesh;
  shadow.scaling.z=1.4;
  let lastTime=-1,stride=id*1.9;
  return { root,head, update(s:Simulation) {
    if (s.time === lastTime) return;
    const dt=lastTime<0?0:s.time-lastTime;lastTime=s.time;
    const dx=s.animal.x-root.position.x,dz=s.animal.z-root.position.z;
    const moved=dt>0?Math.hypot(dx,dz):0;
    const walking=moved>0.001;
    stride+=moved*5;
    if(walking) {
      const target=Math.atan2(dx,dz);
      const turn=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y));
      root.rotation.y+=turn*Math.min(1,dt*9);
    }
    root.position.set(s.animal.x,0,s.animal.z);
    const resting=s.animal.behaviour==='Cooling in shade';
    body.position.y=resting?-0.28:walking?Math.abs(Math.sin(stride))*0.035:Math.sin(s.time*1.7+id)*0.008;
    legs.forEach((leg,i)=>leg.rotation.x=resting?(i%2?0.7:-0.7):walking?Math.sin(stride+(i===0||i===3?0:Math.PI))*0.48:0);
    const feeding=s.animal.behaviour==='Grazing'||s.animal.behaviour==='Drinking';
    const blend=Math.min(1,dt*7);
    head.position.y+=((feeding?0.58:1.6)-head.position.y)*blend;
    head.position.z+=((feeding?1.03:0.61)-head.position.z)*blend;
    neck.rotation.x+=((feeding?0.85:-0.3)-neck.rotation.x)*blend;
    neck.position.y+=((feeding?1.0:1.28)-neck.position.y)*blend;
    const headTarget=feeding?0.95+Math.sin(s.time*4+id)*0.045:Math.sin(s.time*0.8+id)*0.035;
    head.rotation.x+=(headTarget-head.rotation.x)*Math.min(1,dt*7);
    tail.rotation.z=Math.sin(s.time*2.1+id)*0.16;
    shadow.position.x=s.animal.x;shadow.position.z=s.animal.z;shadow.rotation.y=root.rotation.y;
  } };
}
