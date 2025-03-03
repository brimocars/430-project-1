const dataHandler = require('../../src/dataHandler');
const utils = require('../../src/utils');

describe('utils', () => {
  it('tests string compare', () => {
    expect(utils.equalsIgnoreCase('AaAa', 'AAAA')).toBe(true);
    expect(utils.equalsIgnoreCase('AaaA', 'aaaa')).toBe(true);
    expect(utils.equalsIgnoreCase('AAAA', 'aaaa')).toBe(true);
    expect(utils.equalsIgnoreCase('AB', 'ab')).toBe(true);
    expect(utils.equalsIgnoreCase('aaaaaaB', 'aaaaaaa')).toBe(false);
    expect(utils.equalsIgnoreCase('a', 'aa')).toBe(false);
  });
});

describe('getHeaders', () => {
  it('tests getHeaders with a response body', () => {
    const responseObject = {'some key': 'some value'};
    const expectedLength = Buffer.byteLength(JSON.stringify(responseObject));
    const expectedReturn = {
      'Content-Type': 'application/json',
      'Content-Length': expectedLength,
    };
    expect(dataHandler.getHeaders(responseObject)).toStrictEqual(expectedReturn);
  });
  it('tests getHeaders with an empty response body', () => {
    const responseObject = {};
    const expectedReturn = {
      'Content-Type': 'application/json',
      'Content-Length': 0,
    };
    expect(dataHandler.getHeaders(responseObject)).toStrictEqual(expectedReturn);
  });
});

describe('getResponseStringPartFromParams', () => {
  const firstName = 'Andy'
  const lastName = 'Kim'
  const party = 'democrat'
  const state = 'NJ'
  it('tests with all parameters', () => {
    const expectedReturn = ' with first name \'Andy\' and last name \'Kim\' and party \'democrat\' and state \'NJ\'';
    expect(dataHandler.getResponseStringPartFromParams(firstName, lastName, party, state)).toBe(expectedReturn);
  });
  it('tests with first name', () => {
    const expectedReturn = ' with first name \'Andy\'';
    expect(dataHandler.getResponseStringPartFromParams(firstName, undefined, undefined, undefined)).toBe(expectedReturn);
  });
  it('tests with last name', () => {
    const expectedReturn = ' with last name \'Kim\'';
    expect(dataHandler.getResponseStringPartFromParams(undefined, lastName, undefined, undefined)).toBe(expectedReturn);
  });
  it('tests with party name', () => {
    const expectedReturn = ' with party \'democrat\'';
    expect(dataHandler.getResponseStringPartFromParams(undefined, undefined, party, undefined)).toBe(expectedReturn);
  });
  it('tests with state name', () => {
    const expectedReturn = ' with state \'NJ\'';
    expect(dataHandler.getResponseStringPartFromParams(undefined, undefined, undefined, state)).toBe(expectedReturn);
  });
  it('tests with first name and state', () => {
    const expectedReturn = ' with first name \'Andy\' and state \'NJ\'';
    expect(dataHandler.getResponseStringPartFromParams(firstName, undefined, undefined, state)).toBe(expectedReturn);
  });
  it('tests with no parameters', () => {
    const expectedReturn = '';
    expect(dataHandler.getResponseStringPartFromParams(undefined, undefined, undefined, undefined)).toBe(expectedReturn);
  });
});

describe('getResponseStringPartFromParams', () => {
  const firstName = 'Andy'
  const lastName = 'Kim'
  const party = 'democrat'
  const state = 'NJ'
  it('tests with all parameters', () => {
    const expectedReturn = ' with first name \'Andy\' and last name \'Kim\' and party \'democrat\' and state \'NJ\'';
    expect(dataHandler.getResponseStringPartFromParams(firstName, lastName, party, state)).toBe(expectedReturn);
  });
  it('tests with first name', () => {
    const expectedReturn = ' with first name \'Andy\'';
    expect(dataHandler.getResponseStringPartFromParams(firstName, undefined, undefined, undefined)).toBe(expectedReturn);
  });
  it('tests with last name', () => {
    const expectedReturn = ' with last name \'Kim\'';
    expect(dataHandler.getResponseStringPartFromParams(undefined, lastName, undefined, undefined)).toBe(expectedReturn);
  });
  it('tests with party name', () => {
    const expectedReturn = ' with party \'democrat\'';
    expect(dataHandler.getResponseStringPartFromParams(undefined, undefined, party, undefined)).toBe(expectedReturn);
  });
  it('tests with state name', () => {
    const expectedReturn = ' with state \'NJ\'';
    expect(dataHandler.getResponseStringPartFromParams(undefined, undefined, undefined, state)).toBe(expectedReturn);
  });
  it('tests with first name and state', () => {
    const expectedReturn = ' with first name \'Andy\' and state \'NJ\'';
    expect(dataHandler.getResponseStringPartFromParams(firstName, undefined, undefined, state)).toBe(expectedReturn);
  });
  it('tests with no parameters', () => {
    const expectedReturn = '';
    expect(dataHandler.getResponseStringPartFromParams(undefined, undefined, undefined, undefined)).toBe(expectedReturn);
  });
});

