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

function getHeaders(content) {
  return {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(content)),
  };
}

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
  // remove final and
  response = response.slice(0, response.length - 5);
  return response;
}

function getSenator(firstName, lastName, party, state) {
  const senators = data
    .filter((senator) => utils.equalsIgnoreCase(senator.person.firstname, firstName))
    .filter((senator) => utils.equalsIgnoreCase(senator.person.lastname, lastName))
    .filter((senator) => utils.equalsIgnoreCase(senator.party, party))
    .filter((senator) => utils.equalsIgnoreCase(senator.state, state));
  return senators;
}

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
  parties.add(newSenator.party.toLowerCase());

  if (!newSenator.congress_numbers || newSenator.congress_numbers.length !== 3) {
    return { code: 400, message: 'senator must belong to 3 congresses' };
  }
  if (!newSenator.person.name) {
    newSenator.person.name = `Sen. ${newSenator.person.firstname} ${newSenator.person.lastname}
      [${newSenator.party[0]}-${newSenator.state}]`;
  }
  return undefined;
}

function maybeSetName(senator) {
  try {
    let name = senator?.person?.name;
    if (!name) {
      name = `Sen. ${senator.person.firstname} ${senator.person.lastname} [${senator.party[0]}-${senator.state}]`;
      senator.person.name = name;
      return name;
    }
  } catch (err) {
    // don't care about this error because it means the senator doesn't exist yet and fail validation, which will be
    // caught and dealt with later
  }
  return undefined;
}

function addOrModifySenator(req, res) {
  const name = maybeSetName(req);

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
      const responseObject = {
        message: `Updated senator '${name}'`,
      };
      res.writeHead(201, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
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
      // remove current senators for the state
      data = data.filter((s) => s.state !== state);

      senatorsToAdd.forEach((s) => {
        data.push(s);
      });
      const responseObject = {
        message: `Updated senators for state ${state}`,
      };
      res.writeHead(201, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
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
      message: `Found ${senators.length} ${senators.length === 1 ? 'senator' : 'senators'}${
        getResponseStringPartFromParams(firstName, lastName, party, state)}`,
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
  const {
    firstName, lastName, party, state,
  } = req.query;

  req.query.state = state.toUpperCase();
  if (!states.has(state.toUpperCase())) {
    const responseObject = {
      message: `State ${state} not found`,
    };
    res.writeHead(404, getHeaders(responseObject));
    if (req.method !== 'head') {
      res.write(JSON.stringify(responseObject));
    }
    res.end();
  } else if (req.body) {
    updateSenatorsFromState(req.query.state, req.body, res);
  } else {
    // remove all other query parameters
    req.query = { state: req.query.state };
    const senators = getSenator(firstName, lastName, party, state);
    const responseObject = {
      message: `Found ${senators.length} ${senators.length === 1 ? 'senator' : 'senators'}${
        getResponseStringPartFromParams(firstName, lastName, party, state)}`,
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
  const {
    firstName, lastName, party, state,
  } = req.query;

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
    const senators = getSenator(firstName, lastName, party, state);
    const responseObject = {
      message: `Found ${senators.length} ${senators.length === 1 ? 'senator' : 'senators'}${
        getResponseStringPartFromParams(firstName, lastName, party, state)}`,
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
    Object.keys(contactInfo)
      .forEach((key) => (contactInfo[key] === undefined ? () => { delete contactInfo[key]; } : () => { }));
    return contactInfo;
  });
  const responseObject = {
    message: `Found ${senators.length} ${senators.length === 1 ? 'senator' : 'senators'}${
      getResponseStringPartFromParams(firstName, lastName, party, state)}`,
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
      message: `Senator ${name} not found`,
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

  const responseObject = {
    message: `Updated gender of senator ${name} to ${gender}`,
  };
  res.writeHead(201, getHeaders(responseObject));
  res.write(JSON.stringify(responseObject));
  res.end();
}

module.exports = {
  senatorEndpoint,
  stateEndpoint,
  partyEndpoint,
  contactEndpoint,
  genderEndpoint,
};
