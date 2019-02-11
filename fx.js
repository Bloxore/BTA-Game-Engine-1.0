/* FX */
let fx = {};
const CIRCLE_TRANSITION = 0x0001;
const FADE = 0x0010;
const FLASH = 0x0100;
/*
    Types and Options:
    1) Circle Transition:
        - Speed
        - Density
        - Complete
        - Color
    2) Fade
        - Color
        - Time
        - Complete
    3) Flash
        - Color
        - Time
        - Complete
*/
function startFX(type,options) {
    fx = {type: type, options: options};
    if (type == CIRCLE_TRANSITION) {
        if (options.color == null)
          options.color = "#000000";
        if (options.density == null)
            options.density = 5;
        if (options.speed == null)
            options.speed = 15;
        if (options.growth == null)
            options.growth = 3;
        fx.circles = [];
        /* Build the 2d array */
        for (let i=0;i<options.density;i++)
            fx.circles[i] = [];
        /* p = y cord, i = x cord */
        for (let p=0;p<options.density;p++)
            for (let i=0;i<options.density;i++)
                fx.circles[i][p] = 0;

        fx.radius = 0;
    }
    if (type == FADE) {
        if (options.color == null)
            options.color = "#000000";
        if (options.time == null)
            options.time = 100;
        fx.opacity = 0;
    }
    if (type == FLASH) {
        if (options.color == null)
            options.color = "#000000";
        if (options.time == null)
            options.time = 100;
        fx.opacity = 1;
    }
}

function fxDraw() {
   if (fx.type === CIRCLE_TRANSITION) {
       /* p = y cord, i = x cord */
       let separation;
       let separationH = WIDTH / fx.options.density;
       let separationV = HEIGHT / fx.options.density;
       if (WIDTH > HEIGHT) {
         separation = separationH;
       } else {
         separation = separationW;
       }

       let finished = true;
        for (let p=0;p<fx.options.density;p++)
            for (let i=0;i<fx.options.density;i++) {
                /* Don't grow circles forever */
                if (fx.circles[i][p] < separation) {
                    finished = false;
                }
                if (Math.sqrt(Math.pow(p*separationV-HEIGHT/2+separationV/2,2)+Math.pow(i*separationH-WIDTH/2+separationH/2,2)) <= fx.radius) {
                    fx.circles[i][p] += fx.options.growth;
                }
                /* If the circle's radius is more than 0 draw it*/
                if (fx.circles[i][p] > 0) {
                    _ctx.fillStyle = fx.options.color;
                    _ctx.beginPath()
                    _ctx.arc(i*separationH+separationH/2,p*separationV+separationV/2,fx.circles[i][p],0,Math.PI*2);
                    _ctx.fill();
                }
            }
        fx.radius+= fx.options.speed;
       if (finished == true) {
           let complete = fx.options.complete;
           fx = {}
           if (complete)
               complete();
       }
    }
    /* Fade transition */
    else if (fx.type == FADE) {
        _ctx.beginPath();
        _ctx.globalAlpha = fx.opacity;
        _ctx.fillStyle = fx.options.color;
        _ctx.rect(0,0,WIDTH,HEIGHT);
        _ctx.fill();
        _ctx.globalAlpha = 1;
        fx.opacity += 1/fx.options.time;
        /* When complete */
        if (fx.opacity >= 1) {
            let complete = fx.options.complete;
            fx = {}
            if (complete)
                complete();
        }
    }
    /* Flash effect */
    else if (fx.type == FLASH) {
        _ctx.beginPath();
        _ctx.globalAlpha = fx.opacity;
        _ctx.fillStyle = fx.options.color;
        _ctx.rect(0,0,WIDTH,HEIGHT);
        _ctx.fill();
        _ctx.globalAlpha = 1;
        fx.opacity -= 1/fx.options.time;
        /* When complete */
        if (fx.opacity <= 0) {
            let complete = fx.options.complete;
            fx = {}
            if (complete)
                complete();
        }
    }
}
