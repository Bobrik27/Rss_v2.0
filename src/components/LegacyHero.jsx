import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Регистрируем плагин (проверка на window для SSR)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const LegacyHero = () => {
  const heroSectionRef = useRef(null);
  const titleRef = useRef(null);
  const canvasRef = useRef(null);

  // --- ТОЛЬКО ЭТО ДОБАВЛЕНО: Состояние для смены цветов ---
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Функция проверки темы
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark' || !theme);
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  // ---------------------------------------------------------

  useEffect(() => {
    const titleElement = titleRef.current;
    const heroSection = heroSectionRef.current;
    const canvas = canvasRef.current;

    if (!titleElement || !heroSection || !canvas) {
      return;
    }

    // --- НИЖЕ ВЕСЬ ТВОЙ ОРИГИНАЛЬНЫЙ КОД БЕЗ ИЗМЕНЕНИЙ ---
    // --- NETWORK АНИМАЦИЯ (КОМЕТЫ) ---
    const ctx = canvas.getContext('2d');
    let points = [];
    let activeLines = [];
    let activeExplosions = [];

    // --- Network Settings ---
    const networkSettings = {
        numPoints: 800, 
        pointRadius: 1.5, 
        pointColor: 'rgba(133, 141, 148, 0)', 
        connectDistance: 500, 
        lineColors: [
            'rgba(255, 127, 80, 0.8)', // --accent-bright
            'rgba(66, 181, 239, 0.7)', // --accent-warm
            'rgba(219, 35, 239, 0.7)',
            'rgba(234, 234, 234, 0.6)'  // --text-color
        ],
        lineWidthStart: 2.5, 
        cometTailLength: 7.35, 
        lineAnimationDuration: 2.8, 
        explosionMaxRadiusFactor: 20, 
        explosionDuration: 0.9, 
        maxActiveLines: 20 
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
            this.x = x; 
            this.y = y; 
            this.color = color; 
            this.radius = networkSettings.pointRadius; 
            this.opacity = 0.8; 

            gsap.to(this, {
                radius: networkSettings.pointRadius * networkSettings.explosionMaxRadiusFactor, 
                opacity: 0, 
                duration: networkSettings.explosionDuration, 
                ease: "expo.out", 
                onComplete: () => {
                    activeExplosions = activeExplosions.filter(exp => exp !== this);
                }
            });
        }

        draw(ctx) {
            if (this.opacity <= 0.01 || this.radius <= 0.1) return;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

            const rgbColorMatch = this.color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            const rgbColor = rgbColorMatch ? `${rgbColorMatch[1]},${rgbColorMatch[2]},${rgbColorMatch[3]}` : '255,127,80'; 

            const gradient = ctx.createRadialGradient(
                this.x, this.y, this.radius * 0.1, 
                this.x, this.y, this.radius        
            );
            gradient.addColorStop(0, `rgba(${rgbColor}, ${this.opacity * 0.9})`); 
            gradient.addColorStop(0.6, `rgba(${rgbColor}, ${this.opacity * 0.5})`); 
            gradient.addColorStop(1, `rgba(${rgbColor}, 0)`);                   

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
            this.isVisible = true; 
            this.color = networkSettings.lineColors[Math.floor(Math.random() * networkSettings.lineColors.length)];

            const tl = gsap.timeline({});

            tl.to(this, {
                headProgress: 1,
                onUpdate: () => {
                    this.tailStartProgress = Math.max(0, this.headProgress - networkSettings.cometTailLength);
                },
                duration: networkSettings.lineAnimationDuration,
                ease: "linear",
                onComplete: () => {
                    this.isVisible = false; 
                    const explosion = new ExplosionEffect(this.p2.x, this.p2.y, this.color);
                    activeExplosions.push(explosion); 
                    activeLines = activeLines.filter(line => line !== this);
                }
            });
        }

        draw() {
            if (!ctx || !this.isVisible) return;
            if (this.headProgress >= 1 && this.tailStartProgress >= this.headProgress) return;

            const dx = this.p2.x - this.p1.x;
            const dy = this.p2.y - this.p1.y;
            const headX = this.p1.x + dx * this.headProgress;
            const headY = this.p1.y + dy * this.headProgress;
            const tailStartX = this.p1.x + dx * this.tailStartProgress;
            const tailStartY = this.p1.y + dy * this.tailStartProgress;

            if (Math.abs(headX - tailStartX) < 0.1 && Math.abs(headY - tailStartY) < 0.1 && this.headProgress < 0.05) {
                return;
            }

            ctx.beginPath();
            ctx.moveTo(tailStartX, tailStartY);
            ctx.lineTo(headX, headY);

            const gradient = ctx.createLinearGradient(tailStartX, tailStartY, headX, headY);
            const baseColorAlphaMatch = this.color.match(/, ([\d.]+)\)/); 
            const baseColorAlpha = baseColorAlphaMatch ? parseFloat(baseColorAlphaMatch[1]) : 0.7;

            gradient.addColorStop(0, this.color.replace(/, [\d.]+\)/, `, 0)`)); 
            gradient.addColorStop(0.5, this.color.replace(/, [\d.]+\)/, `, ${baseColorAlpha * 0.3})`)); 
            gradient.addColorStop(1, this.color.replace(/, [\d.]+\)/, `, ${baseColorAlpha})`));     

            ctx.strokeStyle = gradient;
            ctx.lineWidth = networkSettings.lineWidthStart;
            ctx.lineCap = 'round'; 
            ctx.stroke();

            const headRadius = networkSettings.lineWidthStart > 1 ? networkSettings.lineWidthStart / 1.5 : 1; 
            ctx.beginPath();
            ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace(/, ([\d.]+)\)/, `, ${Math.min(1, baseColorAlpha + 0.2)})`);
            ctx.fill();
        }
    }

    function createPoints() {
        points.length = 0; 
        for (let i = 0; i < networkSettings.numPoints; i++) {
            points.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: networkSettings.pointRadius,
                id: i 
            });
        }
    }

    function drawStaticPoints() {
        if (!ctx) return;
        const pointColorAlphaMatch = networkSettings.pointColor.match(/, (\d\.\d+|\d)\)/);
        let pointColorAlpha = 0; 
        if (pointColorAlphaMatch) {
            pointColorAlpha = parseFloat(pointColorAlphaMatch[1]);
        } else if (networkSettings.pointColor && !networkSettings.pointColor.includes('rgba')) {
            pointColorAlpha = 1;
        }

        if (pointColorAlpha === 0) return; 

        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
            ctx.fillStyle = networkSettings.pointColor;
            ctx.fill();
        });
    }

    function updateNetwork() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        drawStaticPoints(); 
        activeLines.forEach(line => { line.draw(); });
        activeExplosions.forEach(explosion => { explosion.draw(ctx); });
    }

    function spawnRandomLine() {
        if (!canvas || points.length < 2 || activeLines.length >= networkSettings.maxActiveLines) {
            return;
        }

        let p1Index = Math.floor(Math.random() * points.length);
        let p2Index = Math.floor(Math.random() * points.length);
        let attempts = 0;
        const maxAttempts = 50; 

        while (p1Index === p2Index && attempts < maxAttempts) {
            p2Index = Math.floor(Math.random() * points.length);
            attempts++;
        }
        if (p1Index === p2Index) return; 

        attempts = 0; 
        while (getDistance(points[p1Index], points[p2Index]) > networkSettings.connectDistance && attempts < maxAttempts) {
            p1Index = Math.floor(Math.random() * points.length);
            p2Index = Math.floor(Math.random() * points.length);
            let innerAttempts = 0;
            while (p1Index === p2Index && innerAttempts < maxAttempts) {
                p2Index = Math.floor(Math.random() * points.length);
                innerAttempts++;
            }
            if (p1Index === p2Index) { attempts = maxAttempts; break; } 
            attempts++;
        }

        if (p1Index !== p2Index && getDistance(points[p1Index], points[p2Index]) <= networkSettings.connectDistance) {
            const newLine = new AnimatedLine(points[p1Index], points[p2Index]);
            activeLines.push(newLine);
        }
    }

    function getDistance(p1, p2) {
        if (!p1 || !p2) return Infinity; 
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    gsap.ticker.add(updateNetwork);

    gsap.to({}, {
        duration: 0.7,
        repeat: -1,
        onRepeat: spawnRandomLine
    });

    createPoints(); 


    // --- АНИМАЦИЯ БУКВ ---
    const text = "RUNSWIFT STUDIO"; 
    let wrappedText = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') {
        wrappedText += `<span class="letter letter--space"> </span>`; 
      } else {
        wrappedText += `<span class="letter">${char}</span>`;
      }
    }
    titleElement.innerHTML = wrappedText;

    const letters = titleElement.querySelectorAll('.letter:not(.letter--space)'); 

    if (letters.length === 0) {
      return;
    }

    letters.forEach((letter, i) => {
      letter.style.transitionDelay = `${i * 0.05}s`;
    });

    const titleEntranceDelay = 0.2 + 0.4; 

    setTimeout(() => {
      titleElement.classList.add('active');
    }, titleEntranceDelay * 1000); 


    // --- 3. Exit Animation: Letters "Falling" on Scroll ---
    if (letters.length > 0 && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      
      ScrollTrigger.create({
        trigger: heroSection,       
        start: "top top",           
        end: '+=100px',          
        scrub: 0.5,                 
        
        onUpdate: (self) => {
          letters.forEach((letter, i) => {
            const randomYValue = 300 + Math.random() * 200; 
            const randomXValue = (Math.random() - 0.5) * 150; 
            const randomRotationValue = (Math.random() - 0.5) * 120; 
            const randomDelayFactor = Math.random() * 0.6; 

            let letterFallProgress = Math.max(0, (self.progress - randomDelayFactor * 0.3) / 2.4); 
            letterFallProgress = Math.min(1, letterFallProgress); 

            gsap.to(letter, {
              y: letterFallProgress * randomYValue,
              x: letterFallProgress * randomXValue,
              rotation: letterFallProgress * randomRotationValue,
              opacity: 1 - letterFallProgress, 
              duration: 0.1, 
              ease: "power1.out", 
              overwrite: true 
            });
          });
        },
        onLeave: () => { 
          gsap.to(letters, { opacity: 0, duration: 0.1 });
        },
        onEnterBack: () => { 
          gsap.to(letters, { y: 0, x: 0, rotation: 0, opacity: 1, duration: 0.1, overwrite: true });
        }
      });
    }

    // Добавлен простой Cleanup, чтобы не дублировалось при HMR
    return () => {
        gsap.ticker.remove(updateNetwork);
        ScrollTrigger.getAll().forEach(t => t.kill());
        window.removeEventListener('resize', resizeCanvas);
    };

  }, []); // Оставляем пустой массив, чтобы логика не перезапускалась

  return (
    // ИЗМЕНЕНИЕ: Динамический класс фона
    <header 
        ref={heroSectionRef} 
        className={`hero-section h-screen overflow-hidden relative transition-colors duration-500 ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      <div className="parallax-viewport absolute inset-0">
        <div className="parallax-layer layer-far absolute inset-0 bg-[radial-gradient(circle_at_1px,rgba(133,141,148,0.1)_0.5px,transparent_0)] bg-[length:35px_35px]"></div>
        <div className="parallax-layer layer-mid absolute inset-0"></div>

        <div className="hero-content absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="layer__header px-4">
            {/* ИЗМЕНЕНИЕ: Динамический цвет текста и свечение */}
            <h1 ref={titleRef} 
                className={`layers__title text-6xl md:text-8xl lg:text-[10rem] font-black text-center leading-none transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{
                  fontFamily: '"Inter", sans-serif',
                  // Свечение: включаем только если isDark
                  textShadow: isDark 
                    ? '0 0 40px rgba(255, 109, 90, 0.4), 0 0 10px rgba(255, 255, 255, 0.8)' 
                    : 'none',
                  letterSpacing: 'normal',
                  fontWeight: 900,
                  // Обводка: включаем только если isDark
                  WebkitTextStroke: isDark ? '1px rgba(255, 255, 255, 0.5)' : '0px',
                  textTransform: 'uppercase',
                  lineHeight: 1.05,
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}>
              {/* Буквы генерируются JS */}
            </h1>
          </div>
          {/* ИЗМЕНЕНИЕ: Динамический цвет подзаголовка */}
          <p className={`hero-subtitle mt-8 uppercase tracking-[0.5em] text-sm animate-pulse transition-colors duration-300 ${isDark ? 'text-brand-muted' : 'text-slate-500'}`}>
            Современные решения для вашего бизнеса
          </p>

        </div>

        <div className="parallax-layer layer-near absolute inset-0"></div>
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