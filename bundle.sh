#!/usr/bin/env bash
set -e
pushd $(dirname "$0") > /dev/null

zip extension \
    "manifest.json" \
    "background.js" \
    "content.js" \
    "options.js" \
    "options.html" \
    "options.css" \
    "styles.css" \
    "LICENSE"