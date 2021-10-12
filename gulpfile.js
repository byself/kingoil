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
    .pipe(dest("bet/background"));

    src('background/*.html')
    .pipe(htmlmin({
        collapseWhitespace: true,
        removeComments: true
    }))
    .pipe(dest("bet/background"));

    done()
}

function content_script(done){
    src(['js/jquery-3.4.1.min.js', 'js/api.js', 'content/upload-match-data.js', 'content/checkenv.js', 'content/monitor.js', 'content/content-script.js'])
    .pipe(concat('content-script.js'))
    .pipe(uglify({
        mangle:true
    }))
    .pipe(dest("bet/content"));
    done()
}

function copy(done){
    src(['images/*'])
    .pipe(dest("bet/images"));

    src(['popup/*', 'popup/*/**'])
    .pipe(dest("bet/popup"));

    src('manifest.json')
    .pipe(dest("bet/"));

    done()
}

function compress(done){
    src(['bet/*', 'bet/*/**'])
    .pipe(zip('bet.zip'))
    .pipe(dest("./"));

    done()
}

exports.build = series(background, content_script, copy);
exports.zip = compress;