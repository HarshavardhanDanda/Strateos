import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import FieldMapperHelper from './FieldMapperHelper';

const fields = [
  { display: 'barcode', required: true },
  { display: 'location_id', required: true },
  { display: 'label' },
  { display: 'storage condition' },
  { display: 'cas', required: true },
  { display: 'Container Type' }
];
const data = [
  {
    id: '1',
    barcode_custom: 'ABC-123',
    nameCustom: 'Name 1',
    customLocation: 'Location 1',
    cas_no: 'CAS 1',
    date: 'Date 1',
    'sku number': 'SKU123',
    lot: 'Lot #1',
    mass: '30',
    volume: null,
    storage: null,
    'Container Type': 'a1-vial'
  },
  {
    id: '2',
    barcode_custom: 'DEF-123',
    nameCustom: 'Name 2',
    customLocation: 'Location 2',
    cas_no: 'CAS 2',
    date: 'Date 2',
    'sku number': 'SKU456',
    lot: 'Lot #2',
    mass: '29',
    volume: '123',
    storage: '80_freezer',
    'Container Type': '384-plate'
  }
];
const fieldMap = FieldMapperHelper.constructInitialFieldMap(fields, data);

describe('FieldMapperHelper', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should initiate field map', () => {
    expect(FieldMapperHelper.constructInitialFieldMap(fields, data).toJS()).to.deep.equal([
      {
        id: 'barcode',
        key: 'barcode',
        value: 'barcode_custom',
        enabled: true,
        required: true
      },
      {
        id: 'cas',
        key: 'cas',
        value: 'cas_no',
        enabled: true,
        required: true
      },
      {
        id: 'location_id',
        key: 'location_id',
        value: 'customLocation',
        enabled: true,
        required: true
      },
      {
        id: 'Container Type',
        key: 'Container Type',
        value: 'Container Type',
        enabled: true,
        required: false
      },
      {
        id: 'label',
        key: 'label',
        value: null,
        enabled: false,
        required: false
      },
      {
        id: 'storage condition',
        key: 'storage condition',
        value: 'storage',
        enabled: true,
        required: false
      }
    ]);
  });

  it('should find best key match in user input', () => {
    expect(FieldMapperHelper.constructScoreMapForFieldMatches(fields, data)).to.deep.equal({
      barcode: {
        value: 'barcode_custom',
        score: 7
      },
      cas: {
        value: 'cas_no',
        score: 3
      },
      location_id: {
        value: 'customLocation',
        score: 9
      },
      'Container Type': {
        value: 'Container Type',
        score: 1000
      },
      'storage condition': {
        value: 'storage',
        score: 10
      }
    });
  });

  it('should prioritize exact match in user input', () => {
    const fields = [{
      display: 'barcode'
    }];
    const data = [
      {
        id: '1',
        barcode: 'ABC-123',
        barcode_also_match1: 'ABC-456',
        barcode_also_match2: 'ABC-789'
      }
    ];
    expect(FieldMapperHelper.constructScoreMapForFieldMatches(fields, data)).to.deep.equal({
      barcode: {
        value: 'barcode',
        score: 1000
      }
    });
  });

  it('should find the better match among multiple matches in user input', () => {
    const fields = [{
      display: 'looking_for_best_barcode_match'
    }];
    const data = [
      {
        id: '1',
        barcode_match1: 'ABC-123',
        barcode_match_that_is_best: 'ABC-456',
        barcode_match2: 'ABC-789'
      }
    ];
    expect(FieldMapperHelper.constructScoreMapForFieldMatches(fields, data)).to.deep.equal({
      looking_for_best_barcode_match: {
        value: 'barcode_match_that_is_best',
        score: 25
      }
    });
  });

  it('should build field map to output', () => {
    expect(FieldMapperHelper.buildSimplifiedFieldMap(fieldMap)).to.deep.equal({
      barcode: 'barcode_custom',
      cas: 'cas_no',
      location_id: 'customLocation',
      'Container Type': 'Container Type',
      'storage condition': 'storage'
    });
  });

  it('should build transformed data to output', () => {
    expect(FieldMapperHelper.buildTransformedData(fieldMap, data)[0]).to.deep.include({
      barcode: 'ABC-123',
      cas: 'CAS 1',
      location_id: 'Location 1',
      'Container Type': 'a1-vial',
      'storage condition': null
    });
    expect(FieldMapperHelper.buildTransformedData(fieldMap, data)[1]).to.deep.include({
      barcode: 'DEF-123',
      cas: 'CAS 2',
      location_id: 'Location 2',
      'Container Type': '384-plate',
      'storage condition': '80_freezer'
    });
  });

  it('should build error map to output', () => {
    const validFieldMap = Immutable.fromJS([
      {
        key: 'barcode',
        value: 'barcodeCustom',
        enabled: true,
        required: true
      }
    ]);
    const invalidFieldMap = Immutable.fromJS([
      {
        key: 'barcode',
        value: null,
        enabled: true,
        required: true
      },
      {
        key: 'location_id',
        value: null,
        enabled: true,
        required: false
      }
    ]);
    expect(FieldMapperHelper.buildErrorMap(validFieldMap)).to.equal(null);
    expect(FieldMapperHelper.buildErrorMap(invalidFieldMap)).to.deep.equal({
      barcode: 'Required column',
      location_id: 'Must select value for enabled column'
    });
  });
});
