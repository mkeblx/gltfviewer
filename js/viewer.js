'use strict';

var stat = document.getElementById('stat');

var scene;
var camera;
var renderer;

var container;

var controls;

var loader;
var model;
var modelContainer = new THREE.Group();

// animation
var mixer;
var clips;

var clock = new THREE.Clock(true);

// flags
var autoScale = true;
var alignToGround = true;
var autoRotate = true;

var targetSize = 1; // m

//

function init() {
  var _url = window.location.href;

  setupUI();
  setupButtons();
  setupRender();
  animate();

  loader = new THREE.GLTFLoader();
  mixer = new THREE.AnimationMixer();
  loader.setCrossOrigin('anonymous');

  if (!hasParam('url')) {
    stat.textContent = 'No URL parameter';
    return;
  }

  var url = getParam(_url, 'url');

  console.log('URL is: ' + url);

  stat.textContent = url;

  loadModel(url);
}

function resetModel() {
  if (model) {
    modelContainer.remove(model);
    model = null;
  }
}

function loadModel(url) {
  resetModel();

  if (is_glTFUrl(url)) {
    load_glTF(url);
  } else if (isPolyUrl(url)) {
    console.log('Poly model');
    var id = getPolyId(url);
    loadPoly(id);
  } else {
    console.log('unsupported');
  }
}

function setupUI() {
  var select = document.getElementById('sample-select');
  select.addEventListener('change', function(e){
    var val = event.target.value;
    if (!val) {
      resetModel();
      window.history.replaceState('', '', window.location.origin);
      return;
    }
    loadModel(val);
    window.history.replaceState('', '', window.location.origin +  '?url=' + val);
  });
}

function setupButtons() {
  var arBtn = document.getElementById('enter-ar');
  var vrBtn = document.getElementById('enter-vr');

  arBtn.addEventListener('click', function(e){
    this.classList.toggle('selected');
    enterAR();
  });
  vrBtn.addEventListener('click', function(e){
    this.classList.toggle('selected');
    enterVR();
  });
}

function enterAR() {
  console.log('enter AR');
}

function initAR(display) {
  console.log('init AR');

  if (!display) {
    console.log('no AR display');
    return;
  }
}

function enterVR() {
  console.log('enter VR');

}

function hasParam(key) {
  var url = new URL(window.location.href);
  return url.searchParams.has(key);
}

function getParam(url, key) {
  var url = new URL(url);
  var value = url.searchParams.get(key);
  if (value === null)
    return null;
  value = decodeURIComponent(value);
  return value;
}

// getParam wasn't working on WebARonARCore, Chromium 57
// probably due to URL support
function _getParam(url, key) {
  var query = location.search;
  var params = {};
  query = query.slice(1); // remove '?'
  var _params = query.split('&');
  for (var i = 0; i < _params.length; i++) {
    var _param = _params[i];
    var parts = _param.split('=');
    params[parts[0]] = decodeURIComponent(parts[1]);
  }
  console.log(params);
  return params[key];
}

function is_glTFUrl(url) {
  return url.endsWith('.gltf') || url.endsWith('.glb');
}

// load glTF .glb
function load_glTF(url) {
  console.log('Load glTF model: ' + url);

  loader.load(url, function(gltf) {
    gltf.scene.traverse(function(child) {
      /*if ( child.isMesh ) {
        child.material.envMap = envMap;
      }*/
    } );
    model = gltf.scene;
    clips = gltf.animations || [];
    console.log(clips);

    if (autoScale) {
      scaleModelToFit(model, targetSize);
    }

    if (alignToGround) {
      placeModelOnOriginPlane(model, modelContainer);
    }

    modelContainer.add(model);
  });
}

// TODO: make more robust
function scaleModelToFit(model, targetDimension) {
  var box = new THREE.Box3();
  box.expandByObject(model);
  var hSize = Math.abs(box.min.y - box.max.y);
  console.log(hSize);
  let s = targetDimension / hSize;
  console.log(s);
  model.scale.set(s, s, s);
}

function placeModelOnOriginPlane(model, transformObject) {
  var box = new THREE.Box3();
  box.expandByObject(model);
  var lowestY = box.min.y;
  transformObject.position.set(0, -lowestY, 0);
}

function isPolyUrl(url) {
  return (url.includes('poly'));
}

// format: https://poly.google.com/view/ID
function getPolyId(url) {
  var parts = url.split('/');
  var id = parts[parts.length-1];
  return id;
}

function loadPoly(id) {
  console.log('Load Poly model: ' + id);
}

function setupRender() {
  container = document.getElementById('container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x303030);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

  camera.position.z = 5;
  camera.position.y = 3;

  var light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add( light );

  light = new THREE.HemisphereLight(0xbbbbff, 0x444422);
  light.position.set(0, 1, 0);
  scene.add( light );
  light = new THREE.DirectionalLight(0xffffff);
  light.position.set(-10, 6, 10);
  scene.add( light );

  renderer = new THREE.WebGLRenderer({
    antialias: false
  });
  renderer.xr.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);


  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  window.addEventListener('resize', onWindowResize, false);

  document.body.appendChild(THREE.ARButton.createButton(renderer));

  var polarGridHelper = new THREE.PolarGridHelper(3, 16, 8, 64, 0xffffff, 0x808080);
  scene.add(polarGridHelper);

  scene.add(modelContainer);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(t) {
  window.requestAnimationFrame(animate);

  var dt = clock.getDelta();

  update(t, dt);
  render();
}

function update(t, dt) {
  if (autoRotate) {
    modelContainer.rotation.y += 0.003;
  }

  if (model && mixer) {
    mixer.update(dt);
  }
}

function render() {
  renderer.render(scene, camera);
}

init();
