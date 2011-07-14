#!/bin/bash
echo "Compressing JavaScript"
cat lib/color-0.3.0.js CYRIN.js | java -jar /usr/local/bin/yuicompressor-2.4.2.jar --line-break 500 -o CYRIN.min.js --type js
echo "Adding minified files"
git add CYRIN.min.js