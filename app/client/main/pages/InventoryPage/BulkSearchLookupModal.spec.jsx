import sinon from 'sinon';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { TextArea, ZeroState } from '@transcriptic/amino';
import React from 'react';
import ModalActions from 'main/actions/ModalActions';
import BulkSearchLookupModal from './BulkSearchLookupModal';

describe('BulkSearchLookupModal', () => {
  const sandbox = sinon.createSandbox();
  const barcodeField = { name: 'barcode', value: 'barcode' };
  let wrapper;

  afterEach(() => {
    if (sandbox) sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  const zeroStateTest = (wrapper, searchFieldName) => {
    const zeroState = wrapper.find(ZeroState);
    const zeroStateSubtitle = wrapper.find('ZeroState').prop('subTitle').props.children[0];

    expect(wrapper.find('ZeroState').prop('title')).to.equal(`Look up ${searchFieldName}s`);
    expect(zeroStateSubtitle.props.children[0]).to.equal('Search for a list of containers by ');
    expect(zeroStateSubtitle.props.children[1].props.children).to.equal('copying');
    expect(zeroStateSubtitle.props.children[2]).to.equal(' and ');
    expect(zeroStateSubtitle.props.children[3].props.children).to.equal('pasting');
    expect(wrapper.find('ZeroState').prop('zeroStateSvg')).to.equal('/images/containers-illustration.svg');
    expect(wrapper.find('ZeroState').prop('actionElement')).not.to.be.null;
    expect(zeroState).to.have.length(1);
  };

  it('should display ZeroState by default for barcode', () => {
    const searchField = { name: 'barcode', value: 'barcode' };
    wrapper = shallow(<BulkSearchLookupModal searchField={searchField} />);
    zeroStateTest(wrapper, searchField.name);
    expect(wrapper.find('ZeroState').prop('subTitle').props.children[1]).to.equal(' a column from your csv into the text area below or ');
    expect(wrapper.find('ZeroState').prop('subTitle').props.children[2].props.children).to.equal('scanning');
    expect(wrapper.find('ZeroState').prop('subTitle').props.children[3]).to.equal(" the container's barcode");
  });

  it('should display ZeroState by default for names', () => {
    const searchField = { name: 'name', value: 'label' };
    wrapper = shallow(<BulkSearchLookupModal searchField={searchField} />);

    zeroStateTest(wrapper, searchField.name);
    expect(wrapper.find('ZeroState').prop('subTitle').props.children[1]).to.equal(' a column from your csv into the text area below');
  });

  it('should display ZeroState by default for ids', () => {
    const searchField = { name: 'id', value: 'id' };
    wrapper = shallow(<BulkSearchLookupModal searchField={searchField} />);

    zeroStateTest(wrapper, searchField.name);
    expect(wrapper.find('ZeroState').prop('subTitle').props.children[1]).to.equal(' a column from your csv into the text area below');
  });

  it('should update bulk search array with the searchText separated with space', () => {
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);
    const input = wrapper.find('TextArea');
    const searchTextArray = ['12345', '1235'];

    input.props().onChange({ target: { value: '12345 1235' } });
    wrapper.update();
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();
    wrapper.update();

    expect(wrapper.find('ManageContainerModal').props().searchTextArray).to.deep.equal(searchTextArray);
  });

  it('should update bulk search array with the searchText separated with comma', () => {
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);
    const input = wrapper.find('TextArea');
    const searchTextArray = ['12345', '1235'];

    input.props().onChange({ target: { value: '12345,1235' } });
    wrapper.update();
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();
    wrapper.update();

    expect(wrapper.find('ManageContainerModal').props().searchTextArray).to.deep.equal(searchTextArray);
  });

  it('should update bulk search array with the search text entered in a new line', () => {
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);
    const input = wrapper.find(TextArea);
    const searchTextArray = ['12345', '1235'];

    input.props().onChange({ target: { value: '12345\n1235' } });
    wrapper.update();
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();
    wrapper.update();

    expect(wrapper.find('ManageContainerModal').props().searchTextArray).to.deep.equal(searchTextArray);
  });

  it('should use comma or new line as a delimiter when searchField is name', () => {
    wrapper = shallow(<BulkSearchLookupModal searchField={{ name: 'name', value: 'label' }} />);
    const input = wrapper.find(TextArea);
    const searchTextArray = ['my name', 'name'];

    input.props().onChange({ target: { value: 'my name\nname' } });
    wrapper.update();
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();
    wrapper.update();

    expect(wrapper.find('ManageContainerModal').props().searchTextArray).to.deep.equal(searchTextArray);
  });

  it('should clear the textInput value and close the modal on clicking cancel button', () => {
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);
    const modalCloseStub = sandbox.stub(ModalActions, 'close').returns({});

    wrapper.find('TextArea').props().onChange({ target: { value: '12345 1235' } });
    wrapper.update();
    expect(wrapper.find('TextArea').props().value).to.equal('12345 1235');

    wrapper.find('ConnectedSinglePaneModal').props().onDismissed();
    wrapper.update();

    expect(wrapper.find('TextArea').props().value).to.equal('');
    expect(modalCloseStub.calledOnce).to.be.true;
    expect(modalCloseStub.args[0][0]).to.equal('BULK_SEARCH_LOOK_UP_MODAL');
  });

  it('should update bulk array when the scanned barcodes are submitted and open manage modal', () => {
    const modalCloseStub = sandbox.stub(ModalActions, 'open').returns({});
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);
    wrapper.find(TextArea).props().onChange({ target: { value: '12345' } });
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();

    expect(modalCloseStub.calledOnce).to.be.true;
    expect(modalCloseStub.args[0][0]).to.equal('MANAGE_CONTAINERS_MODAL');
  });

  it('should not open manage modal when clicking submit while searchTextArray is empty', () => {
    const modalCloseStub = sandbox.stub(ModalActions, 'open').returns({});
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();

    expect(modalCloseStub.calledOnce).to.be.false;
  });

  it('should not open manage modal on clicking submit when searchTextArray is empty', () => {
    const modalCloseStub = sandbox.stub(ModalActions, 'open').returns({});
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);
    wrapper.find(TextArea).props().onChange({ target: { value: '' } });
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();
    wrapper.update();

    expect(modalCloseStub.calledOnce).to.be.false;
  });

  it('should auto focus text area input on open', () => {
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);

    expect(wrapper.find(TextArea).prop('autoFocus')).to.be.true;
  });

  it('should have disableDismiss prop as true when textAreaInput has no other characters except space or next line or comma', () => {
    wrapper = shallow(<BulkSearchLookupModal searchField={barcodeField} />);
    wrapper.find(TextArea).props().onChange({ target: { value: ' \n,' } });

    expect(wrapper.find('ConnectedSinglePaneModal').props().disableDismiss).to.be.true;
    wrapper.find(TextArea).props().onChange({ target: { value: ' \n,test5' } });

    expect(wrapper.find('ConnectedSinglePaneModal').props().disableDismiss).to.be.false;
  });

  it('should call onApplyFilter when onManageSubmit is called', () => {
    const onApplyFilterSpy = sandbox.spy();
    wrapper = shallow(<BulkSearchLookupModal onApplyFilter={onApplyFilterSpy} searchField={barcodeField} />);
    wrapper.find('ManageContainerModal').props().onManageSubmit();

    expect(onApplyFilterSpy.calledOnce).to.be.true;
  });

  it('should reset searchTextArray state when onManageSubmit is called', () => {
    wrapper = shallow(<BulkSearchLookupModal onApplyFilter={() => {}} searchField={barcodeField} />);
    wrapper.find('ManageContainerModal').props().onManageSubmit();

    expect(wrapper.find('ManageContainerModal').props().searchTextArray).to.deep.equal([]);
  });
});
