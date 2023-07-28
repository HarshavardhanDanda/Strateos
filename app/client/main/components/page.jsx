import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';
import { Link }  from 'react-router-dom';

// Renderes a link with a back arrow '<' to the left of the text
function LinkBack(props) {
  return (
    <div className="nav-back">
      <Link to={props.url}>
        <i className="fa fa-chevron-left back-icon" />
        {props.text}
      </Link>
    </div>
  );
}

LinkBack.propTypes = {
  url: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired
};

// A back arrow with a text label, # E.g, " < Title "
function NavigateBack(props) {
  return (
    <div className="nav-back">
      <a onClick={props.onClick}>
        <i className="fa fa-chevron-left back-icon" />
        {props.text}
      </a>
    </div>
  );
}

NavigateBack.propTypes = {
  onClick: PropTypes.func.isRequired,
  text: PropTypes.string // title to go next to the back icon
};

//
// TODO Migrate this to using the new nav-bar-horizontal class (didn't want to boil ocean)
//
function NavTabs({ active, tabs, onActiveChange }) {
  return (
    <ul className="nav-bar-horizontal">
      {_.keys(tabs).map((key) => {
        return (
          <li key={key}>
            <a
              className={active === key ? 'active' : undefined}
              onClick={() => onActiveChange(key)}
            >
              {tabs[key].name}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

NavTabs.propTypes = {
  tabs: PropTypes.object.isRequired,
  active: PropTypes.string.isRequired,
  onActiveChange: PropTypes.func.isRequired
};

// TODO Consolidate this with our Header component which already knows how to render links
class PageWithNavTabs extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onActiveChange = this.onActiveChange.bind(this);
  }

  componentWillMount() {
    return this.setState({
      page: this.props.initialPage
    });
  }

  onActiveChange(newActive) {
    return this.setState({
      page: newActive
    });
  }

  render() {
    const CurrentTab = this.props.tabs[this.state.page].component;

    return (
      <div className="tabbed-page">
        <div className="tabbed-header">
          <h2>
            {this.props.header}
          </h2>
          <ul className="nav-bar-horizontal">
            <NavTabs
              active={this.state.page}
              onActiveChange={this.onActiveChange}
              tabs={this.props.tabs}
            />
          </ul>
        </div>
        <div className="tabbed-content">
          <div className="panel panel-body">
            <CurrentTab />
          </div>
        </div>
      </div>
    );
  }
}

PageWithNavTabs.propTypes = {
  tabs: PropTypes.object.isRequired,
  header: PropTypes.string.isRequired,
  initialPage: PropTypes.string.isRequired
};

function Loading() {
  return <div className="loading">Loading...</div>;
}

window.TranscripticCentralAddress = {
  attention: 'Transcriptic, Inc.',
  street: '3565 Haven Avenue Suite 3',
  street_2: '',
  city: 'Menlo Park',
  state: 'CA',
  zip: '94025'
};

function Address(props) {
  return (
    <address>
      <div className="attention">
        {props.address.attention}
      </div>
      <div className="street">
        {props.address.street}
      </div>
      <If condition={props.address.street_2}>
        <div className="street street-2">
          {props.address.street_2}
        </div>
      </If>
      <div className="city">
        {`${props.address.city}, ${props.address.state} ${props.address.zip}`}
      </div>
      <If condition={props.address.country}>
        <div className="country">
          {props.address.country}
        </div>
      </If>
    </address>
  );
}

Address.propTypes = {
  address: PropTypes.object.isRequired
};

const DateFormats = {
  'absolute-date'(timestamp) {
    return Moment(timestamp).format('MMMM DD, YYYY');
  },
  'absolute-month'(timestamp) {
    return Moment(timestamp).format('MMMM YYYY');
  },
  'absolute-day'(timestamp) {
    return Moment(timestamp).format('ddd DD MMMM YYYY');
  },
  'from-now'(timestamp) {
    return Moment(timestamp).fromNow();
  },
  absolute(timestamp) {
    return Moment(timestamp).format('lll');
  },
  relative(timestamp) {
    return Moment(timestamp).calendar();
  },
  short(timestamp) {
    return Moment(timestamp).format('DD MMM YY h:mma');
  },
  'human-duration'(ms) {
    if (!ms) {
      return 'unknown';
    }
    const time = Moment.duration(ms);
    let output = '';

    if (time.days()) {
      output += ` ${time.days()}d`;
    }
    if (time.hours()) {
      output += ` ${time.hours()}h`;
    }
    if (time.minutes()) {
      output += ` ${time.minutes()}m`;
    }
    if (time.seconds()) {
      output += ` ${time.seconds()}s`;
    }
    return output.trim();
  }
};

function DateTime(props) {
  const m = Moment(props.timestamp);

  return (
    <span className="date-time" title={m.toISOString()}>
      {DateFormats[props.format](props.timestamp)}
    </span>
  );
}

DateTime.defaultProps = {
  format: 'relative'
};

DateTime.propTypes = {
  // Note: Timestamp might not be the right word, if this is to support durations as well
  timestamp: PropTypes.any.isRequired, // Moment or string
  format: PropTypes.oneOf(Object.keys(DateFormats))
};

// A title & description with a color scheme that matches @props.status
function StatusLabel({ status, title, detail }) {
  return (
    <div
      className={`status-label alert alert-${status}`}
    >
      <h5>
        {title}
      </h5>
      <If condition={detail}>
        <div className="detail">
          {detail}
        </div>
      </If>
    </div>
  );
}

StatusLabel.propTypes = {
  status: PropTypes.oneOf(['success', 'warning']).isRequired,
  title: PropTypes.string.isRequired,
  detail: PropTypes.string
};

export {
  Address,
  NavigateBack,
  LinkBack,
  Loading,
  DateFormats,
  DateTime,
  StatusLabel,
  NavTabs,
  PageWithNavTabs
};
