(function() {

	function nodeIdOrNames(nodes) {
		var ret = [];
		for(var i=0,len=nodes.length; i<len; i++) {
			ret.push(nodes[i].getAttribute('id') || nodes[i].nodeName);
		}
		return ret;
	}

	test('id selector', function() {
		expect(4);

		var selector = '#idselector';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['idselector'], selector);
		deepEqual(nodeIdOrNames(peppy.query(selector), null, { useId: true }), ['idselector'], selector);

		selector = 'div#idselector';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['idselector'], selector);
		deepEqual(nodeIdOrNames(peppy.query(selector), null, { useId: true }), ['idselector'], selector);
	});

	test('type selector', function() {
		expect(8);

		var selector = '*';
		equal(peppy.query(selector).length, document.getElementsByTagName(selector).length, selector);
		equal(peppy.query(selector, null, { useType: true }).length, document.getElementsByTagName(selector).length, selector + ' useType');

		// scoped
		equal(peppy.query(selector, document.getElementById('scopedType')).length, 3, selector + ' scoped');
		equal(peppy.query(selector, document.getElementById('scopedType'), { useType: true }).length, 3, selector + ' scoped useType');

		selector = 'div';
		deepEqual(nodeIdOrNames(peppy.query(selector)), 
			['qunit', 
			 'qunit-testrunner-toolbar', 
			 'idselector',
  			 'classSelector',
  			 'scopedType',
  			 'DIV',
  			 'attribute',
  			 'pseudo'], selector);

		deepEqual(nodeIdOrNames(peppy.query(selector, null, { useType: true })), 
			['qunit', 
			 'qunit-testrunner-toolbar', 
			 'idselector',
  			 'classSelector',
  			 'scopedType',
  			 'DIV',
  			 'attribute',
  			 'pseudo'], selector + ' useType');

		// scoped
		equal(peppy.query(selector, document.getElementById('scopedType')).length, 1, selector + ' scoped');
		equal(peppy.query(selector, document.getElementById('scopedType'), { useType: true }).length, 1, selector + ' scoped useType');
	});

	test('class selector', function() {
		expect(4);

		var selector = '.classSelector';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['classSelector'], selector);
		deepEqual(nodeIdOrNames(peppy.query(selector, null, { useClass: true })), ['classSelector'], selector + ' useClass');

		selector = 'div.classSelector';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['classSelector'], selector);
		deepEqual(nodeIdOrNames(peppy.query(selector, null, { useClass: true })), ['classSelector'], selector + ' useClass');
	});

	test('combinators', function() {
		expect(6);

		var selector = 'div div';
		deepEqual(nodeIdOrNames(peppy.query(selector)), 
			['qunit-testrunner-toolbar',
			 'DIV'], selector);
		deepEqual(nodeIdOrNames(peppy.query(selector, null, { useClass: true })), 
			['qunit-testrunner-toolbar',
			 'DIV'], selector + ' useClass');	

		selector = 'div + p';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['P'], selector);

		selector = 'div div + p';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['P'], selector);

		selector = 'div#scopedType > *';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['DIV', 'P', 'SPAN'], selector);

		selector = 'div#scopedType > div ~\r    span';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['SPAN'], selector);
	});

	test('attribute selector', function() {
		expect(9);

		var selector = '*[data-value]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrEq1', 'attrListEq1', 'attrListHyphen1'], selector);

		selector = '#attribute *[data-value]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrEq1', 'attrListEq1', 'attrListHyphen1'], selector);

		selector = '#attribute *[data-value=test]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrEq1'], selector);

		selector = '#attribute *[data-value~=test3]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrListEq1'], selector);

		selector = '#attribute *[data-value^=test1]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrListEq1'], selector);

		selector = '#attribute *[data-value$=test3]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrListEq1'], selector);

		selector = '#attribute *[data-value*=test2]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrListEq1'], selector);

		selector = '#attribute *[data-value*=test3]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrListEq1'], '#attribute *[data-value*=\\rtest3]');

		selector = '#attribute *[data-value|=testHyph1]';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['attrListHyphen1'], selector);
	});

	test('pseudo class', function() {
		expect(7);

		var selector = '#pseudo *:first-child';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['first', 'only-child'], selector);

		selector = '#pseudo *:last-child';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['only-child', 'sixth'], selector);

		selector = '#pseudo *:first-of-type';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['first', 'second', 'fourth', 'only-child'], selector);

		selector = '#pseudo *:last-of-type';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['fourth', 'only-child', 'fifth', 'sixth'], selector);

		selector = '#pseudo *:only-child';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['only-child'], selector);

		selector = '#pseudo *:only-of-type';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['fourth', 'only-child'], selector);

		selector = '#pseudo *:empty';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['first', 'second', 'third', 'fourth', 'only-child', 'fifth', 'sixth'], selector);
	});

	test('nth selector', function() {
		expect(9);

		var selector = '#pseudo *:nth-child(1)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['first', 'only-child'], selector);

		selector = '#pseudo *:nth-child(n+1)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['first', 'only-child'], selector);

		selector = '#pseudo *:nth-child(n+2)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['second'], selector);

		selector = '#pseudo *:nth-child(n-1)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['only-child', 'sixth'], selector);		

		selector = '#pseudo *:nth-child(7)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['sixth'], selector);		

		selector = '#pseudo *:nth-child(2n)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['second', 'fourth', 'fifth'], selector);		

		selector = '#pseudo *:nth-child(even)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['second', 'fourth', 'fifth'], selector);		

		selector = '#pseudo *:nth-child(2n+1)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['first', 'third', 'pseudoParent', 'only-child', 'sixth'], selector);		

		selector = '#pseudo *:nth-child(odd)';
		deepEqual(nodeIdOrNames(peppy.query(selector)), ['first', 'third', 'pseudoParent', 'only-child', 'sixth'], selector);		


	});

}());