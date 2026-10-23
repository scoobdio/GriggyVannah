import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { createHerbivore } from './animal';
import { createGrassView } from './grassView';
import { createStats } from './stats';
import { createSimulation, createSimulationClock, simulationConfig, stepSimulation } from './simulation';
import { createWeatherView } from './weatherView';

export function attachEcosystem(scene: Scene, waterMeshes: Mesh[]) {
  const config = { ...simulationConfig };
  // Development-only visual scenarios; production always starts from normal defaults.
  const preview = import.meta.env.DEV ? new URLSearchParams(location.search).get('preview') : null;
  if (preview === 'night' || preview === 'rain' || preview === 'heat') {
    config.environment = { ...config.environment, startHour: preview === 'night' ? 22 : 14,
      clearSeconds: preview === 'rain' ? 0 : 10000,
      rainSeconds: 10000, transitionSeconds: 0 };
  }
  const state = createSimulation(config);
  if (preview === 'grazing') { state.animal.hunger = 85; state.animal.thirst = 10; }
  if (preview === 'heat') { state.animal.heat = 90; state.animal.thirst = 20; }
  if (preview === 'night' || preview === 'rain' || preview === 'heat' || preview === 'grazing') {
    const notice = document.createElement('div');
    notice.className = 'preview-notice'; notice.textContent = `Development preview: ${preview}`;
    document.body.append(notice);
    scene.onDisposeObservable.add(() => notice.remove());
  }
  const animal = createHerbivore(scene);
  const stats = createStats(config.ponds);
  const weather = createWeatherView(scene);
  const updateGrassView = createGrassView(scene, config.grass);
  const advance = createSimulationClock(dt => stepSimulation(state, config, dt));
  const engine = scene.getEngine();
  const anchor = new Vector3();
  const identity = Matrix.Identity();
  let paused = document.hidden;
  const onVisibility = () => { paused = true; };
  document.addEventListener('visibilitychange', onVisibility);
  scene.onBeforeRenderObservable.add(() => {
    if (!document.hidden && !paused) advance(engine.getDeltaTime() / 1000);
    paused = document.hidden;
    weather.update(state.environment, state.time);
    updateGrassView(state.grass);
    const dx = state.animal.x - animal.root.position.x;
    const dz = state.animal.z - animal.root.position.z;
    if (Math.hypot(dx, dz) > 1e-6) animal.root.rotation.y = Math.atan2(dx, dz);
    animal.root.position.set(state.animal.x, state.animal.behaviour === 'Cooling in shade' ? -0.25 : 0, state.animal.z);
    animal.head.rotation.x = state.animal.behaviour === 'Drinking' ? 0.5 : state.animal.behaviour === 'Grazing' ? 0.5 + Math.sin(state.time*5)*0.08 : 0;
    // Keep the bank fixed: colour/visibility reflects stock, not interaction geometry.
    waterMeshes.forEach((mesh, i) => {
      const stock = state.ponds[i].water;
      mesh.visibility = stock > 0 ? 0.35 + 0.65 * stock / config.ponds[i].capacity : 0;
    });
  });
  scene.onAfterRenderObservable.add(() => {
    anchor.set(state.animal.x, 2.1, state.animal.z);
    const canvas = engine.getRenderingCanvas()!;
    const viewport = scene.activeCamera!.viewport.toGlobal(canvas.clientWidth, canvas.clientHeight);
    const screen = Vector3.Project(anchor, identity, scene.getTransformMatrix(), viewport);
    stats.update(state, screen.x, screen.y);
  });
  scene.onDisposeObservable.add(() => {
    stats.dispose();
    document.removeEventListener('visibilitychange', onVisibility);
  });
}
