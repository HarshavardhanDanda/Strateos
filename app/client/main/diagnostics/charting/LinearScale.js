import Scale from './Scale';

// A scale that linearly maps a continuous
// domain into a continous range.
class LinearScale extends Scale {

  constructor(props) {
    let dx;
    super(props);
    const { domain, range, roundDomain } = props;
    this.domain = domain;
    this.range = range;

    if (roundDomain) {
      // Expand the domain to "nice" start/end values
      dx = this.diffInRange(this.domain);
      if (dx !== 0) {
        const step = this.getStep(dx);
        this.domain = [Math.floor(this.domain[0] / step) * step, Math.ceil(this.domain[1] / step) * step];
      }
    }

    this.dx = this.diffInRange(this.domain);
    this.setup();
  }
}

export default LinearScale;
