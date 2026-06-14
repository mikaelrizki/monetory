"use client";

import { useState } from 'react';
import { Account, ACCOUNT_TYPES, AccountType } from '../types';
import { Trash2, Plus, Landmark, CreditCard, Banknote, HelpCircle } from 'lucide-react';

interface AccountsManagerProps {
  accounts: Account[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
}

export default function AccountsManager({
  accounts,
  onAddAccount,
  onDeleteAccount
}: AccountsManagerProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = parseFloat(balance) || 0;
    if (!name || !type) return;

    onAddAccount({
      name,
      type,
      balance: parsedBalance
    });

    setName('');
    setType('bank');
    setBalance('');
    setShowAddForm(false);
  };

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case 'bank':
        return <Landmark size={20} />;
      case 'ewallet':
        return <CreditCard size={20} />;
      case 'cash':
        return <Banknote size={20} />;
      default:
        return <HelpCircle size={20} />;
    }
  };

  const getAccountTypeLabel = (accType: AccountType) => {
    const found = ACCOUNT_TYPES.find(t => t.value === accType);
    return found ? found.label : 'Lainnya';
  };

  const totalWealth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Total wealth display */}
      <div className="glass-panel" style={{ 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(99, 102, 241, 0.12) 100%)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h2 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Saldo (Seluruh Sumber Dana)</h2>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{formatCurrency(totalWealth)}</span>
        </div>
        {!showAddForm && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={16} /> Tambah Sumber Dana
          </button>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start', width: '100%' }}>
        {/* Accounts Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Daftar Sumber Dana</h3>
          
          {accounts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '0.9rem' }}>Belum ada sumber dana yang dibuat.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {accounts.map(acc => {
                // Different cards get gradients based on type
                let cardGradient = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'; // default/bank
                if (acc.type === 'ewallet') {
                  cardGradient = 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)'; // violet
                } else if (acc.type === 'cash') {
                  cardGradient = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'; // emerald
                }

                return (
                  <div 
                    key={acc.id} 
                    className="glass-panel"
                    style={{ 
                      padding: '1.25rem 1.5rem', 
                      background: cardGradient,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                      overflow: 'hidden',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    {/* Background glows for a premium feel */}
                    <div style={{
                      position: 'absolute',
                      top: '-50px',
                      right: '-50px',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.03)',
                      pointerEvents: 'none'
                    }} />

                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                        }}>
                          {getAccountIcon(acc.type)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{acc.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{getAccountTypeLabel(acc.type)}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => onDeleteAccount(acc.id)} 
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition-smooth)',
                          zIndex: 2
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-expense)';
                          e.currentTarget.style.background = 'var(--color-expense-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        title="Hapus Sumber Dana"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', zIndex: 1 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo Tersedia</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{formatCurrency(acc.balance)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Account Form */}
        {showAddForm && (
          <div className="glass-panel" style={{ padding: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Tambah Sumber Dana Baru</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="accName">Nama Sumber Dana *</label>
                <input
                  type="text"
                  id="accName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Contoh: BCA, GoPay, Tunai, OVO"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="accType">Tipe Sumber Dana *</label>
                <select
                  id="accType"
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  required
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="accBalance">Saldo Awal (IDR)</label>
                <input
                  type="number"
                  id="accBalance"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="Contoh: 1000000"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary flex-1" 
                  onClick={() => setShowAddForm(false)}
                  style={{ padding: '0.6rem' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  style={{ padding: '0.6rem' }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
