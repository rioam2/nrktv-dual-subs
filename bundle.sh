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
    "icon16.png" \
    "icon48.png" \
    "icon128.png" \
    "LICENSE"