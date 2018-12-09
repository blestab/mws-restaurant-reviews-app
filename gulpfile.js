// generated on 2018-09-04 using generator-webapp 3.0.1
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const concat = require('gulp-concat');
const minify = require('gulp-minify');
const gzip = require('gulp-gzip');
var styleInject = require("gulp-style-inject");

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

let dev = true;

gulp.task('styles', () => {
  return gulp.src('app/css/*.css')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe(minify())
    .pipe(gulp.dest('.tmp/css'))
    .pipe(gulp.dest('dist/css'))
    .pipe(reload({stream: true}));
});

gulp.task('inline1', () => {
  return gulp.src('app/**/*.html')
    .pipe(styleInject())
    //.pipe(gulp.dest(".tmp"))
    .pipe(gulp.dest("./dist"));
});

gulp.task('scripts', () => {
  return gulp.src('app/js/**/*.js')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(minify())
    .pipe(gulp.dest('.tmp/js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(reload({stream: true}));
});

// gzip
gulp.task('compress', () => {
  return gulp.src('app/js/**/*.js')
    .pipe(gzip())
    .pipe(gulp.dest('.tmp/js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(reload({stream: true}));
});

function lint(files) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/js/**/*.js')
    .pipe(gulp.dest('app/js'));
});
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'));
});

gulp.task('html', ['styles', 'scripts'], () => {
  return gulp.src('app/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if(/\.js$/, $.uglify({compress: {drop_console: true}})))
    .pipe($.if(/\.css$/, $.cssnano({safe: true, autoprefixer: false})))
    .pipe($.if(/\.html$/, $.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: {compress: {drop_console: true}},
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src('app/img/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('app/fonts/**/*'))
    .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

// Copy manifest
gulp.task('manifest', function () {
  return gulp.src('app/manifest.json')
    .pipe(gulp.dest('.tmp/'))
    .pipe(gulp.dest('dist/'));
});
/*
// Service Worker
gulp.task('sw', function() {
  return gulp.src([
    './app/js/idb.js',
    './app/js/idbhelper.js',
    './app/sw.js'
  ])
    .pipe(concat('sw.js'))
    .pipe(gulp.dest('.tmp/js'));
});
*/
// DBHelper

gulp.task('dbhelper', function() {
  return gulp.src([
    './app/js/idb.js',
    './app/js/idbhelper.js',
    './app/js/dbhelper.js'
  ])
    .pipe(concat('dbhelper-all.js'))
    .pipe(minify())
    //.pipe(gulp.dest('./app/js/'))
    .pipe(gulp.dest('.tmp/js'))
    .pipe(gulp.dest('dist/js'));
});

// Index Scripts
/*gulp.task('scripts1', function() {
  return gulp.src([
    './app/js/idb.js',
    './app/js/dbhelper.js',
    './app/js/idbhelper.js',
    './app/js/register_service_worker.js',
    './app/js/main.js'
  ])
    .pipe(concat('main.js'))
    .pipe(minify())
    .pipe(gulp.dest('./app/js/'))
    .pipe(gulp.dest('.tmp/js'));
});*/
gulp.task('scripts1', function() {
  return gulp.src([
    './app/js/idb.js',
    './app/js/idbhelper.js',
    './app/js/dbhelper.js',
    './app/js/main.js'
  ])
    .pipe(concat('index.js'))
    .pipe(minify())
    //.pipe(gulp.dest('./app/js/'))
    .pipe(gulp.dest('.tmp/js'));
});

// Restaurant Scripts
gulp.task('scripts2', function() {
  return gulp.src([
    './app/js/idb.js',
    './app/js/idbhelper.js',
    './app/js/dbhelper.js',
    './app/js/register_service_worker.js',
    './app/js/restaurant_info.js'
  ])
    .pipe(concat('restaurant-all.js'))
    .pipe(minify())
    .pipe(gulp.dest('dist/js/'))
    .pipe(gulp.dest('.tmp/js'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', () => {
  runSequence(['clean','wiredep'], ['styles', 'scripts', 'fonts', 'dbhelper', 'scripts1', 'scripts2', 'manifest'], () => {
    browserSync.init({
      notify: false,
      port: 8000,
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });

    gulp.watch([
      'app/*.html',
      'app/img/**/*',
      'app/manifest.json',
      '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/css/**/*.scss', ['styles']);
    gulp.watch(['app/js/**/*.js'], ['scripts']);
    //gulp.watch(['app/sw.js', 'app/js/idbhelper.js'], ['sw', reload]);
    //gulp.watch(['app/js/dbhelper.js', 'app/js/idbhelper.js'], ['dbhelper', reload]);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
  });
});

gulp.task('serve:dist', ['default'], () => {
  browserSync.init({
    notify: false,
    port: 8000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', ['scripts'], () => {
  browserSync.init({
    notify: false,
    port: 8000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/js',
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('app/js/**/*.js', ['scripts']);
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/css/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/css'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras', 'scripts1', 'scripts2', 'manifest'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', () => {
  return new Promise(resolve => {
    dev = false;
    runSequence(['clean', 'wiredep'], 'build','scripts1','scripts2', resolve);
  });
});

// index.html
gulp.task('inline11', function () {
  return gulp
    .src('./app/index.html')
    //
    .pipe(
      $.stringReplace('<link rel="stylesheet" href="css/styles.css" aync>', function(s) {
        var style = fs.readFileSync('app/css/styles.css', 'utf8');
        console.log(style);
        return '<style>' + style + '</style>';
      })
    )
    .pipe(
      $.stringReplace('<script async defer src="js/main.js"></script>', function(s) {
        var script = fs.readFileSync('.tmp/js/index-min.js', 'utf8');
        return '<script>' + script + '</script>';
      })
    )
    .pipe(
      $.stringReplace('<script type="application/javascript" charset="utf-8" src="js/register_service_worker.js"></script>', function(s) {
        var script = fs.readFileSync('.tmp/js/register_service_worker.js', 'utf8');
        return '<script>' + script + '</script>';
      })
    )
    .pipe(minify())
    .pipe(gulp.dest(".tmp/"))
    .pipe(gulp.dest("dist/"));
});

// restaurant.html
gulp.task('inline2', function () {
  return gulp
    .src('./app/restaurant.html')
    .pipe(
      $.stringReplace('<script src=js/dbhelper.min.js></script>', function(s) {
        var script = fs.readFileSync('.tmp/js/dbhelper.min.js', 'utf8');
        return '<script>' + script + '</script>';
      })
    )
    .pipe(
      $.stringReplace('<script src=js/restaurant.min.js defer></script>', function(s) {
        var script = fs.readFileSync('.tmp/js/restaurant.min.js', 'utf8');
        return '<script>' + script + '</script>';
      })
    )
    .pipe(minify())
    .pipe(gulp.dest(".tmp/"))
    .pipe(gulp.dest("dist/"));
});
