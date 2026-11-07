const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function seededRandom(seed) {
  let state = Math.abs(Math.trunc(seed)) + 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function createPassengerEventPlan({ passengerCount, stationIndex, seed = Date.now() }) {
  const random = seededRandom(seed + stationIndex * 997);
  const safePassengerCount = Math.max(0, Math.trunc(passengerCount));
  const alightCount = safePassengerCount === 0
    ? 0
    : Math.min(safePassengerCount, Math.floor(random() * 3));
  const boardCount = 1 + Math.floor(random() * 3);
  const events = [];

  for (let index = 0; index < alightCount; index += 1) {
    events.push({
      type: 'alight',
      source: 'passenger',
      delayMs: 700 + index * 800
    });
  }

  for (let index = 0; index < boardCount; index += 1) {
    events.push({
      type: 'board',
      source: 'passenger',
      cardType: random() > 0.65 ? 'student' : 'regular',
      delayMs: 1100 + index * 1000
    });
  }

  return events.sort((left, right) => left.delayMs - right.delayMs);
}

export function applyPassengerEvent(passengerCount, event) {
  const delta = event.type === 'board' ? 1 : -1;
  return clamp(Math.trunc(passengerCount) + delta, 0, 99);
}

export function shouldPlayTurnWarning({ speed, steerAngle }) {
  return Math.abs(speed) > 0.5 && Math.abs(steerAngle) > 0.12;
}

export function shouldAutoOpenFrontDoor({ stationStopped, frontDoorOpen }) {
  return Boolean(stationStopped && !frontDoorOpen);
}
