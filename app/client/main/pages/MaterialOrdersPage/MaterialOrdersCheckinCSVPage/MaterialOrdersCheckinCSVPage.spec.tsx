import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { PizzaTracker, Button, Banner } from '@transcriptic/amino';
import Urls from 'main/util/urls';
import CommonUiUtil from 'main/util/CommonUiUtil';
import GenericCSVUploadPane from 'main/components/GenericCSVUploadPane';
import FieldMapper from 'main/components/FieldMapper';
import csv_template from 'main/pages/MaterialOrdersPage/MaterialOrdersCheckinCSVPage/template/csv_template.json';
import MaterialOrdersCheckinCSVPage from './MaterialOrdersCheckinCSVPage';
import MaterialOrdersCheckinCSVForm from './MaterialOrdersCheckinCSVForm';
import { keys } from './CsvCheckinFields';

const parsedCsvMock = [{ id: '1' }, { id: '2' }];

const transformedDataMock = [
  {
    [keys.vendorOrderId]: 'order-1',
    [keys.sku]: 'sku-1'
  },
  {
    [keys.vendorOrderId]: 'order-2',
    [keys.sku]: 'sku-2'
  }
];

describe('MaterialOrdersCheckinCSVPage', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    Urls.use('strateos');
    wrapper = shallow(<MaterialOrdersCheckinCSVPage />);
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  const visiblePane = () => wrapper.find('.material-orders-checkin-csv-page__screen--active');

  describe('PizzaTracker', () => {
    it('should render a PizzaTracker', () => {
      const pizzaTracker = wrapper.find(PizzaTracker);

      expect(pizzaTracker.length).to.equal(1);
      expect(pizzaTracker.props().steps.length).to.equal(3);
      expect(pizzaTracker.props().activeStepIndex).to.equal(0);
    });

    it('should render the CSVUploadPane when the PizzaTracker onChange is called with 0 index', () => {
      wrapper.find(PizzaTracker).props().onChange(0);

      expect(wrapper.find(GenericCSVUploadPane).length).to.equal(1);
    });

    it('should render FieldMapper pane when the PizzaTracker onChange is called with 1 index', () => {
      visiblePane().find(GenericCSVUploadPane).props().setCSVData(parsedCsvMock);
      wrapper.find(PizzaTracker).props().onChange(1);
      expect(visiblePane().length).to.equal(1);
      expect(visiblePane().find(FieldMapper).length).to.equal(1);
      expect(visiblePane().find(GenericCSVUploadPane).length).to.equal(0);
    });
  });

  describe('Next and Back buttons', () => {
    it('should have 2 buttons', () => {
      expect(wrapper.find(Button).length).to.equal(2);
    });

    it('should render a Back button with link to the Orders page when on first pane', () => {
      const backButton = wrapper.find(Button).at(0);

      expect(backButton).to.exist;
      expect(backButton.props().to).to.equal('/strateos/vendor/orders');
      expect(backButton.props().onClick).to.equal(false);
      expect(backButton.props().type).to.equal('secondary');
    });

    it('should render a Back button to previous pane when on subsequent panes', () => {
      wrapper.find(PizzaTracker).props().onChange(1);

      const backButton = wrapper.find(Button).at(0);
      expect(backButton.props().to).to.equal(false);
      expect(backButton.props().onClick).to.not.be.undefined;
    });

    it('should render a Next button', () => {
      const nextButton = wrapper.find(Button).at(1);

      expect(nextButton).to.exist;
      expect(nextButton.props().type).to.equal('primary');
      expect(nextButton.props().onClick).to.not.equal(undefined);
    });

    it('should enable second step if file has been uploaded', () => {
      expect(wrapper.find(Button).at(1).props().disabled).to.equal(true);
      visiblePane().find(GenericCSVUploadPane).props().setCSVData(parsedCsvMock);
      expect(wrapper.find(Button).at(1).props().disabled).to.equal(false);
    });

    it('should enable third step if fields have been mapped', () => {
      visiblePane().find(GenericCSVUploadPane).props().setCSVData(parsedCsvMock);
      wrapper.find(PizzaTracker).props().onChange(1);
      expect(wrapper.find(Button).at(1).props().disabled).to.equal(true);
      visiblePane().find(FieldMapper).props().onChange({}, [], true);
      expect(wrapper.find(Button).at(1).props().disabled).to.equal(false);
    });
  });

  describe('CSV Upload', () => {
    it('should render the GenericCSVUploadPane', () => {
      expect(wrapper.find(GenericCSVUploadPane).length).to.equal(1);
    });

    it('should pass uploaded csv data to field mapper pane', () => {
      const parsedCsvMock = [{ id: '1' }, { id: '2' }];
      visiblePane().find(GenericCSVUploadPane).props().setCSVData(parsedCsvMock);
      wrapper.find(PizzaTracker).props().onChange(1);
      expect(visiblePane().find(FieldMapper).props().data.length).to.equal(2);
    });

    it('should validate that csv data is not a mix of group and individual orders', () => {
      const validGroupData = [{ 'Group Item Name': 'Group name 1' }, { 'Group Item Name': 'Group name 2' }];
      const validIndividualData = [{ 'Group Item Name': '' }, { 'Group Item Name': '' }];
      const invalidMixData = [{ 'Group Item Name': 'Group name' }, { 'Group Item Name': '' }];
      expect(wrapper.find(GenericCSVUploadPane).props().validateCsvData(validGroupData).isError).to.equal(false);
      expect(wrapper.find(GenericCSVUploadPane).props().validateCsvData(validIndividualData).isError).to.equal(false);
      expect(wrapper.find(GenericCSVUploadPane).props().validateCsvData(invalidMixData).isError).to.equal(true);
      expect(wrapper.find(GenericCSVUploadPane).props().validateCsvData(invalidMixData).errorMessage).to.equal(
        'File must contain only Individual or only Group orders. Group orders are specified in the "Group Item Name" column.'
      );
    });
  });

  describe('Field Mapping', () => {
    beforeEach(() => {
      visiblePane().find(GenericCSVUploadPane).props().setCSVData(parsedCsvMock);
      wrapper.find(PizzaTracker).props().onChange(1);
    });

    it('should set fields prop for FieldMapper', () => {
      expect(visiblePane().find(FieldMapper).props().fields).to.deep.equal([
        { display: 'Order ID*', required: true },
        { display: 'Sku*', required: true },
        { display: 'Container Type*', required: true },
        { display: 'Lot #*', required: true },
        { display: 'Location ID*', required: true },
        { display: 'Storage Condition*', required: true },
        { display: 'Barcode*', required: true },
        { display: 'Label' },
        { display: 'Exp Date (MM/dd/YYYY)' },
        { display: 'Volume (µL)' },
        { display: 'Mass (mg)' },
        { display: 'Group Item Name' }
      ]);
    });

    it('should have all available fields represented in the csv template', () => {
      const fieldNames = wrapper.find(FieldMapper).props().fields.map(field => field.display).sort();
      const csvHeaders = Object.keys(csv_template[0]).sort();
      expect(fieldNames).to.deep.equal(csvHeaders);
    });

    it('should display custom error if neither mass or volume has been mapped', () => {
      const incorrectMapping = {
        [keys.volume]: null,
        [keys.mass]: null
      };
      expect(visiblePane().find(FieldMapper).props().getCustomError(incorrectMapping, [])).to.deep.equal({
        'Volume (µL)': 'Either volume or mass is required',
        'Mass (mg)': 'Either volume or mass is required'
      });
    });

    it('should NOT display custom error if mass or volume has been mapped', () => {
      expect(visiblePane().find(FieldMapper).props().getCustomError({
        [keys.volume]: 'volume',
        [keys.mass]: null
      }, [])).to.deep.equal({});
      expect(visiblePane().find(FieldMapper).props().getCustomError({
        [keys.volume]: null,
        [keys.mass]: 'mass'
      }, [])).to.deep.equal({});
    });

    it('should display custom error if order id or sku columns are missing data', () => {
      const fieldMap = {
        [keys.volume]: 'volume',
        [keys.mass]: 'mass'
      };
      const incorrectTransformedData = [
        {
          [keys.vendorOrderId]: 'order-id',
          [keys.sku]: null
        },
        {
          [keys.vendorOrderId]: null,
          [keys.sku]: 'sku'
        }
      ];
      expect(visiblePane().find(FieldMapper).props().getCustomError(fieldMap, incorrectTransformedData)).to.deep.equal({
        'Order ID*': 'Data is required for this column',
        'Sku*': 'Data is required for this column'
      });
    });
  });

  describe('Checkin Form', () => {
    beforeEach(() => {
      visiblePane().find(GenericCSVUploadPane).props().setCSVData(parsedCsvMock);
      wrapper.find(PizzaTracker).props().onChange(1);
      visiblePane().find(FieldMapper).props().onChange({}, transformedDataMock, true);
      wrapper.find(PizzaTracker).props().onChange(2);
    });

    it('should set checkin form data prop', () => {
      expect(visiblePane().find(MaterialOrdersCheckinCSVForm).props().transformedData.length).to.deep.equal(2);
    });

    it('should verify that user wants to cancel changes when navigating back', () => {
      const confirmSpy = sandbox.spy(CommonUiUtil, 'confirmWithUser');
      wrapper.find(PizzaTracker).props().onChange(1);
      expect(confirmSpy.calledOnce).to.be.true;
      expect(confirmSpy.getCall(0).args[0]).to.equal('Changing the mapping may result in losing your changes. Are you sure you want to continue?');
    });

    it('should render back button inside checkin form', () => {
      const renderedBackButton = shallow(visiblePane().find(MaterialOrdersCheckinCSVForm).props().backButton);
      expect(wrapper.find(Button).filterWhere(button => button.text() === 'Back').length).to.equal(0);
      expect(renderedBackButton.text()).to.equal('Back');
      renderedBackButton.unmount();
    });

    it('should redirect to orders page on successful bulk checkin', () => {
      const redirect = sandbox.spy();
      wrapper.setProps({ history: { replace: redirect } });
      visiblePane().find(MaterialOrdersCheckinCSVForm).props().onBulkCheckinSuccess();
      expect(redirect.calledOnce).to.be.true;
      expect(redirect.getCall(0).args[0].pathname).to.equal(Urls.material_orders_page());
    });

    it('should enable display of errors when in view', () => {
      expect(visiblePane().find(MaterialOrdersCheckinCSVForm).props().disableErrorDisplay).to.be.false;
    });

    it('should disable display of errors when not in view', () => {
      sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
      wrapper.find(PizzaTracker).props().onChange(0);
      expect(wrapper.find(MaterialOrdersCheckinCSVForm).props().disableErrorDisplay).to.be.true;
    });
  });

  describe('Banner', () => {
    it('should have a Banner with error message', () => {
      visiblePane().find(GenericCSVUploadPane).props().handleBannerMsg('error', 'Some generic error message');

      const banner = wrapper.find(Banner);

      expect(banner).to.exist;
      expect(banner.props().bannerType).to.equal('error');
      expect(wrapper.find(Banner).props().bannerMessage).to.equal('Some generic error message');
    });

    it('should not have a Banner if there are no errors', () => {
      expect(wrapper.find(Banner).length).to.equal(0);
    });
  });
});
