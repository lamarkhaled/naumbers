import React, { useState, useEffect, useRef } from 'react';
import { User, X, Check, RefreshCw, Printer, Map as MapIcon, ArrowLeft, PlayCircle, Eraser, Star, Music } from 'lucide-react';

// ==========================================
// 1. Audio Engine (Web Audio API Synthesizer)
// ==========================================
class AudioEngine {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type, duration, vol = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
  playClick() {
    this.playTone(600, 'sine', 0.1, 0.1);
  }
  playPop() {
    this.playTone(800, 'sine', 0.1, 0.2);
  }
  playSuccess() {
    if (!this.ctx) return;
    this.playTone(523.25, 'sine', 0.15, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.1), 100); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.3, 0.15), 200); // G5
  }
  playWrong() {
    if (!this.ctx) return;
    this.playTone(300, 'sawtooth', 0.2, 0.1);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.1), 150);
  }
  playCheer() {
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.15), i * 150);
    });
    setTimeout(() => this.playTone(1046.50, 'square', 0.6, 0.1), 600);
  }
}
const audio = new AudioEngine();

// ==========================================
// 2. Questions Data
// ==========================================
const questions = [
  {
    id: 1,
    title: "هيا نعد التفاحات الجميلة!",
    subtitle: "اضغطي على كل تفاحة لقطفها ووضعها في السلة.",
    type: 'interactive_count',
    target: 5,
    visual: '🍎',
  },
  {
    id: 2,
    title: "كم عدد الفراشات هنا؟",
    subtitle: "عدي الفراشات ثم اختاري الرقم الصحيح.",
    type: 'multiple_choice',
    visualCount: 7,
    visual: '🦋',
    options: [5, 7, 8],
    answer: 7
  },
  {
    id: 3,
    title: "أكملي عربات القطار بالترتيب!",
    subtitle: "ما هو الرقم الناقص بعد ١٨؟",
    type: 'train',
    visual: [17, 18, '؟', 20],
    options: [16, 19, 21],
    answer: 19
  },
  {
    id: 4,
    title: "أي السيارتين تحمل الرقم الأكبر؟",
    subtitle: "اختاري الرمز المناسب بين العددين.",
    type: 'compare',
    visualCars: [14, 9],
    options: ['>', '=', '<'],
    answer: '>'
  }
];

