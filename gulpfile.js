const { src, dest } = require('gulp');

var files = [
  'three/build/three.js',
  'three/examples/js/loaders/GLTFLoader.js',
  'three/examples/js/controls/OrbitControls.js'];

function defaultTask(cb) {
  files.forEach(file => {
    return src('node_modules/'+file).pipe(dest('js/lib'))
  });
  cb();
}

exports.default = defaultTask;
