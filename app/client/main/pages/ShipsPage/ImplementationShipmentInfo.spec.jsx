import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import ImplementationShipmentInfo from 'main/pages/ShipsPage/ImplementationShipmentInfo';

describe('ImplementationShipmentInfo', () => {
  let wrapper;

  const props = {
    onTextInput: () => '',
    updateShipment: () => '',
    saveShipment: () => '',
    checkingIn: true,
    onPSUploaded: () => '',
    onPSUploadAborted: () => '',
    onPSAttached: () => '',
    labs: [{
      name: 'Menlo Park',
      value: 'lb1'
    }],
    shipment: {
      id: () => '',
      packingUrl: () => '',
      labId: () => '',
      type: () => '',
      organizationName: () => '',
    },
    package: {
      psFile: null,
      uploading: false
    }
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should render the link to attachment if a pre-existing shipment was provided', () => {
    const newProps = {
      ...props,
      shipment: {
        id: () => 'id',
        type: () => '',
        organizationName: () => '',
        packingUrl: () => 'https://shipment-packingUrl',
        labId: () => 'abc'
      }
    };
    wrapper = shallow(<ImplementationShipmentInfo {...newProps} />);
    const viewFileLink = wrapper.find('LabeledInput').at(0).dive().find('a');
    expect(viewFileLink).to.have.length(1);
    expect(viewFileLink.children().text()).to.equal('View File');
    expect(viewFileLink.props().href).includes('/upload/url_for');
  });

  it('should render file upload component when file is uploading', () => {
    const newProps = {
      ...props,
      package: {
        uploading: true,
        psFile: {}
      }
    };
    wrapper = shallow(<ImplementationShipmentInfo {...newProps} />);
    expect(wrapper.find('LabeledInput').at(0).dive().find('FileUpload')).to.have.length(1);
  });

  it('should render DragDropFilePicker component when there is no file uploading or present', () => {
    wrapper = shallow(<ImplementationShipmentInfo {...props} />);
    const dragDropFilePicker = wrapper.find('LabeledInput').at(0).dive().find('DragDropFilePicker');
    expect(dragDropFilePicker).to.have.length(1);
    expect(dragDropFilePicker.props().size).to.equal('small');
  });
});
