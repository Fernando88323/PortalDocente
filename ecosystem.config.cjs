module.exports = {
  apps: [
    {
      name: "portal-docente",
      cwd: "/home/ubuntu/PortalDocente",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3065",
      interpreter: "/opt/node-18.20.4/bin/node",
      env: {
        NODE_ENV: "production",
        // Si quieres fijar variables solo de servidor, colócalas aquí:
        // DATABASE_URL: 'mysql://user:pass@host:3306/db'
        // PORT: '3000'  // opcional si ya pasas -p 3000
      },
      // Buenas prácticas:
      watch: false,
      max_memory_restart: "512M",
      error_file: "/var/log/pm2/portal-docente-error.log",
      out_file: "/var/log/pm2/portal-docente-out.log",
      time: true,
    },
  ],
};
