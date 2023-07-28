import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import ContainerTypeStore  from 'main/stores/ContainerTypeStore';
import VerifySamples from './VerifySamples';

describe('VerifySamples', () => {
  let wrapper;
  let containerTypeStoreStub;

  const sandbox = sinon.createSandbox();
  const props = {
    waitingOnContainers: false,
    containers: Immutable.fromJS([
      {
        container_type_id: 'micro-1.5',
        label: '0_007TubewithMass',
        storage_condition: 'cold_4',
        type: 'containers',
        id: 'ct1guepc8cujv8g'
      }
    ]),
    reportSealCheckChange: () => {},
    reportBadSealMessagePresence: () => {}
  };

  beforeEach(() => {
    containerTypeStoreStub = sandbox.stub(ContainerTypeStore, 'isPlate');
    containerTypeStoreStub.withArgs('micro-1.5').returns(true);
    containerTypeStoreStub.withArgs('tube').returns(undefined);
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render Verify Samples', () => {
    wrapper = shallow(<VerifySamples {...props} />);
  });

  it('should not display bad seal message if containers prop does not contain any plate', () => {
    wrapper = shallow(<VerifySamples {...props} />);
    wrapper.setProps({ containers: props.containers.setIn([0, 'container_type_id'], 'tube') });
    expect(wrapper.find('div').at(2).text()).to.equal(`Dry ice shipments can have up to 5 plates or one tube box (81 tubes),
           while ambient shipments have twice that capacity.`);
  });

  it('should display bad seal message if containers prop contains plate', () => {
    wrapper = shallow(<VerifySamples {...props} />);
    wrapper.setProps({ containers: props.containers.setIn([0, 'container_type_id'], 'micro-1.5') });
    expect(wrapper.find('div').at(2).text()).to.equal(`Due to the geometry of the flagged containers, the seal integrity cannot
                   be guaranteed in transit. To proceed and accept the responsibility for the
                   container's integrity and possible well contamination, please confirm below:I accept`);
  });
});
