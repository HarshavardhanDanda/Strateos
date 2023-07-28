import _ from 'lodash';

class Generator {
  // eslint-disable-next-line class-methods-use-this
  random(max) {
    return Math.floor(Math.random() * max);
  }

  sample(list, n) {
    const results = [];

    for (let i = 0; i <= n; i += 1) {
      const rindex = this.random(_.size(list));
      results.push(list[rindex]);
    }

    return results;
  }
}

class SeededGenerator extends Generator {
  // http://stackoverflow.com/a/22313621/28486

  constructor(initialSeed) {
    super();
    this.mod1 = 4294967087;
    this.mod2 = 4294965887;
    this.mul1 = 65539;
    this.mul2 = 65537;
    this.state1 = initialSeed != undefined ? initialSeed : (+new Date());
    this.state2 = this.state1;

    this.state1 = (this.state1 % (this.mod1 - 1)) + 1;
    this.state2 = (this.state2 % (this.mod2 - 1)) + 1;
  }

  random(max) {
    this.state1 = (this.state1 * this.mul1) % this.mod1;
    this.state2 = (this.state2 * this.mul2) % this.mod2;

    if (this.state1 < max && this.state2 < max && this.state1 < this.mod1 % max && this.state2 < this.mod2 % max) {
      return this.random(max);
    } else {
      return (this.state1 + this.state2) % max;
    }
  }
}

export { Generator, SeededGenerator };
