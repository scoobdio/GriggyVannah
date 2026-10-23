import { createHerd, stepHerd } from './herd';
import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { createHerbivore } from './animal';
import { createGrassView } from './grassView';
import { createStats, createAnimalStats } from './stats';
import { createSimulationClock, simulationConfig } from './simulation';
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
  const herd = createHerd(config);
  const state = herd.members[0];
  if (preview === 'grazing') { state.animal.hunger = 85; state.animal.thirst = 10; }
  if (preview === 'heat') { state.animal.heat = 90; state.animal.thirst = 20; }
  if (preview === 'night' || preview === 'rain' || preview === 'heat' || preview === 'grazing') {
    const notice = document.createElement('div');
    notice.className = 'preview-notice'; notice.textContent = `Development preview: ${preview}`;
    document.body.append(notice);
    scene.onDisposeObservable.add(() => notice.remove());
  }
  const animals = herd.members.map((_,i)=>createHerbivore(scene,i));
  const badges = herd.members.map((_,i)=>createAnimalStats(i));
  const stats = createStats(config.ponds);
  const weather = createWeatherView(scene);
  const updateGrassView = createGrassView(scene, config.grass);
  const advance = createSimulationClock(dt => stepHerd(herd, config, dt));
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
    herd.members.forEach((member,i) => {
      const animal = animals[i];
    const dx = member.animal.x - animal.root.position.x;
    const dz = member.animal.z - animal.root.position.z;
    if (Math.hypot(dx, dz) > 1e-6) animal.root.rotation.y = Math.atan2(dx, dz);
    animal.root.position.set(member.animal.x, member.animal.behaviour === 'Cooling in shade' ? -0.25 : 0, member.animal.z);
    animal.head.rotation.x = member.animal.behaviour === 'Drinking' ? 0.5 : member.animal.behaviour === 'Grazing' ? 0.5 + Math.sin(member.time*5)*0.08 : 0;
    });
    // Keep the bank fixed: colour/visibility reflects stock, not interaction geometry.
    waterMeshes.forEach((mesh, i) => {
      const stock = state.ponds[i].water;
      mesh.visibility = stock > 0 ? 0.35 + 0.65 * stock / config.ponds[i].capacity : 0;
    });
  });
  scene.onAfterRenderObservable.add(() => {
    const canvas = engine.getRenderingCanvas()!;
    const viewport = scene.activeCamera!.viewport.toGlobal(canvas.clientWidth, canvas.clientHeight);
    herd.members.forEach((member,i) => {
      anchor.set(member.animal.x, 1.95, member.animal.z);
      const screen = Vector3.Project(anchor, identity, scene.getTransformMatrix(), viewport);
      badges[i].update(member,herd.solo[i],screen.x,screen.y,
        screen.z>0 && screen.z<1 && screen.x>=0 && screen.x<=canvas.clientWidth && screen.y>=0 && screen.y<=canvas.clientHeight);
    });
    stats.update(state,herd.members,herd.solo);
  });
  scene.onDisposeObservable.add(() => {
    stats.dispose();
    badges.forEach(badge=>badge.dispose());
    document.removeEventListener('visibilitychange', onVisibility);
  });
}
