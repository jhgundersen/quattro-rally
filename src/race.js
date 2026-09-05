export const TAU = Math.PI * 2;
export const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export function advanceProgress(previous, next, progress) {
  let delta = next - previous;
  if (delta < -0.5) delta += 1;
  if (delta > 0.5) delta -= 1;
  return progress + delta;
}
export function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
}
