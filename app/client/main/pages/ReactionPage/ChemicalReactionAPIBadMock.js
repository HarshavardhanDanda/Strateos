import { reactionSubmitted } from './ChemicalReactionAPIMock';

const dataWithGenerationErrors = {
  ...reactionSubmitted,
  status: 'SUBMITTED_WITH_ERRORS',
  submissionErrors: ['bad', 'error']
};

export function get(reactionId) {
  return new Promise((_resolve, reject) => {
    reject({ message: `Failed to load reaction ${reactionId}` });
  });
}

export function createRun(reactionId) {
  return new Promise((_resolve, reject) => {
    reject({ message: `Failed to create run for reaction ${reactionId}` });
  });
}

export function pollForRun(_id) {
  return new Promise((resolve, _reject) => {
    setTimeout(
      () => resolve(dataWithGenerationErrors), // or you could reject('some error')
      3000 // set to 0 for tests
    );
  });
}
