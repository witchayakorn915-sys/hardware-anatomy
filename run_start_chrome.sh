#!/bin/sh -f

echo "..Start.."

open -a "Google Chrome" http://localhost:8000/

echo "..Run..Open..."

python -m http.server
