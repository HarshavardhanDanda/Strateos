import Immutable from 'immutable';
import ColorUtils from 'main/util/ColorUtils';

const colorPalette = Immutable.List([
  'rgba(255, 226, 139)',
  'rgba(255, 112, 161)',
  'rgba(188, 128, 189)',
  'rgba(125, 212, 195)',
  'rgba(179, 153, 179)',
  'rgba(0  , 230, 127)',
  'rgba(253, 180, 98)',
  'rgba(128, 177, 211)',
  'rgba(251, 128, 114)',
  'rgba(190, 186, 218)',
  'rgba(255, 255, 179)',
  'rgba(141, 211, 199)'
]);

export const getColorMap = itemIds => {
  return ColorUtils.createColorMap(itemIds, colorPalette);
};
