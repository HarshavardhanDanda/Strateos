import { Generator } from 'main/util/random';
import _ from 'lodash';

const String = {
  _random(n, alphabet, generator = (new Generator())) {
    return generator.sample(alphabet, n).join('');
  },

  random(n, generator) {
    return this._random(n, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', generator);
  },

  randomHex(n, generator) {
    return this._random(n, '0123456789ABCDEF', generator);
  },

  randomBrightColorHex(generator) {
    // Choose a random number bound from [0, max_rgb_value]
    const randomRGB = generator.random(0xffffff);

    // Keep the highest bit in for red blue and green
    // We want to avoid using dark colors
    // eslint-disable-next-line no-bitwise
    const brightRGB = randomRGB | 0x808080;

    return `#${brightRGB.toString(16)}`;
  },

  humanFileSize(num, precision = 0) {
    if (isNaN(num)) {
      return '??B';
    }

    const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    const base = 1024;
    const power = Math.floor(Math.log(num) / Math.log(base));

    return `${(num / (base ** power)).toFixed(precision)} ${units[power]}`;
  },

  // Takes a semantic version string, "1.1.1-build-suffix-alpha", and returns
  // its major, minor, and patch.  NOTE: this ignores the build and metadata suffixes.
  semanticParse(s) {
    // split on dash to get rid of build suffix
    const [numerals, _build] = Array.from(s.split(/-(.+)/, 2));

    const numberSplit = numerals.split('.', 3);

    return {
      major: parseInt(numberSplit[0], 10) || 0,
      minor: parseInt(numberSplit[1], 10) || 0,
      patch: parseInt(numberSplit[2], 10) || 0
    };
  },

  // ('1.0.0', '1.0.1') -> -1
  // a > b -> 1
  // a < b -> -1
  // a == b -> 0
  semanticCompare(a, b) {
    const parsedA  = this.semanticParse(a);
    const parsedB  = this.semanticParse(b);
    const sections = ['major', 'minor', 'patch'];

    // eslint-disable-next-line no-restricted-syntax
    for (const index in sections) {
      const section = sections[index];

      if (parsedA[section] > parsedB[section]) return 1;
      if (parsedA[section] < parsedB[section]) return -1;
    }

    return 0;
  },

  /**
   * @param {*} str
   * @returns the string in camel case form
   * 'abc def -> abcDef'
   * 'another example' -> 'anotherExample'
   */
  upperCamelCase(str) {
    return _.chain(str).camelCase().upperFirst().value();
  },

  // '1256 788 900 12' -> '125678890012'
  removeBlankSpaces(str) {
    return str.replace(/\s/g, '');
  },

  // if any regex is passed in params it splits string based on it
  // else uses default regex
  splitWithRegex(str, regex) {
    return regex ? str.split(regex) : str.split(/[,\n\s]+/);
  },

  // Remove non-printable ASCII chars
  removeNonPrintableAscii(str) {
    return str.replace(/[^\x20-\x7E]/g, '');
  },
};

export default String;
