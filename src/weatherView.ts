import type { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateLineSystem } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { createSky } from './sky';
import type { Environment } from './environment';

export function createWeatherView(scene: Scene) {
  const updateSky = createSky(scene);
  const light = scene.getLightByName('daylight') as HemisphericLight;
  const night = Color4.FromHexString('#293b55ff');
  const day = Color4.FromHexString('#e5d5aaff');
  const wet = Color4.FromHexString('#7b919fff');
  const clear = new Color4();
  const lines: Vector3[][] = [];
  // A single reusable line-system mesh; deterministic positions, no particle textures.
  for (let i = 0; i < 100; i++) {
    const x = ((i * 17) % 97) / 97 * 32 - 16;
    const z = ((i * 31) % 89) / 89 * 26 - 13;
    lines.push([new Vector3(x, 0, z), new Vector3(x, 0, z)]);
  }
  const rainMesh = CreateLineSystem('rain', { lines, updatable: true }, scene);
  rainMesh.color = Color3.FromHexString('#c5e2eb');
  rainMesh.isPickable = false;
  rainMesh.setEnabled(false);
  return {
    update(e: Environment, time: number) {
      updateSky(e, time);
      light.intensity = (0.35 + 0.7 * e.daylight) * (1 - 0.25 * e.rain);
      Color4.LerpToRef(night, day, e.daylight, clear);
      Color4.LerpToRef(clear, wet, e.rain * 0.55, scene.clearColor);
      rainMesh.setEnabled(e.rain > 0.001);
      if (e.rain <= 0.001) return;
      rainMesh.alpha = e.rain * 0.55;
      for (let i = 0; i < lines.length; i++) {
        const y = 6 - ((time * 9 + i * 0.73) % 6);
        lines[i][0].y = y;
        lines[i][1].y = y + 0.45;
      }
      CreateLineSystem('rain', { lines, instance: rainMesh });
    },
  };
}
