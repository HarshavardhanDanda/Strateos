Our testing stack:
- Mocha    test runner
- Chai     assertion library
- Enzyme   nice API for testing react components
- Sinon    spies, stubs and mocks
- Istanbul test coverage

To run the tests: `npm test`

To run specific tests: `npm test -- -g pattern` Note: if the pattern supplied
matches multiple tests, then all matches will be run. Use a specific pattern
(such as the full test name) to run a single test.

To view coverage report: `open ./coverage/lcov-report/index.html`

Setup:

Mocha configuration is in '/app/client/main/test/mocha.opts'
Istanbul configuration is in '/.istanbul.yml'
Istanbul tracks our code coverage. It is automatically ran when you `npm test`.

Istanbul quirks:
We need to use `_mocha` instead of `mocha` because the `mocha` wrapper will not
allow Instanbul to track coverage.
We need to use istanbul@1.1.0-alpha.1 because the latest stable does not support
ES2015+ or babel-register

Enzyme Testing:

Enzyme Docs: https://github.com/airbnb/enzyme/tree/master/docs/api

tl;dr:

shallow(<Component />) for Shallow rendering is useful to constrain yourself to
testing a component as a unit, and to ensure that your tests aren't indirectly
asserting on behavior of child components.

mount(<Component />) for Full DOM rendering is ideal for use cases where you have
components that may interact with DOM apis, or may require the full lifecycle in
order to fully test the component (ie, componentDidMount etc.)

Notice that rendering, setting props and finding selectors and even synthetic events
are all supported by shallow rendering, so most times you can just use that.

But, you won't be able to get the full lifecycle of the component, so if you expect
things to happen in componentDidMount, you should use mount(<Component />);

In general, you should be using shallow.
