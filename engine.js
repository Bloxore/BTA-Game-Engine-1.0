//Constants
WIDTH = 640;
HEIGHT = 480;

//Engine variables
let _canvas;
let _ctx;
let currentState = null;
let objectID = 0;

let assetID = 0;
let _queuedAssets = [];
let graphics = {};
let json = {};

let camera = {
  x: 0,
  y: 0,
  follow: null,
  zoom: 1,
}

//Deltatime tracker
let _lastTime = Date.now();
/* Should be this if the game is running at 60fps */
let deltaTime = 1;
let timeGap = 0;

//Engine functions
let engineInit = (state, canvasElement) => {
  if (canvasElement) {
    _canvas = canvasElement;
  } else {
    _canvas = document.createElement("CANVAS");
    document.getElementById("game").appendChild(_canvas);
  }


  _canvas.width = WIDTH;
  _canvas.height = HEIGHT;

  _ctx = _canvas.getContext("2d");
  /*Pixel Perfect*/
  _ctx.imageSmoothingEnabled = false;

  //Input setup (should be replaced with addEventListener later)
  inputSetup();

  switchState(state);

  engineLoop();
}

let engineLoop = () => {
  requestAnimationFrame(engineLoop);

  /* Calculate deltatime */
  deltaTime = (Date.now() - _lastTime)/(1000/60);
  timeGap = Date.now() - _lastTime;
  _lastTime = Date.now();

  //Don't update the state if it isn't loaded...
  if (_queuedAssets.length == 0) {
    currentState.update();
  }

  //Clear the screen
  _ctx.clearRect(0, 0, WIDTH, HEIGHT);

  //Iterate through state's members and draw them
  for (let i = 0; i < currentState._members.length; i++) {
    //Physics and whatnot
    if (currentState._members[i].preupdate)
      currentState._members[i].preupdate();

    if (currentState._members[i].update)
      currentState._members[i].update();

    if (currentState._members[i] && currentState._members[i]._memberUpdate)
        currentState._members[i]._memberUpdate();

    //Check if member has been removed during its update
    if (currentState._members[i] && currentState._members[i].draw) {
      //Offset object to match camera
      currentState._members[i].x -= camera.x * currentState._members[i].cameraAdherence.x;
      currentState._members[i].y -= camera.y * currentState._members[i].cameraAdherence.y;

      //Camera zoom
      if (camera.zoom != 1) {
        _ctx.translate(WIDTH / 2, HEIGHT / 2);
        _ctx.scale(camera.zoom, camera.zoom);
        _ctx.translate(-(WIDTH / 2), -(HEIGHT / 2));
      }

      currentState._members[i].draw(_ctx);

      if (currentState._members[i]._memberDraw)
        currentState._members[i]._memberDraw(_ctx);

      //Reset zoom
      if (camera.zoom != 1) {
        _ctx.translate(WIDTH / 2, HEIGHT / 2);
        _ctx.scale(1/camera.zoom, 1/camera.zoom);
        _ctx.translate(-(WIDTH / 2), -(HEIGHT / 2));
      }

      //Reset object's position
      currentState._members[i].x += camera.x * currentState._members[i].cameraAdherence.x;
      currentState._members[i].y += camera.y * currentState._members[i].cameraAdherence.y;
    }
  }

  //Post object draw (for any special things)
  currentState.draw(_ctx);

  //Then finally the FX
  fxDraw();

  //Post Everything
  if (input.mouse)
    input.mouse.click = false;
}

//Specifically for loading graphics
let loadGraphicAsset = (src, key, tileWidth, tileHeight) => {
  //Don't load what's already been loaded
  if (graphics[key])
    return;

  let asset = {};
  asset.img = document.createElement("IMG");
  asset.img.src = src;

  //Internal ID to keep track of asset
  asset.ID = assetID++;

  //Name for external reference
  asset.key = key;

  //Preloaded attributes
  asset.loaded = false;

  asset.width = null;
  asset.height = null;
  asset.tileWidth = null;
  asset.tileHeight = null;

  _queuedAssets.push(asset);

  //Set param attributes
  if (tileWidth)
    asset.tileWidth = tileWidth;

  if (tileHeight)
    asset.tileHeight = tileHeight;

  if (asset.img.complete) {
    loadedListener();
  } else {
    asset.img.addEventListener("load",loadedListener);
  }

  function loadedListener() {
    asset.loaded = true;

    asset.width = asset.img.width;
    asset.height = asset.img.height;

    if (asset.tileWidth == null)
      asset.tileWidth = asset.width;

    if (asset.tileHeight == null)
      asset.tileHeight = asset.height;

    //Remove asset from queued list into ready list
    for (let i = 0; i < _queuedAssets.length; i++) {
      if (_queuedAssets[i].ID == asset.ID)
        _queuedAssets.splice(i, 1);
    }
    graphics[key] = asset;

    //If no more assets are loading, emit an event
    if (_queuedAssets.length == 0)
      document.dispatchEvent(new Event("assetsFinishedLoading"));
  }
}

let loadJSON = (key, src) => {
  //Don't load what's already loaded
  if (json[key])
    return;

  let xHttp = new XMLHttpRequest();

  xHttp.open("GET", src, true);

  xHttp.onreadystatechange = () => {
    if (xHttp.readyState == 4 && xHttp.status == 200) {
      json[key] = JSON.parse(xHttp.responseText);
    } else if (xHttp.status != 200) {
      console.log("Error: ", xHttp.readyState, xHttp.statusText);
    }
  }

  xHttp.send();
}

