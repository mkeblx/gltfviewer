'use strict';

var container;
var camera, scene, renderer;
var controller;

var reticle;

var loader = new THREE.GLTFLoader();
var model;
var modelContainer = new THREE.Group();

var hitTestSource;
var hitTestSourceRequested = false;


// settings
var scaleReticle = false; // scale based on hit test distance


init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(THREE.ARButton.createButton(renderer, {requiredFeatures: ['hit-test']}));

  var geometry = new THREE.CylinderBufferGeometry(0.1, 0.1, 0.2, 32).translate(0, 0.1, 0);

  function onSelect() {
    if (reticle.visible) {
      addObject();
    }
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  reticle = new THREE.Mesh(
    new THREE.RingBufferGeometry(0.05, 0.1, 32).rotateX(- Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  scene.add(modelContainer);

  load_glTF('samples/BoxTextured.glb');

  window.addEventListener('resize', onWindowResize, false);
}

function load_glTF(url) {
  console.log('Load glTF model: ' + url);

  loader.load(url, function(gltf) {
    gltf.scene.traverse(function(child) {
      /*if ( child.isMesh ) {
        child.material.envMap = envMap;
      }*/
    } );
    model = gltf.scene;

    scaleModelToFit(model, 0.1);
  });
}

function getObject() {
  var geometry = new THREE.CylinderBufferGeometry(0.05, 0.05, 0.2, 32).translate(0, 0.1, 0);
  var material = new THREE.MeshPhongMaterial({ color: 0xffffff * Math.random() });
  var mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function addObject() {
  var mesh;
  if (!model) {
    mesh = getObject();
  } else {
    mesh = model;
  }

  modelContainer.position.setFromMatrixPosition(reticle.matrix);
  modelContainer.add(mesh);
}

function scaleModelToFit(model, targetDimension) {
  var box = new THREE.Box3();
  box.expandByObject(model);
  var hSize = Math.abs(box.min.y - box.max.y);
  console.log(hSize);
  let s = targetDimension / hSize;
  console.log(s);
  model.scale.set(s, s, s);
}

function getHitTestLength(hit, space) {
  var length = 1;
  var matrix = hit.getPose(referenceSpace).transform.matrix;
  return length;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {

  if (frame) {
    var referenceSpace = renderer.xr.getReferenceSpace();
    var session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace('viewer').then(function(referenceSpace) {
        session.requestHitTestSource({space: referenceSpace}).then(function(source) {
          hitTestSource = source;
        } );
      } );

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      var hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {
        var hit = hitTestResults[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

        if (scaleReticle) {
          var len = getHitLength(hit, referenceSpace);
          var s = len * Math.pow(1, len);
          reticle.scale.set(sc, sc, s);
        }

      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}

