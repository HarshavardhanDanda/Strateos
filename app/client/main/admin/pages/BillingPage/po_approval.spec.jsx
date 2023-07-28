import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';

import { POApprovals } from './po_approvals';

describe('PO Approval', () => {
  let POApprovalView;

  const purchase_orders = Immutable.fromJS([
    {
      id: 'pm1e8heeqh6tr6k',
      organization_id: 'org13',
      created_at: '2020-03-20T00:43:02.793-07:00',
      type: 'PurchaseOrder',
      po_reference_number: '234568',
      po_limit: '123875.0',
      po_attachment_url: 'uploads/aeae6d15-c785-423c-9727-fa3e76fe634a/54.html',
      po_approved_at: undefined,
      po_invoice_address: undefined,
      expiry: '2023-03-04',
      is_valid: true,
      description: 'Test PO 1',
      is_removable: true,
      'is_default?': false,
      can_make_default: false,
      limit: '123875.0',
      address: {
        id: 'addr188rr9ukd7ry',
        attention: 'Second address 2',
        street: '35657 Haven Ave',
        street_2: 'Suite 4542344',
        city: 'Menlo park',
        state: 'CA',
        zipcode: '94025',
        country: 'US'
      },
      organization: {
        id: 'org13',
        name: 'Transcriptic',
        subdomain: 'transcriptic'
      }
    },
    {
      id: 'pm1e8hfpwchdhrg',
      organization_id: 'org13',
      created_at: '2020-03-20T01:00:11.029-07:00',
      type: 'PurchaseOrder',
      po_reference_number: '78645',
      po_limit: '1234553.0',
      po_attachment_url: 'uploads/db393ec5-fa1c-40a3-ab38-bb0f92038519/54.html',
      po_approved_at: undefined,
      po_invoice_address: undefined,
      expiry: '2025-07-06',
      is_valid: true,
      description: 'Test PO 2',
      is_removable: true,
      'is_default?': false,
      can_make_default: false,
      limit: '1234553.0',
      address: {
        id: 'addr188rr9ukd7ry',
        attention: 'Second address 2',
        street: '35657 Haven Ave',
        street_2: 'Suite 4542344',
        city: 'Menlo park',
        state: 'CA',
        zipcode: '94025',
        country: 'US'
      },
      organization: {
        id: 'org13',
        name: 'Transcriptic',
        subdomain: 'transcriptic'
      }
    }
  ]);

  afterEach(() => {
    POApprovalView.unmount();
  });

  it("Should render all unapproved PO's when data is loaded", () => {
    POApprovalView = mount(
      <POApprovals POs={purchase_orders} isLoaded />
    );
    expect(POApprovalView.find('tbody').find('tr')).to.have.length(2);
    expect(POApprovalView.find('Spinner')).to.have.length(0);
  });

  it('Should not render table when data is not loaded', () => {
    POApprovalView = mount(
      <POApprovals POs={purchase_orders} isLoaded={false} />
    );
    expect(POApprovalView.find('Spinner')).to.have.length(1);
  });

  it('Should show a message when data is empty', () => {
    POApprovalView = mount(
      <POApprovals POs={Immutable.fromJS([])} isLoaded />
    );
    expect(POApprovalView.find('Table').text()).to.be.eql('No POs pending approval.');
  });
});