// ==========================================
// 3. Main Application Component
// ==========================================
export default function NumbersAdventure() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [userName, setUserName] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  // Quiz State
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showStars, setShowStars] = useState(false);
  
  // Modal State
  const [showDrawModal, setShowDrawModal] = useState(false);

  // Initialize audio on first user interaction
  const initInteraction = () => {
    audio.init();
    audio.playClick();
  };

  // --- Visual Reward Component ---
  const RewardStars = () => {
    if (!showStars) return null;
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="absolute text-yellow-400 star-anim"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: '20%',
              animationDelay: `${Math.random() * 0.5}s`,
              fontSize: `${Math.random() * 20 + 20}px`
            }}
          >
            ⭐
          </div>
        ))}
      </div>
    );
  };

  // --- Home Screen ---
  const HomeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in relative z-10">
      <div className="text-center space-y-4 w-full">
        <div className="inline-block px-4 py-1 bg-teal-50 text-[#147971] text-xs font-bold rounded-full mb-2 border border-teal-100">
          مرحلة التأسيس التفاعلية ✨
        </div>
        <h1 className="text-4xl font-black text-gray-800 leading-tight">
          هيا نلعب في<br/>عالم الأعداد!
        </h1>
        
        {/* إضافة اسم المعلمة هنا */}
        <div className="mt-2 text-[#147971] font-bold text-sm bg-white/80 backdrop-blur-sm inline-block px-5 py-2 rounded-full border border-teal-100 shadow-sm">
          إعداد المعلمة: عهود 🌸
        </div>

        <p className="text-gray-500 text-sm leading-relaxed px-4 mt-2">
          رحلة ممتعة نتعلم فيها العد، وكتابة الأرقام، والمقارنة بأسلوب شيق.
        </p>
      </div>

      <div className="w-full mt-8 space-y-6">
        <div className="flex flex-col space-y-2">
          <label className="text-gray-600 text-sm font-bold text-center">اسمكِ الجميل يا بطلة (اختياري)</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onFocus={initInteraction}
            placeholder="اكتبي اسمكِ هنا..."
            className="w-full text-center text-lg py-4 px-6 rounded-3xl border-2 border-gray-200 focus:border-[#147971] focus:ring-4 focus:ring-teal-50 focus:outline-none bg-white text-gray-800 placeholder-gray-300 shadow-inner transition-all"
          />
        </div>
        <button
          onClick={() => { initInteraction(); setCurrentScreen('map'); }}
          className="w-full bg-[#147971] hover:bg-teal-700 text-white font-bold text-xl py-4 rounded-3xl shadow-[0_6px_0_#0f5a54] active:shadow-[0_0px_0_#0f5a54] active:translate-y-[6px] flex items-center justify-center gap-2 transition-all"
        >
          <span>ابدئي المغامرة</span>
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="mt-10 flex gap-4 text-5xl drop-shadow-xl animate-bounce-slow">
        <span>🌸</span><span>🚂</span><span>💎</span>
      </div>
    </div>
  );

  // --- Map Screen ---
  const MapScreen = () => {
    const stations = [
      { title: "غابة التفاح", subtitle: "العد التفاعلي", icon: "🍎", color: "bg-red-50 border-red-200 text-red-700" },
      { title: "حديقة الفراشات", subtitle: "تطابق الأعداد", icon: "🦋", color: "bg-pink-50 border-pink-200 text-pink-700" },
      { title: "قطار الأرقام", subtitle: "الترتيب", icon: "🚂", color: "bg-blue-50 border-blue-200 text-blue-700" },
      { title: "طريق السباق", subtitle: "الأكبر والأصغر", icon: "🚦", color: "bg-orange-50 border-orange-200 text-orange-700" }
    ];

    return (
      <div className="flex-1 flex flex-col items-center p-6 bg-slate-50 relative z-10 w-full animate-fade-in">
        <div className="text-center mb-8 w-full">
          <h2 className="text-2xl font-black text-[#147971] mb-2">خريطة المغامرة</h2>
          <p className="text-gray-500 text-sm">أهلاً {userName || 'يا بطلة'}، نحن جاهزون للانطلاق!</p>
        </div>

        <div className="w-full max-w-sm space-y-4 relative before:absolute before:inset-0 before:ml-auto before:mr-auto before:w-1 before:bg-gray-200 before:z-0">
          {stations.map((station, i) => (
            <div key={i} className={`relative z-10 flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} gap-4`}>
              <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-3xl bg-white shadow-md ${station.color}`}>
                {station.icon}
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex-1">
                <h3 className="font-bold text-gray-800 text-sm">{station.title}</h3>
                <p className="text-xs text-gray-400">{station.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => { audio.playClick(); setCurrentScreen('quiz'); setCurrentQIndex(0); setScore(0); }}
          className="mt-10 w-full max-w-sm bg-[#147971] text-white font-bold text-lg py-4 rounded-3xl shadow-[0_6px_0_#0f5a54] active:shadow-[0_0px_0_#0f5a54] active:translate-y-[6px] transition-all"
        >
          دخول المحطة الأولى
        </button>
      </div>
    );
  };

  // --- Read and Write Modal (Magic Board) ---
  const DrawModal = () => {
    const [selectedNum, setSelectedNum] = useState(5);
    const [showModel, setShowModel] = useState(true);
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);

    useEffect(() => { clearCanvas(); }, [selectedNum]);

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      audio.playPop();
    };

    const getPos = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
      isDrawing.current = true;
      const pos = getPos(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineWidth = 14; // Thick marker feel
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#147971'; // Teal color
    };

    const draw = (e) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const pos = getPos(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const endDraw = () => { isDrawing.current = false; };

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in p-2 sm:p-4">
        <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-teal-50">
            <div>
              <h2 className="text-xl font-black text-[#147971] flex items-center gap-2">
                <Eraser size={20}/> السبورة السحرية
              </h2>
              <p className="text-xs text-teal-700 mt-1">اختاري رقماً وتدربي على كتابته!</p>
            </div>
            <button onClick={() => { audio.playClick(); setShowDrawModal(false); }} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-700 shadow-sm border border-gray-200">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
            {/* Number Grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-6" dir="ltr">
              {[...Array(21)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => { audio.playClick(); setSelectedNum(i); }}
                  className={`aspect-square rounded-xl font-bold text-base flex items-center justify-center transition-all ${
                    selectedNum === i 
                    ? 'bg-[#147971] text-white shadow-md scale-110 z-10' 
                    : 'bg-white text-gray-600 hover:bg-teal-50 border border-gray-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            {/* Drawing Area */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-700">اكتبي العدد: <span className="text-[#147971] text-xl">{selectedNum}</span></span>
                <div className="flex gap-2">
                  <button onClick={() => { audio.playClick(); setShowModel(!showModel); }} className="text-[10px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors">
                    {showModel ? 'أخفي الدليل' : 'أظهري الدليل'}
                  </button>
                  <button onClick={clearCanvas} className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl flex items-center gap-1 transition-colors">
                    <RefreshCw size={12} /> امسح
                  </button>
                </div>
              </div>
              
              <div className="relative w-full aspect-[4/3] bg-[#fdfdfd] rounded-2xl border-4 border-dashed border-teal-100 overflow-hidden shadow-inner">
                {showModel && (
                  <div className="absolute inset-0 flex items-center justify-center text-[160px] font-black text-gray-100 pointer-events-none select-none">
                    {selectedNum}
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="w-full h-full touch-none cursor-crosshair relative z-10"
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Quiz Screen ---
  const QuizScreen = () => {
    const q = questions[currentQIndex];
    const [countedItems, setCountedItems] = useState([]);

    useEffect(() => {
      setCountedItems([]);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowStars(false);
    }, [currentQIndex]);

    const handleCorrectFeedback = () => {
      audio.playSuccess();
      setIsCorrect(true);
      setShowStars(true);
      setScore(prev => prev + 1);
    };

    const handleWrongFeedback = () => {
      audio.playWrong();
      setIsCorrect(false);
    };

    const handleCountClick = (index) => {
      if (countedItems.includes(index) || isCorrect) return;
      audio.playPop();
      const newCounted = [...countedItems, index];
      setCountedItems(newCounted);
      if (newCounted.length === q.target) {
        handleCorrectFeedback();
      }
    };

    const handleOptionSelect = (opt) => {
      if (selectedOption !== null || isCorrect) return;
      setSelectedOption(opt);
      if (opt === q.answer) {
        handleCorrectFeedback();
      } else {
        handleWrongFeedback();
      }
    };

    const handleNext = () => {
      audio.playClick();
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
      } else {
        audio.playCheer();
        setCurrentScreen('certificate');
      }
    };

    return (
      <div className="flex-1 flex flex-col bg-slate-50 relative w-full overflow-hidden animate-fade-in">
        <RewardStars />
        
        {/* Top Progress */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 z-10 shadow-sm shrink-0">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-2">
            <span>مرحلة التفكير 🧠</span>
            <span dir="ltr">{currentQIndex + 1} / {questions.length}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex" dir="ltr">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-[#147971] transition-all duration-500 ease-out"
              style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center z-10 pb-32">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-800 mb-2 leading-tight">{q.title}</h2>
            {q.subtitle && <p className="text-gray-500 text-sm">{q.subtitle}</p>}
          </div>

          <div className="w-full flex items-center justify-center mb-8 min-h-[140px]">
            
            {q.type === 'interactive_count' && (
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-wrap justify-center gap-3">
                  {[...Array(q.target)].map((_, i) => {
                    const isCounted = countedItems.includes(i);
                    return (
                      <button 
                        key={i}
                        onClick={() => handleCountClick(i)}
                        className={`text-5xl transition-all duration-300 transform 
                          ${isCounted ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100 hover:scale-110 active:scale-95 drop-shadow-md'}`}
                      >
                        {q.visual}
                      </button>
                    );
                  })}
                </div>
                <div className="relative w-32 h-32 bg-amber-100 border-4 border-amber-300 rounded-[2rem] flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute top-2 text-xs font-bold text-amber-600">السلة</div>
                  <div className="text-5xl font-black text-amber-700">{countedItems.length}</div>
                </div>
              </div>
            )}

            {q.type === 'multiple_choice' && (
              <div className="grid grid-cols-4 gap-4 text-4xl drop-shadow-sm bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                {[...Array(q.visualCount)].map((_, i) => (
                  <span key={i} className="animate-pulse" style={{animationDelay: `${i*100}ms`}}>{q.visual}</span>
                ))}
              </div>
            )}

            {q.type === 'train' && (
              <div className="flex items-center gap-1 sm:gap-2 bg-blue-50/50 p-4 rounded-3xl" dir="ltr">
                <span className="text-6xl drop-shadow-md animate-bounce-slow">🚂</span>
                {q.visual.map((item, i) => (
                  <div key={i} className="relative flex items-center">
                    <div className="w-3 h-2 bg-gray-400 -mx-1 z-0 rounded-sm"></div>
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md z-10
                      ${item === '؟' ? 'bg-white border-4 border-dashed border-teal-300 text-teal-400' : 'bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 text-gray-700'}`}>
                      {item === '؟' && selectedOption ? selectedOption : item}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {q.type === 'compare' && (
              <div className="flex items-center justify-center gap-4 w-full" dir="ltr">
                <div className="relative bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                  <span className="text-5xl drop-shadow-md mb-2">🚗</span>
                  <div className="text-3xl font-black text-gray-800">{q.visualCars[0]}</div>
                </div>
                
                <div className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-3xl font-black transition-all
                  ${selectedOption 
                    ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-inner' 
                    : 'bg-white border-dashed border-gray-300 text-gray-400 shadow-inner'}`}>
                  {selectedOption || '?'}
                </div>
                
                <div className="relative bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                  <span className="text-5xl drop-shadow-md mb-2">🚕</span>
                  <div className="text-3xl font-black text-gray-800">{q.visualCars[1]}</div>
                </div>
              </div>
            )}
          </div>

          {q.options && (
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm" dir="ltr">
              {q.options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const isCorrectOpt = isSelected && isCorrect;
                const isWrongOpt = isSelected && !isCorrect;

                return (
                  <button
                    key={i}
                    disabled={selectedOption !== null}
                    onClick={() => handleOptionSelect(opt)}
                    className={`py-5 px-2 rounded-[2rem] text-3xl font-black transition-all border-b-4 
                      ${isSelected 
                        ? isCorrectOpt 
                          ? 'bg-green-100 border-green-500 text-green-700 shadow-inner translate-y-1' 
                          : 'bg-red-50 border-red-400 text-red-600 shadow-inner translate-y-1'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm active:border-b-0 active:translate-y-1'
                      }
                    `}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {(isCorrect !== null) && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] animate-fade-in z-20 rounded-t-[2rem]">
            {isCorrect ? (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-3 text-green-700 bg-green-50 px-5 py-4 rounded-2xl border border-green-200">
                  <div className="bg-green-100 p-1.5 rounded-full"><Check size={24} strokeWidth={4}/></div>
                  <span className="font-black text-lg">أحسنتِ! إجابة صحيحة يا مبدعة.</span>
                </div>
                <button onClick={handleNext} className="w-full bg-[#147971] hover:bg-teal-700 text-white font-bold text-xl py-4 rounded-3xl shadow-[0_6px_0_#0f5a54] active:shadow-[0_0px_0_#0f5a54] active:translate-y-[6px] flex items-center justify-center gap-2 transition-all">
                  التالي <ArrowLeft size={24} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-3 text-red-600 bg-red-50 px-5 py-4 rounded-2xl border border-red-200">
                  <div className="bg-red-100 p-1.5 rounded-full"><X size={24} strokeWidth={4}/></div>
                  <span className="font-black text-lg">حاولي مرة أخرى، أنتِ تستطيعين!</span>
                </div>
                <button onClick={handleNext} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold text-xl py-4 rounded-3xl shadow-[0_6px_0_#333] active:shadow-[0_0px_0_#333] active:translate-y-[6px] flex items-center justify-center gap-2 transition-all">
                  تخطي السؤال <ArrowLeft size={24} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- Certificate Screen ---
  const CertificateScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#147971]/5 relative z-10 w-full animate-fade-in overflow-hidden">
      <RewardStars />
      <div className="text-8xl drop-shadow-2xl mb-8 animate-bounce">🏆</div>
      
      <div className="bg-white p-8 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-gray-100 text-center relative mb-8">
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300"></div>
        <div className="absolute -top-4 -right-4 text-5xl opacity-20">✨</div>
        <div className="absolute -bottom-4 -left-4 text-5xl opacity-20">🌟</div>
        
        <h2 className="text-3xl font-black text-gray-800 mb-6 mt-4">شهادة تفوق</h2>
        <p className="text-gray-500 text-sm mb-3 font-bold">تُمنح بكل فخر للبطلة المتميزة:</p>
        <h3 className="text-4xl font-black text-[#147971] mb-6 px-6 py-3 bg-teal-50/50 rounded-3xl inline-block border border-teal-100">
          {userName || 'صديقتنا الرائعة'}
        </h3>
        <p className="text-gray-600 text-base font-bold leading-relaxed mb-6">
          لاجتيازها مغامرة الأعداد بنجاح!<br/>
          <span className="inline-block mt-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-2xl text-xl">
            النتيجة: <span dir="ltr">{score} / {questions.length}</span>
          </span>
        </p>

        {/* إضافة توقيع المعلمة هنا */}
        <div className="mt-8 pt-4 border-t-2 border-dashed border-teal-100">
          <p className="text-sm font-bold text-gray-400 mb-1">معلمتكِ المحبة</p>
          <p className="text-2xl font-black text-[#147971]">عهود 🌸</p>
        </div>
      </div>

      <div className="flex flex-col space-y-4 w-full max-w-sm">
        <div className="grid grid-cols-2 gap-4 w-full">
           <button onClick={() => window.print()} className="flex flex-col items-center gap-2 bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 rounded-3xl transition-all active:scale-95 shadow-sm">
              <Printer size={24} /> <span>طباعة</span>
           </button>
           <button onClick={() => { audio.playClick(); setCurrentScreen('home'); setUserName(''); }} className="flex flex-col items-center gap-2 bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 rounded-3xl transition-all active:scale-95 shadow-sm">
              <RefreshCw size={24} /> <span>من جديد</span>
           </button>
        </div>
        <button 
          onClick={() => { audio.playClick(); setCurrentScreen('map'); }}
          className="w-full bg-[#147971] text-white font-bold text-lg py-4 rounded-3xl shadow-[0_6px_0_#0f5a54] active:shadow-[0_0px_0_#0f5a54] active:translate-y-[6px] flex items-center justify-center gap-2 transition-all"
        >
          <MapIcon size={24} /> العودة للخريطة
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-teal-900 flex items-center justify-center font-sans selection:bg-teal-200" dir="rtl">
      
      {/* App Container */}
      <div className="w-full max-w-md h-[100dvh] sm:h-[90vh] sm:rounded-[3rem] bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden ring-8 ring-teal-900/50">
        
        {/* Persistent Header */}
        <header className="flex justify-between items-center p-5 bg-white border-b border-gray-100 shrink-0 z-30 shadow-sm relative rounded-t-[3rem]">
          <div className="flex items-center gap-3">
            <button onClick={() => { initInteraction(); setShowDrawModal(true); }} className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs px-4 py-2 rounded-full font-bold transition-colors shadow-sm">
              <PlayCircle size={16} /> أقرأ وأكتب
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-black text-gray-800 text-base leading-tight tracking-tight">مغامرة الأعداد</div>
              <div className="text-[11px] text-gray-400 font-bold">رياضيات الصف الأول</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center text-[#147971] font-black text-xl border-2 border-teal-200 shadow-sm">
              ٢٠
            </div>
          </div>
        </header>

        {/* Dynamic Screens */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative z-20">
          {currentScreen === 'home' && <HomeScreen />}
          {currentScreen === 'quiz' && <QuizScreen />}
          {currentScreen === 'certificate' && <CertificateScreen />}
          {currentScreen === 'map' && <MapScreen />}
        </div>

        {/* Decorative Background */}
        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none z-0"></div>
        <div className="absolute top-20 left-0 -ml-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none z-0"></div>
      </div>

      {/* Modals */}
      {showDrawModal && <DrawModal />}

      {/* Global Styles & Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        * { font-family: 'Tajawal', system-ui, sans-serif; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-150px) scale(1.5) rotate(90deg); opacity: 0; }
        }
        .star-anim { animation: floatUp 1.5s ease-out forwards; }
        
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounceSlow 3s ease-in-out infinite; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}