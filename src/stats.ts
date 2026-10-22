import type { Simulation } from './simulation';

export function createStats(capacity: number, refillRate: number) {
  const label = document.createElement('div');
  label.className = 'animal-stats';
  label.innerHTML = '<strong>Herbivore</strong><span class="behaviour"></span><label>Thirst <span class="thirst-value"></span><meter min="0" max="100" low="35" high="65" optimum="0" aria-label="Thirst: higher means thirstier"></meter></label>';
  const panel = document.createElement('aside');
  panel.className = 'water-stats';
  panel.innerHTML = '<strong>Watering hole</strong><span class="water-value"></span><meter min="0" aria-label="Available pond water"></meter><span class="cycles"></span>';
  document.body.append(label, panel);
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
      const water = Math.round(s.water);
      const key = `${thirst}/${water}/${s.cycles}/${s.animal.behaviour}`;
      if (key === previous) return;
      previous = key;
      behaviour.textContent = s.animal.behaviour;
      thirstValue.textContent = `${thirst}%`;
      thirstMeter.value = thirst;
      waterValue.textContent = `${water} / ${capacity} water · +${refillRate} / second`;
      waterMeter.value = water;
      cycles.textContent = `${s.cycles} drinking cycles completed`;
    },
    dispose() { label.remove(); panel.remove(); },
  };
}
