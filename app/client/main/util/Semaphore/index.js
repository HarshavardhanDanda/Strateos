import ResourcePool from 'main/util/ResourcePool';

/*
 This class manages the state of a finite number of resources.
 Clients enter the queue and then are given a token, asynchronously, when
 it is their turn to run.  Note that this class does not manage any actual
 resources, it just manage a finite number of tokens.
 See en.wikipedia.org/wiki/Semaphore_(programming)
*/
class Semaphore {
  // @param size -- The number of "processes" that can be run concurrently.
  constructor(size) {
    if (isNaN(size)) throw Error(`'size' must be a number.  Instead got: ${size}`);
    if (parseInt(size, 10) != size) throw Error(`'size' must be an integer.  Instead got ${size}`);

    this.tokensHash = {};
    let i = size;
    while (i > 0) {
      this.tokensHash[i.toString()] = true;
      i -= 1;
    }

    this.pool = new ResourcePool(Object.keys(this.tokensHash));
  }

  acquire() {
    return this.pool.acquire();
  }

  release(token) {
    // Make sure the resource is actually a valid key
    if (!this.tokensHash[token]) return;
    this.pool.release(token);
  }

}

export default Semaphore;
