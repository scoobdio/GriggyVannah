import test from 'node:test';
import { herdConfig } from '../src/herd.ts';
import assert from 'node:assert/strict';
import { createSimulation, simulationConfig as c, stepSimulation, findWater, clearRoute, drink } from '../src/simulation.ts';

test('full shared reserves cover at least seven conservative rainless days for the herd', () => {
 const s=createSimulation(c);
 assert.equal(s.ponds.length,3);
 const dailyDrink = herdConfig.count*c.thirstRate/c.hydrationPerWater*c.environment.daySeconds;
 const dailyEvap = c.ponds.length*c.environment.evaporationRate*c.environment.daySeconds*3/24;
 c.ponds.forEach((p,i)=>assert.equal(s.ponds[i].water,p.capacity));
 const capacity=c.ponds.reduce((sum,p)=>sum+p.capacity,0);
 const days=(capacity-herdConfig.count*100/c.hydrationPerWater)/(dailyDrink+dailyEvap);
 assert.ok(days>=7,`${days} conservative herd days`);
});
test('selection switches to each remaining reachable pool and never routes through a pond', () => {
 const visible={...c,perception:{...c.perception,radius:Infinity}};
 const s=createSimulation(visible); const selected=[];
 for(let i=0;i<c.ponds.length;i++) {
  const choice=findWater(s,visible); assert.ok(choice,'Expected a reachable stocked pond');
  assert.ok(!selected.includes(choice.index)); selected.push(choice.index);
  let start=s.animal;
  choice.route.forEach(point=> { assert.ok(clearRoute(start,point,c)); start=point; });
  s.ponds[choice.index].water=0;
 }
 assert.equal(findWater(s,visible),undefined);
});
test('drinking affects only the selected pond and rejects distant requests', () => {
 const s=createSimulation(c); const choice=findWater(s,c);
 s.targetPond=choice.index;
 const before=s.ponds.map(p=>p.water);
 assert.equal(drink(s,c,10),0);
 Object.assign(s.animal,choice.edge);
 assert.equal(drink(s,c,10),10);
 s.ponds.forEach((p,i)=>assert.equal(p.water,before[i]-(i===choice.index?10:0)));
});
test('brief normal run completes drinking and keeps independent stocks bounded', () => {
 const s=createSimulation(c);
 for(let i=0;i<60*30;i++) stepSimulation(s,c,1/60);
 assert.ok(s.cycles>0);
 s.ponds.forEach((p,i)=>assert.ok(p.water>0 && p.water<=c.ponds[i].capacity));
});
test('unavailable ponds wait safely and rainfall refills all stocks without overflow', () => {
 const blocked={...c,ponds:c.ponds.map(p=>({...p,accessible:false}))};
 const s=createSimulation(blocked);s.animal.thirst=100;
 stepSimulation(s,blocked,1/60);assert.equal(s.animal.behaviour,'Waiting for water');
 const wet={...c,environment:{...c.environment,clearSeconds:0,transitionSeconds:0}};
 s.ponds.forEach(p=>p.water=0);
 for(let i=0;i<60*10;i++) stepSimulation(s,wet,1/60);
 s.ponds.forEach(p=>assert.ok(p.water>0));
 s.ponds.forEach((p,i)=>p.water=c.ponds[i].capacity-0.01);
 stepSimulation(s,wet,1/60);
 s.ponds.forEach((p,i)=>assert.ok(p.water<=c.ponds[i].capacity));
});
