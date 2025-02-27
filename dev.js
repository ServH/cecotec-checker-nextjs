const { spawn } = require('child_process');
const colors = require('colors');

const colorize = (prefix, data, color) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.log(color(`[${prefix}] ${line}`));
    }
  });
};

// Iniciar el servidor Express
const server = spawn('npm', ['run', 'server']);
server.stdout.on('data', (data) => colorize('SERVER', data, colors.yellow));
server.stderr.on('data', (data) => colorize('SERVER ERROR', data, colors.red));

// Iniciar la aplicación Next.js
const nextApp = spawn('npm', ['run', 'dev']);
nextApp.stdout.on('data', (data) => colorize('NEXT.JS', data, colors.cyan));
nextApp.stderr.on('data', (data) => colorize('NEXT.JS ERROR', data, colors.red));

// Manejo de procesos creo
const cleanup = () => {
  server.kill();
  nextApp.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);