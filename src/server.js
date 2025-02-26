const http = require('http');

const clientHandler = require('./clientHandler.js');
const dataHandler = require('./dataHandler.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const parseQuery = (query) => {
  if (!query || query.length === 0) {
    return {};
  }
  const queryObject = {};
  const kvPairs = query.split('&');
  kvPairs.forEach((kvPair) => {
    const [key, value] = kvPair.split('=');
    queryObject[key] = value;
  });
  return queryObject;
};

const parseBody = (request, isJson) => {
  if (request.method?.toUpperCase() !== 'POST') {
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
