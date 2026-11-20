#!/bin/sh -f

echo "..Start.."

open -a "Brave Browser" http://localhost:8000/

echo "..Run..Open..."

python -m http.server

