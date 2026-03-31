export let windX = 0.8;
export let windY = -0.2;
let windTime = 0;

export function updateWind(dt) {
  windTime += dt;
  windX = 0.6 + 0.4 * Math.sin(windTime * 0.3) + 0.2 * Math.sin(windTime * 0.7);
  windY = -0.15 + 0.15 * Math.sin(windTime * 0.5);
}
