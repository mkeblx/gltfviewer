'use strict';

const path = require('path');
const fs = require('fs');
var express = require('express');
var app = express();

const dir = path.join(__dirname, '.');

const PORT = process.env.PORT || 8000;

app.set('json spaces', 2);
app.use(express.static( dir ));
app.use(express.json());

app.get('/js/three.js', function(req, res) {
  res.sendFile(__dirname + '/node_modules/three/build/three.js');
});

function isLocalhost(ip) {
  return (ip == 'localhost' || ip == '0.0.0.0' || ip == '::1');
}

app.listen(PORT, function() {
    console.log(`Listening on http://localhost:${PORT}`);
});
