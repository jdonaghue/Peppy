(function() {

	function nodeNames(nodes) {
		var ret = [];
		for(var i=0,len=nodes.length; i<len; i++) {
			ret.push(nodes[i].nodeName);
		}
		return ret;
	}

	test('id selector', function() {
		expect(4);

		var selector = '#idselector';
		deepEqual(nodeNames(peppy.query(selector)), ['DIV'], selector);
		deepEqual(nodeNames(peppy.query(selector), null, { useId: true }), ['DIV'], selector);

		selector = 'div#idselector';
		deepEqual(nodeNames(peppy.query(selector)), ['DIV'], selector);
		deepEqual(nodeNames(peppy.query(selector), null, { useId: true }), ['DIV'], selector);
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
		deepEqual(nodeNames(peppy.query(selector)), ['DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV'], selector);
		deepEqual(nodeNames(peppy.query(selector, null, { useType: true })), ['DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV'], selector + ' useType');

		// scoped
		equal(peppy.query(selector, document.getElementById('scopedType')).length, 1, selector + ' scoped');
		equal(peppy.query(selector, document.getElementById('scopedType'), { useType: true }).length, 1, selector + ' scoped useType');
	});

	test('class selector', function() {
		expect(4);

		var selector = '.classselector';
		deepEqual(nodeNames(peppy.query(selector)), ['DIV'], selector);
		deepEqual(nodeNames(peppy.query(selector, null, { useClass: true })), ['DIV'], selector + ' useClass');

		selector = 'div.classselector';
		deepEqual(nodeNames(peppy.query(selector)), ['DIV'], selector);
		deepEqual(nodeNames(peppy.query(selector, null, { useClass: true })), ['DIV'], selector + ' useClass');
	});

	test('combinators', function() {
		expect(2);
		
		var selector = 'div .classselector';
		deepEqual(nodeNames(peppy.query(selector)), [], selector);
		deepEqual(nodeNames(peppy.query(selector, null, { useClass: true })), [], selector + ' useClass');		
	});

}());