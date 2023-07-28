import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import TransferModal from './TransferModal';

describe('TransferModal', () => {
  let wrapper;

  const destinationOrgs = [
    {
      value: 'org17rcd7xzn473',
      name: 'yang'
    },
    {
      value: 'org17rcd7xzn472',
      name: 'transcriptic'
    }
  ];

  const renderDrawerFooter = (orgId) => {
    return (
      <p> {{ orgId }}</p>
    );
  };

  const props = {
    modalId: 'ContainerTransferModal',
    type: 'container',
    entity: 'Organization',
    onSearch: () => {},
    onTransfer: () => {},
    selection: ['id-1', 'id-2'],
    destinationOrgs,
    enableDrawer: true,
    setIsDrawerOpen: () => {},
    renderDrawerFooter,
    disableOrgSearch: true,
    selectionDescription: 'id-1, id-2 are selected'
  };

  const getModal = () => wrapper.dive().find('SinglePaneModal');
  const getDrawer = () => getModal().dive().find('ModalDrawer');

  it('should have Select when there are more than one destination Organizations while transfering containers', () => {
    wrapper = shallow(<TransferModal {...props} />);
    const select = getModal().find('LabeledInput').at(1).find('Select');
    expect(select).to.have.length(1);
    expect(select.dive().find('Suggestions')).to.have.length(1);
    expect(select.dive().find('Suggestions').props().suggestions[0].name).to.equal('yang');
    expect(select.dive().find('Suggestions').props().suggestions[1].name).to.equal('transcriptic');
  });

  it('should not have Select when there is one destination Organization while transfering containers', () => {
    wrapper = shallow(<TransferModal {...props} destinationOrgs={[destinationOrgs[1]]} />);
    expect(getModal().find('LabeledInput').at(1).find('p')).to.have.length(1);
    expect(getModal().find('LabeledInput').at(1).find('p')
      .text()).to.equal('transcriptic');
  });

  it('should have single org id automatically passed to modal drawer, when single destination Org is passed', () => {
    wrapper = shallow(<TransferModal {...props} destinationOrgs={[destinationOrgs[0]]} />);
    expect(getDrawer().props().drawerFooterChildren.props.children[1].orgId).to.eql(destinationOrgs[0].value);
  });

  it('should have selected Org Id is passed to modal, when multiple destination Org is passed', () => {
    wrapper = shallow(<TransferModal {...props} />);
    wrapper.setState({ selectedOrgId: 'org17rcd7xzn472' });
    expect(getDrawer().props().drawerFooterChildren.props.children[1].orgId).to.eql(destinationOrgs[1].value);
  });

  it('should pass receiving Id to modal when not of type "container"', () => {
    wrapper = shallow(<TransferModal {...props} receivingId="org17rcd7xzn472" type="notcontainer" />);
    expect(getDrawer().props().drawerFooterChildren.props.children[1].orgId).to.eql('org17rcd7xzn472');
  });

  it('should display selection text', () => {
    wrapper = shallow(<TransferModal {...props} />);
    expect(getModal().find('LabeledInput').at(0).prop('label')).to.equal('Selected containers');
    expect(getModal().find('LabeledInput').at(0).prop('children')).to.equal('id-1, id-2 are selected');
  });
});
