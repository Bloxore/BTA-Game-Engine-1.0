let _keyDownCallbacks = {};
let input = {
  keys: {},
  mouse: {
    x: 0,
    y: 0,
    down: false,
    click: false,
    up: false
  },
  keyBindings: {
    up: "w",
    down: "s",
    left: "a",
    right: "d",
    action: " ",
    inventory: "e",
  },
  onKeyDown: (key, callback) => {
    if (!key) {
      _keyDownCallbacks = {};

    } else if (!callback) {
      _keyDownCallbacks[key] = [];
    } else {
      //Check if there are callbacks already
      if (_keyDownCallbacks[key]) {
        _keyDownCallbacks[key].push(callback);
      } else {
        _keyDownCallbacks[key] = [callback];
      }
    }
  },
}

function inputSetup() {
  //Desktop mouse input
  _canvas.onmousemove = (e) => {
    let rect = _canvas.getBoundingClientRect();
    input.mouse.x = Math.round((e.clientX-rect.left)/(rect.right-rect.left)*(_canvas.width));
    input.mouse.y = Math.round((e.clientY-rect.top)/(rect.bottom-rect.top)*(_canvas.height));
  }
  _canvas.onmousedown = (e) => {
    let rect = _canvas.getBoundingClientRect();
    input.mouse.x = Math.round((e.clientX-rect.left)/(rect.right-rect.left)*(_canvas.width));
    input.mouse.y = Math.round((e.clientY-rect.top)/(rect.bottom-rect.top)*(_canvas.height));
    input.mouse.down = true;
    input.mouse.click = true;
    input.mouse.up = false;
  }
  _canvas.onmouseup = (e) => {
    let rect = _canvas.getBoundingClientRect();
    input.mouse.x = Math.round((e.clientX-rect.left)/(rect.right-rect.left)*(_canvas.width));
    input.mouse.y = Math.round((e.clientY-rect.top)/(rect.bottom-rect.top)*(_canvas.height));
    input.mouse.down = false;
    input.mouse.up = true;
  }
  //Mobile touch input
  _canvas.addEventListener("touchstart", (e) => {
    e.stopPropagation()

    let rect = _canvas.getBoundingClientRect();
    input.mouse.x = Math.round((e.touches[0].clientX-rect.left)/(rect.right-rect.left)*(_canvas.width));
    input.mouse.y = Math.round((e.touches[0].clientY-rect.top)/(rect.bottom-rect.top)*(_canvas.height));
    input.mouse.down = true;
    input.mouse.click = true;
    input.mouse.up = false;
  }, false);

  _canvas.addEventListener("touchmove", (e) => {
    e.stopPropagation()

    let rect = _canvas.getBoundingClientRect();
    input.mouse.x = Math.round((e.touches[0].clientX-rect.left)/(rect.right-rect.left)*(_canvas.width));
    input.mouse.y = Math.round((e.touches[0].clientY-rect.top)/(rect.bottom-rect.top)*(_canvas.height));
  }, false);

  _canvas.addEventListener("touchend", (e) => {
    e.stopPropagation()

    let rect = _canvas.getBoundingClientRect();
    input.mouse.x = Math.round((e.touches[0].clientX-rect.left)/(rect.right-rect.left)*(_canvas.width));
    input.mouse.y = Math.round((e.touches[0].clientY-rect.top)/(rect.bottom-rect.top)*(_canvas.height));
    input.mouse.down = false;
    input.mouse.up = true;
  }, false);

  _canvas.addEventListener("touchcancel", (e) => {
    e.stopPropagation()

    let rect = _canvas.getBoundingClientRect();
    input.mouse.x = Math.round((e.touches[0].clientX-rect.left)/(rect.right-rect.left)*(_canvas.width));
    input.mouse.y = Math.round((e.touches[0].clientY-rect.top)/(rect.bottom-rect.top)*(_canvas.height));
    input.mouse.down = false;
    input.mouse.up = true;
  }, false);

  document.addEventListener("keydown",(e) => {
    input.keys[e.key] = true;

    //If there are keydown event listeners, call them
    if (_keyDownCallbacks[e.key]) {
      e.preventDefault();
      for (let i = 0; i < _keyDownCallbacks[e.key].length; i++)
        _keyDownCallbacks[e.key][i]();
    }
  });

  document.addEventListener("keyup",(e) => {
    input.keys[e.key] = false;
  });
}
