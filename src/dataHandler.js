const fs = require('fs');
const utils = require('./utils');

const rawData = fs.readFileSync('./data/data.json');
const data = JSON.parse(rawData).data;

function getHeaders(content) {
  return {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(content)),
  }
}

function getSenator(req, res) {
  console.log(req.query);

  const { firstName, lastName, party, state } = req.query;


  const senators = data
    .filter((senator) => { return utils.equalsIgnoreCase(senator.person.firstName, firstName) })
    .filter((senator) => { return utils.equalsIgnoreCase(senator.person.lastName, lastName) })
    .filter((senator) => { return utils.equalsIgnoreCase(senator.party, party) })
    .filter((senator) => { return utils.equalsIgnoreCase(senator.state, state) });

  // function getResponseStringPartFromParams(firstName, lastName) {
  //   let response = '';
  //   if (firstName) {
  //     response += `first name '${firstName}'`
  //   }
  //   if (firstName && lastName) {
  //     response += ' and '
  //   }
  //   if (lastName) {
  //     response += `last name '${lastName}'`
  //   }
  //   return response;
  // }

  const responseObject = {
    message: `Found ${senators.length} ${senators.length === 1 ? 'senator' : 'senators'}`, // with ${getResponseStringPartFromParams(firstName, lastName)}`,
    data: senators,
  }

  res.writeHead(200, getHeaders(responseObject));
  res.write(JSON.stringify(responseObject));
  res.end();
}

function validateSenator(newSenator) {
  if (newSenator) {

  }
  throw new Error('cannot validate empty senator');
}

function addOrModifySenator(req, res) {
  const name = req.body?.person?.name;
  const existingIndex = data.findIndex((s) => s.person.name === name);
  validateSenator();


  if (existingIndex === -1) {
    // add
    try {
      validateSenator();
      data.push(req.body);
      const responseObject = {
        message: `Created senator "${name}"`
      }
      res.writeHead(201, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
      res.end();
    } catch (err) {
      console.log(`Error creating senator: ${err}`);
      const responseObject = {
        message: `Error: ${err}`
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
        message: `Updated senator "${name}"`
      };
      res.writeHead(201, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
      res.end();
    } catch (err) {
      console.log(`Error updating senator: ${err}`);
      const responseObject = {
        message: `Error: ${err}`
      };
      res.writeHead(500, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
      res.end();
    }
  }
}

function getAll(res) {
  const responseObject = {
    message: `Found ${data.length} ${data.length === 1 ? 'senator' : 'senators'}`,
    data: data,
  }
  res.writeHead(200, getHeaders(responseObject));
  res.write(JSON.stringify(responseObject));
  res.end();
}

function senator(req, res) {
  if (req.body) {
    addOrModifySenator(req, res);
  } else {
    getSenator(req, res);
  }
}

module.exports = {
  getAll,
  senator,
};
