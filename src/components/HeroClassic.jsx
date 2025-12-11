import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HeroClassic = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
 const titleRef = useRef(null);

  // 1. ЛОГИКА КОМЕТ (CANVAS)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Класс частицы (Комета)
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        // Случайная позиция за краем экрана
        const side = Math.floor(Math.random() * 4); // 0:top, 1:right, 2:bottom, 3:left
        if (side === 0) { this.x = Math.random() * canvas.width; this.y = -10; this.vx = (Math.random() - 0.5) * 2; this.vy = Math.random() * 2 + 1; }
        else if (side === 1) { this.x = canvas.width + 10; this.y = Math.random() * canvas.height; this.vx = -(Math.random() * 2 + 1); this.vy = (Math.random() - 0.5) * 2; }
        else if (side === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + 10; this.vx = (Math.random() - 0.5) * 2; this.vy = -(Math.random() * 2 + 1); }
        else { this.x = -10; this.y = Math.random() * canvas.height; this.vx = Math.random() * 2 + 1; this.vy = (Math.random() - 0.5) * 2; }

        this.size = Math.random() * 2 + 1;
        this.life = 100 + Math.random() * 100;
        this.alpha = 0;
        // Цвета бренда
        const colors = ['255, 109, 90', '59, 130, 246', '255, 255, 255']; 
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.history = []; // Для хвоста
      }

      update() {
        this.x += this.vx * 0.5; // Скорость
        this.y += this.vy * 0.5;
        this.life--;
        
        // Плавное появление и затухание
        if (this.life > 180) this.alpha += 0.01;
        else if (this.life < 50) this.alpha -= 0.02;
        if (this.alpha > 1) this.alpha = 1;
        if (this.alpha < 0) this.alpha = 0;

        // Хвост
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 20) this.history.shift();

        if (this.life <= 0 || this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        // Рисуем хвост
        for (let i = 0; i < this.history.length; i++) {
            const point = this.history[i];
            const tailAlpha = (i / this.history.length) * this.alpha;
            ctx.lineTo(point.x, point.y);
            ctx.strokeStyle = `rgba(${this.color}, ${tailAlpha})`;
        }
        ctx.stroke();
        
        // Рисуем голову
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();
      }
    }

    // Создаем 30 комет
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Композиция для эффекта свечения
      ctx.globalCompositeOperation = 'lighter';
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);


 // 2. ЛОГИКА ТЕКСТА (GSAP SCROLL)
  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;

    // Разбиваем текст на буквы для анимации
    const text = "RUNSWIFT STUDIO";
    title.innerHTML = '';
    [...text].forEach(char => {
        const span = document.createElement('span');
        span.innerText = char;
        span.style.display = 'inline-block';
        span.style.minWidth = char === ' ' ? '0.6em' : 'auto';
        span.classList.add('char'); // Класс для стилей
        title.appendChild(span);
    });

    const chars = title.querySelectorAll('.char');

    // Начальная анимация (Entrance) - буквы собираются
    gsap.fromTo(chars, 
        { opacity: 0, y: 50, scale: 2, filter: 'blur(10px)' },
        { 
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            stagger: 0.05, duration: 1.2, ease: "power3.out" 
        }
    );

    // Анимация при скролле (Explosion/Fall)
    // Генерируем случайные параметры разлета
    const scatterData = Array.from(chars).map(() => ({
        x: (Math.random() - 0.5) * 800,
        y: Math.random() * 800 + 200,
        rotation: (Math.random() - 0.5) * 720,
        scale: Math.random() * 0.5 + 0.5
    }));

    const st = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=150%", // Длинный скролл для плавности
        pin: true,     // Закрепляем экран
        scrub: 1,      // Привязка к скроллу
        onUpdate: (self) => {
            const p = self.progress;
            
            chars.forEach((char, i) => {
                const data = scatterData[i];
                // Интерполяция
                gsap.to(char, {
                    x: data.x * p,
                    y: data.y * p,
                    rotation: data.rotation * p,
                    opacity: 1 - p * 1.5, // Исчезают к концу
                    scale: 1 - p * 0.2,
                    filter: `blur(${p * 10}px)`, // Размываются в полете
                    overwrite: 'auto',
                    duration: 0
                });
            });
        }
    });

    return () => {
        if (st) st.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-[#0f172a] overflow-hidden">
        {/* Слой 1: Canvas Кометы */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-60" />

        {/* Слой 2: Текст */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
            <h1 ref={titleRef} className="text-6xl md:text-8xl lg:text-9xl font-black text-white text-center leading-none" 
                style={{ 
                    fontFamily: '"Inter", sans-serif',
                    textShadow: '0 0 40px rgba(255, 109, 90, 0.4), 0 0 10px rgba(255, 255, 255, 0.8)'
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

export default HeroClassic;