import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { TisoPage } from './TisosPage';

const props = {
  containers: [{
    barcode: 91511224,
    shipment_id: 'sr1cwf6r276r5fh',
    container_type_id: '96-flat',
    device_id: 'wc6-tiso3',
    label: 'CalibrationPlate_2020-02-12',
    id: 'ct1e4gmtykzdqny',
    slot: {
      col: 2,
      row: 4
    }
  }],
  reservations: [{
    project_id: 'p1cyw8vrzs4cnt',
    device_id: 'l2s2-smr-02',
    org_subdomain: 'l2s2dev',
    instruction_id: 'i1dzgetcru7e9v',
    run_id: 'r1d3jvvxyh79fs',
    run_execution_id: '14422',
    updated_at: '2019-04-29T18:35:58.954-07:00',
    container_type: 'A1 vial',
    container_id: 'ct1d3fd7ggp9htf',
    id: '27870',
    slot: {
      col: 0,
      row: 1
    }
  }],
  match: {
    path: '/admin/tisos'
  }
};

describe('Tisos Page test', () => {

  let tisosPage;
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    if (tisosPage) tisosPage.unmount();
  });

  it('Mock fetch function', () => {
    const spyFetch = sandbox.stub(TisoPage.prototype, 'fetch');
    tisosPage = shallow(<TisoPage {...props} />);
    tisosPage.find('AjaxedAjaxContainer').prop('action')();
    expect(spyFetch.callCount).to.be.eql(1);
    sandbox.restore();
  });

  it('Check if Page is Present', () => {
    tisosPage = shallow(<TisoPage {...props} />);
    const Page1 = tisosPage.find('Page');
    expect(Page1.length).to.be.eql(1);
  });

  it('Check Tabrouter', () => {
    tisosPage = shallow(<TisoPage {...props} />);
    const TabRouter1 = tisosPage.find('TabRouter');
    expect(TabRouter1.length).to.equal(1);
  });

  it('Mock fetch function', () => {
    const spyFetch = sandbox.stub(TisoPage.prototype, 'fetch');
    tisosPage = shallow(<TisoPage {...props} />);
    tisosPage.find('AjaxedAjaxContainer').prop('action')();
    expect(spyFetch.callCount).to.be.eql(1);
  });
});