//TODO: Add option for state stack
let switchState = (state) => {
  //Clear all key events
  input.onKeyDown();

  if (currentState)
    currentState._destroy();

  currentState = state;
  /*If there are assets to load wait until they finish
  to initialize state*/
  currentState.preload();
  if (_queuedAssets.length > 0) {
    function doneLoading() {
      document.removeEventListener("assetsFinishedLoading", doneLoading);
      currentState.init();
    }
    document.addEventListener("assetsFinishedLoading", doneLoading);
  } else {
    currentState.init();
  }
}

//Globally abstract add / remove functions
let add = (object) => {
  object.ID = objectID++;
  currentState._members.push(object);

  return object;
}

let remove = (object) => {
  //Locate object to remove by its ID and splice it
  for (let i = 0; i < currentState._members.length; i++) {
    if (currentState._members[i].ID == object.ID) {
      currentState._members.splice(i, 1);
    }
  }

  return object;
}

//Helper functions
let degToRad = (deg) => {
  return (deg/360)*(Math.PI*2);
}

// Basic animation function
/*
  Options:
    time - milliseconds to complete the animation
    callback - function called after animation finishes
    progress - function called each frame during animation
*/
function animate(object, valueName, endValue, options) {
  let time = 1000;
  if (options.time) {
    time = options.time;
  }

  let initalValue = object[valueName];
  let increment = (endValue - initalValue) / ((time/1000)*60);
  let overflow = 0;
  if (initalValue > endValue) {
    overflow = 1;
  }

  add(Timer(time, {
    callback: () => {
      //Finish animation
      object[valueName] = endValue;

      //If there's a callback, do it
      if (options.callback) {
        options.callback();
      }
    },
    progress: () => {
      if (options.progress)
        options.progress();

      object[valueName] += increment * deltaTime;
      if (overflow == 0 && object[valueName] > endValue) {
        object[valueName] = endValue;
      } else if (overflow == 1 && object[valueName] < endValue) {
        object[valueName] = endValue;
      }
    }
  }));
};

//Returns whether two objects overlap
function overlap(obj1, obj2) {
  return (obj1.x + obj1.boundingBox.x + obj1.boundingBox.width > obj2.x + obj2.boundingBox.x && obj1.x + obj1.boundingBox.x < obj2.x + obj2.boundingBox.x + obj2.boundingBox.width && obj1.y + obj1.boundingBox.y + obj1.boundingBox.height > obj2.y + obj2.boundingBox.y && obj1.y + obj1.boundingBox.y < obj2.y + obj2.boundingBox.y + obj2.boundingBox.height);
}

//Returns an array of all objects that overlap with the passed obj
//Takes an optional flag to narrow search formating [prop, value]
function proximitySearch(obj, flag) {
  let result = [];
  if (flag && flag.length < 2) {
    throw "Flag parameter is formatted incorrectly. Must be [property<str>, value<*>]";
  }
  for (let i = 0; i < currentState._members.length; i++) {
    //If there is a flag make sure only the flagged objects get tested
    if (flag) {
      //Make sure object has flag, then test to make sure it matches value
      if (currentState._members[i][flag[0]] && currentState._members[i][flag[0]] == flag[1]) {
        //Finally check overlap
        if (overlap(obj, currentState._members[i])) {
          result.push(currentState._members[i]);
        }
      }
    } else {
      //No flag; every object gets checked
      if (overlap(obj, currentState._members[i])) {
        result.push(currentState._members[i]);
      }
    }
  }

  return result;
}

//Returns whether an obj is clicked
function isClicked(obj) {
  return (input.mouse.x > obj.x && input.mouse.x < obj.x + obj.width && input.mouse.y > obj.y && input.mouse.y < obj.y + obj.height && input.mouse.click);
}

function shake(obj, options) {
  let magnitude = 1;
  let time = 200;
  let callback;

  let originXY = [obj.x, obj.y];

  if (options) {
    if (options.magnitude)
      magnitude = options.magnitude;

    if (options.time)
      time = options.time;

    if (options.callback)
      callback = options.callback;
  }

  add(Timer(time, {
    progress: () => {
      if (obj.velocity) {
        originXY[0] += obj.velocity.x * deltaTime;
        originXY[1] += obj.velocity.y * deltaTime;
      }
      obj.x = originXY[0] + Math.random()*(magnitude*2) - magnitude;
      obj.y = originXY[1] + Math.random()*(magnitude*2) - magnitude;
    },
    callback: () => {
      obj.x = originXY[0];
      obj.y = originXY[1];

      if (callback)
        callback();
    },
  }));
}

function sort(obj) {
  let srtMem;

  //Check whether to sort state or obj
  if (obj && obj._members)
    srtMem = obj._members;
  else
    srtMem = currentState._members;


  //Merge sort (needs to be a separate functions)
  srtMem = mergeSort(srtMem)

  //Return members to state or object
  if (obj && obj._members)
   obj._members = srtMem;
  else
   currentState._members = srtMem;
}

function mergeSort(arr) {
  if (arr.length == 1)
    return arr;


  let a = mergeSort(arr.slice(0,arr.length/2));
  let b = mergeSort(arr.slice(arr.length/2,arr.length));

  let i = 0;
  let j = 0;

  for (let k=0;k<arr.length; k++) {
    /* Second clause because a[i] < b[j] will evaluate false if b[j] == undefined
    which would result in "arr[k] = undefined;" in the else statement*/
    if (((a[i] && b[j]) && a[i].zIndex < b[j].zIndex) || b[j] === undefined) {
      arr[k] = a[i];
      i++;
    } else {
      arr[k] = b[j];
      j++;
    }
  }
  return arr;
}
