// This is an abstract class, meant to be extended
// See classes LinearScale and OrdinaleScale for example subclasses
class Scale {
  static initClass() {
    this.prototype.domain = [];
    this.prototype.range = [];
    this.prototype.dx = 1; // change in domain
    this.prototype.dy = 1; // change in range

    // y = mx + b
    this.prototype.m = null;
    this.prototype.b = null;
  }

  // Call this from subclass constructor once it
  // it has initialized @range and @domain
  setup() {
    this.dy = this.diffInRange(this.range);
    this.m = this.dy / this.dx;
    return this.b = this.computeIntercept();
  }

  map(x) {
    if (this.dx === 0) {
      return this.range[0] + 0.5 * this.dy;
    } else {
      return this.m * x + this.b;
    }
  }

  invert(y) {
    return (y - this.b) / this.m;
  }

  diffInRange(rangeDelta) {
    return Math.abs(rangeDelta[1] - rangeDelta[0]);
  }

  // Find y intercept (the 'b' in y = mx + b)
  computeIntercept() {
    return this.range[0] - this.m * this.domain[0];
  }

  // calculate a good gap between domain values as a power of 10
  getStep(domainDelta) {
    const exp = Math.floor(Math.log10(domainDelta));
    return 10 ** exp;
  }

  // This will return an array of domain values separated by a power of 10
  ticks() {
    if (this.dx === 0) {
      return [this.domain[0]];
    }
    const step = this.getStep(this.dx);
    let currentVal = this.domain[0];
    const ticks = []; // always return the first (it should be 0)
    while (currentVal <= this.domain[1]) {
      ticks.push(currentVal);
      currentVal = currentVal + step;
    }

    return ticks;
  }
}
Scale.initClass();

export default Scale;
