import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LegacyHero = () => {
  const heroSectionRef = useRef(null);
  const titleRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const titleElement = titleRef.current;
    const heroSection = heroSectionRef.current;
    const canvas = canvasRef.current;

    if (!titleElement || !heroSection || !canvas) {
      return;
    }

    // --- NETWORK АНИМАЦИЯ (КОМЕТЫ) ---
    const ctx = canvas.getContext('2d');
    let points = [];
    let activeLines = [];
    let activeExplosions = [];

    // --- Network Settings ---
    const networkSettings = {
        // Number of points to generate on the canvas
        // More points = denser network, potentially more comets
        numPoints: 800, // Try values like 50, 100, 150

        // Radius of the static points (if visible)
        pointRadius: 1.5, // e.g., 1, 2, 2.5

        // Color of the static points. Use rgba for transparency.
        // To hide points, set alpha to 0: 'rgba(133, 141, 148, 0)'
        pointColor: 'rgba(133, 141, 148, 0)', // Points are currently invisible

        // Maximum distance between two points for a comet to connect them
        // Larger value = longer comets, potentially connecting across larger gaps
        connectDistance: 500, // e.g., 150, 250, 300

        // Array of colors for the comets. A random color is chosen for each new comet.
        lineColors: [
            'rgba(255, 127, 80, 0.8)', // --accent-bright
            'rgba(66, 181, 239, 0.7)', // --accent-warm
            'rgba(219, 35, 239, 0.7)',
            'rgba(234, 234, 234, 0.6)'  // --text-color
        ],

        // Starting width of the comet's head
        lineWidthStart: 2.5, // e.g., 1.5, 2, 3

        // Length of the comet's tail, as a fraction of the currently drawn line segment's length.
        cometTailLength: 7.35, // e.g., 0.2 (shorter tail), 0.5 (longer tail)

        // Duration for the comet's head to travel to its destination point
        lineAnimationDuration: 2.8, // e.g., 2.0 (faster), 4.0 (slower)

        // --- Explosion Settings ---
        // Factor by which the pointRadius is multiplied to get the explosion's max radius
        // e.g., if pointRadius is 2 and factor is 10, max explosion radius is 20.
        explosionMaxRadiusFactor: 20, // TRY: 10, 15, 20 (to make it larger)

        // Duration of the explosion animation (in seconds)
        // Higher value = slower explosion
        explosionDuration: 0.9, // TRY: 0.8, 1.0, 1.2 (to make it slower)

        // Maximum number of comets animating simultaneously
        maxActiveLines: 20 // e.g., 8, 15, 20
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- ExplosionEffect Class ---
    class ExplosionEffect {
        constructor(x, y, color) {
            this.x = x; // X position of the explosion center
            this.y = y; // Y position of the explosion center
            this.color = color; // Color of the explosion (same as the comet)
            this.radius = networkSettings.pointRadius; // Initial radius (starts small)
            this.opacity = 0.8; // Initial opacity (fairly bright)

            // GSAP animation for the explosion's growth and fade
            gsap.to(this, {
                radius: networkSettings.pointRadius * networkSettings.explosionMaxRadiusFactor, // Animate to max radius
                opacity: 0, // Animate to fully transparent
                duration: networkSettings.explosionDuration, // Use duration from settings
                ease: "expo.out", // "expo.out" gives a fast expansion then slows down at the end
                onComplete: () => {
                    // Remove this explosion object from the activeExplosions array when animation is done
                    activeExplosions = activeExplosions.filter(exp => exp !== this);
                }
            });
        }

        draw(ctx) {
            // Don't draw if explosion is too small or fully faded
            if (this.opacity <= 0.01 || this.radius <= 0.1) return;

            ctx.beginPath();
            // Draw the arc for the main body of the explosion
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

            // Extract RGB components from the RGBA color string to use in the gradient
            // This ensures the gradient uses the base color without being affected by the original alpha of the comet color string
            const rgbColorMatch = this.color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            const rgbColor = rgbColorMatch ? `${rgbColorMatch[1]},${rgbColorMatch[2]},${rgbColorMatch[3]}` : '255,127,80'; // Fallback color

            // Create a radial gradient for the explosion fill
            // It goes from a more opaque center to a transparent edge
            const gradient = ctx.createRadialGradient(
                this.x, this.y, this.radius * 0.1, // Inner circle (start of gradient)
                this.x, this.y, this.radius        // Outer circle (end of gradient)
            );
            // Gradient color stops, using the explosion's current animated opacity
            gradient.addColorStop(0, `rgba(${rgbColor}, ${this.opacity * 0.9})`); // Center is slightly more opaque
            gradient.addColorStop(0.6, `rgba(${rgbColor}, ${this.opacity * 0.5})`); // Mid-point
            gradient.addColorStop(1, `rgba(${rgbColor}, 0)`);                   // Edge is fully transparent

            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }


    // --- AnimatedLine Class (Comet) ---
    class AnimatedLine {
        constructor(p1, p2) {
            this.p1 = p1;
            this.p2 = p2;
            this.headProgress = 0;
            this.tailStartProgress = 0;
            this.isVisible = true; // Comet is visible until it "explodes"
            this.color = networkSettings.lineColors[Math.floor(Math.random() * networkSettings.lineColors.length)];

            const tl = gsap.timeline({
                // No onComplete here for activeLines filtering, it's handled when the comet becomes invisible
            });

            // Animate the headProgress from 0 (start) to 1 (destination)
            tl.to(this, {
                headProgress: 1,
                onUpdate: () => {
                    // Keep the tailStartProgress trailing the headProgress by cometTailLength
                    this.tailStartProgress = Math.max(0, this.headProgress - networkSettings.cometTailLength);
                },
                duration: networkSettings.lineAnimationDuration,
                ease: "linear",
                onComplete: () => {
                    // When the comet's head reaches its destination:
                    this.isVisible = false; // Mark the comet line/tail as no longer visible

                    // Create an explosion effect at the destination point (p2)
                    const explosion = new ExplosionEffect(this.p2.x, this.p2.y, this.color);
                    activeExplosions.push(explosion); // Add to the array of active explosions

                    // Remove this comet from the activeLines array as its flight is over
                    // The explosion will manage its own lifecycle.
                    activeLines = activeLines.filter(line => line !== this);
                }
            });
        }

        draw() {
            // Only draw the comet if it's marked as visible
            if (!ctx || !this.isVisible) return;

            // Safety check: if head is at destination and tail has caught up,
            // but isVisible is still true (shouldn't happen with current logic), don't draw.
            if (this.headProgress >= 1 && this.tailStartProgress >= this.headProgress) return;

            const dx = this.p2.x - this.p1.x;
            const dy = this.p2.y - this.p1.y;

            // Calculate current head position
            const headX = this.p1.x + dx * this.headProgress;
            const headY = this.p1.y + dy * this.headProgress;

            // Calculate current tail start position
            const tailStartX = this.p1.x + dx * this.tailStartProgress;
            const tailStartY = this.p1.y + dy * this.tailStartProgress;

            // Avoid drawing if the visual segment length is negligible, especially at the very start
            if (Math.abs(headX - tailStartX) < 0.1 && Math.abs(headY - tailStartY) < 0.1 && this.headProgress < 0.05) {
                return;
            }

            // --- Draw the comet tail (line segment) ---
            ctx.beginPath();
            ctx.moveTo(tailStartX, tailStartY);
            ctx.lineTo(headX, headY);

            // Create a linear gradient for the tail's stroke style
            const gradient = ctx.createLinearGradient(tailStartX, tailStartY, headX, headY);
            const baseColorAlphaMatch = this.color.match(/, ([\d.]+)\)/); // Extract alpha from the comet's base color
            const baseColorAlpha = baseColorAlphaMatch ? parseFloat(baseColorAlphaMatch[1]) : 0.7;

            // Tail gradient: from transparent at its start to more solid towards the head
            gradient.addColorStop(0, this.color.replace(/, [\d.]+\)/, `, 0)`)); // Start of tail (fully transparent)
            gradient.addColorStop(0.5, this.color.replace(/, [\d.]+\)/, `, ${baseColorAlpha * 0.3})`)); // Mid-tail
            gradient.addColorStop(1, this.color.replace(/, [\d.]+\)/, `, ${baseColorAlpha})`));     // End of tail (at head)

            ctx.strokeStyle = gradient;
            ctx.lineWidth = networkSettings.lineWidthStart;
            ctx.lineCap = 'round'; // Rounded ends for the tail segment
            ctx.stroke();

            // --- Draw the comet head (small circle) ---
            const headRadius = networkSettings.lineWidthStart > 1 ? networkSettings.lineWidthStart / 1.5 : 1; // Slightly larger head
            ctx.beginPath();
            ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
            // Head fill style uses the comet's color, possibly slightly more opaque
            ctx.fillStyle = this.color.replace(/, ([\d.]+)\)/, `, ${Math.min(1, baseColorAlpha + 0.2)})`);
            ctx.fill();
        }
    }

    /**
     * (Re)populates the 'points' array with randomly positioned points.
     */
    function createPoints() {
        points.length = 0; // Clear any existing points
        for (let i = 0; i < networkSettings.numPoints; i++) {
            points.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: networkSettings.pointRadius,
                id: i // Simple identifier
            });
        }
    }

    /**
     * Draws the static points on the canvas, if they are set to be visible.
     */
    function drawStaticPoints() {
        if (!ctx) return;
        // Determine if points should be drawn based on pointColor's alpha value
        const pointColorAlphaMatch = networkSettings.pointColor.match(/, (\d\.\d+|\d)\)/);
        let pointColorAlpha = 0; // Default to invisible
        if (pointColorAlphaMatch) {
            pointColorAlpha = parseFloat(pointColorAlphaMatch[1]);
        } else if (networkSettings.pointColor && !networkSettings.pointColor.includes('rgba')) {
            // If it's a solid color string like 'red' or '#FF0000', assume visible unless explicitly transparent
            pointColorAlpha = 1;
        }

        if (pointColorAlpha === 0) return; // Don't draw if alpha is 0

        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
            ctx.fillStyle = networkSettings.pointColor;
            ctx.fill();
        });
    }

    /**
     * The main rendering loop function, called by GSAP's ticker.
     * Clears the canvas and redraws all static points, active comets, and active explosions.
     */
    function updateNetwork() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

        drawStaticPoints(); // Draw background points

        // Draw all currently active comets
        activeLines.forEach(line => {
            line.draw();
        });

        // Draw all currently active explosions
        activeExplosions.forEach(explosion => {
            explosion.draw(ctx);
        });
    }

    /**
     * Tries to spawn a new comet by randomly selecting two points.
     * A new comet is created if the points are different and within 'connectDistance'.
     */
    function spawnRandomLine() {
        // Conditions to prevent spawning: canvas not ready, not enough points, or too many active comets
        if (!canvas || points.length < 2 || activeLines.length >= networkSettings.maxActiveLines) {
            return;
        }

        let p1Index = Math.floor(Math.random() * points.length);
        let p2Index = Math.floor(Math.random() * points.length);
        let attempts = 0;
        const maxAttempts = 50; // Safety break for loops

        // Ensure p1 and p2 are distinct points
        while (p1Index === p2Index && attempts < maxAttempts) {
            p2Index = Math.floor(Math.random() * points.length);
            attempts++;
        }
        if (p1Index === p2Index) return; // Could not find two distinct points

        attempts = 0; // Reset for next loop
        // Find a pair of points within the allowed connection distance
        while (getDistance(points[p1Index], points[p2Index]) > networkSettings.connectDistance && attempts < maxAttempts) {
            p1Index = Math.floor(Math.random() * points.length);
            p2Index = Math.floor(Math.random() * points.length);
            let innerAttempts = 0;
            // Ensure newly picked p1 and p2 are distinct again
            while (p1Index === p2Index && innerAttempts < maxAttempts) {
                p2Index = Math.floor(Math.random() * points.length);
                innerAttempts++;
            }
            if (p1Index === p2Index) { attempts = maxAttempts; break; } // Break outer loop if inner fails
            attempts++;
        }

        // If a suitable pair is found, create a new comet
        if (p1Index !== p2Index && getDistance(points[p1Index], points[p2Index]) <= networkSettings.connectDistance) {
            const newLine = new AnimatedLine(points[p1Index], points[p2Index]);
            activeLines.push(newLine);
        }
    }

    /**
     * Calculates the Euclidean distance between two points.
     * @param {{x: number, y: number}} p1 - The first point.
     * @param {{x: number, y: number}} p2 - The second point.
     * @returns {number} The distance, or Infinity if points are invalid.
     */
    function getDistance(p1, p2) {
        if (!p1 || !p2) return Infinity; // Basic validation
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // GSAP ticker for continuous animation
    gsap.ticker.add(updateNetwork);

    // Spawn a new line periodically
    gsap.to({}, {
        duration: 0.7,
        repeat: -1,
        onRepeat: spawnRandomLine
    });

    createPoints(); // Create the initial set of points


    // --- АНИМАЦИЯ БУКВ ---
    // --- 1. Wrap letters for entrance animation ---
    const text = "RUNSWIFT STUDIO"; // Установим текст напрямую
    let wrappedText = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') {
        wrappedText += `<span class="letter letter--space"> </span>`; // Use a regular space inside span
      } else {
        wrappedText += `<span class="letter">${char}</span>`;
      }
    }
    titleElement.innerHTML = wrappedText;

    const letters = titleElement.querySelectorAll('.letter:not(.letter--space)'); // Select only non-space letters for animation

    if (letters.length === 0) {
      return;
    }

    // --- 2. Entrance Animation (CSS driven) ---
    // Staggered delay for CSS transition (opacity and transform Y)
    letters.forEach((letter, i) => {
      letter.style.transitionDelay = `${i * 0.05}s`;
    });

    // Add .active class after a short delay to trigger entrance
    // Delay is relative to the entranceConfig in gsap-init.js for titleLettersDelay
    // This should align with when the title container itself is ready.
    // We can use the same delay logic as in gsap-init.js for consistency, or a fixed one.
    // Let's assume entranceConfig is not directly accessible here, so use a reasonable fixed delay.
    // The actual delay for title appearance should be coordinated with gsap-init.js's overall entrance timing.
    const titleEntranceDelay = 0.2 + 0.4; // Approx baseDelay + titleLettersDelay from your gsap-init config

    setTimeout(() => {
      titleElement.classList.add('active');
    }, titleEntranceDelay * 1000); // Convert to milliseconds


    // --- 3. Exit Animation: Letters "Falling" on Scroll ---
    if (letters.length > 0 && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      // Ensure GSAP and ScrollTrigger are available

      // Create a ScrollTrigger for the exit animation
      ScrollTrigger.create({
        trigger: heroSection,       // Element that triggers the animation
        start: "top top",           // When the top of heroSection hits the top of the viewport
        end: '+=100px',          // Animation will be active while heroSection is scrolling out
        // Or a fixed distance like "+=300" or "+=50%"
        scrub: 0.5,                 // Smooth scrubbing effect (0.5 to 2 is usually good)
        // markers: true,           // Uncomment for debugging trigger positions

        onUpdate: (self) => {
          // self.progress will go from 0 to 1 as the heroSection scrolls out
          // We can use this progress to drive the "falling" animation

          letters.forEach((letter, i) => {
            // Calculate random values for each letter to make the fall chaotic
            // These random values self.progress should ideally be generated once per letter and stored,
            // or the animation might look jittery on scrub.
            // For simplicity here, we'll calculate them on each update, but for production, consider storing.

            const randomYValue = 300 + Math.random() * 200; // Fall distance (pixels)
            const randomXValue = (Math.random() - 0.5) * 150; // Horizontal drift (pixels)
            const randomRotationValue = (Math.random() - 0.5) * 120; // Rotation (degrees)
            const randomDelayFactor = Math.random() * 0.6; // To make letters start falling at slightly different times

            // Calculate the actual animation progress for this letter based on scroll progress and random delay
            // We want letters to start falling a bit staggered.
            // Let's say the fall happens during the first 50% of the scroll (self.progress from 0 to 0.5)
            let letterFallProgress = Math.max(0, (self.progress - randomDelayFactor * 0.3) / 2.4); // Normalize to 0-1 over a range
            letterFallProgress = Math.min(1, letterFallProgress); // Clamp between 0 and 1


            // Apply transformations based on letterFallProgress
            // As letterFallProgress goes from 0 to 1:
            // - Y translation increases
            // - Opacity decreases
            // - X translation and Rotation apply

            gsap.to(letter, {
              y: letterFallProgress * randomYValue,
              x: letterFallProgress * randomXValue,
              rotation: letterFallProgress * randomRotationValue,
              opacity: 1 - letterFallProgress, // Fade out as it falls
              duration: 0.1, // Short duration for immediate response to scrub
              ease: "power1.out", // Makes the start of the fall a bit quicker
              overwrite: true // Important for scrub animations
            });
          });
        },
        onLeave: () => { // When hero section is fully scrolled out of view
          // Ensure all letters are hidden if not already
          gsap.to(letters, { opacity: 0, duration: 0.1 });
        },
        onEnterBack: () => { // When scrolling back up and hero re-enters
          // Reset letters to their original state (or entrance animation state)
          gsap.to(letters, { y: 0, x: 0, rotation: 0, opacity: 1, duration: 0.1, overwrite: true });
        }
      });
    }
  }, []);

  return (
    <header ref={heroSectionRef} className="hero-section h-screen bg-[#0f172a] overflow-hidden relative">
      {/* Canvas для комет */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      <div className="parallax-viewport absolute inset-0">
        <div className="parallax-layer layer-far absolute inset-0 bg-[radial-gradient(circle_at_1px,rgba(133,141,148,0.1)_0.5px,transparent_0)] bg-[length:35px_35px]"></div>

        <div className="parallax-layer layer-mid absolute inset-0">
        </div>


        <div className="hero-content absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="layer__header">
            <h1 ref={titleRef} className="layers__title text-6xl md:text-8xl lg:text-[10rem] font-black text-white text-center leading-none"
                style={{
                  fontFamily: '"Inter", sans-serif',
                  textShadow: '0 0 40px rgba(255, 109, 90, 0.4), 0 0 10px rgba(255, 255, 255, 0.8)',
                  // Эти стили повторяют логику из main.css для .hero-section .layers__title
                  letterSpacing: 'normal',
                  fontWeight: 900,
                  WebkitTextStroke: '1px rgba(255, 255, 255, 0.5)', // Добавляем обводку для увеличения толщины
                  textTransform: 'uppercase',
                  lineHeight: 1.05,
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}>
              {/* Буквы генерируются JS */}
            </h1>
          </div>
          <p className="hero-subtitle mt-8 text-brand-muted uppercase tracking-[0.5em] text-sm animate-pulse">
            Современные решения для вашего бизнеса
          </p>

        </div>



        <div className="parallax-layer layer-near absolute inset-0">

        </div>
      </div>
      <style>
        {`
          .letter {
            display: inline-block;
            position: relative;
            font-family: inherit;
            font-weight: inherit;
            font-synthesis: none;
            margin-left: -10px;
            margin-right: -10px;
            opacity: 0;
            transform: translateY(100%);
            transition: opacity 0.8s cubic-bezier(0.2, 0.5, 0, 1),
              transform 0.8s cubic-bezier(0.2, 0.5, 0, 1);
          }
          
          .letter.letter--space {
            margin-left: 0;
            margin-right: 0;
            opacity: 1;
            transform: none;
            transition: none;
            padding-right: 20px; /* Compensation */
          }
          
          .active .letter {
            opacity: 1;
            transform: translateY(0);
          }
        `}
      </style>
    </header>
  );
};

export default LegacyHero;