// Source: dist/peppy.js
/**
 *	Peppy - A lightning fast CSS 3 Compliant selector engine.
 *	http://www.w3.org/TR/css3-selectors/#selectors
 *
 *	version 2.0.0-beta
 *
 *	Author: James Donaghue - james.donaghue@gmail.com
 *
 *	Copyright (c) 2008 James Donaghue (jamesdonaghue.com)
 *	Licenced under the FreeBSD (http://www.freebsd.org/copyright/freebsd-license.html) licence.
 *
 *	Pattern					Meaning	
 *	E						an element of type E	
 *	E[foo]					an E element with a "foo" attribute	
 *	E[foo="bar"]			an E element whose "foo" attribute value is exactly equal to "bar"	
 *	E[foo~="bar"]			an E element whose "foo" attribute value is a list of whitespace-separated values, one of which is exactly equal to "bar"	
 *	E[foo^="bar"]			an E element whose "foo" attribute value begins exactly with the string "bar"
 *	E[foo$="bar"]			an E element whose "foo" attribute value ends exactly with the string "bar"	
 *	E[foo*="bar"]			an E element whose "foo" attribute value contains the substring "bar"	
 *	E[foo|="en"]			an E element whose "foo" attribute has a hyphen-separated list of values beginning (from the left) with "en"
 *	E:nth-child(n)			an E element, the n-th child of its parent	
 *	E:first-child			an E element, first child of its parent	
 *	E:last-child			an E element, last child of its parent	
 *	E:first-of-type			an E element, first sibling of its type	
 *	E:last-of-type			an E element, last sibling of its type	
 *	E:only-child			an E element, only child of its parent	
 *	E:only-of-type			an E element, only sibling of its type	
 *	E:empty					an E element that has no children (including text nodes)		
 *	E:enabled
 *	E:disabled				a user interface element E which is enabled or disabled	
 *	E:checked				a user interface element E which is checked (for instance a radio-button or checkbox)	
 *	E::first-line			the first formatted line of an E element	
 *	E::first-letter			the first formatted letter of an E element	
 *	E::before				generated content before an E element	
 *	E::after				generated content after an E element	
 *	E.warning				an E element whose class is "warning" (the document language specifies how class is determined).	
 * 	E#myid					an E element with ID equal to "myid".	
 *	E:not(s)				an E element that does not match simple selector s	
 *	E F						an F element descendant of an E element	
 *	E > F					an F element child of an E element	
 *	E + F					an F element immediately preceded by an E element	
 *	E ~ F					an F element preceded by an E element	
 */
