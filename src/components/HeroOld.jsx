import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Регистрируем ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const HeroOld = () => {
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
          gsap.to(lettersRef.current, { opacity: 0, duration: 0.1 });
        },
        onEnterBack: () => { // When scrolling back up and hero re-enters
          // Reset letters to their original state (or entrance animation state)
          gsap.to(lettersRef.current, { y: 0, x: 0, rotation: 0, opacity: 1, duration: 0.1, overwrite: true });
        }
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-[#0f172a] overflow-hidden">
      {/* Слой 2: Текст */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
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
  );
};

export default HeroOld;