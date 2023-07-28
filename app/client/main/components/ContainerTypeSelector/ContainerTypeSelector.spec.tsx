import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';

import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import ContainerTypeSelector from './ContainerTypeSelector';

describe('ContainerTypeSelector', () => {
  const sandbox = sinon.createSandbox();
  let wrapper, containerTypeActionsStub, containerTypeStoreStub, usableContainerTypesSpy;
  const containerTypes = [{
    data: [
      { id: 'a1-vial',  name: 'A1 vial', well_count: 10, retired_at: null },
      { id: 'flask-250', name: 'Flask 250', well_count: 5, retired_at: null },
      { id: 'pcr-0.5',  name: 'Pcr 0.5', well_count: 1, retired_at: '2021-02-27T11:34:55.483-08:00' },
    ]
  }];
  const props = {
    value: 'selected',
    onChange: () => { }
  };

  beforeEach(() => {
    containerTypeActionsStub = sandbox.stub(ContainerTypeActions, 'loadAll').returns({
      always: (cb) => {
        return {
          data: cb(containerTypes),
          fail: () => ({})
        };
      }
    });
    containerTypeStoreStub = sandbox.stub(ContainerTypeStore, 'getAll').returns(Immutable.fromJS(containerTypes[0].data));
    usableContainerTypesSpy = sandbox.spy(ContainerTypeStore, 'usableContainerTypes');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should render MultiSelect if isMultiSelect prop is passed', () => {
    wrapper = shallow(<ContainerTypeSelector {...props} isMultiSelect />);
    expect(wrapper.find('MultiSelect')).to.have.length(1);
  });

  it('should render select if isMultiSelect is false ', () => {
    wrapper = shallow(<ContainerTypeSelector {...props} isMultiSelect={false} />);
    expect(wrapper.find('Select')).to.have.length(1);
  });

  it('should call ContainerTypeActions and get from ContainerTypeStore on mount and passed as options ', () => {
    wrapper = mount(<ContainerTypeSelector {...props} />);
    expect(containerTypeActionsStub.calledOnce).to.be.true;
    expect(usableContainerTypesSpy.calledOnce).to.be.true;
    expect(wrapper.find('Select').props().options.toJS()).to.deep.equals([
      {
        name: 'A1 vial',
        value: 'a1-vial'
      },
      {
        name: 'Flask 250',
        value: 'flask-250'
      }
    ]);
  });

  it('should have Tubes and Plates when isDisplayTypeOptions prop is passed', () => {
    wrapper = mount(<ContainerTypeSelector {...props} isDisplayTypeOptions />);
    expect(containerTypeActionsStub.calledOnce).to.be.true;
    expect(containerTypeStoreStub.calledOnce).to.be.true;
    expect(wrapper.find('Select').props().options).to.deep.equals([
      {
        name: 'All Tubes',
        value: 'tubes'
      },
      {
        name: 'All Plates',
        value: 'plates'
      },
      {
        name: 'A1 vial',
        value: 'a1-vial'
      },
      {
        name: 'Flask 250',
        value: 'flask-250'
      }
    ]);
  });

  it('should not have Tubes and Plates and should filter containers by well count when well count prop is specified', () => {
    const containerTypes = [{ id: 'a1-vial',  name: 'A1 vial', well_count: 10, retired_at: null }];
    const getContainerTypesByWellCount = sandbox.stub(ContainerTypeStore, 'getContainerTypesByWellCount')
      .returns(Immutable.fromJS(containerTypes));
    wrapper = mount(<ContainerTypeSelector {...props} wellCount={10} />);
    expect(getContainerTypesByWellCount.calledOnce).to.be.true;
    expect(wrapper.find('Select').props().options.toJS()).to.deep.equals([{
      name: 'A1 vial',
      value: 'a1-vial'
    }]);
  });

  it('should call sortBy', () => {
    wrapper = mount(<ContainerTypeSelector {...props} sortBy={['well_count', 'name']} />);
    expect(wrapper.find('Select').props().options.toJS()).to.deep.equals([
      {
        name: 'Flask 250',
        value: 'flask-250'
      },
      {
        name: 'A1 vial',
        value: 'a1-vial'
      }
    ]);
  });

  it('should sort by name by default', () => {
    wrapper = mount(<ContainerTypeSelector {...props} />);
    expect(wrapper.props().sortBy).to.deep.equal(['name']);
    expect(wrapper.find('Select').props().options.toJS()).to.deep.equals([
      {
        name: 'A1 vial',
        value: 'a1-vial'
      },
      {
        name: 'Flask 250',
        value: 'flask-250'
      }
    ]);
  });

  it('should pass default props correctly', () => {
    wrapper = mount(<ContainerTypeSelector {...props} />);
    expect(wrapper.props().sortBy).to.deep.equal(['name']);
    expect(wrapper.props().placeholder).to.equal('Select Container Type');
    expect(wrapper.props().disabled).to.be.false;
    expect(wrapper.props().isMultiSelect).to.be.false;
    expect(wrapper.props().isSearchEnabled).to.be.false;
    expect(wrapper.props().isDisplayTypeOptions).to.be.false;
  });

  it('should include retired container types when includeRetiredContainerTypes prop is true', () => {
    wrapper = mount(<ContainerTypeSelector {...props} includeRetiredContainerTypes />);
    expect(containerTypeActionsStub.calledOnce).to.be.true;
    expect(containerTypeStoreStub.calledOnce).to.be.true;
    expect(wrapper.find('Select').props().options.toJS()).to.deep.equals([
      {
        name: 'A1 vial',
        value: 'a1-vial'
      },
      {
        name: 'Flask 250',
        value: 'flask-250'
      },
      {
        name: 'Pcr 0.5',
        value: 'pcr-0.5'
      }
    ]);
  });

  it('should exclude retired container types by default', () => {
    wrapper = mount(<ContainerTypeSelector {...props} />);
    expect(containerTypeActionsStub.calledOnce).to.be.true;
    expect(containerTypeStoreStub.calledOnce).to.be.true;
    expect(wrapper.find('Select').props().options.toJS()).to.deep.equals([
      {
        name: 'A1 vial',
        value: 'a1-vial'
      },
      {
        name: 'Flask 250',
        value: 'flask-250'
      }
    ]);
  });
});
