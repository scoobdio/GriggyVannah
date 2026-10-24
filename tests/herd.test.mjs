import test from 'node:test';
import assert from 'node:assert/strict';
import { grassConfig } from '../src/grass.ts';
import { createHerd, stepHerd, updateSocialTargets, herdConfig } from '../src/herd.ts';
import { simulationConfig as c, distance, clearRoute, stepSimulation } from '../src/simulation.ts';

test('seven individual animals share resources; weather advances once per tick',()=>{
 const config={...c,thirstRate:0,hunger:{...c.hunger,rate:0},environment:{...c.environment,clearSeconds:0,transitionSeconds:0}};
 const herd=createHerd(config);assert.equal(herd.members.length,7);
 herd.members[0].ponds.forEach(p=>p.water=100);
 herd.members[0].grass.forEach(p=>p.food=50);
 for(const s of herd.members) {assert.equal(s.ponds,herd.members[0].ponds);assert.equal(s.grass,herd.members[0].grass);s.animal.thirst=0;s.animal.hunger=0;}
 stepHerd(herd,config,0.1);
 assert.ok(Math.abs(herd.members[0].ponds[0].water-(100+config.environment.rainfallRate*0.1))<1e-8);
 assert.ok(Math.abs(herd.members[0].grass[0].food-(50+grassConfig.rainGrowthRate*0.1))<1e-8);
 herd.members.forEach(s=>assert.equal(s.time,0.1));
});
test('herd mostly groups, with bounded solo periods and subsequent regroup targets',()=>{
 const herd=createHerd(c);updateSocialTargets(herd,c);
 assert.ok(herd.solo.filter(Boolean).length>0);assert.ok(herd.solo.filter(Boolean).length<=2);
 assert.ok(distance(herd.members[0].animal,herd.members[0].roamTarget)>10);
 herd.members.forEach(s=>s.time=herdConfig.soloSeconds+1);updateSocialTargets(herd,c);
 assert.equal(herd.solo[0],false);assert.ok(distance(herd.members[0].animal,herd.members[0].roamTarget)<10);
});
test('short herd run preserves stock bounds, safe movement and completes multiple drinks',()=>{
 const herd=createHerd(c);herd.members.forEach(s=>s.animal.thirst=65);
 for(let tick=0;tick<60*35;tick++) {
  const previous=herd.members.map(s=>({...s.animal}));stepHerd(herd,c,1/60);
  herd.members.forEach((s,i)=>{
   assert.ok(clearRoute(previous[i],s.animal,c));
   for(const need of [s.animal.thirst,s.animal.hunger,s.animal.heat]) assert.ok(need>=0&&need<=100);
  });
 }
 assert.ok(herd.members.filter(s=>s.cycles>0).length>=5);
 herd.members[0].ponds.forEach((p,i)=>assert.ok(p.water>=0&&p.water<=c.ponds[i].capacity));
 herd.members[0].grass.forEach((p,i)=>assert.ok(p.food>=0&&p.food<=c.grass[i].capacity));
});
test('competing grazers consume only remaining shared food',()=>{
 const config={...c,thirstRate:0,hunger:{...c.hunger,rate:0},heat:{...c.heat,seek:101}};
 const herd=createHerd(config,2);herd.members[0].grass[0].food=0.5;
 for(const s of herd.members) {Object.assign(s.animal,{x:c.grass[0].x,z:c.grass[0].z,hunger:80,thirst:0,behaviour:'Grazing'});s.targetGrass=0;}
 // Direct animal steps isolate consumption from weather and social steering.
 for(const s of herd.members) stepSimulation(s,config,2,false);
 assert.equal(herd.members[0].grass[0].food,0);
 assert.equal(herd.members.reduce((sum,s)=>sum+80-s.animal.hunger,0),2);
});
