#!/bin/sh
set -eu

envsubst '${YANDEX_MAPS_API_KEY}' \
  < /usr/share/nginx/html/config.js.template \
  > /usr/share/nginx/html/config.js
