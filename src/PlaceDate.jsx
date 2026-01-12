
const PlaceDate = ({ place, dateStart, dateEnd, setPlace, setDateStart, setDateEnd, mapLink, setMapLink }) => {
    return (
        <div style={{ borderTop: '1px solid #30363d', paddingTop: '20px', marginTop: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Where & When
            </h3>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    Location
                </label>
                <input
                    value={place}
                    onChange={e => setPlace(e.target.value)}
                    placeholder='Villa, Hotel, etc...'
                    style={{ width: '100%', marginBottom: '10px' }}
                />
                <input
                    value={mapLink}
                    onChange={e => setMapLink(e.target.value)}
                    placeholder='Google Maps Link...'
                    style={{ width: '100%', fontSize: '13px', padding: '4px 8px', color: '#8b949e', borderColor: '#30363d' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>

                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                        From
                    </label>
                    <input
                        type="date"
                        value={dateStart}
                        style={{ width: '100%', fontFamily: 'inherit' }}
                        onChange={e => setDateStart(e.target.value)}
                    />
                </div>

                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                        To
                    </label>
                    <input
                        type="date"
                        value={dateEnd}
                        style={{ width: '100%', fontFamily: 'inherit' }}
                        onChange={e => setDateEnd(e.target.value)}
                    />
                </div>

            </div>
        </div>
    )
}

export default PlaceDate
