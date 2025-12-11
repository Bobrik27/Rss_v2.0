import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Регистрируем ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const HeroOldFinalWithComets = () => {
  const containerRef = useRef(null);
 const titleRef = useRef(null);
 const lettersRef = useRef([]);

  useEffect(() => {
    const titleElement = titleRef.current;
    if (!titleElement) return;

    // --- 1. Wrap letters for entrance animation ---
    const text = "RUNSWIFT STUDIO";
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

    // Собираем ссылки на буквы (кроме пробелов)
    const letters = titleElement.querySelectorAll('.letter:not(.letter--space)');
    lettersRef.current = Array.from(letters);

    if (lettersRef.current.length === 0) {
      return;
    }

    // --- 2. Entrance Animation (CSS driven) ---
    // Staggered delay for CSS transition (opacity and transform Y)
    lettersRef.current.forEach((letter, i) => {
      letter.style.transitionDelay = `${i * 0.05}s`;
    });

    // Add .active class after a short delay to trigger entrance
    const titleEntranceDelay = 0.2 + 0.4; // Approx baseDelay + titleLettersDelay from your gsap-init config

    setTimeout(() => {
      titleElement.classList.add('active');
    }, titleEntranceDelay * 1000); // Convert to milliseconds


    // --- 3. Exit Animation: Letters "Falling" on Scroll ---
    if (lettersRef.current.length > 0 && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      // Ensure GSAP and ScrollTrigger are available

      // Create a ScrollTrigger for the exit animation
      ScrollTrigger.create({
        trigger: containerRef.current,       // Element that triggers the animation
        start: "top top",           // When the top of heroSection hits the top of the viewport
        end: '+=100px',          // Animation will be active while heroSection is scrolling out
        // Or a fixed distance like "+=300" or "+=50%"
        scrub: 0.5,                 // Smooth scrubbing effect (0.5 to 2 is usually good)
        // markers: true,           // Uncomment for debugging trigger positions

        onUpdate: (self) => {
          // self.progress will go from 0 to 1 as the heroSection scrolls out
          // We can use this progress to drive the "falling" animation

          lettersRef.current.forEach((letter, i) => {
            // Calculate random values for each letter to make the fall chaotic
            // These random values self.progress should ideally be generated once per letter and stored,
            // or the animation might look jittery on scrub.
            // For simplicity here, we'll calculate them on each update, but for production, consider storing.

            const randomY = 300 + Math.random() * 200; // Fall distance (pixels)
            const randomX = (Math.random() - 0.5) * 150; // Horizontal drift (pixels)
            const randomRotation = (Math.random() - 0.5) * 120; // Rotation (degrees)
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
              y: letterFallProgress * randomY,
              x: letterFallProgress * randomX,
              rotation: letterFallProgress * randomRotation,
              opacity: 1 - letterFallProgress, // Fade out as it falls
              duration: 0.1, // Short duration for immediate response to scrub
              ease: "power1.out", // Makes the start of the fall a bit quicker
              overwrite: true // Important for scrub animations
            });
          });
        },
        onLeave: () => { // When hero section is fully scrolled out of view
          // Ensure all letters are hidden if not already
          gsap.to(lettersRef.current, { opacity: 0, duration: 0.1, overwrite: true });
        },
        onEnterBack: () => { // When scrolling back up and hero re-enters
          // Reset letters to their original state (or entrance animation state)
          gsap.to(lettersRef.current, { y: 0, x: 0, rotation: 0, opacity: 1, duration: 0.1, overwrite: true });
        }
      });
    }
    
    // Parallax layers
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    parallaxLayers.forEach((layer, index) => {
      gsap.to(layer, {
        yPercent: -10 * (index + 1), // Move each layer at a different speed
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
    
    // Comet animation
    const canvas = document.getElementById('cometCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    
    const comets = [];
    
    class Comet {
      constructor() {
        this.reset();
      }
      
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1; // Random size
        this.speed = (Math.random() * 2 + 1) / 2; // Random speed, decreased by 2
        this.angle = Math.random() * Math.PI * 2; // Random direction
        this.color = ['#ff6d5a', '#3b82f6', '#ffffff'][Math.floor(Math.random() * 3)]; // Brand colors
        this.opacity = 0;
        this.fadeIn = true;
        this.fadeOut = false;
        this.life = 100 + Math.random() * 100; // Random life
        this.maxLife = this.life;
        this.trail = [];
      }
      
      update() {
        // Update position
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Update life
        this.life--;
        
        // Fade in/out logic
        if (this.fadeIn) {
          this.opacity += 0.02;
          if (this.opacity >= 1) {
            this.fadeIn = false;
          }
        } else if (this.fadeOut) {
          this.opacity -= 0.02;
          if (this.opacity <= 0) {
            this.reset();
          }
        } else if (this.life < this.maxLife * 0.2) {
          this.fadeOut = true;
        }
        
        // Reset if out of bounds
        if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
          this.reset();
        }
        
        // Update trail
        this.trail.push({x: this.x, y: this.y, opacity: this.opacity});
        if (this.trail.length > 75) { // Увеличиваем максимальную длину хвоста
          this.trail.shift();
        }
      }
      
      draw() {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
          const point = this.trail[i];
          const trailOpacity = (i / this.trail.length) * this.opacity;
          ctx.beginPath();
          ctx.arc(point.x, point.y, this.size * (i / this.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = `${this.color}${Math.floor(trailOpacity * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
        }
        
        // Draw comet head
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${Math.floor(this.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }
    }
    
    // Create comets
    for (let i = 0; i < 15; i++) {
      comets.push(new Comet());
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      comets.forEach(comet => {
        comet.update();
        comet.draw();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <>
      {/* Стили для букв */}
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
    
      <div ref={containerRef} className="relative w-full h-screen bg-[#0f172a] overflow-hidden">
        {/* Canvas для комет */}
        <canvas id="cometCanvas" className="absolute inset-0 w-full h-full z-0" />
        
        {/* Parallax layers */}
        <div className="parallax-viewport absolute inset-0">
          <div className="parallax-layer absolute inset-0 z-10" style={{backgroundImage: 'radial-gradient(circle at 1px, rgba(133, 141, 148, 0.1) 0.5px, transparent 0)', backgroundSize: '35px 35px'}}></div>
          <div className="parallax-layer absolute inset-0 z-20" style={{background: 'linear-gradient(45deg, transparent 40%, rgba(255, 109, 90, 0.1) 50%, transparent 60%)'}}></div>
        </div>
        
        {/* Слой 3: Текст */}
        <div className="relative z-30 w-full h-full flex flex-col items-center justify-center pointer-events-none">
          <h1 ref={titleRef} className="text-6xl md:text-8xl lg:text-9xl font-black text-white text-center leading-none" 
              style={{ 
                fontFamily: '"Inter", sans-serif',
                textShadow: '0 0 40px rgba(255, 109, 90, 0.4), 0 0 10px rgba(255, 255, 255, 0.8)',
                // Эти стили повторяют логику из main.css для .hero-section .layers__title
                letterSpacing: 'normal',
                fontWeight: 900,
                textTransform: 'uppercase',
                lineHeight: 1.05,
                whiteSpace: 'nowrap',
                margin: 0,
              }}>
            {/* Буквы генерируются JS */}
          </h1>
          
          <p className="mt-8 text-brand-muted uppercase tracking-[0.5em] text-sm animate-pulse">
            Modern Automation Solutions
          </p>
        </div>
      </div>
    </>
  );
};

export default HeroOldFinalWithComets;