import { expect }  from 'chai';

import Semaphore from '.';

describe('Semaphore', () => {
  it('validates that size is an int', () => {
    const notANum = () => new Semaphore('NaN');
    expect(notANum).to.throw(Error);

    const notAnInt = () => new Semaphore(1.1);
    expect(notAnInt).to.throw(Error);
  });

  it('blocks against releasing an invalid token', () => {
    const semaphore = new Semaphore(1);
    const req1 = semaphore.acquire();
    const req2 = semaphore.acquire();

    expect(req1.state()).to.equal('resolved');
    expect(req2.state()).to.equal('pending');

    semaphore.release('bad-key');

    expect(req2.state()).to.equal('pending');
  });

});
