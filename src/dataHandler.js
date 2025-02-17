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

function addOrModifySenator(req, res) {
  const name = req.body?.person?.name;
  
  const existingIndex = data.indexOf(name);

  if (existingIndex === -1) {
    // add
    try {
      data.push(req.body);
      responseObject = {
        message: `Created senator ${name}`
      }
      res.writeHead(204, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
    } catch (err) {
      console.log(`Error creating senator: ${err}`);
    } finally {
      res.end();
    }
  } else {
    // modify
    try {
      data[existingIndex] = req.body;
      responseObject = {
        message: `Updated senator ${name}`
      }
      res.writeHead(204, getHeaders(responseObject));
      res.write(JSON.stringify(responseObject));
    } catch (err) {
      console.log(`Error updating senator: ${err}`);
    } finally {
      res.end();
    }
  }


  data.push(req.body);
  res.writeHead(204, getHeaders(responseObject));
  res.write(JSON.stringify(responseObject));
  res.end();

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
