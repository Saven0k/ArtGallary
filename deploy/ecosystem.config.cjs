// PM2 — менеджер процессов для Nest-сервера (Windows и Linux).
//   npm i -g pm2
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save
//   автозапуск на Windows:  npm i -g pm2-windows-startup && pm2-startup install
//   логи:                   pm2 logs gallery-api
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'gallery-api',
      cwd: path.resolve(__dirname, '..', 'server'),   // важно: env-файлы, logs/ и STATIC_DIR считаются от cwd
      script: 'dist/main.js',
      instances: 1,                                   // >1 нельзя: при старте выполняется sync схемы и создание админа
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',                       // → подхватится server/.production.env
      },
      out_file: path.resolve(__dirname, '..', 'server', 'logs', 'pm2-out.log'),
      error_file: path.resolve(__dirname, '..', 'server', 'logs', 'pm2-error.log'),
      merge_logs: true,
      time: true,
    },
  ],
};
