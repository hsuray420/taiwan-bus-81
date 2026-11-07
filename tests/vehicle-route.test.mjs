import test from 'node:test';
import assert from 'node:assert/strict';
import { KL6112U1_SPEC, EAL5195_EV_SPEC } from '../js/vehicle-spec.mjs';
import { classifyStop } from '../js/route-stop.mjs';

test('vehicle spec identifies the requested Taiwan Kinglong bus', () => {
  assert.equal(KL6112U1_SPEC.model, 'KINGLONG KL6112U1');
  assert.equal(KL6112U1_SPEC.lengthM, 11.2);
  assert.equal(KL6112U1_SPEC.wheelbaseM, 5.3);
  assert.equal(KL6112U1_SPEC.engine, 'CUMMINS ISBe4+250B');
  assert.equal(KL6112U1_SPEC.driverSide, 'left');
  assert.equal(KL6112U1_SPEC.transmission, 'manual');
});

test('vehicle spec identifies Master Bus EAL-5195 EV BUS', () => {
  assert.equal(EAL5195_EV_SPEC.model, 'MASTER BUS EV BUS');
  assert.equal(EAL5195_EV_SPEC.plate, 'EAL-5195');
  assert.equal(EAL5195_EV_SPEC.driverSide, 'left');
  assert.equal(EAL5195_EV_SPEC.batteryPackSoc, '100%');
  assert.equal(EAL5195_EV_SPEC.batteryPackTemp, '48°C');
});

test('route stop classification distinguishes ordinary stops from major hubs', () => {
  assert.equal(classifyStop('惠文高中(公益路)').type, 'major');
  assert.equal(classifyStop('黎明龍門路口').type, 'ordinary');
  assert.equal(classifyStop('臺中車站(C月台)').type, 'hub');
});
