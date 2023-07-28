import ajax, { safeAlways, safeFail } from 'main/util/ajax';

import { expect } from 'chai';
import $ from 'jquery';
import sinon from 'sinon';

describe('ajax utility test', () => {
  /* eslint-disable no-return-assign */
  describe('ajax.singly', () => {
    it('fires a request on first call', () => {
      const s = ajax.singly();
      let a = 0;
      s(() => a = 1);

      expect(a).to.be.equal(1);
    });

    it("doesn't immediately fire a second request", () => {
      const s = ajax.singly();
      let a = 0;

      s(() => a = 1);
      s(() => a = 2);

      expect(a).to.be.equal(1);
    });

    it('fires a second request once the first is done', () => {
      const s = ajax.singly();
      let a = 0;
      let first_cb;

      s((cb) => {
        a = 1;
        first_cb = cb;
      });

      s(() => a = 2);

      expect(a).to.be.equal(1);
      first_cb();
      expect(a).to.be.equal(2);
    });

    it('fires the most recent request only', () => {
      const s = ajax.singly();
      let a = 0;
      let b = 0;
      let first_cb;

      s((cb) => {
        a = 1;
        first_cb = cb;
      });

      s(() => b = 1);
      s(() => a = 3);

      expect(a).to.be.equal(1);

      first_cb();
      expect(b).to.be.equal(0);
      expect(a).to.be.equal(3);
    });

    it('immediately fires a second request if the first is already done', () => {
      const s = ajax.singly();
      let a = 0;
      let first_cb;

      s((cb) => {
        a = 1;
        first_cb = cb;
      });

      expect(a).to.be.equal(1);

      first_cb();
      s(() => a = 2);
      expect(a).to.be.equal(2);
    });
  });

  describe('jQuery to Native promise utils', () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => {
      sandbox.restore();
    });

    const reachedUnreachableCodeError = new Error('Promise should have rejected before this line.');

    describe('safeAlways', () => {
      it('handles rejected jquery promises', async () => {
        const jqPromise = $.Deferred();
        const callback = sandbox.spy();
        const expectedValue = new Error('hi');
        const result = safeAlways(jqPromise, callback);
        try {
          jqPromise.reject(expectedValue);
          await result;
          throw reachedUnreachableCodeError;
        } catch (err) {
          expect(err).to.equal(expectedValue);
          expect(callback.calledOnceWith(expectedValue)).to.be.true;
        }
      });

      it('handles rejected javascript promises', async () => {
        const rejectedValue = new Error('hi');
        const callback = sandbox.spy();
        const jsPromise = Promise.reject(rejectedValue);
        const result = safeAlways(jsPromise, callback);
        try {
          await result;
          throw reachedUnreachableCodeError;
        } catch (err) {
          expect(err).to.equal(rejectedValue);
          // Native promises don't pass any value to finally
          expect(callback.calledOnceWith()).to.be.true;
        }
      });

      it('handles resolved jquery promises', async () => {
        const jqPromise = $.Deferred();
        const callback = sandbox.spy();
        const expectedValue = 'you called?';
        const result = safeAlways(jqPromise, callback);
        jqPromise.resolve(expectedValue);
        await result;
        expect(callback.calledOnceWith(expectedValue)).to.be.true;
      });

      it('handles resolved javascript promises', async () => {
        const promiseValue = 'you called?';
        const callback = sandbox.spy();
        const jsPromise = Promise.resolve(promiseValue);
        const result = safeAlways(jsPromise, callback);
        await result;
        expect(callback.calledOnceWith()).to.be.true;
      });
    });

    describe('safeFail', () => {
      it('executes callback on failed jquery promises', async () => {
        const callback = sandbox.spy();
        const jqPromise = $.Deferred();
        const rejection = new Error('foo');
        const result = safeFail(jqPromise, callback);
        try {
          jqPromise.reject(rejection);
          await result;
          throw reachedUnreachableCodeError;
        } catch (err) {
          expect(err).to.equal(rejection);
          expect(callback.calledOnceWith(rejection)).to.be.true;
        }
      });

      it('executes callback on failed javascript promises', async () => {
        const callbackRejectValue = new Error('Not funny');
        const callback = sandbox.fake.rejects(callbackRejectValue);
        const resolveValue = 'I wonder what pufferfish think of when they see a beachball';
        const rejectValue = new Error('Is that ma?');
        const jsPromise = Promise.resolve(resolveValue).then(() => { throw rejectValue; });
        const result = safeFail(jsPromise, callback);
        try {
          await result;
          throw reachedUnreachableCodeError;
        } catch (err) {
          expect(err).to.equal(callbackRejectValue);
          expect(callback.calledOnceWith(rejectValue)).to.be.true;
        }
      });

      it('Skips callback on resolved jQuery promises', async () => {
        const callback = sandbox.spy();
        const resolveValue = 'foo';
        const jqPromise = $.Deferred();
        const result = safeFail(jqPromise, callback);
        jqPromise.resolve(resolveValue);
        await result;
        expect(callback.notCalled).to.be.true;
      });

      it('Skips callback on resolved javascript promises', async () => {
        const callback = sandbox.spy();
        const resolveValue = 'foo';
        const jsPromise = Promise.resolve(resolveValue);
        await safeFail(jsPromise, callback);
        expect(callback.notCalled).to.be.true;
      });
    });
  });

  describe('ajax poll', () => {
    const sandbox = sinon.createSandbox();
    let getSpy;
    const mockResponse = {
      id: 'bk12345'
    };

    beforeEach(() => {
      getSpy = sandbox.stub(ajax, 'get').returns({
        then: (isDoneCb) => {
          const predicate = isDoneCb(mockResponse);
          return {
            then: (pollTerminationCheck) => {
              pollTerminationCheck(predicate);
              return { fail: () => ({}) };
            },
            fail: () => ({})
          };
        }
      });
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should trigger polling request', async () => {
      const isDoneFunc = sinon.stub().returns(true);
      const pollCall = () => {
        return ajax.get('/api/some/request')
          .then(isDoneFunc);
      };
      const maxWait = 1000;
      const pollInterval = 200;
      await ajax.poll(pollCall, pollInterval, maxWait);

      expect(getSpy.called).to.be.true;
      expect(isDoneFunc.calledWithExactly(mockResponse)).to.be.true;
    });

    it('should stop polling request after max wait polling time', async () => {
      const isDoneFunc = sinon.stub().returns(false);
      const pollCall = () => {
        return ajax.get('/api/some/request')
          .then(isDoneFunc);
      };
      const maxWait = 1000;
      const pollInterval = 250;
      try {
        await ajax.poll(pollCall, pollInterval, maxWait);
      } catch (e) {
        expect(getSpy.callCount).to.be.greaterThan(3);
        expect(e).to.equal('Polling maxWait exceeded');
      }
    });

    it('should stop polling when predicate is object', async () => {
      const isDoneFunc = sinon.stub().returns({ isDone: true });
      const pollCall = () => {
        return ajax.get('/api/some/request')
          .then(isDoneFunc);
      };
      const maxWait = 1000;
      const pollInterval = 250;
      await ajax.poll(pollCall, pollInterval, maxWait);
      expect(getSpy.calledOnce).to.be.true;
    });
  });
  /* eslint-enable no-return-assign */

});
