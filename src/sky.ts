import type { Scene } from '@babylonjs/core/scene';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Environment } from './environment';

Effect.ShadersStore['savannahSkyVertexShader'] = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 direction;
void main() { direction = position; gl_Position = worldViewProjection * vec4(position, 1.0); }
`;
Effect.ShadersStore['savannahSkyFragmentShader'] = `
precision highp float;
varying vec3 direction;
uniform float daylight;
uniform float rain;
uniform float clock;
uniform float hour;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
 vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main() {
 vec3 d=normalize(direction); float height=clamp(d.y,0.0,1.0);
 vec3 day=mix(vec3(0.89,0.81,0.63),vec3(0.24,0.57,0.79),pow(height,0.55));
 vec3 night=mix(vec3(0.12,0.18,0.29),vec3(0.018,0.032,0.085),pow(height,0.45));
 float light=smoothstep(0.0,0.45,daylight);
 vec3 color=mix(night,day,light);
 float dusk=exp(-pow((hour-18.0)/0.9,2.0))+exp(-pow((hour-6.0)/0.9,2.0));
 color+=vec3(0.30,0.09,0.02)*dusk*exp(-height*8.0);
 // Rotate the sampling direction, keeping the star pattern rigid as time advances.
 // Sine/cosine make the 24:00 -> 00:00 wrap continuous.
 float siderealAngle=hour/24.0*6.28318530718;
 vec3 axis=normalize(vec3(0.15,1.0,0.25));
 vec3 starDir=d*cos(siderealAngle)+cross(axis,d)*sin(siderealAngle)
   +axis*dot(axis,d)*(1.0-cos(siderealAngle));
 vec2 starUV=vec2(atan(starDir.x,starDir.z),asin(clamp(starDir.y,-1.0,1.0)));
 vec2 cells=starUV*180.0;
 float star=step(0.988,hash(floor(cells)))*(1.0-smoothstep(0.02,0.10,length(fract(cells)-0.5)));
 color+=vec3(star)*(1.0-light)*(1.0-rain)*smoothstep(0.02,0.16,height);
 float sunPhase=(hour-6.0)/12.0*3.14159;
 vec3 sunDir=normalize(vec3(-0.55+0.65*cos(sunPhase),0.04+0.12*sin(sunPhase),0.85));
 float sunDist=length(d-sunDir);
 float sunVisible=smoothstep(5.8,6.3,hour)*(1.0-smoothstep(17.7,18.2,hour));
 color+=vec3(1.0,0.72,0.30)*(exp(-sunDist*18.0)*0.35+1.0-smoothstep(0.022,0.027,sunDist))*sunVisible*(1.0-rain);
 // Mirror the stylised daytime arc, shifted twelve hours into the night.
 float moonPhase=mod(hour+6.0,24.0)/12.0*3.14159265359;
 vec3 moonDir=normalize(vec3(-0.55+0.65*cos(moonPhase),0.04+0.12*sin(moonPhase),0.85));
 float moon=1.0-smoothstep(0.026,0.030,length(d-moonDir));
 // Moon-local coordinates keep the crater pattern attached to the moving disc.
 vec3 moonRight=normalize(cross(vec3(0.0,1.0,0.0),moonDir));
 vec3 moonUp=cross(moonDir,moonRight);
 vec2 moonUV=vec2(dot(d-moonDir,moonRight),dot(d-moonDir,moonUp));
 float crater=0.85+0.15*noise(moonUV*180.0);
 color=mix(color,vec3(0.87,0.91,0.96)*crater,moon*(1.0-light)*(1.0-rain));
 vec2 cloudUV=d.xz/max(d.y+0.22,0.12)*2.0+vec2(clock*0.008,0);
 float cloudNoise=noise(cloudUV)*0.65+noise(cloudUV*2.1)*0.35;
 float cloud=smoothstep(mix(0.65,0.22,rain),mix(0.82,0.55,rain),cloudNoise);
 cloud*=smoothstep(-0.02,0.08,d.y);
 vec3 cloudColor=mix(mix(vec3(0.23,0.28,0.38),vec3(0.98,0.96,0.90),light),vec3(0.29,0.34,0.40),rain);
 color=mix(color,cloudColor,cloud*mix(0.75,0.98,rain));
 color=mix(color,vec3(0.35,0.40,0.46),rain*0.25);
 gl_FragColor=vec4(color,1.0);
}
`;
export function createSky(scene: Scene) {
  const sky = CreateSphere('sky-dome', { diameter: 360, segments: 16 }, scene);
  const shader = new ShaderMaterial('procedural-sky', scene, 'savannahSky', {
    attributes: ['position'], uniforms: ['worldViewProjection','daylight','rain','clock','hour'],
  });
  shader.backFaceCulling = false;
  shader.disableDepthWrite = true;
  sky.material = shader; sky.isPickable = false; sky.infiniteDistance = true;
  const earth = new StandardMaterial('distant-earth', scene);
  earth.diffuseColor = Color3.FromHexString('#a5a368'); earth.specularColor = Color3.Black();
  const ground = CreateGround('surrounding-plains',{width:240,height:240},scene);
  ground.position.y = -0.025; ground.material = earth;
  const hills = new StandardMaterial('distant-hills',scene);
  hills.diffuseColor=Color3.FromHexString('#7f8e73'); hills.specularColor=Color3.Black();
  for(let i=0;i<14;i++) {
    const hill=CreateSphere(`ridge-${i}`,{diameter:2,segments:5},scene);
    hill.scaling.set(12+i%3*5,5+i%4*2,9);
    hill.position.set(-80+i*13,0,58+(i%3)*8); hill.material=hills;
  }
  return (e:Environment,time:number) => {
    shader.setFloat('daylight',e.daylight); shader.setFloat('rain',e.rain);
    shader.setFloat('clock',time); shader.setFloat('hour',e.hour);
  };
}
