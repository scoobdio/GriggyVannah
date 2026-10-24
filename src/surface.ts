import type { Scene } from '@babylonjs/core/scene';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';

export const scatter = (seed: number) => {
  const value = Math.sin(seed*127.1+311.7)*43758.5453;
  return value-Math.floor(value);
};
// Generated once: irregular, feathered coverage instead of a hard resource outline.
export function softTexture(scene: Scene, name: string) {
  const texture = new DynamicTexture(name,256,scene,false);
  const ctx = texture.getContext(); ctx.clearRect(0,0,256,256);
  for (let i=0;i<30;i++) {
    const angle = i*2.399963, radius = Math.sqrt(scatter(i+9))*58;
    const x = 128+Math.cos(angle)*radius, y = 128+Math.sin(angle)*radius;
    const gradient = ctx.createRadialGradient(x,y,0,x,y,40+scatter(i+60)*26);
    gradient.addColorStop(0,'rgba(255,255,255,0.24)');gradient.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  }
  texture.hasAlpha=true;texture.update();return texture;
}
export function softGround(scene: Scene, name: string, x: number,z: number,radius: number,
  texture: DynamicTexture, colour: string, opacity=1, height=0.018) {
  const mesh = CreateGround(name,{width:radius*2.7,height:radius*2.7},scene);
  mesh.position.set(x,height,z);mesh.isPickable=false;
  const material = new StandardMaterial(`${name}-material`,scene);
  material.diffuseTexture=texture;material.useAlphaFromDiffuseTexture=true;
  material.diffuseColor=Color3.FromHexString(colour);material.specularColor=Color3.Black();material.alpha=opacity;
  mesh.material=material; return {mesh,material};
}
