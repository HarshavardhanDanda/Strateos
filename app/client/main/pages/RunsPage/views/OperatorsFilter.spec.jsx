import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import OperatorsFilter from 'main/pages/RunsPage/views/OperatorsFilter';
import StoresContext, { makeNewContext } from 'main/stores/mobx/StoresContext';
import UserActions from 'main/actions/UserActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import { threadBounce } from 'main/util/TestUtil';
import { MultiSelect, Select } from '@transcriptic/amino';

const user123 = 'user123';
const user345 = 'user345';
const userOrange = 'userOrange';

const props = () => ({
  labIds: [],
  selectedIds: [],
  singleSelectId: '',
  currentUserId: user123,
  includeCustomOptions: false,
  isSingleSelect: true,
  onMultiChange: a => a,
  onSingleChange: a => a
});

function OperatorsWithContext({ stores, ...props }) {
  return (
    <StoresContext.Provider value={stores}>
      <OperatorsFilter {...props} />
    </StoresContext.Provider>
  );
}

describe('OperatorsFilter component', () => {
  let storesContext;
  let contextWrapper;
  let wrapper;
  const sandbox = sinon.createSandbox();

  const mount = () => {
    storesContext = makeNewContext();
    contextWrapper = enzyme.mount(<OperatorsWithContext stores={storesContext} {...props()} />);
    wrapper = contextWrapper.find(OperatorsFilter);
  };

  afterEach(() => {
    wrapper = undefined;
    if (contextWrapper) {
      contextWrapper.unmount();
    }
    sandbox.restore();
  });

  describe('lifecycle', () => {
    it('should attempt to load operators each time labIds props changes', async () => {
      sandbox.stub(AccessControlActions, 'loadPermissions').returns([{ userId: user123, }]);
      const userStub = sandbox.stub(UserActions, 'loadUsers').returns([
        { name: `${user345} name`, id: user345 },
        { name: `${userOrange} name`, id: userOrange }
      ]);
      mount();
      const lab1 = 'lab1';
      // wait on initial load calls to finish
      await threadBounce(2);
      const loadedCallCount = userStub.callCount;
      contextWrapper.setProps({ labIds: [lab1] });
      contextWrapper.setProps({ labIds: [lab1] });
      // Needed to wait on async stubs
      await threadBounce(2);
      expect(userStub.callCount - loadedCallCount).to.equal(1);
    });
  });

  describe('fetchOperators', () => {
    it('should include custom options before sorting remainder of users', async () => {
      sandbox.stub(AccessControlActions, 'loadPermissions').returns([{ userId: user123, }]);
      sandbox.stub(UserActions, 'loadUsers').returns([
        { name: 'c', id: 'a' },
        { name: 'a', id: 'd' },
        { name: 'b', id: 'c' },
        { name: 'd', id: 'b' },
      ]);
      mount();
      contextWrapper.setProps({ labIds: ['123'], includeCustomOptions: true });
      // hack to wait on state to resolve as well, need to bounce again if anymore async added
      await threadBounce(2);
      wrapper.update();
      expect(wrapper.instance().state.operators.map(o => o.name)).to.have.ordered.members([
        'Assigned to Me',
        'Unassigned',
        'All operators',
        'a',
        'b',
        'c',
        'd'
      ]);
    });
  });

  describe('Operator filter according to isSingleSelect prop', () => {

    it('should have Select component if there is isSingleSelect prop', () => {
      mount();
      expect(wrapper.find(MultiSelect).length).to.be.equal(0);
      expect(wrapper.find(Select).length).to.be.equal(1);
    });

    it('should have MultiSelect component if there is no isSingleSelect prop', () => {
      mount();

      contextWrapper.setProps({ isSingleSelect: false });
      wrapper = wrapper.update();

      expect(wrapper.find(MultiSelect).length).to.be.equal(1);
      expect(wrapper.find(Select).length).to.be.equal(0);
    });
  });
});
