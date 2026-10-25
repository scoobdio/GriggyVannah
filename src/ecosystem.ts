import { lifecycleConfig, reproductionConfig } from './config';
import { growthScale } from './reproduction';
import { createHerd, stepHerd } from './herd';
import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { softTexture } from './surface';
import { createHerbivore } from './animal';
import { createGrassView } from './grassView';
import { createStats, createAnimalStats } from './stats';
import { createSimulationClock, simulationConfig } from './simulation';
import { createWeatherView } from './weatherView';

export function attachEcosystem(scene: Scene, waterMeshes: Mesh[], updateLandscape: (time:number,rain:number)=>void) {
  const config = { ...simulationConfig };
  // Development-only visual scenarios; production always starts from normal defaults.
  const preview = import.meta.env.DEV ? new URLSearchParams(location.search).get('preview') : null;
  if (preview === 'night' || preview === 'rain' || preview === 'heat') {
    config.environment = { ...config.environment, startHour: preview === 'night' ? 22 : 14,
      clearSeconds: preview === 'rain' ? 0 : 10000,
      rainSeconds: 10000, transitionSeconds: 0 };
  }
  const herd = createHerd(config);
  const state = herd.world;
  const first=herd.members[0];
  if(preview==='death') {first.life.age=lifecycleConfig.senescenceDays*config.environment.daySeconds;first.health=0.1;}
  if(preview==='play') herd.members.slice(0,3).forEach(m=>{m.life.age=0; m.animal.hunger=20;m.animal.thirst=20;m.animal.heat=10;});
  if (preview === 'birth') {
    const mother=herd.members[2];
    mother.life.pregnancy=reproductionConfig.gestationDays*config.environment.daySeconds-0.5;
    mother.life.mateId=1;mother.animal.hunger=20;mother.animal.thirst=20;
  }
  if (preview === 'grazing') { first.animal.hunger = 85; first.animal.thirst = 10; }
  if (preview === 'heat') { first.animal.heat = 90; first.animal.thirst = 20; }
  if (preview === 'death' || preview === 'play' || preview === 'night' || preview === 'rain' || preview === 'heat' || preview === 'grazing' || preview === 'birth') {
    const notice = document.createElement('div');
    notice.className = 'preview-notice'; notice.textContent = `Development preview: ${preview}`;
    document.body.append(notice);
    scene.onDisposeObservable.add(() => notice.remove());
  }
  const animalShadow = softTexture(scene,'animal-contact-shadow');
  const animals = new Map<number,ReturnType<typeof createHerbivore>>();
  const badges = new Map<number,ReturnType<typeof createAnimalStats>>();
  const stats = createStats(config);
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
    updateGrassView(state.grass,state.time);
    updateLandscape(state.time,state.environment.rain);
    const living=new Set(herd.members.map(m=>m.id));
    const retained=new Set([...living,...herd.carcasses.map(b=>b.id)]);
    for(const [id,view] of animals) if(!retained.has(id)) {view.dispose();animals.delete(id);}
    for(const [id,badge] of badges) if(!living.has(id)) {badge.dispose();badges.delete(id);}
    for(const member of herd.members) {
      if(!animals.has(member.id)) animals.set(member.id,createHerbivore(scene,member.id,animalShadow,config));
      if(!badges.has(member.id)) badges.set(member.id,createAnimalStats(member.id,config));
      animals.get(member.id)!.update(member);
    }
    for(const body of herd.carcasses) {
      if(!animals.has(body.id)) animals.set(body.id,createHerbivore(scene,body.id,animalShadow,config));
      animals.get(body.id)!.corpse(body);
    }
    // Keep the bank fixed: colour/visibility reflects stock, not interaction geometry.
    waterMeshes.forEach((mesh, i) => {
      const stock = state.ponds[i].water;
      mesh.visibility = stock > 0 ? 0.35 + 0.65 * stock / config.ponds[i].capacity : 0;
    });
  });
  scene.onAfterRenderObservable.add(() => {
    const canvas = engine.getRenderingCanvas()!;
    const viewport = scene.activeCamera!.viewport.toGlobal(canvas.clientWidth, canvas.clientHeight);
    herd.members.forEach(member => {
      anchor.set(member.animal.x, 2.3*growthScale(member,config), member.animal.z);
      const screen = Vector3.Project(anchor, identity, scene.getTransformMatrix(), viewport);
      badges.get(member.id)!.update(member,screen.x,screen.y,
        screen.z>0 && screen.z<1 && screen.x>=0 && screen.x<=canvas.clientWidth && screen.y>=0 && screen.y<=canvas.clientHeight);
    });
    stats.update(state,herd.members,herd.solo,herd.births,herd.deaths,herd.carcasses.length);
  });
  scene.onDisposeObservable.add(() => {
    stats.dispose();
    animals.forEach(view=>view.dispose());
    animalShadow.dispose();
    badges.forEach(badge=>badge.dispose());
    document.removeEventListener('visibilitychange', onVisibility);
  });
}
