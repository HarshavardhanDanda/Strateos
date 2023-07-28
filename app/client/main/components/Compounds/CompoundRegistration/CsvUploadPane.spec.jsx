import React        from 'react';
import { expect }   from 'chai';
import { shallow }    from 'enzyme';
import Immutable    from 'immutable';
import sinon        from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import CompoundAPI  from 'main/api/CompoundAPI';
import { Button } from '@transcriptic/amino';
import UserActions  from 'main/actions/UserActions';

import Papa       from 'papaparse';

import CsvUploadPane from './CsvUploadPane';

describe('csv upload pane tests', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  const registeredData = [{
    data: [
      {
        id: 'cmpl1eu54ebdvk3f6',
        attributes: {
          name: 'example-2',
          smiles: 'CC',
          labels: ['ethane']
        }
      },
      {
        id: 'cmpl1eu54ebdvk3f7',
        attributes: {
          name: 'example-1',
          smiles: 'C',
          labels: ['methane']
        }
      }
    ]
  }];

  const summarizedData = {
    compounds: [
      {
        data: {
          attributes: {
            inchi_key: 'VNWKTOKETHGBQD-UHFFFAOYSA-N',
            smiles: 'C'
          }
        }
      },
      {
        data: {
          attributes: {
            inchi_key: 'ATUOYWHBWRKTHZ-UHFFFAOYSA-N',
            smiles: 'CC'
          }
        }
      },
      {
        data: {
          attributes: {
            inchi_key: 'IJDNQMDRQITEOD-UHFFFAOYSA-N',
            smiles: 'CCC.CCC'
          }
        }
      }
    ]
  };

  // warning: some SMILES can be valid in openchemlib but not in rdkit
  // `b` for example, so make sure you use SMILES valid in both lib, resp invalid
  const compoundData = [
    {
      labels: [],
      reference_id: '',
      smiles: 'C',
      name: ''
    },
    {
      labels: [],
      reference_id: '',
      smiles: 'C',
      name: ''
    },
    {
      labels: [],
      reference_id: '',
      smiles: 'CC',
      name: ''
    },
    {
      labels: [],
      reference_id: '',
      smiles: 'CCC.CCC',
      name: ''
    },
    {
      labels: [],
      reference_id: '',
      smiles: 'sad',
      name: ''
    }
  ];

  it('should have drag and drop', () => {
    wrapper = shallow(<CsvUploadPane />);
    expect(wrapper.find('DragDropFilePicker')).to.have.length(1);
  });

  it('should have disabled next button', () => {
    wrapper = shallow(<CsvUploadPane />);
    const modalFooter  = wrapper.find('Pane').dive().find('ModalStepFooter').dive();
    expect(
      modalFooter.find('Button').last().prop('disabled')
    ).eq(true);
  });

  it('should have cancel button', () => {
    wrapper = shallow(<CsvUploadPane />);
    const modalFooter  = wrapper.find('Pane').dive().find('ModalStepFooter').dive();
    expect(modalFooter.find(Button).first().dive().text()).eq('Cancel');
  });

  it('should have bulk compound information link', () => {
    wrapper = shallow(<CsvUploadPane />);
    expect(wrapper.find('a').first().text()).eq('Download the expected csv format');
    expect(wrapper.find('a').at(1).text()).eq('Download the expected text file format');
  });

  it('should accept and process text file',  async () => {
    const onTextSpy = sandbox.spy(CsvUploadPane.prototype, 'handleTextFile');
    wrapper =  shallow(<CsvUploadPane />);
    const file = new File(
      [`C
        C
        CC
        CCC.CCC
        b`],
      'txtfile.txt');
    wrapper.find('DragDropFilePicker').prop('onDrop')([{ uuid: 'uuid', file: file }]);
    expect(onTextSpy.calledOnce).to.be.true;

  });

  it('should categorize status correctly',  async () => {
    sandbox.stub(CompoundAPI, 'createMany').returns(summarizedData);
    sandbox.stub(CompoundAPI, 'indexAll').returns(registeredData);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map());
    sandbox.stub(UserActions, 'loadCurrentUser');
    let compounds;
    let duplicates;
    let compoundValidations;
    const setCompounds = (cmps, dups, vals) => { compounds = cmps; duplicates = dups; compoundValidations = vals; };
    const setCompoundSpy = sandbox.spy(setCompounds);
    const next = sandbox.spy();

    wrapper =  shallow(<CsvUploadPane setCompounds={setCompoundSpy} />);

    wrapper.setState({ compounds: compoundData });
    wrapper.update();
    await wrapper.instance().summarizeCompounds(next);
    expect(setCompoundSpy.calledOnce).to.be.true;

    expect(compounds).to.have.length(4);
    expect(duplicates).to.have.length(4);
    expect(compoundValidations).to.have.length(4);

    expect(compounds[0]).to.eql({
      inchi_key: 'VNWKTOKETHGBQD-UHFFFAOYSA-N',
      smiles: 'C',
      id: 0,
      labels: ['methane'],
      name: 'example-1'
    });

    expect(duplicates.get('C')).to.eql([
      { reference_id: '', name: '', labels: [] },
      { reference_id: '', name: '', labels: [] }
    ]);
    expect(compoundValidations.get('C')).to.deep.equal(['Registered', 'Duplicates']);
    expect(compoundValidations.get('CC')).to.deep.equal(['Registered']);
    expect(compoundValidations.get('CCC.CCC')).to.deep.equal(['Valid']);
    expect(compoundValidations.get('sad')).to.deep.equal(['Invalid']);
  });

  it('should have the public compound toggle', () => {
    const onTogglePublicCompound = sinon.spy();
    wrapper = enzyme.shallow(
      <CsvUploadPane
        setCompound={() => {}}
        onTogglePublicCompound={onTogglePublicCompound}
        isPublicCompound
      />
    );

    const toggle = wrapper.find('Toggle');
    expect(toggle).to.have.lengthOf(1);
    toggle.dive().simulate('change');
    expect(onTogglePublicCompound.calledOnce).to.be.true;
  });

  it('should not have the public compound toggle', () => {
    wrapper = enzyme.shallow(
      <CsvUploadPane
        setCompound={() => {}}
      />
    );

    const toggle = wrapper.find('Toggle');
    expect(toggle).to.have.lengthOf(0);
  });

  it('should call the CompoundAPI createManyPublic method if its public compound', async () => {
    wrapper = enzyme.shallow(
      <CsvUploadPane
        setCompound={() => {}}
        isPublicCompound
      />
    );
    const input = [...compoundData];
    const create =  sandbox.stub(CompoundAPI, 'createManyPublic');
    wrapper.setState({ compounds: input });
    wrapper.update();
    await wrapper.instance().summarizeCompounds(sandbox.spy());
    expect(create.called).to.equal(true);
  });

  it('should append labels for registered compounds',  async () => {
    sandbox.stub(CompoundAPI, 'createMany').returns(summarizedData);
    sandbox.stub(CompoundAPI, 'indexAll').returns(registeredData);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map());
    let compounds;

    wrapper =  shallow(<CsvUploadPane setCompounds={(cmps) => { compounds = cmps; }} />);

    const input = [...compoundData];
    input[2].labels = ['test'];
    wrapper.setState({ compounds: input });
    wrapper.update();
    await wrapper.instance().summarizeCompounds(sandbox.spy());

    expect(compounds[0].labels).to.eql(['methane']);
    expect(compounds[1].labels).to.eql(['ethane', 'test']);
  });

  it('should invoke CompoundAPI indexAll with correct filters',  async () => {
    sandbox.stub(CompoundAPI, 'createMany').returns(summarizedData);
    const indexAllStub = sandbox.stub(CompoundAPI, 'indexAll').returns(registeredData);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map());

    wrapper =  shallow(<CsvUploadPane setCompounds={(_) => {}} />);

    const input = [...compoundData];
    input[2].labels = ['test'];
    wrapper.setState({ compounds: input });
    wrapper.update();
    await wrapper.instance().summarizeCompounds(sandbox.spy());

    const args = {
      filters: {
        smiles: 'C,CC,CCC.CCC',
        organization_id: undefined
      },
      doIngest: false
    };

    expect(indexAllStub.calledOnceWithExactly(args)).to.be.true;
  });

  it('should give error on empty text file',  async () => {
    wrapper =  shallow(<CsvUploadPane />);
    const file = new File([''], 'empty.txt');
    await wrapper.instance().handleTextFile({ uuid: 'uuid', file: file });
    expect(wrapper.state().bannerMessage)
      .to.eql('Empty CSV/text file, please check your CSV/text file and retry.');
  });

  it('should give CSV format error when incorrect CSV is given',  async () => {
    const onTextSpy = sandbox.spy(CsvUploadPane.prototype, 'showBannerError');
    sandbox.stub(Papa, 'parse').throws();
    wrapper =  shallow(<CsvUploadPane />);
    const file = new File(
      [`smiles,,reference_id,name,labels
      CC,123,ethyl,api,,,`],
      'incorrect.csv');
    await wrapper.instance().handleCsv(file);
    expect(onTextSpy.calledOnce).to.be.true;
    expect(wrapper.state().bannerMessage)
      .to.eql('CSV Format error, please check you CSV file and retry.');
  });
});
