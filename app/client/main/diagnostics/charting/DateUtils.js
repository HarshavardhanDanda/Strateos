import _ from 'lodash';
import moment from 'moment';

const DateUtils = {

  // Return the epoch for the middle of a date range
  // Takes a JS date obj and returns the mid point between
  // It and the next month, year, etc.
  // i.e. Jan, 2011 will return JS Date for Jan, 15, 2011
  midPointOfGrain(date, grain) {
    const nextDate = this.dateOfNextScale(date, grain);
    const halfDiff = (nextDate.getTime() - date.getTime()) / 2;
    return new Date(date.getTime() + halfDiff);
  },

  timeToDateObj(time) {
    const date = new Date(time);
    if (isNaN(date.getTime())) {
      return false;
    }

    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      millisecond: date.getMilliseconds(),
      date
    };
  },

  grainsInOrder: ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'],

  // Given a date and grain (e.g. 'minute') round all finer grain components
  // of the date to zero (e.g. if 'minute', set seconds and ms to 0)
  roundDateToGrain(date, grain) {
    const { year, month, day, hour, minute, second, millisecond } = this.timeToDateObj(date.getTime());
    const allGrains = [year, month, day, hour, minute, second, millisecond];
    const grainIndex = _.indexOf(this.grainsInOrder, grain);
    const truncated = allGrains.slice(0, grainIndex + 1);
    return moment(truncated).toDate();
  },

  // Return a function that increments a date by a single unit
  // of the given grain (e.g. 'month' means add 1 month)
  incrementerForGrain: {
    second(date) {
      return date.setSeconds(date.getSeconds() + 1);
    },
    minute(date) {
      return date.setMinutes(date.getMinutes() + 1);
    },
    hour(date) {
      return date.setHours(date.getHours() + 1);
    },
    day(date) {
      return date.setDate(date.getDate() + 1);
    },
    month(date) {
      return date.setMonth(date.getMonth() + 1);
    },
    year(date) {
      return date.setFullYear(date.getFullYear() + 1);
    }
  },

  // Example: January will return the first day of Feb
  // Example: 2008 will return first day of 2009
  dateOfNextScale(date, grain) {
    const d = new Date(date.getTime());
    switch (grain) {
      case 'second':
        d.setSeconds(d.getSeconds() + 1);
        d.setMilliseconds(d.getMilliseconds() + 1);
        break;
      case 'minute':
        d.setMinutes(d.getMinutes() + 1);
        d.setSeconds(0);
        break;
      case 'hour':
        d.setHours(d.getHours() + 1);
        d.setMinutes(0);
        break;
      case 'day':
        d.setDate(d.getDate() + 1);
        d.setHours(0);
        break;
      case 'month':
        d.setMonth(d.getMonth() + 1);
        d.setDate(1);
        break;
      case 'year':
        d.setYear(d.getFullYear() + 1);
        d.setMonth(0);
        break;
      default:
        null;
    }
    return d;
  }
};

export default DateUtils;
