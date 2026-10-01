const http = require('http');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'db.json');
const port = 8080;

function readTutorials() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8')).tutorials;
}

function writeTutorials(tutorials) {
  fs.writeFileSync(dataFile, JSON.stringify({ tutorials }, null, 2));
}

function send(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(body === undefined ? '' : JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => body += chunk);
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    return send(response, 204);
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const match = url.pathname.match(/^\/api\/tutorials(?:\/([^/]+))?$/);
  if (!match) return send(response, 404, { message: 'Not found' });

  try {
    const id = match[1];
    let tutorials = readTutorials();

    if (request.method === 'GET' && !id) {
      const title = url.searchParams.get('title');
      const result = title
        ? tutorials.filter(t => (t.title || '').toLowerCase().includes(title.toLowerCase()))
        : tutorials;
      return send(response, 200, result);
    }

    if (request.method === 'GET' && id) {
      const tutorial = tutorials.find(t => String(t.id) === id);
      return tutorial ? send(response, 200, tutorial) : send(response, 404, { message: 'Tutorial not found' });
    }

    if (request.method === 'POST' && !id) {
      const data = await readBody(request);
      const nextId = tutorials.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0) + 1;
      const tutorial = { id: nextId, title: data.title, description: data.description, published: !!data.published };
      tutorials.push(tutorial);
      writeTutorials(tutorials);
      return send(response, 201, tutorial);
    }

    if (request.method === 'PUT' && id) {
      const index = tutorials.findIndex(t => String(t.id) === id);
      if (index < 0) return send(response, 404, { message: 'Tutorial not found' });
      tutorials[index] = { ...tutorials[index], ...(await readBody(request)), id: tutorials[index].id };
      writeTutorials(tutorials);
      return send(response, 200, tutorials[index]);
    }

    if (request.method === 'DELETE' && id) {
      const remaining = tutorials.filter(t => String(t.id) !== id);
      if (remaining.length === tutorials.length) return send(response, 404, { message: 'Tutorial not found' });
      writeTutorials(remaining);
      return send(response, 200, { message: 'Tutorial deleted' });
    }

    if (request.method === 'DELETE' && !id) {
      writeTutorials([]);
      return send(response, 200, { message: 'All tutorials deleted' });
    }

    return send(response, 405, { message: 'Method not allowed' });
  } catch (error) {
    return send(response, 400, { message: error.message });
  }
}).listen(port, () => console.log(`Tutorial API listening at http://localhost:${port}`));
