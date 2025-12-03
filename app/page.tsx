"use client";

import React, { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';

// --- 內建圖示元件 (取代 lucide-react 以避免依賴錯誤) ---
const Paintbrush = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2.5 2.24 0 .46.25.96.5 1.4.55.99 1.63 1.4 2.8 1.4 2.63 0 4.2-2.67 4.2-5.96 0-1.16-.55-2.1-1.2-2.1" />
  </svg>
);

const Eraser = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);

const Check = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const X = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const Trash2 = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const Palette = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

// --- 介面定義 ---

// 定義角色的介面
interface Character {
  id: number;
  src: string;
  x: number;
  y: number;
  speed: number;
  scale: number;
  bobOffset: number;
}

// 定義座標介面
interface Coordinates {
  offsetX: number;
  offsetY: number;
}

// 定義雪花介面 (用於渲染)
interface SnowflakeData {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
  opacity: number;
  size: string;
}

export default function Home() {
  // --- 狀態管理 ---
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [color, setColor] = useState<string>('#FF0000');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  
  // --- Refs ---
  // 明確指定 Ref 的類型為 HTMLCanvasElement
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Context 可以是 null
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // 預設顏色盤
  const colors: string[] = [
    '#000000', // 黑
    '#FF0000', // 紅
    '#FF9900', // 橘
    '#FFFF00', // 黃
    '#00FF00', // 綠
    '#00FFFF', // 藍綠
    '#0000FF', // 藍
    '#9900FF', // 紫
    '#FF00FF', // 粉紅
    '#FFFFFF', // 白
  ];

  // --- 初始化畫布 ---
  useEffect(() => {
    if (isDrawingMode && canvasRef.current) {
      const canvas = canvasRef.current;
      
      // RWD: 根據視窗大小計算畫布尺寸
      // 預設最大寬度 400px，但在小螢幕上會自動縮小 (保留 48px padding)
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 600;
      const size = Math.min(windowWidth - 48, 400); 

      // 設定解析度為顯示尺寸的 2 倍 (支援 Retina 螢幕)
      canvas.width = size * 2;
      canvas.height = size * 2;
      
      // 設定 CSS 顯示尺寸
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        contextRef.current = ctx;
      }
    }
  }, [isDrawingMode]);

  // --- 更新畫筆設定 ---
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize]);

  // --- 取得座標 (統一處理滑鼠與觸控) ---
  const getCoordinates = (
    event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ): Coordinates => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };

    // 檢查是否為觸控事件 ('touches' in event 這種檢查在 TS 中需要 Type Guard 或直接檢查屬性)
    if ('touches' in event && event.touches.length > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      const touch = event.touches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      };
    }
    
    // 滑鼠事件
    const mouseEvent = event as MouseEvent<HTMLCanvasElement>;
    return {
      offsetX: mouseEvent.nativeEvent.offsetX,
      offsetY: mouseEvent.nativeEvent.offsetY
    };
  };

  // --- 繪圖功能 ---
  const startDrawing = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!contextRef.current) return;
    const { offsetX, offsetY } = getCoordinates(event);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    const { offsetX, offsetY } = getCoordinates(event);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  // --- 清除畫布 ---
  const clearCanvas = () => {
    if (canvasRef.current && contextRef.current) {
      // 獲取當前實際的 canvas 尺寸來清除
      const width = canvasRef.current.width / 2;
      const height = canvasRef.current.height / 2;
      contextRef.current.clearRect(0, 0, width, height);
    }
  };

  // --- 儲存並上傳到場景 ---
  const saveToScene = () => {
    if (!canvasRef.current) return;
    
    // 將畫布轉為圖片 URL
    const imageURL = canvasRef.current.toDataURL("image/png");
    
    // 建立新角色物件
    const newCharacter: Character = {
      id: Date.now(),
      src: imageURL,
      x: -150, // 從左側螢幕外開始
      y: 50 + Math.random() * 20, // 稍微隨機的高度
      speed: 1 + Math.random() * 2, // 隨機速度
      scale: 0.8 + Math.random() * 0.4, // 隨機大小
      bobOffset: Math.random() * 100, // 上下浮動的相位
    };

    setCharacters(prev => [...prev, newCharacter]);
    setIsDrawingMode(false);
  };

  // --- 動畫循環 (讓角色移動) ---
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setCharacters(prevChars => {
        return prevChars.map(char => {
          let newX = char.x + char.speed;
          
          // 如果超出右邊界，回到左邊重新開始
          if (typeof window !== 'undefined' && newX > window.innerWidth) {
            newX = -150;
          }

          return {
            ...char,
            x: newX,
          };
        });
      });
    }, 16); // 約 60fps

    return () => clearInterval(gameLoop);
  }, []);

  // --- 雪花效果元件 ---
  const Snow: React.FC = () => {
    const [snowflakes, setSnowflakes] = useState<SnowflakeData[]>([]);

    useEffect(() => {
        const flakes = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random(),
            size: `${Math.random() * 10 + 5}px`
          }));
        setSnowflakes(flakes);
    }, []);

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {snowflakes.map(flake => (
          <div
            key={flake.id}
            className="absolute bg-white rounded-full animate-fall"
            style={{
              left: flake.left,
              top: '-20px',
              width: flake.size,
              height: flake.size,
              opacity: flake.opacity,
              animation: `fall ${flake.animationDuration} linear infinite`,
              animationDelay: flake.animationDelay
            }}
          />
        ))}
        {/* CSS 動畫 */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fall {
            0% { transform: translateY(-20px) translateX(0px); }
            100% { transform: translateY(110vh) translateX(20px); }
          }
        `}} />
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-blue-300 font-sans select-none">
      
      {/* --- 場景層 --- */}
      
      {/* 月亮：手機上變小一點 */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 w-16 h-16 md:w-24 md:h-24 bg-yellow-100 rounded-full shadow-[0_0_40px_rgba(255,255,200,0.6)] opacity-90"></div>

      {/* 遠山：響應式高度調整 */}
      <div className="absolute bottom-0 w-full flex items-end opacity-60">
        <div className="w-0 h-0 border-l-[100px] md:border-l-[150px] border-l-transparent border-r-[100px] md:border-r-[150px] border-r-transparent border-b-[200px] md:border-b-[300px] border-b-slate-700 transform translate-x-[-20px] md:translate-x-[-50px]"></div>
        <div className="w-0 h-0 border-l-[120px] md:border-l-[200px] border-l-transparent border-r-[120px] md:border-r-[200px] border-r-transparent border-b-[250px] md:border-b-[400px] border-b-slate-600 transform translate-x-[-50px] md:translate-x-[-100px]"></div>
        <div className="w-0 h-0 border-l-[100px] md:border-l-[180px] border-l-transparent border-r-[100px] md:border-r-[180px] border-r-transparent border-b-[200px] md:border-b-[350px] border-b-slate-700 transform translate-x-[-20px] md:translate-x-[-50px]"></div>
        <div className="w-0 h-0 border-l-[180px] md:border-l-[300px] border-l-transparent border-r-[180px] md:border-r-[300px] border-r-transparent border-b-[300px] md:border-b-[500px] border-b-slate-800 ml-auto translate-x-[50px] md:translate-x-[100px]"></div>
      </div>

      {/* 雪地地面 */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-slate-100 to-white rounded-t-[50%] transform scale-x-150 shadow-inner"></div>

      {/* 聖誕樹 (SVG)：響應式寬度 */}
      <div className="absolute bottom-[15%] left-[5%] md:left-[10%] w-24 sm:w-32 md:w-48 lg:w-60 z-10 transition-all duration-300">
        <svg viewBox="0 0 100 150" className="drop-shadow-2xl">
          <path d="M50 10 L20 60 L80 60 Z" fill="#165B33" />
          <path d="M50 40 L15 100 L85 100 Z" fill="#146B3A" />
          <path d="M50 80 L10 140 L90 140 Z" fill="#0F8A45" />
          <rect x="40" y="140" width="20" height="20" fill="#4B3621" />
          {/* 裝飾 */}
          <circle cx="30" cy="50" r="3" fill="#FF0000" className="animate-pulse" />
          <circle cx="70" cy="90" r="3" fill="#FFD700" className="animate-pulse" style={{animationDelay: '0.5s'}} />
          <circle cx="40" cy="110" r="3" fill="#00FFFF" className="animate-pulse" style={{animationDelay: '1s'}} />
        </svg>
      </div>

      {/* 房子 (SVG)：響應式寬度 */}
      <div className="absolute bottom-[18%] right-[5%] md:right-[15%] w-32 sm:w-48 md:w-64 lg:w-72 z-10 transition-all duration-300">
        <svg viewBox="0 0 200 200" className="drop-shadow-2xl">
          {/* 屋身 */}
          <rect x="40" y="80" width="120" height="100" fill="#8B4513" />
          {/* 屋頂 */}
          <path d="M30 80 L100 20 L170 80" fill="#A52A2A" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          {/* 煙囪 */}
          <rect x="130" y="40" width="20" height="30" fill="#555" />
          <ellipse cx="140" cy="35" rx="10" ry="3" fill="#333" />
          {/* 煙 */}
          <g className="animate-pulse opacity-50">
             <circle cx="145" cy="20" r="5" fill="#DDD" />
             <circle cx="150" cy="5" r="8" fill="#DDD" />
          </g>
          {/* 門 */}
          <rect x="85" y="130" width="30" height="50" fill="#654321" />
          <circle cx="110" cy="155" r="2" fill="#FFD700" />
          {/* 窗戶 */}
          <rect x="55" y="100" width="25" height="25" fill="#FFFF00" opacity="0.8" />
          <line x1="67.5" y1="100" x2="67.5" y2="125" stroke="#8B4513" strokeWidth="2" />
          <line x1="55" y1="112.5" x2="80" y2="112.5" stroke="#8B4513" strokeWidth="2" />
          
          <rect x="120" y="100" width="25" height="25" fill="#FFFF00" opacity="0.8" />
          <line x1="132.5" y1="100" x2="132.5" y2="125" stroke="#8B4513" strokeWidth="2" />
          <line x1="120" y1="112.5" x2="145" y2="112.5" stroke="#8B4513" strokeWidth="2" />
        </svg>
      </div>

      {/* 下雪動畫 */}
      <Snow />

      {/* --- 移動的角色 --- */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {characters.map((char) => (
          <div
            key={char.id}
            // 修正：移除 transition-transform 避免與 JS 動畫迴圈衝突導致殘影
            className="absolute will-change-transform"
            style={{
              left: 0, 
              bottom: '10%', // 基準線在雪地上
              transform: `
                translateX(${char.x}px) 
                translateY(${-char.y + Math.sin(char.x / 30 + char.bobOffset) * 10}px) 
                scale(${char.scale})
              `,
            }}
          >
            {/* 陰影 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-4 bg-black opacity-20 blur-sm rounded-full transform scale-y-50 origin-bottom"></div>
            {/* 角色圖片：手機上變小一點 */}
            <img 
              src={char.src} 
              alt="character" 
              className="w-20 h-20 md:w-32 md:h-32 object-contain filter drop-shadow-md"
            />
          </div>
        ))}
      </div>

      {/* --- UI 控制項 --- */}
      
      {/* 開始繪畫按鈕 */}
      {!isDrawingMode && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
          <button
            onClick={() => setIsDrawingMode(true)}
            className="group relative flex items-center justify-center gap-2 md:gap-3 bg-red-600 hover:bg-red-500 text-white text-lg md:text-2xl font-bold py-3 px-8 md:py-4 md:px-12 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 border-4 border-white"
          >
            <Paintbrush size={24} className="md:w-8 md:h-8" />
            畫個新朋友
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-red-700 text-[10px] md:text-xs font-bold px-2 py-1 rounded-full animate-bounce">
              Start!
            </div>
          </button>
        </div>
      )}

      {/* 繪圖板 Modal */}
      {isDrawingMode && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 md:p-4 backdrop-blur-sm">
          {/* 修正：加入 max-h-[90vh] 和 overflow-y-auto 確保小螢幕可以捲動 */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-3 md:p-4 w-full max-w-md flex flex-col items-center gap-3 md:gap-4 animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto">
            
            {/* 標題列 */}
            <div className="w-full flex justify-between items-center border-b pb-2 shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-slate-700 flex items-center gap-2">
                <Palette className="text-red-500 w-5 h-5 md:w-6 md:h-6"/> 創意畫布
              </h2>
              <button 
                onClick={() => setIsDrawingMode(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* 畫布區域 (尺寸由 useEffect 動態控制) */}
            <div className="relative border-4 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white cursor-crosshair touch-none shrink-0 self-center">
               <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="bg-transparent"
              />
            </div>

            {/* 工具列 */}
            <div className="w-full space-y-3 md:space-y-4 shrink-0">
              
              {/* 顏色選擇：手機上 gap 小一點 */}
              <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                {/* 自訂顏色 */}
                <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-slate-200">
                    <input 
                        type="color" 
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                    />
                </div>
              </div>

              {/* 筆刷大小與橡皮擦 */}
              <div className="flex items-center justify-between gap-3 md:gap-4 bg-slate-100 p-2 rounded-xl">
                 <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-slate-500 font-bold whitespace-nowrap">筆刷</span>
                    <input 
                        type="range" 
                        min="2" 
                        max="20" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                 </div>
                 <button 
                    onClick={() => setColor('#FFFFFF')} // 簡單的橡皮擦實作（白色）
                    className={`p-1.5 md:p-2 rounded-lg ${color === '#FFFFFF' ? 'bg-red-100 text-red-600' : 'bg-white text-slate-600'} shadow-sm`}
                    title="橡皮擦"
                 >
                    <Eraser size={20} className="w-5 h-5 md:w-6 md:h-6"/>
                 </button>
                 <button 
                    onClick={clearCanvas}
                    className="p-1.5 md:p-2 rounded-lg bg-white text-slate-600 shadow-sm hover:text-red-500"
                    title="全部清除"
                 >
                    <Trash2 size={20} className="w-5 h-5 md:w-6 md:h-6"/>
                 </button>
              </div>
            </div>

            {/* 確認按鈕 */}
            <button
              onClick={saveToScene}
              className="w-full bg-green-500 hover:bg-green-600 text-white text-lg md:text-xl font-bold py-2 md:py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transform transition active:scale-95 shrink-0"
            >
              <Check className="w-5 h-5 md:w-6 md:h-6" />
              完成！上傳
            </button>

          </div>
        </div>
      )}
    </div>
  );
}