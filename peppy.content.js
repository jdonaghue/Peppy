
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
				tree = isAST ? selector : _LL.lex(selector),
				results = [];

			if (!isAST && doc.querySelectorAll) {
				var nl,
					skipQSA = false;

				try { nl = doc.querySelectorAll(selector); } catch(e) { skipQSA = true; }

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