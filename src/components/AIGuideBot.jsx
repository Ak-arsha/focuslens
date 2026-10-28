import React, { useState, useEffect } from 'react';
import {
  Bot,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Eye,
  Smile,
  Compass,
  Radio,
  Coffee,
  BarChart3,
  Search,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Minimize2,
  Maximize2,
  GripVertical
} from 'lucide-react';
import { playChime } from '../utils/audio';

export const AIGuideBot = ({
  isOpen: externalIsOpen,
  onOpen: externalOnOpen,
  onClose: externalOnClose,
  onNavigateTab,
  soundFxEnabled = true
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeView, setActiveView] = useState('welcome'); // 'welcome' | 'tour' | 'glossary' | 'qa'
  const [tourStep, setTourStep] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);

  // Position and Draggability
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [isPillDismissed, setIsPillDismissed] = useState(false);
  const dragDataRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0, moved: false });
  const dialogDragDataRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0, moved: false });

  // Floating Pill Dragging
  const handlePillPointerDown = (e) => {
    if (e.target.closest('button.close-btn')) return;
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragDataRef.current.startX;
      const dy = moveEvent.clientY - dragDataRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragDataRef.current.moved = true;
      }
      setPosition({
        x: dragDataRef.current.originX + dx,
        y: dragDataRef.current.originY + dy,
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePillClick = () => {
    if (dragDataRef.current.moved) return;
    handleOpen();
  };

  // Dialog Dragging (via Header)
  const handleDialogHeaderPointerDown = (e) => {
    if (e.target.closest('button')) return;
    dialogDragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: dialogPosition.x,
      originY: dialogPosition.y,
      moved: false,
    };

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - dialogDragDataRef.current.startX;
      const dy = moveEvent.clientY - dialogDragDataRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dialogDragDataRef.current.moved = true;
      }
      setDialogPosition({
        x: dialogDragDataRef.current.originX + dx,
        y: dialogDragDataRef.current.originY + dy,
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Auto-prompt subtly on first load
  useEffect(() => {
    const tourCompleted = localStorage.getItem('focuslens:tour_completed');
    if (!tourCompleted && !hasGreeted) {
      const timer = setTimeout(() => {
        if (externalOnOpen) externalOnOpen();
        else setInternalIsOpen(true);
        setHasGreeted(true);
        if (soundFxEnabled) playChime('click');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasGreeted, soundFxEnabled, externalOnOpen]);

  const handleOpen = () => {
    setIsPillDismissed(false);
    if (externalOnOpen) externalOnOpen();
    else setInternalIsOpen(true);
    setIsMinimized(false);
    if (soundFxEnabled) playChime('click');
  };

  const handleClose = () => {
    if (externalOnClose) externalOnClose();
    else setInternalIsOpen(false);
    localStorage.setItem('focuslens:tour_completed', 'true');
  };

  // Step-by-Step Interactive Tour
  const tourSteps = [
    {
      title: 'Welcome to FocusLens',
      tag: 'Introduction',
      icon: Sparkles,
      tab: 'studio',
      content:
        'FocusLens is a private, real-time on-device cognitive attention and ergonomics monitor. Unlike ordinary productivity timers, FocusLens uses computer vision models running entirely in your browser through WebAssembly to observe your focus, posture, and blink health without sending video to any cloud server.',
      tip: 'Everything is computed locally on your device at 30+ FPS.',
    },
    {
      title: 'Hero Camera Stage & Alignment Guides',
      tag: 'Vision Tracking',
      icon: Eye,
      tab: 'studio',
      content:
        'The camera stage is your primary feedback viewport. Look for the glowing horizontal Eye-Horizon line and vertical Plumb Axis with the center target reticle. When you align your face within the bounding oval, the guides turn emerald green, verifying optimal camera perspective and posture.',
      tip: 'Sit straight facing your screen at eye level for accurate telemetry.',
    },
    {
      title: '3D Cervical Spine Hologram',
      tag: 'Ergonomic Telemetry',
      icon: Compass,
      tab: 'studio',
      content:
        'Positioned directly beneath the camera, this WebGL 3D head visualizer mirrors your physical head rotations in real time. It monitors 3 axes: Yaw (horizontal turn), Pitch (vertical chin nod), and Roll (ear-to-shoulder tilt). It flags forward head posture (FHP) to prevent cervical spine and neck strain.',
      tip: 'Press "R" on your keyboard anytime to recalibrate your neutral baseline.',
    },
    {
      title: 'Whoop Focus Score Dial',
      tag: 'Flow Analytics',
      icon: BarChart3,
      tab: 'studio',
      content:
        'The central Whoop/Oura-style circular dial provides one dominant metric: your real-time Focus Score (0 to 100). It dynamically adapts based on eye fixation stability, gaze centering, and head pose. Above 80 indicates deep flow; drops signal drift or fatigue.',
      tip: 'Maintain uninterrupted engagement to build your longest flow streak.',
    },
    {
      title: 'Biometrics & Eye Dynamics (EAR)',
      tag: 'Health Defense',
      icon: BookOpen,
      tab: 'biometrics',
      content:
        'In the Biometrics tab, you can examine your Eye Aspect Ratio (EAR) and real-time blinks per minute (BPM). Staring at screens often drops blink rate by over 60%, causing dry-eye syndrome (asthenopia). FocusLens alerts you if your blink rate dips dangerously low.',
      tip: 'Healthy blink frequency is between 12 and 22 blinks per minute.',
    },
    {
      title: 'Facial Sentiment & Cognitive Affect',
      tag: 'Cognitive Load',
      icon: Smile,
      tab: 'biometrics',
      content:
        'FocusLens processes 52 facial blendshapes to estimate your net Emotional Valence from -100% to +100%. A furrowed brow or compressed lips signals cognitive frustration and muscle strain, while relaxed facial features indicate effortless flow.',
      tip: 'Track whether challenging debugging tasks are causing unconscious facial tension.',
    },
    {
      title: 'Screen Gaze Vector Matrix',
      tag: 'Attention Mapping',
      icon: Eye,
      tab: 'biometrics',
      content:
        'A 3x3 quadrant grid calculates where your eyes are looking relative to your display. It immediately detects if your gaze has drifted down to your smartphone, off to a second monitor, or away into the room.',
      tip: 'Keeping your gaze within the center quadrant maintains high flow scores.',
    },
    {
      title: 'Procedural Ambient Sound Synthesizer',
      tag: 'Auditory Focus',
      icon: Radio,
      tab: 'soundscapes',
      content:
        'Native Web Audio generates 6 zero-download focus soundscapes: 40Hz Gamma Binaural Beats (scientifically linked to peak working memory), Deep Brown Noise, Calm Forest Rain, Ocean Waves, 432Hz Drone, and White Noise. It also provides gentle psychoacoustic chimes for start, drift, and fatigue.',
      tip: 'Use headphones when listening to 40Hz Binaural Beats for maximum cortical synchronization.',
    },
    {
      title: 'Sprint Cycles & 4-7-8 Breathing Breaks',
      tag: 'Restorative Habits',
      icon: Coffee,
      tab: 'studio',
      content:
        'Work in focused Pomodoro sprint intervals (15, 25, 45, or 60 minutes). When a sprint ends or when you press "B", the Guided Break modal opens with an animated 4-7-8 breathing circle and the 20-20-20 eye relief rule to reset your nervous system.',
      tip: 'Press Space to pause/resume and "B" anytime for an instant breathing reset.',
    },
    {
      title: 'Session Summary & Exportable Health Reports',
      tag: 'Data Archive',
      icon: ShieldCheck,
      tab: 'archive',
      content:
        'Conclude your session anytime by clicking the prominent End Session button or pressing "E". FocusLens generates a comprehensive health report with letter grades (S, A, B), flow percentages, and lets you download complete telemetry in CSV or JSON format for your records.',
      tip: 'All history is saved exclusively in your browser IndexedDB database.',
    },
  ];

  // Comprehensive Terminology Glossary
  const terminologyList = [
    {
      term: 'Focus Score',
      category: 'Metric',
      short: 'Real-time 0–100 cognitive engagement score',
      definition:
        'A synthetic index calculated on-device that combines ocular fixation, gaze stability, head pose alignment, and facial affective state. Scores above 85 represent peak flow, 65–84 represent productive engagement, and scores under 50 signify distraction or fatigue.',
      formula: 'Target scores: Focused = 100, Distracted = 38, Drowsy = 10 with an exponential smoothing alpha of 0.08.',
      importance: 'Gives you one clear dominant number to monitor without cognitive distraction.'
    },
    {
      term: 'Eye Aspect Ratio (EAR)',
      category: 'Computer Vision',
      short: 'Eyelid vertical separation divided by horizontal eye length',
      definition:
        'EAR is a mathematical formula measuring the distance between vertical eyelid landmarks relative to horizontal eye corners. When you blink, EAR drops from ~0.30 down to under 0.16. Prolonged low EAR indicates eye closure or microsleep.',
      formula: 'EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)',
      importance: 'Detects micro-sleeps, drowsiness, and blinks with sub-millisecond precision.'
    },
    {
      term: 'Blink Rate (BPM)',
      category: 'Health Telemetry',
      short: 'Blinks counted per minute',
      definition:
        'Normal spontaneous blink rate in healthy adults is 12 to 20 blinks per minute. When staring intensely at computer screens, blink frequency typically drops by 60% or more (often down to 4–6 BPM), leading to rapid tear evaporation and digital eye strain (asthenopia).',
      formula: 'Count of completed blink events over a rolling 60-second window.',
      importance: 'Acts as an early-warning radar against dry eye syndrome and eye fatigue.'
    },
    {
      term: 'Emotional Valence',
      category: 'Cognitive Affect',
      short: 'Degree of facial pleasantness vs. tension (-100% to +100%)',
      definition:
        'Evaluates facial blendshape weights, measuring tension in the corrugator supercilii (brow furrow) versus contraction of the zygomaticus major (smile). Negative values indicate high mental struggle or physical tension; positive values indicate ease, delight, and effortless flow.',
      formula: 'Valence = (Smile Coefficients - Brow Furrow / Frown Coefficients) * 100%',
      importance: 'Helps knowledge workers spot unconscious stress and jaw/brow clamping.'
    },
    {
      term: '3D Head Pose (Yaw, Pitch, Roll)',
      category: 'Ergonomics',
      short: '3D Euler orientation angles of your skull',
      definition:
        'Yaw measures horizontal turning (looking left or right); Pitch measures vertical nodding (chin up or looking down); Roll measures lateral tilting (ear toward shoulder). Ergonomic thresholds are ±14° Yaw, ±12° Pitch, and ±10° Roll.',
      formula: 'Calculated from 3D facial landmark transformation matrices and perspective-n-point projection.',
      importance: 'Prevents Forward Head Posture (FHP) which can exert up to 60 lbs of pressure on cervical vertebrae.'
    },
    {
      term: 'Gaze Vector Matrix',
      category: 'Attention',
      short: 'Iris center offset relative to eye bounding box',
      definition:
        'Maps your line of sight onto a 3x3 spatial grid (Top-Left, Up, Top-Right, Left, Center, Right, Bottom-Left, Down, Bottom-Right). Identifies whether your visual attention is targeted at the screen center or diverted to phones or peripheral surroundings.',
      formula: 'Vector calculated from Euclidean distance of pupil center to medial/lateral canthi.',
      importance: 'Distinguishes between reading screen content and off-screen visual distractions.'
    },
    {
      term: '40Hz Gamma Binaural Beats',
      category: 'Acoustics & Neurobiology',
      short: 'Stereo-separated frequencies producing 40Hz cortical entrainment',
      definition:
        'When a 216Hz tone is delivered to the left ear and a 256Hz tone to the right ear via headphones, the brain’s superior olivary complex perceives a 40Hz difference frequency. Research associates 40Hz gamma oscillations with enhanced working memory, attention, and cognitive binding.',
      formula: 'Left: 216Hz Sine | Right: 256Hz Sine | Beat Frequency: |256 - 216| = 40Hz',
      importance: 'Provides a non-invasive procedural acoustic stimulus for deep cognitive concentration.'
    },
    {
      term: '4-7-8 Breathing & 20-20-20 Rule',
      category: 'Recovery',
      short: 'Autonomic nervous system reset and ciliary muscle relaxation',
      definition:
        'The 4-7-8 breathing method (4s inhale, 7s hold, 8s exhale) activates the parasympathetic vagus nerve, reducing cortisol and heart rate. The 20-20-20 rule dictates that every 20 minutes, you look at an object 20 feet away for 20 seconds, allowing your eye’s ciliary focusing muscles to fully relax.',
      formula: 'Inhale 4s -> Hold 7s -> Exhale 8s.',
      importance: 'Restores cognitive stamina between intense focus sprints.'
    },
    {
      term: 'On-Device AI (Zero Uploads)',
      category: 'Privacy Architecture',
      short: 'WASM & WebGL processing entirely inside the browser',
      definition:
        'FocusLens loads the Google MediaPipe Face Landmarker model directly into your browser via WebAssembly (WASM). Your camera stream is processed in client RAM on each video frame. No video frames, audio, or biometric points are ever transmitted over the network or saved to remote cloud servers.',
      formula: 'Client Camera -> HTML5 Video -> WebAssembly Inference -> UI Canvas HUD.',
      importance: 'Guarantees absolute privacy and compliance with strict workplace or research confidentiality.'
    },
  ];

  const filteredGlossary = terminologyList.filter(
    (item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.short.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startTour = (stepIndex = 0) => {
    setActiveView('tour');
    setTourStep(stepIndex);
    if (tourSteps[stepIndex]?.tab && onNavigateTab) {
      onNavigateTab(tourSteps[stepIndex].tab);
    }
    if (soundFxEnabled) playChime('click');
  };

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      const next = tourStep + 1;
      setTourStep(next);
      if (tourSteps[next]?.tab && onNavigateTab) {
        onNavigateTab(tourSteps[next].tab);
      }
      if (soundFxEnabled) playChime('click');
    } else {
      setActiveView('welcome');
      localStorage.setItem('focuslens:tour_completed', 'true');
      if (soundFxEnabled) playChime('complete');
    }
  };

  const prevTourStep = () => {
    if (tourStep > 0) {
      const prev = tourStep - 1;
      setTourStep(prev);
      if (tourSteps[prev]?.tab && onNavigateTab) {
        onNavigateTab(tourSteps[prev].tab);
      }
      if (soundFxEnabled) playChime('click');
    }
  };

  const openGlossaryTerm = (termObj) => {
    setSelectedTerm(termObj);
    setActiveView('glossary');
    if (soundFxEnabled) playChime('click');
  };

  return (
    <>
      {/* Floating Bot Launcher Avatar (Bottom Right, Draggable & Dismissible) */}
      {!isOpen && !isPillDismissed && (
        <div
          onPointerDown={handlePillPointerDown}
          onClick={handlePillClick}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            touchAction: 'none',
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white border border-emerald-500/40 shadow-2xl backdrop-blur-md transition-shadow cursor-grab active:cursor-grabbing group select-none"
          title="Drag to reposition anywhere, click to open LensBot Guide"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 cursor-grab" />
          <div className="relative w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold linear-text-heading">LensBot Guide</span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI Help
              </span>
            </div>
            <span className="text-[10px] linear-text-muted">Interactive Tour &amp; Glossary</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPillDismissed(true);
            }}
            className="close-btn p-1 ml-0.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss floating pill (reopen from sidebar anytime)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main AI Bot Guide Panel (Draggable Header, Positioned Bottom-Right) */}
      {isOpen && (
        <div
          style={{
            transform: `translate3d(${dialogPosition.x}px, ${dialogPosition.y}px, 0)`,
          }}
          className={`fixed z-50 transition-all duration-150 select-none ${
            isMinimized
              ? 'bottom-6 right-6 w-80'
              : 'bottom-6 right-6 left-6 sm:left-auto sm:w-[460px] max-h-[88vh]'
          } flex flex-col rounded-2xl linear-panel border border-emerald-500/40 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95`}
        >
          {/* Top Header Bar (Draggable) */}
          <div
            onPointerDown={handleDialogHeaderPointerDown}
            className="p-3.5 border-b border-white/5 flex items-center justify-between bg-black/40 cursor-grab active:cursor-grabbing"
            title="Drag header to move guide window"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
              <div className="relative w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Bot className="w-4 h-4" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-xs font-bold linear-text-heading">LensBot Guide</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    On-Device AI
                  </span>
                </div>
                <p className="text-[10px] linear-text-muted">Your step-by-step telemetry copilot</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg linear-btn-secondary"
                title={isMinimized ? 'Expand guide' : 'Minimize guide'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg linear-btn-secondary"
                title="Close guide"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Navigation Tabs Header inside Bot */}
              <div className="flex items-center border-b border-white/5 bg-black/20 text-xs px-2 py-1 gap-1">
                <button
                  onClick={() => {
                    setActiveView('welcome');
                    if (soundFxEnabled) playChime('click');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    activeView === 'welcome'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'linear-text-muted hover:linear-text-heading'
                  }`}
                >
                  Introduction
                </button>
                <button
                  onClick={() => startTour(tourStep)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    activeView === 'tour'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'linear-text-muted hover:linear-text-heading'
                  }`}
                >
                  Step-by-Step Tour
                </button>
                <button
                  onClick={() => {
                    setActiveView('glossary');
                    if (soundFxEnabled) playChime('click');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    activeView === 'glossary'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'linear-text-muted hover:linear-text-heading'
                  }`}
                >
                  Terminology
                </button>
              </div>

              {/* VIEW 1: WELCOME & HI SCREEN (HackerRank/HackerEarth-style Greeting) */}
              {activeView === 'welcome' && (
                <div className="p-4 flex flex-col gap-3.5 overflow-y-auto max-h-[65vh]">
                  {/* Bot Greeting Speech Bubble */}
                  <div className="relative p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-emerald-400">Hi there! Welcome to FocusLens!</span>
                      <span className="text-[10px] font-mono text-emerald-500/80">• Online</span>
                    </div>
                    <p className="text-xs linear-text-body leading-relaxed">
                      I am <strong>LensBot</strong>, your interactive AI telemetry guide. I can walk you through how the entire app works step by step, explain every biometric metric, or help you understand why your video never leaves this computer.
                    </p>
                  </div>

                  {/* Primary Quick Start Cards */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider linear-text-faint font-semibold">
                      HOW WOULD YOU LIKE TO BEGIN?
                    </span>

                    {/* Action 1: Start Tour */}
                    <button
                      onClick={() => startTour(0)}
                      className="p-3 rounded-xl linear-inset hover:border-emerald-500/40 flex items-center justify-between text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold linear-text-heading group-hover:text-emerald-400 transition-colors">
                            Take Interactive 10-Step Tour
                          </h4>
                          <p className="text-[10px] linear-text-muted">
                            Walk through Camera, 3D Hologram, Whoop Dial, Audio &amp; Sprints
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 linear-text-faint group-hover:text-emerald-400 transition-colors" />
                    </button>

                    {/* Action 2: Terminology Explainer */}
                    <button
                      onClick={() => setActiveView('glossary')}
                      className="p-3 rounded-xl linear-inset hover:border-cyan-500/40 flex items-center justify-between text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold linear-text-heading group-hover:text-cyan-400 transition-colors">
                            Explore Terminology &amp; Metrics
                          </h4>
                          <p className="text-[10px] linear-text-muted">
                            What is EAR? What is Valence? How does posture tracking work?
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 linear-text-faint group-hover:text-cyan-400 transition-colors" />
                    </button>

                    {/* Action 3: Privacy & Zero Uploads */}
                    <button
                      onClick={() => openGlossaryTerm(terminologyList[8])}
                      className="p-3 rounded-xl linear-inset hover:border-emerald-500/40 flex items-center justify-between text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold linear-text-heading group-hover:text-purple-400 transition-colors">
                            Privacy Guarantee &amp; Architecture
                          </h4>
                          <p className="text-[10px] linear-text-muted">
                            Understand how WASM models execute 100% on your device
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 linear-text-faint group-hover:text-purple-400 transition-colors" />
                    </button>
                  </div>

                  {/* Frequently Asked Quick Chips */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider linear-text-faint font-semibold">
                      QUICK QUESTIONS (CLICK TO ASK BOT)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { q: 'What is EAR?', term: terminologyList[1] },
                        { q: 'How is Focus Score computed?', term: terminologyList[0] },
                        { q: 'What are 40Hz binaural beats?', term: terminologyList[6] },
                        { q: 'Why is blink rate important?', term: terminologyList[2] },
                        { q: 'What is Emotional Valence?', term: terminologyList[3] },
                      ].map((item) => (
                        <button
                          key={item.q}
                          onClick={() => openGlossaryTerm(item.term)}
                          className="px-2 py-1 rounded-lg linear-inset text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors flex items-center gap-1"
                        >
                          <HelpCircle className="w-3 h-3 text-emerald-400" />
                          <span>{item.q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: STEP-BY-STEP INTERACTIVE TOUR */}
              {activeView === 'tour' && (
                <div className="p-4 flex flex-col justify-between gap-3 overflow-y-auto max-h-[65vh]">
                  {/* Step Progress Bar */}
                  <div className="flex items-center justify-between text-[11px] linear-text-muted">
                    <span className="font-mono text-emerald-400 font-bold">
                      Step {tourStep + 1} of {tourSteps.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/5 border border-white/10">
                      {tourSteps[tourStep].tag}
                    </span>
                  </div>

                  <div className="w-full h-1 rounded-full linear-inset overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${((tourStep + 1) / tourSteps.length) * 100}%` }}
                    />
                  </div>

                  {/* Step Card Content */}
                  <div className="flex flex-col gap-2.5 p-4 rounded-xl linear-inset">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        {React.createElement(tourSteps[tourStep].icon, { className: 'w-4 h-4' })}
                      </div>
                      <h4 className="font-display text-sm font-bold linear-text-heading">
                        {tourSteps[tourStep].title}
                      </h4>
                    </div>

                    <p className="text-xs linear-text-body leading-relaxed">
                      {tourSteps[tourStep].content}
                    </p>

                    {tourSteps[tourStep].tip && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tourSteps[tourStep].tip}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Jump Step Dots */}
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {tourSteps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => startTour(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === tourStep
                            ? 'w-6 bg-emerald-400'
                            : 'w-1.5 bg-white/20 hover:bg-white/40'
                        }`}
                        title={`Go to Step ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Tour Navigation Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      onClick={prevTourStep}
                      disabled={tourStep === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg linear-btn-secondary text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={() => setActiveView('welcome')}
                      className="text-[11px] linear-text-muted hover:linear-text-heading"
                    >
                      Exit Tour
                    </button>

                    <button
                      onClick={nextTourStep}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
                    >
                      <span>{tourStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 3: TERMINOLOGY GLOSSARY & BOT EXPLAINER */}
              {activeView === 'glossary' && (
                <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[65vh]">
                  {/* Search bar */}
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 linear-text-muted" />
                    <input
                      type="text"
                      placeholder="Search metrics (e.g. EAR, Valence, Yaw, Binaural)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl linear-inset text-xs linear-text-heading placeholder:linear-text-faint focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  {/* Selected Term Detail Card (if one is chosen) */}
                  {selectedTerm ? (
                    <div className="p-4 rounded-xl linear-inset border border-emerald-500/30 flex flex-col gap-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm font-bold linear-text-heading">
                            {selectedTerm.term}
                          </h4>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            {selectedTerm.category}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedTerm(null)}
                          className="text-[10px] text-emerald-400 hover:underline"
                        >
                          View all terms
                        </button>
                      </div>

                      <p className="text-xs linear-text-body leading-relaxed">
                        {selectedTerm.definition}
                      </p>

                      {selectedTerm.formula && (
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-cyan-300">
                          <strong>Formula / Mechanism:</strong> {selectedTerm.formula}
                        </div>
                      )}

                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                        <strong>Why it matters:</strong> {selectedTerm.importance}
                      </div>
                    </div>
                  ) : null}

                  {/* Terminology List */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider linear-text-faint font-semibold">
                      ALL TELEMETRY TERMS ({filteredGlossary.length})
                    </span>

                    {filteredGlossary.map((item) => (
                      <button
                        key={item.term}
                        onClick={() => setSelectedTerm(item)}
                        className={`p-2.5 rounded-xl linear-inset hover:border-emerald-500/40 text-left transition-all flex items-center justify-between group ${
                          selectedTerm?.term === item.term ? 'border-emerald-500/50 bg-emerald-500/5' : ''
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold linear-text-heading group-hover:text-emerald-400 transition-colors">
                              {item.term}
                            </span>
                            <span className="text-[9px] font-mono linear-text-muted">
                              ({item.category})
                            </span>
                          </div>
                          <span className="text-[10px] linear-text-muted line-clamp-1">
                            {item.short}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 linear-text-faint group-hover:text-emerald-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
