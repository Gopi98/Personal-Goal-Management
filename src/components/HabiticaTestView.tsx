import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHub } from '../lib/HubContext';
import { getBossStory } from '../lib/gemini';
import { Heart, Star, Shield, Sword, Sparkles, Gem, ArrowRight, Skull } from 'lucide-react';

const CoinIcon = ({ size = 24, className = "" }) => (
  <div className={`rounded-full bg-yellow-400 border-[2px] border-yellow-600 flex items-center justify-center font-bold text-yellow-800 ${className}`} style={{ width: size, height: size, fontSize: size * 0.6 }}>¢</div>
);

export const HabiticaTestView = () => {
  const { tasks, habits, goals } = useHub();
  
  // Testing State Additions
  const [testActions, setTestActions] = useState(0);
  const [testBossDamage, setTestBossDamage] = useState(0);
  const [testGold, setTestGold] = useState(0);
  const [testHealthOffset, setTestHealthOffset] = useState(0);
  const [isMockMode, setIsMockMode] = useState(false);

  // Shop / Inventory Mock State
  const [healthPotions, setHealthPotions] = useState(0);
  const [purchasedGear, setPurchasedGear] = useState<string[]>([]);

  const shopItems = [
    { id: 'sword', name: 'Iron Sword', cost: 100, icon: 'sword', stats: { str: 10 } },
    { id: 'shield', name: 'Wood Shield', cost: 50, icon: 'shield', stats: { con: 10 } },
    { id: 'helm', name: 'Leather Helm', cost: 75, icon: 'helm', stats: { str: 5, con: 5 } },
  ];

  const gearStats = purchasedGear.reduce((acc, itemId) => {
    const item = shopItems.find(i => i.id === itemId);
    if (item?.stats) {
      if (item.stats.str) acc.str += item.stats.str;
      if (item.stats.con) acc.con += item.stats.con;
    }
    return acc;
  }, { str: 0, con: 0 });

  // Calculate game stats based on real app data OR mock mode
  const completedTasks = isMockMode ? 0 : tasks.filter(t => t.completed).length;
  const totalHabitsCompleted = isMockMode ? 0 : habits.reduce((acc, h) => acc + Object.values(h.completedHistory).filter(Boolean).length, 0);
  const completedGoals = isMockMode ? 0 : goals.filter(g => g.completed).length;

  const totalActions = completedTasks + (totalHabitsCompleted * 2) + (completedGoals * 10) + testActions;
  
  const [bossData, setBossData] = useState<{name: string, description: string, story: string, isLoading: boolean}>({
    name: "Loading...",
    description: "Loading...",
    story: "...",
    isLoading: true
  });

  const [currentLevelOfBoss, setCurrentLevelOfBoss] = useState(0);

  // Derived Stats
  const level = Math.max(1, Math.floor(totalActions / 20) + 1);
  const xp = (totalActions % 20) * 10;
  const xpNeeded = 200;

  const baseStr = 10 + level;
  const baseCon = 12 + level;

  const totalStr = baseStr + gearStats.str;
  const totalCon = baseCon + gearStats.con;
  
  const pendingTasksList = isMockMode ? [] : tasks.filter(t => !t.completed);
  const pendingTasksCount = pendingTasksList.length;

  const maxHealth = 50 + (level * 2);
  // Damage taken from pending tasks is offset by CON stat
  const damageTaken = Math.max(0, (pendingTasksCount * 5) - Math.floor(totalCon / 5));
  const health = Math.max(0, Math.min(maxHealth, maxHealth - damageTaken + testHealthOffset));
  
  const mana = Math.min(100, 30 + totalHabitsCompleted);
  const maxMana = 100;
  
  const gold = (completedTasks * 2) + Math.floor(totalHabitsCompleted * 1.5) + (completedGoals * 50) + testGold;

  // Infinite Boss Battle Logic
  const baseBossDamage = totalActions * 15;
  const atkMultiplier = 1 + (totalStr / 100); // 1% extra damage per STR point
  const currentDamage = Math.floor(baseBossDamage * atkMultiplier) + testBossDamage;
  const bossLevel = Math.floor(currentDamage / 1000) + 1;
  const bossMaxHp = bossLevel * 1000;
  const bossIdHp = bossMaxHp - (currentDamage % 1000);
  
  // Boss name is either highest priority task or generic dragon
  const highestPriorityTask = pendingTasksList.sort((a,b) => (a.priority || "Z").localeCompare(b.priority || "Z"))[0];
  const bossName = bossData.isLoading ? (highestPriorityTask ? `Monster: ${highestPriorityTask.title}` : `Dragon (Lv.${bossLevel})`) : bossData.name;

  useEffect(() => {
    if (bossLevel !== currentLevelOfBoss) {
      setCurrentLevelOfBoss(bossLevel);
      setBossData(prev => ({ ...prev, isLoading: true }));
      
      getBossStory(bossLevel, pendingTasksList.slice(0, 3))
      .then(data => {
        if (data.bossName) {
           setBossData({
             name: data.bossName,
             description: data.bossDescription,
             story: data.story,
             isLoading: false
           });
        }
      });
    }
  }, [bossLevel, currentLevelOfBoss, pendingTasksList]);

  const handleBuyItem = (item: any) => {
    if (gold >= item.cost && !purchasedGear.includes(item.id)) {
       setTestGold(g => g - item.cost);
       setPurchasedGear([...purchasedGear, item.id]);
    }
  };

  const handleBuyPotion = () => {
    if (gold >= 20) {
       setTestGold(g => g - 20);
       setHealthPotions(p => p + 1);
    }
  };

  const handleUsePotion = () => {
    if (healthPotions > 0 && health < maxHealth) {
       setHealthPotions(p => p - 1);
       setTestHealthOffset(h => h + 15);
    }
  };

  return (
    <div className="bg-[#432874] min-h-screen p-4 md:p-8 font-sans relative overflow-x-hidden text-slate-100 flex flex-col items-center">
      {/* 16-bit Background Elements */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,0.5) 2px, transparent 2px)',
        backgroundSize: '32px 32px'
      }}></div>

      <div className="max-w-5xl w-full space-y-8 relative z-10 pt-4 pb-16">
        
        <header className="mb-8 text-center bg-[#2a1b4d] border-4 border-[#543b8a] p-6 rounded shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
          <h1 className="text-4xl md:text-5xl text-white drop-shadow-md text-yellow-400 font-press-start mb-4" style={{ textShadow: '4px 4px 0 #000' }}>
            BATTLE ARENA
          </h1>
          <p className="text-purple-200 text-lg md:text-xl font-sans font-medium tracking-wide max-w-2xl mx-auto">
            Your real-world productivity directly damages the monster! Complete tasks elsewhere in the app to win the battle.
          </p>
        </header>

        <div className="bg-[#2a1b4d] border-4 border-[#543b8a] p-4 lg:p-6 mb-8 rounded shadow-[8px_8px_0_rgba(0,0,0,0.5)] space-y-4">
           <h3 className="text-yellow-400 font-press-start text-xs uppercase mb-2">Tavern Story</h3>
           <div className="bg-[#1a1215] p-5 border-2 border-[#543b8a] shadow-inner rounded-sm">
             {bossData.isLoading ? (
               <p className="animate-pulse font-sans text-slate-300 italic">"The Innkeeper is gathering rumors about the next threat..."</p>
             ) : (
               <div className="font-sans text-slate-100 space-y-3 font-medium text-base leading-relaxed tracking-wide">
                  <p>"{bossData.story}"</p>
                  <p className="text-sm text-yellow-400 font-normal italic">-- {bossData.description}</p>
               </div>
             )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Character */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Player Card */}
            <div className="bg-[#5c3a21] border-[6px] border-[#3d2417] rounded shadow-[8px_8px_0_rgba(0,0,0,0.6)] relative overflow-hidden">
              <div className="bg-[#3d2417] p-2 flex justify-between items-center text-amber-50 font-press-start text-xs border-b-4 border-[#2b170c]">
                <div>LVL {level} HERO</div>
                <div className="flex gap-2 text-yellow-400">@USER</div>
              </div>
              
              <div className="p-6 relative flex flex-col items-center justify-center min-h-[220px] bg-[#6db3c7] border-b-[8px] border-[#4a8a9e]">
                 <div className="absolute bottom-0 w-full h-12 bg-[#518f43] border-t-8 border-[#3b7030]"></div> {/* grass */}

                <div className="absolute top-4 right-4 flex bg-[#00000088] rounded p-2 gap-2 shadow-inner border-2 border-slate-700 font-press-start text-xs">
                   <CoinIcon size={16} />
                   <span className="text-yellow-400">{gold}</span>
                </div>

                {/* Hero Character */}
                <div className="z-10 mt-6 relative h-40 flex flex-col items-center justify-end drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                   {/* Head */}
                   <div className="relative z-20 w-14 h-14 bg-amber-200 border-4 border-[#3d2417] rounded-full flex flex-col items-center justify-center">
                     {/* Eyes */}
                     <div className="flex gap-2 mb-1">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                     </div>
                     {purchasedGear.includes('helm') && (
                       <div className="absolute -inset-x-1 -top-2 bottom-4 bg-[#7e8c99] border-4 border-[#3d2417] rounded-t-full rounded-b-sm z-30 flex justify-center">
                         <div className="w-2 h-4 bg-black mt-2"></div>
                       </div>
                     )}
                   </div>
                   
                   {/* Body */}
                   <div className="relative z-10 w-16 h-16 bg-[#3a6bc4] border-4 border-[#3d2417] rounded-lg -mt-2">
                      {/* Left Arm (Shield) */}
                      <div className="absolute -left-6 top-2 w-6 h-12 bg-[#3a6bc4] border-4 border-[#3d2417] rounded-full -rotate-12 transform origin-top flex items-end justify-center pb-2 z-0">
                         {purchasedGear.includes('shield') && (
                            <div className="absolute -bottom-2 -left-4 text-slate-300 drop-shadow-md z-40 transform rotate-12">
                               <Shield size={36} fill="#624226" stroke="#3d2417" strokeWidth={2} />
                            </div>
                         )}
                      </div>
                      {/* Right Arm (Sword) */}
                      <div className="absolute -right-6 top-2 w-6 h-12 bg-[#3a6bc4] border-4 border-[#3d2417] rounded-full rotate-12 transform origin-top flex items-end justify-center pb-2 z-20">
                         {purchasedGear.includes('sword') && (
                            <div className="absolute -top-12 -right-8 transform rotate-[60deg] text-slate-200 drop-shadow-md z-10">
                               <Sword size={64} fill="#a8b5c2" stroke="#3d2417" strokeWidth={2} />
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Legs */}
                   <div className="flex gap-2 -mt-1 z-0 w-16 justify-center">
                      <div className="w-6 h-10 bg-[#3d2417] rounded-b"></div>
                      <div className="w-6 h-10 bg-[#3d2417] rounded-b"></div>
                   </div>
                </div>
              </div>

              {/* Resource Bars */}
              <div className="bg-[#2a2a2a] p-4 space-y-3 font-press-start text-[10px]">
                {/* HP */}
                <div className="flex items-center gap-2">
                  <div className="w-8 text-red-500">HP</div>
                  <div className="flex-1 bg-[#111] h-6 border-2 border-[#555] relative overflow-hidden">
                    <motion.div className="bg-red-500 h-full border-t-4 border-red-400" animate={{ width: `${(health / maxHealth) * 100}%` }} layout />
                    <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">{health}/{maxHealth}</span>
                  </div>
                </div>
                {/* XP */}
                <div className="flex items-center gap-2">
                  <div className="w-8 text-yellow-400">XP</div>
                  <div className="flex-1 bg-[#111] h-6 border-2 border-[#555] relative overflow-hidden">
                    <motion.div className="bg-yellow-500 h-full border-t-4 border-yellow-300" animate={{ width: `${(xp / xpNeeded) * 100}%` }} layout />
                    <span className="absolute inset-0 flex items-center justify-center text-yellow-900 drop-shadow-md">{xp}/{xpNeeded}</span>
                  </div>
                </div>
                {/* MP */}
                <div className="flex items-center gap-2">
                  <div className="w-8 text-blue-400">MP</div>
                  <div className="flex-1 bg-[#111] h-6 border-2 border-[#555] relative overflow-hidden">
                    <motion.div className="bg-blue-500 h-full border-t-4 border-blue-400" animate={{ width: `${(mana / maxMana) * 100}%` }} layout />
                    <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">{mana}/{maxMana}</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

           {/* Right Column: Boss Battle */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-[#222] border-[6px] border-[#444] rounded shadow-[8px_8px_0_rgba(0,0,0,0.6)] relative">
               <div className="bg-[#551a1a] p-3 border-b-4 border-[#331111] flex items-center justify-between font-press-start text-xs text-red-300">
                 <h3 className="flex items-center gap-2 text-white">
                   <Skull size={16} />
                   BOSS: {bossName.substring(0, 25)}
                 </h3>
                 <span className="text-yellow-500">Lv.{bossLevel}</span>
               </div>
               
               <div className="p-8 relative min-h-[380px] flex flex-col justify-center items-center overflow-hidden bg-gradient-to-b from-[#1a1215] to-[#2d1b22]">
                  
                    <div className="z-10 w-full text-center space-y-12">
                      
                        {/* Boss Base Graphic */}
                      <div className="relative mx-auto w-64 h-48 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(255,0,0,0.3)]">
                         <svg viewBox="0 0 200 200" className={`w-48 h-48 transition-all duration-1000 ${bossData.isLoading ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                           {/* Tail */}
                           <path d="M 40 160 Q 10 160 20 120 Q 30 80 50 140 Z" fill={bossLevel > 5 ? "#3f000f" : "#1a472a"} />
                           {/* Body */}
                           <circle cx="100" cy="120" r="40" fill={bossLevel > 5 ? "#7a0010" : "#2d8a4e"} />
                           <circle cx="95" cy="115" r="30" fill={bossLevel > 5 ? "#a80016" : "#41a364"} />
                           {/* Neck */}
                           <path d="M 100 80 Q 100 40 140 40 L 140 60 Q 120 60 120 100 Z" fill={bossLevel > 5 ? "#7a0010" : "#2d8a4e"} />
                           {/* Head */}
                           <polygon points="130,20 170,20 180,50 130,60" fill={bossLevel > 5 ? "#a80016" : "#3da861"} />
                           <polygon points="160,20 180,40 190,30" fill="#fff" /> {/* Jaw/Teeth */}
                           <circle cx="145" cy="35" r="4" fill="yellow" className="animate-pulse" /> {/* Eye */}
                           {/* Wings */}
                           <path d="M 120 100 Q 80 40 20 20 Q 40 60 80 110 Z" fill={bossLevel > 5 ? "#bd5c6b" : "#6bbd8b"} fillOpacity="0.8" />
                           <path d="M 130 95 Q 100 30 50 10 Q 70 50 90 100 Z" fill={bossLevel > 5 ? "#e08d98" : "#85d1a2"} fillOpacity="0.6" />
                           {/* Flames (only for high level) */}
                           {bossLevel > 5 && (
                             <path d="M 180 40 Q 190 30 200 40 Q 190 50 180 40 Z" fill="#ffaa00" className="animate-pulse" />
                           )}
                         </svg>
                      </div>

                      {/* Boss HP Bar */}
                      <div className="bg-[#111] p-4 border-4 border-[#333] shadow-[4px_4px_0_rgba(0,0,0,0.8)] font-press-start">
                        <div className="flex justify-between text-[10px] text-red-400 mb-4">
                          <span>{bossName.toUpperCase()}</span>
                          <span>{bossIdHp} / {bossMaxHp}</span>
                        </div>
                        <div className="w-full bg-[#333] h-6 border-4 border-[#222] relative overflow-hidden">
                          <motion.div className="bg-gradient-to-r from-red-600 to-red-400 h-full" animate={{ width: `${(bossIdHp / bossMaxHp) * 100}%` }} layout />
                        </div>
                        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 font-sans font-medium tracking-wide text-lg text-slate-300">
                          <p>
                            Tasks Pending: <span className="text-white font-bold text-xl">{pendingTasksCount}</span>
                          </p>
                          <div className="flex items-center gap-2 bg-[#222] p-2 border-2 border-slate-600 group relative">
                             <Sword className="text-slate-400" size={20} />
                             <span>DMG Power: <span className="text-yellow-400 text-xl font-bold">{Math.floor(((completedTasks*50)+(completedGoals*200) + 50) * atkMultiplier)}</span></span>
                             <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] p-2 font-sans pointer-events-none w-max z-20">
                               Base DMG + {Math.floor((atkMultiplier - 1)*100)}% STR Bonus
                             </div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
               </div>
            </div>

            {/* Inventory & Shop Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="bg-[#1e1e1e] border-4 border-[#333] p-4 text-center font-press-start">
                  <h4 className="text-xs text-yellow-400 mb-4 pb-2 border-b-4 border-[#333]">INVENTORY</h4>
                  <div className="flex flex-wrap gap-3 justify-center mb-4 min-h-[4rem]">
                    {/* Health Potions */}
                    {Array.from({ length: healthPotions }).map((_, i) => (
                      <button 
                        key={`potion-${i}`} 
                        onClick={handleUsePotion}
                        title="Click to use (+15 HP)"
                        className="w-12 h-12 bg-slate-800 border-2 border-slate-600 shadow-[2px_2px_0_#000] flex items-center justify-center hover:border-green-400 cursor-pointer hover:scale-110 transition-transform relative group"
                      >
                         <div className="w-4 h-6 border-2 border-slate-300 rounded-b-full bg-red-500"></div>
                         <div className="absolute -top-6 bg-black text-[8px] text-green-400 px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none border border-slate-700 whitespace-nowrap z-10 block">Use (+15 HP)</div>
                      </button>
                    ))}
                    {healthPotions === 0 && purchasedGear.length === 0 && (
                       <p className="text-[10px] text-slate-500 w-full mt-4">Empty</p>
                    )}
                    {/* Purchased Gear */}
                    {purchasedGear.map(id => {
                       const item = shopItems.find(s => s.id === id);
                       return (
                         <div key={`gear-${id}`} className="w-12 h-12 bg-slate-800 border-2 border-slate-600 shadow-[2px_2px_0_#000] flex items-center justify-center relative group">
                            {item?.icon === 'sword' && <Sword className="text-slate-300" size={20} />}
                            {item?.icon === 'shield' && <Shield className="text-slate-300" size={20} />}
                            {item?.icon === 'helm' && <div className="w-6 h-6 border-b-4 border-slate-400 rounded-t-full rounded-b-sm border-2"></div>}
                            <div className="absolute -top-6 bg-black text-[8px] text-white px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none border border-slate-700 whitespace-nowrap z-10 block">{item?.name}</div>
                         </div>
                       )
                    })}
                  </div>
              </div>
              <div className="bg-[#1e1e1e] border-4 border-[#333] p-4 font-press-start">
                  <h4 className="text-xs text-blue-400 mb-4 pb-2 border-b-4 border-[#333] text-center">SHOP</h4>
                  <div className="space-y-4">
                     {/* Potion Buy button */}
                     <div className="flex justify-between items-center bg-[#111] p-2 border-2 border-[#222]">
                        <div className="flex items-center gap-2">
                           <div className="w-4 h-6 border-2 border-slate-300 rounded-b-full bg-red-500 ml-1"></div>
                           <div className="flex flex-col ml-2">
                             <span className="text-[9px] text-red-300">Health Potion</span>
                             <span className="text-[7px] text-slate-500 mt-1">Recovers HP</span>
                           </div>
                        </div>
                        <button 
                           onClick={handleBuyPotion}
                           disabled={gold < 20}
                           className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-800 px-2 py-2 text-[9px] text-white flex items-center gap-1 active:scale-95"
                        >
                           <CoinIcon size={12} /> 20
                        </button>
                     </div>

                     {/* Equipment Buy list */}
                     {shopItems.map(item => {
                        const isPurchased = purchasedGear.includes(item.id);
                        return (
                           <div key={item.id} className={`flex justify-between items-center bg-[#111] p-2 border-2 ${isPurchased ? 'border-green-800 opacity-50' : 'border-[#222]'}`}>
                              <div className="flex items-center gap-2">
                                 {item.icon === 'sword' && <Sword className="text-slate-400 ml-1" size={16} />}
                                 {item.icon === 'shield' && <Shield className="text-slate-400 ml-1" size={16} />}
                                 {item.icon === 'helm' && <div className="w-5 h-5 border-b-2 border-slate-400 rounded-t-full rounded-b-sm border-2 ml-1"></div>}
                                 <div className="flex flex-col ml-2">
                                   <span className="text-[9px] text-slate-300">{item.name}</span>
                                   <span className="text-[7px] text-green-400 mt-1">
                                     {item.stats.str && `+${item.stats.str} STR `}
                                     {item.stats.con && `+${item.stats.con} CON `}
                                   </span>
                                 </div>
                              </div>
                              <button 
                                 onClick={() => handleBuyItem(item)}
                                 disabled={gold < item.cost || isPurchased}
                                 className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-800 px-2 py-2 text-[9px] text-white flex items-center gap-1 active:scale-95"
                              >
                                 {isPurchased ? 'OWNED' : <><CoinIcon size={12} /> {item.cost}</>}
                              </button>
                           </div>
                        )
                     })}
                  </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Floating test panel */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-[#111] border-4 border-slate-600 p-4 shadow-[8px_8px_0_rgba(0,0,0,0.8)] font-sans text-slate-100 max-w-sm">
           <h3 className="text-yellow-400 font-press-start text-[10px] mb-4 border-b-2 border-slate-700 pb-2">DEV DEBUG PANEL</h3>
           
           <div className="space-y-3">
             <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-4 mt-2">
                 <input type="checkbox" id="mockMode" checked={isMockMode} onChange={(e) => setIsMockMode(e.target.checked)} className="w-5 h-5 accent-yellow-500 cursor-pointer" />
                 <label htmlFor="mockMode" className="text-[10px] text-yellow-300 cursor-pointer font-press-start">ISOLATE TEST MODE</label>
             </div>
             <div className="flex justify-between items-center gap-4 text-sm">
                <span>Actions (+XP/LVL):</span>
                <div className="flex gap-2">
                   <button onClick={() => setTestActions(a => a + 1)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 border-2 border-slate-500 rounded">+1</button>
                   <button onClick={() => setTestActions(a => a + 10)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 border-2 border-slate-500 rounded">+10</button>
                </div>
             </div>
             
             <div className="flex justify-between items-center gap-4 text-sm">
                <span>Gold:</span>
                <div className="flex gap-2">
                   <button onClick={() => setTestGold(g => g + 50)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 border-2 border-slate-500 rounded">+50</button>
                   <button onClick={() => setTestGold(g => g - 50)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 border-2 border-slate-500 rounded">-50</button>
                </div>
             </div>

             <div className="flex justify-between items-center gap-4 text-sm">
                <span>Health Offset:</span>
                <div className="flex gap-2">
                   <button onClick={() => setTestHealthOffset(h => h + 10)} className="bg-green-700 hover:bg-green-600 px-2 py-1 border-2 border-green-500 rounded">+10</button>
                   <button onClick={() => setTestHealthOffset(h => h - 10)} className="bg-red-700 hover:bg-red-600 px-2 py-1 border-2 border-red-500 rounded">-10</button>
                </div>
             </div>

             <div className="flex justify-between items-center gap-4 text-sm">
                <span>Boss DMG:</span>
                <div className="flex gap-2">
                   <button onClick={() => setTestBossDamage(d => d + 100)} className="bg-purple-700 hover:bg-purple-600 px-2 py-1 border-2 border-purple-500 rounded">+100</button>
                   <button onClick={() => setTestBossDamage(d => d - 100)} className="bg-purple-700 hover:bg-purple-600 px-2 py-1 border-2 border-purple-500 rounded">-100</button>
                </div>
             </div>
             
             <button 
                onClick={() => {
                   setTestActions(0);
                   setTestGold(0);
                   setTestHealthOffset(0);
                   setTestBossDamage(0);
                }} 
                className="w-full mt-2 bg-slate-800 hover:bg-slate-700 py-2 border-2 border-slate-600 font-press-start text-[8px] text-red-300"
             >
               RESET STATE
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

