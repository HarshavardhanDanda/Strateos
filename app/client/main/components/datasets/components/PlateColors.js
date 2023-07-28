import Chroma from 'chroma-js';
import _      from 'lodash';

class PlateColors {

  // Usable colors for datasets when displaying an InteractivePlate
  static get colorMap() {
    return [
      { hue: 208, saturation: 0.56, lightness: 0.45 },
      { hue: 27,  saturation: 0.89, lightness: 0.55 },
      { hue: 108, saturation: 0.47, lightness: 0.42 },
      { hue: 5,   saturation: 0.64, lightness: 0.48 },
      { hue: 267, saturation: 0.37, lightness: 0.57 },
      { hue: 12,  saturation: 0.28, lightness: 0.41 },
      { hue: 316, saturation: 0.54, lightness: 0.67 },
      { hue: 0,   saturation: 0,    lightness: 0.50 },
      { hue: 60,  saturation: 0.53, lightness: 0.49 },
      { hue: 189, saturation: 0.57, lightness: 0.55 }
    ];
  }

  static getBaseColor(colorIndex) {
    const index = colorIndex < PlateColors.colorMap.length ? colorIndex : 0;
    return PlateColors.colorMap[index];
  }

  static getColorAsHex(colorIndex) {
    const baseColor = PlateColors.getBaseColor(colorIndex);

    return Chroma.hsl(baseColor.hue, baseColor.saturation, baseColor.lightness).hex();
  }

  // Calculates the colorscale, finding the [min, max] of the values
  // Uses a three color gradient.
  static getColorScale(colorIndex, values) {
    const baseColor = PlateColors.getBaseColor(colorIndex);
    const min       = _.min(values);
    const max       = _.max(values);

    const colors = [
      Chroma.hsl(baseColor.hue, baseColor.saturation, 0.05),
      Chroma.hsl(baseColor.hue, baseColor.saturation, 0.5),
      Chroma.hsl(baseColor.hue, baseColor.saturation, 0.75)
    ];

    return {
      colors,
      domain: [min, max]
    };
  }
}

export default PlateColors;
