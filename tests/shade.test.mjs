import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, stepSimulation, simulationConfig as base, isShaded, shadeSpot, distance, clearRoute } from '../src/simulation.ts';
const hot = { ...base, thirstRate:0, environment:{ ...base.environment, startHour:14, daySeconds:100000, clearSeconds:10000 } };
function tick(s,c,seconds) { for(let i=0;i<seconds*60;i++) stepSimulation(s,c,1/60); }

test('hot animal arrives in shade without overshooting, cools and resumes activity', () => {
 const s=createSimulation(hot); s.animal.heat=80; s.animal.thirst=20;
 let cooling=false;
 for(let i=0;i<60*30;i++) {
  stepSimulation(s,hot,1/60);
  assert.ok(s.animal.heat>=0 && s.animal.heat<=100);
  assert.ok(distance(s.animal,hot.pond)>=hot.pond.radius);
  if(s.animal.behaviour==='Cooling in shade') {
   cooling=true;
   assert.ok(isShaded(s.animal,hot));
   const shade=hot.shades.find(x=>x.id===s.shadeId);
   assert.ok(distance(s.animal,shadeSpot(shade))<1e-8);
  }
  if(cooling && s.animal.behaviour==='Returning') {
   assert.ok(s.animal.heat<=hot.heat.comfortable); return;
  }
 }
 assert.fail('Did not finish cooling');
});
test('urgent thirst interrupts shade when water exists; empty water allows cooling', () => {
 const s=createSimulation(hot); s.animal.heat=90; s.animal.thirst=100;
 stepSimulation(s,hot,1/60); assert.equal(s.animal.behaviour,'Seeking shade');
 s.water=50; stepSimulation(s,hot,1/60);
 assert.equal(s.animal.behaviour,'Seeking water'); assert.equal(s.shadeId,null);
 tick(s,hot,15); assert.ok(s.cycles>0);
});
test('rain and night reduce heat without triggering shade seeking', () => {
 for(const environment of [
  {...hot.environment,clearSeconds:0,rainSeconds:1000,transitionSeconds:0},
  {...hot.environment,startHour:2.5},
 ]) {
  const c={...hot,environment}; const s=createSimulation(c);
  s.animal.heat=90; s.animal.thirst=20;
  tick(s,c,5);
  assert.ok(s.animal.heat<90); assert.equal(s.shadeId,null);
 }
});
test('unavailable or unsafe shade does not cause endless travel or block drinking', () => {
 for(const shades of [[],hot.shades.map(x=>({...x,accessible:false})),[
  {id:'unsafe',x:hot.pond.x,z:hot.pond.z,radius:1,accessible:true},
 ]]) {
  const c={...hot,shades}; const s=createSimulation(c);
  s.animal.heat=100; s.animal.thirst=20;
  tick(s,c,5); assert.equal(s.shadeId,null); assert.equal(distance(s.animal,c.home),0);
  s.water=50; s.animal.thirst=100; tick(s,c,10); assert.ok(s.cycles>0);
 }
});
test('shade boundaries are explicit and paths cannot cross pond or trunks', () => {
 const shade=hot.shades[0];
 assert.ok(isShaded({x:shade.x+shade.radius,z:shade.z},hot));
 assert.ok(!isShaded({x:shade.x+shade.radius+0.01,z:shade.z},hot));
 assert.ok(!clearRoute({x:-10,z:1},{x:10,z:1},hot));
 assert.ok(!clearRoute({x:shade.x-3,z:shade.z},{x:shade.x+3,z:shade.z},hot));
});
test('several days preserve heat bounds and both drinking and cooling occur', () => {
 const s=createSimulation(base); let cool=false;
 for(let i=0;i<600*60;i++) {
  stepSimulation(s,base,1/60);
  cool ||= s.animal.behaviour==='Cooling in shade';
  assert.ok(s.animal.heat>=0 && s.animal.heat<=100);
  assert.ok(distance(s.animal,base.pond)>=base.pond.radius);
 }
 assert.ok(cool); assert.ok(s.cycles>3);
});
