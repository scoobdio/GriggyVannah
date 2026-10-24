import type { PondConfig } from './config';
import type { Simulation } from './simulation';

export function createStats(ponds: PondConfig[]) {
  const panel = document.createElement('aside');
  panel.className = 'water-stats';
  panel.innerHTML = '<strong>Watering holes</strong><span class="water-value"></span><meter min="0" aria-label="Available pond water"></meter><span class="cycles"></span>';
  const legend = document.createElement('div'); legend.className = 'need-legend';
  legend.innerHTML = '<span>Thirst</span> · <span>Hunger</span> · <span>Heat</span>'; panel.append(legend);
  const grassSupply = document.createElement('span'); grassSupply.className = 'grass-supply'; panel.append(grassSupply);
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
    update(s: Simulation, members: Simulation[], solo: boolean[]) {
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
      const key = `${food}/${water}/${completed}/${clock}/${e.day}/${description}/${degrees}/${flow}/${wanderers}/${s.ponds.map(p=>Math.round(p.water))}`;
      if (key === previous) return;
      previous = key;
      document.body.classList.toggle('night', e.daylight < 0.2);
      worldTime.textContent = `Day ${e.day} · ${clock}`;
      weatherDescription.textContent = description;
      temperature.textContent = `${degrees} °C`;
      grassSupply.textContent = `Grass: ${food} · Herd: ${members.length} · Solo: ${wanderers}`;
      waterValue.textContent = `${water} / ${capacity} total water · ${flow} per pond`;
      waterMeter.value = water;
      rows.forEach((row, i) => { row.textContent = `${ponds[i].name}: ${Math.round(s.ponds[i].water)} / ${ponds[i].capacity}`; });
      cycles.textContent = `${completed} drinking cycles completed`;
    },
    dispose() { panel.remove(); weather.remove(); document.body.classList.remove('night'); },
  };
}

// One small badge per animal: behaviour plus three narrow need bars.
export function createAnimalStats(id: number) {
  const label = document.createElement('div'); label.className = 'herd-badge';
  const caption = document.createElement('span'); label.append(caption);
  const bars = ['Thirst','Hunger','Heat'].map((name,i) => {
    const meter = document.createElement('meter'); meter.min=0;meter.max=100;
    meter.className = `need-${i}`; meter.setAttribute('aria-label',`${name}: higher means greater need`);
    label.append(meter); return meter;
  });
  document.body.append(label);
  return {
    update(s: Simulation, solo: boolean, x: number, y: number, visible: boolean) {
      label.hidden = !visible;
      label.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
      const names: Record<string,string> = {'Seeking water':'To water','Waiting for water':'No water',
        'Seeking grass':'To grass','Waiting for grass':'No grass','Seeking shade':'To shade','Cooling in shade':'Cooling'};
      const behaviour = s.animal.behaviour === 'Roaming' ? solo ? 'Exploring' : 'With herd' : names[s.animal.behaviour] ?? s.animal.behaviour;
      caption.textContent = s.animal.behaviour === 'Sleeping' ? 'z' : `${id+1}`;
      const values = [s.animal.thirst,s.animal.hunger,s.animal.heat];
      bars.forEach((bar,i)=>bar.value=values[i]);
      label.title = `${behaviour} · Thirst ${Math.round(values[0])}% · Hunger ${Math.round(values[1])}% · Heat ${Math.round(values[2])}%`;
      label.setAttribute('aria-label',`Herbivore ${id+1}, ${behaviour}. Thirst ${Math.round(values[0])}%, hunger ${Math.round(values[1])}%, heat ${Math.round(values[2])}%.`);
    },
    dispose() { label.remove(); },
  };
}
