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
  const seeds: { x: number; y: number; speed: number }[] = [];
  const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  // Camera-local depth layers keep rain across the viewport, including on resize.
  // One reusable mesh; no particles, textures or per-frame object creation.
  for (let i = 0; i < 420; i++) {
    lines.push([new Vector3(), new Vector3()]);
    seeds.push({ x: hash(i + 1), y: hash(i + 1200), speed: 0.6 + hash(i + 2400) * 0.5 });
  }
  const rainMesh = CreateLineSystem('rain', { lines, updatable: true }, scene);
  rainMesh.parent = scene.activeCamera;
  rainMesh.alwaysSelectAsActiveMesh = true;
  rainMesh.color = Color3.FromHexString('#c5e2eb');
  rainMesh.isPickable = false;
  rainMesh.setEnabled(false);
  return {
    update(e: Environment, time: number) {
      updateSky(e, time);
      light.intensity = (0.35 + 0.7 * e.daylight) * (1 - 0.45 * e.cloudCover);
      Color4.LerpToRef(night, day, e.daylight, clear);
      Color4.LerpToRef(clear, wet, e.cloudCover * 0.55, scene.clearColor);
      rainMesh.setEnabled(e.rain > 0.001);
      if (e.rain <= 0.001) return;
      rainMesh.alpha = e.rain * (0.25 + e.daylight * 0.22);
      const camera = scene.activeCamera!;
      const aspect = scene.getEngine().getAspectRatio(camera);
      const tangent = Math.tan(camera.fov / 2);
      for (let i = 0; i < lines.length; i++) {
        const depth = 1.5 + (i % 7) * 2;
        const halfHeight = depth * tangent;
        const halfWidth = halfHeight * aspect;
        const fall = time * seeds[i].speed;
        const x = (((seeds[i].x + fall * 0.075) % 1) * 2.4 - 1.2) * halfWidth;
        const y = (1.2 - ((seeds[i].y + fall) % 1) * 2.4) * halfHeight;
        // Fade individual streaks in as drizzle thickens, without allocating particles.
        const amount = Math.max(0, Math.min(1, (e.rain - seeds[i].y * 0.85) / 0.15));
        const length = halfHeight * (0.035 + (i % 5) * 0.009) * amount;
        lines[i][0].set(x, y, depth);
        lines[i][1].set(x - length * 0.22, y + length, depth);
      }
      CreateLineSystem('rain', { lines, instance: rainMesh });
    },
  };
}
