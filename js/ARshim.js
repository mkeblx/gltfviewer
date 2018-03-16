/*
ARshim adds support for launching 3D models into a native AR Viewer plugin

Goes through page and finds content links, modifying to invoke Android app intent to Viewer
 */

/*
TODO:
-give visual indicator
-add check if device supports ARCore
---Android N + supported device
--if have ARViewer package installed?
--minimum Android version
-polyfill: add WebGL backup if no native support
-additional 'VR' mode: 3D model viewer
--rethink as XR Viewer + pages
-show browser overlay box when objects found
--like Video Assistant extension
*/

(function(){

var version = 0.1;

var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf('android') > -1;
var isMobile = ua.indexOf('mobile') > -1;
var isSI = (ua.indexOf('samsungbrowser') > -1 && isMobile);

function androidVersion() {
  var match = ua.match(/android\s([0-9\.]*)/);
  return match ? parseFloat(match[1]) : false;
}

// Android N +
function supportsARCore() {
  const ARCORE_VERSION_MIN = 7.0; // N
  var OSSupport = androidVersion() >= ARCORE_VERSION_MIN;
  var deviceValid = true; // TODO: fill out
  return OSSupport && deviceValid;
}

function init() {
  console.log('ARShim: v'+version);
  console.log('isSI: ' + isSI);
  console.log('android: ' + androidVersion());
  console.log('ARCore support: ' + supportsARCore());

  if (!supportsARCore()) {
    // console.log('Exiting processing... does not support Android/ARCore');
    //return;
  }
}

function process() {
  console.log('process');
  // process
  // TODO: modify selector
  var els = document.querySelectorAll('a[data-model]');

  // modify links
  for (var i = 0; i < els.length; i++) {
    var el = els[i];

    var data = {};
    data.href = el.getAttribute('href');
    // data.id = data.href.split('/').pop(); Poly
    data.scale = el.getAttribute('data-scale');

    var intentUrl;
    if (hasParam('webar')) {
      let params = {};
      if (data.scale)
        params['scale'] = data.scale;
      let url = createViewerUrl(data.href, params, false);
      intentUrl = createWebARIntentURI(url);
    } else {
      intentUrl = createARViewerIntentURI(data.href + '?scale=' + data.scale);
    }
    data.intentUrl = intentUrl;

    console.log(data);

    // TODO: move outside loop
    if (supportsARCore()) {
      el.setAttribute('href', intentUrl);
    } else if (hasParam('webar')) {
      el.setAttribute('href', createViewerUrl(data.href, { scale: data.scale }, true));
    } else {
      el.onclick = function(){
          alert('On supported Android setup will launch AR view');
          return false;
        };
    }
  }
}

function hasParam(key) {
  var url = new URL(window.location.href);
  return url.searchParams.has(key);
}

var site = 'https://mkeblx.github.io/ARpages/';
function createViewerUrl(modelUrl, params, relative) {
  var queryStringParts = [];
  queryStringParts.push( 'url=' + encodeURIComponent(modelUrl) );
  for (let key in params) {
    queryStringParts.push( key + '=' + encodeURIComponent(params[key]) );
  }
  url = 'viewer.html?' + queryStringParts.join('&');
  if (!relative) {
    url = site + url;
  }
  return url;
}


const ARVIEWER_PACKAGE = 'com.sec.android.app.sbrowser.arviewer';
const ARVIEWER_SCHEME = 'arviewer';
const POLY_DOMAIN = 'poly.google.com/view';

const WEBAR_PACKAGE = 'org.chromium.android_webview.shell';
const WEBAR_SCHEME = 'webar';

var useFallbackUrl = false;

// format:
// intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end
// intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;S.browser_fallback_url=http%3A%2F%2Fzxing.org;end
function createIntentURI(url, scheme, package) {
  var _url = url.replace(/^https?:\/\//,'');
  var uri = 'intent://'+_url+'#Intent;scheme='+scheme+';package='+package+';end';
  if (useFallbackUrl) {
    var encodedUri = encodeURI(uri);
    uri += 'S.browser_fallback_url='+encodedUri;
  }
  return uri;
}

function createARViewerIntentURI(url) {
  return createIntentURI(url, ARVIEWER_SCHEME, ARVIEWER_PACKAGE);
}

// for WebARonARCore chromium build
// https://github.com/google-ar/WebARonARCore
function createWebARIntentURI(url) {
  return createIntentURI(url, WEBAR_SCHEME, WEBAR_PACKAGE);
}

window.createIntentURI = createIntentURI;
window.createWebARIntentURI = createWebARIntentURI;
window.createARViewerIntentURI = createARViewerIntentURI;

init();
window.onload = process;

})();