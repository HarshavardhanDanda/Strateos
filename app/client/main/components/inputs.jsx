import classNames from 'classnames';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';

class BubbledSegmentedInput extends React.Component {

  static get contextTypes() {
    return {
      getScrollParent: PropTypes.func
    };
  }

  static get propTypes() {
    return {
      onSegmentDeleted: PropTypes.func,
      segments:         PropTypes.instanceOf(Immutable.Map),
      className:        PropTypes.string,
      emptyText:        PropTypes.string,
      onClick:          PropTypes.func,
      scrollFocus:      PropTypes.bool
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    e.stopPropagation();

    if (this.props.scrollFocus) {
      const scrollParent = this.context.getScrollParent ? this.context.getScrollParent() : undefined;

      if (scrollParent) {
        // for modals
        scrollParent.scrollTop = this.node.offsetTop;
      } else {
        window.scrollTo(0, this.node.offsetTop);
      }
    }
    return this.props.onClick();
  }

  render() {
    return (
      <div
        ref={(node) => { this.node = node; }}
        className={classNames('bubbled-segmented-input', this.props.className)}
        onClick={this.onClick}
      >
        <Choose>
          <When condition={this.props.segments.isEmpty()}>
            <span className="segment-empty-text">
              <Choose>
                <When condition={this.props.emptyText != undefined}>
                  {this.props.emptyText}
                </When>
                <Otherwise>Choose...</Otherwise>
              </Choose>
            </span>
          </When>
          <Otherwise>
            <div className="segments">
              {this.props.segments.map((s, key) => {
                return (
                  <div
                    className="segment"
                    key={key}
                    onClick={(e) => { return e.stopPropagation(); }}
                  >
                    <span className="segment-text">{s}</span>
                    <i
                      className="delete fa fa-times"
                      onClick={(e) => {
                        this.props.onSegmentDeleted(key);
                        e.stopPropagation();
                      }}
                    />
                  </div>
                );
              }).valueSeq()}
            </div>
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

export default BubbledSegmentedInput;
