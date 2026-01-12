import { useState } from 'react'

const Rooms = ({ rooms, setRooms, people }) => {

    const [rname, setRname] = useState("")
    const [cap, setCap] = useState(2)

    const add_room = () => {
        if (!rname) return
        setRooms([...rooms, {
            id: Math.random(),
            name: rname,
            capacity: parseInt(cap),
            occupants: []
        }])
        setRname("")
    }

    const toggle_occ = (roomId, personId) => {
        const r = rooms.find(x => x.id === roomId)
        if (!r) return

        let new_r = { ...r }
        if (new_r.occupants.includes(personId)) {
            new_r.occupants = new_r.occupants.filter(x => x !== personId)
        } else {
            if (new_r.occupants.length >= new_r.capacity) {
                alert("Room full!")
                return
            }
            new_r.occupants.push(personId)
        }

        setRooms(rooms.map(x => x.id === roomId ? new_r : x))
    }

    return (
        <div>

            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                        value={rname}
                        onChange={e => setRname(e.target.value)}
                        placeholder="New Room Name"
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        value={cap}
                        onChange={e => setCap(e.target.value)}
                        placeholder="Cap"
                        style={{ width: '60px' }}
                    />
                </div>
                <button onClick={add_room} style={{ width: '100%', background: '#238636', borderColor: 'rgba(240,246,252,0.1)', color: '#fff' }}>Add</button>
            </div>

            <div>
                {rooms.map(r => (
                    <div key={r.id} style={{
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            background: '#161b22',
                            padding: '10px 16px',
                            borderBottom: '1px solid #30363d',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{r.name}</span>
                            <span style={{ fontSize: '12px', background: r.occupants.length >= r.capacity ? '#f85149' : '#30363d', color: '#f0f6fc', padding: '2px 8px', borderRadius: '10px' }}>
                                {r.occupants.length} / {r.capacity}
                            </span>
                        </div>

                        <div style={{ background: '#0d1117' }}>
                            {people.map(p => {
                                const in_here = r.occupants.includes(p.id)
                                const in_other = rooms.some(or => or.id !== r.id && or.occupants.includes(p.id))

                                if (in_other && !in_here) return null

                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => toggle_occ(r.id, p.id)}
                                        style={{
                                            padding: '8px 16px',
                                            borderTop: '1px solid #21262d',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            color: in_here ? '#fff' : '#8b949e'
                                        }}
                                    >
                                        <input type="checkbox" checked={in_here} readOnly style={{ margin: 0 }} />
                                        {p.name}
                                    </div>
                                )
                            })}
                            {people.length === 0 && <div style={{ padding: '10px 16px', color: '#8b949e', fontSize: '13px' }}>No people available</div>}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    )
}

export default Rooms
