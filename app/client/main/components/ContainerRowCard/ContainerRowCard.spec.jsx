import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import { Card } from '@transcriptic/amino';
import sinon from 'sinon';
import FeatureConstants         from '@strateos/features';
import FeatureStore             from 'main/stores/FeatureStore';

import ContainerRowCard from 'main/components/ContainerRowCard/index.jsx';

const container = Immutable.fromJS([{
  id: 'aq1et8cdx7t3j52',
  container: 'pcr-0.5',
  status: 'available',
  container_type_id: 'pcr-0.5',
  storage_condition: 'cold_4',
  shipment_id: 'sr1f3d9kms9nccm',
  organization_id: 'org13',
  organization_name: 'Transcriptic',
  location_id: 'loc1dssgxed8dzgf',
  shipment_code: 'BVD',
  created_at: '2020-11-08T23:55:05.145-08:00',
  label: 'tube 1',
  public_location_description: 'In transit to Transcriptic.',
  hazards: ['flammable'],
  updated_at: '2020-11-08T23:55:05.218-08:00',
  aliquot_count: 5,
  created_by: 'u1fbwm6dcf3kh4'
}]);

const props = {
  containerTypeId: 'pcr-0.5',
  container: Immutable.Map(container),
  allowedColumns: [
    'name', 'id', 'type', 'format', 'contents',
    'condition', 'created', 'last used', 'code', 'organization', 'created by'
  ]
};

describe('ContainerRowCard', () => {

  var sandbox = sinon.createSandbox();

  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  it('should render without error', () => {
    shallow(
      <ContainerRowCard  {...props} />
    );
  });

  it('should have created by column in container row card', () => {
    const containerRowCard = shallow(
      <ContainerRowCard  {...props} />
    );
    expect(containerRowCard.find('div').last().hasClass('container-row-spacing__created-by')).to.be.true;
  });
  it('should not call onViewDetailsClicked when in modal', () => {
    const onDetailClick = sinon.stub();
    const containerRowCard = shallow(
      <ContainerRowCard  {...props} onModal onViewDetailsClicked={onDetailClick} />
    );
    containerRowCard.find(Card).prop('onClick')();
    expect(onDetailClick.calledOnce).to.be.false;
  });
  it('should not have organization column by default in container row card', () => {
    const containerRowCard = shallow(
      <ContainerRowCard  {...props} />
    );
    expect(containerRowCard.find('h4').at(0).hasClass('container-row-spacing__organization-name')).to.be.false;
  });
  it('should have organization column in container row card based on permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    const containerRowCard = shallow(
      <ContainerRowCard  {...props} />
    );
    expect(containerRowCard.find('h4').at(1).hasClass('container-row-spacing__organization-name')).to.be.true;
  });
});
