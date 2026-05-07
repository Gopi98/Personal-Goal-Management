import fs from 'fs';

const zenTimerStr = `
const ZenTimer = ({ onExit }: { onExit: () => void }) => {
  const [seconds, setSeconds] = useState(0);
  const { addFocusSession } = useHub();

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExit = () => {
     const minutes = Math.floor(seconds / 60);
     if (minutes > 0) {
       addFocusSession(minutes, "work");
     }
     onExit();
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-1/2 -mt-10 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-8"
    >
      <div className="text-[140px] leading-none font-black text-white font-mono tracking-tighter drop-shadow-2xl mix-blend-difference pointer-events-none">
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </div>
      <Tooltip text="Exit deep focus HUD mode & save time">
        <button
          onClick={handleExit}
          className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
        >
          Exit Deep Focus
        </button>
      </Tooltip>
    </motion.div>
  );
};
`;

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

appTsx = appTsx.replace('const PomodoroTimer = ({', zenTimerStr + '\nconst PomodoroTimer = ({');

appTsx = appTsx.replace(/\{isZenMode && \([\s\S]*?<motion\.div[\s\S]*?Exit Deep Focus[\s\S]*?<\/motion\.div>\n\s*\)\}/, '{isZenMode && <ZenTimer onExit={() => setIsZenMode(false)} />}');

fs.writeFileSync('src/App.tsx', appTsx);
