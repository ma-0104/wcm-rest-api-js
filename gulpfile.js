var gulp = require( "gulp" );
var babel = require( "gulp-babel" );

gulp.task( "default", function() {
	return gulp.src( "src/wcm-rest-api.js" )
		.pipe( babel() )
		.pipe( gulp.dest( "dist" ) );
} );