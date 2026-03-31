export let windX = 0.8;
export let windY = -0.2;
let windTime = 0;

export function updateWind(dt, stormIntensity = 0) {
  windTime += dt;
  const base = 0.6 + 0.4 * Math.sin(windTime * 0.3) + 0.2 * Math.sin(windTime * 0.7);
  const gust = stormIntensity * (1.5 * Math.sin(windTime * 1.1) + 0.8 * Math.sin(windTime * 2.3));
  windX = base + gust;
  windY = -0.15 + 0.15 * Math.sin(windTime * 0.5) + stormIntensity * 0.3 * Math.sin(windTime * 0.9);
}
