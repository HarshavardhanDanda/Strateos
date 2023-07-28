import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import CheckinLogic from 'main/models/KitCheckinModal/CheckInLogic';
import MultiRowEditorModal from './MultiRowEditorModal';

describe('MultiRowEditorModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const rowData = [
    {
      form_idx: 0,
      id: 'omatc1h75mcvmqgy2u',
      material_idx: 0,
      name: 'ian-b',
      sku: '32893022',
      volume: { value: 1245, isValid: false },
      mass_per_container: { value: 1245, isValid: false },
      container_type: { id: 'a1-vial', well_count: 1, well_volume_ul: '3500.0' },
    },
    {
      form_idx: 1,
      id: 'omatc1h75mcvmjy6hq',
      material_idx: 0,
      name: 'Test sequence',
      sku: null,
      volume: { value: 3100, isValid: false },
      mass_per_container: { value: 3100, isValid: false },
      container_type: { id: 'a1-vial', well_count: 1, well_volume_ul: '3500.0' },
    },
    {
      form_idx: 2,
      id: 'omatc1h75mcvmeeczk',
      material_idx: 0,
      name: 'M13KO7 Helper Phage',
      volume: { value: 109, isValid: false },
      mass_per_container: { value: 109, isValid: false },
      container_type: { id: 'a1-vial', well_count: 1, well_volume_ul: '3500.0' },
    },
    {
      form_idx: 3,
      id: 'omatc1h75mcvm8rdce',
      material_idx: 0,
      name: '1.7 µM Eu-anti-His ab',
      sku: null,
      volume: { value: 42000, isValid: false },
      mass_per_container: { value: 42000, isValid: false },
      container_type: { id: 'a1-vial', well_count: 1, well_volume_ul: '3500.0' },
    }];

  describe('Barcode in MultiRowEditorModal', () => {

    const dataWithLocation = {
      id: 'omatc1h75mcvmqgy2u',
      material_idx: 0,
      form_idx: 0,
      barcode: { value: 'abc', isValid: false },
      location: { lab_id: 'lab123' },
      name: 'ian-b',
      sku: '1890102012'
    };

    const dataWithNoBarcode = {
      id: 'omatc1h75mcvmqgy2u',
      material_idx: 0,
      form_idx: 0,
      barcode: { value: '', isValid: null },
      location: { lab_id: 'lab123' },
      name: 'ian-b',
      sku: '1890102012'
    };

    const rowData = [
      {
        barcode: { value: '2345678', isValid: false },
        form_idx: 0,
        id: 'omatc1h75mcvmqgy2u',
        location: { lab_id: 'testLab' },
        material_idx: 0,
        name: 'ian-b',
        sku: '32893022',
      },
      {
        barcode: { value: '', isValid: false },
        form_idx: 1,
        id: 'omatc1h75mcvmjy6hq',
        location: { lab_id: 'checkLab34' },
        material_idx: 0,
        name: 'Test sequence',
        sku: null,
      },
      {
        barcode: { value: '3333000', isValid: false },
        form_idx: 2,
        id: 'omatc1h75mcvmeeczk',
        location: { lab_id: 'test1234' },
        material_idx: 0,
        name: 'M13KO7 Helper Phage',
      },
      {
        barcode: { value: '', isValid: false },
        form_idx: 3,
        id: 'omatc1h75mcvm8rdce',
        location: { lab_id: 'checkLab34' },
        material_idx: 0,
        name: '1.7 µM Eu-anti-His ab',
        sku: null,
      },
      {
        barcode: { value: '', isValid: false },
        form_idx: 4,
        id: 'omatc1h75mcvm47kua',
        location: null,
        material_idx: 0,
        name: '0.625 uM Eu-Anti-pCREB',
        sku: null,
      },
      {
        barcode: { value: '', isValid: false },
        form_idx: 0,
        id: 'omatc1h75mcvkh2ers',
        location: { lab_id: 'laboo900' },
        material_idx: 1,
        name: '1 mM Staurosporine in DMSO',
        sku: '981932452',
      },
      {
        barcode: { value: '', isValid: false },
        form_idx: 0,
        id: 'omatc1h75mcvk29v3c',
        location: null,
        material_idx: 2,
        name: 'Anhydrotetracycline hydrochloride',
        sku: null,
      },
    ];

    const promisedData = [
      {
        id: 'omatc1h75mcvmqgy2u',
        material_idx: 0,
        form_idx: 0,
        barcode: { value: 'ABC123', isValid: true },
        location: { lab_id: 'lab123' },
        name: 'ian-b',
        sku: '1890102012',
      },
    ];

    afterEach(() => {
      sandbox.restore();
      wrapper.unmount();
    });

    it('should render modal with material name, sku, text input and validation check',  async () => {
      const onValidateField = sandbox.stub().returns(
        Promise.resolve(Immutable.fromJS([
          {
            barcode: { value: '2345678', isValid: true },
            form_idx: 0,
            id: 'omatc1h75mcvmqgy2u',
            location: { lab_id: 'testLab' },
            material_idx: 0,
            name: 'ian-b',
            sku: '32893022',
          },
          {
            barcode: { value: '3333000', isValid: true },
            form_idx: 2,
            id: 'omatc1h75mcvmeeczk',
            location: { lab_id: 'test1234' },
            material_idx: 0,
            name: 'M13KO7 Helper Phage',
          },
        ]))
      );
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS(rowData)}
          validateField={onValidateField}
          shouldValidate
        />
      );
      await wrapper.props().onOpen();
      await wrapper.update();
      const rows = wrapper.find('Table').dive().find('Row');

      expect(rows.at(1).find('BodyCell').at(0).find('p')
        .text()).to.equal('ian-b');
      expect(rows.at(1).find('BodyCell').at(1).find('p')
        .text()).to.equal('32893022');
      expect(rows.at(1).find('BodyCell').at(2).find('TextInput')
        .props().value).to.equal('2345678');
      expect(rows.at(1).find('BodyCell').at(3).find('Icon')
        .prop('icon')).to.eql('fa fa-check');
      expect(rows.at(3).find('BodyCell').at(3).find('Icon')
        .prop('icon')).to.eql('fa fa-check');

      return wrapper;
    });

    it('should have table with 4 columns', () => {
      const onValidateField = sandbox.spy();
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const columns = wrapper.find('Table').find('Column');
      expect(columns.at(0).props().header).to.equal('Name');
      expect(columns.at(1).props().header).to.equal('Sku');
      expect(columns.at(2).props().header).to.equal('Barcode');
      expect(columns.at(3).props().header).to.equal('');
      expect(columns.length).to.be.equal(4);
    });

    it('should update barcode value on text input change', () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .onChange({ target: { value: 'ABC123' } });

      expect(wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props().value).to.equal('ABC123');
    });

    it('should trim spaces on both ends of text on input change', () => {
      const onValidateField = sandbox.spy();
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .onChange({ target: { value: ' ABC123789  ' } });
      expect(wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props().value).to.equal('ABC123789');
    });

    it('should render barcodes in separate row when we paste a column of barcodes', () => {
      const onValidateField = sandbox.spy();
      const getDataStub = sandbox.stub().returns('123\n456 789\n1011');
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS(rowData)}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const event = {
        clipboardData: { getData: getDataStub },
        preventDefault: () => {}
      };
      const rows = wrapper.find('Table').dive().find('Row');

      rows.at(1).find('BodyCell').at(2).find('TextInput')
        .props()
        .onPaste(event);

      expect(wrapper.find('Table').dive().find('Row').at(1)
        .find('BodyCell')
        .at(2)
        .find('TextInput')
        .props().value).to.equal('123');
      expect(wrapper.find('Table').dive().find('Row').at(2)
        .find('BodyCell')
        .at(2)
        .find('TextInput')
        .props().value).to.equal('456 789');
      expect(wrapper.find('Table').dive().find('Row').at(3)
        .find('BodyCell')
        .at(2)
        .find('TextInput')
        .props().value).to.equal('1011');
    });

    it('should render barcode value in the form on submit', (done) => {
      const onSubmitSpy = sandbox.spy();
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          data={Immutable.fromJS([dataWithLocation])}
          onSubmit={onSubmitSpy}
          validateField={onValidateField}
          shouldValidate
        />
      );
      wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .onChange({ target: { value: 'test123' } });
      expect(wrapper.props().children.props.data.getIn([0, 'barcode', 'value'])).to.eql('test123');
      wrapper.props().onAccept().then(() => {
        expect(onSubmitSpy.calledWith(wrapper.props().children.props.data)).to.be.true;
        done();
      });
    });

    it('should not close modal when barcode value is invalid and user clicks submit', (done) => {
      const onSubmitSpy = sandbox.spy();
      const promisedDataInvalidBarcode = [
        {
          id: 'omatc1h75mcvmqgy2u',
          material_idx: 0,
          form_idx: 0,
          barcode: { value: 'test123', isValid: false },
          location: { lab_id: 'lab123' },
          name: 'ian-b',
          sku: '1890102012',
        },
      ];
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedDataInvalidBarcode)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          data={Immutable.fromJS([dataWithLocation])}
          onSubmit={onSubmitSpy}
          validateField={onValidateField}
          shouldValidate
        />
      );
      wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .onChange({ target: { value: 'test123' } });
      expect(wrapper.props().children.props.data.getIn([0, 'barcode', 'value'])).to.eql('test123');
      wrapper.props().onAccept().then(() => {
        expect(onSubmitSpy.notCalled).to.be.true;
        expect(wrapper.find('ConnectedSinglePaneModal').props().disableDismiss).to.be.true;
        done();
      });
    });

    it('should trigger barcode validation when modal is open', () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = mount(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      wrapper.find('ConnectedSinglePaneModal').find('SinglePaneModal').props().onOpen();
      wrapper.update();
      expect(wrapper.props().validateField.calledOnce).to.be.true;
    });

    it('should show error on change when invalid barcode input is provided', () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => { }}
          data={Immutable.fromJS([dataWithNoBarcode])}
          validateField={onValidateField}
          shouldValidate
          formFieldValidator="barcode"
        />
      );
      const event = { target: { value: 'ABC$123' } };
      let bodyCells = wrapper.find('Table').dive().find('BodyCell');

      expect(bodyCells.at(3).find('Icon').length).to.equal(0);
      bodyCells.at(2).find('TextInput').props().onChange(event);
      wrapper.update();
      bodyCells = wrapper.find('Table').dive().find('BodyCell');
      expect(bodyCells.at(3).find('Icon').prop('icon')).to.eql('fa fa-times');
      expect(onValidateField.notCalled).to.be.true;
    });

    it('should show check mark on change when valid barcode input is provided', () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => { }}
          data={Immutable.fromJS([dataWithNoBarcode])}
          validateField={onValidateField}
          shouldValidate
          formFieldValidator="barcode"
        />
      );
      const event = { target: { value: 'ABC123' } };
      let bodyCells = wrapper.find('Table').dive().find('BodyCell');

      expect(bodyCells.at(3).find('Icon').length).to.equal(0);
      bodyCells.at(2).find('TextInput').props().onChange(event);
      wrapper.update();
      bodyCells = wrapper.find('Table').dive().find('BodyCell');
      expect(bodyCells.at(3).find('Icon').prop('icon')).to.eql('fa fa-check');
      expect(onValidateField.notCalled).to.be.true;
    });

    it('should trigger duplicated barcode validation on blur', () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const event = { target: { value: 'ABC123' } };
      const bodyCells = wrapper.find('Table').dive().find('BodyCell');
      bodyCells.at(2).find('TextInput').props().onChange(event);
      bodyCells.at(2).find('TextInput').props().onBlur();

      expect(onValidateField.calledOnce).to.be.true;
    });

    it('should update duplicated barcode validation status on blur', async () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const event = { target: { value: 'ABC123' } };
      const bodyCells = wrapper.find('Table').dive().find('BodyCell');
      bodyCells.at(2).find('TextInput').props().onChange(event);
      await bodyCells.at(2).find('TextInput').props().onBlur();
      expect(wrapper.props().children.props.data.getIn([0, 'barcode', 'isValid'])).to.be.true;
    });

    it('should render fa-times icon when barcode is not valid (duplicated)', async () => {
      const promisedData = [
        {
          id: 'omatc1h75mcvmqgy2u',
          material_idx: 0,
          form_idx: 0,
          barcode: { value: 'abc', isValid: false },
          location: { lab_id: 'lab123' },
          name: 'ian-b',
          sku: '1890102012',
        },
      ];
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const bodyCells = wrapper.find('Table').dive().find('BodyCell');
      await bodyCells.at(2).find('TextInput').props().onBlur();
      wrapper.update();

      expect(bodyCells.at(3).find('Icon').prop('icon')).to.eql('fa fa-times');
    });

    it('should render fa-check icon when barcode is valid (not duplicated)', async () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const bodyCells = wrapper.find('Table').dive().find('BodyCell');
      await bodyCells.at(2).find('TextInput').props().onBlur();

      expect(wrapper.find('Table').dive().find('BodyCell').at(3)
        .find('Icon')
        .prop('icon')).to.eql('fa fa-check');
    });

    it('should not render validation icon when shouldValidate is passed as false', async () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate={false}
        />
      );
      const bodyCells = wrapper.find('Table').dive().find('BodyCell');
      expect(bodyCells.length).to.eql(3);
    });

    it('should not validate barcode when preValidation returns no data', async () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve([]));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([rowData[1]])}
          validateField={onValidateField}
          preValidationFilter={() => Immutable.fromJS([])}
          shouldValidate
        />
      );
      const event = { target: { value: 'ABC123' } };
      const bodyCells = wrapper.find('Table').dive().find('BodyCell');
      bodyCells.at(2).find('TextInput').props().onChange(event);
      await bodyCells.at(2).find('TextInput').props().onBlur();

      expect(wrapper.find('Table').dive().find('BodyCell').at(3)
        .find('Icon')).to.be.empty;
    });

    it('should not validation mark when barcode when isValid null', async () => {
      const nullValidData = Immutable.fromJS([
        {
          id: 'omatc1h75mcvmqgy2u',
          material_idx: 0,
          form_idx: 0,
          barcode: { value: 'ABC123', isValid: null },
          location: { lab_id: 'lab123' },
          name: 'ian-b',
          sku: '1890102012',
        },
      ]);
      const onValidateField = sandbox.stub().returns(Promise.resolve(nullValidData));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={nullValidData}
          preValidationFilter={() => null}
          validateField={onValidateField}
          shouldValidate
        />
      );

      const bodyCells = wrapper.find('Table').dive().find('BodyCell');
      const event = { target: { value: 'ABC123' } };
      bodyCells.at(2).find('TextInput').props().onChange(event);
      await bodyCells.at(2).find('TextInput').props().onBlur();
      expect(bodyCells.at(3).find('Icon')).to.be.empty;
    });

    it('should validate barcode data based on filtered data from preValidation', async () => {
      const dataBeforePreValidation = Immutable.fromJS([{
        barcode: { value: '2345678', isValid: null },
        form_idx: 0,
        id: 'omatc1h75mcvmqgy2u',
        location: { lab_id: 'testLab' },
        material_idx: 0,
        name: 'ian-b',
        sku: '32893022',
      },
      {
        barcode: { value: 'CDE456', isValid: null },
        form_idx: 1,
        id: 'omatc1h75mcvmjy6hq',
        location: { lab_id: null },
        material_idx: 0,
        name: 'Test sequence',
        sku: null,
      }]);
      const dataAfterPreValidation = Immutable.fromJS([{
        barcode: { value: 'ABC123', isValid: true },
        form_idx: 0,
        id: 'omatc1h75mcvmqgy2u',
        location: { lab_id: 'testLab' },
        material_idx: 0,
        name: 'ian-b',
        sku: '32893022',
      }]);
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(dataAfterPreValidation)));
      const onPreValidationFilter = sandbox.stub().returns(dataAfterPreValidation);
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={dataBeforePreValidation}
          preValidationFilter={onPreValidationFilter}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const event = { target: { value: 'ABC123' } };
      wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .onChange(event);
      await wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .onBlur();

      expect(onValidateField.calledOnce);
      expect(wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .value).to.equal('ABC123');
      expect(wrapper.find('Table').dive().find('BodyCell').at(3)
        .find('Icon')
        .prop('icon')).to.eql('fa fa-check');
      expect(wrapper.find('Table').dive().find('BodyCell').at(6)
        .find('TextInput')
        .props()
        .value).to.equal('CDE456');
      expect(wrapper.find('Table').dive().find('BodyCell').at(7)
        .find('Icon')).to.be.empty;
    });

    it('should sort rows based on columns', async () => {
      const unsortedData = [{
        barcode: { value: '', isValid: false },
        form_idx: 0,
        id: 'omatc1h75mcvm8rdce',
        location: { lab_id: 'checkLab34' },
        material_idx: 0,
        name: 'a',
        sku: null,
      },
      {
        barcode: { value: '', isValid: false },
        form_idx: 1,
        id: 'omatc1h75mcvm47kua',
        location: null,
        material_idx: 0,
        name: 'b',
        sku: null,
      },
      {
        barcode: { value: '', isValid: false },
        form_idx: 2,
        id: 'omatc1h75mcvkh2ers',
        location: { lab_id: 'laboo900' },
        material_idx: 1,
        name: 'c',
        sku: '981932452',
      }];
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(unsortedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS(unsortedData)}
          preValidationFilter={() => Immutable.fromJS(unsortedData)}
          validateField={onValidateField}
          shouldValidate
        />
      );

      expect(wrapper.find('Table').dive().find('BodyCell').at(0)
        .find('p')
        .text()).to.eql('a');
      expect(wrapper.find('Table').dive().find('BodyCell').at(4)
        .find('p')
        .text()).to.eql('b');
      expect(wrapper.find('Table').dive().find('BodyCell').at(8)
        .find('p')
        .text()).to.eql('c');

      wrapper.find('Table').find('Column').at(0).props()
        .onSortChange('name', 'desc');
      wrapper.update();

      expect(wrapper.find('Table').dive().find('BodyCell').at(0)
        .find('p')
        .text()).to.eql('c');
      expect(wrapper.find('Table').dive().find('BodyCell').at(4)
        .find('p')
        .text()).to.eql('b');
      expect(wrapper.find('Table').dive().find('BodyCell').at(8)
        .find('p')
        .text()).to.eql('a');
    });

    it('should reset formData state on dismiss', async () => {
      const onValidateField = sandbox.stub().returns(Promise.resolve(Immutable.fromJS(promisedData)));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="barcode"
          fieldTitle="barcode"
          onSubmit={() => {}}
          data={Immutable.fromJS([dataWithLocation])}
          preValidationFilter={() => Immutable.fromJS([dataWithLocation])}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const event = { target: { value: 'ABC123' } };
      wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .onChange(event);
      await wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .onBlur();

      expect(wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .value).to.equal('ABC123');
      expect(wrapper.find('Table').dive().find('BodyCell').at(3)
        .find('Icon')
        .prop('icon')).to.eql('fa fa-check');

      wrapper.props().beforeDismiss();

      expect(wrapper.find('Table').dive().find('BodyCell').at(2)
        .find('TextInput')
        .props()
        .value).to.equal('abc');
      expect(wrapper.find('Table').dive().find('BodyCell').at(3)
        .find('Icon')
        .prop('icon')).to.eql('fa fa-times');
    });
  });

  describe('MultiRowEditorModal for Mass', () => {

    afterEach(() => {
      sandbox.restore();
      wrapper.unmount();
    });

    it('should have error message if mass is invalid', async () => {
      const onValidateField = sandbox.stub().returns(
        Promise.resolve(
          Immutable.fromJS([
            {
              form_idx: 0,
              id: 'omatc1h75mcvmqgy2u',
              location: { lab_id: 'testLab' },
              material_idx: 0,
              name: 'ian-b',
              sku: '32893022',
              mass_per_container: {
                value: '4000',
                isValid: false,
                error: 'Must be between 0mg and 7000mg',
              },
              container_type: {
                id: 'a1-vial',
                well_count: 1,
                well_volume_ul: '3500.0',
              },
            },
            {
              barcode: { value: '', isValid: false },
              form_idx: 3,
              id: 'omatc1h75mcvm8rdce',
              location: { lab_id: 'checkLab34' },
              material_idx: 0,
              name: '1.7 µM Eu-anti-His ab',
              sku: null,
              mass_per_container: { value: 420, isValid: true },
              container_type: {
                id: 'a1-vial',
                well_count: 1,
                well_volume_ul: '3500.0',
              },
            },
          ])
        )
      );
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="mass_per_container"
          fieldTitle="mass"
          onSubmit={() => {}}
          data={Immutable.fromJS(rowData)}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const event = { target: { value: '5000' } };
      wrapper.find('Table').dive().find('Row').at(1)
        .find('BodyCell')
        .at(2)
        .find('TextInput')
        .props()
        .onChange(event);
      await wrapper.find('Table').dive().find('Row')
        .at(1)
        .find('BodyCell')
        .at(2)
        .find('TextInput')
        .props()
        .onBlur();

      expect(wrapper.find('Table').dive().find('Row')
        .at(1)
        .find('BodyCell')
        .at(2)
        .find('Validated')
        .props().error).to.equal('Must be between 0mg and 7000mg');
    });
  });

  describe('MultiRowEditorModal for Volume', () => {

    afterEach(() => {
      sandbox.restore();
      wrapper.unmount();
    });

    it('should disable submit button on invalid row input', async () => {
      const onValidateField = sandbox.stub().returns(
        Promise.resolve(
          Immutable.fromJS([{
            form_idx: 0,
            id: 'omatc1h75mcvmqgy2u',
            material_idx: 0,
            name: 'ian-b',
            sku: '32893022',
            volume: {
              value: '4000',
              isValid: false,
              error: 'Must be between 0µL and 3500µL',
            },
            container_type: {
              id: 'a1-vial',
              well_count: 1,
              well_volume_ul: '3500.0',
            },
          }])));
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="volume"
          fieldTitle="volume"
          onSubmit={() => {}}
          data={Immutable.fromJS(rowData)}
          validateField={onValidateField}
          shouldValidate
        />
      );
      const event = { target: { value: '5000' } };
      wrapper.find('Table').dive().find('Row').at(1)
        .find('BodyCell')
        .at(2)
        .find('TextInput')
        .props()
        .onChange(event);
      await wrapper.find('Table').dive().find('Row')
        .at(1)
        .find('BodyCell')
        .at(2)
        .find('TextInput')
        .props()
        .onBlur();
      expect(wrapper.props().acceptBtnDisabled).to.be.true;
    });
  });

  describe('MultiRowEditorModal for Lot No', () => {
    let validateLotNumberSpy;
    const rowData =  Immutable.fromJS([
      {
        form_idx: 0,
        id: 'omatc1h75mcvmeeczk',
        material_idx: 0,
        name: 'M13KO7 Helper Phage',
        lot_no: { value: '', isValid: null, error: '' }
      },
      {
        form_idx: 1,
        id: 'omatc1h75mcvmeeczk',
        material_idx: 0,
        name: 'M13KO7 Helper Phage',
        lot_no: { value: 'Lot 1', isValid: null, error: '' }
      }
    ]);

    beforeEach(() => {
      const lotNumberValidator = CheckinLogic.bulkItemsValidator('lot_no');
      validateLotNumberSpy = sandbox.spy(lotNumberValidator);
      wrapper = shallow(
        <MultiRowEditorModal
          fieldName="lot_no"
          fieldTitle="Lot No"
          onSubmit={() => {}}
          data={rowData}
          validateField={validateLotNumberSpy}
          shouldValidate
        />
      );
    });

    afterEach(() => {
      sandbox.restore();
      wrapper.unmount();
    });

    it('should not validate items with empty lot_no on modal open', async () => {
      expect(wrapper.find('Table').dive().find('Validated')
        .filterWhere(v => !_.isEmpty(v.props().error))
        .length)
        .to.be.equal(0);
      await wrapper.props().onOpen();
      await wrapper.update();
      expect(validateLotNumberSpy.calledOnce).to.be.true;
      expect(validateLotNumberSpy.args[0][0].toJS()).to.deep.equal([rowData.get('1').toJS()]);
      expect(wrapper.find('Table').dive().find('Validated')
        .filterWhere(v => !_.isEmpty(v.props().error))
        .length)
        .to.be.equal(0);
      expect(wrapper.find('Table').dive().find('Validated')
        .filterWhere(v => v.props().error === 'Must be specified')
        .length)
        .to.be.equal(0);
      return wrapper;
    });

    it('should validate items with empty lot_no too on input blur', async () => {
      expect(wrapper.find('Table').dive().find('Validated')
        .filter(v => !_.isEmpty(v.props().error))
        .length)
        .to.be.equal(0);
      await wrapper.find('Table').dive().find('TextInput').at(0)
        .props()
        .onBlur();
      await wrapper.update();
      expect(validateLotNumberSpy.calledOnce).to.be.true;
      expect(validateLotNumberSpy.args[0][0].toJS()).to.deep.equal(rowData.toJS());
      expect(wrapper.find('Table').dive().find('Validated')
        .filterWhere(v => !_.isEmpty(v.props().error))
        .length)
        .to.be.equal(1);
      expect(wrapper.find('Table').dive().find('Validated')
        .filterWhere(v => v.props().error === 'Must be specified')
        .length)
        .to.be.equal(1);
      return wrapper;
    });
  });
});
