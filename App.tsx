
import React, { useState, useRef, useEffect } from 'react';
import { GameState, Chapter } from './types';
import { generateQuestStep } from './geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    step: 'UPLOAD',
    baseImage: null,
    scenario: '',
    history: [],
    isGenerating: false,
  });

  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle window resizing to detect mobile state
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Control scrolling and reset "reached bottom" flag on new content
  useEffect(() => {
    if (scrollRef.current) {
      if (!isMobile) {
        // Desktop: auto-scroll to bottom as before
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
        setHasReachedBottom(true);
      } else {
        // Mobile: only scroll enough to show the start of new content, 
        // forcing the user to scroll down to read and see the buttons.
        setHasReachedBottom(false);
        if (state.history.length > 1) {
            // Find the last chapter element and scroll to its top
            const chapters = scrollRef.current.querySelectorAll('.chapter-entry');
            const lastChapter = chapters[chapters.length - 1];
            if (lastChapter) {
                lastChapter.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
      }
    }
  }, [state.history, isMobile]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isMobile || state.isGenerating) return;
    
    const target = e.currentTarget;
    const isAtBottom = Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 50;
    
    if (isAtBottom && !hasReachedBottom) {
      setHasReachedBottom(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, baseImage: reader.result as string, step: 'SCENARIO' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startQuest = async () => {
    if (!state.scenario) return;
    setState(prev => ({ ...prev, isGenerating: true, step: 'PLAYING' }));
    
    try {
      const result = await generateQuestStep(state.scenario, "Начало приключения", state.baseImage);
      const firstChapter: Chapter = {
        text: result.storyText,
        imageUrl: result.imagePrompt,
        choices: result.choices
      };
      setState(prev => ({
        ...prev,
        history: [firstChapter],
        isGenerating: false
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleChoice = async (choice: string) => {
    setState(prev => ({ ...prev, isGenerating: true }));
    setHasReachedBottom(false);
    const fullHistory = state.history.map(h => h.text).join('\n') + `\nДействие Жандоса: ${choice}`;
    
    try {
      const result = await generateQuestStep(state.scenario, fullHistory, state.baseImage);
      const nextChapter: Chapter = {
        text: result.storyText,
        imageUrl: result.imagePrompt,
        choices: result.choices
      };
      setState(prev => ({
        ...prev,
        history: [...prev.history, nextChapter],
        isGenerating: false
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Determine if we should show the choice buttons
  const showChoices = state.history.length > 0 && !state.isGenerating && (!isMobile || hasReachedBottom);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="max-w-6xl w-full mb-8 text-center z-10 shrink-0">
        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 mb-2 tracking-tight">
          ЖАНДОС ВО ВРЕМЕНИ
        </h1>
        <div className="flex items-center justify-center gap-2 mono text-[10px] text-slate-500 tracking-[0.3em] uppercase">
          <span className="w-8 h-px bg-slate-800"></span>
          Chronos Link Established
          <span className="w-8 h-px bg-slate-800"></span>
        </div>
      </header>

      <main className="max-w-6xl w-full flex-1 flex flex-col z-10 overflow-hidden relative">
        
        {state.step === 'UPLOAD' && (
          <div className="glass rounded-[2rem] p-12 flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in-95 duration-1000 my-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative w-32 h-32 rounded-full bg-black flex items-center justify-center border border-white/10 overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Лик Искателя</h2>
              <p className="text-slate-400 max-w-sm mx-auto">Для квантовой проекции нам необходимо лицо Жандоса. Мы встроим его в саму ткань истории.</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*"
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-10 py-5 bg-white text-black hover:bg-purple-50 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              ВЫБРАТЬ ФОТО
            </button>
          </div>
        )}

        {state.step === 'SCENARIO' && (
          <div className="glass rounded-[2rem] p-8 md:p-12 flex flex-col gap-8 animate-in slide-in-from-bottom-12 duration-700 my-auto">
            <div className="flex items-center gap-5">
               <div className="relative">
                 <div className="absolute -inset-1 bg-purple-500 rounded-full blur opacity-30 animate-pulse"></div>
                 {state.baseImage && <img src={state.baseImage} className="relative w-20 h-20 rounded-full object-cover border-2 border-white/20" alt="Zhandos" />}
               </div>
               <div>
                 <h2 className="text-2xl font-bold italic">Протокол Перемещения</h2>
                 <p className="text-sm text-slate-500 mono">Задайте пространственно-временные координаты</p>
               </div>
            </div>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-xl font-light placeholder:text-slate-600 transition-all"
              placeholder='Опишите эпоху или ситуацию... "Жандос — детектив в нуарном Нью-Йорке 40-х"'
              value={state.scenario}
              onChange={(e) => setState(prev => ({ ...prev, scenario: e.target.value }))}
            />
            <button 
              onClick={startQuest}
              disabled={!state.scenario || state.isGenerating}
              className="w-full py-5 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:brightness-110 rounded-3xl font-bold transition-all disabled:opacity-50 text-white tracking-widest uppercase text-sm shadow-2xl shadow-purple-500/20"
            >
              {state.isGenerating ? "ИНИЦИАЦИЯ..." : "АКТИВИРОВАТЬ ПОРТАЛ"}
            </button>
          </div>
        )}

        {state.step === 'PLAYING' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 md:px-8 space-y-12 pb-64 pt-4 scroll-smooth"
            >
              {state.history.map((chapter, idx) => (
                <div key={idx} className="chapter-entry flex flex-col lg:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
                  {/* Left: Text Content */}
                  <div className="flex-1 order-2 lg:order-1 space-y-6">
                    <div className="glass p-8 rounded-[2rem] border-l-4 border-l-purple-500 relative">
                      <div className="absolute -top-3 -left-3 glass px-4 py-1 rounded-full text-[10px] mono font-bold text-purple-400">
                        TIMELINE {idx + 1}
                      </div>
                      <p className="text-xl md:text-2xl leading-[1.6] font-light text-slate-100">
                        {chapter.text}
                      </p>
                    </div>
                  </div>

                  {/* Right: Visual Content */}
                  <div className="w-full lg:w-[450px] order-1 lg:order-2 shrink-0 group">
                    <div className="relative overflow-hidden rounded-[2rem] shadow-2xl border border-white/10 group-hover:border-purple-500/30 transition-all duration-500">
                      <img 
                        src={chapter.imageUrl} 
                        className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={`Scene ${idx}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                        <span className="text-[10px] mono text-white/60 tracking-widest">VISUAL_LOG_{idx + 1}.PNG</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {state.isGenerating && (
                <div className="flex flex-col lg:flex-row gap-8 items-start animate-pulse">
                  <div className="flex-1 space-y-4">
                    <div className="shimmer h-48 rounded-[2rem]"></div>
                  </div>
                  <div className="w-full lg:w-[450px] aspect-square shimmer rounded-[2rem] relative flex items-center justify-center overflow-hidden">
                    <div className="time-warp absolute inset-0 opacity-40"></div>
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                      <span className="mono text-[10px] tracking-[0.4em] text-purple-400 uppercase">Сшиваем реальность</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Actions Container */}
            {showChoices && (
              <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 z-20">
                <div className="max-w-6xl mx-auto glass p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="hidden md:flex flex-col shrink-0">
                      <span className="text-[10px] mono text-purple-500 font-bold uppercase tracking-widest">Decision Required</span>
                      <span className="text-[10px] mono text-slate-500 uppercase tracking-widest">Temporal Node v.2</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                      {state.history[state.history.length - 1].choices.map((choice, i) => (
                        <button
                          key={i}
                          onClick={() => handleChoice(choice)}
                          className="text-left px-5 py-4 bg-white/5 hover:bg-purple-600/20 border border-white/5 rounded-2xl text-sm font-medium transition-all hover:border-purple-500/40 active:scale-95 group flex items-center gap-3"
                        >
                          <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 text-[10px] group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            {i + 1}
                          </span>
                          <span className="flex-1 line-clamp-2">{choice}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll Indicator for Mobile */}
            {isMobile && !hasReachedBottom && state.history.length > 0 && !state.isGenerating && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-10 opacity-60">
                <span className="mono text-[8px] uppercase tracking-widest text-slate-400">Листайте вниз</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Status Bar */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 mono text-[8px] text-slate-700 tracking-widest pointer-events-none uppercase">
        Zhandos_Timeline_Simulator // Sync Status: Optimal // Core: Gemini 2.5
      </div>
    </div>
  );
};

export default App;
