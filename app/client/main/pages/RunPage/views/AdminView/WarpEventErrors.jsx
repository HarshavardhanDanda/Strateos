import classnames from 'classnames';
import Immutable  from 'immutable';
import Moment     from 'moment';
import PropTypes  from 'prop-types';
import React      from 'react';
import { Link }   from 'react-router-dom';

import Urls from 'main/util/urls';

import { ExpandableCard, JSONViewer } from '@transcriptic/amino';

class WarpEventErrors extends React.Component {
  expandableCardHead(warp, createdAt) {
    const deviceId = warp.get('device_id');
    const commandName = warp.getIn(['command', 'name']);
    const dateStr = Moment(createdAt).format('lll');

    return <h3>{`${deviceId} / ${commandName} / ${dateStr}`}</h3>;
  }

  expandableCardBody(warp) {
    const warpCommand = warp.get('command').toJS();
    const instructionId = warp.get('instruction_id');
    const { run } = this.props;

    return (
      <div>
        <JSONViewer
          json={warpCommand}
          collapsedText={warpCommand.name}
          heading="Warp Details"
        />
        <div>
          <span>Instruction id: </span>
          <span>
            <Choose>
              <When condition={instructionId}>
                <Link
                  to={Urls.run_instruction(
                    run.getIn(['project', 'id']),
                    run.get('id'),
                    instructionId
                  )}
                >
                  { instructionId }
                </Link>
              </When>

              <Otherwise>
                {'none'}
              </Otherwise>
            </Choose>
          </span>
        </div>

        <div>
          { `Warp id: ${warp.get('id')}` }
        </div>
      </div>
    );
  }

  sortedWarpEvents() {
    return this.props.warpEventErrors.sortBy(warpEvent =>
      warpEvent.get('created_at')
    );
  }

  render() {
    const sortedWarpEvents = this.sortedWarpEvents();
    const latestWarpEventIndex = sortedWarpEvents.size - 1;

    return (
      <div>
        <Choose>
          <When condition={this.props.warpEventErrors.isEmpty()}>
            <p className="caption tx-type--heavy tx-type--secondary">
              (No warp errors have occurred for this run)
            </p>
          </When>

          <Otherwise>
            {
              sortedWarpEvents.map((warpEvent, i) => {
                // Need to convert to array explicitly as context is lost.
                // change after upgrade to react 0.14.
                // https://github.com/facebook/react/issues/4722
                const createdAt = warpEvent.get('created_at');
                const warp = warpEvent.get('warp');

                return (
                  <ExpandableCard
                    key={warpEvent.get('id')}
                    className={classnames('admin-warp-errors', {
                      aborted:
                        this.props.run.get('status') === 'aborted' &&
                          i === latestWarpEventIndex
                    })}
                    cardHead={this.expandableCardHead(warp, createdAt)}
                    cardBody={this.expandableCardBody(warp)}
                  />
                );
              }).toArray()
            }
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

WarpEventErrors.propTypes = {
  run: PropTypes.object.isRequired,
  warpEventErrors: PropTypes.instanceOf(Immutable.Iterable)
};

export default WarpEventErrors;
