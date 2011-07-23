#!/bin/bash
cp deployable/CYRIN.dev.js ../
git checkout gh-pages
mv ../CYRIN.dev.js js/libs
git add js/libs/CYRIN.dev.js