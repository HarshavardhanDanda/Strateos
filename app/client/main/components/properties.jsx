import keycode   from 'keycode';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import ReactDOM  from 'react-dom';

import CharControllableInput from 'main/components/CharControllableInput';
import ajax                  from 'main/util/ajax';

import { Button, SearchField, DropDown } from '@transcriptic/amino';
import EditableProperty from './EditableProperty';
import './properties.scss';

export class AddProperty extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.cancel = this.cancel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    if (this.props.focusValue) {
      return this.charInput.inputNode.focus();
    } else {
      return this.key.focus();
    }
  }

  onKeyDown(e) {
    const char = keycode(e);
    if (char === 'enter') {
      this.submit();
    } else if (char === 'esc') {
      this.cancel();
    }
  }

  cancel() {
    return this.props.onCancel();
  }

  submit() {
    const name = this.key.value.trim();
    const value = this.charInput.inputNode.value.trim();

    if (name.length > 0 || !this.props.nameEditable) {
      return this.props.onCreate({
        key: name,
        value
      });
    } else {
      return this.cancel();
    }
  }

  render() {
    return (
      <div className="add-property">
        <dt>
          <input
            ref={(node) => {
              this.key = node;
            }}
            defaultValue={this.props.name}
            onKeyDown={this.keyDown}
            disabled={!this.props.nameEditable}
          />
        </dt>
        <dd>
          <CharControllableInput
            ref={(node) => {
              this.charInput = node;
            }}
            defaultValue={this.props.value}
            onKeyDown={this.onKeyDown}
            illegalChars={this.props.illegalChars}
          />
        </dd>
        <div className="add-property__actions tx-inline tx-inline--xxxs">
          <i
            className="fa fa-check"
            onClick={this.submit}
          />
          <i
            className="fa fa-times"
            onClick={this.cancel}
          />
        </div>
      </div>
    );
  }
}

AddProperty.defaultProps = {
  nameEditable: true
};

AddProperty.propTypes = {
  focusValue: PropTypes.string,
  onCancel: PropTypes.func,
  nameEditable: PropTypes.bool,
  onCreate: PropTypes.func,
  name: PropTypes.string,
  value: PropTypes.string,
  illegalChars: PropTypes.array
};

class SearchChoosingProperty extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.cancel = this.cancel.bind(this);
    this.edit = this.edit.bind(this);
    this.remove = this.remove.bind(this);
    this.selectedResource = this.selectedResource.bind(this);
    this.state = {
      showingPopover: false
    };
  }

  edit() {
    this.setState({
      showingPopover: true
    });
    return typeof this.props.onEdit === 'function'
      ? this.props.onEdit()
      : undefined;
  }

  remove() {
    return this.props.onSave(undefined);
  }

  cancel() {
    this.setState({
      showingPopover: false
    });
    return typeof this.props.onCancel === 'function'
      ? this.props.onCancel()
      : undefined;
  }

  selectedResource(r) {
    this.setState({
      showingPopover: false,
      hovered: false
    });
    return this.props.onSave(r);
  }

  render() {
    return (
      <div
        className="property"
        onMouseEnter={() =>
          this.setState({
            hovered: true
          })}
        onMouseLeave={() =>
          this.setState({
            hovered: false
          })}
      >
        <If condition={this.props.name}>
          <dt>
            {this.props.name}
          </dt>
        </If>
        <dd
          style={{
            position: 'relative'
          }}
        >
          <If condition={this.state.hovered && this.props.editable}>
            <div className="actions">
              <Button
                link
                height="short"
                type="secondary"
                icon="fa fa-edit"
                onClick={this.edit}
              />
              <If condition={this.props.value && this.props.deletable}>
                <Button
                  link
                  height="short"
                  type="secondary"
                  icon="fa fa-trash"
                  onClick={this.remove}
                />
              </If>
            </div>
          </If>
          <Choose>
            <When condition={this.state.showingPopover}>
              <GenericSearcher
                engine={this.props.engine}
                onCancel={this.cancel}
                onSelected={this.selectedResource}
                searchData={this.props.searchData}
              />
            </When>
            <Otherwise>
              <Choose>
                <When condition={this.props.value && this.props.url}>
                  <a href={this.props.url}>
                    <i
                      className="fa fa-link"
                      style={{
                        fontSize: '80%'
                      }}
                    />{' '}
                    {this.props.value}
                  </a>
                </When>
                <When condition={this.props.value && !this.props.url}>
                  <span>
                    {this.props.value}
                  </span>
                </When>
                <Otherwise>
                  <p className="tx-type--secondary">
                    {this.props.emptyText}
                  </p>
                </Otherwise>
              </Choose>
            </Otherwise>
          </Choose>
        </dd>
      </div>
    );
  }
}

