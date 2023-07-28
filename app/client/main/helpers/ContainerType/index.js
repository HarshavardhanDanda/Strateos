// TODO
//   - Remove this model and put these methods in a Store
//   - Cleanup the API. Currently coordinates are either returned as [x, y] or {x,y}

const ALPHABET_LENGTH = 26;
const ALPHABET_START = 'A'.charCodeAt();

class ContainerType {
  constructor(model) {
    this.humanWell  = this.humanWell.bind(this);
    this.model      = model;
    this.col_count  = model.col_count;
    this.well_count = model.well_count;
    this.shortname  = model.shortname;
  }

  /*
  * Converts integer well index to its corresponding human readable index
  * For example (given 12 columns):
  * 0 -> 'A1'
  * 13 -> 'B2'
  * 312 -> 'AA1'
  * 8135 -> 'ZB12'
  */
  humanWell(index) {
    if (/^\d+$/.test(index)) {
      const colIdx = index % this.col_count;
      const rowIdx = Math.floor(index / this.col_count);

      const row = this.rowIdxToLetters(rowIdx);
      const column = colIdx + 1;

      return `${row}${column}`;
    } else {
      return index;
    }
  }

  /*
  * Converts human readable well index to its corresponding integer index
  * For example (given 12 columns):
  * 'A1' -> 0
  * 'B2' -> 13
  * 'AA1' -> 312
  * 'ZB12' -> 8135
  */
  robotWell(index) {
    if (!isNaN(index)) {
      return parseInt(index, 10);
    } else {
      const [colNum, rowNum] = Array.from(this.coordinatesFromHuman(index));
      return (rowNum * this.col_count) + colNum;
    }
  }

  // 'A2' -> [0, 1]
  // eslint-disable-next-line class-methods-use-this
  coordinatesFromHuman(index) {
    const cleaned = index.replace(/\s/g, '');
    const parts = /^([A-Za-z])?([A-Za-z])(\d+)$/i.exec(cleaned);
    const [_, firstLetter, secondLetter, column] = parts;

    const firstLetterRows = firstLetter
      // eslint-disable-next-line no-mixed-operators
      ? (firstLetter.toUpperCase().charCodeAt(0) + 1 - ALPHABET_START) * ALPHABET_LENGTH
      : 0;
    const secondLetterRows = secondLetter.toUpperCase().charCodeAt(0) - ALPHABET_START;

    const x = parseInt(column, 10) - 1;
    const y = firstLetterRows + secondLetterRows;

    return [x, y];
  }

  // 1 -> [1, 0]
  coordinatesFromRobot(robotWell) {
    return this.coordinatesFromHuman(this.humanWell(robotWell));
  }

  // {x: 0, y: 0} -> 'A1'
  humanFromCoordinates({ x, y }) {
    return this.humanWell((y * this.col_count) + x);
  }

  // {x: 0, y: 0} -> 0
  robotFromCoordinates({ x, y }) {
    return this.robotWell((y * this.col_count) + x);
  }

  rowIdxToLetters(rowIdx) {
    const firstLetterIdx = Math.floor(rowIdx / ALPHABET_LENGTH) - 1;
    const secondLetterIdx = rowIdx % ALPHABET_LENGTH;

    const firstLetter = firstLetterIdx > -1 ? String.fromCharCode(ALPHABET_START + firstLetterIdx) : '';
    const secondLetter = String.fromCharCode(ALPHABET_START + secondLetterIdx);

    return `${firstLetter}${secondLetter}`;
  }
}

export default ContainerType;
