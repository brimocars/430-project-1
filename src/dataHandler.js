const fs = require('fs');

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
  if (!req.query.firstName && !req.query.lastName) {
    const errResponse = {
      message: 'At least one of firstName and lastName are required',
      id: 'missingParams',
    }
    res.writeHead(400, getHeaders(errResponse));
    res.write(JSON.stringify(errResponse));
    res.end();
    return
  }

  const firstName = req.query.firstName?.toLowerCase();
  const lastName = req.query.lastName?.toLowerCase();

  const senators = [];
  if (firstName && lastName) {
    data.forEach((senator) => {
      if (senator.person.firstname.toLowerCase() === firstName && senator.person.lastname.toLowerCase() === lastName) {
        senators.push(senator)
      }
    })
  } else {
    data.forEach((senator) => {
      if (senator.person.firstname.toLowerCase() === firstName || senator.person.lastname.toLowerCase() === lastName) {
        senators.push(senator)
      }
    })
  }

  function getResponseStringPartFromParams(firstName, lastName) {
    let response = '';
    if (firstName) {
      response += `first name '${firstName}'`
    }
    if (firstName && lastName) {
      response += ' and '
    }
    if (lastName) {
      response += `last name '${lastName}'`
    }
    return response;
  }

  const responseObject = {
    message: `Found ${senators.length} ${senators.length === 1 ? 'senator' : 'senators'} with ${getResponseStringPartFromParams(firstName, lastName)}`,
    data: senators,
  }

  res.writeHead(200, getHeaders(responseObject));
  res.write(JSON.stringify(responseObject));
  res.end();
}

function addSenator(req, res) {
  
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
    addSenator(req, res);
  } else {
    getSenator(req, res);
  }
}

function addUser(req, res) {
  const { name, age } = req.body;
  if (!name || !age) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({
      message: 'Name and age are both required',
      id: 'addUserMissingParams',
    }));
  } else if (users[name]) {
    users[name].age = age;
    res.writeHead(204, { 'Content-Type': 'application/json' });
    res.write('');
  } else {
    users[name] = req.body;
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({
      message: 'Created Successfully',
    }));
  }
  res.end();
}

module.exports = {
  getAll,
  senator,
};
