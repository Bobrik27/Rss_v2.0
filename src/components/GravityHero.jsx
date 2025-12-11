import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const GravityHero = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const Engine = Matter.Engine,
          Render = Matter.Render,
          World = Matter.World,
          Bodies = Matter.Bodies,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Runner = Matter.Runner,
          Events = Matter.Events;

    const engine = Engine.create();
    const world = engine.world;
    engineRef.current = engine;

    const width = sceneRef.current.clientWidth;
    const height = sceneRef.current.clientHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio 
      }
    });

    // --- СОЗДАЕМ БУКВЫ ---
    const word = "RUNSWIFT";
    const letters = [];
    const colors = ['#ff6d5a', '#3b82f6', '#a855f7', '#ffffff', '#ff6d5a'];
    
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * (width - 100) + 50;
        const y = -Math.random() * 500 - 50;
        const char = word.charAt(Math.floor(Math.random() * word.length));
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 60; // Размер квадрата тела

        // Создаем физическое тело (невидимое, но твердое)
        const body = Bodies.rectangle(x, y, size, size, {
            restitution: 0.8,
            render: { fillStyle: 'transparent' }, // Тело прозрачное
            label: char, // Запоминаем букву
            customColor: color // Запоминаем цвет
        });
        letters.push(body);
    }

    // Границы
    const ground = Bodies.rectangle(width / 2, height + 30, width, 60, { isStatic: true, render: { visible: false } });
    const leftWall = Bodies.rectangle(-30, height / 2, 60, height, { isStatic: true, render: { visible: false } });
    const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height, { isStatic: true, render: { visible: false } });
    
    World.add(world, [...letters, ground, leftWall, rightWall]);

    // --- ХУК РИСОВАНИЯ (Рисуем текст поверх тел) ---
    Events.on(render, 'afterRender', function() {
        const context = render.context;
        context.font = "900 40px Inter, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";

        letters.forEach(body => {
            const { x, y } = body.position;
            const angle = body.angle;

            context.save();
            context.translate(x, y);
            context.rotate(angle);
            
            // Рисуем красивую букву
            context.fillStyle = body.customColor;
            context.fillText(body.label, 0, 0);
            
            // Добавляем тень/обводку для красоты
            context.strokeStyle = 'rgba(255,255,255,0.1)';
            context.lineWidth = 1;
            context.strokeText(body.label, 0, 0);

            context.restore();
        });
    });

    // Мышь
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    mouseConstraint.mouse.element.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel);
    mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel);
    World.add(world, mouseConstraint);

    Runner.run(engine);
    Render.run(render);

    return () => {
      Render.stop(render);
      World.clear(world);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-3xl border border-white/10 bg-brand-surface/30 backdrop-blur-sm">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <h2 className="text-8xl font-black text-white/5 uppercase select-none tracking-tighter">
                PHYSICS
            </h2>
        </div>
        <div ref={sceneRef} className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing" />
    </div>
  );
};
export default GravityHero;