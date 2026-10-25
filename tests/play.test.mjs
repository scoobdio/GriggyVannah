import test from 'node:test';
import assert from 'node:assert/strict';
import { createHerd, updateSocialTargets, stepHerd } from '../src/herd.ts';
import { simulationConfig, distance, clearRoute, insideGround } from '../src/simulation.ts';
const c={...simulationConfig,home:{x:-40,z:-40}};
const calves=()=>{const h=createHerd(c,3);h.members.forEach(s=>{s.life.age=0;s.animal.thirst=20;s.animal.hunger=20;s.animal.heat=10;});return h;};
test('calves chase specific peers, leave a gap and take turns leading',()=>{
 const h=calves();updateSocialTargets(h,c);
 assert.deepEqual(h.members.map(s=>s.playRole),['Leading','Chasing','Chasing']);
 assert.equal(h.members[1].playTargetId,0);assert.equal(h.members[2].playTargetId,1);
 assert.ok(distance(h.members[1].roamTarget,h.members[0].animal)>=1.39);
 const target={...h.members[1].roamTarget};h.members[0].animal.z+=2;
 h.world.time=0.5;updateSocialTargets(h,c);assert.notDeepEqual(h.members[1].roamTarget,target);
 h.world.time=6;updateSocialTargets(h,c);assert.equal(h.members[1].playRole,'Leading');
 h.world.time=12;updateSocialTargets(h,c);assert.ok(h.members.every(s=>s.playRole===null));
});
test('play excludes distressed, adult, sleeping and distant partners',()=>{
 for(const change of [s=>s.animal.thirst=90,s=>s.animal.hunger=90,s=>s.animal.heat=90,
  s=>s.health=20,s=>s.life.age=99999,s=>s.animal.behaviour='Sleeping',s=>s.animal.x=100]) {
  const h=calves();h.members=h.members.slice(0,2);change(h.members[1]);updateSocialTargets(h,c);
  assert.equal(h.members[0].playRole,null);assert.equal(h.members[0].playTargetId,null);
 }
});
test('a short chase moves calves safely and urgent thirst interrupts it',()=>{
 const h=calves();const initial=h.members.map(s=>({...s.animal}));
 for(let i=0;i<120;i++) {
  const before=h.members.map(s=>({...s.animal}));stepHerd(h,c,1/60);
  h.members.forEach((s,j)=>{assert.ok(insideGround(s.animal,c));assert.ok(clearRoute(before[j],s.animal,c));});
 }
 assert.ok(h.members.every((s,i)=>distance(s.animal,initial[i])>1));
 h.members[1].animal.thirst=95;stepHerd(h,c,1/60);
 assert.notEqual(h.members[1].animal.behaviour,'Roaming');
 h.world.time=h.nextSocialAt;stepHerd(h,c,1/60);assert.equal(h.members[1].playRole,null);
});
