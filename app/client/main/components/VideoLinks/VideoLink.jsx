import PropTypes from 'prop-types';
import React     from 'react';

import VideoClipActions                                 from 'main/actions/VideoClipActions';

class VideoLink extends React.Component {

  static get propTypes() {
    return {
      id:    PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      name:  PropTypes.string.isRequired,
      start: PropTypes.number.isRequired,
      stop:  PropTypes.number.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onVideoLinkClick = this.onVideoLinkClick.bind(this);

    this.state = {
      generating: false,
      generated: false,
      href: '#'
    };
  }

  onVideoLinkClick(e) {
    // Allow users to download it once it is generated
    if (this.state.generated) {
      return;
    }
    e.preventDefault();

    this.setState({
      generating: true
    });

    const startTime = this.props.start / 1000;
    const stopTime  = this.props.stop / 1000;

    VideoClipActions.create(
      this.props.id,
      startTime,
      stopTime,
      this.props.title
    )
      .done((clipData) => {
        this.setState({
          generating: false,
          generated: true,
          href: clipData.download_url
        });

        window.open(clipData.embed_url, '_blank');
      })
      .fail(() => { this.setState({ generating: false }); });
  }

  render() {
    return (
      <Choose>
        <When condition={this.state.generating}>
          <span>Generating clip.  This may take a few minutes...</span>
        </When>
        <Otherwise>
          <a
            className="video-link"
            key={this.props.id}
            href={this.state.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={this.onVideoLinkClick}
          >
            <Choose>
              <When condition={this.state.generated}>
                <i className="fa fa-download video-icon" />
              </When>
              <Otherwise>
                <i className="fa fa-video video-icon" />
              </Otherwise>
            </Choose>
            <span>{this.props.name}</span>
          </a>
        </Otherwise>
      </Choose>
    );
  }
}

export default VideoLink;
