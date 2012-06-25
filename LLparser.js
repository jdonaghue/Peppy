var COMBINATORS = {
	'+': 0,
	'>': 1,
	'~': 2,
	' ': 3
}

var EQ = '=';
var LB = '[';
var RB = ']';

var PLUS = 0;
var GT = 1;
var TILDA = 2;
var SPACE = 3;
var COMBINATOR = 4;
var PSEUDOEL = 5;
var PSEUDOCLASS = 6;
var ATTR = 7;
var CLS = 8;
var ID = 9;
var TYPE = 10;

function error(message, ch) {
	if (console && console.log) {
		console.error('error: ' + message + ' char: ' + ch);
	}
}

function nextNonSpace(selector, start) {
	for (var i = start; i < selector.length; i++) {
		if (selector[i] != ' ') {
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
			if (c in {'+':0, '~': 1, '=': 2}) {
				obj.op += c;
			}
			else {
				obj.left += c;
			}
		}
		else {
			obj.right += c;
		}
	}
	error('invalid attribute', start);
	return selector.length - 1;
}

function lexer(selector) {
	var groups = [];
	var ss = [];

	for (var i = 0, len = selector.length; i < len; i++) {
		var c = selector[i],
			cAhead = selector[i + 1];

		if (c == ',') {
			// GROUP
			groups.push(ss.slice(0));
			ss = [];
			i = nextNonSpace(selector, i+1);
		}
		else if (c in COMBINATORS && cAhead != EQ) {
			// COMBINATOR
			if (!ss[ss.length] || ss[ss.length-1].type != COMBINATOR) {
				ss.push({
					type: COMBINATOR,
					val: c
				});
				i = nextNonSpace(selector, i+1);
			}
		}
		else {
			// SELECTOR
			if (!ss[ss.length - 1] || ss[ss.length - 1].type == COMBINATOR || c == '[') {
				type = 'here is the type';
				switch(c) {
					case '.' : {
						type = CLS;
						break;
					}
					case '#': {
						type = ID;
						break;
					}
					case ':': {
						if (selector[i+1] == ':') {
							type = PSEUDOEL;
						}
						else {
							type = PSEUDOCLASS;
						}

						if (selector[i+2] == ':') {
							error('invalid pseudo class', i+2)
						}
						break;
					}
					case '[': {
						type = ATTR;
						c = {
							left: '',
							right: '', 
							op: ''
						}
						i = parseAttribute(i+1, selector, c);
						
						break;
					}
					default: {
						type = TYPE;
						break;
					}
				}
				ss.push({
					type: type,
					val: c
				});
			}
			else {
				ss[ss.length - 1].val += c;
			}
		}
	}

	groups.push(ss.slice(0));
	return groups;
}