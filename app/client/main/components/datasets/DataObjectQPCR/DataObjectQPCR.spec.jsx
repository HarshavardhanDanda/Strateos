import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import _ from 'lodash';
import { Button, QPCRChart } from '@transcriptic/amino';
import sinon from 'sinon';
import NotificationActions       from 'main/actions/NotificationActions';

import DataObjectQPCR from './DataObjectQPCR';

const props = {
  container: Immutable.fromJS({
    container_type: {
      col_count: 3,
      well_count: 6,
      shortname: '6-flat'
    }
  }),
  data: {
    postprocessed_data: {
      amp0: {
        FAM: {
          group_threshold: 38.09682450637695,
          baseline_subtracted_curve_fit: {
            0: [
              -11.094415257653509,
              -8.741723774242018,
              -5.458526550762599,
              -1.0103004236584638
            ]
          },
          cts: {
            0: 26.6605856501124,
            1: 26.23875466637341,
            3: 28.130514535877623,
            4: 29.199850331402292
          }
        }
      }
    }
  },
  dataObject: Immutable.Map()
};

describe('ampTableData', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  it('Should return a valid ampTable"', () => {
    const updateCsvName = sandbox.spy();

    const wrapper = shallow(<DataObjectQPCR {...props} updateCsvName={updateCsvName} />);
    wrapper.setState({ visibleWells: ['0', '1', '3'] });
    const instance = wrapper.instance();
    const tableData = instance.ampTableData();

    const expectedDataTable = [
      { index: 'A1', ct: 26.66, robotIndex: '0' },
      { index: 'A2', ct: 26.24, robotIndex: '1' },
      { index: 'B1', ct: 28.13, robotIndex: '3' }
    ];

    expect(tableData).to.deep.equal(expectedDataTable);
  });
});

describe('DataObjectQPCR', () => {
  const sandbox = sinon.createSandbox();
  const updateCsvNameSpy = sandbox.spy();

  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  const setup = () => {
    const updates = {
      container: Immutable.fromJS({
        container_type: {
          col_count: 12,
          well_count: 12,
          shortname: '6-flat'
        }
      }),
      data: {
        postprocessed_data: {
          amp0: {
            SYBR: {
              group_threshold: 367.6632525097509,
              baseline_subtracted_curve_fit: {
                0: [
                  14.041224696600239,
                  12.910199913284941,
                  19.811998456229958,
                  21.441891294680318
                ]
              },
              cts: {
                4: 9.017419243622744
              }
            }
          }
        }
      },
      updateCsvName: updateCsvNameSpy,
      dataObject: Immutable.Map()
    };

    return shallow(<DataObjectQPCR {...updates} />);
  };
  it('should render without error', () => {
    return setup();
  });
  it('should only render the lines in baseline_subtracted_curve_fit', () => {
    const dataObjectQPCR = setup();
    const lineDisplay = dataObjectQPCR.find(QPCRChart).dive().find('LineDisplay').dive();
    const lines = lineDisplay.find('path');
    expect(lines.length).to.equal(1);
  });
  it('should display n/a when ct value is undefined', () => {
    const dataObjectQPCR = setup();
    const lineDisplay = dataObjectQPCR.find(QPCRChart).dive().find('LineDisplay');
    const label = lineDisplay.prop('layout').data[0].label;
    expect(label).to.equal('A1 (n/a)');
  });
  it('should display default thresholdline at page load', () => {
    const dataObjectQPCR = setup();
    const lineChart = dataObjectQPCR.find(QPCRChart).dive();
    const defaultThreshold = 450;
    lineChart.setProps({
      defaultThreshold,
    });
    const thresholdLine = lineChart.find('DragAndDrop').dive();
    expect(thresholdLine.find('line')).to.have.lengthOf(1);
  });

  it('should update csv on click on Generate CSV button', () => {
    const updateCsvSpy = sandbox.spy();
    const notificationActionSpy = sandbox.stub(NotificationActions, 'createNotification');

    const rawCsvData = 'Refname,Well,Curve,Dye,CT\npcr_plate,A1,amp0' +
    'SYBR,18.34\npcr_plate,A2,amp0,SYBR,21.78\npcr_plate,A3,amp0,SYBR,26.38\n';

    const nextCtValues = {
      0: 22.49,
      1: 25.56,
      2: 31.28,
    };

    const expectedUpdatedCsvData = 'Refname,Well,Curve,Dye,CT,CT (1000)\npcr_plate,A1,amp0SYBR,18.34,22.49\n' +
    'pcr_plate,A2,amp0,SYBR,21.78,25.56\npcr_plate,A3,amp0,SYBR,26.38,31.28\n';

    const dataObjectQPCR = setup();
    dataObjectQPCR.setProps({
      rawCsvData,
      updateCsv: updateCsvSpy,
      runID: 'r1234'
    });

    const lineChart = dataObjectQPCR.find(QPCRChart);
    lineChart.prop('updateThreshold')('1000');
    lineChart.prop('updateCts')(nextCtValues);
    const ampTable = dataObjectQPCR.find('AmpTable');

    // click generate csv button
    ampTable.dive().find(Button).simulate('click');

    expect(updateCsvSpy.calledOnceWithExactly(expectedUpdatedCsvData)).to.be.true;
    expect(updateCsvNameSpy.calledWith('r1234_CT (1000)'));
    const thresoldsAdded = new Set(['CT (1000)']);
    expect(dataObjectQPCR.state().thresholds).to.deep.equals(thresoldsAdded);
    expect(notificationActionSpy.calledWith({ text: 'CSV has been updated with selected value of threshold 1000' }))
      .to.be.true;
  });
});
