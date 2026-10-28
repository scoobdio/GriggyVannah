import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation,stepSimulation,simulationConfig as defaults,isShaded,distance,clearRoute } from '../src/simulation.ts';
const c={...defaults,home:{x:-40,z:-40},shades:[{id:'shelter',x:-35,z:-40,radius:3,accessible:true}],
 thirstRate:0,hunger:{...defaults.hunger,rate:0},environment:{...defaults.environment,startHour:12,daySeconds:100000,clearSeconds:0,rainSeconds:1000,transitionSeconds:0}};
const animal=()=>{const s=createSimulation(c);s.animal.thirst=20;s.animal.hunger=20;return s;};
const tick=(s,c,seconds)=>{for(let i=0;i<seconds*60;i++)stepSimulation(s,c,1/60);};
test('rain sends a comfortable animal to safe tree shelter and keeps it resting',()=>{
 const s=animal();stepSimulation(s,c,1/60);assert.equal(s.animal.behaviour,'Seeking shelter');
 for(let i=0;i<600;i++){const p={...s.animal};stepSimulation(s,c,1/60);assert.ok(clearRoute(p,s.animal,c));}
 assert.equal(s.animal.behaviour,'Sheltering from rain');assert.ok(isShaded(s.animal,c));
 const p={...s.animal};tick(s,c,2);assert.equal(distance(p,s.animal),0);
 const dry={...c,environment:{...c.environment,clearSeconds:1000}};stepSimulation(s,dry,1/60);
 assert.notEqual(s.animal.behaviour,'Sheltering from rain');assert.equal(s.rainSheltering,false);
});
test('urgent needs interrupt shelter, and recovery continues below the urgent threshold',()=>{
 for(const need of ['thirst','hunger']) {
  const s=animal();tick(s,c,3);s.animal[need]=90;stepSimulation(s,c,1/60);
  assert.ok(s.rainRecovery);assert.ok(!['Sheltering from rain','Seeking shelter'].includes(s.animal.behaviour));
  s.animal[need]=70;stepSimulation(s,c,1/60);assert.ok(s.rainRecovery);assert.notEqual(s.animal.behaviour,'Seeking shelter');
  s.animal[need]=10;s.animal.behaviour='Resting';stepSimulation(s,c,1/60);assert.equal(s.rainRecovery,false);
  assert.ok(['Seeking shelter','Sheltering from rain'].includes(s.animal.behaviour));
 }
});
test('rain wakes exposed sleepers to relocate and sheltered animals sleep at night',()=>{
 const night={...c,environment:{...c.environment,startHour:23}};const s=animal();s.animal.behaviour='Sleeping';
 stepSimulation(s,night,1/60);assert.equal(s.animal.behaviour,'Seeking shelter');tick(s,night,4);
 assert.equal(s.animal.behaviour,'Sleeping');assert.ok(isShaded(s.animal,night));
});
test('missing or inaccessible shelter does not trap animals in shelter travel',()=>{
 for(const shades of [[],c.shades.map(shade=>({...shade,accessible:false}))]) {
  const s=animal(),config={...c,shades};tick(s,config,2);
  assert.notEqual(s.animal.behaviour,'Seeking shelter');assert.equal(s.shadeId,null);
 }
});
test('light drizzle thresholds avoid repeatedly entering and leaving shelter',()=>{
 const ramp={...c,environment:{...c.environment,transitionSeconds:10}};const s=animal();
 s.time=1;stepSimulation(s,ramp,1/60);assert.equal(s.rainSheltering,false);
 s.time=4;stepSimulation(s,ramp,1/60);assert.equal(s.rainSheltering,true);
 s.time=2;stepSimulation(s,ramp,1/60);assert.equal(s.rainSheltering,true);
 s.time=0.5;stepSimulation(s,ramp,1/60);assert.equal(s.rainSheltering,false);
});
