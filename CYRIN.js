// Analyze target DOM element for visual readability in the context of the current page.
(function($){
	var constants = {
			BACKGROUND_COLOR : 'Background Color',
			BACKGROUND_IMAGE : 'Background Image',
			BLOCK_ELEMENT : 'Block Element',
			CHARACTERS_PER_LINE : 'Characters Per Line',
			EFFECTIVE_MARGIN_AND_PADDING : 'Effective Margin &amp; Padding',
			FONT_FAMILIES : 'Font Families',
			FONT_SIZE : 'Font Size',
			JUSTIFICATION : 'Justification',
			KERNING : 'Kerning',
			LINE_LEADING : 'Line Leading',
			LINE_LENGTH : 'Line Length',
			MARGIN : 'Margin',
			MARGIN_AND_PADDING : 'Margin &amp; Padding',
			PADDING : 'Padding',
			PERCENTAGE_OF_TEXT_STYLIZED : 'Percentage of Text Stylized',
			STYLIZED_TEXT : 'Stylized Text',
			TEXT_COLOR : 'Text Color',
			TEXT_COLOR_CONTRAST : 'Text Color Contrast',
			TEXT_LENGTH : 'Text Length'
		},
		descriptions = {};

	descriptions[constants.FONT_SIZE] = 'A good default font size will keep the user from having to adjust it manually, which may cause problems with your design.';
	descriptions[constants.JUSTIFICATION] = 'If you\'re not left-justifying your text, you\'re probably doing it wrong.';
	descriptions[constants.LINE_LENGTH] = 'When line length of text gets too long, it makes text harder to read. [WCAG SC 1.4.8]';
	descriptions[constants.TEXT_COLOR_CONTRAST] = 'The contrast ratio between the text color and the background color needs to be greater the smaller the text is [WCAG 1.4.6]';
	descriptions[constants.LINE_LEADING] = 'The space between each line of text should be large enough to make visual separation of lines easy without creating an awkward amount of space [WCAG SC 1.4.8]';
	descriptions[constants.MARGIN_AND_PADDING] = 'Creating visual space on the left and right of text will make it easier to visually separate from the rest of the page';
	descriptions[constants.PERCENTAGE_OF_TEXT_STYLIZED] = 'Bold, italicized, and all caps text should be kept to a minimum';

	function roundToTenth(value) {
		return Math.round(value * 10) / 10;
	}
	
	
	// TextTreeNode definition
	function TextTreeNode(DOMNode, textTreeChildren, textChildren) {
		this.DOMNode = DOMNode;
		this.textTreeChildren = textTreeChildren;
		this.textChildren = textChildren;

		this.metrics = [];
	}

	TextTreeNode.prototype.addMetric = function(name, value) {
		this.metrics.push({
			name : name,
			value : value
		});

		return this;
	}

	TextTreeNode.prototype.getMetric = function(name) {
		var metricArray = $.grep(this.metrics, function(item) { return item.name === name; });
		
		return metricArray && metricArray.length ? metricArray[0].value : false;
	}

	TextTreeNode.prototype.updateMetric = function(name, value) {
		var metric = $.grep(this.metrics, function(item) { return item.name === name; })[0];

		metric.value = value;
	}
	
	
	// Analysis definition
	function Analysis(textTree) {
		this.textTree = textTree;

		this.score = 0;
		this.aggregateScore = 0;
		this.totalPossible = 0;
		this.totalCharacterCount = 0;
		this.metrics = textTree ? textTree.metrics : [];
		this.scores = [];
		this.aggregateScores = [];
		this.suggestions = [];
		this.children = [];

		// Set a default score for everything so that it can be rolled up into this root analysis
		if(!textTree)
			this.addScore(constants.FONT_SIZE, 0)
				.addScore(constants.JUSTIFICATION, 0)
				.addScore(constants.TEXT_COLOR_CONTRAST, 0)
				.addScore(constants.LINE_LEADING, 0)
				.addScore(constants.LINE_LENGTH, 0)
				.addScore(constants.PERCENTAGE_OF_TEXT_STYLIZED, 0)
				.addScore(constants.MARGIN_AND_PADDING, 0);
	}

	Analysis.prototype.addMetric = function(name, value) {
		this.metrics.push({
			name : name,
			value : value
		});

		return this;
	}

	Analysis.prototype.addScore = function(name, value) {
		this.scores.push({
			name : name,
			value : value,
			description : descriptions[name]
		});

		this.score += value;
		this.totalPossible += 10;

		return this;
	}

	Analysis.prototype.getAggregateScore = function(name) {
		return $.grep(this.aggregateScores, function(item) { return item.name === name; })[0].value;
	}

	Analysis.prototype.hasAggregateScore = function(name) {
		return !!($.grep(this.aggregateScores, function(item) { return item.name === name; }).length);
	}

	Analysis.prototype.addToAggregate = function(name, value) {
		$.grep(
			this.aggregateScores, 
			function(item) { return item.name === name; })[0].value += value;
	}

	Analysis.prototype.addSuggestion = function(message, basedOnScore) {
		this.suggestions.push({
			message : message,
			priority : 10 - basedOnScore
		});
	}

	Analysis.prototype.addChild = function(child) {
		this.children.push(child);
	}

	Analysis.prototype.sort = function() {
		var compareNames = function(first, second) {
			return first.name > second.name;
		};

		this.scores.sort(compareNames);
		this.aggregateScores.sort(compareNames);
		this.metrics.sort(compareNames);
	}
	
	Analysis.prototype.applyToAll = function(fn) {
		fn(this);
		
		if(!this.children.length) return;
		
		for (var i = this.children.length - 1; i >= 0; i--){
			this.children[i].applyToAll(fn);
		};
	}
	
	Analysis.prototype.getMetric = function(name) {
		var metric = jQuery.grep(this.metrics, function(item) { return item.name === name; })[0];

		return metric.value;
	}
	
	Analysis.prototype.getScore = function(name) {
		var score = jQuery.grep(this.scores, function(item) { return item.name === name; })[0];

		return score.value;
	}
	
	Analysis.prototype.getAggregateScore = function(name) {
		var score = jQuery.grep(this.aggregateScores, function(item) { return item.name === name; })[0];
		
		return score.value;
	}

	Analysis.prototype.rollUp = function() {
		var self = this;
		
		if(this.children && this.children.length) {
			var currentAnalysis = this,
				directCharacterCount = this.textTree ? this.textTree.getMetric(constants.TEXT_LENGTH) : 0;

			currentAnalysis.totalCharacterCount = directCharacterCount;

			$.each(this.children, function() {
				currentAnalysis.totalCharacterCount += this.rollUp();
			});

			if(currentAnalysis.totalCharacterCount > 0) {
				// Copy the direct content scores over to a new array
				currentAnalysis.aggregateScores = $.map(
					currentAnalysis.scores,
					function(item) {
						return { 
							name: item.name, 
							value : item.value * directCharacterCount / currentAnalysis.totalCharacterCount,
							description : item.description
						}
					}
				);
			}

			// Add all of the scores together, then divide by the total count
			$.each(this.children, function() {
				var child = this,
					weight = child.totalCharacterCount / currentAnalysis.totalCharacterCount;

				// Combine scores of children and self
				$.each(
					currentAnalysis.aggregateScores,
					function() {
						// Here 'this' is the currentAnalysis' aggregate score

						// If this score is a sparse aggregate it gets the same score as the direct content of the current analysis
						var scoreSource = child.hasAggregateScore(this.name)
							? child
							: currentAnalysis;

						currentAnalysis.addToAggregate(
							this.name,
							(scoreSource.getAggregateScore(this.name) || 0) * weight);
					});
			});

			$.each(
				this.aggregateScores, 
				function() { 
					currentAnalysis.aggregateScore += this.value; 
					this.value = roundToTenth(this.value);
				});

			currentAnalysis.aggregateScore = roundToTenth(currentAnalysis.aggregateScore);

		} else {
			this.totalCharacterCount = this.textTree.getMetric(constants.TEXT_LENGTH);
			this.aggregateScores = this.scores;
			this.aggregateScore = this.score;
		}
		
		this.sort();

		return this.totalCharacterCount;
	}
	
	
	// Inner plug-in definition
    $.CYRIN = function(el, options){
        var base = this,
			dpi;

        // Access to jQuery and DOM versions of element
        base.el = el;

		$.CYRIN.defaultOptions.context = document.body;

        base.init = function(){
            base.options = $.extend({}, $.CYRIN.defaultOptions, options);
        };

		base.findDPI = function () {
			if(dpi) return dpi;

			var scale = $('<div />', {
				css: {
					position: 'absolute',
					width: '1in'
				}
			}).appendTo(document.body);

			dpi = scale.width();

			scale.remove();

			return dpi;
		};

        base.init();
    };

    $.CYRIN.defaultOptions = {};
	$.extend($.CYRIN, constants);
	$.CYRIN.version = '0.1.0';


    $.fn.CYRIN = function(radius, options){
		var plugin = (new $.CYRIN(this, options));

		function getPixelsFromFontSize(fontSize) {
			// jQuery will always return in pixels
			return parseFloat(/(\d*\.*\d*)/.exec(fontSize)[0]);
		};

		function getPointsFromFontSize(fontSize) {
			var dpi = plugin.findDPI(),
				fontSizeInPixels = getPixelsFromFontSize(fontSize),
				pixelsPerPoint = dpi / 72.0;

			return fontSizeInPixels / pixelsPerPoint;
		};

		function isContentBold(target) {
			return (target.css('font-weight') + '').match(/^bold.*|[7-9]00/) || target[0].nodeName.match(/strong/i);
		};

		function getTextWidth(target) {
			var elementWidth = target.width(),
				columnCount;

			if((columnCount = target.css('column-count') || target.css('-webkit-column-count') || target.css('-moz-column-count'))
				!== 'auto' && columnCount > 1)
			{
				var columnGap = getPixelsFromFontSize(
					target.css('column-gap') ||
					target.css('-webkit-column-gap') ||
					target.css('-moz-column-gap'));

				return (elementWidth - ((columnCount - 1) * columnGap))/columnCount;
			}

			return elementWidth;
		};

		function standardizeColor(stringColor) {
			if(!stringColor) return false;

			function RGBToHex(RGB){
				RGB = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)/i.exec(RGB);

				if(!RGB
					// Transparent!
					|| (RGB.length === 5 && Number(RGB[4]) === 0)) return false;

				var R = Number(RGB[1]).toString(16),
					G = Number(RGB[2]).toString(16),
					B = Number(RGB[3]).toString(16);

				if(R.length < 2) R = '0' + R;
				if(G.length < 2) G = '0' + G;
				if(B.length < 2) B = '0' + B;

				return "#" + R + G + B;
			};

			function colorNameToHex(color){
			    var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
			    "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
			    "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
			    "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
			    "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
			    "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
			    "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
			    "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
			    "honeydew":"#f0fff0","hotpink":"#ff69b4",
			    "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
			    "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
			    "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
			    "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
			    "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
			    "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
			    "navajowhite":"#ffdead","navy":"#000080",
			    "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
			    "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
			    "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
			    "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
			    "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
			    "violet":"#ee82ee",
			    "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
			    "yellow":"#ffff00","yellowgreen":"#9acd32"};

			    if (typeof colors[color.toLowerCase()] != 'undefined')
			        return colors[color.toLowerCase()];

			    return false;
			};

			return (stringColor.charAt(0) == '#') 
				? stringColor
				: stringColor.match(/rgb/i)
					? RGBToHex(stringColor)
					: colorNameToHex(stringColor);
		};

		function calculateContrastRatio(backgroundColor, textColor) {
			if(!(backgroundColor && textColor)) return false;

			function calculateLuminosity(color) {
				var linR = Math.pow(parseInt(color.substr(1,2), 16)/255.0, 2.2),
					linG = Math.pow(parseInt(color.substr(3,2), 16)/255.0, 2.2),
					linB = Math.pow(parseInt(color.substr(5,2), 16)/255.0, 2.2);

				return .2126 * linR + .7152 * linG + .0722 * linB;
			};

			var backgroundLuminosity = calculateLuminosity(backgroundColor),
				textLuminosity = calculateLuminosity(textColor),
				L1, L2;

			L1 = (backgroundLuminosity > textLuminosity)
				? backgroundLuminosity
				: textLuminosity;
			L2 = (backgroundLuminosity > textLuminosity)
				? textLuminosity
				: backgroundLuminosity;

			return (L1+.05) / (L2+.05);
		};


		function buildTextTree(target) {
			// target will be a jQuery set
			// parent will be a TextTreeNode
			var node = target[0],
				childNodes = node.childNodes,
				childTextTreeNodes = [],
				childTextNodes = [];

			// Node.TEXT_NODE, not available in IE
			if(node.nodeType === 3)
				return new TextTreeNode(node);
			
			$.each(childNodes, function() {
				// No comments or images will be dealt with, thank you
				if(this.nodeType === 8 
					|| this.nodeName.match(/IMG|BR|SCRIPT|STYLE/))
					return;

				if(this.nodeType === 3) {
					// Ignore all white-space text nodes
					if(this.nodeValue.match(/^\s+$/)) return;

					childTextNodes.push(this);

					return;
				}

				childTextTreeNodes.push(buildTextTree($(this)));
			});

			return new TextTreeNode(node, childTextTreeNodes, childTextNodes);
		};

		function decorateTreeWithMeasurements(textTreeNode, defaultBackgroundColor, parentTreeNode) {
			var target = $(textTreeNode.DOMNode),
				backgroundColor = standardizeColor(target.css('background-color')) || defaultBackgroundColor;

			if(textTreeNode.textChildren) {
				var textLength = 0,
					clone = target.clone(),

					blockElement = !!(target.css('display').match(/block/i)),
					fontSize,
					lineHeight = target.css('line-height'),
					lineLength,
					margin,
					marginAndPadding,
					padding,
					textColor;

				// Attach absolute metrics to this node with respect to its direct content
				$.each(textTreeNode.textChildren, function() {
					textLength += this.nodeValue.length;
				});

				textTreeNode
					.addMetric(constants.BACKGROUND_COLOR,	backgroundColor)
					.addMetric(constants.BACKGROUND_IMAGE,	target.css('background-image'))
					.addMetric(constants.BLOCK_ELEMENT,		blockElement)
					.addMetric(constants.FONT_FAMILIES,		target.css('font-family'))
					.addMetric(constants.FONT_SIZE,			fontSize = target.css('font-size'))
					.addMetric(constants.JUSTIFICATION,		target.css('text-align'))
					.addMetric(constants.KERNING,			target.css('letter-spacing'))
					.addMetric(constants.LINE_LEADING,
						(lineHeight === 'normal' || lineHeight.length === 0)
							? fontSize
							: lineHeight)
					.addMetric(constants.LINE_LENGTH,		lineLength = roundToTenth(getTextWidth(target)))
					.addMetric(constants.MARGIN,			margin = target.css('margin-left') || 0)
					.addMetric(constants.PADDING,			padding = target.css('padding-left') || 0)
					.addMetric(constants.STYLIZED_TEXT,
						isContentBold(target)
							|| target.css('font-style') === 'italic'
							|| target.css('font-variant') === 'small-caps')
					.addMetric(constants.TEXT_COLOR,		textColor = standardizeColor(target.css('color')))
					.addMetric(constants.TEXT_COLOR_CONTRAST,
						roundToTenth(calculateContrastRatio(backgroundColor, textColor)))
					.addMetric(constants.TEXT_LENGTH,		textLength);

				// If the margin is 'auto', will need special handling to find the spacing
				if(margin === 'auto' && blockElement) {
					margin = (target.outerWidth(true) - target.outerWidth())/2;
				}
				
				textTreeNode
					.addMetric(constants.MARGIN_AND_PADDING,
						marginAndPadding = getPixelsFromFontSize(margin) + getPixelsFromFontSize(padding))

				// If the parent appearas contiguous with this element,
				// add it's effective M&P to the current M&P
				textTreeNode.addMetric(constants.EFFECTIVE_MARGIN_AND_PADDING,
					(parentTreeNode
						&& backgroundColor === parentTreeNode.getMetric(constants.BACKGROUND_COLOR))
						? marginAndPadding + (parentTreeNode.getMetric(constants.EFFECTIVE_MARGIN_AND_PADDING) || 0)
						: marginAndPadding);
				
				clone.html('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz&nbsp;');
				clone.css({
						display : 'inline',
						width : 'auto'
					}).insertBefore(target);

				textTreeNode.addMetric(constants.CHARACTERS_PER_LINE, lineLength / (clone.width() / 53));

				clone.remove();
			}
			
			if(backgroundColor) defaultBackgroundColor = backgroundColor;

			if(textTreeNode.textTreeChildren)
				$.each(textTreeNode.textTreeChildren, function() {
					decorateTreeWithMeasurements(this, defaultBackgroundColor, textTreeNode);
				});
		};

		function analyzeFontSize(textTreeNode, analysis) {
			var key = constants.FONT_SIZE,
				fontSizeInPoints = getPointsFromFontSize(textTreeNode.getMetric(key)),
				offsetFromIdeal = 12 - fontSizeInPoints,
				score = offsetFromIdeal < 0
					? 10
					: Math.max(10 - offsetFromIdeal * 2, 0);

			analysis.addScore(key, roundToTenth(score));
		};

		function analyzeJustification(textTreeNode, analysis) {
			var key = constants.JUSTIFICATION;

			analysis.addScore(key,
				textTreeNode.getMetric(key).match(/left|start|\-webkit\-auto/) ? 10 : 0);
		};

		function analyzeColorContrast(textTreeNode, analysis) {
			// 1.4.6 Contrast (Enhanced)
			var colorContrastRatio = textTreeNode.getMetric(constants.TEXT_COLOR_CONTRAST),
				fontSize = textTreeNode.getMetric(constants.FONT_SIZE),
				score;

			// For "normal" text, 7 is considered excellent
			// For "large scale text," (at least 18 point or 14 point bold), 4.5 is excellent
			score = Math.floor(colorContrastRatio * 
				(fontSize >= getPointsFromFontSize(18)
					|| (fontSize >= getPointsFromFontSize(14) && isContentBold(target)) 
					? .45 : .7));

			analysis.addScore(
				constants.TEXT_COLOR_CONTRAST,
				Math.min(10, score));
		};

		function analyzeLeading(textTreeNode, analysis) {
			// Visual Presentation SC 1.4.8
			var key = constants.LINE_LEADING,
				lineHeight = textTreeNode.getMetric(key),
				fontSize = textTreeNode.getMetric(constants.FONT_SIZE),
				fontSizeInPixels = getPixelsFromFontSize(fontSize),
				idealLeading = Math.ceil(fontSizeInPixels * 1.5),
				idealOffset = idealLeading - getPixelsFromFontSize(lineHeight),
				lineLeadingScore = Math.min(10 * (1 - (Math.abs(idealOffset) / fontSizeInPixels)), 10);

			analysis.addScore(key, roundToTenth(lineLeadingScore));
		};

		function analyzeStylizedText(textTreeNode, analysis) {
			analysis.addScore(
				constants.PERCENTAGE_OF_TEXT_STYLIZED,
				textTreeNode.getMetric(constants.STYLIZED_TEXT) ? 0 : 10);
		};

		function analyzeLineLength(textTreeNode, analysis) {
			if(!textTreeNode.getMetric(constants.BLOCK_ELEMENT)) return;

			// Visual Presentation SC 1.4.8
			var charactersPerLine = textTreeNode.getMetric(constants.CHARACTERS_PER_LINE),
				offsetFromIdealCPL = charactersPerLine - 80,
				absOffset = Math.abs(offsetFromIdealCPL),
				score = (offsetFromIdealCPL > 0)
					? Math.max((10 - Math.round(absOffset / 5)), 0)
					: Math.min(Math.max((10 - Math.round((absOffset - 10) / 10)), 0), 10);

			analysis.addScore(constants.LINE_LENGTH, roundToTenth(score));
		};

		function analyzeMarginAndPadding(textTreeNode, analysis) {
			if(!textTreeNode.getMetric(constants.BLOCK_ELEMENT)) return;

			// What we're really interested in here is separation between the text and 
			// the next visual element, so if the background is similar enough to appear
			// contiguous, then we can include that spacing with this element

			var marginAndPadding = textTreeNode.getMetric(constants.EFFECTIVE_MARGIN_AND_PADDING),
				fontSize = textTreeNode.getMetric(constants.FONT_SIZE),
				fontSizeInPixels = getPixelsFromFontSize(fontSize),
				score = Math.min(10, 10 * marginAndPadding / fontSizeInPixels);

			analysis.addScore(constants.MARGIN_AND_PADDING, score);
		};

		function analyzeTextTree(textTree, parentNode) {
			var analysis = new Analysis(textTree);

			if(!textTree.getMetric(constants.BACKGROUND_COLOR))
				textTree.updateMetric(
					constants.BACKGROUND_COLOR,
					parentNode.getMetric(constants.BACKGROUND_COLOR));

			if(textTree.textChildren && textTree.textChildren.length) {
				analyzeFontSize(textTree, analysis);
				analyzeJustification(textTree, analysis);
				analyzeColorContrast(textTree, analysis);
				analyzeLeading(textTree, analysis);
				analyzeStylizedText(textTree, analysis);
				analyzeLineLength(textTree, analysis);
				analyzeMarginAndPadding(textTree, analysis);
			} else {
				// Adding a 0 score when the text length is 0 doesn't effect aggregates
				// and makes rolling scores up easier later
				analysis
					.addScore(constants.FONT_SIZE, 0)
					.addScore(constants.JUSTIFICATION, 0)
					.addScore(constants.TEXT_COLOR_CONTRAST, 0)
					.addScore(constants.LINE_LEADING, 0)
					.addScore(constants.LINE_LENGTH, 0)
					.addScore(constants.PERCENTAGE_OF_TEXT_STYLIZED, 0)
					.addScore(constants.MARGIN_AND_PADDING, 0);
			}

			if(textTree.textTreeChildren)
				$.each(textTree.textTreeChildren, function() {
					analysis.addChild(analyzeTextTree(this, textTree));
				});

			return analysis;
		}		

		if(!(plugin.el && plugin.el.length)) return 'Provide a target to analyze.';

		// Non-intuitive work-around for jQuery/FireFox error from jQuery.contains() with a jQuery object (http://bugs.jquery.com/ticket/7297)
		if($(plugin.el, plugin.options.context).size() == 0) return 'Target doesn\'t appear to be in the DOM.';

		var overallScore = 0,
			totalPossible = 0,
			textTree,
			defaultBackgroundColor,
			rootAnalysis = new Analysis();

		plugin.el.each(function() {
			var currentTarget = $(this),
				parentTextTreeNode = new TextTreeNode(),
				rootParent,
				effectiveMarginAndPadding = 0;

			textTree = buildTextTree(currentTarget);

			if(!(defaultBackgroundColor = standardizeColor(currentTarget.css('background-color')))) {
				// Find a background color on a parent node, or white by default
				var backgroundTarget = currentTarget;
			
				while(backgroundTarget 
					&& backgroundTarget[0] !== document
					&& !(defaultBackgroundColor = standardizeColor(backgroundTarget.css('background-color')))){
					backgroundTarget = backgroundTarget.parent();
				}

				// In this specific case transparent/rgba(0,0,0,0) probably means white
				defaultBackgroundColor = standardizeColor(defaultBackgroundColor) || '#ffffff';
			}

			rootParent = currentTarget.parent();

			while(rootParent[0].nodeType != 9 // DOCUMENT_NODE
			 	&& rootParent.css('display') === 'block') {

				var margin = rootParent.css('margin-left') || 0;

				effectiveMarginAndPadding += getPixelsFromFontSize(rootParent.css('padding-left') || 0);

				if(margin === 'auto')
					margin = (rootParent.outerWidth(true) - rootParent.outerWidth()) / 2;

				effectiveMarginAndPadding += getPixelsFromFontSize(margin);

				rootParent = rootParent.parent();
			}

			// Making a dummy node to provide Effective Margin & Padding
			parentTextTreeNode.addMetric(constants.BACKGROUND_COLOR, defaultBackgroundColor);
			parentTextTreeNode.addMetric(constants.EFFECTIVE_MARGIN_AND_PADDING, effectiveMarginAndPadding);

			decorateTreeWithMeasurements(textTree, defaultBackgroundColor, parentTextTreeNode);

			rootAnalysis.addChild(analyzeTextTree(textTree));
		});

		rootAnalysis.rollUp();

		return rootAnalysis;
    };

})(jQuery);