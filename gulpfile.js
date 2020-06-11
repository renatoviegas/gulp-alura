const { task, parallel, series, src, dest, watch } = require('gulp');
const imagemin = require('gulp-imagemin');
const clean = require('gulp-clean');
const uglify = require('gulp-uglify');
const usemin = require('gulp-usemin');
const cssmin = require('gulp-cssmin');
const browserSync = require('browser-sync');
const jshint = require('gulp-jshint');
const jshintStylish = require('jshint-stylish');
const csslint = require('gulp-csslint');
const autoprefixer = require('gulp-autoprefixer');
const less = require('gulp-less');
const purgecss = require('gulp-purgecss');
const reader = require('file-reader');

const __SRC = 'src';
const __DEST = 'dist';
const __JS_LINT_IGNORE = '.jslintignore';
const __CSS_LINT_IGNORE = '.csslintignore';

function clear() {
  return src(__DEST, { allowEmpty: true }).pipe(clean());
}

function copy() {
  return src(`${__SRC}/**/*`).pipe(dest(__DEST));
};

function compressImages() {
  return src(`${__DEST}/img/**/*`).pipe(imagemin()).pipe(dest(`${__DEST}/img`));
};

function minify() {
  return src(`${__DEST}/**/*.html`)
    .pipe(usemin({
      'js': [uglify],
      'css': [autoprefixer, cssmin]
    }))
    .pipe(dest(__DEST));
}

function purgeCSS() {
  return src(`${__DEST}/**/*.css`)
    .pipe(purgecss({
      content: [`${__DEST}/**/*.html`]
    }))
    .pipe(dest(__DEST));
}

function removeCSSNotMinify() {
  return src([`${__DEST}/**/*.css`, `!${__DEST}/**/*.min.css`])
    .pipe(clean());
}

function removeJSNotMinify() {
  return src([`${__DEST}/**/*.js`, `!${__DEST}/**/*.min.js`])
    .pipe(clean());
}

function server() {
  browserSync.init({
    server: {
      baseDir: __DEST
    }
  });

  watch(`${__SRC}/js/*.js`).on('change', function (path) {
    src(path)
      .pipe(jshint())
      .pipe(jshint.reporter(jshintStylish));
  });

  csslint.addFormatter('csslint-stylish');

  watch(`${__SRC}/css/*.css`).on('change', function (path) {
    src(path)
      .pipe(csslint())
      .pipe(csslint.formatter('stylish'));
  });

  watch(`${__SRC}/less/*.less`).on('change', function (path) {
    src(path)
      .pipe(less().on('error', error => console.log(error.message)))
      .pipe(dest(`${__SRC}/css`));
  });

  watch(`${__SRC}/**/*`).on('change', browserSync.reload);
}

function jsLint() {
  const ignoreList = getFileListIgnore(__JS_LINT_IGNORE);

  return src([`${__SRC}/js/*.js`, `!${ignoreList}`])
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish));
}

function cssLint() {
  const ignoreList = getFileListIgnore(__CSS_LINT_IGNORE);

  csslint.addFormatter('csslint-stylish');

  return src([`${__SRC}/css/*.css`, `!${ignoreList}`])
    .pipe(csslint())
    .pipe(csslint.formatter('stylish'));
}

const getFileListIgnore = file => {
  try {
    return reader.file(file).trim().split('\n');
  } catch (e) {
    console.log(`"${file}" not found...`);
    return '';
  }
};

module.exports = {
  'server': server,
  'lint': series(jsLint, cssLint),
  'default': series(clear, copy, parallel(compressImages, series(purgeCSS, minify, parallel(removeCSSNotMinify, removeJSNotMinify))))
}