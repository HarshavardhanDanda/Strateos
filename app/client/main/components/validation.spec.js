import { validators } from 'main/components/validation';

import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import Immutable from 'immutable';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';

const {
  non_null,
  password_invalid,
  non_empty,
  no_white_space,
  no_special_characters,
  no_slashes,
  no_commas,
  not_too_long,
  not_too_short,
  numeric,
  between,
  digits,
  positive_integer,
  non_negative_integer,
  positive_float,
  storage_condition,
  is_true,
  email,
  uniqueness,
  alphanumeric,
  regex,
  barcode,
  retiredContainerTypeValidator,
} = validators;

describe('validators', () => {
  const sandbox = sinon.createSandbox();
  let containerTypeStoreStub;
  beforeEach(() => {
    containerTypeStoreStub = sandbox
      .stub(ContainerTypeStore, 'getById')
      .returns(
        Immutable.Map({
          well_volume_ul: 150000,
          well_count: 1,
          col_count: 1,
        })
      );
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('validates existence', () => {
    expect(non_null()).to.eql('Must be specified');
    expect(non_null(undefined)).to.eql('Must be specified');
    expect(non_null(undefined)).to.eql('Must be specified');
    expect(non_null('')).to.eql(undefined);
    expect(non_null('a')).to.eql(undefined);
  });

  it('validates invalid password', () => {
    expect(password_invalid(true)).to.eql('Password is invalid');
    expect(password_invalid()).to.eql(undefined);
  });

  it('validates emptyness', () => {
    expect(non_empty()).to.eql('Must be specified');
    expect(non_empty('a')).to.eql(undefined);
    expect(non_empty('')).to.eql('Must be specified');
    expect(non_empty(' ')).to.eql('Must be specified');
  });

  it('validates white space', () => {
    expect(no_white_space()).to.eql(undefined);
    expect(no_white_space('')).to.eql(undefined);
    expect(no_white_space('a')).to.eql(undefined);
    expect(no_white_space('a b')).to.eql('No whitespaces');
    expect(no_white_space(' ', 'Seriously, no white spaces')).to.eql('Seriously, no white spaces');
  });

  it('validates no special chars', () => {
    expect(no_special_characters()).to.eql(undefined);
    expect(no_special_characters('')).to.eql(undefined);
    expect(no_special_characters('a')).to.eql(undefined);
    expect(no_special_characters('(a!b)', 'error')).to.eql('error');
  });

  it('validates no slashes', () => {
    expect(no_slashes()).to.eql(undefined);
    expect(no_slashes('')).to.eql(undefined);
    expect(no_slashes('a')).to.eql(undefined);
    expect(no_slashes('(a/b)', 'error')).to.eql('error');
  });

  it('validates no commas', () => {
    expect(no_commas()).to.eql(undefined);
    expect(no_commas('')).to.eql(undefined);
    expect(no_commas('a')).to.eql(undefined);
    expect(no_commas('(a,b)', 'error')).to.eql('error');
  });

  it('validates maximum length', () => {
    expect(not_too_long('hello')).to.eql(undefined);
    expect(not_too_long(undefined)).to.eql(undefined);
    expect(not_too_long(_.range(251))).to.eql('Maximum 250 characters');
    expect(not_too_long('12345', 4)).to.eql('Maximum 4 characters');
  });

  it('validates min length', () => {
    expect(not_too_short('bonjour')).to.eql(undefined);
    expect(not_too_short(undefined)).to.eql(undefined);
    expect(not_too_short('short')).to.eql('Minimum 6 characters');
    expect(not_too_short('ab', 3)).to.eql('Minimum 3 characters');
  });

  it('validates numbers', () => {
    expect(numeric(1)).to.eql(undefined);
    expect(numeric('1')).to.eql(undefined);
  });

  it('validates between numbers', () => {
    const v = between(0, 100);
    const errorStr = 'Must be between 0 and 100';

    expect(v(10)).to.eql(undefined);
    expect(v('not a number')).to.eql(errorStr);
    expect(v(-1)).to.eql(errorStr);
    expect(v(101)).to.eql(errorStr);
  });

  it('validates string digits', () => {
    expect(digits('123')).to.eql(undefined);
    expect(digits(undefined, 'error')).to.eql('error');
    expect(digits('', 'error')).to.eql('error');
    expect(digits('124a', 'error')).to.eql('error');
  });

  it('validates positive integer', () => {
    expect(positive_integer('123')).to.eql(undefined);
    expect(positive_integer(123)).to.eql(undefined);
    expect(positive_integer(undefined, 'error')).to.eql('error');
    expect(positive_integer('', 'error')).to.eql('error');
    expect(positive_integer('0', 'error')).to.eql('error');
    expect(positive_integer(-1, 'error')).to.eql('error');
    expect(positive_integer(123.4, 'error')).to.eql('error');
    expect(positive_integer('-1', 'error')).to.eql('error');
    expect(positive_integer('124a', 'error')).to.eql('error');
  });

  it('validates non negative integer', () => {
    expect(non_negative_integer('123')).to.eql(undefined);
    expect(non_negative_integer(123)).to.eql(undefined);
    expect(non_negative_integer('0')).to.eql(undefined);
    expect(non_negative_integer(undefined, 'error')).to.eql('error');
    expect(non_negative_integer('', 'error')).to.eql('error');
    expect(non_negative_integer(-1, 'error')).to.eql('error');
    expect(non_negative_integer('-1', 'error')).to.eql('error');
    expect(non_negative_integer('124a', 'error')).to.eql('error');
  });

  it('validates positive float', () => {
    expect(positive_float('123.4')).to.eql(undefined);
    expect(positive_float(123.4)).to.eql(undefined);
    expect(positive_float(undefined, 'error')).to.eql('error');
    expect(positive_float(-1, 'error')).to.eql('error');
    expect(positive_float('-1', 'error')).to.eql('error');
  });

  it('validates storage condition', () => {
    expect(storage_condition('cold_4')).to.eql(undefined);
    expect(storage_condition('cold_1000', 'error')).to.eql('error');
  });

  it('validates is_true', () => {
    expect(is_true(true)).to.eql(undefined);
    expect(is_true(1, 'error')).to.eql('error');
    expect(is_true('some string', 'error')).to.eql('error');
  });

  it('validates email', () => {
    expect(email('blah@blah.com')).to.eql(undefined);
    expect(email('blah', 'error')).to.eql('error');
  });

  it('validates uniqueness', () => {
    const v = uniqueness(['one', 'two', 'three'], 'error');

    expect(v('uniq1')).to.eql(undefined);
    expect(v('')).to.eql(undefined);
    expect(v('one')).to.eql('error');
  });

  it('validates alphanumeric strings', () => {
    expect(alphanumeric('1234abfwaub')).to.eql(undefined);
    expect(alphanumeric('1234567890')).to.eql(undefined);
    expect(alphanumeric('/12345%', 'error')).to.eql('error');
    expect(alphanumeric(' ', 'error')).to.eql('error');
  });

  it('validates values with regex', () => {
    expect(regex(/^[0-9a-z-]+$/i)('BAr-123')).to.eql(undefined);
    expect(regex(/^[0-9a-z-]+$/i)('BAr123')).to.eql(undefined);
    expect(regex(/^[0-9a-z-]+$/i)('BAR')).to.eql(undefined);
    expect(regex(/^[0-9a-z-]+$/i)('bar')).to.eql(undefined);
    expect(regex(/^[0-9a-z-]+$/i)('123')).to.eql(undefined);
    expect(regex(/^[0-9a-z-]+$/i)('BA-Tp')).to.eql(undefined);
    expect(regex(/^[0-9a-z-]+$/i, 'error')('BA123!')).to.eql('error');
    expect(regex(/^[0-9a-z-]+$/i, 'error')('BA-(TP)')).to.eql('error');
  });

  it('validates barcode strings', () => {
    expect(barcode('AS3isa')).to.eql(undefined);
    expect(barcode('prizS3y')).to.eql(undefined);
    expect(barcode('1234_as3i_sa')).to.eql(undefined);
    expect(barcode('_dd_---400dR_60')).to.eql(undefined);
    expect(barcode('-dd_---400dR_60')).to.eql(undefined);
    expect(barcode('Rdd_---400dR_60')).to.eql(undefined);
    expect(barcode('002001')).to.eql(undefined);
    expect(barcode('3293_-__--')).to.eql(undefined);
    expect(barcode('', 'error')).to.eql('error');
    expect(barcode('/%-af%--df--kf3', 'error')).to.eql('error');
    expect(barcode('%-af*_-df-\-kf3', 'error')).to.eql('error');
    expect(barcode('first second', 'error')).to.eql('error');
    expect(barcode(' 1020 ', 'error')).to.eql('error');
    expect(barcode('Z3DF%$#S(3]2', 'error')).to.eql('error');
    expect(barcode('3293_ - _--', 'error')).to.eql('error');
  });

  it('should return error for retired containerType ', () => {
    containerTypeStoreStub.returns(
      Immutable.Map({
        retired_at: '2021-2-22',
        id: '0.5pcr',
      })
    );
    const error = retiredContainerTypeValidator('container_type_id', '0.5pcr');
    expect(error).to.equal('container type 0.5pcr is retired');
  });

  it('should not return error for non retired containerType ', () => {
    expect(
      retiredContainerTypeValidator('container_type_id', 'A1 Voil')
    ).to.equal(undefined);
  });

});
