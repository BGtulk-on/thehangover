
const EventName = ({ val, setVal }) => {
    return (
        <div style={{ marginBottom: '24px' }}>
            <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '14px'
            }}>Event Name</label>

            <input
                type="text"
                className="form-control"
                placeholder="e.g. Sea 2024"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                style={{ width: '100%' }}
            />
        </div>
    )
}

export default EventName
