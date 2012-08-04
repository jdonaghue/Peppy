	
	var _doc = document,
		_win = window;

	_win.peppy = {
		query: function(selector, context, opts) {
			var tree = LL.lex(selector),
				results = [];

			for(var groupIndex=0, groupLength=tree.length; groupIndex < groupLength; groupIndex++) {
				results = results.concat(this.querySelector(tree[groupIndex], context, opts));
			}
			return results;
		},

		querySelector: function(selectorTree, context, opts) {
			var results = [],
				lastSelectorData;

			context = context || _doc;
			opts = opts || {};

			for (var stIndex = 0, stLength = selectorTree.length; stIndex < stLength; stIndex++) {
				var selectorData = selectorTree[stIndex];
				
				switch(selectorData.type) {
					case LL.ID : {
						if (opts.useId || results.length != 0) {
							var tmpId = [];
							for (var index=0, len=results.length; index < len; index++) {
								if (results[index].getAttribute('id') && results[index].getAttribute('id').toUpperCase() == selectorData.value.replace('#', '').toUpperCase()) {
									tmpId.push(results[index]);
								}
							}
							results = tmpId;	
						}
						else {
							results.push(_doc.getElementById(selectorData.value.replace('#', '')));
						}
						break;
					}
					case LL.UNIV:
					case LL.TYPE: {
						if (opts.useType || results.length != 0) {
							if (results.length == 0) {
								results = _getAllDescendants(context);
							}
							var tmpType = [];
							for (var index = 0, len = results.length; index < len; index++) {
								if (selectorData.type == LL.UNIV || results[index].nodeName == selectorData.value.toUpperCase()) {
									tmpType.push(results[index]);
								}
							}
							results = tmpType;
						}
						else {
							ndList = context.getElementsByTagName(selectorData.value);
							for (var index = 0, len = ndList.length; index < len; index++) {
								results.push(ndList[index]);
							}
						}
						break;
					}
					case LL.CLS: {
						if (opts.useClass || results.length != 0 || !context.getElementsByTagName) {
							if (results.length == 0) {
								results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
							}

							var tmpClass = [],
								classRE = new RegExp('(^|\s)' + selectorData.value.replace('.', '') + '($|\s)');

							for (var index = 0, len = results.length; index < len; index++) {
								if (classRE.test(results[index].className)) {
									tmpClass.push(results[index]);
								}
							}
							results = tmpClass;
						}
						else {
							var ndList = context.getElementsByClassName(selectorData.value.replace('.', ''));
							for(var index = 0, len = ndList.length; index < len; index++) {
								results.push(ndList[index]);
							}
						}
						break;
					}
					case LL.COMB: {
						switch(selectorData.value) {
							case ' ': {
								if (results.length == 0) {
									results = _getAllDescendants(context);
								}
								else {
									var tmpComb = [];
									for (var index = 0, len = results.length; index < len; index++) {
										tmpComb = tmpComb.concat(_getAllDescendants(results[index]));
									}
									results = tmpComb;
								}
								break;
							}
							case '+': {
								break;
							}
							case '~': {
								break;
							}
							case '>': {
								break;
							}
						}
						break;
					}
				}
				// if we didn't find anything no need to further filter
				if (results.length == 0) {
					break;
				}
				lastSelectorData = selectorData;
			}

			return results;
		}
	}

	function _getAllDescendants(context) {
		var results = [];

		if (context == _doc) {
			context = _doc;
		}

		(function(context) {
		    for (var i= 0, n= context.childNodes.length; i<n; i++) {
		        var child= context.childNodes[i];
		        
		        if (child.nodeType == 1) {
		        	results.push(child);
		            arguments.callee(child);
		        }
		    }
		}(context));

		return results;
	}