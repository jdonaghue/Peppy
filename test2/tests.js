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
  			 'DIV'], selector);

		deepEqual(nodeIdOrNames(peppy.query(selector, null, { useType: true })), 
			['qunit', 
			 'qunit-testrunner-toolbar', 
			 'idselector',
  			 'classSelector',
  			 'scopedType',
  			 'DIV'], selector + ' useType');

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

}());