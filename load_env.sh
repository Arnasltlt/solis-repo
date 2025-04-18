#!/bin/bash

# Check if OPENAI_API_KEY is already set in environment
if [ -z "${OPENAI_API_KEY}" ]; then
  # Not set, try to load from .env file
  if [ -f .env ]; then
    echo "Loading OPENAI_API_KEY from .env file"
  else
    echo "Warning: OPENAI_API_KEY not set and no .env file found"
  fi
fi

# Load all environment variables from .env file
set -a
source .env
set +a

# Print confirmation
echo "Environment variables loaded from .env file"
if [ -n "${OPENAI_API_KEY}" ]; then
  echo "OPENAI_API_KEY=${OPENAI_API_KEY:0:5}... has been set"
else
  echo "Warning: OPENAI_API_KEY is not set"
fi

# Run the command passed as argument if any
if [ $# -gt 0 ]; then
    exec "$@"
fi 