#!/bin/bash
rm deployable/CYRIN.dev.js
echo "Combining JavaScript"
cat lib/Array.filter.js lib/color-0.3.0.js CYRIN.TextTreeNode.js CYRIN.Analysis.js CYRIN.js >> deployable/CYRIN.dev.js
echo "Compressing JavaScript"
uglifyjs --no-copyright --unsafe --max-line-len 500 --output deployable/CYRIN.min.js deployable/CYRIN.dev.js
echo "Adding minified files"
git add deployable/CYRIN.min.js deployable/CYRIN.dev.js