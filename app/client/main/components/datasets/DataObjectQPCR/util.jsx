import _ from 'lodash';

export default function getLineChartData(data, cts, func) {

  if (!data || !cts) return;

  const indices = {};

  const lineChartData = _.reduce(data, (result, value, key) => {
    const ct = !cts[key] || Number.isNaN(cts[key]) ? 'n/a' : cts[key].toFixed(2);
    const line = value.reduce((a, v, i) => {
      const label = a.label !== undefined ? a.label : `${func(key)} (${ct})`;
      const wellIndex = a.wellIndex !== undefined ? a.wellIndex : key;
      const values = a.values !== undefined ? a.values : [];
      return { ...a, label, wellIndex, values: [...values, [i, v]] };
    }, {});
    indices[key] = result.length;
    return [...result, line];
  }, []);

  return { lineChartData, indices };
}
