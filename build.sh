#!/bin/bash
echo "Combining JavaScript"
cat lib/color-0.3.0.js CYRIN.TextTreeNode.js CYRIN.Analysis.js CYRIN.js >> deployable/CYRIN.dev.js
echo "Compressing JavaScript"
java -jar /usr/local/bin/yuicompressor-2.4.2.jar --line-break 500 -o deployable/CYRIN.min.js --type js deployable/CYRIN.dev.js
echo "Adding minified files"
git add deployable/CYRIN.min.js