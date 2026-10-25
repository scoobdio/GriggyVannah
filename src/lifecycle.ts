import { lifecycleConfig as l, reproductionConfig as r } from './config.ts';
import { growthScale, isAdult } from './reproduction.ts';
import { distance } from './simulation.ts';
import type { Simulation, SimulationConfig, Point } from './simulation.ts';
export interface Carcass { id:number; animal:Simulation; diedAt:number; expiresAt:number; meat:number; initialMeat:number; cause:'Unmet needs'|'Old age' }
export function updateLife(s:Simulation,c:SimulationConfig,dt:number) {
  if(!Number.isFinite(dt) || dt<=0 || s.health<=0) return;
  const previousAge=s.life.age;
  s.life.age+=dt;
  if(s.life.pregnancy!==null) s.life.pregnancy+=dt;
  let damage=0;
  for(const need of ['thirst','hunger','heat'] as const) {
    const before=s.deprivation[need];
    s.deprivation[need]=s.animal[need]>=l.criticalNeed?before+dt:0;
    if(s.deprivation[need]>0) damage+=Math.max(0,s.deprivation[need]-l.graceSeconds)-Math.max(0,before-l.graceSeconds);
  }
  damage*=l.damagePerSecond*(isAdult(s,c)?1:l.calfDamageMultiplier);
  const oldSeconds=Math.max(0,s.life.age-l.senescenceDays*c.environment.daySeconds)-Math.max(0,previousAge-l.senescenceDays*c.environment.daySeconds);
  damage+=oldSeconds*l.senescenceDamagePerSecond;
  const mature=r.maturityDays*c.environment.daySeconds, stop=l.recoveryStopsDays*c.environment.daySeconds;
  const recovery=Math.max(0,Math.min(1,(stop-s.life.age)/(stop-mature)));
  const comfortable=[s.animal.thirst,s.animal.hunger,s.animal.heat].every(n=>n<l.recoveryNeedLimit);
  s.health=Math.max(0,Math.min(100,s.health-damage+(comfortable?l.recoveryPerSecond*recovery*dt:0)));
}
export function createCarcass(s:Simulation,c:SimulationConfig):Carcass {
  const meat=l.adultMeat*growthScale(s,c)**3;
  return {id:s.id,animal:s,diedAt:s.time,expiresAt:s.time+l.carcassSeconds,meat,initialMeat:meat,
    cause:s.life.age>=l.senescenceDays*c.environment.daySeconds?'Old age':'Unmet needs'};
}
// Future predators use the same stock: consumption is finite and requires proximity.
export function consumeCarrion(carcass:Carcass,position:Point,request:number,time:number) {
  if(!Number.isFinite(request) || request<=0 || !Number.isFinite(time) || time<carcass.diedAt || time>=carcass.expiresAt || distance(position,carcass.animal.animal)>2) return 0;
  const amount=Math.min(request,carcass.meat);carcass.meat-=amount;return amount;
}
