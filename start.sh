#!/usr/bin/env bash

SCRIPT_DIR=$(realpath $(dirname "$0"))

cd "${SCRIPT_DIR}"
npm run start
