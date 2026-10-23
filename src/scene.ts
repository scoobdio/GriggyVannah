import type { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { worldConfig } from './config';
import { createGrassland, createPond } from './world';
import { createTrees } from './trees';
import { attachEcosystem } from './ecosystem';

export function createSavannahScene(engine: Engine) {
  const scene = new Scene(engine);
  scene.clearColor = Color4.FromHexString('#e5d5aaff');

  const camera = new FreeCamera('overview', new Vector3(20, 14, -32), scene);
  camera.setTarget(new Vector3(0, 5, 2));
  camera.minZ = 0.1;
  camera.maxZ = 300;
  scene.activeCamera = camera;
  // No input attachment: the display requires no controls.
  const fitCamera = () => {
    const aspect = engine.getRenderWidth() / Math.max(1, engine.getRenderHeight());
    const verticalFov = 0.9;
    // Preserve horizontal coverage on narrow windows as well as vertical coverage.
    camera.fov = aspect < 1
      ? 2 * Math.atan(Math.tan(verticalFov / 2) / aspect)
      : verticalFov;
  };
  fitCamera();
  const resizeObserver = engine.onResizeObservable.add(fitCamera);
  scene.onDisposeObservable.add(() => engine.onResizeObservable.remove(resizeObserver));

  const light = new HemisphericLight('daylight', new Vector3(-0.4, 1, -0.3), scene);
  light.intensity = 1.05;
  light.groundColor = Color3.FromHexString('#8a7956');

  createGrassland(scene, worldConfig.grassland);
  createTrees(scene);
  const ponds = worldConfig.ponds.map(config => createPond(scene, config));
  attachEcosystem(scene, ponds.map(pond => pond.water));
  return scene;
}
