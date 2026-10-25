import { environmentAt } from './environment.ts';
import { updateLife, createCarcass } from './lifecycle.ts';
import type { Carcass } from './lifecycle.ts';
import { isAdult, updateReproduction } from './reproduction.ts';
import { createSimulation, updateWorldResources, stepSimulation, planRoute, clearRoute, insideGround, distance } from './simulation.ts';
import type { Simulation, SimulationConfig, Point } from './simulation.ts';

export const herdConfig = { count: 7, groupRadius: 5, soloSeconds: 20, socialPeriod: 160, rethinkSeconds: 4 };
export interface Herd { world:Simulation; carcasses:Carcass[]; deaths:number; members: Simulation[]; solo: boolean[]; nextSocialAt: number; tick: number; nextId:number; births:number; nextBreedingAt:number }
export function createHerd(c: SimulationConfig, count = herdConfig.count): Herd {
  const members = Array.from({length:count},(_,id) => {
    const s = createSimulation(c); s.id = id;s.life.sex=id%2===0?'female':'male';
    s.animal.x -= (id%3)*1.8; s.animal.z -= Math.floor(id/3)*1.8;
    s.animal.thirst = 30+id*5; s.animal.hunger = 20+id*7;
    s.roamSequence = id*11;
    return s;
  });
  const world=createSimulation(c);
  for (const member of members) { member.ponds = world.ponds; member.grass = world.grass; }
  return {world,carcasses:[],deaths:0,members,solo:members.map(()=>false),nextSocialAt:0,tick:0,nextId:count,births:0,nextBreedingAt:1};
}
export function updateSocialTargets(herd: Herd, c: SimulationConfig) {
  const time = herd.world.time;
  herd.solo = herd.members.map((m,i) => isAdult(m,c) && (time+i*23)%herdConfig.socialPeriod < herdConfig.soloSeconds);
  herd.members.forEach((s,i) => {
    let neighbours=herd.members.filter((other,j)=>j!==i && distance(s.animal,other.animal)<=c.perception.radius);
    const mother=neighbours.find(m=>m.id===s.life.motherId);
    const peers=neighbours.filter(m=>!isAdult(m,c));
    const playful=!isAdult(s,c) && peers.length>0 && s.health>=60 &&
      Math.max(s.animal.hunger,s.animal.thirst,s.animal.heat)<55 && s.environment.daylight>0.2;
    if(!isAdult(s,c)) { if(playful) neighbours=peers; else if(mother) neighbours=[mother]; }
    const playing=playful && time%40<12;
    let centre:Point={...s.animal};
    if(neighbours.length) {
      centre=neighbours.reduce((p,m)=>({x:p.x+m.animal.x,z:p.z+m.animal.z}),{x:0,z:0});
      centre.x/=neighbours.length;centre.z/=neighbours.length;
      s.lastGroup={...centre,seenAt:time};
      s.socialMode=playing?'Playing':herd.solo[i]?'Exploring':'With herd';
    } else if(!herd.solo[i] && s.lastGroup && time-s.lastGroup.seenAt<c.perception.memorySeconds && distance(s.animal,s.lastGroup)>3) {
      centre=s.lastGroup;s.socialMode='Rejoining';
    } else { s.socialMode=herd.solo[i]?'Exploring':'Searching for herd'; }
    const searching=s.socialMode==='Searching for herd';
    const angle=i*2.399963+(playing?Math.floor(time/4)*1.7:0)+(searching?Math.floor(time/herdConfig.rethinkSeconds)*2.399963:Math.floor(time/herdConfig.socialPeriod)*0.9);
    const radius=herd.solo[i]?20:searching?12:s.socialMode==='Rejoining'?0:!isAdult(s,c)?2:herdConfig.groupRadius;
    const target={x:centre.x+Math.cos(angle)*radius,z:centre.z+Math.sin(angle)*radius};
    target.x = Math.max(-c.ground.width/2+2,Math.min(c.ground.width/2-2,target.x));
    target.z = Math.max(-c.ground.depth/2+2,Math.min(c.ground.depth/2-2,target.z));
    const route = planRoute(s.animal,target,c);
    // Keep the last safe social destination if a new one falls inside an obstacle.
    if (!route) return;
    s.roamTarget = target;
    if (s.animal.behaviour === 'Roaming') s.travelRoute = route;
  });
}
export function stepHerd(herd: Herd, c: SimulationConfig, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  herd.world.time+=dt;
  herd.world.environment=environmentAt(herd.world.time,c.environment);
  updateWorldResources(herd.world,c,dt);
  herd.carcasses=herd.carcasses.filter(body=>herd.world.time<body.expiresAt && body.meat>0);
  if (herd.world.time >= herd.nextSocialAt) {
    updateSocialTargets(herd,c); herd.nextSocialAt = herd.world.time + herdConfig.rethinkSeconds;
  }
  const positions = herd.members.map(s=>({x:s.animal.x,z:s.animal.z}));
  // Rotate first access to shared stocks; weather advances exactly once per world tick.
  const first = herd.members.length ? herd.tick++ % herd.members.length : 0;
  for (let offset=0;offset<herd.members.length;offset++) {
    const index = (first+offset)%herd.members.length, s = herd.members[index];
    s.companions = herd.members.filter((m,i)=>i!==index && distance(s.animal,m.animal)<=c.perception.radius)
      .map(m=>m.animal.behaviour === 'Seeking water' ? m.edge :
        (m.animal.behaviour === 'Seeking grass' || m.animal.behaviour === 'Seeking shade') && m.travelRoute.length ? m.travelRoute[m.travelRoute.length-1] : m.animal);
    stepSimulation(s,c,dt,false);
    updateLife(s,c,dt);
  }
  // Gentle local separation, bounded by walkable ground and the next route segment.
  herd.members.forEach((s,i) => {
    const push: Point = {x:0,z:0};
    positions.forEach((p,j) => {
      if (i===j) return;
      const d = distance(s.animal,p);
      if (d>0.001 && d<1.3) { push.x += (s.animal.x-p.x)/d*(1.3-d); push.z += (s.animal.z-p.z)/d*(1.3-d); }
    });
    const target = {x:s.animal.x+push.x*dt*2,z:s.animal.z+push.z*dt*2};
    const next = s.animal.behaviour === 'Seeking water' ? s.waterRoute[0] : s.animal.behaviour.startsWith('Waiting') ? s.searchRoute[0] : s.travelRoute[0];
    if (s.animal.behaviour === 'Sleeping' || s.animal.behaviour === 'Drinking' || s.animal.behaviour === 'Grazing' || s.animal.behaviour === 'Cooling in shade') return;
    if (insideGround(target,c) && clearRoute(s.animal,target,c) && (!next || clearRoute(target,next,c))) {
      s.animal.x=target.x;s.animal.z=target.z;
    }
  });
  const survivors:Simulation[]=[];const solo:boolean[]=[];
  herd.members.forEach((s,i)=>{
    if(s.health<=0) {herd.carcasses.push(createCarcass(s,c));herd.deaths++;herd.nextSocialAt=0;}
    else {survivors.push(s);solo.push(herd.solo[i]);}
  });
  herd.members=survivors;herd.solo=solo;
  if(herd.world.time>=herd.nextBreedingAt) {
    const births=updateReproduction(herd.members,c,()=>herd.nextId++);
    herd.births+=births;
    if(births) {herd.solo.push(...Array(births).fill(false));herd.nextSocialAt=0;}
    herd.nextBreedingAt=herd.world.time+1;
  }

}
