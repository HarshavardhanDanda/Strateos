import { inflect } from 'inflection';
import PropTypes   from 'prop-types';
import React       from 'react';

import Urls from 'main/util/urls';

import { Card, CollapsiblePanel, Column, Table, ZeroState } from '@transcriptic/amino';

function RunDependencies({ run }) {
  const requirements = run.get('unrealized_input_containers');
  const dependents = run.get('dependents');

  return (
    <div>
      <If condition={requirements && requirements.size > 0}>
        <Card>
          <CollapsiblePanel initiallyCollapsed={false} title="Unmet Requirements" hasUppercaseHeading>
            <div className="tx-stack tx-stack--xxs">
              <p>
                {`This run can not be started until the following \
              ${inflect('container', requirements.size)} \
              ${inflect('is', requirements.size, 'is', 'are')} generated:`}
              </p>
              <Table
                id="run-dependencies-requirements-table"
                data={requirements}
                loaded
                disableBorder
                disabledSelection
              >
                <Column
                  id="container"
                  key="container"
                  header="Container"
                  renderCellContent={(container) => (
                    <a href={Urls.deref(container.get('id'))}>
                      {container.get('id')}
                    </a>
                  )}
                />
                <Column
                  id="generating-run"
                  key="generating-run"
                  header="Generating Run"
                  renderCellContent={(container) => (
                    <a href={Urls.deref(container.get('generated_by_run_id'))}>
                      {container.get('generated_by_run_id')}
                    </a>
                  )}
                />
              </Table>
            </div>
          </CollapsiblePanel>
        </Card>
      </If>
      <If condition={dependents && dependents.size > 0}>
        <Card>
          <CollapsiblePanel initiallyCollapsed={false} title="Dependent Runs" hasUppercaseHeading>
            <p>
              {`The following ${inflect('run', dependents.size)} can not be \
             started until this run generates ${inflect('its\'', dependents.size, 'its\'', 'their')} \
             required containers:`}
            </p>
            <Table
              id="run-dependencies-dependents-table"
              data={dependents}
              loaded
              disableBorder
              disabledSelection
            >
              <Column
                id="run"
                key="run"
                header="Run"
                renderCellContent={(dependentRun) => (
                  <a href={Urls.deref(dependentRun.get('id'))}>
                    {dependentRun.get('id')}
                  </a>
                )}
              />
            </Table>
          </CollapsiblePanel>
        </Card>
      </If>
      <If condition={(!requirements || requirements.size === 0) && (!dependents || dependents.size === 0)}>
        <ZeroState title="This run does not have any dependencies." />
      </If>
    </div>
  );
}

RunDependencies.propTypes = {
  run: PropTypes.object
};

export default RunDependencies;
