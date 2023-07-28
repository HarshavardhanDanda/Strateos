// Import this for its side effects
import * as _index from 'main/initializeGlobals';

import initializeRouter  from 'main/initializeRouter';
import Router            from 'main/router';
import Modal             from 'react-modal';
import initializeHeaders from 'main/initializeHeaders';

const appId      = 'react_app';
const appElement = document.getElementById(appId);

Modal.setAppElement(appElement);

initializeRouter(Router, appId);
initializeHeaders();
