import Immutable from 'immutable';
import { expect } from 'chai';

import ImmutableUtil from '.';

const { indexBy, keyIn, partition } = ImmutableUtil;

describe('ImmutableUtil', () => {

  describe('.keyIn', () => {
    it('filters values', () => {
      const data = Immutable.Map({ a: 'aval', b: 'bval' });
      const filtered = data.filter(keyIn('a'));
      expect(filtered.get('a')).to.equal('aval');
      expect(filtered.get('b')).to.equal(undefined);
    });

    it('works with no arguments', () => {
      const data = Immutable.Map({ a: 'aval', b: 'bval' });
      const filtered = data.filter(keyIn());
      expect(filtered.count()).to.equal(0);
    });
  });

  describe('.partition', () => {
    const data = Immutable.List([1, 2, 3, 4]);

    it('truthy partition', () => {
      const predicate = () => true;
      const [pass, fail] = partition(data, predicate);
      expect(pass.count()).to.equal(4);
      expect(fail.count()).to.equal(0);
    });

    it('falsy partition', () => {
      const predicate = () => false;
      const [pass, fail] = partition(data, predicate);
      expect(pass.count()).to.equal(0);
      expect(fail.count()).to.equal(4);
    });

    it('partitions integers', () => {
      const predicate = i => i % 2 === 0;
      const [pass, fail] = partition(data, predicate);
      expect(pass.count()).to.equal(2);
      expect(fail.count()).to.equal(2);
    });
  });

  describe('.indexBy', () => {
    it('maps a list', () => {
      const data = Immutable.fromJS([{ id: '1', name: 'Foo' }, { id: '2', name: 'Bar' }]);
      const mapped = indexBy(data, 'id');
      expect(mapped.count()).to.equal(2);
      expect(mapped.get('1').get('id')).to.equal('1');
      expect(mapped.get('1').get('name')).to.equal('Foo');
      expect(mapped.get('2').get('id')).to.equal('2');
      expect(mapped.get('2').get('name')).to.equal('Bar');
    });
  });

  describe('.stringSorter', () => {
    const list = Immutable.fromJS([
      { timestamp: '2011', i: 1 },
      { timestamp: '2012', i: 2 },
      { timestamp: '2013', i: 3 }
    ]);

    it('sorts ASC', () => {
      const sorted = list.sort(ImmutableUtil.stringSorter('timestamp', true));
      const indices = sorted.map(item => item.get('i'));
      expect(indices.toJS()).to.eql([1, 2, 3]);
    });

    it('sorts DESC', () => {
      const sorted = list.sort(ImmutableUtil.stringSorter('timestamp', false));
      const indices = sorted.map(item => item.get('i'));
      expect(indices.toJS()).to.eql([3, 2, 1]);
    });
  });

});
