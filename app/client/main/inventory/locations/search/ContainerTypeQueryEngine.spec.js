import { expect } from 'chai';
import sinon from 'sinon';
import ajax from 'main/util/ajax';
import ContainerTypeQueryEngine from './ContainerTypeQueryEngine.js';

describe('Container type query engine test', () => {
  const mockContainerTypes = {
    data: [
      {
        id: '1536-tc-white-corning-3727',
        type: 'container_types',
        attributes: {
          col_count: 48,
          cost_each: '0.0',
          dead_volume_ul: null,
          height_mm: '10.4',
          is_tube: false,
          manual_execution: false,
          retired_at: null,
          safe_min_volume_ul: null,
          sale_price: '0.0',
          shortname: '1536-tc-white-corning-3727',
          name: '1536 well Corning white TC treated HiBase',
          well_count: 1536,
          well_depth_mm: '4.8',
          well_volume_ul: '12.5'
        }
      },
      {
        id: '1536-white-tc',
        type: 'container_types',
        attributes: {
          col_count: 48,
          cost_each: '0.0',
          dead_volume_ul: null,
          height_mm: '10.4',
          is_tube: false,
          manual_execution: false,
          retired_at: null,
          safe_min_volume_ul: null,
          sale_price: '0.0',
          shortname: '1536-white-tc',
          name: '1536 Greiner White TC-treated HiBase',
          well_count: 1536,
          well_depth_mm: '5.0',
          well_volume_ul: '10.0'
        }
      },
      {
        id: '1-flat',
        type: 'container_types',
        attributes: {
          col_count: 1,
          cost_each: '4.71',
          dead_volume_ul: '36000.0',
          height_mm: '17.3',
          is_tube: false,
          manual_execution: false,
          retired_at: null,
          safe_min_volume_ul: '40000.0',
          sale_price: '5.6049',
          shortname: '1-flat',
          name: '1-Well Nunc Non-treated Flat Bottom Plate',
          well_count: 1,
          well_depth_mm: '11.6',
          well_volume_ul: '90000.0'
        }
      },
      {
        id: '24-deep',
        type: 'container_types',
        attributes: {
          col_count: 6,
          cost_each: '7.76',
          dead_volume_ul: '15.0',
          height_mm: '44.04',
          is_tube: false,
          manual_execution: false,
          retired_at: null,
          safe_min_volume_ul: '60.0',
          sale_price: '9.2344',
          shortname: '24-deep',
          name: '24-Well Pyramid Bottom Plate',
          well_count: 24,
          well_depth_mm: '42.0',
          well_volume_ul: '10000.0'
        }
      },
      {
        id: '384-echo',
        type: 'container_types',
        attributes: {
          col_count: 24,
          cost_each: '6.18',
          dead_volume_ul: '15.0',
          height_mm: '14.4',
          is_tube: false,
          manual_execution: false,
          retired_at: null,
          safe_min_volume_ul: '15.0',
          sale_price: '7.3542',
          shortname: '384-echo test',
          name: '384-Well Echo Qualified Polypropylene Microplate 2.0',
          well_count: 384,
          well_depth_mm: '11.5',
          well_volume_ul: '135.0'
        }
      }
    ],
    meta: {
      record_count: 5
    }
  };

  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should properly query for container types by name', () => {
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        return { data: cb(mockContainerTypes), fail: () => ({}) };
      }
    });

    const res = ContainerTypeQueryEngine.query('bottom', (data) => data.results);
    expect(res.data.length).to.be.eq(2);
    expect(res.data[0].name.toLowerCase().includes('bottom')).to.be.true;
    expect(res.data[1].name.toLowerCase().includes('bottom')).to.be.true;
  });

  it('should properly query for container types by short name', () => {
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        return { data: cb(mockContainerTypes), fail: () => ({}) };
      }
    });

    const res = ContainerTypeQueryEngine.query('test', (data) => data.results);
    expect(res.data.length).to.be.eq(1);
    expect(res.data[0].shortname.toLowerCase().includes('test')).to.be.true;
  });
});
