import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { createHerbivore } from './animal';
import { createStats } from './stats';
import { createSimulation, createSimulationClock, simulationConfig, stepSimulation } from './simulation';
import { worldConfig } from './config';

export function attachEcosystem(scene: Scene, waterMesh: Mesh) {
  const config = { ...simulationConfig, pond: { ...simulationConfig.pond, ...worldConfig.pond } };
  const state = createSimulation(config);
  const animal = createHerbivore(scene);
  const stats = createStats(config.pond.capacity, config.refillRate);
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
    const dx = state.animal.x - animal.root.position.x;
    const dz = state.animal.z - animal.root.position.z;
    if (Math.hypot(dx, dz) > 1e-6) animal.root.rotation.y = Math.atan2(dx, dz);
    animal.root.position.set(state.animal.x, 0, state.animal.z);
    animal.head.rotation.x = state.animal.behaviour === 'Drinking' ? 0.5 : 0;
    // Keep the bank fixed: colour/visibility reflects stock, not interaction geometry.
    waterMesh.visibility = state.water > 0 ? 0.35 + 0.65 * state.water / config.pond.capacity : 0;
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
