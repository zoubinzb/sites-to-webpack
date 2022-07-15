const { src, dest, parallel } = require('gulp');
// const pug = require('./buildPug');
const pug = require("gulp-pug");
const less = require('gulp-less');
const minifyCSS = require('gulp-csso');
const concat = require('gulp-concat');


function html() {
  return src('template/*.pug')
    // .pipe(pug("123"))
    .pipe(pug())
    .pipe(dest('build/html'))
}

function css() {
  return src('template/*/*.css')
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(dest('build/css'))
}

function js() {
  return src('template/static/js/*.js', { sourcemaps: true })
    .pipe(concat('app.min.js'))
    .pipe(dest('build/js', { sourcemaps: true }))
}

exports.js = js;
exports.css = css;
exports.html = html;
exports.default = parallel(html, css, js);