import { createSimulation, observeResources, insideGround, clearRoute, distance } from './simulation.ts';
import type { Simulation, SimulationConfig, Point } from './simulation.ts';

export const isAdult = (s:Simulation,c:SimulationConfig) => s.life.age >= c.reproduction.maturityDays*c.environment.daySeconds;
export function growthScale(s:Simulation,c:SimulationConfig) {
  return 0.55+0.45*Math.min(1,s.life.age/(c.reproduction.maturityDays*c.environment.daySeconds));
}
const comfortable = (s:Simulation,limit:number) =>
  s.health>=60 && s.animal.thirst<limit && s.animal.hunger<limit && s.animal.heat<limit;
function birthPosition(mother:Simulation,members:Simulation[],c:SimulationConfig):Point|undefined {
  for(let ring=0;ring<3;ring++) for(let i=0;i<16;i++) {
    const angle=i*Math.PI/8+mother.id*0.7, radius=1.7+ring*0.7;
    const p={x:mother.animal.x+Math.cos(angle)*radius,z:mother.animal.z+Math.sin(angle)*radius};
    if(insideGround(p,c) && clearRoute(mother.animal,p,c) &&
      members.every(m=>distance(m.animal,p)>1.3)) return p;
  }
}
// Called on a bounded schedule by the herd, after normal needs/movement have updated.
export function updateReproduction(members:Simulation[],c:SimulationConfig,allocateId:()=>number) {
  const births:Simulation[]=[];
  const time=members[0]?.time ?? 0;
  const ready=(s:Simulation) => isAdult(s,c) && time>=s.life.nextMateAt &&
    comfortable(s,c.reproduction.conceptionNeedLimit) &&
    ['Resting','Roaming','Cooling in shade'].includes(s.animal.behaviour);
  for(const mother of members) {
    if(mother.life.sex!=='female') continue;
    if(mother.life.pregnancy !== null) {
      if(mother.life.pregnancy<c.reproduction.gestationDays*c.environment.daySeconds || !comfortable(mother,c.reproduction.birthNeedLimit)) continue;
      const position=birthPosition(mother,[...members,...births],c);
      if(!position) continue; // Retain the pregnancy and retry; never spawn inside an obstacle.
      const calf=createSimulation({...c,home:position});calf.id=allocateId();
      calf.time=time;calf.environment={...mother.environment};
      calf.ponds=mother.ponds;calf.grass=mother.grass;
      calf.life={sex:calf.id%2===0?'female':'male',age:0,pregnancy:null,
        motherId:mother.id,fatherId:mother.life.mateId,mateId:null,nextMateAt:0};
      calf.animal.thirst=20;calf.animal.hunger=25;calf.animal.heat=Math.min(30,mother.animal.heat);
      calf.lastGroup={x:mother.animal.x,z:mother.animal.z,seenAt:time};
      calf.waterMemory={};calf.grassMemory={};calf.shadeMemory={};observeResources(calf,c);
      calf.roamSequence=calf.id*11;
      births.push(calf);
      mother.life.pregnancy=null;mother.life.mateId=null;
      mother.life.nextMateAt=time+c.reproduction.recoveryDays*c.environment.daySeconds;
      mother.animal.hunger=Math.min(100,mother.animal.hunger+c.reproduction.birthHungerCost);
      mother.animal.thirst=Math.min(100,mother.animal.thirst+c.reproduction.birthThirstCost);
      continue;
    }
    if(!ready(mother)) continue;
    const father=members.find(m=>m.life.sex==='male' && ready(m) &&
      distance(m.animal,mother.animal)<=Math.min(c.reproduction.mateRange,c.perception.radius) && clearRoute(mother.animal,m.animal,c));
    if(!father) continue;
    mother.life.pregnancy=0;mother.life.mateId=father.id;
    // Short courtship recovery for the male prevents one tick inseminating the whole herd.
    father.life.nextMateAt=time+0.25*c.environment.daySeconds;
  }
  members.push(...births);
  return births.length;
}
