'use strict';

var container;
var camera, scene, renderer;
var controller;

var matrix, ray, reticle;

var loader = new THREE.GLTFLoader();
var model;
var modelContainer = new THREE.Group();

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

  document.body.appendChild(THREE.ARButton.createButton(renderer));

  function onSelect() {
    if (reticle.visible) {
      addObject();
    }
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  matrix = new THREE.Matrix4();

  ray = new THREE.Ray();

  reticle = new THREE.Mesh(
    new THREE.RingBufferGeometry(0.05, 0.1, 32).rotateX(- Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  scene.add(modelContainer);

  load_glTF('samples/BoxTextured.glb');

  //
  window.addEventListener('resize', onWindowResize, false);
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

function load_glTF(url) {
  console.log('Load glTF model: ' + url);

  loader.load(url, function(gltf) {
    gltf.scene.traverse(function(child) {
      /*if ( child.isMesh ) {
        child.material.envMap = envMap;
      }*/
    } );
    model = gltf.scene;

    // TODO: calc dynamically to fit
    let s = 0.1;
    model.scale.set(s, s, s);

    placeModelOnOriginPlane(model, model);
  });
}

function placeModelOnOriginPlane(model, transformObject) {
  var box = new THREE.Box3();
  box.expandByObject(model);
  var lowestY = box.min.y;
  transformObject.position.set(0, -lowestY, 0);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {
  renderer.setAnimationLoop(render);
}

async function render(timestamp, frame) {
  if (frame) {
    var referenceSpace = renderer.xr.getReferenceSpace();
    var session = renderer.xr.getSession();
    var pose = frame.getViewerPose(referenceSpace);

    if (pose) {
      matrix.fromArray(pose.transform.matrix);

      ray.origin.set(0, 0, 0);
      ray.direction.set(0, 0, - 1);
      ray.applyMatrix4(matrix);

      var xrRay = new XRRay(ray.origin, ray.direction);

      var results = await session.requestHitTest(xrRay, referenceSpace);
      if (results.length) {
        var hitResult = results[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hitResult.hitMatrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}
