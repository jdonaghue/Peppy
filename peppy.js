/* 
   Peppy - A lightning fast CSS 3 Compliant selector engine.   	 
   http://www.w3.org/TR/css3-selectors/#selectors
   
   version 0.1.2	
   
   Author: James Donaghue - james.donaghue@gmail.com

   Copyright (c) 2008 James Donaghue (jamesdonaghue.com)	
   Licenced under the FreeBSD (http://www.freebsd.org/copyright/freebsd-license.html) licence.

*/
(function(){	
	var doc = document;
	var isIE = /(?!.*?opera.*?)msie(?!.*?opera.*?)/i.test( navigator.userAgent );
	var isWebKit = /webkit/i.test( navigator.userAgent );
	var cache = {};
	var cacheOn = !isIE && !isWebKit;
	var persistCache = {};		
	var _uid = 0;		
	
	var reg = {
		trim : /^\s+|\s+$/g,
		quickTest : /^[^:\[>+~ ,]+$/,
		typeSelector : /(^[^\[:]+?)(?:\[|\:|$)/,
		tag : /^(\w+|\*)/,		
		id : /^(\w*|\*)#/,
		classRE : /^(\w*|\*)\./,
		attributeName : /(\w+)(?:[!+~*\^$|=])|\w+/,
		attributeValue : /(?:[!+~*\^$|=]=*)(.+)(?:\])/, 
		pseudoName :  /(\:[^\(]+)/,
		pseudoArgs : /(?:\()(.+)(?:\))/,				
		nthParts : /([+-]?\d)*(n)([+-]\d+)*/i,		
		combinatorTest : /[+>~ ](?![^\(]+\)|[^\[]+\])/,
		combinator :  /\s*[>~]\s*(?![=])|\s*\+\s*(?![0-9)])|\s+/g, 						
		recursive : /:(not|has)\((\w+|\*)?([#.](\w|\d)+)*(\:(\w|-)+(\([^\)]+\))?|\[[^\}]+\])*(\s*,\s*(\w+|\*)?([#.](\w|\d)+)*(\:(\w|-)+(\([^\)]+\))?|\[[^\}]+\])*)*\)/gi		
	}
	
	var arrayIt = function(a){
		if( !!(window.attachEvent && !window.opera) ) {
			return function(a){
				if( a instanceof Array ) return a;
				for( var i=0, result = [], m; m = a[ i++ ]; )
					result[ result.length ] = m;
				return result;
			};
		} else {
			return function(a){
				return Array.prototype.slice.call(a);
			};
		}
	}();	
	
	// Filters a list of elements for uniqueness.
	function filter( a, tag ) {
		var r = [], 
			uids = {};
		if( tag ) tag = new RegExp( "^" + tag + "$", "i" );
		for( var i = 0, ae; ae = a[ i++ ]; ) {
			ae.uid = ae.uid || _uid++;
			if( !uids[ae.uid] && (!tag || ae.nodeName.search( tag ) !== -1) ) {
				r[r.length] = uids[ae.uid] = ae;
			}
		}
		return r;
	}
	
	// getAttribute - inspired by EXT -> http://extjs.com
	// Copyright(c) 2006-2008, Ext JS, LLC.
 	// http://extjs.com/license
	function getAttribute( e, a ) {
		if( !e ) return null;
		if( a === "class" || a === "className" )
			return e.className;
		if( a === "for" ) 
			return e.htmlFor;	
		return e.getAttribute( a ) || e[a];
	}		
	
	function getByClass( selector, selectorRE, root, includeRoot, cacheKey, tag, flat ) {
		var result = [];
		
		if( !!flat ) {
			return selectorRE.test( root.className ) ? [root] : [];
		}
		
		if( root.getElementsByClassName ) {
			result = arrayIt( root.getElementsByClassName( selector) );			
			
			if( !!includeRoot ) {
				if( selectorRE.test( root.className ) ) result[ result.length ] = root;
			}
			
			if( tag != "*" ) result = filter( result, tag );
			cache[ cacheKey ] = result.slice(0);
			return result;
			
		} else if( doc.getElementsByClassName ) {
			result = arrayIt( doc.getElementsByClassName( selector ) ); 
			
			if( tag != "*" ) result = filter( result, tag );
			cache[ cacheKey ] = result.slice(0);
			return result;
		}
		
		var es = (tag == "*" && root.all) ? root.all : root.getElementsByTagName( tag );		
		
		if( !!includeRoot ) es[ es.length ] = root ;		
		
		for( var index = 0, e; e = es[ index++ ]; ) {
			if( selectorRE.test( e.className ) ) {
				result[ result.length ] = e;
			}
		}
		return result;
	}
	
	function getById( selector, root, includeRoot, cacheKey, tag, flat ) {
		var rs, 
			result = [];
		
		if( !!flat ) {
			return getAttribute( root, "id" ) === selector ? [root] : [];
		}
		
		if( root.getElementById ) {
			rs = root.getElementById( selector );
		} else {
			rs = doc.getElementById( selector );
		}
		
		if( rs && getAttribute( rs, "id" ) === selector ) {			
			result[ result.length ] = rs;
			cache[ cacheKey ] = result.slice(0);
			return result;
		}
		
		var es = root.getElementsByTagName( tag );
		
		if( !!includeRoot ) es[ es.length ] = root ;
		
		for( var index = 0, e; e = es[ index++ ]; ) {
			if( getAttribute( e, "id" ) === selector ) {
				result[ result.length ] = e;
				break;
			}
		}
		return result;
	} 

	function getContextFromSequenceSelector( selector, roots, includeRoot, flat ) {
		var context, 
			tag, 
			contextType = "", 
			result = [], 
			tResult = [], 
			root, 
			rootCount, 
			rootsLength;
			
		reg.id.lastIndex = reg.typeSelector.lastIndex = reg.classRE.lastIndex = 0;
		if( !reg.tag.test( selector ) ) selector = "*" + selector;
		context = reg.typeSelector.exec( selector )[1];
		roots = roots instanceof Array ? roots.slice(0) : [roots];
		rootsLength = roots.length;
		rootCount = rootsLength - 1;

		if( reg.id.test( context ) ) {			
			contextType = "id";
			tag = (tag = context.match( /^\w+/ )) ? tag[0] : "*";
			context = context.replace( reg.id, "");						
		} else if( reg.classRE.test( context ) ) {
			contextType = "class";
			tag = (tag = context.match( reg.tag )) ? tag[0] : "*";
			context = context.replace( reg.tag, "" );
			contextRE = persistCache[context + "RegExp"] || 
						(persistCache[context + "RegExp"] = new RegExp( "(?:^|\\s)" + context.replace( /\./g, "\\s*" ) + "(?:\\s|$)" ));
			context = context.replace( /\./g, " " )
		}			
		
		while( rootCount > -1 ) { 
			root = roots[ rootCount-- ];
			root.uid = root.uid || _uid++;
			var cacheKey = selector + root.uid;
			
			if( cacheOn && cache[ cacheKey ] ) {
				result = result.concat( cache[ cacheKey ] );
				continue;
			}
			
			if( contextType === "id" ) {
				tResult = getById( context, root, includeRoot, cacheKey, tag, flat );
			} else if( contextType === "class" ) {
				tResult = getByClass( context, contextRE, root, includeRoot, cacheKey, tag, flat );
			} else { /* tagname */
				tResult = arrayIt( root.getElementsByTagName( context ) );
				if( !!includeRoot && (root.nodeName.toUpperCase() === context.toUpperCase() || context === "*") ) tResult[tResult.length] = root;
			}
			
			result = rootsLength > 1 ? result.concat( tResult ) : tResult;
			cache[ cacheKey ] = result.slice(0);
		}
		return result;
	}
	
	peppy = {
		query : function( selectorGroups, root, includeRoot, recursed, flat ) {
			var elements = [];						
			if( !recursed ) {  // TODO: try to clean this up. 
				selectorGroups = selectorGroups.replace( reg.trim, "" ) // get rid of leading and trailing spaces												 
											   .replace( /(\[)\s+/g, "$1") // remove spaces around '['  of attributes
											   .replace( /\s+(\])/g, "$1") // remove spaces around ']' of attributes
											   .replace( /(\[[^\] ]+)\s+/g, "$1") // remove spaces to the left of operator inside of attributes
											   .replace( /\s+([^ \[]+\])/g, "$1" ) // remove spaces to the right of operator inside of attributes
											   .replace( /(\()\s+/g, "$1") // remove spaces around '(' of pseudos											   
											   .replace( /(\+)([^0-9])/g, "$1 $2") // add space after + combinator
											   .replace( /['"]/g, "") // remove all quotations
											   .replace( /\(\s*even\s*\)/gi, "(2n)") // replace (even) with (2n) - pseudo arg (for caching)
											   .replace( /\(\s*odd\s*\)/gi, "(2n+1)"); // replace (odd) with (2n+1) - pseudo arg (for caching)
			}			
			
			if( typeof root === "string" ) {
				root = (root = getContextFromSequenceSelector( root, doc )).length > 0 ? root : undefined;
			}

			root = root || doc;
			root.uid = root.uid || _uid++;
			
			var cacheKey = selectorGroups + root.uid;
			if( cacheOn && cache[ cacheKey ] ) return cache[ cacheKey ];
			
			reg.quickTest.lastIndex = 0;
			if( reg.quickTest.test( selectorGroups ) ) {
				elements = getContextFromSequenceSelector( selectorGroups, root, includeRoot, flat );
				return (cache[ cacheKey ] = elements.slice(0));
			}
			
			var groupsWorker, 
				groups, 
				selector, 
				parts = [], 
				part;
				
			groupsWorker = selectorGroups.split( /\s*,\s*/g );
			groups = groupsWorker.length > 1 ? [""] : groupsWorker;
			
			// validate groups
			for( var gwi = 0, tc = 0, gi = 0, g; groupsWorker.length > 1 && (g = groupsWorker[ gwi++ ]) !== undefined;) {
				tc += (((l = g.match( /\(/g )) ? l.length : 0) - ((r = g.match( /\)/g )) ? r.length : 0));
				groups[gi] = groups[gi] || "";
				groups[gi] += (groups[gi] === "" ? g : "," + g);
				if( tc === 0 ) gi++;
			}
			
			var gCount = 0;				
			while( (selector = groups[gCount++]) !== undefined ) {
				reg.quickTest.lastIndex = 0;
				if( reg.quickTest.test( selector ) ) {
					result = getContextFromSequenceSelector( selector, root, includeRoot, flat )
					elements = groups.length > 1 ? elements.concat( result ) : result;
					continue;
				}
				reg.combinatorTest.lastIndex = 0;
				if( reg.combinatorTest.test( selector ) ) {
					var parts, 
						pLength, 
						pCount = 0, 
						combinators, 
						cLength, 
						cCount = 0, 
						result;
						
					parts = selector.split( reg.combinator );
					pLength = parts.length;
					
					combinators = selector.match( reg.combinator ) || [""];					
					cLength = combinators.length;
					
					while( pCount < pLength ) {
						var c, 
							part1, 
							part2;
							
						c = combinators[ cCount++ ].replace( reg.trim, "");
						
						part1 = result || peppy.query( parts[pCount++], root, includeRoot, true, flat );								
						part2 = peppy.query( parts[ pCount++ ], 
											c == "" || c == ">" ? part1 : root, 
											c == "" || c == ">", 
											true,
											flat );
											
 						result = peppy.queryCombinator( part1, part2, c );
					}
					
					elements = groups.length > 1 ? elements.concat( result ) : result;							   
					result = undefined;
				} else {
					result = peppy.querySelector( selector, root, includeRoot, flat );
					elements = groups.length > 1 ? elements.concat( result ) : result;
				}
			}	
			
			if( groups.length > 1 ) elements = filter(elements);
			
			return ( cache[ cacheKey ] = elements.slice(0));
		},
		queryCombinator: function( l, r, c ) {
			var result = [], 
				uids = {}, 
				proc = {}, 
				succ = {}, 
				fail = {}, 
				combinatorCheck = peppy.simpleSelector.combinator[c];
				
			for( var li = 0, le; le = l[ li++ ]; ) {
				le.uid = le.uid || _uid++
				uids[ le.uid ] = le;
			}	
					
			for( var ri = 0, re; re = r[ ri++ ]; ) {
				re.uid = re.uid || _uid++; 
				if( !proc[ re.uid ] && combinatorCheck( re, uids, fail, succ ) ) {
					result[ result.length ] = re;
				}
				proc[ re.uid ] = re;
			}
			return result;
		},
		querySelector : function( selector, root, includeRoot, flat ) {
			var context, 
				passed = [],				 
				count, 
				totalCount, 
				e, 
				first = true, 
				localCache = {};

			context = getContextFromSequenceSelector( selector, root, includeRoot, flat ); 	
			count = context.length;
			totalCount = count - 1;			
						
			var tests, recursive;
			if( /:(not|has)/i.test( selector ) ) {
				recursive = selector.match( reg.recursive );
				selector = selector.replace( reg.recursive, "" );
			}
			
			// Get the tests (if there aren't any just set tests to an empty array).
			if( !(tests = selector.match( /:(\w|-)+(\([^\(]+\))*|\[[^\[]+\]/g )) ) tests = [];	
				
			// If there were any recursive tests put them in the tests array (they were removed above).
			if( recursive ) tests = tests.concat( recursive );			

			// Process each tests for all elements.
			var aTest;
			while( (aTest = tests.pop()) !== undefined ) {				
				var pc = persistCache[ aTest ], 
					testFuncScope,
				 	testFunc, 
				 	testFuncKey,				 	
				 	testFuncArgs = [],
					isTypeTest = false, 
					isCountTest = false;
					
				passed = [];
				
				if( pc ) {
					testFuncKey = pc[ 0 ];
					testFuncScope = pc[ 1 ];					
					testFuncArgs = pc.slice( 2 );
					testFunc = testFuncScope[ testFuncKey ];											
				} else if( !/^:/.test( aTest ) ) { // attribute																
					var n = aTest.match( reg.attributeName );
					var v = aTest.match( reg.attributeValue );
										
					testFuncArgs[ 1 ] = n[ 1 ] || n[ 0 ];
					testFuncArgs[ 2 ] = v ? v[ 1 ] : "";						
					testFuncKey = "" + aTest.match( /[~!+*\^$|=]/ );
					testFuncScope = peppy.simpleSelector.attribute;	
					testFunc = testFuncScope[ testFuncKey ];						
					persistCache[ aTest ] = [ testFuncKey, testFuncScope ].concat( testFuncArgs );					
				} else { // pseudo						
					var pa = aTest.match( reg.pseudoArgs );					
					testFuncArgs[ 1 ] = pa ? pa[ 1 ] : "";						
					testFuncKey = aTest.match( reg.pseudoName )[ 1 ];
					testFuncScope = peppy.simpleSelector.pseudos;
					
					if( /nth-(?!.+only)/i.test( aTest ) ) {											
						var a, 
							b, 
							nArg = testFuncArgs[ 1 ],
							nArgPC = persistCache[ nArg ];
							
						if( nArgPC ) {
							a = nArgPC[ 0 ];
							b = nArgPC[ 1 ];
						} else {								
							var nParts = nArg.match( reg.nthParts );
							if( nParts ) {								
								a = parseInt( nParts[1],10 ) || 0;
								b = parseInt( nParts[3],10 ) || 0;
								
								if( /^\+n|^n/i.test( nArg ) ) {
									a = 1;
								} else if( /^-n/i.test( nArg ) ) {
									a = -1;
								}
								
								testFuncArgs[ 2 ] = a;
								testFuncArgs[ 3 ] = b;
								persistCache[ nArg ] = [a, b];									
							}
						}
					} else if( /^:contains/.test( aTest ) ) {
						var cArg = testFuncArgs[1];
						var cArgPC = persistCache[ cArg ];
						
						if( cArgPC ) {
							testFuncArgs[1] = cArgPC;
						} else {
							testFuncArgs[1] = persistCache[ cArg ] = new RegExp( cArg );	
						}
					}
					testFunc = testFuncScope[ testFuncKey ];						
					persistCache[ aTest ] = [ testFuncKey, testFuncScope ].concat( testFuncArgs );	
				}				
				
				isTypeTest = /:(\w|-)+type/i.test( aTest);
				isCountTest = /^:(nth[^-]|eq|gt|lt|first|last)/i.test( aTest );					
				if( isCountTest ) testFuncArgs[ 3 ] = totalCount;	
				
				// Now run the test on each element (keep only those that pass)								
				var cLength = context.length, cCount = cLength -1 ;
				while( cCount > -1 ) {
					e = context[ cCount-- ];
  					if( first ) {
 	 					e.peppyCount = cCount + 1;
  					}
					var pass = true;
 					testFuncArgs[ 0 ] = e;
 					if( isCountTest ) 
 						testFuncArgs[2] = e.peppyCount;

					if( !testFunc.apply( testFuncScope, testFuncArgs ) ) {
						pass = false;
					}						
					if( pass ) {
						passed.push(e);
					}
				}
				context = passed;
				first = false;
			}
			return passed;
		},
		simpleSelector: {
			attribute: {
				"null": function( e, a, v ) { return !!getAttribute(e,a); },
				"=" : function( e, a, v ) { return getAttribute(e,a) == v; },
				"~" : function( e, a, v ) { return getAttribute(e,a).match(new RegExp('\\b'+v+'\\b')) },
				"^" : function( e, a, v ) { return getAttribute(e,a).indexOf( v ) === 0; },
				"$" : function( e, a, v ) { var attr = getAttribute(e,a); return attr.lastIndexOf( v ) === attr.length - v.length; },
				"*" : function( e, a, v ) { return getAttribute(e,a).indexOf( v ) != -1; },
				"|" : function( e, a, v ) { return getAttribute(e,a).match( '^'+v+'-?(('+v+'-)*('+v+'$))*' ); },
				"!" : function( e, a, v ) { return getAttribute(e,a) !== v; }
			},
			pseudos: {
				":root" : function( e ) { return e === doc.getElementsByTagName( "html" )[0] ? true : false; },
				":nth-child" : function( e, n, a, b, t ) {	
// Unobtrusive version									
// 					var parent = e.parentNode;
// 					if( !parent ) return false;
// 					
// 					e.uid = e.uid || _uid++;
// 					parent.uid = parent.uid || _uid++;
// 					
// 					var parentCache = cache[ "pos" + parent.uid ];										
// 					
// 					if( !parentCache ) {
// 						var node = e.parentNode.firstChild, 
// 							count = 0, 
// 							last,
// 							cacheHash = {},
// 							cacheArr = [];
// 						for( ; node; node = node.nextSibling ) {
// 							if( node.nodeType == 1 ) {								
// 								node.uid = node.uid || _uid++;																
// 								cacheArr[ count ] = node.uid;
// 								cacheHash[ node.uid ] = ++count;								
// 							}
// 						}
// 						parentCache = cache[ "pos" +  parent.uid ] = { posList : cacheArr, 
// 																	   posHash : cacheHash,
// 																	   length : count};
// 					}					
// 					
// 					var position = parentCache.posHash[ e.uid ];	
// 					if( n == "first" ) 
// 						return position == 1;
// 					if( n == "last" )
// 						return position == parentCache.length;
// 					if( n == "only" )
// 						return parentCache.length == 1;	
// 					return (!a && !b && position == n) || 
// 						   ((a == 0 ? position == b : 
// 							 		  a > 0 ? position >= b && (position - b) % a == 0 :
// 							 			  	  position <= b && (position + b) % a == 0));
		

// Obtrusive but faster version	- the problem with this version ( which is similar to what 
// is seen in other libraries ) is that as soon as the DOM changes results will potentially be incorrect.
// Specifically, if a node in question gets a new sibling, its position will then be different if it is 
// anything but the first or last child. The nature of this code (to keep it performant) is to not recalculate 
// a position. The unobtrusive version above is very similar to this, the only difference is that it stores
// positions in cache instead of as a property of the element. As soon as the DOM changes the cache is cleared
// so with the unobtrusive version the position will be recalculated.		
					if( !e.nodeIndex ) {
						var node = e.parentNode.firstChild, count = 0, last;
						for( ; node; node = node.nextSibling ) {
							if( node.nodeType == 1 ) {
								last = node;								
								node.nodeIndex = ++count;
							}
						}
						last.IsLastNode = true;
						if( count == 1 ) last.IsOnlyChild = true;
					}
					var position = e.nodeIndex;
					if( n == "first" ) 
						return position == 1;
					if( n == "last" )
						return !!e.IsLastNode;
					if( n == "only" )
						return !!e.IsOnlyChild;
					return (!a && !b && position == n) || 
						   ((a == 0 ? position == b : 
							 		  a > 0 ? position >= b && (position - b) % a == 0 :
							 			  	  position <= b && (position + b) % a == 0));
				},				
				":nth-last-child" : function( e, n ) { return this[ ":nth-child" ]( e, n, a, b ); },  // TODO: n is not right.
				":nth-of-type" : function( e, n, t ) { return this[ ":nth-child" ]( e, n, a, b, t); },
				":nth-last-of-type" : function( e, n, t ) { return this[ ":nth-child" ](e, n, a, b, t ); }, // TODO: n is not right.
				":first-child" : function( e ) { return this[ ":nth-child" ]( e, "first" ); },
				":last-child" : function( e ) { return this[ ":nth-child" ]( e, "last" ); },
				":first-of-type" : function( e, n, t ) { return this[ ":nth-child" ]( e, "first", null, null, t ); },
				":last-of-type" : function( e, n, t ) { return this[ ":nth-child" ]( e, "last", null, null, t ); },
				":only-child" : function( e ) { return this[ ":nth-child" ]( e, "only" ); },
				":only-of-type" : function( e, n, t ) { return this[ ":nth-child" ]( e, "only", null, null, t ); },
				":empty" : function( e ) { 
					for( var node = e.firstChild, count = 0; node !== null; node = node.nextSibling ) {
						if( node.nodeType === 1 || node.nodeType === 3 ) return false;
					}
					return true;
				},
				":not" : function( e, s ) { return peppy.query( s, e, true, true, true ).length === 0; },
				":has" : function( e, s ) { return peppy.query( s, e, true, true, true ).length > 0; },
				":selected" : function( e ) { return e.selected; },
				":hidden" : function( e ) { return e.type === "hidden" || e.style.display === "none"; },
				":visible" : function( e ) { return e.type !== "hidden" && e.style.display !== "none"; },
				":input" : function( e ) { return e.nodeName.search( /input|select|textarea|button/i ) !== -1; },
				":radio" : function( e ) { return e.type === "radio"; },
				":checkbox" : function( e ) { return e.type === "checkbox"; },
				":text" : function( e ) { return e.type === "text"; },
				":header" : function( e ) { return e.nodeName.search( /h\d/i ) !== -1; },
				":enabled" : function( e ) { return !e.disabled && e.type !== "hidden"; },
				":disabled" : function( e ) { return e.disabled; },
				":checked" : function( e ) { return e.checked; },
				":contains" : function( e, s ) { return s.test( (e.textContent || e.innerText || "") ); },
				":parent" : function( e ) { return !!e.firstChild; },
				":odd" : function( e ) { return this[ ":nth-child" ]( e, "2n+2", 2, 2 ); },
				":even" : function( e ) { return this[ ":nth-child" ]( e, "2n+1", 2, 1 ); },
				":nth" : function( e, s, i ) { return s == i; },
				":eq" : function( e, s, i ) { return s == i; },
				":gt" : function( e, s, i ) { return i > s; },
				":lt" : function( e, s, i ) { return i < s; },
				":first" : function( e, s, i ) { return i == 0 },
				":last" : function( e, s, i, end ) { return i == end; }
			},
			combinator : {
				"" : function( r, u, f, s ) {
					var rUID = r.uid;
					while( (r = r.parentNode) !== null && !f[ r.uid ]) {
						if( !!u[ r.uid ] || !!s[ r.uid ] ) {
							return (s[ rUID ] = true);
						}
					}
					return (f[ rUID ] = false);
				},
				">" : function( r, u, f, s ) {
					return r.parentNode && u[ r.parentNode.uid ] ;
				},
				"+" : function( r, u, f, s ) {
					while( (r = r.previousSibling) !== null && !f[ r.uid ] ) {
						if( r.nodeType === 1 )
							return r.uid in u;
					}
					return false;
				},
				"~" : function( r, u, f, s ) {
					var rUID = r.uid;
					while( (r = r.previousSibling) !== null && !f[ r.uid ] ) {
						if( !!u[ r.uid ] || !!s[ r.uid ] ) {
							return (s[ rUID ] = true);
						}
					}
					return (f[ rUID ] = false);
				}
			}
		}
	}
	
	// From John Resig -> http://ejohn.org/blog/thoughts-on-queryselectorall/
	// Copyright 2008, John Resig (http://ejohn.org/)
	// released under the MIT License
	if ( doc.querySelectorAll ) {
		(function(){
			var oldpeppy = peppy.query;
			
			peppy.query = function(sel, context){
				context = context || doc;
				if ( context === doc ) {
					try {
						return context.querySelectorAll(sel);
					} catch(e){}
				}
				
				return oldpeppy.apply(oldpeppy, arrayIt(arguments));
			};
		})();
	} else {
		// If the DOM changes we need to clear the cache because it will no longer be reliable. 
		// Inspired by code from Sizzle -> http://github.com/jeresig/sizzle/tree/master.
		// Copyright 2008, John Resig (http://ejohn.org/)
		// released under the MIT License	
		var aEvent = doc.addEventListener || doc.attachEvent;
		function clearCache(){ cache = {}; }
		aEvent("DOMAttrModified", clearCache, false);
		aEvent("DOMNodeInserted", clearCache, false);
		aEvent("DOMNodeRemoved", clearCache, false);	
	}
	
	if( !($ = window.$) ) $ = peppy.query;
})();