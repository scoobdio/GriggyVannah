import type { Simulation } from './simulation';

export function createStats(capacity: number) {
  const label = document.createElement('div');
  label.className = 'animal-stats';
  label.innerHTML = '<strong>Herbivore</strong><span class="behaviour"></span><label>Thirst <span class="thirst-value"></span><meter min="0" max="100" low="35" high="65" optimum="0" aria-label="Thirst: higher means thirstier"></meter></label>';
  const heatLabel = document.createElement('label');
  heatLabel.innerHTML = 'Heat <span class="heat-value"></span><meter min="0" max="100" low="35" high="65" optimum="0" aria-label="Heat: higher means hotter"></meter>';
  label.append(heatLabel);
  const heatValue = heatLabel.querySelector<HTMLElement>('.heat-value')!;
  const heatMeter = heatLabel.querySelector('meter')!;
  const panel = document.createElement('aside');
  panel.className = 'water-stats';
  panel.innerHTML = '<strong>Watering hole</strong><span class="water-value"></span><meter min="0" aria-label="Available pond water"></meter><span class="cycles"></span>';
  const weather = document.createElement('aside');
  weather.className = 'environment-stats';
  weather.setAttribute('aria-label', 'Environment');
  weather.innerHTML = '<strong class="world-time"></strong><span class="weather-description"></span><span class="temperature"></span>';
  document.body.append(label, panel, weather);
  const worldTime = weather.querySelector<HTMLElement>('.world-time')!;
  const weatherDescription = weather.querySelector<HTMLElement>('.weather-description')!;
  const temperature = weather.querySelector<HTMLElement>('.temperature')!;
  const behaviour = label.querySelector<HTMLElement>('.behaviour')!;
  const thirstValue = label.querySelector<HTMLElement>('.thirst-value')!;
  const thirstMeter = label.querySelector('meter')!;
  const waterValue = panel.querySelector<HTMLElement>('.water-value')!;
  const waterMeter = panel.querySelector('meter')!;
  const cycles = panel.querySelector<HTMLElement>('.cycles')!;
  waterMeter.max = capacity;
  let previous = '';
  return {
    update(s: Simulation, x: number, y: number) {
      label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      const thirst = Math.round(s.animal.thirst);
      const heat = Math.round(s.animal.heat);
      const water = Math.round(s.water);
      const e = s.environment;
      const minutes = Math.floor(e.hour * 60);
      const clock = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      const description = e.rain > 0 ? 'Rain' : e.daylight > 0.01 ? 'Sunshine' : 'Clear night';
      const degrees = e.temperature.toFixed(1);
      const flow = e.rainfall > 0 ? `Rain filling +${e.rainfall.toFixed(2)}/s`
        : e.evaporation > 0 ? `Evaporating −${e.evaporation.toFixed(2)}/s` : 'No weather inflow or loss';
      const key = `${heat}/${thirst}/${water}/${s.cycles}/${s.animal.behaviour}/${clock}/${e.day}/${description}/${degrees}/${flow}`;
      if (key === previous) return;
      previous = key;
      document.body.classList.toggle('night', e.daylight < 0.2);
      worldTime.textContent = `Day ${e.day} · ${clock}`;
      weatherDescription.textContent = description;
      temperature.textContent = `${degrees} °C`;
      behaviour.textContent = s.animal.behaviour;
      thirstValue.textContent = `${thirst}%`;
      thirstMeter.value = thirst;
      heatValue.textContent = `${heat}%`;
      heatMeter.value = heat;
      waterValue.textContent = `${water} / ${capacity} water · ${flow}`;
      waterMeter.value = water;
      cycles.textContent = `${s.cycles} drinking cycles completed`;
    },
    dispose() { label.remove(); panel.remove(); weather.remove(); document.body.classList.remove('night'); },
  };
}
