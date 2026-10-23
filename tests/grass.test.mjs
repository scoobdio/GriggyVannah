import test from 'node:test';
import assert from 'node:assert/strict';
import { grassPatches, updateGrass } from '../src/grass.ts';
import { simulationConfig as c, createSimulation, stepSimulation, graze, distance } from '../src/simulation.ts';
const tick = (s,config,seconds) => { for (let i=0;i<seconds*60;i++) stepSimulation(s,config,1/60); };
const mild = { ...c, thirstRate:0, heat:{...c.heat,seek:101}, environment:{...c.environment,clearSeconds:10000} };

test('moisture buffers dry spells; dry grass slowly withers and rain regrows bare patches', () => {
 const patch=grassPatches[0], stock={food:100,moisture:0.65};
 updateGrass(stock,patch,0,30); assert.equal(stock.food,100); assert.ok(stock.moisture<0.65);
 stock.moisture=0.1; updateGrass(stock,patch,0,10);
 assert.ok(Math.abs(stock.food-99.65)<1e-8);
 stock.food=0; updateGrass(stock,patch,1,10);
 assert.equal(stock.food,6); assert.ok(stock.moisture>0.1);
 stock.food=patch.capacity-0.01; stock.moisture=0.99; updateGrass(stock,patch,1,10);
 assert.equal(stock.food,patch.capacity); assert.equal(stock.moisture,1);
 stock.food=0.01;stock.moisture=0;updateGrass(stock,patch,0,10);
 assert.equal(stock.food,0);assert.equal(stock.moisture,0);
});
test('grazing checks range and access, conserves food and bounds hunger', () => {
 const s=createSimulation(c);s.targetGrass=0;s.animal.hunger=55;
 assert.equal(graze(s,c,5),0);
 Object.assign(s.animal,c.grass[0]);
 for(const amount of [0,-1,NaN,Infinity]) assert.equal(graze(s,c,amount),0);
 assert.equal(graze(s,{...c,grass:c.grass.map(p=>({...p,accessible:false}))},5),0);
 const before=s.grass.map(p=>p.food);
 assert.equal(graze(s,c,100),10);assert.equal(s.animal.hunger,15);
 assert.equal(s.grass[0].food,before[0]-10); assert.equal(s.grass[1].food,before[1]);
 s.animal.hunger=100;s.grass[0].food=0.5;
 assert.equal(graze(s,c,10),0.5);assert.equal(s.grass[0].food,0);
});
test('hungry animal arrives, grazes, and resumes activity in a short run', () => {
 const s=createSimulation(mild);s.animal.thirst=10;s.animal.hunger=80;
 let grazed=false;
 for(let i=0;i<60*20;i++) {
  stepSimulation(s,mild,1/60);
  if(s.animal.behaviour==='Grazing') {grazed=true;assert.ok(distance(s.animal,c.grass[s.targetGrass])<=c.grass[s.targetGrass].radius);}
  assert.ok(s.animal.hunger>=0&&s.animal.hunger<=100);
 }
 assert.ok(grazed);assert.ok(s.animal.hunger<30);assert.ok(s.grass.some((p,i)=>p.food<c.grass[i].capacity));
});
test('thirst interrupts grazing; unavailable food waits and resumes after rain', () => {
 const s=createSimulation(mild);s.animal.thirst=10;s.animal.hunger=80;
 tick(s,mild,5);s.animal.thirst=90;stepSimulation(s,mild,1/60);
 assert.equal(s.animal.behaviour,'Seeking water');
 const empty=createSimulation(mild);empty.animal.thirst=10;empty.animal.hunger=80;
 empty.grass.forEach(p=>p.food=0);tick(empty,mild,2);
 assert.equal(empty.animal.behaviour,'Waiting for grass');
 const wet={...mild,environment:{...mild.environment,clearSeconds:0,transitionSeconds:0}};
 tick(empty,wet,8);assert.notEqual(empty.animal.behaviour,'Waiting for grass');
 const blocked={...mild,grass:c.grass.map(p=>({...p,accessible:false}))};
 const b=createSimulation(blocked);b.animal.thirst=10;b.animal.hunger=80;tick(b,blocked,2);
 assert.equal(b.animal.behaviour,'Waiting for grass');
});
test('hot sun interrupts feeding for shade', () => {
 const hot={...c,environment:{...c.environment,startHour:14,clearSeconds:10000}};
 const s=createSimulation(hot);s.animal.behaviour='Grazing';s.targetGrass=0;
 Object.assign(s.animal,{x:c.grass[0].x,z:c.grass[0].z,heat:90,thirst:10,hunger:80});
 stepSimulation(s,hot,1/60);assert.equal(s.animal.behaviour,'Seeking shade');
});
