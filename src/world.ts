import { softGround, scatter } from './surface';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
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
  const soil = material(scene,'dry-grass','#ffffff');
  const texture = new DynamicTexture('savannah-ground-mottle',512,scene,true);
  const ctx = texture.getContext();ctx.fillStyle='#b6af69';ctx.fillRect(0,0,512,512);
  for(let i=0;i<1400;i++) {
    const x=scatter(i*3)*512,y=scatter(i*3+1)*512,r=2+scatter(i*3+2)*28;
    const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,i%2?'rgba(205,184,113,0.22)':'rgba(93,107,58,0.16)');gradient.addColorStop(1,'transparent');
    ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  texture.update();texture.anisotropicFilteringLevel=8;texture.uScale=12;texture.vScale=12;soil.diffuseTexture=texture;
  ground.material=soil;
  return ground;
}

export function createPond(scene: Scene, config: PondConfig) {
  const bankTexture = new DynamicTexture(`${config.id}-bank-feathering`,256,scene,false);
  const bank = bankTexture.getContext();
  const fade = bank.createRadialGradient(128,128,0,128,128,128);
  fade.addColorStop(0,'rgba(255,255,255,1)');fade.addColorStop(0.7,'rgba(255,255,255,0.95)');fade.addColorStop(1,'rgba(255,255,255,0)');
  bank.fillStyle=fade;bank.fillRect(0,0,256,256);bankTexture.hasAlpha=true;bankTexture.update();
  const shore = softGround(scene,`${config.id}-shore`,config.x,config.z,config.radius+config.shoreWidth,
    bankTexture,'#d0bd86',0.9,0.012).mesh;

  const water = CreateCylinder(`${config.id}-water`, {
    diameter: config.radius * 2,
    height: 0.025,
    tessellation: 32,
  }, scene);
  water.position.set(config.x, 0.0925, config.z);
  const surface = material(scene,`${config.id}-water-material`,'#547f79');
  surface.specularColor=Color3.FromHexString('#a1b4aa');surface.specularPower=48;
  const ripples=new DynamicTexture(`${config.id}-ripples`,128,scene,true);
  const ctx=ripples.getContext();ctx.fillStyle='#808080';ctx.fillRect(0,0,128,128);
  for(let i=0;i<24;i++) {ctx.strokeStyle='rgba(200,200,200,0.25)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(scatter(i)*128,scatter(i+50)*128,8+scatter(i+90)*20,0,Math.PI*2);ctx.stroke();}
  ripples.update();ripples.level=0.12;surface.bumpTexture=ripples;
  water.material=surface;
  return { shore, water, update(time:number) { ripples.uOffset=time*0.009;ripples.vOffset=time*0.004; } };
}
