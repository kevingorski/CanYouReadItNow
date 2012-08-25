/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:CanYouReadItNow.jquery.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', 'lib/Array.filter.js', 'lib/color-0.3.0.js', 'src/CYRIN.TextTreeNode.js', 'src/CYRIN.Analysis.js', '<file_strip_banner:src/CYRIN.js>'],
        dest: 'deployable/CYRIN.dev.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'deployable/CYRIN.min.js'
      }
    },
    jasmine: {
      all: ['test/SpecRunner.html']
    },
    lint: {
      files: ['grunt.js', 'src/**/*.js']
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        laxbreak: true,
        nonew: false
      },
      globals: {
        jQuery: true,
        Color: true,
        CYRIN: true
      }
    },
    uglify: {}
  });

  grunt.loadNpmTasks('grunt-jasmine-task');

  // Default task.
  grunt.registerTask('default', 'lint jasmine concat min');
};
