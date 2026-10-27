import test from 'node:test';
import assert from 'node:assert/strict';
import { applySettings, defaultSettings, decodeSettings, needsRestart, validateSettings } from '../src/settings.ts';
import { simulationConfig, createSimulation, stepSimulation, updateWorldResources } from '../src/simulation.ts';
import { createHerd, updateSocialTargets } from '../src/herd.ts';
import { updateLife } from '../src/lifecycle.ts';
const config=()=>structuredClone(simulationConfig);
test('saved values round-trip; corrupt, unknown-version and unsafe settings fall back',()=>{
 const values=defaultSettings();values.thirstRate=0.6;
 assert.deepEqual(decodeSettings(JSON.stringify({version:1,values})),values);
 for(const raw of ['{','null',JSON.stringify({version:2,values}),JSON.stringify({version:1,values:{thirstRate:-1}}),JSON.stringify({version:1,values:{thirstRate:'1'}})])
  assert.deepEqual(decodeSettings(raw),defaultSettings());
 assert.equal(validateSettings({...values,'play.durationSeconds':60,'play.periodSeconds':10}),'Play duration must not exceed its interval.');
 assert.ok(validateSettings({...values,'lifecycle.recoveryStopsDays':2}));
});
test('live apply preserves ages and clock, restart applies timings without mutating defaults',()=>{
 const c=config(),values=defaultSettings(),s=createSimulation(c);values.thirstRate=0;
 values['environment.daySeconds']=600;values['reproduction.maturityDays']=5;
 applySettings(c,values);assert.equal(c.thirstRate,0);assert.equal(c.environment.daySeconds,300);assert.ok(needsRestart(c,values));
 const age=s.life.age;stepSimulation(s,c,1);assert.equal(s.animal.thirst,55);assert.equal(s.life.age,age);
 applySettings(c,values,true);assert.equal(c.environment.daySeconds,600);assert.equal(createSimulation(c).life.age,3000);
 assert.equal(needsRestart(c,values),false);assert.equal(simulationConfig.environment.daySeconds,300);assert.equal(simulationConfig.thirstRate,0.35);
 applySettings(c,defaultSettings(),true);assert.deepEqual(c,simulationConfig);
});
test('live grass, health and play tuning reaches simulation logic',()=>{
 const c=config(),v=defaultSettings();v['grassRates.rainGrowthRate']=2;v['lifecycle.damagePerSecond']=2;v['play.durationSeconds']=0;applySettings(c,v);
 const s=createSimulation(c);s.grass[0].food=0;s.environment.rain=1;updateWorldResources(s,c,1);assert.equal(s.grass[0].food,2);
 s.animal.thirst=100;s.deprivation.thirst=15;updateLife(s,c,1);assert.equal(s.health,98);
 const h=createHerd(c,2);h.members.forEach(m=>{m.life.age=0;m.animal.thirst=20;m.animal.hunger=20;});updateSocialTargets(h,c);assert.ok(h.members.every(m=>m.playRole===null));
});
