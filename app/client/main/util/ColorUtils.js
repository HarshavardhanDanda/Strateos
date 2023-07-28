import Immutable from 'immutable';
import Chroma from 'chroma-js';

import { Utilities } from '@transcriptic/amino';
import String from 'main/util/String';
import { SeededGenerator } from 'main/util/random';

const sortByName = (a, b) => a.get('name').localeCompare(b.get('name'));

const ColorUtils = {
  refColorPalette: Immutable.List([
    'rgba(255, 237, 111, 0.5)',
    'rgba(204, 235, 197, 0.5)',
    'rgba(188, 128, 189, 0.5)',
    'rgba(217, 217, 217, 0.5)',
    'rgba(252, 205, 229, 0.5)',
    'rgba(179, 222, 105, 0.5)',
    'rgba(253, 180, 98,  0.5)',
    'rgba(128, 177, 211, 0.5)',
    'rgba(251, 128, 114, 0.5)',
    'rgba(190, 186, 218, 0.5)',
    'rgba(255, 255, 179, 0.5)',
    'rgba(141, 211, 199, 0.5)'
  ]),

  // Given a color palette and a list of ids, non-unique,
  // it will return a mapping from id to color.
  createColorMap(ids, palette) {
    const generator = new SeededGenerator(1);
    const uniqueIds = ids.toOrderedSet().toList();

    return uniqueIds.map((id, index) => {
      return [id, this._colorForId(id, index, palette, generator)];
    }).fromEntrySeq().toMap();
  },

  colorForRef(refName, refs) {
    const index = refs
      .sort(sortByName)
      .findIndex(ref => ref.get('name') === refName);

    // Initial seed needs to be spread out in order for colors to differ enough
    const generator = new SeededGenerator(index * 10000);

    return this._colorForId(refName, index, this.refColorPalette, generator);
  },

  _colorForId(id, index, palette, generator) {
    let color;
    if (index < palette.size) {
      color = palette.get(index);
    } else {
      color = String.randomBrightColorHex(generator);
    }

    return color;
  },

  generateBackgroundColor(id) {
    const MAX_LIGHTNESS = 0.65;
    const MIN_LIGHTNESS = 0.15;

    const bgColor = Utilities.Colors.strToHex(id);

    const [hue, sat, lightness] = Chroma(bgColor).hsl();
    const mappedLightness = (lightness * (MAX_LIGHTNESS - MIN_LIGHTNESS)) + MIN_LIGHTNESS;

    return Chroma.hsl(hue, sat, mappedLightness).hex();
  }
};

export default ColorUtils;
