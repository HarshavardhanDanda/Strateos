import AppDataNode from 'main/state/AppDataNode';
import { rootKey } from 'main/state';

// Create the root node for the global state of the application
const rootNode = new AppDataNode([rootKey]);

export default rootNode;
