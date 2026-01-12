import { useState } from 'react'

const Cars = ({ cars, setCars, people }) => {

    const [driver, setDriver] = useState("")
    const [cap, setCap] = useState(4)

    const add_car = () => {
        if (!driver) return
        setCars([...cars, {
            id: Math.random(),
            driver: driver,
            capacity: parseInt(cap),
            passengers: []
        }])
        setDriver("")
    }

    const toggle_pass = (carId, personId) => {
        const c = cars.find(x => x.id === carId)
        if (!c) return

        let new_c = { ...c }
        if (new_c.driver === personId) return

        if (new_c.passengers.includes(personId)) {
            new_c.passengers = new_c.passengers.filter(x => x !== personId)
        } else {
            if (new_c.passengers.length >= new_c.capacity) {
                alert("Car full!")
                return
            }
            new_c.passengers.push(personId)
        }
        setCars(cars.map(x => x.id === carId ? new_c : x))
    }

    return (
        <div>

            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <select
                        value={driver}
                        onChange={e => setDriver(e.target.value)}
                        style={{ flex: 1 }}
                    >
                        <option value="">Select Driver...</option>
                        {people.filter(p => !cars.some(c => c.driver == p.id || c.passengers.includes(p.id))).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <input type="number" value={cap} onChange={e => setCap(e.target.value)} placeholder="4" style={{ width: '60px' }} />
                </div>
                <button onClick={add_car} style={{ width: '100%', background: '#238636', borderColor: 'rgba(240,246,252,0.1)', color: '#fff' }}>Add</button>
            </div>

            <div>
                {cars.map(c => {
                    const dr_name = people.find(p => p.id == c.driver)?.name || "Unknown"
                    return (
                        <div key={c.id} style={{
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
                                <strong style={{ fontSize: '14px' }}>🚗 {dr_name}'s Car</strong>
                                <span style={{ fontSize: '12px', background: c.passengers.length >= c.capacity ? '#f85149' : '#30363d', color: '#f0f6fc', padding: '2px 8px', borderRadius: '10px' }}>
                                    {c.passengers.length} / {c.capacity}
                                </span>
                            </div>

                            <div style={{ background: '#0d1117' }}>
                                {people.map(p => {
                                    if (p.id == c.driver) return null

                                    const in_other_car = cars.some(oc => oc.id !== c.id && (oc.driver == p.id || oc.passengers.includes(p.id)))
                                    if (in_other_car) return null

                                    const in_here = c.passengers.includes(p.id)

                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => toggle_pass(c.id, p.id)}
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
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )
}

export default Cars
