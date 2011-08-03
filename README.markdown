#Can You Read It Now?
##JQuery plug-in for analyzing visual readability of text on the Web

Can You Read It Now (or CYRIN) provides the numerical basis for implementing features related to the visual readability (not the reading comprehension level) of text on the web. CYRIN powers the [bookmarklet of the same name](http://canyoureaditnow.com/).

##How it works
This plug-in takes the set of target elements and evaulates each separately for visual readability. As each child element is evaluated, it is weighted by its character count against its siblings. This makes summation of elements straightforward and some metrics translate into scores more easily than would otherwise be possible.

##Using CYRIN

* [Development version](https://github.com/kevingorski/CanYouReadItNow/raw/master/deployable/CYRIN.dev.js)
* [Production (minified) version](https://github.com/kevingorski/CanYouReadItNow/raw/master/deployable/CYRIN.min.js)

###License
As stated in the LICENSE file, Can You Read It Now is released under the [MIT License](http://www.opensource.org/licenses/mit-license) meaning that:

* Contributions are welcome
* Use it anywhere you want (commercial or non-commercial projects)
* Modify it if you please
* You don't have to give changes you make to the canonical repository, but that'd be swell

##Future plans / welcome contributions
The metrics and scores output by CYRIN are usually pretty reasonable, but:

* The performance could be improved
* There are more aspects to visual readability than are currently represented
* Existing aspects of visual readability could use further refinement
* Test coverage is mediocre

##Contributing
Contributions are readily accepted with good example specs and changes to fulfill them.

* Install [UglifyJS](https://github.com/mishoo/UglifyJS) for minification
* Make sure to load the SpecRunner page in at least one browser before considering any changes complete.
* Running the build script will update the development and minified versions in /deployable