import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, simulationConfig as c, observeResources, findWater, stepSimulation, distance } from '../src/simulation.ts';
import { createHerd, updateSocialTargets, stepHerd } from '../src/herd.ts';
const config={...c,home:{x:0,z:0},perception:{radius:6,memorySeconds:30,interval:1},shades:[],grass:[],
 ponds:[{...c.ponds[0],id:'test-pool',x:18,z:0,radius:2}]};
test('resources outside sight are unknown, boundaries discover, and memory expires',()=>{
 const s=createSimulation(config);assert.equal(findWater(s,config),undefined);
 s.animal.x=12;observeResources(s,config);assert.ok(findWater(s,config));
 s.animal.x=0;s.ponds[0].water=0;
 assert.ok(findWater(s,config),'memory keeps last observed stock, not remote live stock');
 s.animal.x=12;observeResources(s,config);assert.equal(findWater(s,config),undefined);
 s.ponds[0].water=100;observeResources(s,config);s.animal.x=0;s.time=31;observeResources(s,config);
 assert.equal(findWater(s,config),undefined);assert.equal(Object.keys(s.waterMemory).length,0);
});
test('local search discovers unknown water and completes recovery',()=>{
 const search={...config,ponds:[{...config.ponds[0],x:Math.cos(2.399963)*17,z:Math.sin(2.399963)*17}]};
 const s=createSimulation(search);s.animal.thirst=90;
 for(let i=0;i<60*25;i++)stepSimulation(s,search,1/60);
 assert.ok(s.cycles>0);assert.ok(s.waterMemory['test-pool']);
});
test('distant animals do not affect local grouping; isolation follows a last-seen group',()=>{
 const local={...c,home:{x:-30,z:-30}};const h=createHerd(local,3);
 h.world.time=30;h.members.forEach(s=>s.time=h.world.time);h.members[2].animal.x=100;h.members[2].animal.z=100;
 updateSocialTargets(h,local);
 assert.ok(distance(h.members[0].lastGroup,h.members[1].animal)<0.001);
 assert.equal(h.members[2].socialMode,'Searching for herd');
 const memory={...h.members[0].lastGroup};h.members[0].animal.x=-90;h.members[0].animal.z=-90;
 updateSocialTargets(h,local);assert.equal(h.members[0].socialMode,'Rejoining');
 assert.ok(distance(h.members[0].roamTarget,memory)<0.001);
});
test('visible grazers reserve different nearby feeding spots',()=>{
 const local={...c,home:{x:-6,z:0},heat:{...c.heat,seek:101}};const h=createHerd(local,2);
 h.members.forEach(s=>{s.animal.hunger=80;s.animal.thirst=10;});
 stepHerd(h,local,1/60);
 const ends=h.members.map(s=>s.travelRoute.at(-1));
 assert.ok(ends.every(Boolean));assert.ok(distance(ends[0],ends[1])>1.5);
});
test('food discovery is local and remembered patches can be revisited',()=>{
 const local={...config,grass:[{...c.grass[0],x:30,z:0}],ponds:[]};
 const s=createSimulation(local);s.animal.hunger=90;s.animal.thirst=0;
 stepSimulation(s,local,1/60);assert.equal(s.animal.behaviour,'Waiting for grass');
 s.animal.x=24;s.animal.z=0;observeResources(s,local);
 s.animal.x=0;s.grassRetryAt=0;stepSimulation(s,local,1/60);
 assert.equal(s.animal.behaviour,'Seeking grass');assert.equal(s.targetGrass,0);
});
test('visible shade seekers choose spaced canopy spots',()=>{
 const hot={...c,environment:{...c.environment,startHour:14,clearSeconds:10000}};
 const h=createHerd(hot,2);h.members.forEach(s=>{s.animal.heat=90;s.animal.thirst=10;});
 stepHerd(h,hot,1/60);
 assert.ok(h.members.every(s=>s.animal.behaviour==='Seeking shade'));
 const targets=h.members.map(s=>s.travelRoute.at(-1));assert.ok(distance(targets[0],targets[1])>1.5);
});
