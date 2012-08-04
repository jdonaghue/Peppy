/**
	http://www.w3.org/TR/css3-selectors/#selectors
 
 	Pattern					Meaning	
	E						an element of type E	
	E[foo]					an E element with a "foo" attribute	
	E[foo="bar"]			an E element whose "foo" attribute value is exactly equal to "bar"	
	E[foo~="bar"]			an E element whose "foo" attribute value is a list of whitespace-separated values, one of which is exactly equal to "bar"	
	E[foo^="bar"]			an E element whose "foo" attribute value begins exactly with the string "bar"
	E[foo$="bar"]			an E element whose "foo" attribute value ends exactly with the string "bar"	
	E[foo*="bar"]			an E element whose "foo" attribute value contains the substring "bar"	
	E[foo|="en"]			an E element whose "foo" attribute has a hyphen-separated list of values beginning (from the left) with "en"
	E:root					an E element, root of the document	
	E:nth-child(n)			an E element, the n-th child of its parent	
	E:nth-last-child(n)		an E element, the n-th child of its parent, counting from the last one	
	E:nth-of-type(n)		an E element, the n-th sibling of its type	
	E:nth-last-of-type(n)	an E element, the n-th sibling of its type, counting from the last one	
	E:first-child			an E element, first child of its parent	
	E:last-child			an E element, last child of its parent	
	E:first-of-type			an E element, first sibling of its type	
	E:last-of-type			an E element, last sibling of its type	
	E:only-child			an E element, only child of its parent	
	E:only-of-type			an E element, only sibling of its type	
	E:empty					an E element that has no children (including text nodes)	
	E:link
	E:visited				an E element being the source anchor of a hyperlink of which the target is not yet visited (:link) or already visited (:visited)	
	E:active
	E:hover
	E:focus					an E element during certain user actions	
	E:target				an E element being the target of the referring URI	
	E:lang(fr)				an element of type E in language "fr" (the document language specifies how language is determined)	
	E:enabled
	E:disabled				a user interface element E which is enabled or disabled	
	E:checked				a user interface element E which is checked (for instance a radio-button or checkbox)	
	E::first-line			the first formatted line of an E element	
	E::first-letter			the first formatted letter of an E element	
	E::before				generated content before an E element	
	E::after				generated content after an E element	
	E.warning				an E element whose class is "warning" (the document language specifies how class is determined).	
	E#myid					an E element with ID equal to "myid".	
	E:not(s)				an E element that does not match simple selector s	
	E F						an F element descendant of an E element	
	E > F					an F element child of an E element	
	E + F					an F element immediately preceded by an E element	
	E ~ F					an F element preceded by an E element	
**/
(function() {
	
﻿

	var _LL = {
		UNIV: 0,
		TYPE: 1,
		ID: 2,
		CLS: 3,
		ATTR: 4,
		COMB: 5,
		PSEL: 6,
		PSCLS: 7,
		NOT: 8,
		CONT: 9,
		NTH: 10
	};

	var	_COMBINATORS = {
			'+': 0,
			'>': 1,
			'~': 2,
			' ': 3
		};

	function error(message, ch) {
		if (console && console.log) {
			console.error('error: ' + message + ' char: ' + ch);
		}
	}

	function nextNonSpace(selector, start) {
		for (var i = start; i < selector.length; i++) {
			if (selector[i] != ' ' && selector[i] != '\n' && selector[i] != '\r' && selector[i] != '\t') {
				return i-1;
			}
		}
		return selector.length - 1;
	}

	function parseAttribute(start, selector, obj) {
		obj.left = '';
		obj.right = '';
		obj.op

		for (var i = start; i < selector.length; i++) {
			var c = selector[i];
			
			if (c == ']') {
				return i;
			}

			if (obj.op.indexOf('=') == -1) {
				if (c in {'+':0, '~': 1, '=': 2, '$': 3, '|': 4, '^': 5, '*': 6}) {
					obj.op += c;
				}
				else if (c != ' ' && c!= '\n' && c != '\r' && c != '\t') {
					obj.left += c;
				}
			}
			else if (c != ' ' && c!= '\n' && c != '\r' && c != '\t') {
				obj.right += c;
			}
		}
		error('invalid attribute', start);
		return selector.length - 1;
	}

	function parseRecursivePseudo(start, selector, obj) {
		obj.value = '';

		var paranthCount = 1;	

		for (var i = start; i < selector.length; i++) {
			var c = selector[i];

			if (c == '(') {
				paranthCount++;
			}
			
			if (c == ')') {
				if (--paranthCount == 0) {
					obj.value = lexer(obj.value);
					return i;
				}
			}

			obj.value += c;
		}
		error('invalid attribute', start);
		return selector.length - 1;
	}

	function parseNth(start, selector, obj) {
		obj.value = '';

		for (var i = start; i < selector.length; i++) {
			var c = selector[i];
			
			if (c == ')') {
				return i;
			}

			obj.value += c;
		}
		error('invalid attribute', start);
		return selector.length - 1;
	}

	_LL.lex = function lexer(selector) {
		var groups = [],
			selectorStack = [];

		for (var i = 0, len = selector.length; i < len; i++) {
			var character = selector[i],
				characterAhead = selector[i + 1],
				lastInStack = selectorStack[selectorStack.length-1];


			if (character == ',') {
				// GROUP
				groups.push(selectorStack.slice(0));
				selectorStack = [];
				i = nextNonSpace(selector, i+1);
			}
			else if (character in _COMBINATORS 
				&& characterAhead != '='
				&& (lastInStack.type != _LL.PSCLS 
					|| lastInStack.value.indexOf('nth-child') == -1 
					|| lastInStack.value[lastInStack.value.length-1] == ')')) {

				// COMBINATOR
				if (!lastInStack || lastInStack.type != _LL.COMB) {
					i = nextNonSpace(selector, i+1);

					if (selector[i+1] in _COMBINATORS) {
						character = selector[i+1];
						i = nextNonSpace(selector, i+2);
					}
					selectorStack.push({
						type: _LL.COMB,
						value: character
					});					
				}
			}
			else {
				// SELECTOR
				var type;
				if (selectorStack.length == 0 
					|| lastInStack.type == _LL.COMB
					|| character in { '[':0, '.':1, '#':2, '*':3 }
					|| (character == ':'
						&& selector[i-1] != ':')) {

					switch(character) {
						case '*' : {
							type = _LL.UNIV;
							break;
						}
						case '.' : {
							type = _LL.CLS;
							break;
						}
						case '#': {
							type = _LL.ID;
							break;
						}
						case ':': {
							if (selector[i+1] == ':') {
								type = _LL.PSEL;
							}
							else {
								if (selector.substr(i + 1, 3) == 'not') {
									character = {
										value: '',
										op: 'NOT'
									}
									i = parseRecursivePseudo(i+5, selector, character)
									type = _LL.NOT;
								}
								else if (selector.substr(i + 1, 8) == 'contains') {
									character = {
										value: '',
										op: 'CONTAINS'
									}
									i = parseRecursivePseudo(i+10, selector, character);
									type = _LL.CONT;
								}
								else if (selector.substr(i +1, 3) == 'nth') {
									character= {
										value: '',
										op: 'NTH'
									}
									i = parseNth(i+11, selector, character);
									type = _LL.NTH;
								}
								else {
									type = _LL.PSCLS;
								}
							}

							if (selector[i+2] == ':') {
								error('invalid pseudo class', i+2);
							}
							break;
						}
						case '[': {
							type = _LL.ATTR;
							character = {
								left: '',
								right: '', 
								op: ''
							}
							i = parseAttribute(i+1, selector, character);
							
							break;
						}
						default: {
							type = _LL.TYPE;
							break;
						}
					}
					selectorStack.push({
						type: type,
						value: character
					});
				}
				else {
					lastInStack.value += character;
				}
			}
		}

		groups.push(selectorStack.slice(0));
		return groups;
	}
	
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
}());