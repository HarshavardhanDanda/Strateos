import ContainerType from 'main/helpers/ContainerType';

import { expect } from 'chai';

const ctype2 = new ContainerType({
  col_count: 2
});

describe('ContainerType', () => {
  it('converts robot to human', () => {
    expect(ctype2.humanWell(0)).to.equal('A1');
    expect(ctype2.humanWell(3)).to.equal('B2');
    expect(ctype2.humanWell('3')).to.equal('B2');
    expect(ctype2.humanWell('5')).to.equal('C2');
    expect(ctype2.humanWell(52)).to.equal('AA1');
    expect(ctype2.humanWell(109)).to.equal('BC2');
  });

  it('converts human to robot', () => {
    expect(ctype2.robotWell('A1')).to.equal(0);
    expect(ctype2.robotWell('B2')).to.equal(3);
    expect(ctype2.robotWell('AA1')).to.equal(52);
    expect(ctype2.robotWell('BC2')).to.equal(109);
  });

  it('converts human to coordinates', () => {
    expect(ctype2.coordinatesFromHuman('A1')).to.eql([0, 0]);
    expect(ctype2.coordinatesFromHuman('B2')).to.eql([1, 1]);
    expect(ctype2.coordinatesFromHuman('AA1')).to.eql([0, 26]);
    expect(ctype2.coordinatesFromHuman('BC2')).to.eql([1, 54]);
  });

  it('converts robot to coordinates', () => {
    expect(ctype2.coordinatesFromRobot(0)).to.eql([0, 0]);
    expect(ctype2.coordinatesFromRobot(3)).to.eql([1, 1]);
    expect(ctype2.coordinatesFromRobot('3')).to.eql([1, 1]);
    expect(ctype2.coordinatesFromRobot(52)).to.eql([0, 26]);
    expect(ctype2.coordinatesFromRobot(109)).to.eql([1, 54]);
  });

  it('converts coordinates to human', () => {
    expect(ctype2.humanFromCoordinates({
      x: 0,
      y: 0
    })).to.eql('A1');
    expect(ctype2.humanFromCoordinates({
      x: 1,
      y: 1
    })).to.eql('B2');
    expect(ctype2.humanFromCoordinates({
      x: 0,
      y: 26
    })).to.eql('AA1');
    expect(ctype2.humanFromCoordinates({
      x: 1,
      y: 54
    })).to.eql('BC2');
  });

  it('converts coordinates to robot', () => {
    expect(ctype2.robotFromCoordinates({
      x: 0,
      y: 0
    })).to.eql(0);
    expect(ctype2.robotFromCoordinates({
      x: 1,
      y: 1
    })).to.eql(3);
    expect(ctype2.robotFromCoordinates({
      x: 0,
      y: 26
    })).to.eql(52);
    expect(ctype2.robotFromCoordinates({
      x: 1,
      y: 54
    })).to.eql(109);
  });
});
