import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import ProjectSelector from './ProjectSelector';

describe('ProjectSelector', () => {
  const sandbox = sinon.createSandbox();

  const props = {
    projectName: null,
    updateProjectId: sandbox.stub()
  };

  let wrapper;

  afterEach(() => {
    sandbox.restore();
  });

  it('should have typeahead input field for project selection', () => {
    wrapper = shallow(<ProjectSelector {...props} />);
    const typeAhead = wrapper.find('TypeAheadInput');
    expect(typeAhead).to.have.lengthOf(1);
    expect(typeAhead.prop('placeholder')).to.equal('Select project');
    expect(typeAhead.prop('value')).to.equal('');
  });

  it('should setState when typeahead input field onChange value', () => {
    wrapper = shallow(<ProjectSelector {...props} />);
    sandbox.spy(React, 'useState');
    const typeAhead = wrapper.find('TypeAheadInput');
    typeAhead.simulate('change', { target: { value: 'project' } });
    expect(React.useState.called).to.be.true;
  });

  it('should call updateProjectId when project is selected', () => {
    const updateProjectIdSpy = sandbox.spy();
    wrapper = shallow(<ProjectSelector {...props} suggestions={[{ name: 'project', id: '123' }]} updateProjectId={updateProjectIdSpy} setReactionDetails={() => { }} />);
    wrapper.find('TypeAheadInput').prop('onSuggestedSelect')('project');
    expect(updateProjectIdSpy.calledOnce).to.be.true;
  });

  it('should should make a callback when project is cleared', () => {
    const updateProjectIdSpy = sandbox.spy();
    wrapper = shallow(<ProjectSelector {...props} updateProjectId={updateProjectIdSpy} />);
    const typeAhead = wrapper.find('TypeAheadInput');
    typeAhead.simulate('change', { target: { value: 'org' } });

    typeAhead.props().onClear();
    expect(updateProjectIdSpy.calledOnce).to.be.true;
  });
});
