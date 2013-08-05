module.exports = function(grunt) {

	var gzip = require("gzip-js");

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		// qunit: {
		// 	files: [ 
		// 		"test/css3-compat/css3-compat.html?engine=peppy#target", 
		// 		"test/jquery/jquery1.html", 
		// 		"test/jquery/jquery2.html" 
		// 	]
		// },
		concat: {
			dist: {
				options: {
					process: function(src, filepath) {

						return (filepath != 'src/start.js' && filepath != 'src/end.js' ? '// Source: ' + filepath + '\n' : '') + src;
					},
				},
				files: {
					'dist/peppy.js': ['src/start.js', 'LLSelectorParser/LLparser.content.js','src/peppy.content.js', 'src/end.js'],
					'peppy.js': ['dist/peppy.js']
				},
			},
		},
		uglify: {
			all: {
				files: {
					"dist/peppy.min.js": [ "dist/peppy.js" ]
				},
				options: {
					compress: { evaluate: false },
					sourceMap: "dist/peppy.min.map",
					beautify: {
						ascii_only: true
					}
				}
			}
		},
		compare_size: {
			files: [ "dist/peppy.js", "dist/peppy.min.js" ],
			options: {
				compress: {
					gz: function( contents ) {
						return gzip.zip( contents, {} ).length;
					}
				},
				cache: "dist/.sizecache.json"
			}
		}
	});

	grunt.registerTask( "commit", function( message ) {
		// Always add dist directory
		exec( "git add dist && git commit -m " + message, this.async() );
	});

	grunt.loadNpmTasks("grunt-contrib-qunit");
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-compare-size");

	// Default task
	//grunt.registerTask( "default", [ "qunit", "concat", , "uglify", "compare_size" ] );
	grunt.registerTask( "default", [ "concat", "uglify",  "compare_size" ] );

};