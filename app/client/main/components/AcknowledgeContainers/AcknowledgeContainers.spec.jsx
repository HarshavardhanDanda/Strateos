import React             from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import { Button } from '@transcriptic/amino';
import AcknowledgeContainers   from './AcknowledgeContainers';

describe('AcknowledgeContainers tests', () => {

  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should render acknowledgement text with lab operator name', () => {
    wrapper = shallow(<AcknowledgeContainers labOperatorName="operator-name" />);
    expect(wrapper.find('h2').text()).to.equal(
      "Your samples must be in operator-name containers.  If you don\'t have operator-name containers, please\n              request an Intake Kit.");
  });

  it('should display button to add containers', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CREATE_SAMPLE_SHIPMENTS).returns(true);
    wrapper = shallow(<AcknowledgeContainers labOperatorName="operator-name" />);
    expect(wrapper.find(Button).at(0).dive().text()).to.equal('I have operator-name containers');
  });

  it('should display create test containers button when testMode is undefined and onsetTestMode prop is set', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    const onSetTestMode = sandbox.spy();
    getACS.withArgs(FeatureConstants.CREATE_SAMPLE_SHIPMENTS).returns(true);
    getACS.withArgs(FeatureConstants.CREATE_TEST_CONTAINERS).returns(true);
    wrapper = shallow(<AcknowledgeContainers labOperatorName="operator-name" onSetTestMode={onSetTestMode} />);
    expect(wrapper.find(Button).at(2).dive().text()).to.equal('Create Test Containers');
  });
});
