import { simulationConfig } from './simulation.ts';
import type { SimulationConfig } from './simulation.ts';

export interface Setting { path:string; label:string; description:string; group:string; min:number; max:number; step:number; restart:boolean }
const field=(group:string,path:string,label:string,description:string,min:number,max:number,step:number,restart=false):Setting=>
  ({group,path,label,description,min,max,step,restart});
export const settingFields:Setting[]=[
  field('Animal needs','thirstRate','Thirst gain','Need points gained per simulated second.',0,2,0.01),
  field('Animal needs','hunger.rate','Hunger gain','Need points gained per simulated second.',0,2,0.01),
  field('Animal needs','heat.gain','Heat gain','Base exposure heating; peak sunshine multiplies this.',0,5,0.1),
  field('Animal needs','heat.peakMultiplier','Peak heat boost','Multiplier during the hottest hours.',1,12,0.5),
  field('Animal needs','drinkRate','Drinking speed','Water units consumed per simulated second.',0.1,10,0.1),
  field('Animal needs','hunger.eatRate','Grazing speed','Grass units consumed per simulated second.',0.01,2,0.01),
  field('Animal needs','heat.cooling','Shade cooling','Heat points lost per simulated second in shade.',0.1,10,0.1),
  field('Weather and resources','environment.daySeconds','Day length (seconds)','Seconds of running simulation per day.',60,3600,10,true),
  field('Weather and resources','environment.clearSeconds','Dry spell (seconds)','Clear interval between rain showers.',0,3600,10,true),
  field('Weather and resources','environment.rainSeconds','Rain duration (seconds)','Length of each shower.',10,600,5,true),
  field('Weather and resources','environment.rainfallRate','Pond refill','Water units per second per pond at full rain.',0,40,0.5),
  field('Weather and resources','environment.evaporationRate','Peak evaporation','Water units lost per second per pond at peak sunshine.',0,5,0.01),
  field('Weather and resources','grassRates.rainGrowthRate','Grass growth','Food units regrown per second at full rain.',0,5,0.05),
  field('Weather and resources','grassRates.witherRate','Grass withering','Food units lost per second once soil is dry.',0,1,0.005),
  field('Life cycles','reproduction.maturityDays','Maturity (days)','Age when calves become adults.',1,10,0.5,true),
  field('Life cycles','reproduction.gestationDays','Pregnancy (days)','Time before a healthy mother can give birth.',0.5,20,0.5,true),
  field('Life cycles','reproduction.recoveryDays','Birth recovery (days)','Delay before a mother can conceive again.',0.5,20,0.5,true),
  field('Life cycles','lifecycle.graceSeconds','Need grace (seconds)','Continuous severe need tolerated before health damage.',1,120,1,true),
  field('Life cycles','lifecycle.damagePerSecond','Need damage','Health lost per second for each prolonged severe need.',0,5,0.05),
  field('Life cycles','lifecycle.recoveryPerSecond','Health recovery','Maximum health restored per second when comfortable.',0,3,0.05),
  field('Life cycles','lifecycle.recoveryStopsDays','Recovery stops (days)','Age when health regeneration reaches zero.',2,100,1,true),
  field('Life cycles','lifecycle.senescenceDays','Old-age decline (days)','Age when irreversible health decline begins.',3,150,1,true),
  field('Play','play.speedMultiplier','Chase speed','Multiplier of normal walking speed while playing.',1,2,0.05),
  field('Play','play.periodSeconds','Play interval (seconds)','Time between the starts of play bouts.',10,240,1),
  field('Play','play.durationSeconds','Play duration (seconds)','Length of each bout; must not exceed its interval.',0,60,1),
];
export type SettingsValues=Record<string,number>;
export const storageKey='griggyvannah.settings.v1';
function read(c:SimulationConfig,path:string):number {
  let value:unknown=c;
  for(const key of path.split('.')) value=(value as Record<string,unknown>)[key];
  return value as number;
}
function write(c:SimulationConfig,path:string,value:number) {
  const parts=path.split('.');let target=c as unknown as Record<string,unknown>;
  for(const key of parts.slice(0,-1)) target=target[key] as Record<string,unknown>;
  target[parts[parts.length-1]]=value;
}
export const defaultSettings=():SettingsValues=>Object.fromEntries(settingFields.map(f=>[f.path,read(simulationConfig,f.path)]));
export function validateSettings(values:SettingsValues):string|null {
  for(const f of settingFields) if(!Number.isFinite(values[f.path]) || values[f.path]<f.min || values[f.path]>f.max)
    return `${f.label} must be between ${f.min} and ${f.max}.`;
  if(values['lifecycle.recoveryStopsDays']<=values['reproduction.maturityDays']) return 'Recovery must stop after maturity.';
  if(values['lifecycle.senescenceDays']<values['lifecycle.recoveryStopsDays']) return 'Old-age decline must start at or after recovery stops.';
  if(values['play.durationSeconds']>values['play.periodSeconds']) return 'Play duration must not exceed its interval.';
  return null;
}
export function decodeSettings(raw:string|null):SettingsValues {
  if(!raw) return defaultSettings();
  try {
    const saved=JSON.parse(raw);
    if(saved.version!==1 || !saved.values || typeof saved.values!=='object') return defaultSettings();
    const values=defaultSettings();
    for(const f of settingFields) if(Object.hasOwn(saved.values,f.path)) values[f.path]=saved.values[f.path];
    return validateSettings(values)?defaultSettings():values;
  } catch {return defaultSettings();}
}
export function applySettings(c:SimulationConfig,values:SettingsValues,includeRestart=false) {
  const error=validateSettings(values);if(error) throw new Error(error);
  for(const f of settingFields) if(includeRestart || !f.restart) write(c,f.path,values[f.path]);
}
export function needsRestart(c:SimulationConfig,values:SettingsValues) {
  return settingFields.some(f=>f.restart && read(c,f.path)!==values[f.path]);
}
