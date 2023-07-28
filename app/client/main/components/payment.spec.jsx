import React from 'react';

import AttachmentUploader from 'main/components/AttachmentUploader';
import { DateSelector, TextInput, Table, LabeledInput } from '@transcriptic/amino';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Urls from 'main/util/urls';
import { CreditCardInfoEditor, PurchaseOrderInfoEditor } from './payment';

describe('Payment methods', () => {
  let ref;
  afterEach(() => {
    if (ref) {
      ref.unmount();
    }
  });

  it('Check if add credit card modal loads correctly with required fields', () => {
    ref = shallow(<CreditCardInfoEditor
      cardInfo={{}}
      onChange={() => {}}
    />);
    const TextInputCount = ref.find(TextInput);
    const DateSelectorCount = ref.find(DateSelector);
    expect(TextInputCount.length).to.be.eql(4);
    expect(DateSelectorCount.length).to.be.eql(1);
  });

  it('Check if add purchase order modal loads correctly with required fields', () => {
    ref = shallow(<PurchaseOrderInfoEditor
      cardInfo={{}}
      onChange={() => {}}
    />);
    const TextInputCount = ref.find(TextInput);
    const DateSelectorCount = ref.find(DateSelector);
    const AttachmentUploaderCount = ref.find(AttachmentUploader);
    const TableCount = ref.find(Table);
    expect(TextInputCount.length).to.be.eql(3);
    expect(DateSelectorCount.length).to.be.eql(1);
    expect(AttachmentUploaderCount.length).to.be.eql(1);
    expect(TableCount.length).to.be.eql(1);
  });

  it('should have existing link in edit po modal', () => {
    ref = shallow(<PurchaseOrderInfoEditor
      cardInfo={{}}
      onChange={() => {}}
      attachmentUrl={'abcd'}
    />);
    const anchorTag = ref.find('a').first();
    expect(anchorTag.text()).to.eql(' Existing Attachment');
    expect(anchorTag.find('i').length).to.eql(1);
  });

  it('should have correct existing link in edit po modal', () => {
    ref = shallow(<PurchaseOrderInfoEditor
      cardInfo={{}}
      onChange={() => {}}
      attachmentUrl={'abcd'}
    />);
    const anchorTag = ref.find('a').first();
    expect(anchorTag.props().href).to.eql('/upload/url_for?key=abcd');
  });

  it('should not have existing link in create po modal', () => {
    ref = shallow(<PurchaseOrderInfoEditor
      cardInfo={{}}
      onChange={() => {}}
    />);
    expect(ref.find('a').length).to.eql(0);
  });

  it('should have checkbox enabled in address table for that address_id in edit po modal', () => {
    ref = shallow(<PurchaseOrderInfoEditor
      cardInfo={{}}
      onChange={() => {}}
      address_id={'ad123'}
    />);
    expect(ref.find(Table).props().selected.ad123).eql(true);
  });

  it('should redirect to address pane when clicked on Address pane link', () => {
    Urls.use('transcriptic');
    ref = shallow(<PurchaseOrderInfoEditor
      cardInfo={{}}
      onChange={() => {}}
      address_id={'ad123'}
      customerOrganizationId="orgabc"
    />);

    const Link = ref.find(LabeledInput).at(5).find('p').find('Link');
    expect(Link.children().text()).to.eql(' Address pane.');
    Link.simulate('click');
    expect(Link.prop('to')).to.equal('/transcriptic/customers/organization/orgabc/addresses');
  });

  it('should not render address pane link when customerOrganizationId prop does not exist', () => {
    ref = shallow(<PurchaseOrderInfoEditor />);
    expect(ref.find('Link').length).to.equals(0);
  });

  it('should render address pane link when customerOrganizationId prop exist', () => {
    ref = shallow(<PurchaseOrderInfoEditor customerOrganizationId={'custId'} />);
    expect(ref.find('Link').length).to.equals(1);
  });
});
