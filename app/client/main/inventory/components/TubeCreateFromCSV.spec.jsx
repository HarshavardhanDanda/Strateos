import React from 'react';
import sinon from 'sinon';
import FeatureStore from 'main/stores/FeatureStore';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { TubesCreateFromCSV, createInputValues, payload } from './TubesCreateFromCSV';

describe('TubesCreateFromCSV', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const csvHeaderNames = {
    name: 'Well name',
    volume: 'Vol (uL)',
    mass: 'Mass (mg)',
    storage: 'Storage (C)',
    containerType: 'Container Type',
    compoundIds: 'Compound Ids',
    emptyMassMg: 'Empty Mass (mg)'
  };

  const containers = [{
    [csvHeaderNames.compoundIds]: 'cmpl1d8ynztkrtfc7 cmpl1d8ynztfnn4dd',
    [csvHeaderNames.containerType]: 'micro-1.5',
    [csvHeaderNames.emptyMassMg]: '2',
    [csvHeaderNames.mass]: '2',
    [csvHeaderNames.storage]: 'cold_4',
    [csvHeaderNames.volume]: '10',
    [csvHeaderNames.name]: 'Tube 1'
  }];

  const props = {
    onCSVChange: () => {},
    onFilesDelete: () => {}
  };

  const errors = Immutable.fromJS([
    {
      index: 1,
      fileName: 'file_1.csv',
      containerType: 'First error message'
    },
    {
      index: 2,
      fileName: 'file_1.csv',
      containerType: 'Second error message'
    },
    {
      index: 1,
      fileName: 'file_2.csv',
      containerType: 'Third error message'
    },
  ]);

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  describe('createInputValues', () => {
    it('should parse the values correctly', () => {
      sandbox.stub(FeatureStore, 'hasFeature').returns(true);
      const [inputValue] = createInputValues(containers);
      const [container] = containers;
      expect(inputValue.get('name')).equals(container[csvHeaderNames.name]);
      expect(inputValue.get('volume')).equals(`${container[csvHeaderNames.volume]}:microliter`);
      expect(inputValue.get('storage')).equals(container[csvHeaderNames.storage]);
      expect(inputValue.get('containerType')).equals(container[csvHeaderNames.containerType]);
      expect(inputValue.get('emptyMassMg')).equals(`${container[csvHeaderNames.emptyMassMg]}:milligram`);
      expect(inputValue.get('mass')).equals(`${container[csvHeaderNames.mass]}:milligram`);
      expect(inputValue.get('compoundIds')).equals(`${container[csvHeaderNames.compoundIds]}`);
    });

    it('should ignore compoundIds when there are no compound link permissions', () => {
      sandbox.stub(FeatureStore, 'hasFeature').returns(false);
      const [inputValue] = createInputValues(containers);
      const [container] = containers;
      expect(inputValue.get('name')).equals(container[csvHeaderNames.name]);
      expect(inputValue.get('volume')).equals(`${container[csvHeaderNames.volume]}:microliter`);
      expect(inputValue.get('storage')).equals(container[csvHeaderNames.storage]);
      expect(inputValue.get('containerType')).equals(container[csvHeaderNames.containerType]);
      expect(inputValue.get('emptyMassMg')).equals(`${container[csvHeaderNames.emptyMassMg]}:milligram`);
      expect(inputValue.get('mass')).equals(`${container[csvHeaderNames.mass]}:milligram`);
      // compoundIds is undefined despite ids given is due to lack of permissions
      expect(inputValue.get('compoundIds')).equals(undefined);
    });
  });

  describe('payload', () => {
    it('should contain all the columns', () => {
      sandbox.stub(FeatureStore, 'hasFeature').returns(true);
      const payloadCSV = payload().split('\n');
      expect(payloadCSV[0].split(',').length).equals(7);
      Object.keys(csvHeaderNames).forEach((header) => {
        expect(payloadCSV[0].split(',')).to.include(csvHeaderNames[header]);
      });
    });

    it('should not contain compoundIds when there are no permissions', () => {
      sandbox.stub(FeatureStore, 'hasFeature').returns(false);
      const payloadCSV = payload().split('\n');
      expect(payloadCSV[0].split(',').length).equals(6);
      Object.keys(csvHeaderNames).forEach((header) => {
        if (header == 'compoundIds') {
          expect(payloadCSV[0].split(',')).to.not.include(csvHeaderNames[header]);
        } else {
          expect(payloadCSV[0].split(',')).to.include(csvHeaderNames[header]);
        }
      });
    });
  });

  it('should display error messages in banners', () => {
    wrapper = shallow(<TubesCreateFromCSV {...props} errors={errors} />);

    const banners = wrapper.find('Banner');
    expect(banners.length).to.equal(2);

    const firstBanner = banners.at(0);
    expect(firstBanner.prop('bannerTitle')).to.equal('The following errors were found in your csv: file_1.csv');
    expect(firstBanner.dive().find('li').at(0).text()).to.equal('Line 1: Containertype first error message');
    expect(firstBanner.dive().find('li').at(1).text()).to.equal('Line 2: Containertype second error message');

    const secondBanner = banners.at(1);
    expect(secondBanner.prop('bannerTitle')).to.equal('The following errors were found in your csv: file_2.csv');
    expect(secondBanner.dive().find('li').text()).to.equal('Line 1: Containertype third error message');
  });

  it('should set unique keys on error banners', () => {
    wrapper = shallow(<TubesCreateFromCSV {...props} errors={errors} />);

    const banners = wrapper.find('Banner');
    const firstBanner = banners.at(0);
    const secondBanner = banners.at(1);

    expect(firstBanner.key()).to.equal('banner-file_1.csv');
    expect(secondBanner.key()).to.equal('banner-file_2.csv');
    expect(firstBanner.dive().find('li').at(0).key()).to.equal('banner-file_1.csv-1');
    expect(firstBanner.dive().find('li').at(1).key()).to.equal('banner-file_1.csv-2');
    expect(secondBanner.dive().find('li').at(0).key()).to.equal('banner-file_2.csv-1');
  });

  it('should not display error banners if errors prop is empty', () => {
    wrapper = shallow(<TubesCreateFromCSV {...props} />);

    expect(wrapper.find('Banner').length).to.equal(0);
  });
});
