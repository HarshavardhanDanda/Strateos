import React                    from 'react';
import Immutable                from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Urls from 'main/util/urls';
import sinon from 'sinon';
import MixtureStore from 'main/stores/MixtureStore';
import CardRow from './CardRow';

const props = {
  measurementMode: 'volume',
  containers: Immutable.List([
    Immutable.fromJS({
      container_type_id: 'vendor-tube',
      location_id: 'loc1b832s3p9f6j',
      mass_mg: '2000.0',
      organization_id: null,
      created_at: '2018-03-02T15:59:56.744-08:00',
      test_mode: false,
      shipment_code: null,
      status: 'available',
      kit_request_id: null,
      label: 'Ludox CL-X Aliquot',
      deleted_at: null,
      id: 'ct1b9jqgk8pyyp',
      volume_ul: '20600.0',
      expires_at: null,
      slot: null,
      barcode: '214814'
    })
  ]),
  instruction: {
    id: '12345',
    operation: {
      informatics: [
        {
          data: {
            mixture_id: 'mix1asw9yykf5admusj',
            total_volume: '31:microliter',
            volume_to_provision: '30.88:microliter'
          },
          type: 'provision_mixture'
        }
      ]
    }
  },
  proprovisionInstructions: Immutable.List()
};

describe('CardRow Test', () => {
  let cardRow;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    cardRow.unmount();
    sandbox.restore();
  });

  it('should show volume when measurement mode is volume', () => {
    cardRow = shallow(<CardRow {...props} />);
    const unit = cardRow.find('Unit');
    expect(unit.length).to.equal(1);
    expect(unit.props().value).to.equal('20600.0:microliter');
  });

  it('should show mass when measurement mode is mass and call LiHaGraph component with measurement mode as mass', () => {
    cardRow = shallow(<CardRow {...props} measurementMode="mass" />);
    const unit = cardRow.find('Unit');
    const liHaGraph = cardRow.find('LiHaGraph');
    expect(liHaGraph.length).to.equal(1);
    expect(liHaGraph.props().measurementMode).to.equal('mass');
    expect(unit.length).to.equal(1);
    expect(unit.props().value).to.equal('2000.0:milligram');
  });

  it('should have correct url on barcode', () => {
    Urls.use('transcriptic');
    cardRow = shallow(<CardRow {...props} />);
    expect(cardRow.find('Link').at(0).prop('to')).to.equal(Urls.container_location('ct1b9jqgk8pyyp'));
  });

  it('should render Container Id column and have correct url on the container_id', () => {
    Urls.use('transcriptic');
    cardRow = shallow(<CardRow {...props} />);
    expect(cardRow.find('Link').at(1).prop('to')).to.equal(Urls.container('ct1b9jqgk8pyyp'));
    expect(cardRow.find('Link').at(1).find('p').text()).to.equal('ct1b9jqgk8pyyp');
  });

  it('should render Container Type column with the container_type_id text', () => {
    cardRow = shallow(<CardRow {...props} />);
    expect(cardRow.find('p').at(3).text()).to.equal('vendor-tube');
  });

  it('should render "- -" for container_id and container_type_id when there are no containers', () => {
    cardRow = shallow(<CardRow  {...props} containers={Immutable.List()} />);
    expect(cardRow.find('p').at(2).text()).to.equal('- -');
    expect(cardRow.find('p').at(3).text()).to.equal('- -');
  });

  it('should render Mixture column with the mixture name text', () => {
    sandbox.stub(MixtureStore, 'getById').withArgs('mix1asw9yykf5admusj').returns(Immutable.fromJS({ label: 'test-mixture' }));
    cardRow = shallow(<CardRow {...props} />);
    const button = cardRow.find('Button');
    expect(button.length).to.be.eql(1);
    expect(button.children().text()).to.be.equal('test-mixture');
  });

  it('should render Mixture Modal when mixture name is present', () => {
    sandbox.stub(MixtureStore, 'getById').withArgs('mix1asw9yykf5admusj').returns(Immutable.fromJS({ label: 'test-mixture' }));
    cardRow = shallow(<CardRow {...props} />);
    expect(cardRow.find('MixtureModal').length).to.equal(1);
  });
});
