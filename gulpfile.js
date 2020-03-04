const { src, dest } = require('gulp');

var files = [
  'three/build/three.js',
  'three/examples/js/loaders/GLTFLoader.js'];

function defaultTask(cb) {
  files.forEach(file => {
    return src('node_modules/'+file).pipe(dest('js'))
  });
  cb();
}

exports.default = defaultTask;
