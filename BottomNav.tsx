import { History, Smartphone, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'history', label: 'ИСТОРИЯ', icon: History },
    { id: 'computer', label: 'КОМПЬЮТЕР', icon: Smartphone },
    { id: 'settings', label: 'НАСТРОЙКИ', icon: Settings2 },
  ];

  return (
    <nav className="bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900 pb-safe shrink-0">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-accent' : 'text-gray-400 dark:text-zinc-600'
              }`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 font-bold tracking-wider uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
