import React from 'react';
import { expect } from 'chai';
import MeasureData from 'main/components/MeasureDataModal/MeasureData';
import * as Units from 'main/util/unit';

describe('MeasureData', () => {
  const concentrationMeasurements = [
    { type: 'concentration', dataUnits: 'nanograms/microliter', displayUnits: Units.UnitNames['nanograms/microliter'] },
    { type: 'qualityScore', dataUnits: 'A260/A280', displayUnits: Units.UnitNames['A260/A280'] }
  ];

  it('should render without throwing', () => {
    return enzyme.shallow(
      <MeasureData
        refName="my-sweet-dataset"
        well="A0"
        measurements={concentrationMeasurements}
        onInputChanged={() => {}}
      />
    );
  });

  it('should initialize InputWithUnits when given values', () => {
    const values = [3, 4];
    const expectedValues = values.map((value, idx) => {
      return `${value}:${concentrationMeasurements[idx].dataUnits}`;
    });

    const measureData = enzyme.shallow(
      <MeasureData
        refName="my-sweet-dataset"
        well="A0"
        measurements={concentrationMeasurements}
        values={values}
        onInputChanged={() => {}}
      />
    );

    const actuals = measureData.find('InputWithUnits').map(input => input.props().value);
    expect(actuals).to.eql(expectedValues);
  });
});
