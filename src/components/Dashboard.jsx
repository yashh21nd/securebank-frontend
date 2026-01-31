import React, { useState, useMemo, useEffect } from 'react'

const CATEGORIES = [
  'Shopping', 'Food & Dining', 'Bills', 'Transport', 'Car Maintenance', 
  'Entertainment', 'Healthcare', 'Education', 'Utilities', 'Other'
]

const initialTransactions = [
  { id: 'TX1001', desc: 'Amazon Purchase', amount: -59.99, date: '2025-10-25', category: 'Shopping' },
  { id: 'TX1002', desc: 'Salary', amount: 2500.0, date: '2025-10-24', category: 'Income' },
  { id: 'TX1003', desc: 'Coffee Shop', amount: -4.5, date: '2025-10-23', category: 'Food & Dining' },
  { id: 'TX1004', desc: 'Electricity Bill', amount: -85.0, date: '2025-10-22', category: 'Bills' },
  { id: 'TX1005', desc: 'Grocery Store', amount: -45.30, date: '2025-10-21', category: 'Food & Dining' },
]

function AddTransactionForm({ onAddTransaction }) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    desc: '',
    amount: '',
    category: 'Shopping',
    date: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.desc || !formData.amount) return
    
    const newTransaction = {
      id: 'TX' + Date.now(),
      desc: formData.desc,
      amount: parseFloat(formData.amount),
      date: formData.date,
      category: formData.category
    }
    
    onAddTransaction(newTransaction)
    setFormData({ desc: '', amount: '', category: 'Shopping', date: new Date().toISOString().split('T')[0] })
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 16px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        + Add Transaction
      </button>
    )
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Add New Transaction</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Description (e.g., Coffee Shop)"
          value={formData.desc}
          onChange={(e) => setFormData({...formData, desc: e.target.value})}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Amount (negative for expenses)"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          required
        />
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="Income">Income</option>
        </select>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            type="submit"
            style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', flex: 1 }}
          >
            Add Transaction
          </button>
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function BarChart({data}){
  const max = Math.max(...data.map(d=>d.amount), 1) // Ensure minimum value of 1
  const width = 100
  const height = 35
  const gap = 2
  const barWidth = (width - gap*(data.length-1)) / data.length
  
  return (
    <svg viewBox={`0 0 ${width} 45`} preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:140}}>
      {data.map((d,i)=>{
        const barHeight = Math.max((d.amount / max) * height, 2) // Minimum bar height of 2
        const x = i * (barWidth + gap)
        return (
          <g key={i}>
            <rect 
              x={x} 
              y={height - barHeight + 5} 
              width={barWidth} 
              height={barHeight} 
              rx={1} 
              fill="#7c3aed" 
            />
            <text 
              x={x + barWidth/2} 
              y={height + 12} 
              fontSize="3" 
              textAnchor="middle" 
              fill="#374151"
              fontWeight="600"
            >
              {d.month}
            </text>
            {d.amount > 0 && (
              <text 
                x={x + barWidth/2} 
                y={height - barHeight + 2} 
                fontSize="2.5" 
                textAnchor="middle" 
                fill="#ffffff"
                fontWeight="600"
              >
                ₹{d.amount}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}


function Donut({data}){
  const total = data.reduce((s,d)=>s+d.amount,0)
  const radius = 50
  const circumference = 2*Math.PI*radius
  let offset = 0
  const colors = ['#ef4444','#f59e0b','#60a5fa','#34d399']
  return (
    <svg className="donut" viewBox="0 0 120 120" width={160} height={160}>
      <g transform="translate(60,60)">
        {data.map((d,i)=>{
          const frac = d.amount/total
          const dash = frac * circumference
          const rotation = (offset / circumference) * 360
          offset += dash
          return (
            <circle key={i}
              r={radius}
              cx={0}
              cy={0}
              fill="transparent"
              stroke={colors[i % colors.length]}
              strokeWidth={20}
              strokeDasharray={`${dash} ${circumference-dash}`}
              transform={`rotate(-90) rotate(${rotation})`}
            />
          )
        })}
        <text x={0} y={4} textAnchor="middle" fontSize={10} fill="#0f1724">{`₹${total.toFixed(2)}`}</text>
      </g>
    </svg>
  )
}

export default function Dashboard({ newTransaction, onTransactionProcessed }){
  const [transactions, setTransactions] = useState(initialTransactions)
  const [weekFilter, setWeekFilter] = useState('all') // 'all', 'thisWeek', 'lastWeek'
  const [recentPayment, setRecentPayment] = useState(null)

  // Handle new transaction from Voice/Payment components
  useEffect(() => {
    if (newTransaction && newTransaction.id) {
      // Check if transaction already exists
      const exists = transactions.some(tx => tx.id === newTransaction.id)
      if (!exists) {
        setTransactions(prev => [newTransaction, ...prev])
        setRecentPayment(newTransaction)
        
        // Clear recent payment highlight after 5 seconds
        setTimeout(() => setRecentPayment(null), 5000)
        
        // Notify parent that transaction was processed
        if (onTransactionProcessed) {
          onTransactionProcessed(newTransaction.id)
        }
      }
    }
  }, [newTransaction])

  const addTransaction = (newTx) => {
    setTransactions([newTx, ...transactions])
  }

  // Calculate weekly transactions
  const filteredTransactions = useMemo(() => {
    if (weekFilter === 'all') return transactions
    
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.date)
      if (weekFilter === 'thisWeek') {
        return txDate >= oneWeekAgo && txDate <= now
      } else if (weekFilter === 'lastWeek') {
        return txDate >= twoWeeksAgo && txDate < oneWeekAgo
      }
      return true
    })
  }, [transactions, weekFilter])

  // Calculate dynamic category spending from filtered transactions
  const categoryData = useMemo(() => {
    const categoryTotals = {}
    
    filteredTransactions
      .filter(tx => tx.amount < 0 && tx.category !== 'Income') // Only expenses
      .forEach(tx => {
        const category = tx.category
        categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(tx.amount)
      })
    
    return Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6) // Top 6 categories
  }, [filteredTransactions])

  // Calculate chart data based on filter
  const chartData = useMemo(() => {
    if (weekFilter === 'thisWeek' || weekFilter === 'lastWeek') {
      // Generate 7-day data for week view
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const weekData = days.map(day => ({ day, amount: 0 }))
      
      filteredTransactions
        .filter(tx => tx.amount < 0) // Only expenses
        .forEach(tx => {
          const txDate = new Date(tx.date)
          const dayIndex = (txDate.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
          weekData[dayIndex].amount += Math.abs(tx.amount)
        })
      
      return weekData.map(d => ({ 
        month: d.day, 
        amount: Math.round(d.amount * 100) / 100 
      }))
    } else {
      // Default monthly data for "All Time"
      return [
        { month: 'Jan', amount: 520 },
        { month: 'Feb', amount: 420 },
        { month: 'Mar', amount: 680 },
        { month: 'Apr', amount: 590 },
        { month: 'May', amount: 730 },
        { month: 'Jun', amount: 660 },
      ]
    }
  }, [filteredTransactions, weekFilter])

  // Calculate monthly data (sample for now, could be dynamic)
  const sampleMonthly = [
    { month: 'Jan', amount: 520 },
    { month: 'Feb', amount: 420 },
    { month: 'Mar', amount: 680 },
    { month: 'Apr', amount: 590 },
    { month: 'May', amount: 730 },
    { month: 'Jun', amount: 660 },
  ]

  const totalSpend = filteredTransactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  const weeklyAvg = Math.round((totalSpend / Math.max(1, filteredTransactions.length)) * 7 * 100) / 100

  return (
    <div className="grid" style={{alignItems:'start'}}>
      <div className="col-8">
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h2 style={{margin:0}}>User Spend Analysis</h2>
              <p className="subtitle">Overview of spending patterns and recommendations</p>
              <p className="subtitle" style={{marginTop:8}}>
                User Spend Analysis Dashboard: To empower users with better financial management, the system includes a dedicated dashboard. This feature provides comprehensive visualizations and insights into spending patterns, categorizes expenses, and helps users understand and manage their finances more effectively.
              </p>
              
              <div style={{marginTop:12, display:'flex', gap:8}}>
                <label style={{fontSize:14, color:'#6b7280'}}>Filter transactions:</label>
                <select 
                  value={weekFilter} 
                  onChange={(e) => setWeekFilter(e.target.value)}
                  style={{padding:'4px 8px', borderRadius:'4px', border:'1px solid #d1d5db', fontSize:12}}
                >
                  <option value="all">All Time</option>
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                </select>
              </div>
            </div>
            <div className="summary">
              <div className="kpi">
                <h3>Total Spent ({weekFilter})</h3>
                <p>₹{totalSpend.toFixed(2)}</p>
              </div>
              <div className="kpi">
                <h3>Weekly Avg</h3>
                <p>₹{weeklyAvg}</p>
              </div>
            </div>
          </div>

          <div style={{marginTop:16}} className="chart-area">
            <div className="bar-chart">
              <BarChart data={chartData} />
            </div>

            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{flex:1}} className="card">
                <h3 style={{marginTop:0}}>Top Categories ({weekFilter})</h3>
                {categoryData.length > 0 ? (
                  <ul style={{padding:0,margin:0,listStyle:'none'}}>
                    {categoryData.map((c,i)=> (
                      <li key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0'}}>
                        <span>{c.name}</span>
                        <strong>₹{c.amount.toFixed(2)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{color:'#6b7280', fontStyle:'italic'}}>No expense data available for this period</p>
                )}
              </div>

              <div style={{width:200}} className="card" aria-hidden>
                <h3 style={{marginTop:0}}>Category Share</h3>
                {categoryData.length > 0 ? (
                  <Donut data={categoryData} />
                ) : (
                  <div style={{width:160,height:160,display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280'}}>
                    No data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{marginTop:16}} className="card">
          <h3 style={{marginTop:0}}>Insights & Recommendations</h3>
          <ul>
            {categoryData.length > 0 && (
              <li>Your top spending category is {categoryData[0].name} (₹{categoryData[0].amount}). Consider setting a budget limit.</li>
            )}
            {categoryData.find(c => c.name === 'Food & Dining') && (
              <li>Food & Dining expenses detected. Look for meal prep opportunities to save costs.</li>
            )}
            {filteredTransactions.length === 0 && (
              <li>Add some transactions to see personalized spending insights and recommendations.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="col-4">
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{margin:0}}>Recent Transactions ({weekFilter})</h3>
          </div>
          <AddTransactionForm onAddTransaction={addTransaction} />
          
          <ul className="tx-list" style={{marginTop:16}}>
            {filteredTransactions.slice(0,8).map(tx=> (
              <li 
                key={tx.id} 
                className="tx-item"
                style={{
                  background: recentPayment?.id === tx.id ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'transparent',
                  borderRadius: recentPayment?.id === tx.id ? '8px' : '0',
                  padding: recentPayment?.id === tx.id ? '12px' : '12px 0',
                  transition: 'all 0.3s ease'
                }}
              >
                <div>
                  <div style={{fontWeight:600}}>
                    {tx.desc}
                    {recentPayment?.id === tx.id && (
                      <span style={{marginLeft: 8, fontSize: 11, background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: 10}}>NEW</span>
                    )}
                  </div>
                  <div className="subtitle">{tx.date} · {tx.category}</div>
                </div>
                <div style={{color: tx.amount<0? '#ef4444':'#10b981',fontWeight:700}}>
                  {tx.amount<0? '-':'+'}₹{Math.abs(tx.amount).toFixed(2)}
                </div>
              </li>
            ))}
            {filteredTransactions.length === 0 && (
              <li style={{color:'#6b7280',fontStyle:'italic',padding:'12px 0'}}>
                No transactions for this period. Add some transactions to see your spending analysis.
              </li>
            )}
          </ul>
        </div>

        <div style={{marginTop:16}} className="card">
          <h3 style={{marginTop:0}}>Security Status</h3>
          <p className="subtitle">Your account connection is secure. Multi-factor authentication enabled.</p>
          <div style={{marginTop:8}}>
            <button style={{padding:'10px 12px',background:'#0ea5e9',color:'white',border:'none',borderRadius:8}}>Review Security Settings</button>
          </div>
        </div>
      </div>
    </div>
  )
}