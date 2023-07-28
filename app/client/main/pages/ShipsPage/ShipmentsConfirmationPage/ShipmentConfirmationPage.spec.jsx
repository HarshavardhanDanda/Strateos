import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Button, ButtonGroup } from '@transcriptic/amino';
import { expect } from 'chai';
import ContainerActions from 'main/actions/ContainerActions';
import ShipmentConfirmationPage from './ShipmentConfirmationPage';

describe('ShipmentConfirmationPage', () => {

  let wrapper;
  const sandbox = sinon.createSandbox();

  const props = {
    intakeKit: {
      id: 'ik1e5a2yhpwfewp',
      name: 'Intake Kit 7',
      lab_id: 'lb123',
      organization_id: 'org123',
      easy_post_label_url: 'https://i.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U'
    },
    containerIds: ['c123', 'c234'],
    intakeKitNotes: 'abcdxyz'

  };

  afterEach(() => {
    sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  it('basic rendering', () => {
    expect(shallow(<ShipmentConfirmationPage {...props} />).length).equal(1);
  });

  it('should have barcode label image', () => {
    wrapper = shallow(<ShipmentConfirmationPage {...props}  />);
    const barcodeLabelImg = wrapper.find('img');
    expect(barcodeLabelImg).to.not.be.null;
  });

  it('should have download label button', () => {
    wrapper = shallow(<ShipmentConfirmationPage {...props} />);
    const downloadButton = wrapper.find(ButtonGroup).find(Button).at(0).props().children;
    expect(downloadButton).to.equal('Download label');
  });

  it('should trigger download label button callback', () => {
    const spy = sandbox.spy(ShipmentConfirmationPage.prototype, 'onDownloadClick');
    wrapper = shallow(<ShipmentConfirmationPage {...props} />);
    const downloadButton = wrapper.find(ButtonGroup).find(Button).at(0).dive();
    downloadButton.simulate('click');
    expect(spy.calledOnce).to.be.true;

  });

  it('should have print label button', () => {
    wrapper = shallow(<ShipmentConfirmationPage {...props} />);
    const printButton = wrapper.find(ButtonGroup).find(Button).at(1).props().children;
    expect(printButton).to.equal('Print label');
  });

  it('should have to prop in print label button', () => {
    wrapper = shallow(<ShipmentConfirmationPage {...props} />);
    const printButton = wrapper.find(ButtonGroup).find(Button).at(1).props().to;
    expect(printButton).to.be.not.undefined;
  });

  it('should have Ship to customer button', () => {
    wrapper = shallow(<ShipmentConfirmationPage {...props} />);
    const shipToCustomerBtn = wrapper.find(ButtonGroup).find(Button).at(2).props().children;
    expect(shipToCustomerBtn).to.equal('Ship to customer');
  });

  it('should trigger ship to customer button callback', () => {
    const containersUpdate = sandbox.stub(ContainerActions, 'updateMany').returns({
      done: () => {
      }
    });

    wrapper = shallow(<ShipmentConfirmationPage  {...props} />);
    sandbox.stub(global, 'confirm').returns(true);
    const shipToCustomerBtn = wrapper.find(ButtonGroup).find(Button).at(2).dive();
    shipToCustomerBtn.simulate('click');
    expect(containersUpdate.calledOnce).to.be.true;
  });

  it('should have notes to customer field', () => {
    wrapper = shallow(<ShipmentConfirmationPage  {...props} />);
    expect(wrapper.find('LabeledInput').length).to.equal(1);
    expect(wrapper.find('LabeledInput').at(0).props().label).to.equal('Notes to customer');
    expect(wrapper.find('LabeledInput').at(0).children().find('TextArea').length).to.equal(1);
    expect(wrapper.find('LabeledInput').at(0).children().find('TextArea')
      .props().value).to.equal('abcdxyz');
  });

  it('should trigger change event on notes to customer field', () => {
    wrapper = shallow(<ShipmentConfirmationPage  {...props} />);
    const textArea = wrapper.find('LabeledInput').at(0).children().find('TextArea');
    textArea.simulate('change', { target: { value: '123456' } });
    expect(wrapper.instance().state.notes).to.equal('123456');
  });

});
