class AnimationQueue {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.pending = false;
    this.run = this.run.bind(this);
  }

  schedule() {
    if (this.pending) return;

    this.pending = true;

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(this.run);
    } else {
      this.run();
    }
  }

  run() {
    this.pending = false;
    this.onFrame();
  }
}

export default AnimationQueue;
