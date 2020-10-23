const { src, dest, series, task } = require('gulp');
// const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const htmlmin = require('gulp-htmlmin');
const zip = require('gulp-zip');
const concat = require('gulp-concat');

function background(done){
    src(['js/jquery-3.4.1.min.js', 'js/utils.js', 'js/api.js', 'background/background.js'])
    .pipe(concat('background.js'))
    .pipe(uglify({
        mangle:true
    }))
    .pipe(dest("output/background"));

    src('background/*.html')
    .pipe(htmlmin({
        collapseWhitespace: true,
        removeComments: true
    }))
    .pipe(dest("output/background"));

    done()
}

function content_script(done){
    src(['js/jquery-3.4.1.min.js', 'js/api.js', 'content/upload-match-data.js', 'content/checkenv.js', 'content/monitor.js', 'content/content-script.js'])
    .pipe(concat('content-script.js'))
    .pipe(uglify({
        mangle:true
    }))
    .pipe(dest("output/content"));
    done()
}

function copy(done){
    src(['images/*'])
    .pipe(dest("output/images"));

    src(['popup/*', 'popup/*/**'])
    .pipe(dest("output/popup"));

    src('manifest.json')
    .pipe(dest("output/"));

    done()
}

function compress(done){
    src(['output/*', 'output/*/**'])
    .pipe(zip('bet.zip'))
    .pipe(dest("dist/"));

    done()
}

exports.build = series(background, content_script, copy);
exports.zip = series(background, content_script, copy, compress);