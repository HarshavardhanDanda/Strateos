import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { InplaceInput, Button, MultiSelect, AddInplace } from '@transcriptic/amino';

import EditableProperty from './EditableProperty';

describe('EditableProperty', () => {
  let component;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (sandbox) sandbox.restore();
    if (component) component.unmount();
  });

  it('should display value', () => {
    component = enzyme.mount(
      <EditableProperty
        value="bar"
        onSave={() => {}}
      />
    );

    expect(component.find('p').length).to.equal(1);
    expect(component.find('p').text()).to.equal('bar');
  });

  it('should display value without formatting when disableFormatText prop', () => {
    component = enzyme.mount(
      <EditableProperty value="bar" disableFormatText  onSave={() => {}} />
    );

    expect(component.find('p').length).to.equal(0);
    expect(component.text()).to.equal('bar');
  });

  it('should display name value', () => {
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        onSave={() => {}}
      />
    );

    expect(component.find('p').length).to.equal(2);
    expect(component.find('p').at(0).text()).to.equal('foo');
    expect(component.find('p').at(1).text()).to.equal('bar');
  });

  it('should display edit component', () => {
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        onSave={() => {}}
      />
    );

    component.find(Button).at(0).simulate('click');
    expect(component.find('.editable-property__view-component').text()).to.equal('foo');
    expect(component.find('TextInput').length).to.equal(1);
    expect(component.find('TextInput').prop('type')).to.equal('text');
  });

  it('should display edit component with labeled input', () => {
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        showLabeledInput
        onSave={() => {}}
      />
    );

    component.find(Button).at(0).simulate('click');
    expect(component.find('.editable-property__view-component').text()).to.equal('');
    expect(component.find('TextInput').length).to.equal(1);
    expect(component.find('LabeledInput').length).to.equal(1);
    expect(component.find('TextInput').prop('type')).to.equal('text');
  });

  it('should display name edit component', () => {
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        nameEditable
        value="bar"
        onSave={() => {}}
      />
    );

    component.find(Button).at(0).simulate('click');
    expect(component.find('.editable-property__view-component').length).to.equal(0);
    expect(component.find('TextInput').length).to.equal(2);
  });

  it('should display AddInPlace component', () => {
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        canAddNewKeyValuePair
        value="bar"
        onSave={() => {}}
      />
    );
    expect(component.find(AddInplace).length).to.equal(1);
  });

  it('should display Select when options', () => {
    const onChangeSpy = sandbox.spy();
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="1"
        options={[{ name: '1', value: '1' }, { name: '2', value: '2' }]}
        onChange={onChangeSpy}
        onSave={() => {}}
      />
    );

    component.find(Button).at(0).simulate('click');
    expect(component.find('Select').length).to.equal(1);

    component.instance().onChange({ foo: '2' });
    expect(onChangeSpy.calledOnce).to.be.true;
  });

  it('should display selected name in view mode', () => {
    component = enzyme.mount(
      <EditableProperty
        value={'2'}
        onSave={() => {}}
        options={[{
          value: '1',
          name: 'Internal'
        },
        {
          value: '2',
          name: 'External'
        }]}
      />
    );

    expect(component.find('p').text()).to.equal('External');
  });

  it('should display MultiSelect when multiSelect is true', () => {
    const onChangeSpy = sandbox.spy();
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value={['Internal']}
        options={[{
          value: 'Internal',
          name: 'Internal'
        },
        {
          value: 'External',
          name: 'External'
        }]}
        multiSelect
        onChange={onChangeSpy}
        onSave={() => {}}
      />
    );
    component.find(Button).at(0).simulate('click');

    expect(component.find(MultiSelect).length).to.equal(1);
    expect(component.instance().state.updatedValueForm.length).to.equal(1);

    component.instance().onChange({ foo: ['External'] });
    expect(onChangeSpy.calledOnce).to.be.true;
  });

  it('should display colon separated value if prop passed', () => {
    component = enzyme.mount(
      <EditableProperty
        name="test"
        value="check"
        displayColonSeparated
        onSave={() => {}}
      />
    );
    expect(component.find('.inplace-input__input-wrapper').at(1).text().slice(0, 5)).to.equal('test:');
  });

  it('should display Yes for boolean ccp with true value', () => {
    component = enzyme.mount(
      <EditableProperty
        name="test"
        value="true"
        renderAsBool
        onSave={() => {}}
      />
    );
    expect(component.find('.inplace-input__input-wrapper').at(1).text().slice(0, 5)).to.equal('Yes');
  });

  it('should display No for boolean ccp with false value', () => {
    component = enzyme.mount(
      <EditableProperty
        name="test"
        value="false"
        renderAsBool
        onSave={() => {}}
      />
    );
    expect(component.find('.inplace-input__input-wrapper').at(1).text().slice(0, 5)).to.equal('No');
  });

  it('should display multiSelect selected names in view mode', () => {
    component = enzyme.mount(
      <EditableProperty
        value={['2', '3']}
        multiSelect
        onSave={() => {}}
        options={[{
          value: '1',
          name: 'Org 1'
        },
        {
          value: '2',
          name: 'Org 2'
        },
        {
          value: '3',
          name: 'Org 3'
        }]}
      />
    );

    expect(component.find('p').text()).to.equal('Org 2, Org 3');
  });

  it('should display TypeAheadInput when searchable', () => {
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        searchable
        suggestions={[{ name: '1' }, { name: '2' }]}
        onSave={() => {}}
      />
    );

    component.find(Button).at(0).simulate('click');
    expect(component.find('TypeAheadInput').length).to.equal(1);
  });

  it('should call onSave', () => {
    const onSave = sandbox.spy();

    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        onSave={onSave}
      />
    );

    component.find(Button).at(0).simulate('click');
    component.find(Button).at(1).simulate('click');
    expect(onSave.calledOnce).to.equal(true);
  });

  it('should call onCancel', () => {
    const onCancel = sandbox.spy();

    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        onCancel={onCancel}
        onSave={() => {}}
      />
    );

    component.find(Button).at(0).simulate('click');
    component.find(Button).at(0).simulate('click');
    expect(onCancel.calledOnce).to.equal(true);
  });

  it('should call onDelete', () => {
    const onDelete = sandbox.spy();

    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        onDelete={onDelete}
        onSave={() => {}}
      />
    );

    component.find(Button).at(1).simulate('click');
    expect(onDelete.calledOnce).to.equal(true);
  });

  it('should show placeholder', () => {
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        placeholderSuffix="baz"
        onSave={() => {}}
      />
    );

    component.find(Button).at(0).simulate('click');
    expect(component.find('TextInput').props().placeholder).to.equal('Enter baz');

    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        onSave={() => {}}
      />
    );

    component.find(Button).at(0).simulate('click');
    expect(component.find('TextInput').props().placeholder).to.equal('Enter foo');
  });

  it('should not display edit and delete buttons', () => {
    component = enzyme.mount(
      <EditableProperty
        name="foo"
        value="bar"
        editable={false}
        onSave={() => {}}
      />
    );
    expect(component.find(Button).length).to.equal(0);
  });

  it('should set input type', () => {
    component = enzyme.mount(
      <EditableProperty name="foo" value="bar" type="number"  onSave={() => {}} />
    );
    component.find(Button).at(0).simulate('click');
    expect(component.find('TextInput').prop('type')).to.equal('number');
  });

  it('should render view from renderViewValue prop if set', () => {
    component = enzyme.mount(
      <EditableProperty
        value="bar"
        renderViewValue={(value) => `This is a special value ${value} $$#!!`}
        onSave={() => {}}
      />
    );
    expect(component.find('p').text()).to.equal('This is a special value bar $$#!!');
  });

  it('should display error message when input value is invalid', () => {
    component = enzyme.mount(
      <EditableProperty
        value=""
        validationRegex="^[0-9]*$"
        errorMsg="Invalid value for integer"
        onSave={() => {}}
      />
    );

    expect(component.state().error).to.equal('');
    component.instance().onChange({ updatedValueForm: 'aloha' });
    component.update();
    expect(component.find(InplaceInput).prop('content')[0].error).to.equal('Invalid value for integer');
  });

  it('should not display error message when input value is valid', () => {
    component = enzyme.mount(
      <EditableProperty
        value=""
        validationRegex="^[0-9]*$"
        errorMsg="Invalid value for integer"
        onSave={() => {}}
      />
    );

    expect(component.find(InplaceInput).prop('content')[0].error).to.equal('');
    component.instance().onChange({ updatedValueForm: '777' });
    component.update();
    expect(component.find(InplaceInput).prop('content')[0].error).to.equal('');
  });

  it('should have keyName prop to the Inplace input', () => {
    component = enzyme.mount(
      <EditableProperty
        value=""
        name="radio"
        keyName="radio-property"
        renderAsBool
        onSave={() => {}}
      />
    );
    expect(component.find('InplaceInput').props().keyName).to.equal('radio-property');
  });

});
