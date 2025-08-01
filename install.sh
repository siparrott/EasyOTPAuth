#!/usr/bin/env bash
set -e
GIT_REPO="https://github.com/yourorg/passwordless-auth.git"
if [ -d passwordless-auth ]; then
  echo "Directory passwordless-auth already exists" >&2
  exit 1
fi

git clone "$GIT_REPO" passwordless-auth
cd passwordless-auth
cp .env.example .env
read -p "SMTP host: " SMTP_HOST
read -p "SMTP port [587]: " SMTP_PORT
read -p "SMTP user: " SMTP_USER
read -s -p "SMTP password: " SMTP_PASS
echo
read -p "JWT secret: " JWT_SECRET
cat >> .env <<EOF
SMTP_HOST=$SMTP_HOST
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
JWT_SECRET=$JWT_SECRET
EOF
docker compose pull
docker compose up -d
echo "✅  Your login page is live at http://$(hostname -I | awk '{print $1}')/"
