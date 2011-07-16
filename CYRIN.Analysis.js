if(typeof CYRIN == 'undefined') var CYRIN = {};

if(typeof CYRIN.Analysis == 'undefined') {

	CYRIN.Analysis = function (textTreeNode) {
		this.score = 0;
		this.aggregateScore = 0;
		this.totalPossible = 0;
		this.totalCharacterCount = 0;
		this.metrics = textTreeNode ? textTreeNode.metrics : [];
		this.scores = [];
		this.aggregateScores = [];
		this.suggestions = [];
		this.children = [];

		// Set a default score for everything so that it can be rolled up into this root analysis
		if(!textTreeNode)
			this.addScore(jQuery.CYRIN.FONT_SIZE, 0)
				.addScore(jQuery.CYRIN.JUSTIFICATION, 0)
				.addScore(jQuery.CYRIN.TEXT_COLOR_CONTRAST, 0)
				.addScore(jQuery.CYRIN.LINE_LEADING, 0)
				.addScore(jQuery.CYRIN.LINE_LENGTH, 0)
				.addScore(jQuery.CYRIN.PERCENTAGE_OF_TEXT_STYLIZED, 0)
				.addScore(jQuery.CYRIN.MARGIN_AND_PADDING, 0);
	}

	CYRIN.Analysis.prototype.addMetric = function(name, value) {
		this.metrics.push({
			name : name,
			value : value
		});

		return this;
	}

	CYRIN.Analysis.prototype.addScore = function(name, value) {
		this.scores.push({
			name : name,
			value : value,
			description : name.description
		});

		this.score += value;
		this.totalPossible += 10;

		return this;
	}

	CYRIN.Analysis.prototype.getAggregateScore = function(name) {
		return jQuery.grep(this.aggregateScores, function(item) { return item.name === name; })[0].value;
	}

	CYRIN.Analysis.prototype.hasAggregateScore = function(name) {
		return !!(jQuery.grep(this.aggregateScores, function(item) { return item.name === name; }).length);
	}

	CYRIN.Analysis.prototype.addToAggregate = function(name, value) {
		jQuery.grep(
			this.aggregateScores, 
			function(item) { return item.name === name; })[0].value += value;
	}

	CYRIN.Analysis.prototype.addSuggestion = function(message, basedOnScore) {
		this.suggestions.push({
			message : message,
			priority : 10 - basedOnScore
		});
	}

	CYRIN.Analysis.prototype.addChild = function(child) {
		this.children.push(child);
	}

	CYRIN.Analysis.prototype.sort = function() {
		var compareNames = function(first, second) {
			return first.name > second.name;
		};

		this.scores.sort(compareNames);
		this.aggregateScores.sort(compareNames);
		this.metrics.sort(compareNames);
	}

	CYRIN.Analysis.prototype.applyToAll = function(fn) {
		fn(this);
	
		if(!this.children.length) return;
	
		for (var i = this.children.length - 1; i >= 0; i--){
			this.children[i].applyToAll(fn);
		};
	}

	CYRIN.Analysis.prototype.getMetric = function(name) {
		var metricArray = jQuery.grep(this.metrics, function(item) { return item.name === name; });
	
		return metricArray && metricArray.length ? metricArray[0].value : false;
	
	}

	CYRIN.Analysis.prototype.getScore = function(name) {
		var score = jQuery.grep(this.scores, function(item) { return item.name === name; })[0];

		return score.value;
	}

	CYRIN.Analysis.prototype.getAggregateScore = function(name) {
		var score = jQuery.grep(this.aggregateScores, function(item) { return item.name === name; })[0];
	
		return score.value;
	}

	CYRIN.Analysis.prototype.rollUp = function() {
	
		function roundToTenth(value) {
			return Math.round(value * 10) / 10;
		}
	
		if(this.children && this.children.length) {
			var currentAnalysis = this,
				directCharacterCount = this.getMetric(jQuery.CYRIN.TEXT_LENGTH);

			currentAnalysis.totalCharacterCount = directCharacterCount;

			jQuery.each(this.children, function() {
				currentAnalysis.totalCharacterCount += this.rollUp();
			});

			if(currentAnalysis.totalCharacterCount > 0) {
				// Copy the direct content scores over to a new array
				currentAnalysis.aggregateScores = jQuery.map(
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
			jQuery.each(this.children, function() {
				var child = this,
					weight = child.totalCharacterCount / currentAnalysis.totalCharacterCount;

				// Combine scores of children and self
				jQuery.each(
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

			jQuery.each(
				this.aggregateScores, 
				function() { 
					currentAnalysis.aggregateScore += this.value; 
					this.value = roundToTenth(this.value);
				});

			currentAnalysis.aggregateScore = roundToTenth(currentAnalysis.aggregateScore);

		} else {
			this.totalCharacterCount = this.getMetric(jQuery.CYRIN.TEXT_LENGTH);
			this.aggregateScores = this.scores;
			this.aggregateScore = this.score;
		}
	
		this.sort();

		return this.totalCharacterCount;
	}
}