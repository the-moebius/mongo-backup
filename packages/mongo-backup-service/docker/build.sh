#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPT_PATH="$(dirname "$0")"
ROOT_PATH="${SCRIPT_PATH}/.."

IMAGE_NAME="mongo-backup"

# Building docker-image locally
docker build \
  --file "${ROOT_PATH}/docker/Dockerfile" \
  --tag "${IMAGE_NAME}:latest" \
  "${ROOT_PATH}/"
