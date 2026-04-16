import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

interface DailyTabsProps {
  currentDate: string;
  onDateChange: (date: string) => void;
}

export default function DailyTabs({ currentDate, onDateChange }: DailyTabsProps) {
  const [startDateIndex, setStartDateIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    const todayDisplay = today.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    dates.push({ key: todayKey, name: `Hoje (${todayDisplay})`, isToday: true });

    for (let i = 1; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dateDisplay = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
      dates.push({ key: dateKey, name: dateDisplay, isToday: false });
    }
    return dates;
  };

  const dates = generateDates();
  const getCurrentDateName = () => dates.find(d => d.key === currentDate)?.name || 'Selecionar data';
  const visibleDatesCount = 7;
  const visibleDates = dates.slice(startDateIndex, startDateIndex + visibleDatesCount);
  const canScrollLeft = startDateIndex > 0;
  const canScrollRight = startDateIndex + visibleDatesCount < dates.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isMobile ? (
          <div className="relative mobile-menu-container">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">{getCurrentDateName()}</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-b-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  {dates.map((date) => (
                    <button
                      key={date.key}
                      onClick={() => { onDateChange(date.key); setIsMobileMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        currentDate === date.key ? 'bg-blue-600 text-white'
                          : date.isToday ? 'text-green-400 hover:text-white hover:bg-gray-700'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {date.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-4">
            <button
              onClick={() => canScrollLeft && setStartDateIndex(startDateIndex - 1)}
              disabled={!canScrollLeft}
              className={`p-2 rounded-lg transition-colors ${canScrollLeft ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 cursor-not-allowed'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {visibleDates.map((date) => (
                <button
                  key={date.key}
                  onClick={() => onDateChange(date.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    currentDate === date.key ? 'bg-blue-600 text-white'
                      : date.isToday ? 'text-green-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {date.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => canScrollRight && setStartDateIndex(startDateIndex + 1)}
              disabled={!canScrollRight}
              className={`p-2 rounded-lg transition-colors ${canScrollRight ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 cursor-not-allowed'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
