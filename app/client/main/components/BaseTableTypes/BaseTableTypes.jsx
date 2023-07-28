import Accounting from 'accounting';
import Immutable  from 'immutable';
import Moment     from 'moment';
import PropTypes  from 'prop-types';
import React      from 'react';

import ContainerType from 'main/components/ContainerType';
import SessionStore from 'main/stores/SessionStore';
import RunStatusLabel from 'main/components/RunStatusLabel';
import Urls from 'main/util/urls';
import LocationPath from 'main/components/LocationPath';
import * as TimeUtil from 'main/util/TimeUtil';

import { Popover, DateTime } from '@transcriptic/amino';

class Url extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.object,
      openInNewTab: PropTypes.bool,
      runStatus: PropTypes.string
    };
  }

  render() {
    const target = this.props.openInNewTab && '_blank';
    if (this.props.data && this.props.data.url) {
      return <a href={this.props.data.url} target={target}>{this.props.data.text || 'Link'}</a>;
    } else {
      return <span>-</span>;
    }
  }
}

class RecentRunId extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.string.isRequired
    };
  }

  render() {
    if (this.props.data) {
      const url = Urls.prime_directive_run(this.props.data);
      const text = this.props.data;
      const data = { url, text };
      return (
        <Url data={data} />
      );
    } else {
      return <span>-</span>;
    }
  }
}

class Run extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.string.isRequired
    };
  }

  render() {
    if (this.props.data && this.props.runStatus) {
      const url = Urls.runspage_instructions(this.props.data, 'all_runs', this.props.runStatus);
      const text = this.props.data;
      const data = { url, text };
      return (
        <Url data={data} />
      );
    } else {
      return <span>-</span>;
    }
  }
}

class ContainerUrl extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.object.isRequired
    };
  }

  render() {
    const url = Urls.use(SessionStore.getOrg().get('subdomain')).container(this.props.data.id);
    const id =  `${this.props.data.id}`;
    const text = this.props.showId ? id : this.props.data.label || id;
    const data = { url, text };

    return (
      <Url data={data} />
    );
  }
}

class ContainerDetailsUrl extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.object.isRequired
    };
  }

  render() {
    const url = Urls.container_location(this.props.data.id);
    const text = this.props.data.id || this.props.data.label;
    const data = { url, text };

    return (
      <Url data={data} />
    );
  }
}

class AdminRunUrl extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired
    };
  }

  render() {
    let url;
    let text;

    if (typeof this.props.data === 'string') {
      url = Urls.prime_directive_run(this.props.data);
      text = this.props.data;
    } else {
      url = Urls.prime_directive_run(this.props.data.id);
      text = this.props.data.title || this.props.data.id;
    }

    const data = { url, text };

    return (
      <Popover
        content={<span>{text}</span>}
        placement="top"
        trigger="hover"
        showWhenOverflow
      >
        <Url data={data} />
      </Popover>
    );
  }
}

function Bool({ data }) {
  if (data === true) {
    return <i className="fa fa-check" aria-hidden="true" />;
  } else if (data === false) {
    return <i className="fa fa-times" aria-hidden="true" />;
  } else {
    return <span>-</span>;
  }
}

Bool.propTypes = {
  data: PropTypes.bool
};

class CheckBox extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.any.isRequired,
      metadata: PropTypes.object.isRequired
    };
  }

  render() {
    return (
      <input
        type="checkbox"
        checked={this.props.metadata.isSelected(this.props.data)}
        onClick={e => this.props.metadata.onRowSelect(this.props.data, e)}
      />
    );
  }
}

class ContainerTypeId extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.string.isRequired
    };
  }

  render() {
    return <ContainerType containerTypeId={this.props.data} />;
  }
}

class DollarAmount extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.any.isRequired
    };
  }

  render() {
    if (this.props.data) {
      return <strong>{Accounting.formatMoney(this.props.data)}</strong>;
    } else {
      return <span>-</span>;
    }
  }
}

class Duration extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.number
    };
  }

  render() {
    let display;
    if (
      this.props.data != undefined &&
      !isNaN(this.props.data) &&
      this.props.data > 0
    ) {
      display = TimeUtil.humanizeDuration(this.props.data);
    }

    return <span><If condition={display != undefined}>{display}</If></span>;
  }
}

class Id extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.string.isRequired
    };
  }

  render() {
    return <span id={this.props.data}>{this.props.data}</span>;
  }
}

class List extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.array.isRequired
    };
  }

  render() {
    if (this.props.data) {
      return <span>{this.props.data.join(', ')}</span>;
    } else {
      return <span>-</span>;
    }
  }
}

class Location extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.object.isRequired,
      rowData: PropTypes.object.isRequired
    };
  }

  render() {
    if (this.props.data) {
      return (
        <LocationPath
          location={Immutable.fromJS(this.props.data)}
          containerId={this.props.rowData.id}
          position={
            this.props.rowData.slot != undefined
              ? this.props.rowData.slot.row
              : undefined
          }
          withLinks
        />
      );
    } else {
      return <span>-</span>;
    }
  }
}

class LocationUrl extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.any
    };
  }

  render() {
    return <a href={Urls.location(this.props.data)}>{this.props.data}</a>;
  }
}

class OrganizationUrl extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.object.isRequired
    };
  }

  render() {
    const url = Urls.use(this.props.data.subdomain).organization_overview();
    const text = this.props.data.name || this.props.data.subdomain;
    const data = { url, text };

    return <Url data={data} />;
  }
}

class CustomerOrganizationUrl extends React.Component {
  static get propTypes() {
    return {
      org: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    const { org } = this.props;
    const orgId = org.get('id');
    const url = Urls.customer_organization(orgId);
    const text = org.get('name') || org.get('subdomain');
    const data = { url, text };
    return <Url data={data} />;
  }
}

class RunIdLink extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.string.isRequired
    };
  }

  render() {
    return <a href={`/-/${this.props.data}`}>{this.props.data}</a>;
  }
}

class RunEstRuntime extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.number
    };
  }

  render() {
    return <Duration data={this.props.data * 1000} />;
  }
}

class RunEstStart extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.any
    };
  }

  render() {
    let text;
    if (this.props.data != undefined) {
      text = Moment(this.props.data).format('D MMM HH:mm');
    } else {
      text = 'None';
    }
    return <span>{text}</span>;
  }
}

class RunStatus extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
        PropTypes.number
      ])
    };
  }

  render() {
    return (
      <RunStatusLabel run={this.props.data} />
    );
  }
}

class Text extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.any
    };
  }

  render() {
    return <span>{this.props.data || '-'}</span>;
  }
}

class Time extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.any
    };
  }

  render() {
    if (this.props.data) {
      return <DateTime timestamp={this.props.data} />;
    } else {
      return <span>-</span>;
    }
  }
}

class TimeAgo extends React.Component {
  static get propTypes() {
    return {
      data: PropTypes.any.isRequired
    };
  }

  render() {
    return <span>{Moment(this.props.data).fromNow()}</span>;
  }
}

const BaseTableTypes = {
  Bool,
  CheckBox,
  ContainerTypeId,
  ContainerUrl,
  ContainerDetailsUrl,
  DollarAmount,
  Duration,
  Id,
  List,
  Location,
  LocationUrl,
  OrganizationUrl,
  RecentRunId,
  Run,
  RunEstRuntime,
  RunEstStart,
  RunIdLink,
  RunStatus,
  AdminRunUrl,
  Text,
  Time,
  TimeAgo,
  Url,
  CustomerOrganizationUrl
};

export default BaseTableTypes;
