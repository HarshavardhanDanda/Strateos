import Colors from 'main/util/Colors';

/*
Default styles for diagnostics charts
*/
const Style = {
  axisSize: 50,
  chartPadding: 10,
  pointRadius: 3,
  defaultDataColor: Colors.coolDarkGray,
  defaultAxisColor: Colors.coolMediumGray,

  fontSize: {
    xSmall: 10,
    small: 12
  },

  defaultAxisLineStyle() {
    return {
      lineWidth: 0.5,
      strokeStyle: this.defaultAxisColor,
      opacity: 0.5
    };
  },

  axisTextStyle(fontSize) {
    let fSize = fontSize;
    if (fSize == undefined) {
      fSize = 12;
    }

    return {
      fontSize: fSize,
      lineHeight: fSize,
      height: fSize,
      color: this.defaultAxisColor
    };
  },

  defaultPointStyle() {
    return {
      fillStyle: 'white',
      strokeStyle: this.defaultDataColor,
      lineWidth: 1
    };
  },

  defaultDataLineStyle() {
    return {
      lineWidth: 0.5,
      opacity: 0.3, // the connecting lines are just for visual aid
      strokeStyle: this.defaultDataColor
    };
  }
};

export default Style;
