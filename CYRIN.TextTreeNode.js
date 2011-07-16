if(typeof CYRIN == 'undefined') CYRIN = {};

if(typeof CYRIN.TextTreeNode == 'undefined') {
	CYRIN.TextTreeNode = function(DOMNode, textTreeChildren, textChildren) {
		this.DOMNode = DOMNode;
		this.textTreeChildren = textTreeChildren;
		this.textChildren = textChildren;

		this.metrics = [];
	}

	CYRIN.TextTreeNode.prototype.addMetric = function(name, value) {
		this.metrics.push({
			name : name,
			value : value
		});

		return this;
	}

	CYRIN.TextTreeNode.prototype.getMetric = function(name) {
		var metricArray = $.grep(this.metrics, function(item) { return item.name === name; });
	
		return metricArray && metricArray.length ? metricArray[0].value : false;
	}

	CYRIN.TextTreeNode.prototype.updateMetric = function(name, value) {
		var metric = $.grep(this.metrics, function(item) { return item.name === name; })[0];

		metric.value = value;
	}

	CYRIN.TextTreeNode.prototype.releaseDOMNode = function() {
		this.DOMNode = null;
	}
}