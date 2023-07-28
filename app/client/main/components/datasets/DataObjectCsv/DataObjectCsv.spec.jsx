import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { CsvViewer, Banner, Button } from '@transcriptic/amino';
import sinon from 'sinon';

import DataObjectCsv from './DataObjectCsv';

const props = {
  dataObject: Immutable.Map(),
  data: 'test',
};

describe('DataObjectCsv', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    wrapper = shallow(<DataObjectCsv {...props} />);
  });

  afterEach(() => {
    if (sandbox) sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  it('should render without error', () => {
    expect(wrapper.find(CsvViewer).length).to.equal(1);
  });

  it('should generate csv with the correct file name', () => {
    wrapper = shallow(
      <DataObjectCsv
        {...props}
        csvName="r1oi8z7vnwu_CT (490.25)"
      />);
    const fileName = wrapper.find('DataObjectFileHeader').prop('csvName');
    expect(fileName).to.equal('r1oi8z7vnwu_CT (490.25)');
  });

  it('should pass updated csv data in CsvViewer', () => {
    wrapper.setProps({ updatedCsvData: 'test 123' });
    expect(wrapper.find(CsvViewer).props().data).to.equal('test 123');
  });

  it('should show banner message if csv is updated', () => {
    wrapper.setProps({ updatedCsvData: 'test 123' });
    expect(wrapper.find(Banner).length).to.equal(1);
  });

  it('should not show banner message if csv is not updated', () => {
    expect(wrapper.find(Banner).length).to.equal(0);
  });

  it('should reset to original csv when click on Undo changes button', () => {
    const updateCsvSpy = sandbox.spy();

    wrapper = shallow(
      <DataObjectCsv
        {...props}
        updateCsv={updateCsvSpy}
      />);

    wrapper.setProps({ updatedCsvData: 'test 123' });
    expect(wrapper.find(Banner).length).to.equal(1);
    const undoButton = wrapper.find(Banner).dive().find(Button);
    undoButton.simulate('click');
    expect(wrapper.find(CsvViewer).props().data).to.equal('test');
    expect(updateCsvSpy.calledOnceWithExactly('test')).to.be.true;
  });

});
