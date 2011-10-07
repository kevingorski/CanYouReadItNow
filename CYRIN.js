//
//	Can You Read It Now?
//		by Kevin Gorski
//		Analyze target DOM element for visual readability in the context of the current page.
// 
//	Dependencies
//		Color - https://github.com/harthur/color

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
		};

	function roundToTenth(value) {
		return Math.round(value * 10) / 10;
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

        base.init();
    };

    $.CYRIN.defaultOptions = {};
	$.extend($.CYRIN, constants);
	$.CYRIN.version = '0.2.1';
	$.CYRIN.findDPI = function () {
		if(this.dpi) return this.dpi;

		var scale = $('<div />', {
			css: {
				position: 'absolute',
				width: '1in'
			}
		}).appendTo(document.body);

		this.dpi = scale.width();

		scale.remove();

		return this.dpi;
	};


    $.fn.CYRIN = function(radius, options){
		var plugin = (new $.CYRIN(this, options));

		function getPixelsFromFontSize(fontSize) {
			// jQuery will always return in pixels
			return parseFloat(/(\d*\.*\d*)/.exec(fontSize)[0]);
		};

		function getPointsFromFontSize(fontSize) {
			var dpi = $.CYRIN.findDPI(),
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
			
			var color = Color(stringColor);
			
			if(color.alpha() === 0) return false;
			
			return color.hexString();
		};

		function calculateContrastRatio(backgroundColor, textColor) {
			if(!(backgroundColor && textColor)) return false;

			return Color(textColor).contrast(Color(backgroundColor));
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
				return new CYRIN.TextTreeNode(node);
			
			$.each(childNodes, function() {
				// No comments or other element types that don't display text
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

			return new CYRIN.TextTreeNode(node, childTextTreeNodes, childTextNodes);
		};

		function decorateTreeWithMeasurements(textTreeNode, defaultBackgroundColor, parentTreeNode) {
			var target = $(textTreeNode.DOMNode),
				backgroundColor = standardizeColor(target.css('background-color')) || defaultBackgroundColor;

			if(textTreeNode.textChildren) {
				var textLength = 0,
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

				// If the parent appears contiguous with this element,
				// add its effective M&P to the current M&P
				textTreeNode.addMetric(constants.EFFECTIVE_MARGIN_AND_PADDING,
					(parentTreeNode
						&& backgroundColor === parentTreeNode.getMetric(constants.BACKGROUND_COLOR))
						? marginAndPadding + (parentTreeNode.getMetric(constants.EFFECTIVE_MARGIN_AND_PADDING) || 0)
						: marginAndPadding);
				

				// Shorcut for small blocks of text to avoid costly DOM manipulation
				if(textLength < 80)
					textTreeNode.addMetric(constants.CHARACTERS_PER_LINE, 80);
				else {
					var clone = target.clone();

					clone.html('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz&nbsp;');
					clone.css({
							display : 'inline',
							width : 'auto'
						}).insertBefore(target);

					textTreeNode.addMetric(constants.CHARACTERS_PER_LINE, lineLength / (clone.width() / 53));

					clone.remove();
				}
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
			var analysis = new CYRIN.Analysis(textTree);

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
			
			textTree.releaseDOMNode();

			return analysis;
		}		

		if(!(plugin.el && plugin.el.length)) return 'Provide a target to analyze.';

		// Non-intuitive work-around for jQuery/FireFox error from jQuery.contains() with a jQuery object (http://bugs.jquery.com/ticket/7297)
		if($(plugin.el, plugin.options.context).size() == 0) return 'Target doesn\'t appear to be in the DOM.';

		var overallScore = 0,
			totalPossible = 0,
			textTree,
			defaultBackgroundColor,
			rootAnalysis = new CYRIN.Analysis();

		plugin.el.each(function() {
			var currentTarget = $(this),
				parentTextTreeNode = new CYRIN.TextTreeNode(),
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
				defaultBackgroundColor = standardizeColor(defaultBackgroundColor) || '#FFFFFF';
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