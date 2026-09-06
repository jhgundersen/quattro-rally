import * as THREE from 'three';

// How much a surface gives up when a wheel spins on it. Loose dirt hangs in the
// air; concrete and ice barely smoke at all.
export const DUST_DENSITY = {
  asphalt:.08, wetMud:.75, gravel:1, sand:1.35, mud:.6, water:.75, ice:.35, concrete:.12, oil:.25,
};
export const dustDensity = (surface) => DUST_DENSITY[surface] ?? DUST_DENSITY.gravel;

// A soft disc, built as data so it needs no canvas and works under test.
function puffTexture(size = 64) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const d = Math.hypot(x / (size - 1) - .5, y / (size - 1) - .5) * 2;
    const a = Math.max(0, 1 - d) ** 1.7;
    data[i] = data[i+1] = data[i+2] = 255;
    data[i+3] = Math.round(a * 255);
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

// One point cloud for every car's dust, so a thick cloud costs one draw call.
export function createDust(scene, {count = 520} = {}) {
  const position = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const alpha = new Float32Array(count);
  const size = new Float32Array(count);
  const life = new Float32Array(count);
  const span = new Float32Array(count);
  const grow = new Float32Array(count);
  const peak = new Float32Array(count);
  const velocity = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  geometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const material = new THREE.ShaderMaterial({
    uniforms:{map:{value:puffTexture()}, scale:{value:12}},
    vertexShader:`attribute float alpha;attribute float size;uniform float scale;
      varying float vAlpha;varying vec3 vColor;
      void main(){vAlpha=alpha;vColor=color;gl_PointSize=size*scale;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    // Vertex colours are in the working space, so hand the result to three's
    // own output transform rather than writing linear values to an sRGB buffer.
    fragmentShader:`uniform sampler2D map;varying float vAlpha;varying vec3 vColor;
      void main(){float a=texture2D(map,gl_PointCoord).a*vAlpha;
        if(a<.01)discard;gl_FragColor=vec4(vColor,a);
        #include <colorspace_fragment>}`,
    transparent:true, depthWrite:false, vertexColors:true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;
  scene.add(points);
  const tint = new THREE.Color();
  let head = 0;

  return {
    points,
    get live() { let n = 0; for (const l of life) if (l > 0) n++; return n; },
    // The orthographic camera fits the whole arena, so a world-sized puff has
    // to be converted to pixels whenever that framing changes.
    setScale(pixelsPerUnit) { material.uniforms.scale.value = pixelsPerUnit; },
    spawn(x, y, z, tone, {radius = 1, opacity = .4, seconds = 1, vx = 0, vy = .8, vz = 0, growth = 1.6} = {}) {
      const i = head; head = (head + 1) % count;
      tint.set(tone);
      position[i*3] = x; position[i*3+1] = y; position[i*3+2] = z;
      color[i*3] = tint.r; color[i*3+1] = tint.g; color[i*3+2] = tint.b;
      velocity[i*3] = vx; velocity[i*3+1] = vy; velocity[i*3+2] = vz;
      size[i] = radius; grow[i] = growth; peak[i] = opacity;
      life[i] = seconds; span[i] = seconds; alpha[i] = opacity;
      return i;
    },
    update(dt) {
      for (let i = 0; i < count; i++) {
        if (life[i] <= 0) { alpha[i] = 0; continue; }
        life[i] -= dt;
        if (life[i] <= 0) { life[i] = 0; alpha[i] = 0; continue; }
        position[i*3] += velocity[i*3] * dt;
        position[i*3+1] += velocity[i*3+1] * dt;
        position[i*3+2] += velocity[i*3+2] * dt;
        velocity[i*3] *= 1 - dt; velocity[i*3+2] *= 1 - dt;
        size[i] += grow[i] * dt;
        // Billow up to full opacity, then thin out over the rest of the life.
        const spent = 1 - life[i] / span[i];
        alpha[i] = peak[i] * (spent < .16 ? spent / .16 : 1 - (spent - .16) / .84);
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.alpha.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    },
    clear() { life.fill(0); alpha.fill(0); geometry.attributes.alpha.needsUpdate = true; },
    dispose() { scene.remove(points); geometry.dispose(); material.uniforms.map.value.dispose(); material.dispose(); },
  };
}
