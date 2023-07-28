import Moment from 'moment';

const humanizeDuration = (ms, showSeconds = true) => {
  if (ms == undefined) {
    return 'unknown';
  }

  const time = Moment.duration(ms);
  let output = '';

  if (time.days())    output += ` ${time.days()}d`;
  if (time.hours())   output += ` ${time.hours()}h`;
  if (time.minutes()) output += ` ${time.minutes()}m`;
  if (time.seconds() && showSeconds) output += ` ${time.seconds()}s`;

  return output.trim();
};

const parseDuration = (str) => {
  const daysMatch  = /([\d.]+)d/.exec(str);
  const hoursMatch = /([\d.]+)h/.exec(str);
  const minsMatch  = /([\d.]+)m/.exec(str);
  const secsMatch  = /([\d.]+)s/.exec(str);

  const days  = daysMatch  ? parseFloat(daysMatch[1])  : 0;
  const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
  const mins  = minsMatch  ? parseFloat(minsMatch[1])  : 0;
  const secs  = secsMatch  ? parseFloat(secsMatch[1])  : 0;

  const durationSecs = (days * 24 * 60 * 60) + (hours * 60 * 60) + (mins * 60) + secs;

  return durationSecs;
};

const todayInFormat = (format = 'DD_MM_YYYY') => {
  return Moment().format(format);
};

export {
  humanizeDuration,
  parseDuration,
  todayInFormat
};
