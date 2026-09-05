import * as THREE from 'three';

// Every surface takes a mark differently: rubber on concrete, churned earth on
// gravel and mud, sprayed grains in sand, a wet smear through water and ice.
export const MARK_COLORS = {
  gravel:'#584327', concrete:'#2f3037', mud:'#3a2817', sand:'#b0854a',
  water:'#7fb6bd', ice:'#d6e9f2', oil:'#221b2b',
};
export const markColor = (surface) => MARK_COLORS[surface] || MARK_COLORS.gravel;

const OFFSETS = [-1.19, -.81, .81, 1.19];

// One ribbon per car: two tyre-wide strips that follow the wheels and fade out
// with age, so a lap of marks stays readable without ever growing unbounded.
export function createTrail(scene, {samples = 150, spacing = .8, life = 11} = {}) {
  const position = new Float32Array(samples * 4 * 3);
  const color = new Float32Array(samples * 4 * 4);
  const index = [];
  for (let i = 0; i < samples - 1; i++) {
    const a = i * 4, b = a + 4;
    index.push(a, a+1, b, a+1, b+1, b, a+2, a+3, b+2, a+3, b+3, b+2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(color, 4));
  geometry.setIndex(index);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    vertexColors:true, transparent:true, depthWrite:false, side:THREE.DoubleSide,
  }));
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  scene.add(mesh);
  const marks = [];
  const tint = new THREE.Color();

  function push(x, z, angle, surface, strength) {
    const nx = Math.cos(angle), nz = -Math.sin(angle);
    tint.set(markColor(surface));
    marks.push({x, z, nx, nz, age:0, strength, r:tint.r, g:tint.g, b:tint.b});
    if (marks.length > samples) marks.shift();
  }

  function write() {
    geometry.setDrawRange(0, Math.max(0, marks.length - 1) * 12);
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i], alpha = Math.max(0, 1 - m.age / life) ** .7 * m.strength;
      for (let j = 0; j < 4; j++) {
        const p = (i * 4 + j) * 3, c = (i * 4 + j) * 4;
        position[p] = m.x + m.nx * OFFSETS[j];
        position[p+1] = .055;
        position[p+2] = m.z + m.nz * OFFSETS[j];
        color[c] = m.r; color[c+1] = m.g; color[c+2] = m.b; color[c+3] = alpha;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  return {
    mesh,
    get length() { return marks.length; },
    // A car that jumps or is placed on the grid must not drag a mark across the
    // arena, so a long hop closes the old ribbon and opens a new one at zero.
    sample(x, z, angle, surface, strength) {
      const last = marks[marks.length - 1];
      if (last) {
        const moved = Math.hypot(x - last.x, z - last.z);
        if (moved < spacing) return false;
        if (moved > spacing * 4) {
          push(last.x, last.z, angle, surface, 0);
          push(x, z, angle, surface, 0);
          return true;
        }
      }
      push(x, z, angle, surface, strength);
      return true;
    },
    fade(dt) {
      for (const m of marks) m.age += dt;
      while (marks.length && marks[0].age > life) marks.shift();
      write();
    },
    clear() { marks.length = 0; write(); },
    dispose() { scene.remove(mesh); geometry.dispose(); mesh.material.dispose(); },
  };
}
