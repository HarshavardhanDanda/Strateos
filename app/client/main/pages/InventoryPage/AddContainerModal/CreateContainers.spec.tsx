import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import { PANELS } from 'main/pages/ReactionPage/CompoundSourceSelector/CreateContainerPane';
import CreateContainers from './CreateContainers';

describe('CreateContainers', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const containers = Immutable.fromJS([
    {
      containerType: 'bottle-500',
      force_validate: false,
      mass: '6:milligram',
      name: 'Tube 1',
      storage: 'cold_4',
      test_mode: true,
      volume: '8:microliter',
      wellMap: {}
    }
  ]);

  const containerTypes = Immutable.fromJS([
    {
      name: 'a1-vial',
    }
  ]);

  const props = {
    containers: containers,
    containerIndex: 0,
    containerTypes: containerTypes,
    onShowCSVJobsApi: () => {},
    onJobsApiCSVChange: () => {},
    onAddContainer: () => {},
    getLinkedCompoundArray: () => {},
    isPlate: () => {}
  };

  beforeEach(() => {
    sandbox.stub(ContainerTypeStore, 'getById').returns(containers.get(0));
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  describe('Active panel', () => {
    it('should display containers panel', () => {
      wrapper = shallow(<CreateContainers {...props} activePanel={PANELS.CONTAINER} />);

      expect(wrapper.dive().find('CreateContainersCreationPane').length).to.equal(1);
    });

    it('should display bulk csv plate upload panel', () => {
      wrapper = shallow(<CreateContainers {...props} activePanel={PANELS.UPLOAD_CSV_PLATE} />);

      expect(wrapper.dive().find('PlateCreateFromCSV').length).to.equal(1);
    });

    it('should display bulk csv tube upload panel', () => {
      wrapper = shallow(<CreateContainers {...props} activePanel={PANELS.UPLOAD_CSV_TUBES} />);

      expect(wrapper.dive().find('TubesCreateFromCSV').length).to.equal(1);
    });

    it('should display bulk zip plate upload panel', () => {
      wrapper = shallow(<CreateContainers {...props} activePanel={PANELS.UPLOAD_ZIP_PLATE} />);

      expect(wrapper.dive().find('BulkUploadPlateZip').length).to.equal(1);
    });

    it('should display job shipment api panel', () => {
      wrapper = shallow(<CreateContainers {...props} activePanel={PANELS.UPLOAD_CSV_JOBS_API} />);

      expect(wrapper.dive().find('BulkUploadJobsApi').length).to.equal(1);
    });
  });
});
