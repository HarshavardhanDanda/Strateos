export default {
  withContext(ctx, fn) {
    let oldContext;

    try {
      oldContext = this._ctx;
      this._ctx = ctx;
      return fn();
    } finally {
      this._ctx = oldContext;
    }
  },

  hit(x, y, render, fn) {
    let hit;

    this.hittest(x, y, (props) => {
      hit = props;

      if (typeof fn === 'function') fn(props);
    }, render);

    return hit;
  },

  hittest(x, y, hit, fn) {
    let oldhit;
    try {
      oldhit = this._hittest;
      this._hittest = {
        x,
        y,
        hit
      };
      return fn();
    } finally {
      this._hittest = oldhit;
    }
  },

  group(props, ...children) {
    const ctx = this._ctx;
    ctx.save();
    ctx.translate(
      props.x != undefined ? props.x : 0,
      props.y != undefined ? props.y : 0
    );

    try {
      return Array.from(children).map(c => c());
    } finally {
      ctx.restore();
    }
  },

  rect(props) {
    return this.shape(props, ctx => ctx.rect(props.x, props.y, props.width, props.height));
  },

  shape(props, d) {
    const ctx = this._ctx;
    ctx.beginPath();
    d(ctx);

    if (this._hittest) {
      if (ctx.isPointInPath(this._hittest.x, this._hittest.y)) {
        this._hittest.hit(props);
      }
      return;
    }

    if (props.fill != undefined) {
      ctx.fillStyle = props.fill;
      ctx.fill();
    }

    if (props.stroke != undefined) {
      ctx.strokeStyle = props.stroke;
      ctx.lineWidth = props.strokeWidth != undefined ? props.strokeWidth : 1;
      ctx.stroke();
    }
  },

  text(props, text) {
    if (this._hittest != undefined) {
      return;
    }
    const ctx = this._ctx;
    ctx.textBaseline = props.baseline != undefined ? props.baseline : 'top';
    ctx.textAlign = props.align != undefined ? props.align : 'left';
    ctx.font = props.font;
    if (props.fill != undefined) {
      ctx.fillStyle = props.fill;
      ctx.fillText(text, props.x != undefined ? props.x : 0, props.y != undefined ? props.y : 0);
    }
    if (props.stroke != undefined) {
      ctx.strokeStyle = props.stroke;
      ctx.lineWidth = props.strokeWidth != undefined ? props.strokeWidth : 1;
      ctx.strokeText(text, props.x != undefined ? props.x : 0, props.y != undefined ? props.y : 0);
    }
  }
};
