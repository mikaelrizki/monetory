"use client";

import { useState } from 'react';
import { Transaction } from '../types';

interface ChartsProps {
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Makanan & Minuman': '#f43f5e', // Rose
  'Transportasi': '#0ea5e9', // Sky Blue
  'Belanja': '#a855f7', // Purple
  'Tagihan & Utilitas': '#f59e0b', // Amber
  'Hiburan & Rekreasi': '#ec4899', // Pink
  'Kesehatan': '#10b981', // Emerald
  'Pendidikan': '#6366f1', // Indigo
  'Lain-lain': '#64748b', // Slate
  // Income categories mapping just in case
  'Gaji': '#10b981',
  'Investasi': '#06b6d4',
  'Sampingan': '#8b5cf6',
  'Hadiah / Bonus': '#f59e0b'
};

const DEFAULT_COLOR = '#64748b';

export default function Charts({ transactions }: ChartsProps) {
  const [hoveredDoughnutIndex, setHoveredDoughnutIndex] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredBarType, setHoveredBarType] = useState<'income' | 'expense' | null>(null);

  // 1. DOUGHNUT CHART (Expense breakdown)
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const expenseByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const doughnutData = Object.entries(expenseByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    color: CATEGORY_COLORS[category] || DEFAULT_COLOR
  })).sort((a, b) => b.amount - a.amount);

  // Doughnut parameters
  const radius = 55;
  const strokeWidth = 14;
  const center = 70;
  const circumference = 2 * Math.PI * radius; // ~345.57

  // Accumulate angles for rotating circles
  let accumulatedPercentage = 0;

  // 2. BAR CHART (7-Day Cash Flow)
  const getLast7Days = () => {
    const days = [];
    const dateNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayName = dateNames[d.getDay()];
      days.push({ dateString, label: dayName, dayOfMonth: d.getDate() });
    }
    return days;
  };

  const last7Days = getLast7Days();

  const barChartData = last7Days.map(day => {
    const dayTxs = transactions.filter(t => t.date === day.dateString);
    const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      ...day,
      income,
      expense
    };
  });

  // Calculate scale for bar chart
  const maxVal = Math.max(
    ...barChartData.map(d => Math.max(d.income, d.expense)),
    100000 // Prevent division by zero, min scale of 100k
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%' }}>
      {/* Expense breakdown chart (Doughnut) */}
      <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Proporsi Pengeluaran</h3>
        
        {totalExpense === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.9rem' }}>Belum ada data pengeluaran dicatat.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, flexWrap: 'wrap' }}>
            {/* SVG Doughnut */}
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                {doughnutData.map((item, index) => {
                  const strokeLength = (item.percentage / 100) * circumference;
                  const strokeOffset = circumference - strokeLength;
                  const rotation = (accumulatedPercentage / 100) * 360;
                  accumulatedPercentage += item.percentage;

                  const isHovered = hoveredDoughnutIndex === index;

                  return (
                    <circle
                      key={item.category}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={strokeOffset}
                      transform={`rotate(${rotation - 90} ${center} ${center})`}
                      style={{
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        cursor: 'pointer',
                        opacity: hoveredDoughnutIndex !== null && !isHovered ? 0.6 : 1
                      }}
                      onMouseEnter={() => setHoveredDoughnutIndex(index)}
                      onMouseLeave={() => setHoveredDoughnutIndex(null)}
                    />
                  );
                })}
              </svg>
              {/* Inner Center Label */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Pengeluaran</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-expense)', textAlign: 'center', padding: '0 0.5rem' }}>
                  {hoveredDoughnutIndex !== null 
                    ? formatCurrency(doughnutData[hoveredDoughnutIndex].amount)
                    : formatCurrency(totalExpense)
                  }
                </span>
                {hoveredDoughnutIndex !== null && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {doughnutData[hoveredDoughnutIndex].percentage.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Legend */}
            <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {doughnutData.slice(0, 5).map((item, index) => (
                <div 
                  key={item.category} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'between',
                    fontSize: '0.8rem',
                    background: hoveredDoughnutIndex === index ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    transition: 'background 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredDoughnutIndex(index)}
                  onMouseLeave={() => setHoveredDoughnutIndex(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }}></span>
                    <span style={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.category}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginLeft: '0.5rem' }}>
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
              {doughnutData.length > 5 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '1.25rem' }}>
                  + {doughnutData.length - 5} Kategori lainnya
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7-Day Cash Flow Chart (Bar) */}
      <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aliran Kas 7 Hari Terakhir</h3>
          {/* Legend indicators */}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-income)' }}></span> Pemasukan
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-expense)' }}></span> Pengeluaran
            </span>
          </div>
        </div>

        {/* SVG Grouped Bar Chart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Tooltip Overlay */}
          {hoveredBarIndex !== null && hoveredBarType !== null && (
            <div style={{
              position: 'absolute',
              top: '0px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '0.4rem 0.6rem',
              fontSize: '0.75rem',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 10,
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {barChartData[hoveredBarIndex].label}, {barChartData[hoveredBarIndex].dayOfMonth}
              </div>
              <div style={{ color: hoveredBarType === 'income' ? 'var(--color-income)' : 'var(--color-expense)', fontWeight: 700 }}>
                {hoveredBarType === 'income' ? 'Pemasukan: ' : 'Pengeluaran: '}
                {formatCurrency(hoveredBarType === 'income' ? barChartData[hoveredBarIndex].income : barChartData[hoveredBarIndex].expense)}
              </div>
            </div>
          )}

          {/* SVG Frame */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1.5rem 0.5rem 0.25rem' }}>
            {barChartData.map((d, index) => {
              // Calculate heights relative to maximum
              const maxBarHeight = 150; // pixels
              const incHeight = (d.income / maxVal) * maxBarHeight;
              const expHeight = (d.expense / maxVal) * maxBarHeight;

              const isDayHovered = hoveredBarIndex === index;

              return (
                <div key={d.dateString} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  opacity: hoveredBarIndex !== null && !isDayHovered ? 0.55 : 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  {/* The bars container */}
                  <div style={{
                    height: `${maxBarHeight}px`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '4px',
                    width: '100%',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    {/* Income Bar */}
                    <div 
                      style={{
                        width: '12px',
                        height: `${Math.max(incHeight, d.income > 0 ? 3 : 0)}px`,
                        background: 'linear-gradient(to top, var(--color-income) 0%, #34d399 100%)',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease',
                        transform: isDayHovered && hoveredBarType === 'income' ? 'scaleY(1.05)' : 'none'
                      }}
                      onMouseEnter={() => {
                        setHoveredBarIndex(index);
                        setHoveredBarType('income');
                      }}
                      onMouseLeave={() => {
                        setHoveredBarIndex(null);
                        setHoveredBarType(null);
                      }}
                    />
                    {/* Expense Bar */}
                    <div 
                      style={{
                        width: '12px',
                        height: `${Math.max(expHeight, d.expense > 0 ? 3 : 0)}px`,
                        background: 'linear-gradient(to top, var(--color-expense) 0%, #fb7185 100%)',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease',
                        transform: isDayHovered && hoveredBarType === 'expense' ? 'scaleY(1.05)' : 'none'
                      }}
                      onMouseEnter={() => {
                        setHoveredBarIndex(index);
                        setHoveredBarType('expense');
                      }}
                      onMouseLeave={() => {
                        setHoveredBarIndex(null);
                        setHoveredBarType(null);
                      }}
                    />
                  </div>
                  {/* Label */}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{d.label}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.dayOfMonth}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
