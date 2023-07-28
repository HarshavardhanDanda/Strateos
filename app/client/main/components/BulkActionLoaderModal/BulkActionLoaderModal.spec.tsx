import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Spinner, TextBody } from '@transcriptic/amino';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';

import BulkActionLoaderModal from './BulkActionLoaderModal';

describe('BulkActionLoaderModal', () => {
  const sandbox = sinon.createSandbox();
  const props = {
    action: 'download',
    bulkSelectionCount: 100
  };
  let wrapper;
  let modal;
  let modalCloseSpy;

  beforeEach(() => {
    modalCloseSpy = sandbox.spy(ModalActions, 'close');
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  const createWrapper = (extraProps?) => {
    wrapper = shallow(<BulkActionLoaderModal {...props} {...extraProps} />);
    modal = wrapper.find(SinglePaneModal);
  };

  const validateDrawer = (triggerAction?, expectations?, extraProps?) => {
    const { expectedDrawerState, expectedModalActionCloseSpyState } = expectations;
    createWrapper(extraProps);
    if (triggerAction) {
      triggerAction();
    }
    expect(modal.dive().dive().find('ModalDrawer').prop('drawerState')).to.equal(expectedDrawerState);
    expect(modalCloseSpy.calledOnceWithExactly('BULK_ACTION_LOADER_MODAL')).to.equal(expectedModalActionCloseSpyState);
  };

  it('should render correctly', () => {
    createWrapper();
    expect(wrapper.length).to.equal(1);
    expect(modal.prop('title')).to.eql('Download');
    expect(modal.prop('modalSize')).to.eql('medium');
    expect(modal.prop('closeOnClickOut')).to.be.false;
    expect(modal.prop('closeOnEsc')).to.be.false;
    expect(modal.prop('modalId')).to.eql('BULK_ACTION_LOADER_MODAL');
    expect(modal.prop('headerRenderer'));
    expect(modal.prop('hasDrawer')).to.be.true;
    expect(modal.prop('drawerTitle')).to.eql('Are you sure?');
    expect(modal.prop('drawerChildren').props.children).to.exist;
    expect(modal.prop('drawerFooterChildren').props.children).to.exist;
    expect(modal.prop('onDrawerClose')).to.exist;
    expect(modal.dive().dive().find('ModalDrawer').length).to.equal(1);
  });

  it('should display spinner', () => {
    createWrapper();
    expect(wrapper.find(Spinner).length).to.equal(1);
  });

  it('should display description', () => {
    createWrapper();
    expect(wrapper.find(TextBody).at(0)).to.exist;
    expect(wrapper.find(TextBody).at(0).children().length).to.equal(1);
    expect(wrapper.find(TextBody).at(0).props().children).to.eql('100 containers are being downloaded, this process will take awhile. \n' +
    '      Refreshing or navigating away from this page may not display desired results.');
  });

  it('should open drawer on modal dismiss', () => {
    const onModalDismissTriggerAction = () => {
      modal.dive().dive().find('SinglePaneModal').dive()
        .find('ModalHeader')
        .prop('onDismiss')();
      wrapper.update();
      // Redeclares modal since wrapper is a new one now
      modal = wrapper.find(SinglePaneModal);
    };
    validateDrawer(onModalDismissTriggerAction, {
      expectedDrawerState: true,
      expectedModalActionCloseSpyState: false
    });
    expect(modal.dive().dive().find('ModalDrawer').prop('drawerState')).to.equal(true);
    expect(modalCloseSpy.calledOnceWithExactly('BULK_ACTION_LOADER_MODAL')).to.equal(false);
  });

  it('should close drawer but keep modal open on drawer dismiss', () => {
    const onDrawerDismissTriggerAction = () => {
      modal.dive().dive().find('ModalDrawer').prop('onDrawerClose')();
      wrapper.update();
    };
    validateDrawer(onDrawerDismissTriggerAction, {
      expectedDrawerState: false,
      expectedModalActionCloseSpyState: false
    });
  });

  it('should close the modal and drawer on drawer continue button click', () => {
    const onContinueButtonClickTriggerAction = () => {
      modal.dive().dive().find('ModalDrawer').dive()
        .find('Button')
        .at(1)
        .simulate('click');
      wrapper.update();
    };
    validateDrawer(onContinueButtonClickTriggerAction, {
      expectedDrawerState: false,
      expectedModalActionCloseSpyState: true
    });
  });

  it('should close the drawer and keep modal open on drawer cancel button click', () => {
    const onCancelButtonClickTriggerAction = () => {
      modal.dive().dive().find('ModalDrawer').dive()
        .find('Button')
        .at(0)
        .prop('onClick')();
      wrapper.update();
    };
    validateDrawer(onCancelButtonClickTriggerAction, {
      expectedDrawerState: false,
      expectedModalActionCloseSpyState: false
    });
  });

  it('should display the correct description if action is relocate', () => {
    createWrapper({ action: 'relocate', bulkSelectionCount: 50 });
    expect(wrapper.find(TextBody).at(0)).to.exist;
    expect(wrapper.find(TextBody).at(0).children().length).to.equal(1);
    expect(wrapper.find(TextBody).at(0).props().children).to.eql('50 containers are being relocated, this process will take awhile. \n' +
    '      Refreshing or navigating away from this page may not display desired results.');
  });
});
