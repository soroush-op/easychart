var gulp = require('gulp')
var sass = require('gulp-sass')
var watchify = require('watchify')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var gutil = require('gulp-util')
var uglify = require('gulp-uglify')
var sourcemaps = require('gulp-sourcemaps')
var header = require('gulp-header')
var pkg = require('./package.json')
var rename = require('gulp-rename')
var notify = require('gulp-notify')

// in favor of postcss styles task
var postcss = require('gulp-postcss')
var easyImport = require('postcss-easy-import')
var nested = require('postcss-nested')
var autoprefixer = require('autoprefixer')
var cssnano = require('cssnano')
var customProperties = require('postcss-custom-properties')

var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''
].join('\n')

gulp.task('app:watch', function () {
  gulp.start('sass:watch', 'watchify')
})

/*
gulp.task('sass', function () {
  gulp.src('src/scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: require('node-neat').includePaths
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./src'))
})
*/

gulp.task('css', function () {
  var processors = [
    easyImport(),
    customProperties(),
    nested(),
    autoprefixer({browsers: ['last 1 version']}),
    cssnano()
  ]

  return gulp.src('./src/css/easychart.css')
    .pipe(sourcemaps.init())
    .pipe(postcss(processors))
    .pipe(sourcemaps.write('.'))
    .pipe(rename({
      dirname: 'css',
      basename: 'easychart',
      prefix: '',
      suffix: '.min',
      extname: '.css'
    }))
    .pipe(gulp.dest('./dist'))
    .pipe(notify({message: 'postcss task complete :-)', onLast: true}))
})

gulp.task('sass', function () {
  gulp.src('src/scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: require('node-neat').includePaths
    }))
    .pipe(rename({
      basename: 'easychart'
    }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('sass:watch', function () {
  gulp.watch('./src/scss/**/*.scss', ['sass'])
})

gulp.task('browserify:app', function () {
  return build('app', 'ec')
})

gulp.task('browserify:render', function () {
  return build('render', 'ec.render')
})

function build (file, output) {
  var bundler = browserify('./src/js/' + file + '.js', {
    fullPaths: false
  })
  return bundler.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source(output + '.js'))
    .pipe(buffer())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest('./dist'))
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest('./dist'))
}

gulp.task('watchify:app', function () {
  return bundle('app', 'ec')
})

gulp.task('watchify:render', function () {
  return bundle('render', 'ec.render')
})

function bundle (file, output) {
  watchify.args.verbose = true
  watchify.args.poll = true
  var bundler = watchify(browserify('./src/js/' + file + '.js'), watchify.args)
  bundler.on('update', rebundle)
  bundler.on('log', gutil.log.bind(gutil))

  function rebundle () {
    return bundler.bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source(output + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        loadMaps: true
      })) // loads map from browserify file
      // Add transformation tasks to the pipeline here.
      .pipe(sourcemaps.write('./')) // writes .map file
      .pipe(gulp.dest('./dist'))
  }
  return rebundle()
}

gulp.task('build', ['sass', 'browserify:app', 'browserify:render'])
gulp.task('watch:app', ['sass:watch', 'watchify:app'])
gulp.task('watch:render', ['watchify:render'])
