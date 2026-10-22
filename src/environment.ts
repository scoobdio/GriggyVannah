export interface EnvironmentConfig {
  daySeconds: number;
  startHour: number;
  minimumTemperature: number;
  maximumTemperature: number;
  rainCooling: number;
  clearSeconds: number;
  rainSeconds: number;
  transitionSeconds: number;
  rainfallRate: number;
  evaporationRate: number;
}
export interface Environment {
  day: number;
  hour: number;
  daylight: number;
  rain: number;
  temperature: number;
  rainfall: number;
  evaporation: number;
}
export const environmentConfig: EnvironmentConfig = {
  daySeconds: 300, startHour: 8,
  minimumTemperature: 18, maximumTemperature: 35, rainCooling: 4,
  clearSeconds: 80, rainSeconds: 40, transitionSeconds: 5,
  rainfallRate: 4, evaporationRate: 0.06,
};
const smooth = (x: number) => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, x)))) / 2;

// An asymmetric cosine cycle places the trough at 02:30 and peak at 14:00.
export function clearTemperature(hour: number, c: EnvironmentConfig) {
  const phase = ((hour - 2.5) % 24 + 24) % 24;
  const warmth = phase <= 11.5 ? smooth(phase / 11.5) : 1 - smooth((phase - 11.5) / 12.5);
  return c.minimumTemperature + warmth * (c.maximumTemperature - c.minimumTemperature);
}
export function environmentAt(time: number, c: EnvironmentConfig): Environment {
  const totalHours = c.startHour + time / c.daySeconds * 24;
  const hour = ((totalHours % 24) + 24) % 24;
  const period = c.clearSeconds + c.rainSeconds;
  const wetTime = ((time % period) + period) % period - c.clearSeconds;
  const transition = Math.min(c.transitionSeconds, c.rainSeconds / 2);
  const rain = wetTime < 0 ? 0 : transition > 0
    ? smooth(Math.min(wetTime, c.rainSeconds - wetTime) / transition) : 1;
  const daylight = Math.max(0, Math.sin((hour - 6) / 12 * Math.PI));
  // Slow evaporation only from 11:00 to 17:00, peaking at 14:00; never during rain.
  const peakHeat = Math.abs(hour - 14) < 3 ? Math.cos((hour - 14) / 3 * Math.PI / 2) ** 2 : 0;
  return {
    day: Math.floor(totalHours / 24) + 1, hour, daylight, rain,
    temperature: clearTemperature(hour, c) - c.rainCooling * rain,
    rainfall: c.rainfallRate * rain,
    evaporation: rain > 0 ? 0 : c.evaporationRate * peakHeat,
  };
}
