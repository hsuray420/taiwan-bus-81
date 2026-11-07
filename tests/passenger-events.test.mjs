import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPassengerEventPlan,
  shouldAutoOpenFrontDoor,
  shouldPlayTurnWarning
} from '../js/passenger-events.mjs';

test('passenger event plan creates automatic boarding and alighting events', () => {
  const plan = createPassengerEventPlan({
    passengerCount: 14,
    stationIndex: 20,
    seed: 7
  });

  assert.ok(plan.some((event) => event.type === 'alight'));
  assert.ok(plan.some((event) => event.type === 'board' && event.cardType));
  assert.ok(plan.every((event) => event.source === 'passenger'));
});

test('passenger event plan never makes the passenger count negative', () => {
  const plan = createPassengerEventPlan({
    passengerCount: 0,
    stationIndex: 1,
    seed: 1
  });

  assert.equal(plan.filter((event) => event.type === 'alight').length, 0);
});

test('turn warning only plays while a moving bus is steering', () => {
  assert.equal(shouldPlayTurnWarning({ speed: 0, steerAngle: 0.3 }), false);
  assert.equal(shouldPlayTurnWarning({ speed: 4, steerAngle: 0.01 }), false);
  assert.equal(shouldPlayTurnWarning({ speed: 4, steerAngle: 0.3 }), true);
});

test('station service opens the passenger door without manual card input', () => {
  assert.equal(shouldAutoOpenFrontDoor({ stationStopped: true, frontDoorOpen: false }), true);
  assert.equal(shouldAutoOpenFrontDoor({ stationStopped: true, frontDoorOpen: true }), false);
  assert.equal(shouldAutoOpenFrontDoor({ stationStopped: false, frontDoorOpen: false }), false);
});