SearchChoosingProperty.defaultProps = {
  emptyText: '(no value)',
  editable: true,
  deletable: true
};

SearchChoosingProperty.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string.isRequired,
  url: PropTypes.string,
  engine: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  editable: PropTypes.bool,
  emptyText: PropTypes.string,
  onCancel: PropTypes.func,
  onEdit: PropTypes.func,
  deletable: PropTypes.bool,
  searchData: PropTypes.object
};

class GenericSearcher extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.keydown = this.keydown.bind(this);
    this.state = {
      results: undefined,
      q: ''
    };
  }

  componentDidMount() {
    window.addEventListener('keydown', this.keydown);
    ReactDOM.findDOMNode(this).style.marginTop = '-5px';
    ReactDOM.findDOMNode(this).style.opacity = '0';
    return setTimeout(() => {
      ReactDOM.findDOMNode(this).style.transition =
        '200ms margin-top, 100ms opacity';
      ReactDOM.findDOMNode(this).style.opacity = '1';
      ReactDOM.findDOMNode(this).style.marginTop = '0px';
    });
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.keydown);
  }

  keydown(e) {
    if (e.which === 27) {
      e.preventDefault();
      e.stopPropagation();
      this.props.onCancel();
    }

    if (e.which === 40) {
      if (this.results != undefined) {
        this.results.cursorDown();
      }
      e.preventDefault();
    }
    if (e.which === 38) {
      if (this.results != undefined) {
        this.results.cursorUp();
      }
      e.preventDefault();
    }
    if (e.which === 13) {
      if (this.results != undefined) {
        this.results.select();
      }
    }
  }

  render() {
    const EngineEmpty = this.props.engine.empty;

    return (
      <div className="resource-searcher">
        <SearchField
          ref={(node) => {
            this.resource_search = node;
          }}
          onChange={e =>
            this.setState({
              q: e.target.value
            })}
          value={this.state.q}
          reset={() => {
            this.setState({
              q: ''
            });
          }}
          searchType={this.props.searchType}
        />
        <Choose>
          <When
            condition={
              (this.state.q != undefined
                ? this.state.q.trim().length
                : undefined) === 0
            }
          >
            <div>
              <If condition={this.props.engine.empty != undefined}>
                <EngineEmpty onSelected={this.props.onSelected} />
              </If>
            </div>
          </When>
          <Otherwise>
            <SearchResults
              ref={(node) => {
                this.results = node;
              }}
              engine={this.props.engine}
              q={this.state.q}
              resultType={this.props.engine.resultType}
              onSelected={this.props.onSelected}
              searchData={this.props.searchData}
            />
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

GenericSearcher.propTypes = {
  onCancel: PropTypes.func,
  onSelected: PropTypes.func,
  engine: PropTypes.object,
  searchType: PropTypes.string,
  searchData: PropTypes.object
};

class SearchResults extends React.Component {

  static get propTypes() {
    return {
      resultType: PropTypes.node,
      engine:     PropTypes.object,
      onSelected: PropTypes.func,
      q:          PropTypes.string,
      searchData: PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);

    this.cursorDown = this.cursorDown.bind(this);
    this.cursorUp   = this.cursorUp.bind(this);
    this.select     = this.select.bind(this);
    this.query      = this.query.bind(this);

    this.state = {
      results: undefined,
      selected: -1
    };
  }

  componentDidMount() {
    this._mounted      = true;
    this.request_queue = ajax.singly();

    this.query(this.props.q);
  }

  componentDidUpdate(prevProps) {
    if (this.props.q !== prevProps.q) {
      this.query(this.props.q);
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  cursorDown() {
    const resultsLength = (this.state.results && this.state.results.length) || 0;

    this.setState({
      selected: Math.min(resultsLength - 1, this.state.selected + 1)
    });
  }

  cursorUp() {
    return this.setState({
      selected: Math.max(0, this.state.selected - 1)
    });
  }

  select() {
    if (!(this.state.selected >= 0)) {
      return;
    }

    this.props.onSelected(this.state.results[this.state.selected]);
  }

  query(q) {
    return this.request_queue((done) => {
      if (!this._mounted) {
        done();
        return;
      }

      this.props.engine.query(q, (data) => {
        done();

        if (!this._mounted) {
          return;
        }

        this.setState({
          results: data.results,
          page: data.page,
          selected: -1
        });
      }, this.props.searchData);
    });
  }

  render() {
    const ResultType = this.props.resultType;

    if (this.state.results == undefined) {
      return <div className="results generic-empty-list">Loading...</div>;
    } else if (this.state.results.length === 0) {
      return <div className="results generic-empty-list">No results.</div>;
    } else {
      return (
        <ResultType
          query={this.props.q}
          results={this.state.results}
          selected={this.state.selected}
          onSelected={this.props.onSelected}
        />
      );
    }
  }
}

class CustomPropertySet extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      adding: false
    };
  }

  renderCustomProperty() {
    return (
      <div className={this.props.customStyle}>
        <div className="custom-properties">
          { this.props.hasCustomProperties ?
            (_.map(this.props.properties.data, (property) => {
              return (
                <EditableProperty
                  {...this.props}
                  key={property.attributes.key}
                  type={property.attributes.config_definition.type}
                  options={property.attributes.config_definition.options}
                  editable={this.props.editable}
                  name={property.attributes.config_definition.label}
                  keyName={property.attributes.key}
                  value={this.props.properties.searchProperties[property.attributes.key]}
                  hasCustomProperties
                  onCancel={() =>
                    this.setState({
                      adding: false
                    })}
                  onSave={(value) => {
                    const key = property.attributes.key;
                    this.props.onChangeProperty(
                      {
                        key,
                        value
                      }
                    );
                  }
                  }
                  onDelete={() => this.props.onRemoveProperty(property.attributes.key)}
                  slim
                  displayColonSeparated
                />
              );

            })) :
            (_.map(this.props.properties, (v, k) => {
              return (
                <EditableProperty
                  editable={this.props.editable}
                  name={k}
                  keyName={k}
                  key={k}
                  value={v}
                  onSave={(args) => {
                    let object = {};
                    if (typeof args === 'string') {
                      object.key = k;
                      object.value = args;
                    } else {
                      object = args;
                    }
                    this.props.onChangeProperty(object);
                  }}
                  onDelete={() => this.props.onRemoveProperty(k)}
                  nameEditable={this.props.nameEditable}
                  slim
                  displayColonSeparated
                />
              );
            }))}
          { this.state.adding && !this.props.hasCustomProperties && (
            <EditableProperty
              nameEditable={this.props.nameEditable}
              startEditing
              focusValue={false}
              onCancel={() =>
                this.setState({
                  adding: false
                })}
              onSave={(kv) => {
                this.setState({
                  adding: false
                });
                return this.props.onAddProperty(kv);
              }}
              expandOnEdit={false}
            />
          )
  }
          { this.props.editable && !this.props.hasCustomProperties && (
            <EditableProperty
              onSave={({ key, value }) => {
                this.props.onChangeProperty(
                  {
                    key,
                    value
                  }
                );
              }}
              canAddNewKeyValuePair
              nameEditable
            />
          )
          }
        </div>
      </div>
    );
  }

  render() {
    return (
      <Choose>
        <When condition={this.props.orientation === 'horizontal'}>
          <DropDown
            isOpen={this.props.shouldShowDropDown}
            hideDismissable={this.props.hideDismissable}
            align="right"
            parentAlignment="right"
            excludedParentNode={this.props.excludedParentNode}
            position="absolute"
          >
            {this.renderCustomProperty()}
          </DropDown>
        </When>
        <Otherwise>
          {this.renderCustomProperty()}
        </Otherwise>
      </Choose>
    );
  }
}

CustomPropertySet.propTypes = {
  editable: PropTypes.bool,
  onChangeProperty: PropTypes.func.isRequired,
  onAddProperty: PropTypes.func.isRequired,
  onRemoveProperty: PropTypes.func.isRequired,
  properties: PropTypes.object.isRequired,
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
  customStyle: PropTypes.string,
  nameEditable: PropTypes.bool
};

CustomPropertySet.defaultProps = {
  orientation: 'vertical',
  editable: true,
  nameEditable: false
};

export {
  CustomPropertySet,
  EditableProperty,
  GenericSearcher,
  SearchChoosingProperty
};
