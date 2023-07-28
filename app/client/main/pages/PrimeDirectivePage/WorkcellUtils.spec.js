import Immutable from 'immutable';
import { expect }           from 'chai';
import WorkcellUtils        from './WorkcellUtils';

const workcells1 = Immutable.fromJS({
  wc1fnctbj93rjq8: {
    id: 'wc1fnctbj93rjq8', workcell_id: 'wctest-mcx1', node_id: 'wctest-mcx1', name: 'wctest', region: 'tx', uri_base: 'lab.core.strateos.com/haven', workcell_type: 'mcx', is_test: true
  },
  wc1fnctbj98ac8c: {
    id: 'wc1fnctbj98ac8c', workcell_id: 'wctest-l2s2-mcx1', node_id: 'wctest-l2s2-mcx1', name: 'wctest-l2s2', region: 'sd', uri_base: 'lab.core.strateos.com/studio', workcell_type: 'mcx', is_test: true
  },
  wc1esgannfju27r: {
    id: 'wc1esgannfju27r', workcell_id: 'wc4-frontend1', node_id: 'wc4-mcx1', name: 'wc4', region: 'tx', uri_base: 'lab.core.strateos.com/haven', workcell_type: 'mcx', test_workcell: 'wc1fnctbj93rjq8'
  },
  wc1esgannftse4y: {
    id: 'wc1esgannftse4y', workcell_id: 'wc5-frontend1', node_id: 'wc5-mcx1', name: 'wc5', region: 'tx', uri_base: 'lab.core.strateos.com/haven', workcell_type: 'mcx', test_workcell: 'wc1fnctbj93rjq8'
  },
  wc1esgannfzfds5: {
    id: 'wc1esgannfzfds5', workcell_id: 'wc6-frontend1', node_id: 'wc6-mcx1', name: 'wc6', region: 'tx', uri_base: 'lab.core.strateos.com/haven', workcell_type: 'mcx', test_workcell: 'wc1fnctbj93rjq8'
  },
  wc1esganng75dea: {
    id: 'wc1esganng75dea', workcell_id: 'wc7-frontend1', node_id: 'wc7-mcx1', name: 'wc7', region: 'tx', uri_base: 'lab.core.strateos.com/haven', workcell_type: 'mcx', test_workcell: 'wc1fnctbj93rjq8'
  },
  wc1esganngctd3f: {
    id: 'wc1esganngctd3f', workcell_id: 'wl1-frontend1', node_id: 'wl1-mcx1', name: 'wl1', region: 'tx', uri_base: 'lab.core.strateos.com/haven', workcell_type: 'mcx', test_workcell: 'wc1fnctbj93rjq8'
  },
  wc1esganngjgcqm: {
    id: 'wc1esganngjgcqm', workcell_id: 'wl2-frontend1', node_id: 'wl2-mcx1', name: 'wl2', region: 'tx', uri_base: 'lab.core.strateos.com/haven', workcell_type: 'mcx', test_workcell: 'wc1fnctbj93rjq8'
  },
  wc1esganngr6ccs: {
    id: 'wc1esganngr6ccs', workcell_id: 'tst-01-frontend-01', node_id: 'tst-01-mcx-01', name: 'tst-01', region: 'sd', uri_base: 'lab.core.strateos.com/studio', workcell_type: 'mcx', test_workcell: 'wc1fnctbj98ac8c'
  },
  wc1esganngwubzx: { id: 'wc1esganngwubzx', workcell_id: 'metamcx-01', node_id: 'metamcx-01', name: 'metamcx-01', region: 'sd', uri_base: 'lab.core.strateos.com/studio', workcell_type: 'metamcx' }
});

describe('WorkcellUtils static methods', () => {
  it('#workcellChoices', () => {
    const nullOptionName = 'Select a workcell';
    it('base case', () => {
      const workcells = Immutable.fromJS({});
      const choices = WorkcellUtils.workcellChoices(workcells);
      expect(choices.map(c => c.name)).to.deep.equal([nullOptionName]);
    });

    it('multiple workcells', () => {
      const choices = WorkcellUtils.workcellChoices(workcells1);
      expect(choices.map(c => c.name)).to.deep.equal([
        nullOptionName,
        'wc4', 'wc5', 'wc6', 'wc7', 'wl1', 'wl2', 'tst-01', 'metamcx-01'
      ]);
    });
  });

  it('#createWorkcellUri', () => {
    it('should create the correct uri for production runs', () => {
      for (const wc in WorkcellUtils.workcellChoices(workcells1)) {
        const uri = WorkcellUtils.createWorkcellUri(wc.workcell_id, workcells1, false);
        if (wc.region === 'tx') {
          expect(uri).to.be.a('string').and.satisfy(v => v.equals(`lab.core.strateos.com/haven/${wc.name}`));
        } else {
          expect(uri).to.be.a('string').and.satisfy(v => v.equals(`lab.core.strateos.com/studio/${wc.name}`));
        }
      }
    });
    it('should create the correct uri for production runs - even if a sessionId is given', () => {
      for (const wc in WorkcellUtils.workcellChoices(workcells1)) {
        const uri = WorkcellUtils.createWorkcellUri(wc.workcell_id, workcells1, false, 'test');
        if (wc.region === 'tx') {
          expect(uri).to.be.a('string').and.satisfy(v => v.equals(`lab.core.strateos.com/haven/${wc.name}`));
        } else {
          expect(uri).to.be.a('string').and.satisfy(v => v.equals(`lab.core.strateos.com/studio/${wc.name}`));
        }
      }
    });
    it('should create the correct uri for test runs', () => {
      for (const wc in WorkcellUtils.workcellChoices(workcells1)) {
        const uri = WorkcellUtils.createWorkcellUri(wc.workcell_id, workcells1, true);
        if (wc.region === 'tx') {
          expect(uri).to.be.a('string').and.satisfy(v => v.equals('lab.core.strateos.com/haven/wctest'));
        } else if (wc.workcell_type === 'mcx') {
          expect(uri).to.be.a('string').and.satisfy(v => v.equals('lab.core.strateos.com/studio/wctest-l2s2'));
        } else {
          expect(uri).to.be.undefined;
        }
      }
    });
    it('should create the correct uri for test runs - with a sessionId', () => {
      for (const wc in WorkcellUtils.workcellChoices(workcells1)) {
        const uri = WorkcellUtils.createWorkcellUri(wc.workcell_id, workcells1, true, 'test');
        if (wc.region === 'tx') {
          expect(uri).to.be.a('string').and.satisfy(v => v.equals('lab.core.strateos.com/haven/wctest?sessionId=test'));
        } else if (wc.workcell_type === 'mcx') {
          expect(uri).to.be.a('string').and.satisfy(v => v.equals('lab.core.strateos.com/studio/wctest-l2s2?sessionId=test'));
        } else {
          expect(uri).to.be.undefined;
        }
      }
    });
  });
});
