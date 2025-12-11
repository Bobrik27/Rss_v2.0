import React, { useEffect, useRef } from 'react';

const CometCanvas = () => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Комета
 class Comet {
    constructor(canvasWidth, canvasHeight) {
      // Выбираем случайную сторону экрана для начала
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      
      // Определяем начальную позицию в зависимости от стороны
      switch(side) {
        case 0: // Top
          this.x = Math.random() * canvasWidth;
          this.y = -10;
          // Направление к нижней границе
          const targetX1 = Math.random() * canvasWidth;
          const targetY1 = canvasHeight + 10;
          this.angle = Math.atan2(targetY1 - this.y, targetX1 - this.x);
          break;
        case 1: // Right
          this.x = canvasWidth + 10;
          this.y = Math.random() * canvasHeight;
          // Направление к левой границе
          const targetX2 = -10;
          const targetY2 = Math.random() * canvasHeight;
          this.angle = Math.atan2(targetY2 - this.y, targetX2 - this.x);
          break;
        case 2: // Bottom
          this.x = Math.random() * canvasWidth;
          this.y = canvasHeight + 10;
          // Направление к верхней границе
          const targetX3 = Math.random() * canvasWidth;
          const targetY3 = -10;
          this.angle = Math.atan2(targetY3 - this.y, targetX3 - this.x);
          break;
        case 3: // Left
          this.x = -10;
          this.y = Math.random() * canvasHeight;
          // Направление к правой границе
          const targetX4 = canvasWidth + 10;
          const targetY4 = Math.random() * canvasHeight;
          this.angle = Math.atan2(targetY4 - this.y, targetX4 - this.x);
          break;
      }
      
      this.speed = (1 + Math.random() * 1.5) / 2; // Уменьшаем скорость в 2 раза
      this.tailLength = 20 + Math.random() * 30;
      this.color = ['#ff6d5a', '#3b82f6', '#ffffff'][Math.floor(Math.random() * 3)];
      this.life = 10 + Math.random() * 100;
      this.maxLife = this.life;
      this.trail = [];
      
      // Инициализация хвоста
      for (let i = 0; i < this.tailLength; i++) {
        this.trail.push({
          x: this.x - Math.cos(this.angle) * i * 2,
          y: this.y - Math.sin(this.angle) * i * 2,
          alpha: i / this.tailLength
        });
      }
    }
    
    update(canvasWidth, canvasHeight) {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.life--;
      
      // Обновляем хвост
      this.trail.pop();
      this.trail.unshift({
        x: this.x,
        y: this.y,
        alpha: 1
      });
      
      // Проверяем, достигла ли комета края экрана
      return this.x < -50 || this.x > canvasWidth + 50 || this.y < -50 || this.y > canvasHeight + 50 || this.life <= 0;
    }
    
    draw(ctx) {
      // Рисуем хвост кометы
      for (let i = 0; i < this.trail.length; i++) {
        const point = this.trail[i];
        const alpha = point.alpha * (this.life / this.maxLife);
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        // Используем цвет с разной прозрачностью
        const colorMatch = this.color.match(/^#([0-9a-f]{6})$/i);
        if(colorMatch) {
          const hex = colorMatch[1];
          ctx.fillStyle = `#${hex}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        } else {
          ctx.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        }
        ctx.fill();
      }
      
      // Рисуем голову кометы
      const headAlpha = this.life / this.maxLife;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2, false);
      // Используем цвет с прозрачностью
      const colorMatch = this.color.match(/^#([0-9a-f]{6})$/i);
      if(colorMatch) {
        const hex = colorMatch[1];
        ctx.fillStyle = `#${hex}${Math.floor(headAlpha * 255).toString(16).padStart(2, '0')}`;
      } else {
        ctx.fillStyle = `${this.color}${Math.floor(headAlpha * 255).toString(16).padStart(2, '0')}`;
      }
      ctx.fill();
    }
 }
  
  // Искра (частица взрыва)
  class Spark {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 6;
      this.vy = (Math.random() - 0.5) * 6;
      this.life = 30 + Math.random() * 30;
      this.maxLife = this.life;
      this.color = color;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      this.vx *= 0.98; // Замедление
      this.vy *= 0.98;
      
      return this.life <= 0;
    }
    
    draw(ctx) {
      const alpha = this.life / this.maxLife;
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
    }
  }
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размеры canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Массивы для комет и искр
    const comets = [];
    const sparks = [];
    
    // Создаем начальные кометы
    for (let i = 0; i < 5; i++) {
      comets.push(new Comet(canvas.width, canvas.height));
    }
    
    // Функция анимации
    const animate = () => {
      // Очищаем canvas с прозрачным фоном
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Обновляем и рисуем кометы
      for (let i = comets.length - 1; i >= 0; i--) {
        const comet = comets[i];
        
        if (comet.update(canvas.width, canvas.height)) {
          // Если комета достигла края или закончилась жизнь, создаем взрыв
          for (let j = 0; j < 5 + Math.floor(Math.random() * 6); j++) {
            sparks.push(new Spark(comet.x, comet.y, comet.color));
          }
          
          // Удаляем комету и создаем новую
          comets.splice(i, 1);
          comets.push(new Comet(canvas.width, canvas.height));
        } else {
          comet.draw(ctx);
        }
      }
      
      // Обновляем и рисуем искры
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        
        if (spark.update()) {
          sparks.splice(i, 1);
        } else {
          spark.draw(ctx);
        }
      }
      
      // Запускаем следующий кадр
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Запускаем анимацию
    animate();
    
    // Очистка при размонтировании
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1
      }}
    />
  );
};

export default CometCanvas;