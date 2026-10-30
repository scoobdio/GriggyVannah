import test from 'node:test';
import assert from 'node:assert/strict';
import {createHerd,stepHerd} from '../src/herd.ts';
import {simulationConfig as defaults,clearRoute,distance,isShaded} from '../src/simulation.ts';
const c={...defaults,environment:{...defaults.environment,startHour:22,daySeconds:100000,clearSeconds:1000}};
const tick=(h,c,seconds)=>{for(let i=0;i<seconds*60;i++)stepHerd(h,c,1/60);};
test('herd travels to separated shared canopy beds, then sleeps without drifting',()=>{
 const h=createHerd(c);stepHerd(h,c,1/60);
 assert.ok(h.members.every(s=>s.animal.behaviour==='Gathering to sleep'));
 const beds=h.members.map(s=>({...s.sleepTarget}));
 for(let i=0;i<30*60;i++) {
  const before=h.members.map(s=>({...s.animal}));stepHerd(h,c,1/60);
  h.members.forEach((s,j)=>assert.ok(clearRoute(before[j],s.animal,c)));
 }
 h.members.forEach((s,i)=>{
  assert.equal(s.animal.behaviour,'Sleeping');assert.ok(isShaded(s.animal,c));
  assert.ok(distance(s.animal,beds[i])<0.06);
  h.members.forEach((other,j)=>{if(i!==j) assert.ok(distance(s.animal,other.animal)>=1.5);});
 });
 tick(h,c,2);assert.deepEqual(h.members.map(s=>s.sleepTarget),beds);
 const dawn={...c,environment:{...c.environment,startHour:6}};stepHerd(h,dawn,1/60);
 assert.equal(h.sleepCamp,null);assert.ok(h.members.every(s=>s.sleepTarget===null && s.animal.behaviour!=='Sleeping'));
});
test('urgent thirst interrupts gathering and animal returns to its reserved bed',()=>{
 const h=createHerd(c);stepHerd(h,c,1/60);const s=h.members[0],bed={...s.sleepTarget};
 s.animal.thirst=90;stepHerd(h,c,1/60);assert.equal(s.animal.behaviour,'Seeking water');
 tick(h,c,40);assert.ok(s.cycles>0);assert.deepEqual(s.sleepTarget,bed);
 assert.equal(s.animal.behaviour,'Sleeping');assert.ok(distance(s.animal,bed)<0.06);
});
test('rainy nights still gather at the shared camp; no trees uses a safe open camp',()=>{
 for(const config of [{...c,environment:{...c.environment,clearSeconds:0,transitionSeconds:0}}, {...c,shades:[]}]) {
  const h=createHerd(config);tick(h,config,30);
  assert.ok(h.members.every(s=>s.animal.behaviour==='Sleeping'));
  assert.ok(h.members.every(s=>distance(s.animal,h.sleepCamp.centre)<8));
 }
});
