import React                       from 'react';
import { expect }                  from 'chai';
import sinon from 'sinon';
import StoresContext, { makeNewContext, StoresContextI } from 'main/stores/mobx/StoresContext';
import { mount, ReactWrapper } from 'enzyme';
import { List } from 'immutable';
import RunTransferModal from './RunTransferModal';

describe('RunTransferModal', () => {

  let wrapper: ReactWrapper;
  let wrapperContext: ReactWrapper;
  let storesContext: StoresContextI;
  interface modalProps {
    userId?: string;
    projectId?: string;
    subdomain?: string;
  }

  function RunTransferModalWithContext({ stores, userId = '', projectId = '', subdomain = '' }) {
    return (
      <StoresContext.Provider value={stores}>
        <RunTransferModal userId={userId} projectId={projectId} subdomain={subdomain} />
      </StoresContext.Provider>
    );
  }

  const mountModal = (props?: modalProps) => {
    storesContext = makeNewContext();
    wrapperContext = mount(<RunTransferModalWithContext stores={storesContext} {...props} />);
    wrapper = wrapperContext.find(RunTransferModal);
  };

  afterEach(() => {
    wrapper = undefined;
    if (wrapperContext) {
      wrapperContext.unmount();
    }
  });

  it('should render RunTransferModal having multiple panes', () => {
    mountModal();
    const panes: List<string> = wrapper.find('ConnectedMultiPaneModal').prop('paneTitles');
    expect(panes.size).to.equal(2);
    expect(panes.toString()).to.include('Select run');
    expect(panes.toString()).to.include('Destination');
  });

  it('should be a MultiProgressTracker modal', () => {
    mountModal();
    expect(wrapper.find('ConnectedMultiPaneModal').prop('multiProgressTracker')).to.be
      .true;
  });

  it('should update data when project id change', () => {
    const loadDataSpy = sinon.spy(RunTransferModal.prototype, 'loadData');
    const props = { userId: 'ssda', projectId: 'p1gtupff72t8p8', subdomain: 'llc' };

    mountModal(props);
    expect(loadDataSpy.calledOnce).to.be.true;
    wrapperContext.setProps({ projectId: 'p1gtupff72t833' });
    expect(loadDataSpy.calledTwice).to.be.true;
  });
});
