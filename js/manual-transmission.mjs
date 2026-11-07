export const GEAR_RATIOS = Object.freeze({
  reverse: -3.55,
  neutral: 0,
  first: 6.24,
  second: 3.60,
  third: 2.14,
  fourth: 1.39,
  fifth: 1.00,
  sixth: 0.78
});

const GEAR_RATIO_BY_NUMBER = Object.freeze({
  [-1]: GEAR_RATIOS.reverse,
  0: GEAR_RATIOS.neutral,
  1: GEAR_RATIOS.first,
  2: GEAR_RATIOS.second,
  3: GEAR_RATIOS.third,
  4: GEAR_RATIOS.fourth,
  5: GEAR_RATIOS.fifth,
  6: GEAR_RATIOS.sixth
});

const GEAR_NAMES = Object.freeze({
  [-1]: 'R',
  0: 'N',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6'
});

export function gearLabel(gear) {
  return GEAR_NAMES[gear] ?? 'N';
}

export function shiftGear(currentGear, direction, { clutchPressed = false, speedMps = 0 } = {}) {
  if (!clutchPressed || !Number.isFinite(direction) || direction === 0) return currentGear;

  const targetGear = currentGear + Math.sign(direction);
  if (targetGear < -1 || targetGear > 6) return currentGear;

  // A manual bus should be fully stopped before selecting reverse.
  if (targetGear === -1 && Math.abs(speedMps) > 0.5) return currentGear;
  if (currentGear === -1 && targetGear > 0 && Math.abs(speedMps) > 0.5) return currentGear;
  return targetGear;
}

export function calculateDriveForce({
  gear,
  clutchPressed = false,
  throttle = 0,
  brake = 0,
  speedMps = 0
}) {
  if (clutchPressed || gear === 0) return 0;

  const normalizedThrottle = Math.max(0, Math.min(1, throttle));
  const normalizedBrake = Math.max(0, Math.min(1, brake));
  const ratio = GEAR_RATIO_BY_NUMBER[gear] ?? 0;
  const gearFactor = Math.min(Math.abs(ratio) / GEAR_RATIOS.first, 1);
  const driveForce = normalizedThrottle * (1.5 + gearFactor * 2.8);
  const brakeForce = normalizedBrake * (speedMps >= 0 ? 7 : 3.5);

  if (gear < 0) return -driveForce + (speedMps < 0 ? brakeForce : 0);
  return driveForce - (speedMps > 0 ? brakeForce : 0);
}

export function calculateEngineRpm({
  speedMps,
  gear,
  throttle = 0,
  stalled = false,
  wheelRadiusM = 0.5,
  finalDriveRatio = 4.8
}) {
  if (stalled) return 0;

  const normalizedThrottle = Math.max(0, Math.min(1, throttle));
  if (gear === 0) return 700 + normalizedThrottle * 1_050;

  const ratio = Math.abs(GEAR_RATIO_BY_NUMBER[gear] ?? 0);
  const wheelRpm = (Math.abs(speedMps) / (2 * Math.PI * wheelRadiusM)) * 60;
  const coupledRpm = wheelRpm * ratio * finalDriveRatio;
  return Math.max(650, Math.min(2_600, coupledRpm + normalizedThrottle * 260));
}

export function isEngineStalled({ gear, clutchPressed = false, speedMps, throttle = 0, rpm }) {
  return gear !== 0
    && !clutchPressed
    && Math.abs(speedMps) < 0.6
    && throttle < 0.08
    && rpm < 700;
}

export function gearRatio(gear) {
  return GEAR_RATIO_BY_NUMBER[gear] ?? 0;
}
