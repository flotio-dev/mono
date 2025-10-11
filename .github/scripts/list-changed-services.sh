#!/bin/bash

# Script to list changed services from CHANGED_FILES env var
# CHANGED_FILES is space-separated list of changed files

if [ -z "$CHANGED_FILES" ]; then
  echo "[]"  # No changes
  exit 0
fi

dirs=$(echo "$CHANGED_FILES" | tr ' ' '\n' | grep '/' | cut -d'/' -f1 | sort | uniq)

services=()
for dir in $dirs; do
  if [ -f "$dir/Dockerfile" ]; then
    services+=("$dir")
  fi
done

jq -n -c '$ARGS.positional' --args "${services[@]}"
