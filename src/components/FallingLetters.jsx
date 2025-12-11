import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CometCanvas from './CometCanvas.jsx';

// Регистрируем ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const FallingLetters = () => {
  const containerRef = useRef(null);
  const lettersRef = useRef([]);

  useEffect(() => {
    // Разбиваем текст на буквы и создаем span элементы
    const text = "RUNSWIFT STUDIO";
    const container = containerRef.current;
    
    // Очищаем контейнер и добавляем span для каждой буквы
    container.innerHTML = '';
    lettersRef.current = [];
    
    for (let i = 0; i < text.length; i++) {
      const letter = text[i];
      const span = document.createElement('span');
      span.textContent = letter === ' ' ? '\u00A0' : letter; // Используем неразрывный пробел для пробелов
      span.style.display = 'inline-block';
      container.appendChild(span);
      lettersRef.current.push(span);
    }

    // Анимация появления букв при загрузке
    gsap.from(lettersRef.current, {
      scale: 0,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "back.out(1.7)"
    });

    // Анимация при скролле
    gsap.to(lettersRef.current, {
      y: (i) => gsap.utils.random(500, 1200),
      x: (i) => gsap.utils.random(-500, 500),
      rotation: (i) => gsap.utils.random(-360, 360),
      opacity: (i) => 0,
      duration: 2,
      stagger: 0.05,
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "+=150%",
        scrub: 1,
        pin: true
      }
    });

    // Очистка при размонтировании
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="relative h-screen sticky top-0 overflow-hidden">
      {/* Фоновый компонент */}
      <div className="absolute inset-0 z-0">
        <CometCanvas />
      </div>
      
      {/* Текст с буквами */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1
          ref={containerRef}
          className="text-8xl md:text-9xl font-black text-white"
          style={{
            textShadow: '0 0 20px rgba(255, 109, 90, 0.5)',
            fontFamily: 'Inter, sans-serif'
          }}
        >
        </h1>
      </div>
    </div>
  );
};

export default FallingLetters;