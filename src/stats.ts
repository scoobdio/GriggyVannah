import { isAdult } from './reproduction';
import type { Simulation, SimulationConfig } from './simulation';

export function createStats(config:SimulationConfig) {
  const ponds=config.ponds;
  const panel = document.createElement('aside');
  panel.className = 'water-stats';
  panel.innerHTML = '<strong>Watering holes</strong><span class="water-value"></span><meter min="0" aria-label="Available pond water"></meter><span class="cycles"></span>';
  const grassSupply = document.createElement('span'); grassSupply.className = 'grass-supply'; panel.append(grassSupply);
  const population=document.createElement('span');population.className='grass-supply';panel.append(population);
  const weather = document.createElement('aside');
  weather.className = 'environment-stats';
  weather.setAttribute('aria-label', 'Environment');
  weather.innerHTML = '<strong class="world-time"></strong><span class="weather-description"></span><span class="temperature"></span>';
  document.body.append(panel, weather);
  const worldTime = weather.querySelector<HTMLElement>('.world-time')!;
  const weatherDescription = weather.querySelector<HTMLElement>('.weather-description')!;
  const temperature = weather.querySelector<HTMLElement>('.temperature')!;
  const waterValue = panel.querySelector<HTMLElement>('.water-value')!;
  const waterMeter = panel.querySelector('meter')!;
  const cycles = panel.querySelector<HTMLElement>('.cycles')!;
  const capacity = ponds.reduce((sum, pond) => sum + pond.capacity, 0);
  waterMeter.max = capacity;
  const supplies = document.createElement('div'); panel.append(supplies);
  const rows = ponds.map(pond => {
    const row = document.createElement('div'); row.className = 'pond-supply';
    row.textContent = pond.name; supplies.append(row); return row;
  });
  let previous = '';
  return {
    update(s: Simulation, members: Simulation[], solo: boolean[], births:number, deaths:number, bodies:number) {
      const calves=members.filter(m=>!isAdult(m,config)).length;
      const pregnant=members.filter(m=>m.life.pregnancy!==null).length;
      const food = Math.round(s.grass.reduce((sum,patch) => sum+patch.food,0));
      const completed = members.reduce((sum,m)=>sum+m.cycles,0);
      const wanderers = solo.filter(Boolean).length;
      const water = Math.round(s.ponds.reduce((sum, pond) => sum + pond.water, 0));
      const e = s.environment;
      const minutes = Math.floor(e.hour * 60);
      const clock = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      const description = e.rain > 0 ? 'Rain' : e.daylight > 0.01 ? 'Sunshine' : 'Clear night';
      const degrees = e.temperature.toFixed(1);
      const flow = e.rainfall > 0 ? `Rain filling +${e.rainfall.toFixed(2)}/s`
        : e.evaporation > 0 ? `Evaporating −${e.evaporation.toFixed(2)}/s` : 'No weather inflow or loss';
      const key = `${members.length}/${calves}/${pregnant}/${births}/${deaths}/${bodies}/${food}/${water}/${completed}/${clock}/${e.day}/${description}/${degrees}/${flow}/${wanderers}/${s.ponds.map(p=>Math.round(p.water))}`;
      if (key === previous) return;
      previous = key;
      document.body.classList.toggle('night', e.daylight < 0.2);
      worldTime.textContent = `Day ${e.day} · ${clock}`;
      weatherDescription.textContent = description;
      temperature.textContent = `${degrees} °C`;
      population.textContent = `${members.length-calves} adults · ${calves} ${calves===1?'calf':'calves'} · ${pregnant} pregnant · ${births} ${births===1?'birth':'births'} · ${deaths} deaths · ${bodies} carcasses`;
      grassSupply.textContent = `Grass: ${food} · Herd: ${members.length} · Solo: ${wanderers}`;
      waterValue.textContent = `${water} / ${capacity} total water · ${flow} per pond`;
      waterMeter.value = water;
      rows.forEach((row, i) => { row.textContent = `${ponds[i].name}: ${Math.round(s.ponds[i].water)} / ${ponds[i].capacity}`; });
      cycles.textContent = `${completed} drinking cycles completed`;
    },
    dispose() { panel.remove(); weather.remove(); document.body.classList.remove('night'); },
  };
}

// One fixed inspector; no per-animal DOM or screen-position updates.
export function createAnimalStats(config:SimulationConfig,onClose:()=>void) {
  const panel=document.createElement('aside');panel.className='animal-stats';
  panel.setAttribute('aria-label','Selected animal');
  const hint=document.createElement('span');hint.textContent='Click an animal to inspect it';
  const content=document.createElement('div');content.hidden=true;
  const close=document.createElement('button');close.type='button';close.textContent='×';
  close.setAttribute('aria-label','Clear animal selection');close.onclick=onClose;
  const title=document.createElement('strong');
  const life=document.createElement('span');life.className='animal-life';
  const behaviour=document.createElement('span');behaviour.className='behaviour';
  content.append(close,title,life,behaviour);
  const bars=['Thirst','Hunger','Heat','Health'].map((name,i)=>{
    const row=document.createElement('label'),value=document.createElement('span');
    value.className='stat-value';row.append(name,value);
    const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.className=`need-${i}`;
    meter.setAttribute('aria-label',`${name}: higher means ${i===3?'better health':'greater need'}`);
    row.append(meter);content.append(row);return {value,meter};
  });
  const note=document.createElement('small');note.textContent='Higher needs mean discomfort. Higher health is better.';content.append(note);
  panel.append(hint,content);document.body.append(panel);
  let previous='';
  return {
    update(s:Simulation|undefined) {
      content.hidden=!s;hint.hidden=!!s;
      if(!s) {previous='';return;}
      const values=[s.animal.thirst,s.animal.hunger,s.animal.heat,s.health].map(Math.round);
      const age=(s.life.age/config.environment.daySeconds).toFixed(1);
      const activity=s.animal.behaviour==='Roaming'?s.socialMode:s.animal.behaviour;
      const key=`${s.id}/${age}/${s.life.pregnancy!==null}/${activity}/${values}`;
      if(key===previous) return;previous=key;
      title.textContent=`Herbivore ${s.id+1}`;
      life.textContent=`${isAdult(s,config)?'Adult':'Calf'} ${s.life.sex} · ${age} days${s.life.pregnancy!==null?' · Pregnant':''}`;
      behaviour.textContent=activity;
      bars.forEach((bar,i)=>{bar.value.textContent=`${values[i]}%`;bar.meter.value=values[i];});
    },
    dispose(){panel.remove();},
  };
}
