import { expect } from 'chai';
import Immutable from 'immutable';
import _ from 'lodash';
import { statusPopoverItems } from './StatusItems.jsx';

describe('StatusItems', () => {

  const run = {
    requested_at: '2020-06-08T18:31:47.818-07:00',
    accepted_at: null,
    started_at: '2020-07-08T18:31:47.818-07:00'
  };

  it('should add estimated time in pending or accepted run if exists', () => {
    let items = statusPopoverItems(Immutable.fromJS(run), 'pending');
    expect(items.length).to.eq(1);
    expect(items[0].header).to.eq('Requested Date');

    items  = statusPopoverItems(Immutable.fromJS(_.extend({}, run, { estimated_run_time: '631' })), 'pending');
    expect(items.length).to.eq(2);
    expect(items[0].header).to.eq('Requested Date');
    expect(items[1].header).to.eq('Estimated Time');

    items = statusPopoverItems(Immutable.fromJS(run), 'accepted');
    expect(items.length).to.eq(3);
    expect(items[0].header).to.eq('Requested Date');
    expect(items[1].header).to.eq('Accepted Date');
    expect(items[2].header).to.eq('Started Date');

    items  = statusPopoverItems(Immutable.fromJS(_.extend({}, run, { estimated_run_time: '631' })), 'accepted');
    expect(items.length).to.eq(4);
    expect(items[0].header).to.eq('Requested Date');
    expect(items[1].header).to.eq('Accepted Date');
    expect(items[2].header).to.eq('Started Date');
    expect(items[3].header).to.eq('Estimated Time');
  });
});
