import APIActions from 'main/util/APIActions';
import Urls       from 'main/util/urls';

const resource = 'protocol_implementation';
const url      = Urls.protocol_implementations;

const ProtocolImplementationActions = APIActions(resource, url);

export default ProtocolImplementationActions;
