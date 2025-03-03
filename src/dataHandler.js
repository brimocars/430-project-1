const fs = require('fs');
const utils = require('./utils');

const rawData = fs.readFileSync('./data/data.json');
let data = JSON.parse(rawData);

const states = new Set();
data.forEach((s) => {
  states.add(s.state);
});

const parties = new Set();
data.forEach((s) => {
  parties.add(s.party.toLowerCase());
});

/**
 * Gets the required headers for every response
 * @param {Object} content The response body 
 * @returns {Object} The header object with Content-Type and Content-Length
 */
function getHeaders(content) {
  const contentLength = Buffer.byteLength(JSON.stringify(content));
  return {
    'Content-Type': 'application/json',
    // an empty object has a length of 2. This indicates a response without a body, so length should be 0.
    'Content-Length': contentLength > 2 ? contentLength : 0,
  };
}

/**
 * Gets a descriptive string to return in the message of a request based on the supplied query parameters 
 * @param {String} firstName Senator's first name
 * @param {String} lastName Senator's last name
 * @param {String} party Senator's political party
 * @param {String} state Senator's state as a 2 character abbreviation
 * @returns {String} the string to add to the response message
 */
function getResponseStringPartFromParams(firstName, lastName, party, state) {
  let response = '';
  if (firstName) {
    response += `first name '${firstName}' and `;
  }
  if (lastName) {
    response += `last name '${lastName}' and `;
  }
  if (party) {
    response += `party '${party}' and `;
  }
  if (state) {
    response += `state '${state}' and `;
  }
  if (response.length) {
    response = ` with ${response}`;
  }
  // remove final 'and'
  response = response.slice(0, response.length - 5);
  return response;
}

/**
 * Gets senators that match query parameters
 * @param {String} firstName Senator's first name
 * @param {String} lastName Senator's last name
 * @param {String} party Senator's political party
 * @param {String} state Senator's state as a 2 character abbreviation
 * @returns {Object[]} A list of senators that match the parameters
 */
function getSenator(firstName, lastName, party, state) {
  const senators = data
    .filter((senator) => utils.equalsIgnoreCase(senator.person.firstname, firstName))
    .filter((senator) => utils.equalsIgnoreCase(senator.person.lastname, lastName))
    .filter((senator) => utils.equalsIgnoreCase(senator.party, party))
    .filter((senator) => utils.equalsIgnoreCase(senator.state, state));
  return senators;
}

/**
 * Checks the required parameters for a senator. Some are added if they can be calculated, such as name
 * @param {Object} newSenator The new senator to validate
 * @param {String} state The senator's state as a 2 character abbreviation, only if this is a POST /state request
 * @returns {Object} A validation error, or undefined if there is no error
 */
function validateSenator(newSenator, state = undefined) {
  if (!newSenator) {
    return { code: 400, message: 'Request missing body' };
  }
  if (!newSenator.person) {
    return { code: 400, message: 'senator must have a person' };
  }
  if (!newSenator.person.firstname || !newSenator.person.firstname.length) {
    return { code: 400, message: 'senator.person must have a firstName' };
  }
  if (!newSenator.person.lastname || !newSenator.person.lastname.length) {
    return { code: 400, message: 'senator.person must have a lastName' };
  }
  if (!newSenator.state || newSenator.state.length !== 2) {
    return { code: 400, message: 'senator must have a state sent as a 2 character abbreviation' };
  }
  newSenator.state = newSenator.state.toUpperCase();

  if (state && newSenator.state !== state) {
    // only used for the /state endpoint
    return { code: 400, message: 'senator.state and state must match' };
  }
  if (!newSenator.party || !newSenator.party.length) {
    return { code: 400, message: 'senator must have a party' };
  }

  if (!newSenator.congress_numbers || newSenator.congress_numbers.length !== 3) {
    return { code: 400, message: 'senator must belong to 3 congresses' };
  }
  if (!newSenator.person.name) {
    newSenator.person.name = `Sen. ${newSenator.person.firstname} ${newSenator.person.lastname}
    [${newSenator.party[0]}-${newSenator.state}]`;
  }
  parties.add(newSenator.party.toLowerCase());
  return undefined;
}

