	
	var _doc = document,
		_win = window;

	_win.peppy = {
		query: function(selector, context, opts) {
			var tree = _LL.lex(selector),
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

			if (opts.testContext && context.nodeType == 1) {
				results.push(context);
			}

			for (var stIndex = 0, stLength = selectorTree.length; stIndex < stLength; stIndex++) {
				var selectorData = selectorTree[stIndex];
				
				switch(selectorData.type) {
					case _LL.ID : {
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
					case _LL.UNIV:
					case _LL.TYPE: {
						if (opts.useType || results.length != 0) {
							if (results.length == 0) {
								results = _getAllDescendants(context);
							}
							var tmpType = [];
							for (var index = 0, len = results.length; index < len; index++) {
								if (selectorData.type == _LL.UNIV || results[index].nodeName.toUpperCase() == selectorData.value.toUpperCase()) {
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
					case _LL.CLS: {
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
					case _LL.COMB: {
						switch(selectorData.value) {
							case ' ': {
								var tmpCombDesc = [];
								for (var index = 0, len = results.length; index < len; index++) {
									tmpCombDesc = tmpCombDesc.concat(_getAllDescendants(results[index]));
								}
								results = tmpCombDesc;
								tmpCombDesc = undefined;
								break;
							}
							case '+': {
								var tmpCombNext = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var nextEl = results[index].nextSibling;
									do {
										if (nextEl.nodeType == 1) {
											break;
										}
									}
									while((nextEl = nextEl.nextSibling));
									if (nextEl) {
										tmpCombNext.push(nextEl);
									}
								}
								results = tmpCombNext;
								break;
							}
							case '~': {
								var tmpCombNextAll = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var nextEl = results[index].nextSibling;
									do {
										if (nextEl.nodeType == 1) {
											tmpCombNextAll.push(nextEl);	
										}
									}
									while((nextEl = nextEl.nextSibling));
								}
								results = tmpCombNextAll;
								break;
							}
							case '>': {
								var tmpCombChild = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var nextEl = results[index].childNodes[0];
									while(nextEl) {
										if (nextEl.nodeType == 1) {
											tmpCombChild.push(nextEl);	
										}
										nextEl = nextEl.nextSibling;
									}
									
								}
								results = tmpCombChild;
								break;
							}
						}
						break;
					}
					case _LL.ATTR: {
						switch(selectorData.value.op) {
							case '': {
								var tmpAttrExist = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (el.getAttribute(selectorData.value.left)) {
										tmpAttrExist.push(el);
									}
								}
								results = tmpAttrExist;
								break;
							}
							case '=': {
								var tmpAttrEq = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (el.getAttribute(selectorData.value.left) == selectorData.value.right) {
										tmpAttrEq.push(el);
									}
								}
								results = tmpAttrEq;
								break;
							}
							case '~=': {
								var tmpAttrListEq = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										attr = el.getAttribute(selectorData.value.left);

									if (attr) {
										var attrList = attr.split(/\s+/);
										for(var attrListIndex = 0, attrListLen = attrList.length; attrListIndex < attrListLen; attrListIndex++) {
											if (attrList[attrListIndex] == selectorData.value.right) {
												tmpAttrListEq.push(el);
												break;
											}
										}
									}
								}
								results = tmpAttrListEq;
								break;
							}
							case '^=': {
								var tmpAttrBegins = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										attr = el.getAttribute(selectorData.value.left);

									if (attr && attr.indexOf(selectorData.value.right) == 0) {
										tmpAttrBegins.push(el);
									}
								}
								results = tmpAttrBegins;
								break;
							}
							case '$=': {
								var tmpAttrEnds = [],
									attrRE = new RegExp(selectorData.value.right + '$');

								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];

									if (attrRE.test(el.getAttribute(selectorData.value.left))) {
										tmpAttrEnds.push(el);
									}
								}
								results = tmpAttrEnds;
								break;
							}
							case '*=': {
								var tmpAttrContains = [],
									attrRE = new RegExp(selectorData.value.right + '$');

								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										attrRE = new RegExp('.*' + selectorData.value.right + '.*');

									if (attrRE.test(el.getAttribute(selectorData.value.left))) {
										tmpAttrContains.push(el);
									}
								}
								results = tmpAttrContains;
								break;
							}
							case '|=': {
								var tmpAttrHyphenListBegin = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										attr = el.getAttribute(selectorData.value.left);

									if (attr) {
										var attrList = attr.split('-');
										if (attrList.length > 1 && attrList[0] == selectorData.value.right) {
											tmpAttrHyphenListBegin.push(el);
										}
									}
								}
								results = tmpAttrHyphenListBegin;
								break;
							}
						}
						break;
					}
					case _LL.PSCLS: {
						switch(selectorData.value) {
							case ':first-child': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										prev = el.previousSibling,
										found = false;

									while(prev) {
										if (prev.nodeType == 1) {
											found = true;
										}
										prev = prev.previousSibling;
									}
									if (!found) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':last-child': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										next = el.nextSibling,
										found = false;

									while(next) {
										if (next.nodeType == 1) {
											found = true;
										}
										next = next.nextSibling;
									}
									if (!found) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':first-of-type': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										prev = el.previousSibling,
										nodeName = el.nodeName,
										found = false;

									while(prev) {
										if (prev.nodeType == 1 && prev.nodeName == nodeName) {
											found = true;
										}
										prev = prev.previousSibling;
									}
									if (!found) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':last-of-type': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										next = el.nextSibling,
										nodeName = el.nodeName,
										found = false;

									while(next) {
										if (next.nodeType == 1 && next.nodeName == nodeName) {
											found = true;
										}
										next = next.nextSibling;
									}
									if (!found) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':only-child': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										next = el.parentNode.childNodes[0],
										count = 0;

									while(next) {
										if (next.nodeType == 1) {
											count++;
										}
										next = next.nextSibling;
									}
									if (count == 1) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':only-of-type': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										next = el.parentNode.childNodes[0],
										nodeName = el.nodeName,
										count = 0;

									while(next) {
										if (next.nodeType == 1 && next.nodeName == nodeName) {
											count++;
										}
										next = next.nextSibling;
									}
									if (count == 1) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':empty': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (el.childNodes.length == 0) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':enabled': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (!el.getAttribute('disabled')) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':disabled': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (el.getAttribute('disabled')) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':checked': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (el.getAttribute('checked')) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':hidden': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (el.type == 'hidden' || el.style.display == 'none') {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':visible': {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (el.type != 'hidden' || el.style.display != 'none') {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
						}
						break;
					}
					case _LL.NTH: {
						if (selectorData.value.toLowerCase() == 'odd') {
							selectorData.value = '2n+1';
						}
						else if (selectorData.value.toLowerCase() == 'even') {
							selectorData.value = '2n';
						}

						var tmpNth = [],
							nthParts = selectorData.value.split('n'),
							a = nthParts[0] || 0,
							b = nthParts[1] || 0;

						for (var index = 0, len = results.length; index < len; index++) {
							var el = results[index],
								next = el.parentNode.childNodes[0],
								nodeName = el.nodeName,
								count = 1,
								elsIndex = 1;

							while(next) {
								if (next.nodeType == 1) {
									if (next == el) {
										elsIndex = count;
									}
									count++;
								}
								next = next.nextSibling;
							}

							// form an+b:
							// handle index based and n+1, n-1, etc cases here:
							if (!isNaN(selectorData.value) || a == 0) {
								if (!isNaN(selectorData.value)) {
							 		if (elsIndex == selectorData.value) {
										tmpNth.push(el);
									}
								}
								else {
									var op = b[0],
										bPos = b.substr(1);

									if (op == '-') {
										if (elsIndex == count - bPos) {
											tmpNth.push(el);
										}
									}
									else {
										if (elsIndex == bPos) {
											tmpNth.push(el);
										}
									}
								} 
							} 
							// handle full an+b, an-b, even, odd cases here:
							else if (a == 0 ? elsIndex == b :
                               a > 0 ? elsIndex >= b && (elsIndex - b) % a == 0 :
                                         elsIndex <= b && (elsIndex + b) % a == 0) {
								tmpNth.push(el);
							}
						}
						results = tmpNth;
						break;
					}
					case _LL.NOT: {
						var tmpNot = [],
							origTestContext = opts.testContext;

							opts.testContext = true;

						for (var index = 0, len = results.length; index < len; index++) {
							var el = results[index];

							if (this.querySelector(selectorData.value[0], el, opts).length == 0) {
								tmpNot.push(el);
							}
						}
						opts.testContext = origTestContext;
						results = tmpNot;
						break;
					}
					case _LL.CONT: {
						var tmpCont = [];
						for (var index = 0, len = results.length; index < len; index++) {
							var el = results[index];

							if (this.querySelector(selectorData.value[0], el, opts).length > 0) {
								tmpCont.push(el);
							}
						}
						results = tmpCont;
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