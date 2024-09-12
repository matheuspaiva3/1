const http = require('http');
const url = require('url');

const tasks = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true);
  const method = req.method;

  // Middleware para parsing do body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    if (body) {
      try {
        req.body = JSON.parse(body);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
      }
    }
    handleRequest(req, res, pathname, method, query);
  });
});

function handleRequest(req, res, pathname, method, query) {
  if (pathname === '/tasks' && method === 'POST') {
    createTask(req, res);
  } else if (pathname === '/tasks' && method === 'GET') {
    listTasks(req, res, query);
  } else if (pathname.startsWith('/tasks/') && method === 'PUT') {
    updateTask(req, res, pathname);
  } else if (pathname.startsWith('/tasks/') && method === 'DELETE') {
    deleteTask(req, res, pathname);
  } else if (pathname.match(/^\/tasks\/\d+\/complete$/) && method === 'PATCH') {
    toggleTaskCompletion(req, res, pathname);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
}

function createTask(req, res) {
  const { title, description } = req.body;
  if (!title || !description) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Title and description are required' }));
  }

  const newTask = {
    id: nextId++,
    title,
    description,
    completed_at: null,
    created_at: new Date(),
    updated_at: new Date()
  };

  tasks.push(newTask);
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(newTask));
}

function listTasks(req, res, query) {
  let filteredTasks = tasks;
  if (query.title || query.description) {
    filteredTasks = tasks.filter(task => 
      (!query.title || task.title.toLowerCase().includes(query.title.toLowerCase())) &&
      (!query.description || task.description.toLowerCase().includes(query.description.toLowerCase()))
    );
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(filteredTasks));
}

function updateTask(req, res, pathname) {
  const id = parseInt(pathname.split('/')[2]);
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Task not found' }));
  }

  const { title, description } = req.body;
  if (title) tasks[taskIndex].title = title;
  if (description) tasks[taskIndex].description = description;
  tasks[taskIndex].updated_at = new Date();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(tasks[taskIndex]));
}

function deleteTask(req, res, pathname) {
  const id = parseInt(pathname.split('/')[2]);
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Task not found' }));
  }

  tasks.splice(taskIndex, 1);
  res.writeHead(204);
  res.end();
}

function toggleTaskCompletion(req, res, pathname) {
  const id = parseInt(pathname.split('/')[2]);
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Task not found' }));
  }

  if (tasks[taskIndex].completed_at) {
    tasks[taskIndex].completed_at = null;
  } else {
    tasks[taskIndex].completed_at = new Date();
  }
  tasks[taskIndex].updated_at = new Date();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(tasks[taskIndex]));
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});