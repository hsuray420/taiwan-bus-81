const HUB_NAMES = new Set([
  '統聯轉運站(站內)',
  '臺中車站(C月台)',
  '太原六號橋(太原路)'
]);

const MAJOR_NAMES = new Set([
  '朝馬2(臺灣大道)',
  '惠文高中(公益路)',
  '草悟道(市民廣場)',
  '臺灣體大體育場',
  '臺中一中',
  '臺中公園(雙十路)',
  '中國醫東區分院'
]);

export function classifyStop(name) {
  const type = HUB_NAMES.has(name) ? 'hub' : MAJOR_NAMES.has(name) ? 'major' : 'ordinary';
  return {
    name,
    type,
    dwellSeconds: type === 'hub' ? 18 : type === 'major' ? 12 : 8
  };
}
