const { src, dest } = require('gulp');

function defaultTask() {
  src('node_modules/three/build/three.js')
    .pipe(dest('js'));
  return src('node_modules/three/examples/js/loaders/GLTFLoader.js')
    .pipe(dest('js'));
}

exports.default = defaultTask;
