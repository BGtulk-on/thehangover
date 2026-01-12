import { useState } from 'react'

const PeopleList = ({ list, setList }) => {

    const [temp, setTemp] = useState("")

    const add_p = () => {
        if (!temp) return
        setList([...list, { name: temp, id: Math.random() }])
        setTemp("")
    }

    const rem_p = (id) => {
        setList(list.filter(x => x.id !== id))
    }

    return (
        <div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    value={temp}
                    onChange={e => setTemp(e.target.value)}
                    placeholder="Add new person..."
                    style={{ flex: 1 }}
                    onKeyDown={e => e.key === 'Enter' && add_p()}
                />
                <button onClick={add_p} style={{ background: '#238636', borderColor: 'rgba(240,246,252,0.1)', color: '#fff' }}>
                    Add person
                </button>
            </div>


            <div style={{
                border: '1px solid #30363d',
                borderRadius: '6px',
                overflow: 'hidden'
            }}>
                <div style={{
                    background: '#161b22',
                    padding: '8px 16px',
                    borderBottom: '1px solid #30363d',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>People</span>
                    <span style={{
                        background: 'rgba(110,118,129,0.4)',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: '600',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                    }}>
                        {list.length}
                    </span>
                </div>

                {list.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#8b949e' }}>
                        No people added yet.
                    </div>
                )}

                {list.map((p, i) => (
                    <div key={p.id} style={{
                        padding: '10px 16px',
                        borderTop: i === 0 ? 'none' : '1px solid #21262d',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#0d1117'
                    }}>
                        <div style={{ fontWeight: 500, color: '#c9d1d9' }}>
                            {p.name}
                        </div>
                        <button
                            onClick={() => rem_p(p.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f85149',
                                fontSize: '12px',
                                padding: '0'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>

        </div>
    )
}

export default PeopleList
