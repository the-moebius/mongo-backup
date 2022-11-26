#!/usr/bin/env bash

set -e
set -o pipefail

IMAGE_NAME="mongo-backup"

docker run "${IMAGE_NAME}:latest"
