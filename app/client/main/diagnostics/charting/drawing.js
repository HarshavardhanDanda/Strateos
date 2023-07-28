// Taken from https://github.com/scottyantipa/react-canvas

import measureText from './measureText';

/**
 * Sets standard shape options on a ctx.
 *
 * @param {CanvasContext} ctx
 * @param {Object} ctxOptions {ctx_attr, ...}
 */
function setContextShapeOptions(ctx, ctxOptions) {
  const options = ctxOptions || {};
  const lineWidth = options.lineWidth;
  const opacity = options.opacity;
  const strokeStyle = options.strokeStyle;
  const fillStyle = options.fillStyle;

  if (lineWidth != null) {
    ctx.lineWidth = lineWidth;
  }
  if (opacity != null) {
    ctx.globalAlpha = opacity;
  }
  if (strokeStyle != null) {
    ctx.strokeStyle = strokeStyle;
  }
  if (fillStyle != null) {
    ctx.fillStyle = fillStyle;
  }
}

// Draws a line with N-1 edges by connecting the given N points in sequence
function drawMultiLine(ctx, points, shapeOptions, scale) {
  var i, len, point, point1;

  ctx.save();

  setContextShapeOptions(ctx, shapeOptions.style);

  // move ctx to first point
  point1 = points[0];

  ctx.beginPath();
  ctx.moveTo(
    (Math.round(point1.x) * scale) + 0.5,
    (Math.round(point1.y) * scale) + 0.5
  );

  // connect each successive point with a line
  for (i = 1, len = points.length; i < len; i++) {
    point = points[i];
    ctx.lineTo(
      (Math.round(point.x) * scale) + 0.5,
      (Math.round(point.y) * scale) + 0.5
    );
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * @param {CanvasContext} ctx
 * @param {String} text The text string to render
 * @param {Number} x The x-coordinate to begin drawing
 * @param {Number} y The y-coordinate to begin drawing
 * @param {Number} width The maximum allowed width
 * @param {Number} height The maximum allowed height
 * @param {FontFace} fontFace The FontFace to to use
 * @param {Object} options Available options are:
 *   {Number} fontSize
 *   {Number} lineHeight
 *   {String} textAlign
 *   {String} color
 *   {String} backgroundColor
 */
function drawText(ctx, text, x, y, width, height, fontFace, options) {
  var textMetrics;
  var currX = x;
  var currY = y;
  var currText;
  var options = options || {};

  options.fontSize = options.fontSize || 16;
  options.lineHeight = options.lineHeight || 18;
  options.textAlign = options.textAlign || 'left';
  options.backgroundColor = options.backgroundColor || 'transparent';
  options.color = options.color || '#000';

  textMetrics = measureText(
    text,
    width,
    fontFace,
    options.fontSize,
    options.lineHeight
  );

  ctx.save();

  // Draw the background
  if (options.backgroundColor !== 'transparent') {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = options.color;
  ctx.font = fontFace.attributes.style + ' ' + fontFace.attributes.weight + ' ' + options.fontSize + 'px ' + fontFace.family;

  textMetrics.lines.forEach((line, index) => {
    currText = line.text;
    currY = (index === 0) ? y + options.fontSize :
      (y + options.fontSize + options.lineHeight * index);

    // Account for text-align: left|right|center
    switch (options.textAlign) {
      case 'center':
        currX = x + (width / 2) - (line.width / 2);
        break;
      case 'right':
        currX = x + width - line.width;
        break;
      default:
        currX = x;
    }

    if ((index < textMetrics.lines.length - 1) &&
      ((options.fontSize + options.lineHeight * (index + 1)) > height)) {
      currText = currText.replace(/\,?\s?\w+$/, '…');
    }

    if (currY <= (height + y)) {
      ctx.fillText(currText, currX, currY);
    }
  });

  ctx.restore();
}

export { drawMultiLine, drawText };
