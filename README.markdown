#Can You Read It Now?
##JQuery plug-in for analyzing visual readability of text on the Web

Can You Read It Now (or CYRIN, pronounced like siren) provides the numerical basis for implementing features related to the visual readability (not the reading comprehension level) of text on the web.

##What it provides
Right now, there are only seven scores taken from eighteen metrics:

* Font Size
* Justification
* Line Leading
* Line Length
* Margin & Padding
* Percentage of Text Stylized
* Text Color Contrast

##Possible uses
This type of analytics could be used for
* Tools that suggest visual readability improvements (forthcoming CYRIN Bookmarklet)
* Tools that update the CSS for a specific page or Web site (like [StyleBot](http://stylebot.me/) or [GreaseMonkey](http://www.greasespot.net/))

##Actual uses
* None yet, but that CYRIN Bookmarklet is on the cusp.

##How it works
Ths plug-in takes the set of target elements and evaulates each separately for visual readability, taking any parent elements into account. As each child element is evaluated, it is weighted by its character count against all of the other children of its parent. This makes summation of elements straightforward and some metrics translate into scores more easily than would otherwise be possible.

##Future plans / welcome contributions
As far as I know, the metrics and scores output by CYRIN are pretty reasonable, but:
* The performance could be improved
* There are more aspects to visual readability than are currently represented
* Existing aspects of visual readability could use further refinement

##Inspiration
* [Self-testing pages with JavaScript](http://24ways.org/2009/self-testing-pages-with-javascript)
* [Readability](http://www.readability.com)

##Contributing
Contributions are readily accepted with good example specs and changes to fulfill them.

* To minifiy the core library JavaScript, place the YUI minifier JAR at /usr/local/bin/ and run the minify.sh BASH script before commiting.

##License
As stated in the LICENSE file, Can You Read It Now is released under the [MIT License](http://www.opensource.org/licenses/mit-license) meaning that:

* Contributions are welcome
* Use it anywhere you want (commercial or non-commercial projects)
* Modify it if you please
* You don't have to give changes you make to the canonical repository, but that'd be swell