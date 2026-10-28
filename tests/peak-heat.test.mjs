import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, simulationConfig as c, stepSimulation, peakHeatStrength, isShaded } from '../src/simulation.ts';
const hot={...c,environment:{...c.environment,startHour:14,daySeconds:100000,clearSeconds:10000}};
const tick=(s,config,seconds)=>{for(let i=0;i<seconds*60;i++)stepSimulation(s,config,1/60);};
test('heat boost peaks at 14:00 and fades outside the afternoon',()=>{
 assert.equal(peakHeatStrength(14),1);assert.equal(peakHeatStrength(11),0);assert.equal(peakHeatStrength(17),0);
 assert.ok(Math.abs(peakHeatStrength(13)-peakHeatStrength(15))<1e-9);
 const config={...hot,shades:[],roaming:false};const boosted=createSimulation(config),baseline=createSimulation(config);
 boosted.animal.thirst=10;baseline.animal.thirst=10;
 tick(boosted,config,5);tick(baseline,{...config,heat:{...config.heat,peakMultiplier:1}},5);
 assert.ok(boosted.animal.heat-baseline.animal.heat>15);
});
test('animal seeks shade early and stays sheltered for most of a short peak-hour run',()=>{
 const s=createSimulation(hot);s.animal.thirst=10;s.animal.hunger=15;
 let sheltered=0;
 for(let i=0;i<60*60;i++) {stepSimulation(s,hot,1/60);if(isShaded(s.animal,hot))sheltered+=1/60;}
 assert.ok(sheltered>40,`${sheltered} seconds in shade`);
 assert.equal(s.animal.behaviour,'Cooling in shade');
 s.animal.heat=20;stepSimulation(s,hot,1/60);assert.equal(s.animal.behaviour,'Cooling in shade');
 stepSimulation(s,{...hot,environment:{...hot.environment,startHour:18}},1/60);
 assert.notEqual(s.animal.behaviour,'Cooling in shade');
});
test('urgent thirst interrupts peak shelter and rain changes cooling into rain shelter',()=>{
 const s=createSimulation(hot);s.animal.thirst=10;tick(s,hot,35);
 s.animal.thirst=90;stepSimulation(s,hot,1/60);assert.equal(s.animal.behaviour,'Seeking water');
 const wet=createSimulation(hot);wet.animal.thirst=10;tick(wet,hot,35);
 stepSimulation(wet,{...hot,environment:{...hot.environment,clearSeconds:0,transitionSeconds:0}},1/60);
 assert.equal(wet.animal.behaviour,'Sheltering from rain');
});
