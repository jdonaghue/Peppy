	
	var _doc = doc,
		_win = global;

	_win.peppy = {

		query: function(selector, context, opts) {
			var tree = _LL.lex(selector),
				results = [];

			for(var groupIndex=0, groupLength=tree.length; groupIndex < groupLength; groupIndex++) {
				results = results.concat(this._querySelector(tree[groupIndex], context, opts));
			}

			results = _filterUnique(results);
			return results;
		},

		_querySelector: function(selectorTree, context, opts) {
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
						if (opts.useId || results.length != 0 || selectorData.value.indexOf('\\') > -1) {
							if (results.length == 0) {
								results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
							}
							var tmpId = [];
							for (var index=0, len=results.length; index < len; index++) {
								if (results[index].getAttribute('id') && results[index].getAttribute('id').toUpperCase() == selectorData.value.replace('#', '').replace(/\\/g, '').toUpperCase()) {
									tmpId.push(results[index]);
								}
							}
							results = tmpId;	
						}
						else {
							var tmpId = _doc.getElementById(selectorData.value.replace('#', ''));
							if (tmpId) {
								results.push(tmpId);
							}
						}
						break;
					}
					case _LL.UNIV :
					case _LL.TYPE : {
						if (opts.useType || results.length != 0) {
							if (results.length == 0) {
								results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
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
							var ndList = context.getElementsByTagName(selectorData.value);
							for (var index = 0, len = ndList.length; index < len; index++) {
								results.push(ndList[index]);
							}
						}
						break;
					}
					case _LL.CLS : {
						if (opts.useClass || results.length != 0 || !context.getElementsByTagName || selectorData.value.indexOf('\\') > -1) {
							if (results.length == 0) {
								results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
							}

							var tmpClass = [],
								classString = selectorData.value.replace('.', ''),
								classRE = new RegExp('(^|\\s)' + selectorData.value.replace('.', '') + '($|\\s)');

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
					case _LL.COMB : {
						switch(selectorData.value) {
							case ' ' : {
								var tmpCombDesc = [];
								for (var index = 0, len = results.length; index < len; index++) {
									tmpCombDesc = tmpCombDesc.concat(_getAllDescendants(results[index]));
								}
								results = tmpCombDesc;
								tmpCombDesc = undefined;
								break;
							}
							case '+' : {
								var tmpCombNext = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var nextEl = results[index].nextSibling;
									do {
										if (!nextEl || nextEl.nodeType == 1) {
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
							case '~' : {
								var tmpCombNextAll = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var nextEl = results[index].nextSibling;
									do {
										if (nextEl && nextEl.nodeType == 1) {
											tmpCombNextAll.push(nextEl);
										}
									}
									while((nextEl = nextEl.nextSibling));
								}
								results = tmpCombNextAll;
								break;
							}
							case '>' : {
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
					case _LL.ATTR : {
						switch(selectorData.value.op) {
							case '' : {
								if (results.length == 0) {
									results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
								}
								var tmpAttrExist = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (_getAttribute(el, selectorData.value.left) != undefined) {
										tmpAttrExist.push(el);
									}
								}
								results = tmpAttrExist;
								break;
							}
							case '=' : {
								if (results.length == 0) {
									results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
								}
								var tmpAttrEq = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (_getAttribute(el, selectorData.value.left) == selectorData.value.right) {
										tmpAttrEq.push(el);
									}
								}
								results = tmpAttrEq;
								break;
							}
							case '~=' : {
								if (results.length == 0) {
									results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
								}
								var tmpAttrListEq = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										attr = _getAttribute(el, selectorData.value.left);

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
							case '^=' : {
								if (results.length == 0) {
									results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
								}
								var tmpAttrBegins = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										attr = _getAttribute(el, selectorData.value.left);

									if (attr && attr.indexOf(selectorData.value.right) == 0) {
										tmpAttrBegins.push(el);
									}
								}
								results = tmpAttrBegins;
								break;
							}
							case '$=' : {
								if (results.length == 0) {
									results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
								}
								var tmpAttrEnds = [],
									attrRE = new RegExp(selectorData.value.right + '$');

								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];

									if (attrRE.test(_getAttribute(el, selectorData.value.left))) {
										tmpAttrEnds.push(el);
									}
								}
								results = tmpAttrEnds;
								break;
							}
							case '*=' : {
								if (results.length == 0) {
									results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
								}
								var tmpAttrContains = [],
									attrRE = new RegExp(selectorData.value.right + '$');

								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										attrRE = new RegExp('.*' + selectorData.value.right + '.*');

									if (attrRE.test(_getAttribute(el, selectorData.value.left))) {
										tmpAttrContains.push(el);
									}
								}
								results = tmpAttrContains;
								break;
							}
							case '|=' : {
								if (results.length == 0) {
									results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
								}
								var tmpAttrHyphenListBegin = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										attr = _getAttribute(el, selectorData.value.left);

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
					case _LL.PSCLS : {
						switch(selectorData.value) {
							case ':first-child' : {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										prev = el.previousSibling,
										found = false;

									while(prev) {
										if (prev.nodeType == 1) {
											found = true;
											break;
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
							case ':last-child' : {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										next = el.nextSibling,
										found = false;

									while(next) {
										if (next.nodeType == 1) {
											found = true;
											break;
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
							case ':first' :
							case ':first-of-type' : {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										prev = el.previousSibling,
										nodeName = el.nodeName,
										found = false;

									while(prev) {
										if (prev.nodeType == 1 && prev.nodeName == nodeName) {
											found = true;
											break;
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
							case ':last' :
							case ':last-of-type' : {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index],
										next = el.nextSibling,
										nodeName = el.nodeName,
										found = false;

									while(next) {
										if (next.nodeType == 1 && next.nodeName == nodeName) {
											found = true;
											break;
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
							case ':only-child' : {
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
							case ':only-of-type' : {
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
							case ':empty' : {
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
							case ':enabled' : {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (!_getAttribute(el, 'disabled')) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':disabled' : {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (_getAttribute(el, 'disabled')) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':checked' : {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if (_getAttribute(el, 'checked')) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':hidden' : {
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
							case ':visible' : {
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
							case ':selected' : {
								var tmpPS = [];
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									/*!
									 * Sizzle CSS Selector Engine v@VERSION
									 * http://sizzlejs.com/
									 *
									 * Copyright 2013 jQuery Foundation, Inc. and other contributors
									 * Released under the MIT license
									 * http://jquery.org/license
									 *
									 * Date: @DATE
									 */
									// Accessing this property makes selected-by-default
									// options in Safari work properly
									if ( el.parentNode ) {
										el.parentNode.selectedIndex;
									}

									if (el.selected === true) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
							case ':contains' : {
								var tmpPS = [],
									value = selectorData.content;
								for (var index = 0, len = results.length; index < len; index++) {
									var el = results[index];
									if ((el.textContent || el.innerText || '').indexOf( value ) > -1) {
										tmpPS.push(el);
									}
								}
								results = tmpPS;
								break;
							}
						}
						break;
					}
					case _LL.NTH : {
						if (selectorData.value.toLowerCase() == 'odd') {
							selectorData.value = '2n+1';
						}
						else if (selectorData.value.toLowerCase() == 'even') {
							selectorData.value = '2n';
						}

						var tmpNth = [],
							nthParts = selectorData.value.split('n'),
							a = nthParts[0] || 1,
							b = nthParts[1] || 0;

						if (a == '1' || a == '+1') {
							a = 1;
						}
						else if (a == '-' || a == '-1') {
							a = -1;
						}

						b = b * 1; // cast to number

						for (var index = 0, len = results.length; index < len; index++) {
							var el = results[index],
								next = el.parentNode.childNodes[0],
								nodeName = el.nodeName,
								count = 1,
								elPosition = 1;

							while(next) {
								if (next.nodeType == 1) {
									if (next == el) {
										elPosition = count;
									}
									count++;
								}
								next = next.nextSibling;
							}

							if (!isNaN(selectorData.value)) {
								if (elPosition == selectorData.value) {
									tmpNth.push(el);
								}
							}
							else {								
								for (var i=0; i<count; i++) {
									var num = a * i + b;
									if (elPosition == num) {
										tmpNth.push(el);
										break;
									}
								}
							}
						}
						results = tmpNth;
						break;
					}
					case _LL.NOT : {
						if (this.useStrict && !(selectorData.value[0][0].type in {0:0, 1:0, 2:0, 3:0, 4:0})) {
							// if strictly conforming to spec only allow simple selectors
							break;
						}
						var tmpNot = [],
							origTestContext = opts.testContext;

							opts.testContext = true;

						for (var index = 0, len = results.length; index < len; index++) {
							var el = results[index];

							if (this._querySelector(selectorData.value[0], el, opts).length == 0) {
								tmpNot.push(el);
							}
						}
						opts.testContext = origTestContext;
						results = tmpNot;
						break;
					}
					case _LL.HAS : {
						var tmpCont = [];
						for (var index = 0, len = results.length; index < len; index++) {
							var el = results[index];

							if (this._querySelector(selectorData.value[0], el, opts).length > 0) {
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

	function _filterUnique(results) {
		var unique = [];

		for (var i=0, iLen=results.length; i<iLen; i++) {
			var isUnique = true;

			for (var j=0, jLen=unique.length; j<jLen; j++) {
				if (unique[j] == results[i]) {
					isUnique = false;
				}
			}

			if (isUnique) {
				unique.push(results[i]);
			}
		}

		return unique;
	}

	function _getAttribute(el, attr) {
		return el.getAttribute(attr) || el.attributes[attr] ? el.attributes[attr].value : undefined;
	}

	function _getAllDescendants(context) {
		var results = [];

		if (!context) {
			context = _doc;
		}

		(function(context) {
			for (var i= 0, len= context.childNodes.length; i<len; i++) {
				var child= context.childNodes[i];
				
				if (child.nodeType == 1) {
					results.push(child);
					arguments.callee(child);
				}
			}
		}(context));

		return results;
	}