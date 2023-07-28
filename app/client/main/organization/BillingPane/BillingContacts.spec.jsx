import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';

import BillingContacts from './BillingContacts';

describe('Billing Card', () => {
  let billingCard;

  const billing_contacts = Immutable.fromJS([
    {
      id: '1',
      name: 'Joseph',
      email: 'joseph@transcriptic.com'
    },
    {
      id: '2',
      name: 'Hannah',
      email: 'hannah@transcriptic.com'
    }
  ]);

  const empty_billing_contacts = Immutable.fromJS([]);

  afterEach(() => {
    billingCard.unmount();
  });

  it('Billing card should have add billing contact button', () => {
    billingCard = shallow(
      <BillingContacts billingContacts={billing_contacts} />
    );
    expect(billingCard.find('.billing__add')).to.have.length(1);
  });

  it('When no billing contacts are added, a message should be shown', () => {
    billingCard = shallow(
      <BillingContacts billingContacts={empty_billing_contacts} />
    );
    expect(billingCard.find('.billing-contacts-table').find('p').text())
      .to.be.eql('No billing contacts added.');
  });

  it('Billing card should have a add billing contact modal', () => {
    billingCard = shallow(
      <BillingContacts billingContacts={billing_contacts} />
    );
    expect(billingCard.find('ConnectedAddBillingContactModal')).to.have.length(1);
  });

  it('Billing card should render a table of billing contacts when non-empty data is provided', () => {
    billingCard = shallow(
      <BillingContacts billingContacts={billing_contacts} />
    );
    expect(billingCard.find('Table')).to.have.length(1);
  });
});
