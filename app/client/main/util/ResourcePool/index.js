import ajax from 'main/util/ajax';
import _ from 'lodash';

/*
  Manages access to a pool of generic and homogenous resources.
  Clients can request to acquire one of these resources, and can
  add resources back to the pool as well.
*/
class ResourcePool {
  constructor(resources) {
    this.resources = resources;
    this.queue     = [];
  }

  acquire() {
    const request = ajax.Deferred();

    if (this.resources.length > 0) {
      const resource = this.resources.shift();
      request.resolve(resource);
    } else {
      this.queue.push(request);
    }
    return request;
  }

  // Dont release the resource if it's already available.
  release(resource) {
    if (_.includes(this.resources, resource)) {
      throw Error(`Can not release ${resource} because it is already available.`);
    }

    const request = this.queue.shift();
    if (request) {
      request.resolve(resource);
    } else {
      this.resources.push(resource);
    }
  }

}

export default ResourcePool;
