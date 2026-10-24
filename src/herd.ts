import { createSimulation, stepSimulation, planRoute, clearRoute, insideGround, distance } from './simulation.ts';
import type { Simulation, SimulationConfig, Point } from './simulation.ts';

export const herdConfig = { count: 7, groupRadius: 5, soloSeconds: 20, socialPeriod: 160, rethinkSeconds: 4 };
export interface Herd { members: Simulation[]; solo: boolean[]; nextSocialAt: number; tick: number }
export function createHerd(c: SimulationConfig, count = herdConfig.count): Herd {
  const members = Array.from({length:count},(_,id) => {
    const s = createSimulation(c); s.id = id;
    s.animal.x -= (id%3)*1.8; s.animal.z -= Math.floor(id/3)*1.8;
    s.animal.thirst = 30+id*5; s.animal.hunger = 20+id*7;
    s.roamSequence = id*11;
    return s;
  });
  for (const member of members) { member.ponds = members[0].ponds; member.grass = members[0].grass; }
  return {members,solo:members.map(()=>false),nextSocialAt:0,tick:0};
}
export function updateSocialTargets(herd: Herd, c: SimulationConfig) {
  const time = herd.members[0].time;
  herd.solo = herd.members.map((_,i) => (time+i*23)%herdConfig.socialPeriod < herdConfig.soloSeconds);
  herd.members.forEach((s,i) => {
    const neighbours=herd.members.filter((other,j)=>j!==i && distance(s.animal,other.animal)<=c.perception.radius);
    let centre:Point={...s.animal};
    if(neighbours.length) {
      centre=neighbours.reduce((p,m)=>({x:p.x+m.animal.x,z:p.z+m.animal.z}),{x:0,z:0});
      centre.x/=neighbours.length;centre.z/=neighbours.length;
      s.lastGroup={...centre,seenAt:time};
      s.socialMode=herd.solo[i]?'Exploring':'With herd';
    } else if(!herd.solo[i] && s.lastGroup && time-s.lastGroup.seenAt<c.perception.memorySeconds && distance(s.animal,s.lastGroup)>3) {
      centre=s.lastGroup;s.socialMode='Rejoining';
    } else { s.socialMode=herd.solo[i]?'Exploring':'Searching for herd'; }
    const searching=s.socialMode==='Searching for herd';
    const angle=i*2.399963+(searching?Math.floor(time/herdConfig.rethinkSeconds)*2.399963:Math.floor(time/herdConfig.socialPeriod)*0.9);
    const radius=herd.solo[i]?20:searching?12:s.socialMode==='Rejoining'?0:herdConfig.groupRadius;
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
  if (!Number.isFinite(dt) || dt <= 0 || !herd.members.length) return;
  if (herd.members[0].time >= herd.nextSocialAt) {
    updateSocialTargets(herd,c); herd.nextSocialAt = herd.members[0].time + herdConfig.rethinkSeconds;
  }
  const positions = herd.members.map(s=>({x:s.animal.x,z:s.animal.z}));
  // Rotate first access to shared stocks; weather advances exactly once per world tick.
  const first = herd.tick++ % herd.members.length;
  for (let offset=0;offset<herd.members.length;offset++) {
    const index = (first+offset)%herd.members.length, s = herd.members[index];
    s.companions = herd.members.filter((m,i)=>i!==index && distance(s.animal,m.animal)<=c.perception.radius)
      .map(m=>m.animal.behaviour === 'Seeking water' ? m.edge :
        (m.animal.behaviour === 'Seeking grass' || m.animal.behaviour === 'Seeking shade') && m.travelRoute.length ? m.travelRoute[m.travelRoute.length-1] : m.animal);
    stepSimulation(s,c,dt,offset===0);
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
}
