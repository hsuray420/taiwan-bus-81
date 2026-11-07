import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDriveForce,
  calculateEngineRpm,
  gearLabel,
  isEngineStalled,
  shiftGear
} from '../js/manual-transmission.mjs';

test('manual gearbox requires the clutch before changing gear', () => {
  assert.equal(shiftGear(0, 1, { clutchPressed: false }), 0);
  assert.equal(shiftGear(0, 1, { clutchPressed: true }), 1);
});

test('reverse gear cannot be selected while the bus is moving forward', () => {
  assert.equal(shiftGear(0, -1, { clutchPressed: true, speedMps: 1.2 }), 0);
  assert.equal(shiftGear(0, -1, { clutchPressed: true, speedMps: 0 }), -1);
});

test('neutral and a pressed clutch remove drive force', () => {
  assert.equal(calculateDriveForce({ gear: 0, clutchPressed: false, throttle: 1, speedMps: 0 }), 0);
  assert.equal(calculateDriveForce({ gear: 1, clutchPressed: true, throttle: 1, speedMps: 0 }), 0);
  assert.ok(calculateDriveForce({ gear: 1, clutchPressed: false, throttle: 1, speedMps: 0 }) > 0);
});

test('lower gears produce higher engine rpm at the same road speed', () => {
  const first = calculateEngineRpm({ speedMps: 5, gear: 1, throttle: 0 });
  const fourth = calculateEngineRpm({ speedMps: 5, gear: 4, throttle: 0 });
  assert.ok(first > fourth);
  assert.equal(gearLabel(0), 'N');
  assert.equal(gearLabel(-1), 'R');
});

test('releasing the clutch at a standstill without throttle can stall the engine', () => {
  assert.equal(isEngineStalled({ gear: 1, clutchPressed: false, speedMps: 0, throttle: 0, rpm: 680 }), true);
  assert.equal(isEngineStalled({ gear: 1, clutchPressed: true, speedMps: 0, throttle: 0, rpm: 680 }), false);
});
