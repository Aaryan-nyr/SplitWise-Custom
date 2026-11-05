#!/usr/bin/env bash
set -Eeuo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must be set before starting the application." >&2
  exit 1
fi

for attempt in {1..30}; do
  if node -e '
    const { Client } = require("pg");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    client.connect()
      .then(() => client.end())
      .catch((error) => {
        console.error(`Database connection failed: ${error.message}`);
        process.exit(1);
      });
  '; then
    echo "Database connection is ready; starting Next.js."
    exec npm start
  fi

  echo "Waiting for the database connection ($attempt/30)..."
  sleep 2
done

echo "Could not connect to the database after 60 seconds." >&2
exit 1
