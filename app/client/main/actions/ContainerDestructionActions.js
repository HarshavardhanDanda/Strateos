import Urls  from 'main/util/urls';
import APIActions from 'main/util/APIActions';

const resource = 'container_destruction';
const url      = Urls.container_destruction_requests_api;

const ContainerDestructionActions = APIActions(resource, url);

export default ContainerDestructionActions;
