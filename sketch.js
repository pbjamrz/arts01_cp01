// Chains to Light - A Response to "Filipinas in Bondage" by Guillermo Tolentino
// Combines chain breaking liberation with darkness to light transition

let chains = [];
let particles = [];
let time = 0;
let liberationProgress = 0;
let backgroundDarkness = 0;

class Chain {
    constructor(x1, y1, x2, y2, angle) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.angle = angle;
        this.broken = false;
        this.breakProgress = 0;
        this.segments = [];
        this.opacity = 255;

        // Create chain segments
        let numSegments = 8;
        for (let i = 0; i < numSegments; i++) {
            let t = i / numSegments;
            this.segments.push({
                x: lerp(this.x1, this.x2, t),
                y: lerp(this.y1, this.y2, t),
                vx: 0,
                vy: 0,
                rotation: 0
            });
        }
    }

    break() {
        if (!this.broken) {
            this.broken = true;
            // Add explosion particles at break point
            let midX = (this.x1 + this.x2) / 2;
            let midY = (this.y1 + this.y2) / 2;
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(midX, midY, true));
            }
        }
    }

    update() {
        if (this.broken) {
            this.breakProgress += 0.02;
            this.opacity -= 2;

            // Animate segments breaking apart
            for (let seg of this.segments) {
                if (!seg.vx && !seg.vy) {
                    seg.vx = random(-2, 2);
                    seg.vy = random(-3, 1);
                }
                seg.x += seg.vx;
                seg.y += seg.vy;
                seg.vy += 0.2; // gravity
                seg.rotation += 0.1;
            }
        }
    }

    display() {
        if (this.opacity <= 0) return;

        push();
        stroke(150, 150, 150, this.opacity);
        strokeWeight(4);
        noFill();

        for (let i = 0; i < this.segments.length - 1; i++) {
            let seg1 = this.segments[i];
            let seg2 = this.segments[i + 1];

            if (this.broken) {
                push();
                translate(seg1.x, seg1.y);
                rotate(seg1.rotation);
                ellipse(0, 0, 12, 8);
                pop();
            } else {
                // Draw chain links
                push();
                translate(seg1.x, seg1.y);
                rotate(this.angle + i * 0.2);
                ellipse(0, 0, 12, 8);
                pop();

                // Connect to next segment
                line(seg1.x, seg1.y, seg2.x, seg2.y);
            }
        }
        pop();
    }
}

class Particle {
    constructor(x, y, isChainParticle = false) {
        this.x = x;
        this.y = y;
        this.vx = random(-3, 3);
        this.vy = random(-5, -1);
        this.life = 255;
        this.size = random(2, 6);
        this.isChainParticle = isChainParticle;

        // Light particles have golden/warm colors
        if (!isChainParticle) {
            this.hue = random(35, 55); // Golden to warm yellow
            this.saturation = random(60, 100);
            this.brightness = random(80, 100);
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // gravity
        this.life -= this.isChainParticle ? 5 : 2;

        if (!this.isChainParticle) {
            // Light particles rise
            this.vy -= 0.2;
            this.vx *= 0.99;
        }
    }

    display() {
        push();
        noStroke();
        if (this.isChainParticle) {
            fill(200, 200, 200, this.life);
        } else {
            colorMode(HSB);
            fill(this.hue, this.saturation, this.brightness, this.life);
            colorMode(RGB);

            // Add glow effect
            drawingContext.shadowBlur = 15;
            drawingContext.shadowColor = `hsla(${this.hue}, ${this.saturation}%, ${this.brightness}%, 0.8)`;
        }
        ellipse(this.x, this.y, this.size);
        drawingContext.shadowBlur = 0;
        pop();
    }

    isDead() {
        return this.life <= 0;
    }
}

function setup() {
    let canvas = createCanvas(800, 800);
    canvas.parent('canvas-container');

    // Create chains forming a constraining pattern
    let centerX = width / 2;
    let centerY = height / 2;
    let radius = 180;

    // Radial chains emanating from center (bondage)
    for (let i = 0; i < 8; i++) {
        let angle = (TWO_PI / 8) * i;
        let x1 = centerX;
        let y1 = centerY;
        let x2 = centerX + cos(angle) * radius;
        let y2 = centerY + sin(angle) * radius;
        chains.push(new Chain(x1, y1, x2, y2, angle));
    }

    // Circular chains (constriction)
    for (let r = 80; r < 200; r += 60) {
        for (let a = 0; a < TWO_PI; a += PI / 4) {
            let x1 = centerX + cos(a) * r;
            let y1 = centerY + sin(a) * r;
            let x2 = centerX + cos(a + PI / 4) * r;
            let y2 = centerY + sin(a + PI / 4) * r;
            chains.push(new Chain(x1, y1, x2, y2, a));
        }
    }

    backgroundDarkness = 0;
}

function draw() {
    // Transition from darkness to light
    backgroundDarkness = lerp(0, 255, liberationProgress);
    background(backgroundDarkness);

    time++;

    // Progressive liberation - chains break over time
    if (time > 120 && time % 8 === 0) {
        // Find an unbroken chain and break it
        for (let chain of chains) {
            if (!chain.broken) {
                chain.break();
                liberationProgress = min(liberationProgress + 0.015, 1.0);
                break;
            }
        }
    }

    // Generate light particles as liberation progresses
    if (liberationProgress > 0.3 && frameCount % 3 === 0) {
        let centerX = width / 2;
        let centerY = height / 2;
        let spread = map(liberationProgress, 0.3, 1, 50, 200);
        particles.push(new Particle(
            centerX + random(-spread, spread),
            centerY + random(-spread, spread),
            false
        ));
    }

    // Update and display chains
    for (let chain of chains) {
        chain.update();
        chain.display();
    }

    // Update and display particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // Draw central figure (abstract representation)
    if (liberationProgress < 0.7) {
        push();
        stroke(100, 100, 120, map(liberationProgress, 0, 0.7, 200, 0));
        strokeWeight(2);
        noFill();
        translate(width / 2, height / 2);

        // Abstract struggling form
        let struggle = sin(time * 0.05) * 10;
        ellipse(0, -30 + struggle, 40, 50); // head
        line(0, -10, 0, 40); // body
        line(0, 0, -20 + struggle, 30); // arms
        line(0, 0, 20 - struggle, 30);
        pop();
    }

    // Display liberation text when mostly freed
    if (liberationProgress > 0.85) {
        push();
        fill(255, map(liberationProgress, 0.85, 1, 0, 255));
        textAlign(CENTER, CENTER);
        textSize(32);
        textStyle(BOLD);
        text("KALAYAAN", width / 2, height / 2);
        textSize(16);
        textStyle(NORMAL);
        text("Freedom", width / 2, height / 2 + 40);
        pop();
    }

    // Restart animation
    if (liberationProgress >= 1.0 && particles.length === 0) {
        setTimeout(() => {
            setup();
            time = 0;
            liberationProgress = 0;
            particles = [];
        }, 3000);
    }
}

// Click to accelerate liberation
function mousePressed() {
    for (let i = 0; i < 3; i++) {
        for (let chain of chains) {
            if (!chain.broken) {
                chain.break();
                liberationProgress = min(liberationProgress + 0.05, 1.0);
                break;
            }
        }
    }
}
