const gulp = require('gulp');
const gulpIf = require('gulp-if');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const htmlmin = require('gulp-htmlmin');
const cssmin = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const fileinclude = require('gulp-file-include');
// const babel = require('gulp-babel');

const imagemin = require('gulp-imagemin');
// const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const htmlPartial = require('gulp-html-partial');
const clean = require('gulp-clean');
// const googleWebFonts = require( 'gulp-google-webfonts' );
const cssbeautify = require('gulp-cssbeautify');
const htmlbeautify = require('gulp-html-beautify');
const isProd = true; // process.env.NODE_ENV === 'prod';
const useref = require('gulp-useref');
const babel = require('gulp-babel');
const cache = require('gulp-cached');
const rev = require('gulp-rev');
const revReplace = require('gulp-rev-replace');

const htmlFile = [
    'src/pages/*.html'
];
const isHTMLFile = function (file) {
    return /(?:\.([^.]+))?$/.exec(file.path)[0] === '.html';
};

const isJSFile = function (file) {
    return /(?:\.([^.]+))?$/.exec(file.path)[0] === '.js';
};

const isCSSFile = function (file) {
    return /(?:\.([^.]+))?$/.exec(file.path)[0] === '.css';
};

const isJSorCSS = function (file) {
    return isJSFile(file) || isCSSFile(file);
};

const isNotVendorJS = function (file) {
    return isJSFile(file) && !file.path.includes('vendor.bundle.js');
};

function html() {
    return gulp.src(htmlFile)
        .pipe(cache('html'))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file',
            context: {
                active: '',
                preferCDN: false
            }
        }))
        .pipe(htmlbeautify())
        .pipe(useref())
        .pipe(gulpIf(isNotVendorJS, babel({
            compact: false,
            presets: [['@babel/preset-env', {modules: false, 'targets': {
                'chrome': '58',
                'ie': '11'
            }}]]
        })))
        .pipe(gulpIf(isNotVendorJS, uglify()))
        .pipe(gulpIf(isHTMLFile, htmlmin({
            collapseWhitespace: true
        })))
        .pipe(gulpIf(isJSorCSS, rev())) 
        .pipe(revReplace())
        .pipe(gulp.dest('dist'));
}

function css() {
    return gulp.src('./src/assets/scss/**/*.scss')
        .pipe(gulpIf(!isProd, sourcemaps.init()))
        .pipe(sass({
            includePaths: ['node_modules']
        }).on('error', sass.logError))
        .pipe(cssbeautify({
            indent: '    ',
            openbrace: 'separate-line',
            autosemicolon: true
        }))
        .pipe(gulpIf(!isProd, sourcemaps.write()))
        .pipe(gulpIf(isProd, cssmin()))
        .pipe(gulp.dest('dist/assets/css/'));
}

function img() {
    return gulp.src('src/assets/images/**/*')
        /* .pipe(gulpIf(isProd, imagemin())) */
        .pipe(gulp.dest('dist/assets/images/'));
}

function fonts() {
    return gulp.src('src/assets/fonts/*.{eot,svg,ttf,woff,woff2}')
        .pipe(gulp.dest('dist/assets/fonts/'));
}

function fontAwesome() {
    return gulp.src('./node_modules/@fortawesome/**/*')
        .pipe(gulp.dest('dist/assets/vendor/'));
}


function serve() {
    browserSync.init({
        open: true,
        notify: true,
        server: './dist'
    });
}

function browserSyncReload(done) {
    browserSync.reload();
    done();
}


function watchFiles() {
    gulp.watch('src/pages/**/*.html', gulp.series(html, browserSyncReload));
    gulp.watch('src/partials/**/*.html', gulp.series(html, browserSyncReload));
    gulp.watch('src/assets/**/*.scss', gulp.series(css, browserSyncReload));
    gulp.watch('src/assets/**/*.js', gulp.series(html, browserSyncReload));
    gulp.watch('src/assets/images/**/*', gulp.series(img));
    gulp.watch('src/assets/**/*.{eot,svg,ttf,woff,woff2}', gulp.series(fonts));
    gulp.watch('src/assets/vendor/**/*.*', gulp.series(fontAwesome));

    return;
}

function del() {
    return gulp.src('dist/*', {read: false})
        .pipe(clean());
}

exports.css = css;
exports.html = html;
exports.fonts = fonts;
exports.fontAwesome = fontAwesome;
exports.img = img;
exports.del = del;
exports.serve = gulp.series(
    gulp.parallel(html, css, img, fonts, fontAwesome), 
    gulp.parallel(serve, watchFiles)
);
exports.default = gulp.series(del, html, css, fonts, img, fontAwesome);
exports.build = gulp.parallel(html, css, fonts, img);