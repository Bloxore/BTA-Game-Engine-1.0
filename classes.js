//Engine Classes

//Base state class, handles the scene and game objects
//Mainly for easy switching between game states
const State = () => {
  let state = {
    preload: () => {},
    init: () => {},
    update: () => {},
    draw: () => {},
    _destroy: () => {
      for (let i = 0; i < state._members.length; i++) {
        state._members[i].destroy();
      }
    },
    _members: [],
  };

  return state;
}

//Base building block game object element, all classes should extend this
const GameObject = () => {
  let state = {
    ID: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    zIndex: 0,
    cameraAdherence: {x: 1, y: 1},
    velocity: {x: 0, y: 0},
    acceleration: {x: 0, y: 0},
    boundingBox: {x: 0, y: 0, width: 0, height: 0},
    opacity: 1,
    _members: [],
    add: (object) => {
      object.ID = objectID++;
      state._members.push(object);

      return object;
    },
    remove: (object) => {
      //Locate object to remove by its ID and splice it
      for (let i = 0; i < state._members.length; i++) {
        if (state._members[i].ID == object.ID) {
          state._members.splice(i, 1);
        }
      }

      return object;
    },
    preupdate: () => {
      /* Multiply by deltatime to acount for any lag */
      state.velocity.x += state.acceleration.x * deltaTime;
      state.velocity.y += state.acceleration.y * deltaTime;

      state.x += state.velocity.x * deltaTime;
      state.y += state.velocity.y * deltaTime;

      for (let i = 0; i < state._members.length; i ++) {
        if (state._members[i].preupdate)
          state._members[i].preupdate();
      }
    },
    //Both functions below are intended to be overwritten
    update: () => {},
    _memberDraw: (ctx) => {
      for (let i = 0; i < state._members.length; i ++) {
        if (state._members[i]._memberDraw) {
          state._members[i].x += state.x;
          state._members[i].y += state.y;

          let sprOpacity = state._members[i].opacity;
          state._members[i].opacity = state._members[i].opacity * state.opacity;

          if (state._members[i].draw)
            state._members[i].draw(ctx);

          state._members[i]._memberDraw(ctx);

          state._members[i].x -= state.x;
          state._members[i].y -= state.y;

          state._members[i].opacity = sprOpacity;
        }
      }
    },
    _memberUpdate: () => {
      for (let i = 0; i < state._members.length; i ++) {
        if (state._members[i].update)
          state._members[i].update();

        if (state._members[i]._memberUpdate)
          state._members[i]._memberUpdate();
      }
    },
    draw: () => {},
    destroy: () => {
      remove(state);
    }
  }

  return state;
}

//Extension of the base game object with external image support
const Sprite = (key, tileWidth, tileHeight) => {
  let state = Object.assign(
    GameObject(),
    {
      key,
      frame: 0,
      scale: {x: 1, y: 1},
      _gwidth: graphics[key].width,
      _gheight: graphics[key].height,
      rotate: 0,
      draw: (ctx) => {
        if (state.rotate != 0) {
          //translate
          ctx.translate(state.x + state.width / 2, state.y + state.height / 2);
          //Rotate
          ctx.rotate(degToRad(state.rotate));
          //Untranslate
          ctx.translate(-(state.x + state.width / 2), -(state.y + state.height / 2));
        }

        //Opacity
        ctx.globalAlpha = state.opacity;

        //Nab the graphic based on the key and show specified tile ammount
        ctx.drawImage(
          graphics[state.key].img,
          0 + graphics[state.key].tileWidth * (state.frame % (state._gwidth / graphics[state.key].tileWidth)), //sx
          0 + graphics[state.key].tileHeight * (Math.floor((state.frame * graphics[state.key].tileWidth) / state._gwidth) % (state._gheight / graphics[state.key].tileHeight)), //sy
          graphics[state.key].tileWidth, //swidth
          graphics[state.key].tileHeight, //sheight
          state.x,
          state.y,
          state.width * state.scale.x,
          state.height * state.scale.y,
        );

        //Opacity
        ctx.globalAlpha = 1;

        if (state.rotate != 0) {
          //translate
          ctx.translate(state.x + state.width / 2, state.y + state.height / 2);
          //Rotate
          ctx.rotate(-degToRad(state.rotate));
          //Untranslate
          ctx.translate(-(state.x + state.width / 2), -(state.y + state.height / 2));
        }
      }
    }
  );

  //Width and height settings
  if (tileWidth) {
    state.width = tileWidth;
  } else {
    state.width = graphics[state.key].tileWidth;
  }
  state.boundingBox.width = state.width;

  if (tileHeight) {
    state.height = tileHeight;
  } else {
    state.height = graphics[state.key].tileHeight;
  }
  state.boundingBox.height = state.height;

  return state;
}

const Text = (txt) => {
  let state = Object.assign(
    GameObject(),
    {
      text: txt,
      font: null,
      align: "left",
      color: "#000000",
      draw: (ctx) => {
        if (state.font)
          ctx.font = state.font;

        if (ctx.fillStyle != state.color)
          ctx.fillStyle = state.color;

        if (ctx.textAlign != state.align)
          ctx.textAlign = state.align;

        //Opacity
        ctx.globalAlpha = state.opacity;

        ctx.fillText(state.text, state.x, state.y);

        //Opacity
        ctx.globalAlpha = 1;
      },
    }
  );

  return state;
}

const Tilemap = (key, rows, columns) => {
  let state = Object.assign(
    GameObject(),
    {
      map: [],
      frame: 0,
      scale: {x: 1, y: 1},
      spr: Sprite(key),
      //To be overwritten
      getTileClicked: (x, y, tile) => {},
      update: () => {
        state.spr.scale = state.scale;

        if (isClicked(state)) {
          let xTile = Math.floor((input.mouse.x - state.x) / (state.spr.width * state.scale.x));
          let yTile = Math.floor((input.mouse.y - state.y) / (state.spr.height * state.scale.y));

          state.getTileClicked(xTile, yTile, state.getTile(xTile, yTile));
        }
      },
      draw: (ctx) => {
        for (let i = 0; i < rows; i++) {
          for (let p = 0; p < columns; p++) {
            state.spr.x = state.x + state.spr.width * state.scale.x * p;
            state.spr.y = state.y + state.spr.height * state.scale.y * i;
            state.spr.frame = state.map[i][p];

            state.spr.draw(ctx);
          }
        }
      },
      setTile: (x, y, tile) => {
        state.map[y][x] = tile;
      },
      getTile: (x, y) => {
        return state.map[y][x];
      },
      setTileSize: (w, h) => {
        state.scale.x = w / state.spr.width;
        state.scale.y = h / state.spr.height;
      }
    }
  );

  //Populate map
  for (let i = 0; i < rows; i++) {
    state.map.push([]);
    for (let p = 0; p < columns; p++) {
      state.map[i].push(0);
    }
  }

  state.width = state.spr.width * columns;
  state.height = state.spr.height * rows;

  state.boundingBox.width = state.width;
  state.boundingBox.height = state.height;

  return state;
}

/* Simple timer */
const Timer = (time, options) => {
  let state = Object.assign(
    GameObject(),
    {
      time: Date.now() + time,
      disable: false,
      update: () => {
        /* If progress callBack */
        if (Date.now() >= state.time && state.disable == false) {
          remove(state);
          state.disable = true;
          if (options.callback)
            options.callback();
        }
        if (options.progress && state.disable == false)
          options.progress();
      }
    }
  );
  return state;
};
