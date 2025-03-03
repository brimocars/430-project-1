const http = require('http');

const clientHandler = require('./clientHandler.js');
const dataHandler = require('./dataHandler.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

/**
 * Convert the query string of a url into an object
 * @param {String} query The query string from a url
 * @returns {Object} each key value pair from the query string on an object
 */
const parseQuery = (query) => {
  if (!query || query.length === 0) {
    return {};
  }
  const queryObject = {};
  // separate each query parameter
  const kvPairs = query.split('&');
  kvPairs.forEach((kvPair) => {
    // split each query parameter into its key and value, and add it to the object to return
    const [key, value] = kvPair.split('=');
    queryObject[key] = value;
  });
  return queryObject;
};

/**
 * Parse the request body and put it in an object
 * @param {Object} request the node http req object
 * @param {Boolean} isJson Whether the content type of the request is json or not. Form data is also supported.
 * @returns {Promise<Object>} The body of the request
 */
const parseBody = (request, isJson) => {
  // taken and modififed from the in-class demo
  if (request.method?.toUpperCase() !== 'POST') {
    // only get and post requests are supported, and, according to http standards, gets cannot have bodies.
    return undefined;
  }

  const body = [];

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  return new Promise((resolve, reject) => {
    request.on('error', (err) => {
      console.dir(err);
      reject(err);
    });

    request.on('end', () => {
      try {
        const bodyString = Buffer.concat(body).toString();
        if (!isJson) {
          // form data is just a string that can be parsed exactly like a query parameter
          const decodedQuery = decodeURIComponent(bodyString);
          const queryObject = parseQuery(decodedQuery.replaceAll('"', ''));
          resolve(queryObject);
        } else {
          resolve(JSON.parse(bodyString));
        }
      } catch (err) {
        reject(err);
      }
    });
  });
};

const onRequest = async (req, res) => {
  console.log(req.url);
  console.log(req.method);
  const [baseUrl, query] = req.url.split('?');
  req.query = parseQuery(query) ?? {};
  const isJson = req.headers['content-type'] === 'application/json';
  if (req.method === 'POST' && !isJson && req.headers['content-type'] !== 'application/x-www-form-urlencoded') {
    // any content type that isn't json or form data is not supported
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({
      id: 'badRequest',
      message: 'Unsupported content type',
    }));
    res.end();
    return;
  }

  switch (baseUrl) {
    case '/':
      clientHandler.getIndex(res);
      break;
    case '/docs':
      clientHandler.getDocs(res);
      break;
    case '/style.css':
      clientHandler.getStyle(res);
      break;
    case '/senator':
      // get and post
      try {
        req.body = await parseBody(req, isJson);
      } catch (err) {
        console.log(err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
          id: 'badRequest',
          message: 'Error parsing json',
        }));
        res.end();
        return;
      }
      dataHandler.senatorEndpoint(req, res);
      break;
    case '/state':
      // get and post
      try {
        req.body = await parseBody(req, isJson);
      } catch (err) {
        console.log(err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
          id: 'badRequest',
          message: 'Error parsing json',
        }));
        res.end();
        return;
      }
      dataHandler.stateEndpoint(req, res);
      break;
    case '/party':
      // get
      dataHandler.partyEndpoint(req, res);
      break;
    case '/contact':
      // get
      dataHandler.contactEndpoint(req, res);
      break;
    case '/gender':
      // post
      try {
        req.body = await parseBody(req, isJson);
      } catch (err) {
        console.log(err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
          id: 'badRequest',
          message: 'Error parsing json',
        }));
        res.end();
        return;
      }
      dataHandler.genderEndpoint(req, res);
      break;
    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({
        id: 'notFound',
        message: 'The page you are looking for was not found.',
      }));
      res.end();
      break;
  }
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1:${port}`);
});