describe('getSenator', () => {
  // Note: these tests are kinda fragile. If the senators data ever needs to change, these will need to be updated to.
  // Ideally, if the senator data was stored in a database or something, a mock db would be used for these tests, and
  // custom testing senators could be added and checked for. But, I'm not going that above and beyond, and this is
  // sufficient for the purposes of this project.
  const firstName = 'John'
  const lastName = 'Thune'
  const party = 'democrat'
  const state = 'NJ'
  it('tests getSenator', () => {
    const expectedReturnLength = 1;
    expect(dataHandler.getSenator(firstName, lastName, undefined, undefined)).toHaveLength(expectedReturnLength);
  });
  it('tests getSenator', () => {
    const expectedReturnLength = 10;
    expect(dataHandler.getSenator(firstName, undefined, undefined, undefined)).toHaveLength(expectedReturnLength);
  });
  it('tests getSenator', () => {
    const expectedReturnLength = 45;
    expect(dataHandler.getSenator(undefined, undefined, party, undefined)).toHaveLength(expectedReturnLength);
  });
  it('tests getSenator', () => {
    const expectedReturnLength = 2;
    expect(dataHandler.getSenator(undefined, undefined, undefined, state)).toHaveLength(expectedReturnLength);
  });
  it('tests getSenator', () => {
    const expectedReturnLength = 100;
    expect(dataHandler.getSenator(undefined, undefined, undefined, undefined)).toHaveLength(expectedReturnLength);
  });
  it('tests getSenator', () => {
    const expectedReturnLength = 0;
    expect(dataHandler.getSenator(firstName, undefined, undefined, state)).toHaveLength(expectedReturnLength);
  });
});

describe('validateSenator', () => {
  const defaultSenator = {
    person: {
      firstname: 'Andy',
      lastname: 'Kim',      
      name: 'Sen. Andy Kim [D-NJ]',
    },
    state: 'nj',
    party: 'Democrat',
    congress_numbers: [119, 120, 121],
  }
  let senator;
  beforeEach(() => {
    senator = structuredClone(defaultSenator);
  })

  it('validates a valid senator', () => {
    expect(dataHandler.validateSenator(senator)).toBeUndefined();
  });
  it('errors when given no senator', () => {
    expect(dataHandler.validateSenator({}).code).toBe(400);
  });
  it('validates a senator without a firstname', () => {
    delete senator.person.firstname;
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator without a firstname', () => {
    senator.person.firstname = '';
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator without a lastname', () => {
    delete senator.person.lastname;
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator without a lastname', () => {
    senator.person.lastname = '';
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator without a state', () => {
    delete senator.state;
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator with an invalid state', () => {
    // state must be 2 character abbreviation
    senator.state = 'New Jesey';
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('makes a senator\'s state uppercase', () => {
    expect(senator.state).toBe('nj');
    expect(dataHandler.validateSenator(senator)).toBeUndefined();
    expect(senator.state).toBe('NJ');
  });
  it('validates a senator without a party', () => {
    delete senator.party;
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator without a party', () => {
    senator.party = '';
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator without a congress_numbers', () => {
    delete senator.congress_numbers;
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator with invalid congress_numbers', () => {
    senator.congress_numbers = '123';
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator with invalid congress_numbers', () => {
    senator.congress_numbers = [1,2];
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  it('validates a senator with invalid congress_numbers', () => {
    senator.congress_numbers = ['one', 'two', 'three'];
    expect(dataHandler.validateSenator(senator).code).toBe(400);
  });
  // it('sets a senator\'s name', () => {
  //   const { name } = senator.person;
  //   delete senator.person.name;
  //   expect(senator.person.name).toBeUndefined();
  //   expect(dataHandler.validateSenator(senator)).toBeUndefined();
  //   expect(senator.person.name).toBe(name);
  // });
});