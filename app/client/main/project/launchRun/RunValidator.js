/* eslint consistent-return: "off" */

import _ from 'lodash';

import Urls from 'main/util/urls';
import AutoprotocolUtil from 'main/util/AutoprotocolUtil';
import * as RunAnalytics from 'main/analytics/RunAnalytics';
import ajax from 'main/util/ajax';
import LaunchRequestAPI from 'main/api/LaunchRequestAPI';

/*
  Constructs a new run validator

  Parameters
    manifest: The protocol manifest (mutable)
    inputs: The protocl inputs (mutable)
*/
class RunValidator {
  constructor({ manifest, inputs, onChange, test_mode, bsl, organization_id }) {
    this.transformedParameters = this.transformedParameters.bind(this);
    this.manifest = manifest;
    this.inputs = inputs;
    this.onChange = onChange;
    this.test_mode = test_mode;
    this.bsl = bsl;
    this.progress = 0;
    this.organization_id = organization_id;
  }

  transformedParameters() {
    const transform = (_v, type) => {
      const typeDesc = typeof type === 'string' ? { type } : type;

      const v = _v == undefined ? typeDesc.default : _v;
      if (v == undefined) {
        return;
      }

      switch (typeDesc.type) {
        case 'integer':
          return parseInt(v, 10);
        case 'decimal':
          return parseFloat(v);
        case 'aliquot+': {
          const aliquots = v.sort((a1, a2) => {
            if (a1.containerId !== a2.containerId) {
              return a1.containerId.localeCompare(a2.containerId);
            } else {
              return parseInt(a1.wellIndex, 10) - parseInt(a2.wellIndex, 10);
            }
          });

          return aliquots.map(aliquot => transform(aliquot, 'aliquot'));
        }
        case 'aliquot++':
          return v.map(x => transform(x, 'aliquot+'));
        case 'group':
          return _.fromPairs(
            _.map(v, (val, key) => [key, transform(val, typeDesc.inputs[key])])
          );
        case 'group+':
          return v.map(val =>
            transform(
              val,
              _.extend({}, typeDesc, {
                type: 'group'
              })
            )
          );
        case 'group-choice': {
          // The UI stores the group choice as:
          //   {
          //     value: "optionString1",
          //     inputs: {
          //       optionString1: {
          //         ...group values
          //       }
          //       optionString2: {
          //         ...group values
          //       }
          //     }
          //
          // The UI uses this format as it tries to maintain the group input values
          // even if the group choice is changed.
          //
          // The webapp doesn't need all of the values for the non-selected
          // options.  It just needs the selected values.  We drop all non-selected
          // options.
          //
          //   {
          //     value: "optionString1",
          //     inputs: {
          //       optionString1: {
          //         ...group values
          //       }
          //     }
          //
          const selectedOption = v.value;
          const selectedGroup = v.inputs[selectedOption];
          const selectedGroupTypeDesc = _.extend(
            {},
            {
              type: 'group'
            },
            _.find(typeDesc.options, o => o.value === selectedOption)
          );

          const groupChoice = {
            value: selectedOption,
            inputs: {}
          };
          groupChoice.inputs[selectedOption] = transform(
            _.clone(selectedGroup),
            selectedGroupTypeDesc
          );

          return groupChoice;
        }
        case 'thermocycle':
          return v.map(g => ({
            cycles: parseInt(g.cycles, 10),
            steps: g.steps
          }));
        case 'csv-table': {
          const headerData = {};
          for (
            let index = 0;
            index < typeDesc.template.header.length;
            index++
          ) {
            const header = typeDesc.template.header[index];
            headerData[header] = {
              key: typeDesc.template.keys[index],
              col_type: typeDesc.template.col_type[index]
            };
          }

          return v.map((row) => {
            const parsedRow = {};
            Object.keys(row).forEach((header) => {
              const value = row[header];
              const mappedKey = headerData[header].key;
              const mappedType = headerData[header].col_type;

              if (mappedType === 'aliquot') {
                const [containerId, wellIndex] = Array.from(
                  value.split('/', 2)
                );

                // currently we only support robot wellIndex.
                parsedRow[mappedKey] = {
                  containerId,
                  wellIndex: parseInt(wellIndex, 10)
                };
              } else {
                parsedRow[mappedKey] = transform(value, mappedType);
              }
            });
            return parsedRow;
          });
        }

        default:
          return v;
      }
    };

    const parameters = {};
    Object.keys(this.inputs).forEach((name) => {
      const val = this.inputs[name];
      parameters[name] = transform(val, this.manifest.inputs[name]);
    });

    return parameters;
  }

