import test from 'node:test';
import assert from 'node:assert/strict';
import { simulationConfig as c, createSimulation, stepSimulation } from '../src/simulation.ts';
import { createHerd, stepHerd } from '../src/herd.ts';
const tick=(s,config,seconds)=>{for(let i=0;i<seconds*60;i++)stepSimulation(s,config,1/60);};
const night={...c,environment:{...c.environment,startHour:23,daySeconds:100000}};
test('comfortable animals spend a short daytime interval without seeking a need',()=>{
 const s=createSimulation(c);s.animal.thirst=10;s.animal.hunger=15;
 tick(s,c,30);assert.ok(s.animal.thirst<21);assert.ok(s.animal.hunger<19);assert.equal(s.cycles,0);
});
test('grazing lasts tens of seconds while drinking remains quicker',()=>{
 const s=createSimulation(c);Object.assign(s.animal,{x:c.grass[0].x,z:c.grass[0].z,hunger:55,thirst:10,behaviour:'Grazing'});s.targetGrass=0;
 tick(s,c,20);assert.equal(s.animal.behaviour,'Grazing');assert.ok(s.animal.hunger>40&&s.animal.hunger<42);
 const w=createSimulation(c);Object.assign(w.animal,{x:c.ponds[0].x+c.ponds[0].radius+c.edgeOffset,z:c.ponds[0].z,thirst:60,behaviour:'Drinking'});
 tick(w,c,3);assert.equal(w.animal.behaviour,'Drinking');tick(w,c,5);assert.equal(w.cycles,1);
});
test('herd sleeps still at night with reduced needs and wakes at dawn',()=>{
 const h=createHerd(night);stepHerd(h,night,1/60);const positions=h.members.map(s=>({...s.animal}));
 for(let i=0;i<600;i++)stepHerd(h,night,1/60);
 h.members.forEach((s,i)=>{assert.equal(s.animal.behaviour,'Sleeping');assert.equal(s.animal.x,positions[i].x);assert.equal(s.animal.z,positions[i].z);assert.ok(s.animal.thirst-positions[i].thirst<0.71);});
 const dawn={...night,environment:{...night.environment,startHour:6}};
 stepSimulation(h.members[0],dawn,1/60);assert.notEqual(h.members[0].animal.behaviour,'Sleeping');
});
test('urgent thirst wakes a sleeper, finishes recovery, then returns to sleep',()=>{
 const s=createSimulation(night);s.animal.behaviour='Sleeping';s.animal.thirst=90;s.animal.hunger=15;
 stepSimulation(s,night,1/60);assert.equal(s.animal.behaviour,'Seeking water');
 tick(s,night,20);assert.ok(s.cycles>0);assert.equal(s.animal.behaviour,'Sleeping');
});
test('urgent hunger wakes a sleeper and missing food waits safely',()=>{
 const s=createSimulation(night);s.animal.behaviour='Sleeping';s.animal.hunger=90;s.animal.thirst=10;
 stepSimulation(s,night,1/60);assert.equal(s.animal.behaviour,'Seeking grass');
 s.grass.forEach(p=>p.food=0);tick(s,night,2);assert.equal(s.animal.behaviour,'Waiting for grass');assert.ok(s.nightRecovery);
});
