const lineDefaultColor = 'hsl(0, 0%, 75%)';
const borderRadius = 5;
const borderStyle = `1px solid ${lineDefaultColor}`;
const taskNodeGutter = 10;

const TaskGraphStyle = {
  borderRadius,
  borderStyle,
  taskNodeGutter: 10,
  deselectedOpacity: 0.25,
  lineDefaultColor,

  miniMapSideLengthMinimum: 60, // User should always be able to click or tap on the mini map

  nodeTitleStyle: {
    textTransform: 'uppercase',
    color: '#515A67',
    fontWeight: 800
  },

  nodeContainerStyle: (width, height, opacity) => {
    return {
      width,
      height,
      opacity,
      padding: taskNodeGutter,
      borderRadius,
      border: borderStyle, // TODO Rename to just `border`
      overflowY: 'auto'
    };
  },

  containerLabelStyle: ({ label, color, disabled }) => {
    return {
      cursor: 'pointer',
      display: 'inline-block',
      backgroundColor: label ? color : 'white',
      borderWidth: 1,
      borderColor: color || 'gray',
      borderStyle: 'solid',
      borderRadius: 5,
      padding: '2px 5px',
      fontSize: 11,
      opacity: disabled ? 0.7 : 1
    };
  },

  constraintDasharray: '10, 13'

};

export default TaskGraphStyle;
