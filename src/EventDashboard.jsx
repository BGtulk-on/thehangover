import { useState, useEffect } from 'react'
import { LayoutDashboard, FileText, Users, DollarSign, Bed, Car, ArrowLeft, Share2 } from 'lucide-react'

import EventName from './EventName'
import PeopleList from './PeopleList'
import PlaceDate from './PlaceDate'
import Money from './Money'
import Rooms from './Rooms'
import Cars from './Cars'


const EventDashboard = ({ initialData, onSave, onBack, eventId, publicMode }) => {
    const [data, setData] = useState(initialData || {
        name: 'Event Name...',
        people: [],
        place: '',
        mapLink: '',
        dateStart: '',
        dateEnd: '',
        baseAmount: 0,
        paidList: [],
        expenses: [],
        rooms: [],
        cars: []
    })

    const [activeTab, setActiveTab] = useState('dash')
    const [prog, setProg] = useState(0)
    const [clickAnim, setClickAnim] = useState(null)
    const [showDetails, setShowDetails] = useState(false)

    const handleTabClick = (id) => {
        setActiveTab(id)
        setClickAnim(id)
        setTimeout(() => setClickAnim(null), 400)
    }

    const handleShare = () => {
        const link = `${window.location.origin}/?shareId=${eventId}`
        navigator.clipboard.writeText(link)
        alert("Link copied!")
    }

    const tabs = [
        { id: 'dash', icon: LayoutDashboard },
        { id: 'details', icon: FileText },
        { id: 'people', icon: Users },
        { id: 'money', icon: DollarSign },
        { id: 'rooms', icon: Bed },
        { id: 'cars', icon: Car },
    ]

    useEffect(() => {
        let temp = 0
        if (data.name) temp += 10
        if (data.people.length > 0) temp += 20
        if (data.place) temp += 10
        if (data.mapLink) temp += 5
        if (data.dateStart && data.dateEnd) temp += 10
        if (data.baseAmount > 0) temp += 10
        if (data.people.length > 0 && data.paidList.length === data.people.length) temp += 10
        if (data.rooms.length > 0 || data.cars.length > 0) temp += 25
        if (temp > 100) temp = 100
        setProg(temp)

        if (onSave && !publicMode) onSave(data)

    }, [data])


    const updateData = (field, val) => {
        if (publicMode) return // Read only
        setData(prev => ({ ...prev, [field]: val }))
    }

    const renderContent = () => {
        // Force dash view if public
        const currentTab = publicMode ? 'dash' : activeTab

        if (currentTab === 'dash') {
            const totalExpenses = data.expenses.reduce((acc, curr) => acc + curr.amount, 0)
            return (
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h1 style={{ marginBottom: '5px', fontSize: '24px' }}>{data.name || "Unnamed Event"}</h1>
                        <div style={{ color: '#8b949e', fontSize: '14px' }}>
                            <span style={{ color: '#c9d1d9' }}>📍 {data.place || "No location"}</span>
                            <span style={{ margin: '0 10px' }}>•</span>
                            <span>📅 {data.dateStart || "?"} - {data.dateEnd || "?"}</span>
                        </div>
                        {data.mapLink && (
                            <a href={data.mapLink} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '5px', color: '#58a6ff', fontSize: '13px' }}>
                                View on Map
                            </a>
                        )}
                    </div>

                    <div className="dashboard-grid">
                        {/* People*/}
                        <div style={{ background: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '5px', fontWeight: 600 }}>PEOPLE</div>
                            <div style={{ fontSize: '24px', fontWeight: 600 }}>{data.people.length}</div>
                            <div style={{ fontSize: '13px', color: '#3fb950' }}>Going</div>
                        </div>

                        {/* Money */}
                        <div style={{ background: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '5px', fontWeight: 600 }}>MONEY</div>
                            <div style={{ fontSize: '24px', fontWeight: 600 }}>€{data.baseAmount}</div>
                            <div style={{ fontSize: '13px', color: '#8b949e' }}>
                                Base / person <br />
                                <span style={{ color: '#f85149' }}>+€{totalExpenses} extras</span>
                            </div>
                        </div>

                        {/* Rooms */}
                        <div style={{ background: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '5px', fontWeight: 600 }}>ROOMS</div>
                            <div style={{ fontSize: '24px', fontWeight: 600 }}>{data.rooms.length}</div>
                            <div style={{ fontSize: '13px', color: '#8b949e' }}>
                                {data.rooms.reduce((acc, r) => acc + r.occupants.length, 0)}/{data.rooms.reduce((acc, r) => acc + r.capacity, 0)} filled
                            </div>
                        </div>

                        {/* Cars */}
                        <div style={{ background: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '5px', fontWeight: 600 }}>CARS</div>
                            <div style={{ fontSize: '24px', fontWeight: 600 }}>{data.cars.length}</div>
                            <div style={{ fontSize: '13px', color: '#8b949e' }}>
                                {data.cars.reduce((acc, c) => acc + c.passengers.length, 0)}/{data.cars.reduce((acc, c) => acc + c.capacity, 0)} seats
                            </div>
                        </div>
                    </div>

                    {/* Payments */}
                    <div style={{ marginTop: '15px', background: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d' }}>
                        <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '10px', fontWeight: 600 }}>PAYMENTS COLLECTED</div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {data.people.map(p => (
                                <div key={p.id} style={{
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                    background: data.paidList.includes(p.id) ? 'rgba(56,139,253,0.15)' : 'rgba(248,81,73,0.1)',
                                    color: data.paidList.includes(p.id) ? '#58a6ff' : '#f85149',
                                    borderRadius: '20px',
                                    border: `1px solid ${data.paidList.includes(p.id) ? 'rgba(56,139,253,0.4)' : 'rgba(248,81,73,0.4)'}`,
                                    textDecoration: data.paidList.includes(p.id) ? 'line-through' : 'none'
                                }}>
                                    {p.name}
                                </div>
                            ))}
                            {data.people.length === 0 && <span style={{ color: '#8b949e', fontSize: '13px' }}>No people yet</span>}
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            style={{ fontSize: '12px', background: 'transparent', border: 'none', color: '#58a6ff', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            {showDetails ? 'Hide Info' : 'Extend Info'}
                        </button>
                    </div>

                    <div className={`expand-content ${showDetails ? 'open' : ''}`} style={{ textAlign: 'left' }}>

                        {/* Rooms */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '14px', borderBottom: '1px solid #30363d', paddingBottom: '5px' }}>Room Assignments</h3>
                            {data.rooms.length === 0 && <div style={{ fontSize: '13px', color: '#8b949e' }}>No rooms.</div>}
                            {data.rooms.map(r => (
                                <div key={r.id} style={{ marginBottom: '10px', fontSize: '13px' }}>
                                    <div style={{ fontWeight: 600, color: '#c9d1d9' }}>{r.name} ({r.occupants.length}/{r.capacity})</div>
                                    <div style={{ color: '#8b949e', paddingLeft: '10px' }}>
                                        {r.occupants.length === 0 ? 'Empty' : r.occupants.map(oid => {
                                            const p = data.people.find(x => x.id === oid)
                                            return p ? p.name : '?'
                                        }).join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cars */}
                        <div>
                            <h3 style={{ fontSize: '14px', borderBottom: '1px solid #30363d', paddingBottom: '5px' }}>Car Assignments</h3>
                            {data.cars.length === 0 && <div style={{ fontSize: '13px', color: '#8b949e' }}>No cars.</div>}
                            {data.cars.map(c => {
                                const driver = data.people.find(p => p.id == c.driver)
                                return (
                                    <div key={c.id} style={{ marginBottom: '10px', fontSize: '13px' }}>
                                        <div style={{ fontWeight: 600, color: '#c9d1d9' }}>{driver ? driver.name : 'Unknown'}'s Car ({c.passengers.length}/{c.capacity})</div>
                                        <div style={{ color: '#8b949e', paddingLeft: '10px' }}>
                                            {c.passengers.length === 0 ? 'No passengers' : c.passengers.map(pid => {
                                                const p = data.people.find(x => x.id === pid)
                                                return p ? p.name : '?'
                                            }).join(', ')}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                    </div>

                </div>
            )
        } else if (publicMode) {
            return null
        }

        switch (currentTab) {
            case 'details':
                return (
                    <div>
                        <EventName val={data.name} setVal={(v) => updateData('name', v)} />
                        <PlaceDate
                            place={data.place}
                            dateStart={data.dateStart}
                            dateEnd={data.dateEnd}
                            mapLink={data.mapLink}
                            setPlace={(v) => updateData('place', v)}
                            setMapLink={(v) => updateData('mapLink', v)}
                            setDateStart={(v) => updateData('dateStart', v)}
                            setDateEnd={(v) => updateData('dateEnd', v)}
                        />
                    </div>
                )
            case 'people':
                return <PeopleList list={data.people} setList={(v) => updateData('people', v)} />
            case 'money':
                return <Money
                    expenses={data.expenses}
                    setExpenses={(v) => updateData('expenses', v)}
                    people={data.people}
                    baseAmount={data.baseAmount}
                    setBaseAmount={(v) => updateData('baseAmount', v)}
                    paidList={data.paidList}
                    setPaidList={(v) => updateData('paidList', v)}
                />
            case 'rooms':
                return <Rooms rooms={data.rooms} setRooms={(v) => updateData('rooms', v)} people={data.people} />
            case 'cars':
                return <Cars cars={data.cars} setCars={(v) => updateData('cars', v)} people={data.people} />
            default:
                return <div>Select a tab</div>
        }
    }

    return (
        <div style={{ paddingBottom: publicMode ? '20px' : '80px', textAlign: 'center' }}>


            {!publicMode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px', borderBottom: '1px solid #30363d' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{data.name}</div>
                    </div>
                    <button onClick={handleShare} style={{ background: 'transparent', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '12px' }}>
                        <Share2 size={14} /> Share
                    </button>
                </div>
            )}

            <div key={publicMode ? 'public' : activeTab} className="gh-box drop-in" style={publicMode ? { marginTop: '20px' } : {}}>
                {!publicMode && <h3 style={{ borderBottom: '1px solid #21262d', paddingBottom: '10px', marginTop: 0 }}>
                    {activeTab.toUpperCase()}
                </h3>}

                <div style={{ marginBottom: '15px', color: '#8b949e', fontSize: '14px' }}>
                    {prog}% complete
                    <div style={{ height: '8px', width: '100%', background: '#30363d', borderRadius: '4px', marginTop: '5px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prog}%`, background: '#238636', transition: 'width 0.4s ease-in-out' }}></div>
                    </div>
                </div>

                {renderContent()}
            </div>

            {!publicMode && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    background: '#161b22',
                    borderTop: '1px solid #30363d',
                    display: 'flex',
                    justifyContent: 'space-evenly', // Changed from center to space-evenly
                    gap: '5px', // Reduced gap for mobile
                    padding: '10px 5px' // Reduced padding
                }}>

                    {tabs.map((t, i) => {
                        const tilt = (i - 2.5) * 10
                        return (
                            <button
                                key={t.id}
                                onClick={() => handleTabClick(t.id)}
                                className={clickAnim === t.id ? 'bouncy-click' : ''}
                                style={{
                                    width: '50px', height: '50px', borderRadius: '6px',
                                    border: activeTab === t.id ? '1px solid #8b949e' : '1px solid rgba(240, 246, 252, 0.1)',
                                    background: activeTab === t.id ? '#30363d' : '#21262d',
                                    color: activeTab === t.id ? '#f0f6fc' : '#8b949e',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
                                    '--tilt': `${tilt}deg`
                                }}
                            >
                                <t.icon size={20} />
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default EventDashboard
