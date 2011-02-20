describe('CYRIN', function() {
	var context;
	
	beforeEach(function() {
		context = jQuery('#testTarget');
		
		this.addMatchers({
			toBeAString : function() { return typeof this.actual == 'string'; },
			toBeANumber : function() { return typeof this.actual == 'number'; }
		});
	});
	
	
	describe('Input Types', function() {	
		it('returns an error message when no target is supplied', function() {
			expect(jQuery().CYRIN()).toBeAString();
		});
			
		it('returns an error message when target is not a DOM element', function() {
			expect(jQuery('Text').CYRIN()).toBeAString();
		});
		
		it('returns an analysis result when target is a DOM element', function() {
			expect(jQuery(context[0]).CYRIN().score).toBeDefined();
		});
		
		it('returns an analysis result when target is a jQuery selector result', function() {
			expect(context.CYRIN().score).toBeDefined();
		});
		
		it('returns an analysis result with multiple children when target is a jQuery selector result with multiple items', function() {
			var target = jQuery('p');
			
			expect(target.CYRIN().children.length).toEqual(target.length);
		});
	});
	
	
	describe('Content Types', function() {
		it('returns an analysis result when target includes a HTML comment', function() {
			expect(jQuery('#TextWithComment').CYRIN().score).toBeDefined();
		});
	});
	
	describe('Metrics', function() {
		var getMetric = function(name, alternateSelector) {
			var actual = context.find(alternateSelector || "p:eq(1)").CYRIN()
				// The root analysis object won't have any metrics on it
				.children[0];
	
			expect(actual.metrics).toBeDefined();
	
			var metric = jQuery.grep(actual.metrics, 
				function(item) { return item.name === name; })[0];
	
			return metric.value;
		};
	
		it('returns the line-height', function() {
			expect(getMetric(jQuery.CYRIN.LINE_LEADING)).toEqual('27px');
		});
		
		it('return the text alignment', function() {
			expect(getMetric(jQuery.CYRIN.JUSTIFICATION)).toEqual('left');
		});
			
		it('returns the font size', function() {
			expect(getMetric(jQuery.CYRIN.FONT_SIZE)).toEqual('18px');
		});
			
		it('returns the text color', function() {
			expect(getMetric(jQuery.CYRIN.TEXT_COLOR)).toEqual('#000000');
		});
			
		it('returns a numeric value for line length', function() {
			expect(getMetric(jQuery.CYRIN.LINE_LENGTH)).toBeANumber();
		});
		
		it('returns the correct line length for multi-column text', function() {
			expect(getMetric(jQuery.CYRIN.LINE_LENGTH, 'p:eq(2)')).toEqual(Modernizr.csscolumns ? 293 : 600);
		});
			
		it('returns the kerning', function() {
			expect(getMetric(jQuery.CYRIN.KERNING)).toEqual('3px');
		});
			
		it('returns the background color', function() {
			expect(getMetric(jQuery.CYRIN.BACKGROUND_COLOR)).toEqual('#ffffff');
		});
			
		it('returns the background image name', function() {
			expect(getMetric(jQuery.CYRIN.BACKGROUND_IMAGE)).toMatch(/.*pixel\.gif/);
		});
			
		it('returns the margin', function() {
			expect(getMetric(jQuery.CYRIN.MARGIN)).toEqual('4px');
		});
			
		it('returns the padding', function() {
			expect(getMetric(jQuery.CYRIN.PADDING)).toEqual('2px');
		});
			
		it('returns the font families', function() {
			expect(getMetric(jQuery.CYRIN.FONT_FAMILIES)).toMatch(/Times New Roman/);
		});
			
		it('returns the text color contrast ratio', function() {
			expect(getMetric(jQuery.CYRIN.TEXT_COLOR_CONTRAST)).toEqual(21);
		});
		
		it('returns the strong tag is stylized', function() {
			expect(getMetric(jQuery.CYRIN.STYLIZED_TEXT, 'strong')).toBeTruthy();
		});
		
		it('returns an effective margin & padding that takes parent margin into account', function() {
			expect(getMetric(jQuery.CYRIN.EFFECTIVE_MARGIN_AND_PADDING, '#effectiveMPTarget p')).toEqual(28);
		});
	});
	
	
	describe('Scores', function() {
		var getScore = function(name, alternateSelector) {
			var actual = context.find(alternateSelector || "p:eq(1)").CYRIN();
	
			expect(actual.aggregateScores).toBeDefined();
	
			var score = jQuery.grep(actual.aggregateScores,
				function(item) { return item.name === name; })[0];
	
			return score.value;
		};
	
		it('scores 18px (approximately 12pt on some systems) text a 10', function() {
			expect(getScore(jQuery.CYRIN.FONT_SIZE)).toEqual(10);
		});
	
		it('scores 8pt text less than 10', function() {
			// Having an exact number here requires knowing the local screen DPI
			expect(getScore(jQuery.CYRIN.FONT_SIZE, 'p:eq(0)')).toBeLessThan(10);
		});
	
		it('scores left justification a 10', function() {
			expect(getScore(jQuery.CYRIN.JUSTIFICATION)).toEqual(10);
		});
		
		it('scores appropriate line leading a 10', function() {
			expect(getScore(jQuery.CYRIN.LINE_LEADING)).toEqual(10);
		});
		
		it('scores line leading equal to font-size a 5', function() {
			expect(getScore(jQuery.CYRIN.LINE_LEADING, '#PoorLineLeading')).toEqual(5);
		});
			
		it('scores 80 characters of text a 9.9', function() {
			expect(getScore(jQuery.CYRIN.LINE_LENGTH)).toEqual(9.9);
		});

		it('scores 14 pixel margin + padding for text 7.7', function() {
			expect(getScore(jQuery.CYRIN.MARGIN_AND_PADDING)).toEqual(7.7);
		});
	
		it('scores 11% of text stylized an 8.9', function() {
			expect(getScore(jQuery.CYRIN.PERCENTAGE_OF_TEXT_STYLIZED)).toEqual(8.9);
		});
	
		it('scores black text on a white background a 10', function() {
			expect(getScore(jQuery.CYRIN.TEXT_COLOR_CONTRAST)).toEqual(10);
		});	
	});
});