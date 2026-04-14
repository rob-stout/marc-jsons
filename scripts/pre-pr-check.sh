#!/bin/bash
# Pre-PR gate: run tests then build.
# Both must pass before opening a pull request.
set -e

echo "==> Running test suite..."
npm test

echo "==> Building plugin..."
npm run build

echo "==> All checks passed."
