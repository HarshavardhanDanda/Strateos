import uuidv4 from 'uuid/v4';

const CommonUiUtil = {
  confirmWithUser(message) {
    return confirm(message);
  },

  getUUIDv4() {
    return uuidv4();
  }
};

export default CommonUiUtil;
