import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceProgress, wrap, formatTime } from './race.js';
test('forward finish-line crossing advances a lap',()=>assert.ok(Math.abs(advanceProgress(.99,.01,.99)-1.01)<1e-9));
test('reverse crossing subtracts progress instead of awarding a lap',()=>assert.ok(Math.abs(advanceProgress(.01,.99,.01)+.01)<1e-9));
test('driving backwards and forwards cannot farm laps',()=>assert.ok(Math.abs(advanceProgress(.99,.01,advanceProgress(.01,.99,.4))-.4)<1e-9));
test('heading error takes the short turn across pi',()=>assert.ok(Math.abs(wrap(Math.PI*2-.1)+.1)<1e-9));
test('race timer formats minutes and hundredths',()=>assert.equal(formatTime(65.25),'01:05.25'));
