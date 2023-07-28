import { expect } from 'chai';
import $ from 'jquery';
import sinon from 'sinon';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import RunActions from 'main/actions/RunActions';
import ReactionAPI from './ReactionAPI';
import { reactionWithRunCreated } from './ChemicalReactionAPIMock';

const reactionWithFailedSubmission = {
  ...reactionWithRunCreated,
  runId: undefined,
  status: 'SUBMITTED_WITH_ERRORS'
};

const reactionNotSubmitted = {
  ...reactionWithRunCreated,
  status: 'SUBMITTED',
  runId: undefined
};

describe('ReactionAPI', function() { // eslint-disable-line prefer-arrow-callback
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sinon.restore();
    sandbox.restore();
  });

  it('calculates when run submission is done', function() { // eslint-disable-line prefer-arrow-callback
    expect(ReactionAPI.runSubmissionIsDone(reactionWithRunCreated)).to.be.true;
    expect(ReactionAPI.runSubmissionIsDone(reactionWithFailedSubmission)).to.be.true;
    expect(ReactionAPI.runSubmissionIsDone(reactionNotSubmitted)).to.be.false;
  });

  it('polls for run status and succeeds with run is created', (done) => {
    // Check that calling ReactionAPI.pollForRun eventually succeeds with true
    // when the reaction payload shows the data is done
    sinon.stub(ReactionAPI, 'get').returns(
      $.Deferred().resolve(reactionWithRunCreated) // `data` has run created status
    );
    ReactionAPI.pollForRun('doesnt-matter-what-id').then((isDone) => {
      expect(isDone).to.be.true;
      done();
    });
  });

  it('polls for run status and succeeds with run fails', (done) => {
    // Check that calling ReactionAPI.pollForRun eventually succeeds with true
    // when the reaction payload shows the data is done
    sinon.stub(ReactionAPI, 'get').returns(
      $.Deferred().resolve(reactionWithFailedSubmission)
    );
    ReactionAPI.pollForRun('doesnt-matter-what-id').then((isDone) => {
      expect(isDone).to.be.true;
      done();
    });
  });

  it('should make multiple api requests in getReactionsByIds when we have more than 12 reaction ids', () => {
    const ids = [
      '8504c2aa-98ed-47f6-8b62-567fd4f17a9e',
      'd2af2baa-b388-48f4-94b4-112f8c29fa40',
      '12401fc5-f978-4f99-9daa-1ec32cb84420',
      '905b0a20-f67d-4c2b-ac61-8950efc792ff',
      '14bca047-3835-4878-9332-35a6dbab7936',
      'c7483326-dc30-48c0-ad63-317222b4d471',
      'a8e49dec-7123-4640-aa3b-251e353f3cc5',
      '976a31da-f297-4c14-92e7-bc4f97993ee0',
      '68dde60f-6e20-43da-bb26-37805679ac37',
      'f07e7b2e-4bf0-40b7-ad9d-9e96f20f0353',
      'e959c7b5-4dd6-40c1-aca0-dcad8bb94bfa',
      '6dd92d47-c252-48b0-b37f-3a0708a1e019',
      '35422798-ef4c-4ea1-a875-dc4b14035596',
      '924'
    ];

    const response = {
      reactions: [
        {
          id: '12401fc5-f978-4f99-9daa-1ec32cb84420',
          name: "DL_Dylan's Notebook_010",
          runId: 'r1e6vu854dgsjc',
          status: 'CREATED',
          submissionErrors: null,
          projectId: null,
          createdBy: 'u1dffycuxmnb2n',
          createdOn: '2022-06-10 03:05:08',
          requesterUserId: null,
          batchId: 'bat1h595b5vzk8qm'
        }
      ],
      errors: [
        {
          timestamp: '2023-02-08 01:02:41',
          message: 'Invalid Parameter',
          description: "Failed to convert value of type 'java.lang.String' to required type 'java.util.List'; nested exception is java.lang.IllegalArgumentException: Invalid UUID string: 924"
        }
      ]
    };
    const getReactions = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb(response);
        return { fail: () => ({}) };
      }
    });
    const loadRunById = sandbox.stub(RunActions, 'loadRunById');
    const notification = sandbox.stub(NotificationActions, 'handleError');

    ReactionAPI.getReactionsByIds(ids, true);
    expect(getReactions.calledTwice).to.be.true;
    expect(loadRunById.called).to.be.true;
    expect(notification.called).to.equal(true);
    expect(notification.args[0][2]).to.deep.equal('Invalid Parameter');
  });
});
