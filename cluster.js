const cluster = require('node:cluster');
const os = require('node:os');

if (cluster.isPrimary || cluster.isMaster) {
  const cpus = os.cpus()?.length || 1;
  // Use up to available CPU cores (capped at 8 for container stability)
  const numWorkers = Math.max(1, Math.min(cpus, 8));
  console.log(`[Bizearch Cluster] Primary process ${process.pid} running on ${cpus} CPU core(s). Forking ${numWorkers} worker(s)...`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`[Bizearch Cluster] Worker ${worker.process.pid} terminated (${signal || code}). Auto-recovering worker...`);
    cluster.fork();
  });
} else {
  // In Next.js standalone build, server.js starts the HTTP server
  require('./server.js');
}
