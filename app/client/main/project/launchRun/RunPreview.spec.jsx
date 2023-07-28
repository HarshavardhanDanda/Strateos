import React               from 'react';
import Immutable           from 'immutable';
import SessionStore from 'main/stores/SessionStore';
import { expect }          from 'chai';
import { shallow }         from 'enzyme';
import sinon               from 'sinon';
import Moment              from 'moment';
import RunPreview          from './RunPreview';

describe('Run Preview', () => {

  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'test123' }));
    sandbox.stub(SessionStore, 'isTestAccount').returns(false);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    if (sandbox) {
      sandbox.restore();
    }
  });

  const props = {
    validator: {
      preview: {
        quote: {}
      },
      previewRun: Immutable.Map(),
    },
    submitRun: () => {},
    onBack: () => {},
    bsl: 2,
    isImplementationRun: false,
    onPaymentSelected: () => {},
  };

  it('Should render run instruction', () => {
    wrapper = shallow(<RunPreview {...props} />);
    expect(wrapper.find('RunInstructions')).to.have.length(1);
  });
  it('Should render order summary', () => {
    wrapper = shallow(<RunPreview {...props} />);
    expect(wrapper.find('OrderSummary')).to.have.length(1);
  });
  it('Should render payment method selector', () => {
    wrapper = shallow(<RunPreview {...props} />);
    expect(wrapper.find('FormGroup').at(0).props().label).to.be.equals('Payment Method');
    const component = wrapper.find('ConnectedPaymentMethodSelector');
    expect(component.dive().find('PaymentMethodSelector')).to.have.length(1);
  });
  it('Should show request date when provided', () => {
    const propsWithRequestDate = {
      ...props,
      requestDate: Moment()
    };
    wrapper = shallow(<RunPreview {...propsWithRequestDate} />);
    const optionSection = wrapper.find('Section');
    expect(optionSection.at(1).dive().text()).include('Request Date');
    expect(optionSection.at(1).dive().text()).include(Moment().format('MMMM Do YYYY, h:mm a'));
  });
  it('Should show estimated run time in preview if provided', () => {
    const validator = {
      preview: {
        estimatedRunTime: 3600,
        quote: {}
      },
      previewRun: Immutable.Map()
    };
    wrapper = shallow(<RunPreview {...props} validator={validator} />);
    const previewHeading = wrapper.find('Section').at(0);
    expect(previewHeading.props().title).equal('Preview - Estimated run time : 1h');
  });
  it('Should not show estimated run time in preview if not provided', () => {
    wrapper = shallow(<RunPreview {...props} />);
    const previewHeading = wrapper.find('Section').at(0);
    expect(previewHeading.props().title).equal('Preview');
  });

  it('Should render RunCustomProperties when customInputsConfig is present', () => {
    const customInputsConfig = { key: 'value' };

    wrapper = shallow(<RunPreview {...props} customInputsConfig={customInputsConfig} />);
    expect(wrapper.find('RunCustomProperties').exists()).to.be.true;
  });

  it('Should render add payment method if organization of the run is same as the current organization that is logged in to', () => {
    wrapper = shallow(<RunPreview {...props} organizationId="test123" />);
    expect(wrapper.find('FormGroup').at(0).props().label).to.be.equals('Payment Method');
    const component = wrapper.find('ConnectedPaymentMethodSelector');
    expect(component.dive().find('PaymentMethodSelector').props().hideAddOption).to.be.false;
  });

  it('Should not render add payment method if organization of the run is not same as the current organization that is logged in to', () => {
    wrapper = shallow(<RunPreview {...props} organizationId="test456" />);
    expect(wrapper.find('FormGroup').at(0).props().label).to.be.equals('Payment Method');
    const component = wrapper.find('ConnectedPaymentMethodSelector');
    expect(component.dive().find('PaymentMethodSelector').props().hideAddOption).to.be.true;
  });

  it('Should not render payment method for implementation run', () => {
    wrapper = shallow(<RunPreview {...props} isImplementationRun />);
    expect(wrapper.find('FormGroup').length).to.be.equal(0);
    expect(wrapper.find('PaymentMethodSelector').length).to.be.equal(0);
  });

  it('Should render payment method if run is not implementation run', () => {
    wrapper = shallow(<RunPreview {...props} />);
    expect(wrapper.find('FormGroup').at(0).props().label).to.be.equals('Payment Method');
    const component = wrapper.find('ConnectedPaymentMethodSelector');
    expect(component.dive().find('PaymentMethodSelector')).to.have.length(1);
  });

  it('Should enable submit button when run is implementation run', () => {
    wrapper = shallow(<RunPreview
      {...props}
      isImplementationRun
      test_mode={false}
    />);
    const pane = wrapper.find('Pane');
    expect(pane.prop('nextBtnDisabled')).to.be.false;
  });

  it('Should enable submit button when payment method id is selected', () => {
    wrapper = shallow(<RunPreview
      {...props}
      paymentMethodId={'pm1234sr'}
      test_mode={false}
    />);
    const component = wrapper.find('ConnectedPaymentMethodSelector');
    expect(component.dive().find('PaymentMethodSelector')).to.have.length(1);
    const pane = wrapper.find('Pane');
    expect(pane.prop('nextBtnDisabled')).to.be.false;
  });

  it('Should disable submit button when payment method id is not selected', () => {
    wrapper = shallow(<RunPreview  {...props} test_mode={false} />);
    const component = wrapper.find('ConnectedPaymentMethodSelector');
    expect(component.dive().find('PaymentMethodSelector')).to.have.length(1);
    const pane = wrapper.find('Pane');
    expect(pane.prop('nextBtnDisabled')).to.be.true;
  });
});
