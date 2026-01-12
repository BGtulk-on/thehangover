import { Trash2 } from 'lucide-react'

const EventList = ({ events, onSelect, onDelete, onCreate, username, onLogout }) => {
    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3>{username}'s Events</h3>
                <button onClick={onLogout} style={{ fontSize: '12px', background: 'transparent', border: 'none', color: '#f85149' }}>Logout</button>
            </div>

            <div className="gh-box drop-in">
                {events.length === 0 && <div style={{ color: '#8b949e', textAlign: 'center' }}>No events found.</div>}

                {events.map(ev => (
                    <div key={ev.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #30363d'
                    }}>
                        <button
                            onClick={() => onSelect(ev)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#c9d1d9',
                                fontSize: '16px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                flex: 1
                            }}
                        >
                            {ev.name || "Unnamed Event"}
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(ev.id); }}
                            style={{ background: 'transparent', border: 'none', color: '#f85149' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={onCreate}
                    style={{
                        marginTop: '20px',
                        width: '100%',
                        background: '#238636',
                        color: '#fff',
                        padding: '8px'
                    }}
                >
                    + New Event
                </button>
            </div>
        </div>
    )
}

export default EventList
