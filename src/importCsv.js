const fs = require('fs');
const { parse } = require('csv-parse');
const http = require('http');

async function importCSV(filePath) {
  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  for await (const record of parser) {
    const task = {
      title: record.title,
      description: record.description
    };

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Task created:', JSON.parse(data));
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
    });

    req.write(JSON.stringify(task));
    req.end();
  }
}

// Uso:
importCSV('tasks.csv');