(function(global, doc) {

	
// Source: LLSelectorParser/LLparser.content.js


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
		HAS: 9,
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
		obj.op = '';

		var insideQuotes = false;

		for (var i = start; i < selector.length; i++) {
			var c = selector[i];

			if (!insideQuotes && c == ']') {
				return i;
			}

			if (c == '\'' || c == '"') {

				insideQuotes = !insideQuotes;
			}
			else {

				if (insideQuotes) {
					obj.right += c;
				}
				else if (obj.op.indexOf('=') == -1) {
					if (c in {'+':0, '~': 1, '=': 2, '$': 3, '|': 4, '^': 5, '*': 6}) {
						obj.op += c;
					}
					else if (c != ' ' && c!= '\n' && c != '\r' && c != '\t' && c != '\\') {
						obj.left += c;
					}
				}
				else if (c != ' ' && c!= '\n' && c != '\r' && c != '\t' && c != '\'' && c != '"') {
					obj.right += c;
				}
			}
		}
		error('invalid attribute', start);
		return selector.length - 1;
	}

	function parseRecursivePseudo(start, selector, obj, preventRecursiveLex) {
		obj.value = '';

		var paranthCount = 1;	

		for (var i = start; i < selector.length; i++) {
			var c = selector[i];

			if (c == '(') {
				paranthCount++;
			}
			
			if (c == ')') {
				if (--paranthCount == 0) {
					if (!preventRecursiveLex) {
						obj.value = _LL.lex(obj.value);
					}
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

		// first trim the selector
		selector = selector.replace(/(^\s+|\s+$)/g, '');

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
				&& selector[nextNonSpace(selector, i+1) + 1] != ','
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
				if ((selectorStack.length == 0 
					|| lastInStack.type == _LL.COMB
					|| lastInStack.type == _LL.ATTR
					|| character in { '[':0, '.':1, '#':2, '*':3, '\\':4 }
					|| (character == ':'
						&& selector[i-1] != ':'))
					&& character != '\\') {

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
									character = character.value;
									type = _LL.NOT;
								}
								else if (selector.substr(i + 1, 8) == 'contains') {
									character = {
										value: '',
										op: 'CONTAINS'
									}
									i = parseRecursivePseudo(i+10, selector, character, true);
									character = {
										value: ':contains',
										content: character.value.replace(/['"]/g, '')
									}
									type = _LL.PSCLS;
								}
								else if (selector.substr(i + 1, 3) == 'has') {
									character = {
										value: '',
										op: 'HAS'
									}
									i = parseRecursivePseudo(i+5, selector, character);
									character = character.value;
									type = _LL.HAS;
								}
								else if (selector.substr(i + 1, 4) == 'lang') {
									character = {
										value: '',
										op: 'LANG'
									}
									i = parseRecursivePseudo(i+6, selector, character, true);
									character = {
										value: ':lang',
										content: character.value.replace(/['"]/g, '')
									}
									type = _LL.PSCLS;
								}
								else if (selector.substr(i +1, 3) == 'nth') {
									var nth = selector.substr(i, selector.substr(i).indexOf('('));
									character = {
										value: '',
										op: 'NTH'
									};
									i = parseNth(i + nth.length + 1, selector, character);
									character = {
										value: nth,
										content: character.value
									};
									type = _LL.NTH;
								}
								else if (selector.substr(i +1, 2) == 'eq') {
									var eq = selector.substr(i, selector.substr(i).indexOf('('));
									character = {
										value: '',
										op: 'EQ'
									};
									i = parseNth(i + eq.length + 1, selector, character);
									character = {
										value: eq,
										content: character.value
									};
									type = _LL.PSCLS;
								}
								else if (selector.substr(i +1, 2) == 'lt') {
									var lt = selector.substr(i, selector.substr(i).indexOf('('));
									character = {
										value: '',
										op: 'LT'
									};
									i = parseNth(i + lt.length + 1, selector, character);
									character = {
										value: lt,
										content: (character.value || 0) * 1 - 1
									};
									type = _LL.PSCLS;
								}
								else if (selector.substr(i +1, 2) == 'gt') {
									var gt = selector.substr(i, selector.substr(i).indexOf('('));
									character = {
										value: '',
										op: 'GT'
									};
									i = parseNth(i + gt.length + 1, selector, character);
									character = {
										value: gt,
										content: (character.value || 0) * 1 + 1
									};
									type = _LL.PSCLS;
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
					if (character.content != undefined) {
						selectorStack.push({
							type: type,
							value: character.value != undefined ? character.value : character,
							content: character.content
						});
					}
					else {
						selectorStack.push({
							type: type,
							value: character
						});
					}
				}
				else {
					if (character == '\\') {
						i++;
						character = character + selector[i];
					}
					
					if (character != ' ' && character != '\n' && character != '\r' && character != '\t') {
						lastInStack.value += character;
					}
				}
			}
		}

		groups.push(selectorStack.slice(0));
		return groups;
	}

// Source: src/peppy.content.js

	/************************** HELPERS ****************************/

	/**
	 *
	 */
	function _sort(results) {

		results.sort(function(a, b) {
			if (a.compareDocumentPosition) {
				var compare = a.compareDocumentPosition(b);
				return compare & a.DOCUMENT_POSITION_FOLLOWING ? -1 : compare & a.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
			}
			else {
				var aParents = [a],
					aP = a, 
					bP = b;
				while((aP = aP.parentNode) != null) {
					aParents.push(aP);
				}
				var bCount = 0;
				do {
					for(var i=0,len=aParents.length; i<len;i++) {
						if (aParents[i] == bP) {	
							var position = bP == a ? 0 : bP == b ? 1 : _findFirstNode(bP, [a, b]);
							if (position == 0) {
								return -1;
							}
							else if (position == 1) {
								return 1;
							}
							else {
								return 0;
							}
						}
					}
					bCount++;
				} while((bP = bP.parentNode) != null);
			}
		});
		return results;
	}

	/**
	 *
	 */
	function _findFirstNode(parent, nodes) {

		for(var i=0, len=parent.childNodes.length; i<len; i++) {
			var node = parent.childNodes[i];

			for (var j=0, jLen=nodes.length; j<jLen; j++) {
				if (nodes[j] == node) {
					return j;
				}
			}
			
			var position = _findFirstNode(node, nodes);
			if (position > -1) {
				return position;
			}
		}
		return -1;
	}

	/**
	 *
	 */
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

	/**
	 *
	 */
	function _getAttribute(el, attr) {
		return el.getAttribute(attr) || el.attributes[attr] ? el.attributes[attr].value : undefined;
	}

	/**
	 *
	 */
	function _getAllDescendants(context) {

		var results = [];
		if (!context) {
			context = doc;
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

	var _internalAPI = {

		/**
		 *
		 */
		byId: function(selectorData, results, context, opts) {

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
				var tmpId = doc.getElementById(selectorData.value.replace('#', ''));
				if (tmpId) {
					results.push(tmpId);
				}
			}
			return results;
		},

		/**
		 *
		 */
		byType: function(selectorData, results, context, opts) {

			var types = selectorData.value.toUpperCase().split(','),
				typesHash = {};

			for(var t=0,tlen = types.length; t<tlen; t++) {
				var type = types[t].replace(/^\s+|\s+$/g, '');
				typesHash[type] = type;
			}

			if (opts.useType || results.length != 0 || types.length > 1) {
				if (results.length == 0) {
					results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
				}
				var tmpType = [];
				for (var index = 0, len = results.length; index < len; index++) {
					if (selectorData.type == _LL.UNIV || results[index].nodeName.toUpperCase() in typesHash) {
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
			return results;
		},

		/**
		 *
		 */
		byClass: function(selectorData, results, context, opts) {

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
			return results;
		},

		/**
		 *
		 */
		byDescendantComb: function(selectorData, results, context, opts) {

			var tmpCombDesc = [];
			for (var index = 0, len = results.length; index < len; index++) {
				tmpCombDesc = tmpCombDesc.concat(_getAllDescendants(results[index]));
			}
			results = tmpCombDesc;
			return results
		},

		/**
		 *
		 */
		byImmediatelyPrecedingComb: function(selectorData, results, context, opts) {

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
			return results;
		},

		/**
		 *
		 */
		byPrecedingComb: function(selectorData, results, context, opts) {

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
			return results;
		},

		/**
		 *
		 */
		byChildComb: function(selectorData, results, context, opts) {

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
			return results;
		},

		/**
		 *
		 */
		byAttributeName: function(selectorData, results, context, opts) {

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
			return results;
		},

		/**
		 *
		 */
		byAttributeEquals: function(selectorData, results, context, opts) {

			if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpAttrEq = [],
				attrRE = new RegExp('^' + selectorData.value.right.replace(/\\([0-9a-f]{2,2})/g, '\\x$1').replace(/(\[|\]|\{|\}|\-|\(|\)|\^|\$)/g, '\\$1') + '$');
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];
				if (attrRE.test(_getAttribute(el, selectorData.value.left))) {
					tmpAttrEq.push(el);
				}
			}
			results = tmpAttrEq;
			return results;
		},

		/**
		 *
		 */
		byAttributeInList: function(selectorData, results, context, opts) {

			if (/^\s*$/.test(selectorData.value.right)) {
				results = [];
			}
			else {
				if (results.length == 0) {
					results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
				}
				var tmpAttrListEq = [],
					attrRE = new RegExp('^' + selectorData.value.right.replace(/\\([0-9a-f]{2,2})/g, '\\x$1').replace(/(\[|\]|\{|\}|\-|\(|\)|\^|\$)/g, '\\$1') + '$');
				for (var index = 0, len = results.length; index < len; index++) {
					var el = results[index],
						attr = _getAttribute(el, selectorData.value.left);

					if (attr) {
						var attrList = attr.split(/\s+/);
						
						for(var attrListIndex = 0, attrListLen = attrList.length; attrListIndex < attrListLen; attrListIndex++) {
							if (attrRE.test(attrList[attrListIndex])) {
								tmpAttrListEq.push(el);
								break;
							}
						}
					}
				}
				results = tmpAttrListEq;
			}
			return results;
		},

		/**
		 *
		 */
		byAttributeBegin: function(selectorData, results, context, opts) {

			if (/^\s*$/.test(selectorData.value.right)) {
				results = [];
			}
			else {
				if (results.length == 0) {
					results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
				}
				var tmpAttrBegins = [],
					attrRE = new RegExp('^' + selectorData.value.right.replace(/\\([0-9a-f]{2,2})/g, '\\x$1').replace(/(\[|\]|\{|\}|\-|\(|\)|\^|\$)/g, '\\$1'));
				for (var index = 0, len = results.length; index < len; index++) {
					var el = results[index],
						attr = _getAttribute(el, selectorData.value.left);

					if (attrRE.test(attr)) {
						tmpAttrBegins.push(el);
					}
				}
				results = tmpAttrBegins;
			}
			return results;
		},

		/**
		 *
		 */
		byAttributeEnds: function(selectorData, results, context, opts) {

			if (/^\s*$/.test(selectorData.value.right)) {
				results = [];				
			}
			else {
				if (results.length == 0) {
					results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
				}
				var tmpAttrEnds = [],
					attrRE = new RegExp(selectorData.value.right.replace(/\\([0-9a-f]{2,2})/g, '\\x$1').replace(/(\[|\]|\{|\}|\-|\(|\)|\^|\$)/g, '\\$1') + '$');

				for (var index = 0, len = results.length; index < len; index++) {
					var el = results[index];

					if (attrRE.test(_getAttribute(el, selectorData.value.left))) {
						tmpAttrEnds.push(el);
					}
				}
				results = tmpAttrEnds;
			}
			return results;
		},

		/**
		 *
		 */
		byAttributeMiddle: function(selectorData, results, context, opts) {

			if (/^\s*$/.test(selectorData.value.right)) {
				results = [];				
			}
			else {
				if (results.length == 0) {
					results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
				}
				var tmpAttrContains = [],
					attrRE = new RegExp('.*' + selectorData.value.right.replace(/\\([0-9a-f]{2,2})/g, '\\x$1').replace(/(\[|\]|\{|\}|\-|\(|\)|\^|\$)/g, '\\$1') + '.*');

				for (var index = 0, len = results.length; index < len; index++) {
					var el = results[index];

					if (attrRE.test(_getAttribute(el, selectorData.value.left))) {
						tmpAttrContains.push(el);
					}
				}
				results = tmpAttrContains;
			}
			return results;
		},

		/**
		 *
		 */
		byAttributeHyphenList: function(selectorData, results, context, opts) {

			if (/^\s*$/.test(selectorData.value.right)) {
				results = [];
			}
			else {
				if (results.length == 0) {
					results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
				}
				var tmpAttrHyphenListBegin = [];
				for (var index = 0, len = results.length; index < len; index++) {
					var el = results[index],
						attr = _getAttribute(el, selectorData.value.left);

					if (attr) {
						var attrList = attr.split('-');
						if (attrList.length > 0 && attrList[0] == selectorData.value.right) {
							tmpAttrHyphenListBegin.push(el);
						}
					}
				}
				results = tmpAttrHyphenListBegin;
			}
			return results;
		},

		/**
		 *
		 */
	 	byFirstChild: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
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
			return results;
	 	},

	 	/**
		 *
		 */
	 	byLastChild: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
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
			return results;					
	 	},

	 	/**
		 *
		 */
	 	byFirstOfType: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
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
			return results;
	 	},

	 	/**
		 *
		 */
	 	byLastOfType: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
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
			return results;
	 	},

	 	/**
		 *
		 */
	 	byOnlyChild: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
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
			return results;
	 	},

	 	/**
		 *
		 */
	 	byOnlyOfType: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
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
			return results;
	 	},

	 	/**
		 *
		 */
	 	byEmpty: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpPS = [];
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];
				if (el.childNodes.length == 0) {
					tmpPS.push(el);
				}
				else {
					var c = el.childNodes[0],
						empty = true;
					do {
						if (c.nodeType == 1 || c.nodeType == 3 || c.nodeType == 4) {
							empty = false;
							break;
						}
					} while((c = c.nextSibling));

					if (empty) {
						tmpPS.push(el);
					}
				}
			}
			results = tmpPS;
			return results;
	 	},

	 	/**
		 *
		 */
	 	byEnabled: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpPS = [];
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];
				if (!_getAttribute(el, 'disabled')) {
					tmpPS.push(el);
				}
			}
			results = tmpPS;
			return results;
	 	},

	 	/**
		 *
		 */
	 	byDisabled: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpPS = [];
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];
				if (_getAttribute(el, 'disabled')) {
					tmpPS.push(el);
				}
			}
			results = tmpPS;
			return results;
	 	},

	 	/**
		 *
		 */
	 	byChecked: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpPS = [];
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];
				if (_getAttribute(el, 'checked')) {
					tmpPS.push(el);
				}
			}
			results = tmpPS;
			return results;
	 	},

	 	/**
		 *
		 */
	 	byHidden: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpPS = [];
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];
				if (el.type == 'hidden' || el.style.display == 'none') {
					tmpPS.push(el);
				}
			}
			results = tmpPS;
			return results;
	 	},

	 	/**
		 *
		 */
	 	byVisible: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpPS = [];
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];
				if (el.type != 'hidden' && el.style.display != 'none' && el.style.visibility != 'hidden') {
					tmpPS.push(el);
				}
			}
			results = tmpPS;
			return results;
	 	},

	 	/**
		 *
		 */
	 	bySelected: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
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
			return results;
	 	},

	 	/**
		 *
		 */
	 	byContains: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpPS = [],
				value = selectorData.content;
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];
				if ((el.textContent || el.innerText || '').indexOf( value ) > -1) {
					tmpPS.push(el);
				}
			}
			results = tmpPS;
			return results;
	 	},

	 	/**
		 *
		 */
	 	byLang: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpPS = [],
				value = selectorData.content;
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index],
					origEl = el;
				do {
					if ((el.lang || _getAttribute(el, 'xml:lang') || _getAttribute(el, 'lang') || '').indexOf( value ) > -1) {
						tmpPS.push(origEl);
						break;
					}
				} while ((el = el.parentNode));
			}
			results = tmpPS;
			return results;
	 	},

	 	/**
		 *
		 */
		byRoot: function(selectorData, results, context, opts) {

			if (results.length == 0) {
				results = [doc.documentElement];
			}
			else {
				results = [];
			}
			return results;
		},

	 	/**
		 *
		 */
	 	byNth: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}

			if (selectorData.content.toLowerCase() == 'odd') {
				selectorData.content = '2n+1';
			}
			else if (selectorData.content.toLowerCase() == 'even') {
				selectorData.content = '2n';
			}

			var tmpNth = [],
				nthParts = selectorData.content.split('n'),
				a = nthParts[0] || 1,
				b = nthParts[1] || 0;

			if (a == '1' || a == '+1') {
				a = 1;
			}
			else if (a == '-' || a == '-1') {
				a = -1;
			}

			b = b * 1; // cast to number

			var reverseDirection = selectorData.value.indexOf('last') > 0,
				ofType = selectorData.value.indexOf('type') > 0;

			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index],
					next =  reverseDirection ? el.parentNode.childNodes[el.parentNode.childNodes.length-1] : el.parentNode.childNodes[0],
					nodeName = el.nodeName,
					count = 1,
					elPosition = 1;

				while(next) {
					if (next.nodeType == 1 && (!ofType || next.nodeName == el.nodeName)) {
						if (next == el) {
							elPosition = count;
						}
						count++;
					}
					next = reverseDirection ? next.previousSibling : next.nextSibling;
				}

				if (!isNaN(selectorData.content)) {
					if (elPosition == selectorData.content) {
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
			return results;
	 	},

	 	/**
		 *
		 */
	 	byNot: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			// if strict mode make sure only simple selector
			if (peppy.useStrict && 
					(selectorData.value.length > 1 
						|| selectorData.value[0].length > 1 
						|| !(selectorData.value[0][0].type in {0:0, 1:0, 2:0, 3:0, 4:0, 7:0}))) {
				
				results = [];
				return results;
			}
			var tmpNot = [],
				origTestContext = opts.testContext;

				opts.testContext = true;

			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];

				if (peppy.query(selectorData.value, el, opts).length == 0) {
					tmpNot.push(el);
				}
			}
			opts.testContext = origTestContext;
			results = tmpNot;
			return results;
	 	},

	 	/**
		 *
		 */
	 	byHas: function(selectorData, results, context, opts) {

	 		if (results.length == 0) {
				results = context.all || context.getElementsByTagName('*') || _getAllDescendants(context);
			}
			var tmpCont = [];
			for (var index = 0, len = results.length; index < len; index++) {
				var el = results[index];

				if (peppy.query(selectorData.value, el, opts).length > 0) {
					tmpCont.push(el);
				}
			}
			results = tmpCont;
			return results;
	 	}
	};

	/************************** PUBLIC API *************************/

	global.peppy = {

		api: _internalAPI,

		/**
		 *
		 */
		query: function(selector, context, opts) {

			var isAST = Object.prototype.toString.call(selector) == '[object Array]',
				results = [];

			context = context || doc;

			if (!isAST && context.querySelectorAll) {
				var nl,
					skipQSA = false;

				try { nl = context.querySelectorAll(selector); } catch(e) { skipQSA = true; }

				if (!skipQSA) {
					results = Array.prototype.slice.call(nl);
					
					if (results instanceof NodeList) {
						results = [];
						for(var i=0,len=nl.length; i<len; i++) {
							results.push(nl[i]);
						}
					}

					return results;
				}
			}

			var tree = isAST ? selector : _LL.lex(selector);

			for(var groupIndex=0, groupLength=tree.length; groupIndex < groupLength; groupIndex++) {
				results = results.concat(this._querySelector(tree[groupIndex], context, opts));
			}

			if (groupLength > 1) {
				results = _sort(results);
			}

			results = _filterUnique(results);
			return results;
		},

		/**
		 *
		 */
		_querySelector: function(selectorTree, context, opts) {

			var results = [];

			context = context || doc;
			opts = opts || {};

			if (opts.testContext && context.nodeType == 1) {
				results.push(context);
			}

			for (var stIndex = 0, stLength = selectorTree.length; stIndex < stLength; stIndex++) {
				var selectorData = selectorTree[stIndex];
				
				switch(selectorData.type) {
					case _LL.ID : {
						results = this.api.byId(selectorData, results, context, opts);
						break;
					}
					case _LL.UNIV :
					case _LL.TYPE : {
						results = this.api.byType(selectorData, results, context, opts);
						break;
					}
					case _LL.CLS : {
						results = this.api.byClass(selectorData, results, context, opts);
						break;
					}
					case _LL.COMB : {
						switch(selectorData.value) {
							case ' ' : {
								results = this.api.byDescendantComb(selectorData, results, context, opts);
								break;
							}
							case '+' : {
								results = this.api.byImmediatelyPrecedingComb(selectorData, results, context, opts);
								break;
							}
							case '~' : {
								results = this.api.byPrecedingComb(selectorData, results, context, opts);
								break;
							}
							case '>' : {
								results = this.api.byChildComb(selectorData, results, context, opts);
								break;
							}
						}
						break;
					}
					case _LL.ATTR : {
						switch(selectorData.value.op) {
							case '' : {
								results = this.api.byAttributeName(selectorData, results, context, opts);
								break;
							}
							case '=' : {
								results = this.api.byAttributeEquals(selectorData, results, context, opts);
								break;
							}
							case '~=' : {
								results = this.api.byAttributeInList(selectorData, results, context, opts);
								break;
							}
							case '^=' : {
								results = this.api.byAttributeBegin(selectorData, results, context, opts);
								break;
							}
							case '$=' : {
								results = this.api.byAttributeEnds(selectorData, results, context, opts);
								break;
							}
							case '*=' : {
								results = this.api.byAttributeMiddle(selectorData, results, context, opts);
								break;
							}
							case '|=' : {
								results = this.api.byAttributeHyphenList(selectorData, results, context, opts);
								break;
							}
						}
						break;
					}
					case _LL.PSCLS : {
						switch(selectorData.value) {
							case ':first-child' : {
								results = this.api.byFirstChild(selectorData, results, context, opts);
								break;
							}
							case ':last-child' : {
								results = this.api.byLastChild(selectorData, results, context, opts);
								break;
							}
							case ':first' :
							case ':first-of-type' : {
								results = this.api.byFirstOfType(selectorData, results, context, opts);
								break;
							}
							case ':last' :
							case ':last-of-type' : {
								results = this.api.byLastOfType(selectorData, results, context, opts);
								break;
							}
							case ':only-child' : {
								results = this.api.byOnlyChild(selectorData, results, context, opts);
								break;
							}
							case ':only-of-type' : {
								results = this.api.byOnlyOfType(selectorData, results, context, opts);
								break;
							}
							case ':empty' : {
								results = this.api.byEmpty(selectorData, results, context, opts);
								break;
							}
							case ':enabled' : {
								results = this.api.byEnabled(selectorData, results, context, opts);
								break;
							}
							case ':disabled' : {
								results = this.api.byDisabled(selectorData, results, context, opts);
								break;
							}
							case ':checked' : {
								results = this.api.byChecked(selectorData, results, context, opts);
								break;
							}
							case ':hidden' : {
								results = this.api.byHidden(selectorData, results, context, opts);
								break;
							}
							case ':visible' : {
								results = this.api.byVisible(selectorData, results, context, opts);
								break;
							}
							case ':selected' : {
								results = this.api.bySelected(selectorData, results, context, opts);
								break;
							}
							case ':contains' : {
								results = this.api.byContains(selectorData, results, context, opts);
								break;
							}
							case ':lang' : {
								results = this.api.byLang(selectorData, results, context, opts);
								break;
							}
							case ':root' : {
								results = this.api.byRoot(selectorData, results, context, opts);
								break;
							}
							case ':even' : {
								results = this.api.byNth({
									content: 'even',
									value: ':nth-child'
								}, results, context, opts);
								break;
							}
							case ':odd' : {
								results = this.api.byNth({
									content: 'odd',
									value: ':nth-child'
								}, results, context, opts);
								break;
							}
							case ':eq' : {
								results = this.api.byNth({
									content: selectorData.content,
									value: ':nth-child'
								}, results, context, opts);
								break;
							}
							case ':lt' : {
								results = this.api.byNth({
									content: '-n+' + selectorData.content,
									value: ':nth-child'
								}, results, context, opts);
								break;
							}
							case ':gt' : {
								results = this.api.byNth({
									content: 'n+' + selectorData.content,
									value: ':nth-child'
								}, results, context, opts);
								break;
							}
							case ':input' : {
								results = this.api.byType({value: 'input, select, button, textarea'}, results, context, opts);								
								break;
							}
							case ':radio' : {
								results = this.api.byAttributeEquals({value:{left:'type',op:'=',right:'radio'}}, results, context, opts);
								break;
							}
							case ':text' : {
								results = this.api.byAttributeEquals({value:{left:'type',op:'=',right:'text'}}, results, context, opts);
								break;
							}
							case ':checkbox' : {
								results = this.api.byAttributeEquals({value:{left:'type',op:'=',right:'checkbox'}}, results, context, opts);
								break;
							}
							case ':header' : {
								results = this.api.byType({value: 'h1, h2, h3, h4, h5, h6'}, results, context, opts);
								break;
							}
						}
						break;
					}
					case _LL.NTH : {
						results = this.api.byNth(selectorData, results, context, opts);
						break;
					}
					case _LL.NOT : {
						results = this.api.byNot(selectorData, results, context, opts);
						break;
					}
					case _LL.HAS : {
						results = this.api.byHas(selectorData, results, context, opts);
						break;
					}
				}
				// if we didn't find anything no need to further filter
				if (results.length == 0) {
					break;
				}				
			}

			return results;
		}
	}

}(window, document));