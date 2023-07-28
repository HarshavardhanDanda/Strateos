import $ from 'jquery';

import { ReactionAPI } from './ReactionAPI';
import { reactionCreated  } from './ChemicalReactionAPIMock';

// This mocks the reaction-service backend by extending
// ReactionAPI and implementing the requests and mutations in memory.
// The `reaction` object passed in the payload will be used as the initial
// reaction state and subsequent effects will return a new value with the
// effects applied. For example, `updateReaction` updates the mock's internal
// state so that the reaction has the updated profile id.
export default class ReactionAPIServiceMock extends ReactionAPI {
  constructor() {
    super();
    this.reaction = { ...reactionCreated };
  }

  get(_id) {
    return $.Deferred().resolve(this.reaction);
  }

  createRun(_id) {
    this.reaction = {
      ...this.reaction,
      status: 'SUBMITTED'
    };

    setTimeout(
      () => {
        this.reaction = {
          ...this.reaction,
          runId: 'r12321',
          status: 'RUN_CREATED'
        };
      },
      5000
    );
    return $.Deferred().resolve(true);
  }

  updateProject(_id, data) {
    const projectId = data[0].value;
    this.reaction = {
      ...this.reaction,
      projectId
    };
    return $.Deferred().resolve(true);
  }
}
