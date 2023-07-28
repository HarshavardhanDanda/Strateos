import { expect } from 'chai';
import getLineChartData from './util.jsx';

const data = {
  0: [14.041224696600239, 12.910199913284941, 19.811998456229958, 21.441891294680318],
  1: [18.559078452493395, 17.5724574996716, 19.794351223922604, 28.838768547613654],
  2: [24.014984404301686, 21.017218259798028, 21.135520867796913, 28.589560863338647],
  3: [13.704208737826775, 11.837022781955056, 18.133892525235296, 20.263583392118107],
  4: [18.423055057129204, 14.452523661520445, 20.07909326710842, 27.546061176513376],
  5: [10.996089973735707, 6.065965266531293, 11.876452741049434, 15.491634087753027]
};
const cts = {
  2: 2.4874192436227447,
  4: 0.38435165254909714
};

describe('getLineChartData', () => {
  it('should return the correct number of lines', () => {
    const { lineChartData } = getLineChartData(data, cts, () => 'A');
    expect(lineChartData.length).to.equal(6);
  });
  it('should return n/a when ct is undefined', () => {
    const { lineChartData } = getLineChartData(data, cts, () => 'A');
    expect(lineChartData[0].label).to.equal('A (n/a)');
    expect(lineChartData[1].label).to.equal('A (n/a)');
    expect(lineChartData[3].label).to.equal('A (n/a)');
    expect(lineChartData[5].label).to.equal('A (n/a)');
  });
  it('should return ct value rounded to 2 decimal places', () => {
    const { lineChartData } = getLineChartData(data, cts, () => 'A');
    expect(lineChartData[2].label).to.equal('A (2.49)');
    expect(lineChartData[4].label).to.equal('A (0.38)');
  });
});
