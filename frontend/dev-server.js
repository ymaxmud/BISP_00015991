/* eslint-disable @typescript-eslint/no-require-imports */
// Wrapper to ensure node is in PATH for Turbopack child processes
process.env.PATH = '/usr/local/bin:/opt/homebrew/bin:' + (process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin');
require('next/dist/bin/next');
