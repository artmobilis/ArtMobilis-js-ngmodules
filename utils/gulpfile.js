var gulp = require('gulp');
var jshint = require('gulp-jshint');

var paths = {
  src: ['../modules/**/*.js']
};

gulp.task('default', ['lint']);

gulp.task('lint', function() {
  return gulp.src(paths.src)
    .pipe(jshint())
    .on('error', function(err) {
      console.log(err.toString());
    })
    .pipe(jshint.reporter('jshint-stylish'));
});
