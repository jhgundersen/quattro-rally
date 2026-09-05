import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSoundtrack} from './soundtrack.js';

function audioStub() {
  const listeners = {};
  return {
    paused:true, currentTime:0, plays:0,
    addEventListener(type, listener) { listeners[type] = listener; },
    play() { this.paused=false; this.plays++; return Promise.resolve(); },
    pause() { this.paused=true; },
    end() { this.paused=true; listeners.ended(); },
  };
}

test('playlist starts on a race, advances at song end, and wraps through all three files',()=>{
  const audio=audioStub(),music=createSoundtrack(audio);
  assert.equal(audio.src,undefined);
  assert.equal(audio.plays,0);
  music.beginRace();music.setPlaying(true);
  assert.equal(audio.src,'/audio/quattro-1.mp3');
  assert.equal(audio.paused,false);
  audio.end();assert.equal(audio.src,'/audio/quattro-2.mp3');
  audio.end();assert.equal(audio.src,'/audio/quattro-3.mp3');
  audio.end();assert.equal(audio.src,'/audio/quattro-1.mp3');
  assert.equal(audio.paused,false);
});

test('pause and mute preserve playback position; repeated frames do not replay; restart rotates tracks',()=>{
  const audio=audioStub(),music=createSoundtrack(audio,'/game/audio/');
  music.beginRace();music.setPlaying(true);audio.currentTime=15;
  music.setPlaying(true);assert.equal(audio.plays,1);
  music.setPlaying(false);assert.equal(audio.paused,true);
  assert.equal(audio.currentTime,15);
  music.setPlaying(true);assert.equal(audio.currentTime,15);
  music.beginRace();assert.equal(audio.src,'/game/audio/quattro-2.mp3');
  assert.equal(audio.paused,true);
  music.setPlaying(true);assert.equal(audio.paused,false);
});

test('blocked playback is handled and can retry on a player interaction',async()=>{
  const audio=audioStub(),music=createSoundtrack(audio);
  audio.play=()=>Promise.reject(new Error('Playback blocked'));
  music.beginRace();music.setPlaying(true);
  await Promise.resolve();
  audio.play=()=>{audio.paused=false;return Promise.resolve();};
  music.retry();assert.equal(audio.paused,false);
  music.setPlaying(false);music.retry();assert.equal(audio.paused,true);
});
