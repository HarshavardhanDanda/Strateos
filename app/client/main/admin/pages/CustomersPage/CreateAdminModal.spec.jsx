import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { TextInput } from '@transcriptic/amino';
import { SinglePaneModal } from 'main/components/Modal';

import { CreateAdminView } from './CreateAdminModal';

describe('CreateAdminModal View', () => {
  it('renders two input fields', () => {
    const ref = shallow(
      <CreateAdminView />
    );
    expect(ref.find(TextInput).length).to.equal(2);
    expect(ref.findWhere((node) => {
      node.prop('label') === 'Email';
    })).not.to.equal(undefined);
  });

  it('renders labels for each input', () => {
    const ref = shallow(
      <CreateAdminView />
    );
    expect(ref.findWhere((node) => {
      return node.prop('label') === 'Email';
    })).not.to.equal(undefined);
    expect(ref.findWhere((node) => {
      return node.prop('label') === 'Full Name';
    })).not.to.equal(undefined);
  });

  it('renders a modal', () => {
    const ref = shallow(
      <CreateAdminView />
    );
    expect(ref.find(SinglePaneModal).length).to.equal(1);
  });

  it('can display errors', () => {
    const ref = shallow(
      <CreateAdminView
        errors={{ email: ['some error'] }}
        forceValidate
      />
    );
    expect(ref.findWhere((node) => {
      return node.prop('label') == 'Email';
    }).prop('error')).to.equal('some error');
  });
});
