import { useState } from 'react'

const Money = ({ expenses, setExpenses, people, baseAmount, setBaseAmount, paidList, setPaidList }) => {

    const [amt, setAmt] = useState("")
    const [desc, setDesc] = useState("")
    const [payer, setPayer] = useState("")

    const add_ex = () => {
        if (!amt || !payer) return
        setExpenses([...expenses, {
            id: Math.random(),
            amount: parseFloat(amt),
            desc: desc || "Stuff",
            payer: payer
        }])
        setAmt("")
        setDesc("")
    }

    const toggle_paid = (pid) => {
        if (paidList.includes(pid)) {
            setPaidList(paidList.filter(id => id !== pid))
        } else {
            setPaidList([...paidList, pid])
        }
    }

    return (
        <div>

            <div style={{
                border: '1px solid #30363d',
                borderRadius: '6px',
                marginBottom: '20px',
                background: '#0d1117'
            }}>
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #30363d',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: '#8b949e' }}>
                                Per Person
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '16px', color: '#8b949e' }}>€</span>
                                <input
                                    type="number"
                                    value={baseAmount || ""}
                                    onChange={e => setBaseAmount(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: '#8b949e' }}>
                                Total Event ({people.length})
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '16px', color: '#8b949e' }}>€</span>
                                <input
                                    type="number"
                                    value={(baseAmount * people.length).toFixed(2) || ""}
                                    onChange={e => {
                                        const total = parseFloat(e.target.value) || 0
                                        const perPerson = people.length > 0 ? total / people.length : 0
                                        setBaseAmount(parseFloat(perPerson.toFixed(2)))
                                    }}
                                    placeholder="Total"
                                    style={{ width: '100%' }}
                                    disabled={people.length === 0}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                <div style={{ padding: '8px 0' }}>
                    <div style={{ padding: '0 16px 8px', fontSize: '12px', fontWeight: 600, color: '#8b949e' }}>
                        Payments Collected
                    </div>
                    {people.map(p => {
                        const isPaid = paidList.includes(p.id)
                        return (
                            <div
                                key={p.id}
                                onClick={() => toggle_paid(p.id)}
                                style={{
                                    padding: '8px 16px',
                                    display: 'flex',
                                    gap: '10px',

                                    cursor: 'pointer',
                                    color: isPaid ? '#8b949e' : '#c9d1d9',
                                    textDecoration: isPaid ? 'line-through' : 'none'
                                }}
                            >
                                <input type="checkbox" checked={isPaid} readOnly style={{ margin: 0 }} />
                                {p.name}
                            </div>
                        )
                    })}
                    {people.length === 0 && <div style={{ padding: '0 16px', color: '#8b949e', fontSize: '13px' }}>No people to collect from</div>}
                </div>
            </div>


            <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '15px', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>
                    Extra Expenses
                </h3>

                <div style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    padding: '16px',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <select
                            value={payer}
                            onChange={e => setPayer(e.target.value)}
                            style={{ flex: '1 1 150px' }}
                        >
                            <option value="">Who paid?</option>
                            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input
                            type="number"
                            value={amt}
                            onChange={e => setAmt(e.target.value)}
                            placeholder="€ Amount"
                            style={{ width: '100px' }}
                        />
                    </div>
                    <input
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        placeholder="Description (e.g. Uber, Drinks)"
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <button
                        onClick={add_ex}
                        style={{ width: '100%', background: '#238636', borderColor: 'rgba(240,246,252,0.1)', color: '#fff' }}
                    >
                        Add Expense
                    </button>
                </div>


                <div style={{ border: '1px solid #30363d', borderRadius: '6px', overflow: 'hidden' }}>
                    {expenses.map((ex, i) => {
                        const p_name = people.find(p => p.id == ex.payer)?.name || "Unknown"
                        return (
                            <div key={ex.id} style={{
                                padding: '10px 16px',
                                borderTop: i === 0 ? 'none' : '1px solid #30363d',
                                background: '#0d1117',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <strong>{p_name}</strong>
                                    <span style={{ color: '#8b949e', marginLeft: '5px' }}>paid </span>
                                    <strong style={{ color: '#f85149' }}>€{ex.amount}</strong>
                                </div>
                                <span style={{ color: '#8b949e', fontSize: '13px' }}>{ex.desc}</span>
                            </div>
                        )
                    })}
                    {expenses.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#8b949e' }}>
                            No expenses recorded.
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default Money
