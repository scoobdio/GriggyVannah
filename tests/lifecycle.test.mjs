import test from 'node:test';
import assert from 'node:assert/strict';
import { simulationConfig as c, createSimulation } from '../src/simulation.ts';
import { lifecycleConfig as l } from '../src/config.ts';
import { updateLife, createCarcass, consumeCarrion } from '../src/lifecycle.ts';
import { createHerd, stepHerd, updateSocialTargets } from '../src/herd.ts';
const healthy=()=>{const s=createSimulation(c);s.animal.thirst=20;s.animal.hunger=20;s.animal.heat=20;return s;};
test('needs have a continuous grace period, damage is bounded, relief resets exposure',()=>{
 const s=healthy();s.animal.thirst=100;updateLife(s,c,15);assert.equal(s.health,100);
 updateLife(s,c,1);assert.ok(Math.abs(s.health-99.4)<1e-8);
 s.animal.thirst=20;updateLife(s,c,1);assert.equal(s.deprivation.thirst,0);assert.ok(s.health>99.4);
 s.animal.thirst=100;updateLife(s,c,14);assert.ok(s.health>99.4);
 updateLife(s,c,1000);assert.equal(s.health,0);s.animal.thirst=0;updateLife(s,c,10);assert.equal(s.health,0);
});
test('calves resist need damage and health recovery slows then stops with age',()=>{
 const adult=healthy(),calf=healthy();calf.life.age=0;
 for(const s of [adult,calf]){s.animal.hunger=100;updateLife(s,c,16);}
 assert.ok(Math.abs((100-calf.health)*2-(100-adult.health))<1e-8);
 const young=healthy(),old=healthy(),elder=healthy();
 old.life.age=15*c.environment.daySeconds;elder.life.age=l.recoveryStopsDays*c.environment.daySeconds;
 for(const s of [young,old,elder]){s.health=50;updateLife(s,c,1);}
 assert.ok(young.health>old.health);assert.ok(old.health>elder.health);assert.equal(elder.health,50);
});
test('old-age death removes pregnancy, preserves a carcass, and extinction leaves weather running',()=>{
 const wet={...c,environment:{...c.environment,clearSeconds:0,transitionSeconds:0}};
 const h=createHerd(wet,1),s=h.members[0];s.health=0.1;s.life.age=l.senescenceDays*c.environment.daySeconds;s.life.pregnancy=99999;
 h.world.ponds[0].water=100;stepHerd(h,wet,1);
 assert.equal(h.members.length,0);assert.equal(h.births,0);assert.equal(h.deaths,1);assert.equal(h.carcasses.length,1);
 assert.equal(h.carcasses[0].cause,'Old age');const water=h.world.ponds[0].water;
 stepHerd(h,wet,1);assert.equal(h.world.time,2);assert.ok(h.world.ponds[0].water>water);
 h.world.time=h.carcasses[0].expiresAt-0.01;stepHerd(h,wet,0.02);assert.equal(h.carcasses.length,0);assert.equal(h.deaths,1);
});
test('carrion requires range and a valid request, is finite and expires',()=>{
 const s=healthy(),body=createCarcass(s,c),p={...s.animal};
 for(const amount of [-1,0,NaN,Infinity]) assert.equal(consumeCarrion(body,p,amount,0),0);
 assert.equal(consumeCarrion(body,{x:999,z:999},5,0),0);
 assert.equal(consumeCarrion(body,p,5,body.expiresAt),0);
 assert.equal(consumeCarrion(body,p,5,0),5);assert.equal(consumeCarrion(body,p,1000,0),35);assert.equal(body.meat,0);
});
test('young animals choose peers and play in daytime, needs and night suppress play',()=>{
 const h=createHerd(c,3);h.members.forEach(s=>{s.animal.thirst=20;s.animal.hunger=20;s.animal.heat=20;});
 h.members[1].life.age=0;h.members[2].life.age=0;
 h.members[1].life.motherId=0;h.members[2].life.motherId=0;
 updateSocialTargets(h,c);assert.equal(h.members[1].socialMode,'Playing');assert.equal(h.solo[1],false);
 assert.equal(h.members[1].lastGroup.x,h.members[2].animal.x);
 h.members[1].animal.thirst=90;updateSocialTargets(h,c);assert.notEqual(h.members[1].socialMode,'Playing');
 h.members[1].animal.thirst=20;h.members[1].environment.daylight=0;updateSocialTargets(h,c);assert.notEqual(h.members[1].socialMode,'Playing');
});
