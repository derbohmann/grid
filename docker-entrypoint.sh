#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/data/app.db}"
export DATA_DIR="${DATA_DIR:-/data}"

mkdir -p "$DATA_DIR/uploads/icons" "$DATA_DIR/uploads/backgrounds"

npx prisma migrate deploy
npx prisma db seed

exec npm start
