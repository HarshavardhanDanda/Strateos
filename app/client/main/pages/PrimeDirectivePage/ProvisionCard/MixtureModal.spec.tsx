import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Table } from '@transcriptic/amino';
import ResourceStore from 'main/stores/ResourceStore';
import  MixtureModal, { ProvisionInstructionProps } from './MixtureModal';

describe('MixtureModal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const provisionInstruction1: ProvisionInstructionProps = {
    operation: {
      informatics: [
        {
          data: {
            mixture_id: 'mix1asw9yykf5admusj',
            total_volume: '33:microliter',
            volume_to_provision: '32.74:microliter',
          },
          type: 'provision_mixture',
        },
      ],
      op: 'provision',
      resource_id: 'rs1grjfm5kyzv9b',
    },
  };

  const provisionInstruction2: ProvisionInstructionProps = {
    operation: {
      informatics: [
        {
          data: {
            mixture_id: 'mix1asw9yykf5admusj',
            total_volume: '33:microliter',
            volume_to_provision: '0.13:microliter',
          },
          type: 'provision_mixture',
        },
      ],
      op: 'provision',
      resource_id: 'rs1grjfm5kyzv9f',
    },
  };

  beforeEach(() => {
    wrapper = shallow(
      <MixtureModal
        modalId={'mixturemodal1'}
        provisionInstructions={Immutable.List([
          provisionInstruction1,
          provisionInstruction2,
        ])}
        mixtureName={'test'}
        mixtureId={'mix1asw9yykf5admusj'}
      />
    );
  });
  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should display mixture Name and its value', () => {
    expect(wrapper.find('KeyValueList').length).to.equal(2);
    const entries = wrapper.find('KeyValueList').at(0).prop('entries');
    expect(entries[0].key).to.equal('Mixture Name');
    expect(entries[0].value).to.equal('test');
  });

  it('should display Total Volume and its value', () => {
    const entries = wrapper.find('KeyValueList').at(1).prop('entries');
    expect(entries[0].key).to.equal('Total Volume');
    expect(entries[0].value).to.equal('33:microliter');
  });

  it('should display mixture ID and its value', () => {
    const entries = wrapper.find('KeyValueList').at(0).prop('entries');
    expect(entries[1].key).to.equal('Mixture ID');
    expect(entries[1].value).to.equal('mix1asw9yykf5admusj');
  });

  it('should render resource table with headers', () => {
    const table = wrapper.find('.mixture-modal__resource-table').find(Table);
    expect(table).to.have.length(1);
    const headers = table.dive().find('Header').find('HeaderCell');
    expect(headers).to.have.length(3);
    expect(headers.at(0).dive().text()).to.equal('ID');
    expect(headers.at(1).dive().text()).to.equal('NAME');
    expect(headers.at(2).dive().text()).to.equal('QUANTITY');
  });

  it('should render table with correct resource information', () => {
    const resourceName = 'test_resource';
    const resourceStore = sandbox.stub(ResourceStore, 'getById');
    resourceStore.withArgs(provisionInstruction1.operation.resource_id).returns(Immutable.fromJS({ id: provisionInstruction1.operation.resource_id, name: resourceName }));
    resourceStore.withArgs(provisionInstruction2.operation.resource_id).returns(undefined);
    const table = wrapper.find('.mixture-modal__resource-table').find(Table);
    expect(table).to.have.length(1);
    const resource1Row = table
      .dive()
      .find('Body')
      .dive()
      .find('Row')
      .at(0)
      .dive()
      .find('BodyCell');
    expect(resource1Row.at(0).dive().text()).to.include('rs1grjfm5kyzv9b');
    expect(resource1Row.at(1).dive().text()).to.include(resourceName);
    expect(resource1Row.at(2).dive().text()).to.include('32.74:microliter');
    const resource2Row = table
      .dive()
      .find('Body')
      .dive()
      .find('Row')
      .at(1)
      .dive()
      .find('BodyCell');
    expect(resource2Row.at(0).dive().text()).to.include('rs1grjfm5kyzv9f');
    expect(resource2Row.at(1).dive().text()).to.include('-');
    expect(resource2Row.at(2).dive().text()).to.include('0.13:microliter');
  });
});
