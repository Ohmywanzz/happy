window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) { lastTime = 0; }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

var loaded = false;
var animRunning = false;

// Landscape on a phone → treat as desktop
function isMobilePortrait() {
    return window.isDevice && window.innerHeight >= window.innerWidth;
}

// Re-init on orientation change
window.addEventListener('orientationchange', function () {
    setTimeout(function () {          // small delay lets the browser finish rotating
        animRunning = false;          // kills the running loop
        loaded      = false;          // allows init() to run again
        var canvas  = document.getElementById('heart');
        var ctx     = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        init();
    }, 300);
});

var init = function () {
    if (loaded) return;
    loaded      = true;
    animRunning = true;

    var mobile = isMobilePortrait();  // false in landscape → full desktop quality
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;
    var rand = Math.random;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    // ── STARS ──
    var starCount = mobile ? 160 : 280;
    var stars = [];
    for (var si = 0; si < starCount; si++) {
        stars.push({
            x: rand() * width,
            y: rand() * height,
            r: 0.3 + rand() * 0.8,
            baseA: 0.4 + rand() * 0.55,
            tw: 0.6 + rand() * 3.5,
            p: rand() * Math.PI * 2,
            shine: rand() < 0.10,
            shineSpeed: 1.5 + rand() * 4,
            color: rand() < 0.15
                ? ('rgba(' + ~~(180 + rand() * 75) + ',' + ~~(160 + rand() * 50) + ',255,')
                : rand() < 0.12
                    ? ('rgba(255,' + ~~(200 + rand() * 55) + ',' + ~~(160 + rand() * 60) + ',')
                    : 'rgba(255,255,255,'
        });
    }

    // ── SPIRAL GALAXIES ──
    var galaxyCount = mobile ? 5 : 9;
    var galaxies = [];

    // Generate fully random positions with a minimum separation distance
    function randomGalaxyPositions(count, w, h) {
        var positions = [];
        var minDist = Math.min(w, h) * 0.18; // minimum gap between galaxy centres
        var margin  = 0.07;                   // keep away from the very edge
        var maxTries = 200;

        for (var n = 0; n < count; n++) {
            var placed = false;
            for (var attempt = 0; attempt < maxTries; attempt++) {
                var cx = (margin + rand() * (1 - 2 * margin)) * w;
                var cy = (margin + rand() * (1 - 2 * margin)) * h;
                var ok = true;
                for (var p = 0; p < positions.length; p++) {
                    var ddx = cx - positions[p][0];
                    var ddy = cy - positions[p][1];
                    if (Math.sqrt(ddx * ddx + ddy * ddy) < minDist) { ok = false; break; }
                }
                if (ok) { positions.push([cx, cy]); placed = true; break; }
            }
            // If we couldn't place after maxTries, relax and place anywhere
            if (!placed) {
                positions.push([
                    (margin + rand() * (1 - 2 * margin)) * w,
                    (margin + rand() * (1 - 2 * margin)) * h
                ]);
            }
        }
        return positions;
    }

    function makeSpiralGalaxy(gx, gy, tilt, hue) {
        var gStars = [];
        var numArms    = 3;
        var passes = [
            { maxR: 55  + rand() * 30, starsPerArm: mobile ? 60  : 110, spreadFactor: 0.08, flattenY: 0.38, scatter: 5,  alphaBase: 0.55, alphaRand: 0.40, sizeBase: 0.7, sizeRand: 1.1, litBase: 70 },
            { maxR: 100 + rand() * 40, starsPerArm: mobile ? 55  : 100, spreadFactor: 0.06, flattenY: 0.34, scatter: 9,  alphaBase: 0.38, alphaRand: 0.35, sizeBase: 0.5, sizeRand: 0.9, litBase: 62 },
            { maxR: 160 + rand() * 50, starsPerArm: mobile ? 45  : 80,  spreadFactor: 0.04, flattenY: 0.30, scatter: 14, alphaBase: 0.20, alphaRand: 0.25, sizeBase: 0.3, sizeRand: 0.7, litBase: 55 }
        ];

        for (var pi = 0; pi < passes.length; pi++) {
            var pass = passes[pi];
            for (var arm = 0; arm < numArms; arm++) {
                var armOffset = (arm / numArms) * Math.PI * 2;
                for (var sk = 0; sk < pass.starsPerArm; sk++) {
                    var t      = sk / pass.starsPerArm;
                    var r      = t * pass.maxR;
                    var theta  = armOffset + t * Math.PI * 3.0;
                    var scatter= (rand() - 0.5) * pass.scatter * (1 + t);
                    var sx = r * Math.cos(theta) + scatter;
                    var sy = r * Math.sin(theta) * pass.flattenY + scatter * 0.3;
                    var rx = sx * Math.cos(tilt) - sy * Math.sin(tilt);
                    var ry = sx * Math.sin(tilt) + sy * Math.cos(tilt);
                    gStars.push({
                        x: gx + rx, y: gy + ry,
                        r: pass.sizeBase + rand() * pass.sizeRand,
                        baseA: pass.alphaBase + rand() * pass.alphaRand,
                        tw: 0.3 + rand() * 2.0,
                        p: rand() * Math.PI * 2,
                        hue: hue + ~~((rand() - 0.5) * 45),
                        sat: 60 + ~~(rand() * 40),
                        lit: pass.litBase + ~~(rand() * 22)
                    });
                }
            }
        }

        for (var ck = 0; ck < (mobile ? 30 : 55); ck++) {
            var coreR   = rand() * 12;
            var coreA   = rand() * Math.PI * 2;
            var cx2     = coreR * Math.cos(coreA);
            var cy2     = coreR * Math.sin(coreA) * 0.4;
            var crx     = cx2 * Math.cos(tilt) - cy2 * Math.sin(tilt);
            var cry     = cx2 * Math.sin(tilt) + cy2 * Math.cos(tilt);
            gStars.push({
                x: gx + crx, y: gy + cry,
                r: 0.8 + rand() * 1.4,
                baseA: 0.70 + rand() * 0.30,
                tw: 0.2 + rand() * 1.0,
                p: rand() * Math.PI * 2,
                hue: hue + ~~((rand() - 0.5) * 20),
                sat: 40 + ~~(rand() * 30),
                lit: 80 + ~~(rand() * 18)
            });
        }

        return gStars;
    }

    var galaxyPositions = randomGalaxyPositions(galaxyCount, width, height);

    for (var gi = 0; gi < galaxyCount; gi++) {
        var gx   = galaxyPositions[gi][0];
        var gy   = galaxyPositions[gi][1];
        var tilt = rand() * Math.PI;
        var hue  = ~~(200 + rand() * 160);
        galaxies.push({
            x: gx, y: gy,
            hue: hue,
            coreR: 14,
            outerR: 210,
            stars: makeSpiralGalaxy(gx, gy, tilt, hue)
        });
    }

    // ── SHOOTING STARS ──
    var shootingStars = [];
    var shootingTimer = 0;
    var shootingInterval = mobile ? 380 : 260;

    function spawnShootingStar() {
        var angle = (15 + rand() * 30) * (Math.PI / 180);
        var speed = 10 + rand() * 8;
        shootingStars.push({
            x:     rand() * width,
            y:     rand() * height * 0.5,
            vx:    Math.cos(angle) * speed,
            vy:    Math.sin(angle) * speed,
            len:   100 + rand() * 120,
            life:  1.0,
            decay: 0.014 + rand() * 0.01
        });
    }

    // ── COMETS ──
    var comets = [];
    var cometTimer = 0;
    var cometInterval = mobile ? 600 : 420;

    function spawnComet() {
        var hue = ~~(180 + rand() * 180);
        var angle = (20 + rand() * 40) * (Math.PI / 180);
        var speed = 3 + rand() * 2.5;
        comets.push({
            x:     rand() * width,
            y:     rand() * height * 0.35,
            vx:    Math.cos(angle) * speed * (rand() < 0.5 ? 1 : -1),
            vy:    Math.sin(angle) * speed,
            hue:   hue,
            size:  1.5 + rand() * 2,
            life:  1.0,
            decay: 0.004 + rand() * 0.003,
            trail: []
        });
    }

    window.addEventListener('resize', function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        for (var si = 0; si < stars.length; si++) {
            stars[si].x = rand() * width;
            stars[si].y = rand() * height;
        }
    });

    // ── HEART MATH ──
    var heartPosition = function (rad) {
        return [
            Math.pow(Math.sin(rad), 3),
            -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
        ];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    var traceCount = mobile ? 20 : 50;
    var pointsOrigin = [];
    var i;
    var dr = mobile ? 0.3 : 0.1;

    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));

    var heartPointsCount = pointsOrigin.length;
    var targetPoints = [];

    var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
    };

    var e = [];
    for (i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0, vy: 0, R: 2,
            speed: rand() + 16,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            f: "hsla(280,100%,65%,.3)",
            trace: []
        };
        for (var k = 0; k < traceCount; k++) e[i].trace[k] = { x: x, y: y };
    }

    var config = { traceK: 0.4, timeDelta: 0.01 };
    var time = 0;

    var loop = function () {
        if (!animRunning) return;   // stop if orientation changed
        var n = -Math.cos(time);
        pulse((1 + n) * .5, (1 + n) * .5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;

        ctx.fillStyle = "rgba(0,0,0,0.06)";
        ctx.fillRect(0, 0, width, height);

        // ── draw galaxies ──
        for (var gi = 0; gi < galaxies.length; gi++) {
            var gal = galaxies[gi];
            var coreGrad = ctx.createRadialGradient(gal.x, gal.y, 0, gal.x, gal.y, gal.coreR * 2);
            coreGrad.addColorStop(0,   'hsla(' + gal.hue + ',60%,95%,0.18)');
            coreGrad.addColorStop(0.5, 'hsla(' + gal.hue + ',70%,75%,0.07)');
            coreGrad.addColorStop(1,   'transparent');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(gal.x, gal.y, gal.coreR * 2, 0, Math.PI * 2);
            ctx.fill();

            for (var gsi = 0; gsi < gal.stars.length; gsi++) {
                var gs = gal.stars[gsi];
                var ga = gs.baseA + Math.sin(time * gs.tw + gs.p) * 0.22 * gs.baseA;
                ga = Math.max(0, Math.min(1, ga));
                ctx.fillStyle = 'hsla(' + gs.hue + ',' + gs.sat + '%,' + gs.lit + '%,' + ga + ')';
                ctx.fillRect(gs.x, gs.y, gs.r, gs.r);
            }
        }

        // ── twinkling stars ──
        for (var si = 0; si < stars.length; si++) {
            var s = stars[si];
            var a = s.baseA + Math.sin(time * s.tw + s.p) * 0.55 * s.baseA;
            if (s.shine) {
                var spike = Math.pow(Math.max(0, Math.sin(time * s.shineSpeed + s.p * 1.5)), 6);
                a += spike * 1.1;
                if (spike > 0.7) {
                    ctx.fillStyle = s.color + Math.min(1, a * 0.5) + ')';
                    ctx.fillRect(s.x - 2, s.y,     s.r + 3, s.r * 0.6);
                    ctx.fillRect(s.x,     s.y - 2, s.r * 0.6, s.r + 3);
                }
            }
            a = Math.max(0, Math.min(1, a));
            ctx.fillStyle = s.color + a + ')';
            ctx.fillRect(s.x, s.y, s.r, s.r);
        }

        // ── shooting stars ──
        shootingTimer++;
        if (shootingTimer >= shootingInterval) {
            spawnShootingStar();
            shootingTimer = 0;
            shootingInterval = (mobile ? 300 : 200) + ~~(rand() * 120);
        }
        for (var ssi = shootingStars.length - 1; ssi >= 0; ssi--) {
            var ss = shootingStars[ssi];
            ss.life -= ss.decay;
            if (ss.life <= 0) { shootingStars.splice(ssi, 1); continue; }
            var tailX = ss.x - ss.vx * (ss.len / 12);
            var tailY = ss.y - ss.vy * (ss.len / 12);
            var ssGrad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
            ssGrad.addColorStop(0, 'rgba(255,255,255,0)');
            ssGrad.addColorStop(1, 'rgba(255,255,255,' + (ss.life * 0.9) + ')');
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(ss.x, ss.y);
            ctx.strokeStyle = ssGrad;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
            ss.x += ss.vx;
            ss.y += ss.vy;
        }

        // ── comets ──
        cometTimer++;
        if (cometTimer >= cometInterval) {
            spawnComet();
            cometTimer = 0;
            cometInterval = (mobile ? 500 : 350) + ~~(rand() * 150);
        }
        for (var ci = comets.length - 1; ci >= 0; ci--) {
            var cm = comets[ci];
            cm.trail.push({ x: cm.x, y: cm.y });
            if (cm.trail.length > 60) cm.trail.shift();
            cm.x += cm.vx;
            cm.y += cm.vy;
            cm.life -= cm.decay;
            if (cm.life <= 0 || cm.y > height + 20) { comets.splice(ci, 1); continue; }
            for (var ti = 1; ti < cm.trail.length; ti++) {
                var tp = ti / cm.trail.length;
                ctx.beginPath();
                ctx.moveTo(cm.trail[ti - 1].x, cm.trail[ti - 1].y);
                ctx.lineTo(cm.trail[ti].x,     cm.trail[ti].y);
                ctx.strokeStyle = 'hsla(' + cm.hue + ',90%,75%,' + (tp * cm.life * 0.7) + ')';
                ctx.lineWidth = cm.size * tp;
                ctx.stroke();
            }
            var cmGrad = ctx.createRadialGradient(cm.x, cm.y, 0, cm.x, cm.y, cm.size * 3);
            cmGrad.addColorStop(0, 'hsla(' + cm.hue + ',100%,98%,' + cm.life + ')');
            cmGrad.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(cm.x, cm.y, cm.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = cmGrad;
            ctx.fill();
        }

        // ── heart particles ──
        for (i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (10 > length) {
                if (0.95 < rand()) {
                    u.q = ~~(rand() * heartPointsCount);
                } else {
                    if (0.99 < rand()) u.D *= -1;
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (0 > u.q) u.q += heartPointsCount;
                }
            }
            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            for (k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            ctx.fillStyle = u.f;
            for (k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
            }
        }

        window.requestAnimationFrame(loop, canvas);
    };

    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);

window.addEventListener("load", () => {
    const tl = gsap.timeline({ delay: 1 });
    tl.to(".birthday-overlay .title", { opacity: 1, y: -30, duration: 1, ease: "power3.out" })
      .to(".birthday-overlay .msg",   { opacity: 1, y: -10, duration: 1 }, "-=0.4")
      .to([".birthday-overlay .title", ".birthday-overlay .msg"], { scale: 1.05, repeat: 1, yoyo: true, duration: 0.3 });
});

window.addEventListener("load", () => {
    const tl = gsap.timeline({ delay: 1 });
    tl.to(".title", { opacity: 1, y: -20, duration: 1, ease: "power3.out" })
      .to(".msg",   { opacity: 1, y: -10, duration: 1 }, "-=0.4")
      .to([".title", ".msg"], { scale: 1.05, repeat: 1, yoyo: true, duration: 0.3 });
});

window.addEventListener("load", () => {
    const tl = gsap.timeline({ delay: 1 });
    tl.to(".side-left",  { opacity: 1, x: 20,  duration: 1, ease: "power3.out" })
      .to(".side-right", { opacity: 1, x: -20, duration: 1, ease: "power3.out" }, "-=1")
      .to([".side-left", ".side-right"], { scale: 1.1, repeat: 1, yoyo: true, duration: 0.4 });
});

