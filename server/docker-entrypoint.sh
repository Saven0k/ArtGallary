#!/bin/sh
set -eu
node /app/dist/database/bootstrap.js
export DB_SYNC=false
exec "$@"