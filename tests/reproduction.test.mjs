import test from 'node:test';
import assert from 'node:assert/strict';
import { reproductionConfig as r } from '../src/config.ts';
import { simulationConfig as c, distance, insideGround, clearRoute } from '../src/simulation.ts';
import { createHerd, stepHerd, updateSocialTargets } from '../src/herd.ts';
import { updateReproduction, growthScale, isAdult } from '../src/reproduction.ts';
const pair=()=>{const h=createHerd(c,2);h.members.forEach(s=>{s.animal.hunger=20;s.animal.thirst=20;s.animal.heat=20;});return h;};
const breed=h=>updateReproduction(h.members,c,()=>h.nextId++);
const due=h=>{h.members[0].life.pregnancy=r.gestationDays*c.environment.daySeconds;h.members[0].life.mateId=1;};
test('healthy nearby adults conceive, gestation does not produce an immediate calf',()=>{
 const h=pair();assert.equal(breed(h),0);assert.equal(h.members[0].life.pregnancy,0);
 assert.equal(h.members[0].life.mateId,1);assert.equal(h.members.length,2);
 stepHerd(h,c,1/60);assert.ok(h.members[0].life.pregnancy>0);assert.equal(h.members.length,2);
});
test('no conception without a suitable nearby mature awake partner',()=>{
 for(const change of [h=>h.members[1].animal.x=100,h=>h.members[1].life.sex='female',
 h=>h.members[0].life.age=0,h=>h.members[1].life.age=0,h=>h.members[0].animal.hunger=80,
 h=>h.members[1].animal.thirst=80,h=>h.members[0].animal.heat=80,h=>h.members[0].animal.behaviour='Sleeping',
 h=>h.members[0].life.nextMateAt=100]) {
  const h=pair();change(h);breed(h);assert.equal(h.members[0].life.pregnancy,null);
 }
});
test('birth adds one uniquely identified calf, shares stocks and applies maternal recovery',()=>{
 const h=pair();due(h);const water=h.members[0].ponds.map(p=>p.water);
 assert.equal(breed(h),1);const [mother,,calf]=h.members;
 assert.equal(calf.id,2);assert.equal(calf.life.motherId,mother.id);assert.equal(calf.life.fatherId,1);
 assert.equal(calf.life.age,0);assert.equal(calf.time,mother.time);
 assert.equal(calf.ponds,mother.ponds);assert.equal(calf.grass,mother.grass);
 assert.deepEqual(calf.ponds.map(p=>p.water),water);
 assert.ok(insideGround(calf.animal,c));assert.ok(clearRoute(mother.animal,calf.animal,c));assert.ok(distance(mother.animal,calf.animal)>1.3);
 assert.equal(mother.animal.hunger,20+r.birthHungerCost);assert.equal(mother.animal.thirst,20+r.birthThirstCost);
 assert.equal(mother.life.nextMateAt,mother.time+r.recoveryDays*c.environment.daySeconds);
 assert.equal(breed(h),0);assert.equal(h.members.length,3);assert.equal(mother.life.pregnancy,null);
});
test('birth is deferred while mother is stressed or safe space is unavailable',()=>{
 const h=pair();due(h);h.members[0].animal.thirst=90;assert.equal(breed(h),0);assert.notEqual(h.members[0].life.pregnancy,null);
 h.members[0].animal.thirst=20;
 assert.equal(updateReproduction(h.members,{...c,ground:{width:2,depth:2}},()=>h.nextId++),0);
 assert.notEqual(h.members[0].life.pregnancy,null);assert.equal(breed(h),1);
});
test('calves grow into adults, follow nearby mothers and do not roam solo',()=>{
 const h=pair();due(h);breed(h);const calf=h.members[2];
 assert.equal(growthScale(calf,c),0.55);assert.equal(isAdult(calf,c),false);
 updateSocialTargets(h,c);assert.equal(h.solo[2],false);assert.ok(distance(calf.roamTarget,h.members[0].animal)<2.01);
 calf.life.age=r.maturityDays*c.environment.daySeconds-0.01;stepHerd(h,c,1/60);
 assert.equal(isAdult(calf,c),true);assert.equal(growthScale(calf,c),1);
});
test('birth through herd tick keeps time aligned and weather replenishment once per tick',()=>{
 const wet={...c,environment:{...c.environment,clearSeconds:0,transitionSeconds:0}};
 const h=pair();due(h);h.nextBreedingAt=0;h.members[0].ponds[0].water=100;
 stepHerd(h,wet,1/60);assert.equal(h.members.length,3);assert.equal(h.births,1);assert.equal(h.solo.length,3);
 assert.ok(h.members.every(s=>s.time===h.members[0].time));
 assert.ok(Math.abs(h.members[0].ponds[0].water-(100+wet.environment.rainfallRate/60))<1e-8);
});
