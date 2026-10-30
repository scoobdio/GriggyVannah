import { clearRoute, distance, insideGround, planRoute } from './simulation.ts';
import type { Point, Simulation, SimulationConfig } from './simulation.ts';

export interface SleepCamp { centre:Point; radius:number }
// A shared nightly decision; individual movement and urgent needs remain independent.
export function chooseSleepCamp(members:Simulation[],c:SimulationConfig):SleepCamp {
  const centre=members.reduce((p,s)=>({x:p.x+s.animal.x,z:p.z+s.animal.z}),{x:0,z:0});
  centre.x/=Math.max(1,members.length);centre.z/=Math.max(1,members.length);
  const known=c.shades.filter(shade=>shade.accessible && members.some(s=>
    s.shadeMemory[shade.id]!==undefined && s.time-s.shadeMemory[shade.id]<c.perception.memorySeconds));
  // Prefer room for the herd, then proximity. A few overflow beds may sit outside shade.
  known.sort((a,b)=>(distance(a,centre)+Math.max(0,members.length-a.radius*a.radius)*10)-
    (distance(b,centre)+Math.max(0,members.length-b.radius*b.radius)*10));
  for(const shade of known) {
    for(const s of members) {
      const edge={x:shade.x+shade.radius*0.7,z:shade.z};
      if(planRoute(s.animal,edge,c)) return {centre:{x:shade.x,z:shade.z},radius:shade.radius};
    }
  }
  return {centre:{x:centre.x,z:centre.z},radius:5};
}
export function assignSleepSpots(members:Simulation[],c:SimulationConfig,camp:SleepCamp) {
  const occupied=members.flatMap(s=>s.sleepTarget?[s.sleepTarget]:[]);
  for(const s of members) {
    if(s.sleepTarget) continue;
    // Fixed separated beds stay stable when another animal wakes, dies or returns.
    const candidates:Point[]=[];
    for(let ring=1;ring<=12;ring++) {
      const radius=ring*1.7, count=Math.floor(2*Math.PI*radius/1.8);
      for(let i=0;i<count;i++) {
        const angle=i/count*Math.PI*2;
        candidates.push({x:camp.centre.x+Math.cos(angle)*radius,z:camp.centre.z+Math.sin(angle)*radius});
      }
    }
    candidates.sort((a,b)=>{
      const score=(p:Point)=>distance(p,camp.centre)*3+distance(p,s.animal)+(distance(p,camp.centre)>camp.radius?20:0);
      return score(a)-score(b);
    });
    const spot=candidates.find(p=>insideGround(p,c) && clearRoute(p,p,c) &&
      occupied.every(other=>distance(p,other)>=1.6) && planRoute(s.animal,p,c));
    // A stranded animal can rest safely rather than endlessly pursuing an impossible bed.
    s.sleepTarget=spot??{x:s.animal.x,z:s.animal.z};occupied.push(s.sleepTarget);
  }
}
