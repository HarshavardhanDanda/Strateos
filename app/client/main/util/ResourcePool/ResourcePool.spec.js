import { expect } from 'chai';

import ResourcePool from '.';

describe('ResourcePool', () => {
  it('doesnt make you wait if a resource is available', () => {
    const pool = new ResourcePool(['a']);
    const def = pool.acquire();
    expect(def.state()).to.equal('resolved');
    def.done(t => expect(t).to.be.a('string'));
  });

  it('resolves a request once a resource is available', () => {
    const pool = new ResourcePool(['a']);

    const req1 = pool.acquire();
    const req2 = pool.acquire();

    expect(req1.state()).to.equal('resolved');
    expect(req2.state()).to.equal('pending');

    req1.done(t => pool.release(t));
    expect(req2.state()).to.equal('resolved');
  });

  it('can handle parallelism', () => {
    const pool = new ResourcePool(['a', 'b']);
    const req1 = pool.acquire();
    const req2 = pool.acquire();
    expect(req1.state()).to.equal('resolved');
    expect(req2.state()).to.equal('resolved');
  });

  it('preserves request order', () => {
    const pool = new ResourcePool(['a']);
    const req1 = pool.acquire();
    const req2 = pool.acquire();
    const req3 = pool.acquire();

    expect(req1.state()).to.equal('resolved');
    expect(req2.state()).to.equal('pending');
    expect(req3.state()).to.equal('pending');

    req1.done(t => pool.release(t));

    expect(req2.state()).to.equal('resolved');
    expect(req3.state()).to.equal('pending');
  });

});
