'use strict';

var stat = document.getElementById('stat');

var scene;
var camera;
var renderer;

var container;

var controls;

var model;

var vrDisplay;

function init() {
  var _url = window.location.href;

  setupUI();
  setupButtons();
  setupRender();
  animate();

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
    scene.remove(model);
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

  vrDisplay = display;
  console.log(display);
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
  console.log('Load glTF model');

  var loader = new THREE.GLTFLoader();
  loader.load( url, function ( gltf ) {
      gltf.scene.traverse( function ( child ) {
        /*if ( child.isMesh ) {
          child.material.envMap = envMap;
        }*/
      } );
      // special case for planets: remove later
      if (gltf.scene.children.length > 1 && gltf.scene.children[1].name === 'Orbit') {
        model = gltf.scene.children[1];
      } else {
        model = gltf.scene;
      }
      console.log(gltf);
      scene.add( model );
    } );

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
  container = document.getElementById( 'container' );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x303030 );
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );

  camera.position.z = 5;
  camera.position.y = 3;

  var light = new THREE.AmbientLight( 0x404040 ); // soft white light
  scene.add( light );

  light = new THREE.HemisphereLight( 0xbbbbff, 0x444422 );
  light.position.set( 0, 1, 0 );
  scene.add( light );
  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( -10, 6, 10 );
  scene.add( light );

  renderer = new THREE.WebGLRenderer({
    antialias: false
  });
  renderer.xr.enabled = true;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );


  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.target.set( 0, 0, 0 );
  controls.update();

  window.addEventListener( 'resize', onWindowResize, false );

  document.body.appendChild( THREE.ARButton.createButton( renderer ) );

  var polarGridHelper = new THREE.PolarGridHelper( 3, 16, 8, 64, 0xffffff, 0x808080 );
  scene.add( polarGridHelper );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate(t) {
  window.requestAnimationFrame( animate );

  update(t);
  render(t);
}

function update(t) {
  if (model)
    model.rotation.y += 0.003;
}

function render(t) {
  renderer.render( scene, camera );
}

init();