/**
 * The name property on a senator is a combination of their first and last name, state, and party. Therefore, it can be
 * calculated if all of those are provided. This method calculates the senator's name if one was not provided
 * @param {Object} senator The senator
 * @returns 
 */
function maybeSetName(senator) {
  try {
    let name = senator?.person?.name;
    if (name) return name;
    if (!name) {
      name = `Sen. ${senator.person.firstname} ${senator.person.lastname} [${senator.party[0]}-${senator.state}]`;
      senator.person.name = name;
      return name;
    }
  } catch (err) {
    // Don't care about this error because it means the senator doesn't exist yet and will fail validation, which will
    // be caught and dealt with later. This is just here so we don't crash the server.
  }
  return undefined;
}

function addOrModifySenator(req, res) {
  const name = maybeSetName(req.body);

  const existingIndex = data.findIndex((s) => s.person.name === name);

  if (existingIndex === -1) {
    // add
    try {
      const validationError = validateSenator(req.body);
      if (validationError) {
        console.log(`Validation error: ${validationError.message}`);
        const responseObject = {
          message: `Error: ${validationError.message}`,
        };
        res.writeHead(validationError.code, getHeaders(responseObject));
        res.write(JSON.stringify(responseObject));
        res.end();
      } else {
        data.push(req.body);
        const responseObject = {
          message: `Created senator '${req.body.person.name}'`,
        };
        res.writeHead(201, getHeaders(responseObject));
        res.write(JSON.stringify(responseObject));
        res.end();
      }
    } catch (err) {
      console.log(`Error creating senator: ${err}`);
      const responseObject = {
        message: `Error: ${err}`,
      };
      res.writeHead(500, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
      res.end();
    }
  } else {
    // modify
    try {
      data[existingIndex] = req.body;
      // Personally, I think it's better practive to send a 200 with a message in the response body. However, the
      // requirements say we must use a 204 header somewhere in the project.
      res.writeHead(204, getHeaders({}));
      res.end();
    } catch (err) {
      console.log(`Error updating senator: ${err}`);
      const responseObject = {
        message: `Error: ${err}`,
      };
      res.writeHead(500, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
      res.end();
    }
  }
}

function updateSenatorsFromState(state, newSenatorsForState, res) {
  try {
    if (newSenatorsForState.length !== 2) {
      const responseObject = {
        message: 'Error: must have 2 senators for a state',
      };
      console.log(responseObject.message);
      res.writeHead(400, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
      res.end();
    } else {
      const senatorsToAdd = [];
      for (let i = 0; i < 2; i++) {
        const s = newSenatorsForState[i];
        // don't need to store the response from this because it updates the senator object, and we don't need to check
        // if a senator already exists for this endpoint
        maybeSetName(s);
        const validationError = validateSenator(s, state);
        if (validationError) {
          console.log(`Validation error: ${validationError.message}`);
          const responseObject = {
            message: `Error: ${validationError.message}`,
          };
          res.writeHead(validationError.code, getHeaders(responseObject));
          res.write(JSON.stringify(responseObject));
          res.end();
          return;
        }
        senatorsToAdd.push(s);
      }
      const stateAlreadyExists = states.has(state);
      states.add(state);
      // remove current senators for the state because there can only be 2
      data = data.filter((s) => s.state !== state);

      senatorsToAdd.forEach((s) => {
        data.push(s);
      });
      const responseObject = stateAlreadyExists ? {} : {
        message: `Created senators for state ${state}`,
      };
      res.writeHead(stateAlreadyExists ? 204 : 201, getHeaders(responseObject));
      if (stateAlreadyExists) {
        res.write(JSON.stringify(responseObject));
      }
      res.end();
    }
  } catch (err) {
    console.log(`Error updating senators for state ${state}: ${err}`);
    const responseObject = {
      message: `Error: ${err}`,
    };
    res.writeHead(500, getHeaders(responseObject));
    res.write(JSON.stringify(responseObject));
    res.end();
  }
}

function senatorEndpoint(req, res) {
  if (req.body) {
    addOrModifySenator(req, res);
  } else {
    const {
      firstName, lastName, party, state,
    } = req.query;
    const senators = getSenator(firstName, lastName, party, state);
    const responseObject = {
      message: `Found ${senators.length} ${senators.length === 1
        ? 'senator' : 'senators'}${getResponseStringPartFromParams(firstName, lastName, party, state)}`,
      data: senators,
    };
    res.writeHead(200, getHeaders(responseObject));
    if (req.method !== 'head') {
      res.write(JSON.stringify(responseObject));
    }
    res.end();
  }
}

function stateEndpoint(req, res) {
  let { state } = req.query;

  if (!state) {
    const responseObject = {
      message: `State ${state} not specified`,
    };
    res.writeHead(400, getHeaders(responseObject));
    if (req.method !== 'head') {
      res.write(JSON.stringify(responseObject));
    }
    res.end();
    return;
  }
  state = state.toUpperCase();
  if (req.body) {
    updateSenatorsFromState(state, req.body, res);
  } else if (!states.has(state)) {
    const responseObject = {
      message: `State ${state} not found`,
    };
    res.writeHead(404, getHeaders(responseObject));
    if (req.method !== 'head') {
      res.write(JSON.stringify(responseObject));
      res.end();
    }
  } else {
    const senators = getSenator(undefined, undefined, undefined, state);
    const responseObject = {
      message: `Found ${senators.length} ${senators.length === 1
        ? 'senator' : 'senators'}${getResponseStringPartFromParams(undefined, undefined, undefined, state)}`,
      data: senators,
    };
    res.writeHead(200, getHeaders(responseObject));
    if (req.method !== 'head') {
      res.write(JSON.stringify(responseObject));
    }
    res.end();
  }
}

function partyEndpoint(req, res) {
  const { party } = req.query;

  if (!parties.has(party.toLowerCase())) {
    const responseObject = {
      message: `Party ${req.query?.party} not found`,
    };
    res.writeHead(404, getHeaders(responseObject));
    if (req.method !== 'head') {
      res.write(JSON.stringify(responseObject));
    }
    res.end();
  } else {
    // remove all other query parameters
    req.query = { party: req.query.party };
    const senators = getSenator(undefined, undefined, party, undefined);
    const responseObject = {
      message: `Found ${senators.length} ${senators.length === 1
        ? 'senator' : 'senators'}${getResponseStringPartFromParams(undefined, undefined, party, undefined)}`,
      data: senators,
    };
    res.writeHead(200, getHeaders(responseObject));
    if (req.method !== 'head') {
      res.write(JSON.stringify(responseObject));
    }
    res.end();
  }
}

function contactEndpoint(req, res) {
  const {
    firstName, lastName, party, state,
  } = req.query;

  const senators = getSenator(firstName, lastName, party, state);
  const relevantData = senators.map((s) => {
    const contactInfo = {
      name: s.person.name,
      address: s.extra?.address,
      contact_form: s.extra?.contact_form,
      phone: s.phone,
      website: s.website,
    };
    // remove undefined properties from contactInfo
    Object.keys(contactInfo)
      .forEach((key) => (contactInfo[key] === undefined ? () => { delete contactInfo[key]; } : () => { }));
    return contactInfo;
  });
  const responseObject = {
    message: `Found ${senators.length} ${senators.length === 1
      ? 'senator' : 'senators'}${getResponseStringPartFromParams(firstName, lastName, party, state)}`,
    data: relevantData,
  };
  res.writeHead(200, getHeaders(responseObject));
  if (req.method !== 'head') {
    res.write(JSON.stringify(responseObject));
  }
  res.end();
}

function genderEndpoint(req, res) {
  const { name, gender } = req.body;
  const senatorToUpdate = data.find((s) => s.person.name === name);
  if (!senatorToUpdate) {
    const responseObject = {
      message: `Senator '${name}' not found`,
    };
    res.writeHead(404, getHeaders(responseObject));
    res.write(JSON.stringify(responseObject));
    res.end();
    return;
  }
  if (!gender) {
    const responseObject = {
      message: 'No gender specified',
    };
    res.writeHead(400, getHeaders(responseObject));
    res.write(JSON.stringify(responseObject));
    res.end();
    return;
  }

  senatorToUpdate.person.gender = gender.toLowerCase();
  senatorToUpdate.person.gender_label = `${gender[0].toUpperCase()}${gender.slice(1).toLowerCase()};`;

  res.writeHead(204, getHeaders({}));
  res.end();
}

module.exports = {
  senatorEndpoint,
  stateEndpoint,
  partyEndpoint,
  contactEndpoint,
  genderEndpoint,
};
