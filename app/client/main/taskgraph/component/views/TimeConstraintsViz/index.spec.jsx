import { expect } from 'chai';
import Immutable from 'immutable';

import { constraintToKeys, createBoundSummary } from './index';

const { render } = enzyme;

describe('TimeConstraintsViz', () => {

  it('constraintToKeys should return expected keys', () => {

    const constraints = [
      {
        from: {
          startOf: 'inst'
        },
        to: {
          startOf: 'inst'
        }
      },
      {
        from: {
          startOf: 'inst'
        },
        to: {
          endOf: 'inst'
        }
      },
      {
        from: {
          endOf: 'inst'
        },
        to: {
          startOf: 'inst'
        }
      },
      {
        from: {
          endOf: 'inst'
        },
        to: {
          endOf: 'inst'
        }
      }
    ];

    expect(constraintToKeys(Immutable.fromJS(constraints[0]))).to.equal('startToStart');
    expect(constraintToKeys(Immutable.fromJS(constraints[1]))).to.equal('startToEnd');
    expect(constraintToKeys(Immutable.fromJS(constraints[2]))).to.equal('endToStart');
    expect(constraintToKeys(Immutable.fromJS(constraints[3]))).to.equal('endToEnd');
  });

  it('createBoundSummary should return the expected summary', () => {

    const bounds = [
      {
        less_than: '60:second'
      },
      {
        more_than: '60:second'
      },
      {
        ideal: Immutable.Map({
          value: '60:second'
        })
      },
      {
        less_than: '60:second',
        more_than: '30:second'
      },
      {
        less_than: '60:second',
        more_than: '30:second',
        ideal: Immutable.Map({
          value: '45:second'
        })
      }
    ];

    expect(render(createBoundSummary(bounds[0])).text()).to.equal('Less than 60 seconds.');
    expect(render(createBoundSummary(bounds[1])).text()).to.equal('More than 60 seconds.');
    expect(render(createBoundSummary(bounds[2])).text()).to.equal('Ideally 60 seconds.');
    expect(render(createBoundSummary(bounds[3])).text()).to.equal('Between 30 seconds and 60 seconds.');
    expect(render(createBoundSummary(bounds[4])).text()).to.equal('Between 30 seconds and 60 seconds. Ideally 45 seconds.');
  });
});
