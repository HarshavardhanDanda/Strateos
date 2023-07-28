import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';
import ClassNames from 'classnames';

import {
  Banner,
  Select,
  LabeledInput,
  TextInput,
  TagInput,
  MoleculeViewer,
  InputsController,
  Button
} from '@transcriptic/amino';

import CompoundTagIcon    from 'main/pages/CompoundsPage/CompoundTagIcon';
import CompoundAPI  from 'main/api/CompoundAPI';
import Hazards from 'main/util/Hazards';
import ajax         from 'main/util/ajax';
import Immutable from 'immutable';

import './CompoundEditForm.scss';

class CompoundEditForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      suggestedLabels: []
    };
    this.suggestSingly = _.debounce(ajax.singly(), 150);
    _.bindAll(
      this,
      'autocompleteLabel',
      'addLabel',
      'addHazard',
      'removeHazard',
      'renderField'
    );
  }

  onChange(update) {
    const { compoundLabels, compoundName, compoundReferenceId, compoundExternalId } = this.props;
    const current = { compoundLabels, compoundName, compoundReferenceId, compoundExternalId };
    _.assign(current, update);
    this.props.onChange(current);
  }

  addLabel(labelName) {
    const { compound, compoundLabels } = this.props;
    const org_id = compound.get('organization_id');
    const label = { name: labelName, organization_id: org_id };

    this.onChange(
      { compoundLabels: _.uniqWith([...compoundLabels, label], _.isEqual) }
    );
    this.setState({ suggestedLabels: [] });
  }

  addHazard(hazardFlag) {
    if (Hazards.find(hazard => hazard.display === hazardFlag)) {
      this.onChange({ hazardFlags: _.uniq([...this.props.hazardFlags, hazardFlag]) });
    }
  }

  removeHazard(hazardFlag) {
    this.onChange({ hazardFlags: this.props.hazardFlags.filter(f => f !== hazardFlag) });
  }

  removeLabel(label) {
    const { compoundLabels } = this.props;
    this.onChange(
      { compoundLabels: compoundLabels.filter(l => !_.isEqual(label, l)) }
    );
  }

  autocompleteLabel(text, limit = 4) {
    this.suggestSingly((done) => {

      if (!text) {
        this.setState({ suggestedLabels: [] }, done);
        return;
      }

      const organization = this.props.compound.get('organization_id');

      const indexOptions = {
        filter: {
          limit: limit
        },
        q:  text
      };

      if (organization) indexOptions.filter.organization_id = organization;

      CompoundAPI.autocompleteLabel(indexOptions).done((tags) => {
        const suggestions = this.renderCompoundLabel(tags);
        this.setState({ suggestedLabels: suggestions });
      })
        .always(done);
    });
  }

  getFieldsToShow() {

    const fieldsToShow = [];

    const allFields = [
      'Hazards',
      'NickName',
      'ReferenceId',
      'Labels',
      'ExternalSystemId',
      'Library'
    ];

    allFields.forEach((fieldName) => {
      const fieldComponent = this.renderField(fieldName);
      if (fieldComponent) {
        fieldsToShow.push(fieldComponent);
      }
    });
    return fieldsToShow;
  }

  renderCompoundLabel(tags) {
    const suggestions = tags
      .filter(tag => !_.some(this.props.compoundLabels, _.omit(tag, 'id')))
      .map(tag => (
        <div key={tag.id}>
          <CompoundTagIcon
            privateIcon="far fa-user-tag"
            publicIcon="/images/public.svg"
            organizationId={tag.organization_id}
          />
          &nbsp;&nbsp;{tag.name}
        </div>
      ));
    return suggestions;
  }

  renderField(fieldName) {
    const { canEditHazards, canEditExternalSystemId, canEditLibrary } = this.props;

    switch (fieldName) {
      case 'Hazards':
        return canEditHazards && this.renderHazardFlags();
      case 'NickName':
        return this.renderNickName();
      case 'ReferenceId':
        return this.renderReferenceId();
      case 'Labels':
        return this.renderLabels();
      case 'ExternalSystemId':
        return canEditExternalSystemId && this.renderExternalId();
      case 'Library':
        return canEditLibrary && this.renderLibraries();
      default:
        return undefined;
    }
  }

  renderNickName() {
    const { compoundName, dropDown, canEditCompound, compound } = this.props;
    let dropDownOptions;
    if (dropDown) {
      dropDownOptions = dropDown.compoundNames.map((option) => {
        return { value: option, name: option };
      });
      // using space as a placeholder for empty string as empty string is not considered as a valid dropdown value.
      dropDownOptions.push({ value: ' ', name: 'empty-compound-name' });
    }
    return (
      <div className="col-md-3 col-xs-12" key={`${compound.get('id')}-nick-name`}>
        <LabeledInput label="Nickname">
          {canEditCompound ? (
            (!dropDown || !dropDown.compoundNames.length) ? (
              <TextInput
                value={compoundName}
                disabled={dropDown &&  dropDown.compoundNames.length <= 1}
                onChange={(e) => { this.onChange({ compoundName: e.target.value }); }}
              />
            ) : (
              <InputsController>
                <Select
                  id="single-select-input"
                  name="single-select-input"
                  className="compound-edit-form__select-input"
                  onChange={(e) => { this.onChange({ compoundName: e.target.value }); }}
                  options={dropDownOptions}
                />
              </InputsController>
            )
          ) : (
            <p className="tx-type--secondary">{compoundName}</p>
          )}
        </LabeledInput>
      </div>
    );

  }

  renderReferenceId() {
    const { compoundReferenceId, dropDown, canEditCompound, compound } = this.props;
    let dropDownOptions;
    if (dropDown) {
      dropDownOptions = dropDown.compoundReferenceIds.map((option) => {
        return { value: option, name: option };
      });
      // using space as a placeholder for empty string as empty string is not considered as a valid dropdown value.
      dropDownOptions.push({ value: ' ', name: 'empty-reference-id' });
    }
    return (
      <div className="col-md-3 col-xs-12" key={`${compound.get('id')}-reference-id`}>
        <LabeledInput
          label="Reference ID"
          tip="Enter a reference ID that you use at your organization."
        >
          {canEditCompound ? (
            (!dropDown || !dropDown.compoundReferenceIds.length) ? (
              <TextInput
                value={compoundReferenceId}
                disabled={dropDown && dropDown.compoundReferenceIds.length <= 1}
                onChange={e => this.onChange({ compoundReferenceId: e.target.value })}
              />
            ) : (
              <InputsController>
                <Select
                  id="single-select-input"
                  name="single-select-input"
                  className="compound-edit-form__select-input"
                  onChange={e => this.onChange({ compoundReferenceId: e.target.value })}
                  options={dropDownOptions}
                />
              </InputsController>
            )
          ) : (
            <p className="tx-type--secondary">{compoundReferenceId}</p>
          )}
        </LabeledInput>
      </div>
    );
  }

  renderExternalId() {
    const { compoundExternalId, compound } = this.props;
    return (
      <div
        className="col-md-3 col-xs-12 tx-stack__block--md"
        key={`${compound.get('id')}-external-system-id`}
      >
        <LabeledInput
          label="External ID"
        >
          <TextInput
            value={compoundExternalId}
            onChange={e => this.onChange({ compoundExternalId: e.target.value })}
          />
        </LabeledInput>
      </div>
    );
  }

  renderHazardFlags() {
    const { compound } = this.props;
    return (
      <div className="col-md-3 col-xs-12 tx-stack__block--md" key={`${compound.get('id')}-hazards`}>
        <LabeledInput label="Hazard Flags">
          <TagInput
            onCreate={this.addHazard}
            suggestions={Hazards.map(hazard => hazard.display)}
            onChange={() => {}}
          >
            {this.props.hazardFlags.map(flag => (
              <TagInput.Tag
                key={flag}
                onRemove={() => this.removeHazard(flag)}
                text={flag}
              />
            ))}
          </TagInput>
        </LabeledInput>
      </div>
    );
  }

  renderLabels() {
    const { compoundLabels, canEditCompound, compound } = this.props;

    return (
      <div className="col-md-3 col-xs-12 tx-stack__block--md" key={`${compound.get('id')}-labels`}>
        <LabeledInput label="Labels">
          <TagInput
            onCreate={canEditCompound ? this.addLabel : undefined}
            suggestions={canEditCompound ? this.state.suggestedLabels : undefined}
            onChange={canEditCompound ? this.autocompleteLabel : undefined}
          >
            {compoundLabels.map(
              label => (
                <TagInput.Tag
                  key={label.name}
                  onRemove={canEditCompound ? () => this.removeLabel(label) : undefined}
                  text={'  ' + label.name}
                  icon={(label.organization_id ? 'fa-user-tag' : 'aminol-strateos')}
                  iconType={(label.organization_id ? 'far' : 'fa')}
                />
              )
            )}
          </TagInput>
        </LabeledInput>
      </div>
    );
  }

  renderLibraries() {
    const { libraries, compound } = this.props;
    const libraryCount = libraries.length;
    return (
      <div className="col-md-3 col-xs-12 tx-stack__block--md" key={`${compound.get('id')}-libraries`}>
        <LabeledInput label="Libraries">
          <Button
            link
            heavy={false}
            onClick={this.props.openLibraryDrawer}
          >
            {`${libraryCount} linked libraries`}
          </Button>
        </LabeledInput>
      </div>
    );
  }

  render() {
    const { compound, error } = this.props;

    const fieldsToShow = this.getFieldsToShow();

    return (
      <div className="row tx-stack tx-stack--xs">
        {!!error && (
        <div className="compound-edit-form__fields-wrapper">
          <Banner
            bannerType="error"
            bannerTitle={error.title}
            bannerMessage={error.message}
          />
        </div>
        )}
        <div className="compound-edit-form__fields-wrapper">
          {fieldsToShow.slice(0, 4)}
        </div>
        {fieldsToShow.slice(4).length > 0 && <div className="compound-edit-form__fields-wrapper">{fieldsToShow.slice(4)}</div>}
        <div className={ClassNames('col-md-12 compound-edit-form__molecule-wrapper', this.props.viewerHeight)}>
          <MoleculeViewer
            SMILES={compound.get('smiles')}
            properties={compound.toJS()}
          />
        </div>
      </div>
    );
  }
}

CompoundEditForm.propTypes = {
  compound: PropTypes.instanceOf(Immutable.Map),
  compoundLabels: PropTypes.array,
  compoundReferenceId: PropTypes.string,
  canEditExternalSystemId: PropTypes.bool,
  compoundExternalId: PropTypes.string,
  compoundName: PropTypes.string,
  viewerHeight: PropTypes.string,
  dropDown:  PropTypes.shape({
    compoundNames: PropTypes.arrayOf(PropTypes.string),
    compoundReferenceIds: PropTypes.arrayOf(PropTypes.string)
  }),
  error: PropTypes.shape({
    title: PropTypes.any,
    message: PropTypes.any
  }),
  onChange: PropTypes.func,
  canEditHazards: PropTypes.bool,
  canEditCompound: PropTypes.bool,
  canEditLibrary: PropTypes.bool,
  libraries: PropTypes.arrayOf(PropTypes.object)
};
CompoundEditForm.defaultProps = {};

export default CompoundEditForm;
