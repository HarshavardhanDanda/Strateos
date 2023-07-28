import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import withPageWithSearchAndList from './PageWithSearchAndListHOC';

function ChildComponent() {
  return (<div>MOCK</div>);
}

describe('PageWithSearchAndListHOC', () => {
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
      const onViewDetailsClicked = () => 30;
      const page = () => 35;
      const numPages = () => 40;
      const pageSize = () => 45;
      return { onSearchFailed, onSearchPageChange, onSortChange, onSearchFilterChange, onSearchInputChange, onViewDetailsClicked, page, numPages, pageSize };
    };
    const ComponentWithPageWithSearchAndList = withPageWithSearchAndList(ChildComponent, getCustomPropsForComponent);
    function ParentComponent(props) {
      return (<ComponentWithPageWithSearchAndList {...props} />);
    }

    it('should use override functions instead of the functions in the HOC', () => {
      wrapper = shallow(<ParentComponent />);
      const childComponentProps = wrapper.dive().find('ChildComponent').props();
      expect(childComponentProps.onSearchFailed()).to.equal(5);
      expect(childComponentProps.onSearchPageChange()).to.equal(10);
      expect(childComponentProps.onSortChange()).to.equal(15);
      expect(childComponentProps.onSearchFilterChange()).to.equal(20);
      expect(childComponentProps.onSearchInputChange()).to.equal(25);
      expect(childComponentProps.onViewDetailsClicked()).to.equal(30);
      expect(childComponentProps.page()).to.equal(35);
      expect(childComponentProps.numPages()).to.equal(40);
      expect(childComponentProps.pageSize()).to.equal(45);
    });

    it('should not have HOC functions after custom override functions as props while returning WrappedComponent', () => {
      wrapper = shallow(<ParentComponent />);
      const childComponentProps = wrapper.dive().find('ChildComponent').props();
      const lastPropInWrappedComponent = Object.keys(childComponentProps)[Object.keys(childComponentProps).length - 1];
      expect(lastPropInWrappedComponent).to.equal('pageSize');
    });
  });

  describe('without custom overrides', () => {
    const ComponentWithPageWithSearchAndList = withPageWithSearchAndList(ChildComponent);
    function ParentComponent(props) {
      return (<ComponentWithPageWithSearchAndList {...props} />);
    }
    const actions = {
      onSearchPageChange: sandbox.stub(),
      onSortOptionChange: sandbox.stub(),
      onSearchFilterChange: sandbox.stub(),
      onSearchInputChange: sandbox.stub(),
      updateState: sandbox.stub()
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
      expect(actions.onSearchPageChange.calledOnce).to.be.true;
    });

    it('should call onSortChange function in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      wrapper.dive().find('ChildComponent').props().onSortChange();
      expect(actions.onSortOptionChange.calledOnce).to.be.true;
    });

    it('should call onSearchFilterChange function in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      wrapper.dive().find('ChildComponent').props().onSearchFilterChange();
      expect(actions.onSearchFilterChange.calledOnce).to.be.true;
    });

    it('should call onSearchInputChange function in HOC', () => {
      wrapper = shallow(<ParentComponent {...props} />);
      wrapper.dive().find('ChildComponent').props().onSearchInputChange();
      expect(actions.onSearchInputChange.calledOnce).to.be.true;
    });

    it('should call onViewDetailsClicked function in HOC', () => {
      const history = { push: sandbox.stub() };
      const result = Immutable.fromJS({ id: 'id123' });
      const resultUrl = sandbox.stub().returns('123');

      wrapper = shallow(
        <ParentComponent
          {...props}
          resultUrl={resultUrl}
          result={result}
          history={history}
        />
      );
      wrapper.dive().find('ChildComponent').props().onViewDetailsClicked(result);
      expect(actions.updateState.calledOnce).to.be.true;
      expect(actions.updateState.args[0][0]).to.deep.equal({ currentContainer: result });
      expect(history.push.calledOnce).to.be.true;
      expect(history.push.args[0][0]).to.equal('123');
      expect(resultUrl.calledOnce).to.be.true;
      expect(resultUrl.args[0][0]).to.equal('id123');
    });
  });
});
