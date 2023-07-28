import React      from 'react';
import { expect } from 'chai';
import Immutable  from 'immutable';
import Dispatcher from 'main/dispatcher';
import sinon      from 'sinon';
import { Card, CollapsiblePanel } from '@transcriptic/amino';
import LocationStore from 'main/stores/LocationStore';
import LocationPath from 'main/components/LocationPath';
import { BrowserRouter } from 'react-router-dom';

import testRun       from 'main/test/run-json/everyInstructionAdminRun.json';
import { Panel as RefsPanel, getStateFromStores } from './index';

const immutableTestRun = Immutable.fromJS(testRun);
const rawContainers = testRun.refs.map(ref => ref.container);
const immutableContainers = Immutable.fromJS(rawContainers);

describe('RefsPanel', () => {
  const sandbox = sinon.createSandbox();
  let page;

  afterEach(() => {
    sandbox.restore();

    if (page) {
      page.unmount();
    }
  });

  it('should render properly with props', () => {
    page = enzyme.mount(
      <BrowserRouter>
        <RefsPanel
          initiallyCollapsed={false}
          run={immutableTestRun}
          containers={[immutableContainers]}
          containerIds={[immutableContainers.map(c => c.get('id'))]}
          onRunChange={() => {}}
        />
      </BrowserRouter>
    );

    expect(page).to.be.ok;
  });

  it('has a functioning getStateFromStores function', () => {
    page = undefined;
    Dispatcher.dispatch({ type: 'CONTAINER_LIST', containers: rawContainers });
    const { containers } = getStateFromStores({ run: immutableTestRun });

    expect(containers.length).to.equal(rawContainers.length);
  });

  it('should have a cover header column', () => {
    page = enzyme.shallow(
      <RefsPanel
        initiallyCollapsed={false}
        run={immutableTestRun}
        containers={[immutableContainers]}
        containerIds={[immutableContainers.map(c => c.get('id'))]}
        onRunChange={() => {}}
      />
    );

    expect(page.find('Table').find('Column').at(2).props().header).to.equal('Cover');
  });

  it('should not render LocationPath if container location doesn\'t have ancestors', () => {
    sandbox.stub(LocationStore, 'getById').returns(
      Immutable.fromJS({ id: 'lo123', name: 'test location' }));

    page = enzyme.mount(
      <BrowserRouter>
        <RefsPanel
          initiallyCollapsed={false}
          run={immutableTestRun}
          containers={[immutableContainers]}
          containerIds={[immutableContainers.map(c => c.get('id'))]}
          onRunChange={() => {}}
        />
      </BrowserRouter>

    );
    expect(page.find(LocationPath).length).to.equal(0);
    expect(page.find('.refs-panel__location').length).to.equal(immutableContainers.size);
    expect(page.find('.refs-panel__location').at(0).text()).to.contain('Unknown location');
  });

  it('should render LocationPath if container location has ancestors', () => {
    sandbox.stub(LocationStore, 'getById').returns(
      Immutable.fromJS(
        {
          id: 'lo123',
          name: 'test location',
          ancestors: Immutable.fromJS([{ id: 'lo122', name: 'test ancestor' }])
        }
      )
    );

    page = enzyme.mount(
      <BrowserRouter>
        <RefsPanel
          initiallyCollapsed={false}
          run={immutableTestRun}
          containers={[immutableContainers]}
          containerIds={[immutableContainers.map(c => c.get('id'))]}
          onRunChange={() => {}}
        />
      </BrowserRouter>
    );

    expect(page.find(LocationPath).length).to.equal(immutableContainers.size);
  });

  it('should have Card component wrapped for CollapsiblePanel', () => {
    page = enzyme.mount(
      <BrowserRouter>
        <RefsPanel
          initiallyCollapsed={false}
          run={immutableTestRun}
          containers={[immutableContainers]}
          containerIds={[immutableContainers.map(c => c.get('id'))]}
          onRunChange={() => {}}
        />
      </BrowserRouter>
    );

    const card = page.find(Card);
    expect(card).to.have.length(1);
    expect(card.find(CollapsiblePanel)).to.have.length(1);
  });
});
