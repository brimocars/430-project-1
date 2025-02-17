const http = require('http');

const clientHandler = require('./clientHandler.js');
const dataHandler = require('./dataHandler.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const parseBody = (request) => {
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
      const bodyString = Buffer.concat(body).toString();
      resolve(JSON.parse(bodyString));
    });
  });
};

const parseQuery = (query) => {
  if (!query || query.length === 0) {
    return {};
  }
  const queryObject = {};
  const kvPairs = query.split('&');
  kvPairs.forEach((kvPair) => {
    const [key, value] = kvPair.split('=');
    queryObject[key] = value;
  })
  return queryObject;
};

const onRequest = async (req, res) => {
  console.log(req.url);
  console.log(req.method);
  const [baseUrl, query] = req.url.split('?');
  req.query = parseQuery(query);

  switch (baseUrl) {
    case '/':
      clientHandler.getIndex(req, res);
      break;
    case '/style.css':
      clientHandler.getStyle(req, res);
      break;
    case '/all':
      // get
      dataHandler.getAll(res);
      break;
    // Ideally, the following 4 endpoints would be combined into 1 endpoint (/senator) with a whole bunch of query params for
    // searching by or updating various fields. However, this assignment has a minimum endpoint requirement.
    case '/senator':
      // get and post
      req.body = await parseBody(req);
      dataHandler.senator(req, res)
      break;
    case '/state':
      // get and post
      req.body = await parseBody(req);
      break;
    case '/party':
      // get and post
      req.body = await parseBody(req);
      break;
    case '/contact':
      // get and post
      req.body = await parseBody(req);
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