  start() {
    let parameters;
    try {
      parameters = this.transformedParameters();
    } catch (e) {
      alert('The parameters as entered are incomplete.');
      return;
    }

    ajax
      .post(Urls.launch_requests(this.manifest.id), {
        launch_request: {
          parameters,
          test_mode: this.test_mode,
          bsl: this.bsl,
          organization_id: this.organization_id
        }
      })
      .done((data) => {
        this.launch_request_id = data.id;
        this.pollState();
      })
      .fail((xhr, status, text) => {
        const message =
          xhr.responseText != undefined
            ? xhr.responseText
            : 'There was a problem launching the protocol.';
        this.errors = [
          {
            code: text,
            message
          }
        ];
        this.progress = 100;
        this.running = false;
        this.onChange();
        RunAnalytics.validationFailed({
          error: `Launch failed: ${text}`,
          response: xhr.responseText
        });
      });
    this.running = true;
    this.onChange();
    RunAnalytics.validationStarted();
  }

  pollLaunchRequest() {
    return LaunchRequestAPI.get(this.launch_request_id, {
      fields: { launch_requests: ['progress', 'generation_errors', 'validated_at'] }
    })
      .then((res) => {
        const { progress, generation_errors, validated_at } = res.data.attributes;
        this.progress = progress;
        this.errors = generation_errors;
        this.validated_at = validated_at;
        // done polling
        if (this.errors.length > 0 || this.progress === 100) {
          return true;
        // keep polling
        } else {
          return false;
        }
      });
  }

  pollState() {
    ajax.poll(
      () => this.pollLaunchRequest(),
      250,
      (60000 * 10) + 20000 // 10 minutes to match the backend's timeout when posting to Igor, plus some buffer
    )
      .then(() => {
        if (this.validated_at) {
          this.analyze();
        } else {
          this.running = false;
          RunAnalytics.validationFailed({
            error: 'Generating protocol failed',
            response: this.errors
          });
        }
        this.onChange();
      })
      .catch((xhr, status, text) => {
        this.running = false;
        this.progress = 100;
        this.errors = [
          {
            code: text,
            message:
              'There was a problem checking the status of the protocol launch.'
          }
        ];
        this.onChange();
        RunAnalytics.validationFailed({
          error: `Polling failed: ${text}`,
          response: xhr.responseText
        });
      });
  }

  analyze() {
    return ajax
      .post(Urls.analyze_run(), {
        launch_request_id: this.launch_request_id,
        test_mode: this.test_mode,
        bsl: this.bsl
      })
      .done((data) => {
        this.preview = {
          refs: _.fromPairs(data.refs.map(r => [r.name, r])),
          instructions: data.instructions.map(ins => ins.operation),
          quote: data.quote,
          cost: data.quote.items[0].cost,
          estimatedRunTime: data.estimated_run_time_cache
        };
        this.previewRun = AutoprotocolUtil.runFromRawAutoprotocol(this.preview);
        this.running = false;
        this.onChange();
        RunAnalytics.validationSucceeded();
      })
      .fail((xhr, status, text) => {
        this.running = false;
        this.onChange();
        RunAnalytics.validationFailed({
          error: `Analyze failed: ${text}`,
          response: xhr.responseText
        });
        alert(text);
      });
  }
}

export default RunValidator;
