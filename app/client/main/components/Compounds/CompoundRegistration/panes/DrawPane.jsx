import React     from 'react';
import PropTypes from 'prop-types';

import UserActions            from 'main/actions/UserActions';
import CompoundAPI            from 'main/api/CompoundAPI';
import { MultiStepModalPane } from 'main/components/Modal';
import SessionStore           from 'main/stores/SessionStore';

import {
  Banner,
  MoleculeViewer,
  Toggle
} from '@transcriptic/amino';

async function readFileContents(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      res(reader.result);
    };
    reader.onerror = (e) => {
      rej(e);
    };
  });
}

class DrawPane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadedFileName: undefined,
      summary: undefined,
      summarySource: undefined,
      smilesInput: props.data ? props.data.get('smiles') || '' : '',
      error: undefined
    };
  }

  componentWillMount() {
    // Reset the prop if its true before mounting the first modal window
    if (this.props.isPublicCompound && this.props.onTogglePublicCompound && !this.props.disableToggle) {
      this.props.onTogglePublicCompound();
    }
  }

  async onFileSelected(file) {
    const fileName = `${file.name}`;
    const extension = fileName.split('.')[1];
    const summarySource = (extension === 'sdf' || extension === 'sd') ? 'sdf' : 'smiles';

    const fileText = await readFileContents(file);
    this.setState({ uploadedFileName: fileName });

    const summary = await this.getSummary(fileText, summarySource);
    this.setState({
      smilesInput: summary.attributes.smiles,
      summary,
      summarySource
    });
  }

  async getSummary(content, sourceType) {
    const orgId = SessionStore.getOrg() && SessionStore.getOrg().get('id');
    let summaryResponse;

    if (this.props.isPublicCompound) {
      summaryResponse = await CompoundAPI.createPublicCompound({
        attributes: {
          compound: {
            [sourceType]: content
          }
        },
        actions: { dry_run: true }
      });
    } else {
      summaryResponse = await CompoundAPI.create({
        attributes: {
          compound: {
            [sourceType]: content
          },
          organization_id: orgId
        },
        actions: { dry_run: true }
      });
    }

    return summaryResponse.data;
  }

  onNext(next) {
    this.setState({ pending: true, error: undefined }, async () => {
      try {
        let orgId = SessionStore.getOrg() && SessionStore.getOrg().get('id');
        let { summary, summarySource } = this.state;
        if (summary == undefined) {
          summarySource = 'smiles';
          summary = await this.getSummary(this.state.smilesInput, summarySource);
        }
        const filters = {
          smiles: summary.attributes.smiles,
          organization_id: orgId
        };
        if (this.props.isPublicCompound) {
          filters.source = 'public';
          orgId = null;
        }

        const searchResponse = await CompoundAPI.index(
          {
            filters: filters
          },
          'registration'
        );

        const existing = searchResponse.data.filter((compound) => compound.attributes.organization_id == orgId)[0];

        // pre-emptively load the user since we know we'll need them in
        // the next pane
        UserActions.load((existing || summary).attributes.created_by);

        this.setState({ summarySource, summary });
        this.props.setCompound(
          (existing || summary).id,
          !!existing,
          summarySource
        );
        next();
      } catch (e) {
        this.setState({
          error: {
            title: 'Failed to summarize compound',
            message: 'Please check that the submited compound is valid'
          }
        });
      } finally {
        this.setState({ pending: false });
      }
    });
  }

  renderPublicCompundToggle() {
    const { onTogglePublicCompound, isPublicCompound, disableToggle } = this.props;
    return (
      <div className="toggle-with-label">
        <Toggle
          name="public-compound-toggle"
          value={isPublicCompound ? 'on' : 'off'}
          onChange={onTogglePublicCompound}
          readOnly={disableToggle}
        />
        <span>Register as a public compound </span>
      </div>
    );
  }

  render() {
    const { onTogglePublicCompound } = this.props;
    return (
      <MultiStepModalPane
        {...this.props}
        key={'CompoundRegistrationModalDraw'}
        waitingOnResponse={!!this.state.pending}
        beforeNavigateNext={(next) => this.onNext(next)}
        nextBtnDisabled={!this.state.smilesInput}
        showBackButton={false}
      >
        {onTogglePublicCompound ? this.renderPublicCompundToggle() : <div />}
        <div className="tx-stack tx-stack--sm">
          {!!this.state.error && (
            <Banner
              bannerType="error"
              bannerTitle={this.state.error.title}
              bannerMessage={this.state.error.message}
            />
          )}
          <input
            ref={(ref) => { this._filepicker = ref; }}
            style={{ display: 'none' }}
            type="file"
            multiple={false}
            accept=".sd,.sdf,.smi"
            onChange={(e) => {
              let file;
              try {
                file = e.target.files.item(0);
              } catch (_e) {
                file = undefined;
              }
              if (file !== undefined) this.onFileSelected(file);
            }}
          />
          <MoleculeViewer
            editable
            SMILES={this.state.smilesInput}
            onChange={(SMILES) => {
              this.setState({
                uploadedFileName: undefined,
                summarySource: undefined,
                summary: undefined,
                smilesInput: SMILES
              });
            }}
            onUpload={() => {
              this._filepicker.click();
            }}
          />
        </div>
      </MultiStepModalPane>
    );
  }
}

DrawPane.propTypes = {
  /**
   * Callback which is called when the user completes drawing (clicks next)
   * @param {string} compoundId - CompoundStore ID where further information about the compound exists
   * @param {boolean} compoundExists - True if compound drawn is already registered, and therefore also
   * wether CompoundStore.get(draw.compoundId) is a summary (false) or registered compound (true)
   * @param { 'sdf' | 'smiles' } compoundSource - what source type the compound was input as
   */
  setCompound: PropTypes.func.isRequired,
  onTogglePublicCompound: PropTypes.func
};

DrawPane.defaultProps = {};

export default DrawPane;
