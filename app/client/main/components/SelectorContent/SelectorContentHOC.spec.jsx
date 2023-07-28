import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';

import withSelectorContent from './SelectorContentHOC';

function ChildComponent() {
  return (<div>MOCK</div>);
}

describe('SelectorContentHOC', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
  });

  describe('with custom overrides', () => {
    const getCustomPropsForComponent = () => {
      const onSearchFailed = () => 5;
      const onSearchPageChange = () => 10;
      const onSortChange = () => 15;
      const onSearchFilterChange = () => 20;
      const onSearchInputChange = () => 25;
      const onSearchSimilarityChange = () => 60;
      const page = () => 30;
      const numPages = () => 35;
      const pageSize = () => 40;
      return { onSearchFailed,
        onSearchPageChange,
        onSortChange,
        onSearchFilterChange,
        onSearchInputChange,
        onSearchSimilarityChange,
        page,
        numPages,
        pageSize };
    };
    const ComponentWithSelectorContent = withSelectorContent(ChildComponent, getCustomPropsForComponent);
    function ParentComponent(props) {
      return (<ComponentWithSelectorContent {...props} />);
    }

    it('should use override functions instead of the functions in the HOC', () => {
      wrapper = shallow(<ParentComponent />);
      const childComponentProps = wrapper.dive().find('ChildComponent').props();
      expect(childComponentProps.onSearchFailed()).to.equal(5);
      expect(childComponentProps.onSearchPageChange()).to.equal(10);
      expect(childComponentProps.onSortChange()).to.equal(15);
      expect(childComponentProps.onSearchFilterChange()).to.equal(20);
      expect(childComponentProps.onSearchInputChange()).to.equal(25);
      expect(childComponentProps.onSearchSimilarityChange()).to.equal(60);
      expect(childComponentProps.page()).to.equal(30);
      expect(childComponentProps.numPages()).to.equal(35);
      expect(childComponentProps.pageSize()).to.equal(40);
    });

    it('should not have HOC functions after custom override functions as props while returning WrappedComponent', () => {
      wrapper = shallow(<ParentComponent />);
      const childComponentProps = wrapper.dive().find('ChildComponent').props();
      const lastPropInWrappedComponent = Object.keys(childComponentProps)[Object.keys(childComponentProps).length - 1];
      expect(lastPropInWrappedComponent).to.equal('pageSize');
    });
  });

  describe('without custom overrides', () => {
    const ComponentWithSelectorContent = withSelectorContent(ChildComponent);
    function ParentComponent(props) {
      return (<ComponentWithSelectorContent {...props} />);
    }
    const actions = {
      onSearchPageChange: sandbox.stub(),
      onSortOptionChange: sandbox.stub(),
      onSearchFilterChange: sandbox.stub(),
      onSearchInputChange: sandbox.stub(),
      onSearchSimilarityChange: sandbox.stub()
    };
    const props = {
      search: Immutable.fromJS({
        page: 5,
        num_pages: 10,
        per_page: 15
      }),
      actions
    };

    it('should call page, numPages, pageSize functions in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      const childComponentProps = wrapper.dive().find('ChildComponent').props();
      expect(childComponentProps.page()).to.equal(5);
      expect(childComponentProps.numPages()).to.equal(10);
      expect(childComponentProps.pageSize()).to.equal(15);
    });

    it('should use default values of page, numPages, pageSize functions in HOC if not specified in props', () => {
      wrapper = shallow(<ParentComponent {...props} search={Immutable.fromJS({})} />);
      const childComponentProps = wrapper.dive().find('ChildComponent').props();
      expect(childComponentProps.page()).to.equal(1);
      expect(childComponentProps.numPages()).to.equal(1);
      expect(childComponentProps.pageSize()).to.equal(1);
    });

    it('should call onSearchPageChange function in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      wrapper.dive().find('ChildComponent').props().onSearchPageChange();
      expect(actions.onSearchPageChange.called).to.be.true;
    });

    it('should call onSortChange function in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      wrapper.dive().find('ChildComponent').props().onSortChange();
      expect(actions.onSortOptionChange.called).to.be.true;
    });

    it('should call onSearchFilterChange function in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      wrapper.dive().find('ChildComponent').props().onSearchFilterChange();
      expect(actions.onSearchFilterChange.called).to.be.true;
    });

    it('should call onSearchInputChange function in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      wrapper.dive().find('ChildComponent').props().onSearchInputChange();
      expect(actions.onSearchInputChange.called).to.be.true;
    });

    it('should call onSearchSimilarityChange function in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      wrapper.dive().find('ChildComponent').props().onSearchSimilarityChange();
      expect(actions.onSearchSimilarityChange.called).to.be.true;
    });
  });
});
