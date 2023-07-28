import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import SessionStore from 'main/stores/SessionStore';
import OrganizationAPI from 'main/api/OrganizationAPI';
import LabAPI from 'main/api/LabAPI';

import { NewOrgModal } from './NewOrgModal';

describe('New Org Modal test', () => {

  let wrapper;
  let orgCreateSpy;
  let mockLabApi;
  let mockSessionGetOrg;
  const initialWindow = global.window;
  const sandbox = sinon.createSandbox();

  const labs = Immutable.fromJS([
    {
      id: 'lab1',
      operated_by_id: 'org123',
      name: 'Menlo Park'
    },
    {
      id: 'lab2',
      name: 'San Diego',
      operated_by_id: 'org123'
    },
    {
      id: 'lab3',
      operated_by_id: 'org001',
      name: 'Test lab'
    }
  ]);

  const mockLabResponse = {
    data: [
      {
        id: 'lab1',
        type: 'labs',
        attributes: {
          name: 'Menlo Park',
          operated_by_id: 'org123',
        }
      },
      {
        id: 'lab2',
        type: 'labs',
        attributes: {
          name: 'San Diego',
          operated_by_id: 'org123'
        }
      }
    ]
  };

  beforeEach(() => {
    global.window = {
      location: {
        href: {
          value: 'test.com/transcriptic/customers/organizations'
        }
      }
    };

    mockLabApi = sandbox.stub(LabAPI, 'index').returns({
      done: (cb) => {
        cb(mockLabResponse);
        return { fail: () => ({}) };
      }
    });

    mockSessionGetOrg = sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org123' }));

    const mockOrgResponse = {
      data: {
        id: 'org134',
        type: 'organizations',
        attributes: {
          name: 'test org',
          subdomain: 'org-test'
        }
      }
    };
    orgCreateSpy = sandbox.stub(OrganizationAPI, 'create').returns({
      done: (cb) => {
        cb(mockOrgResponse);
        return { fail: () => ({}) };
      }
    });

    wrapper = shallow(
      <NewOrgModal
        modalId="NewOrgModalId"
        labs={labs}
      />);
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
    global.window = initialWindow;
  });

  it('should render on load', () => {
    expect(wrapper.find('ConnectedSinglePaneModal').length).to.equal(1);
  });

  it('should set cloudOperator state as current logged in org id', () => {
    expect(mockSessionGetOrg.calledOnce).to.be.true;
    expect(wrapper.state().cloudLabOperator).to.equal('org123');
  });

  it('should render lab drowndown based on labs prop', () => {
    expect(wrapper.find('LabeledInput').at(4).find('Select').props().options.size).to.equal(2);
    expect(wrapper.find('LabeledInput').at(4).find('Select').props().options.get(0).name).to.equal('Menlo Park');
    expect(wrapper.find('LabeledInput').at(4).find('Select').props().options.get(1).name).to.equal('San Diego');
  });

  it('should have name input', () => {
    expect(wrapper.find('LabeledInput').at(0).props().label).eq('Name');
  });

  it('should have URL input', () => {
    expect(wrapper.find('LabeledInput').at(1).props().label).eq('URL');
  });

  it('should have Owner user input', () => {
    expect(wrapper.find('LabeledInput').at(2).props().label).eq('Owning User (Must Be Existing)');
  });

  it('should have Organization type input', () => {
    expect(wrapper.find('LabeledInput').at(3).props().label).eq('Organization Type');
  });

  it('should have Lab selection input if org type is CL', () => {
    expect(wrapper.find('LabeledInput').at(4).props().label).eq('Lab');
  });

  it('should show Sector Input(kind selection)', () => {
    const sectorInput = wrapper.find({ label: 'Sector' });
    expect(sectorInput).to.have.length(1);
    expect(sectorInput.find('Select').length).to.equal(1);
    expect(sectorInput.find('Select').props().value).to.eq('academic');
    expect(sectorInput.find('Select').props().options.length).to.eq(4);
    expect(sectorInput.find('Select').props().options).to.deep.equal([
      { value: 'academic', name: 'Academia' },
      { value: 'pharma', name: 'Pharma' },
      { value: 'biotech', name: 'Biotechnology' },
      { value: 'other', name: 'Other' }]);
  });

  it('should have title as New Organization', () => {
    expect(wrapper.find('ConnectedSinglePaneModal').props().title).to.equal('New Organization');
  });

  it('should fetch labs on mount', () => {
    const expectedParams = {
      filters: {
        operated_by_id: 'org123'
      }
    };
    expect(mockLabApi.calledOnceWithExactly(expectedParams)).to.be.true;
    expect(wrapper.state().lab_id).to.equal('lab1');
  });

  it('should call create api on click Create Organization button', () => {
    wrapper.setState({
      name: 'Test Org',
      subdomain: 'test',
      kind: 'academic',
      creatingUserEmail: 'abc@strateos.com',
      orgType: 'CL',
      customer: {},
      cloudLabOperator: 'org13',
      customerSubdomain: undefined,
      lab_id: 'lab123'
    });

    const expectedParams =  {
      attributes: {
        name: 'Test Org',
        subdomain: 'test',
        kind: 'academic',
        creatingUserEmail: 'abc@strateos.com',
        orgType: 'CL',
        customerSubdomain: undefined,
        lab_id: 'lab123'
      }
    };

    wrapper.find('ConnectedSinglePaneModal').prop('onAccept')();
    expect(orgCreateSpy.calledOnceWithExactly(expectedParams)).to.be.true;
  });

});
