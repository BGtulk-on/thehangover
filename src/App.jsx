import { useState, useEffect } from 'react'
import Login from './Login'
import EventList from './EventList'
import EventDashboard from './EventDashboard'

const API_URL = 'http://localhost:3001'

function App() {
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('shareId') ? 'loading' : 'login'
  })
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  const [currentEvent, setCurrentEvent] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('shareId')

    if (shareId) {
      fetch(`${API_URL}/event/${shareId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error)
          setCurrentEvent(data)
          setView('public')
        })
        .catch(err => {
          console.error("Failed to fetch shared event", err)
          setView('login')
        })
      return
    }

    const savedUser = localStorage.getItem('hangover_user')
    if (savedUser) {
      const u = JSON.parse(savedUser)
      setUser(u)
      fetchEvents(u.id)
    }
  }, [])

  const fetchEvents = (userId) => {
    fetch(`${API_URL}/events?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setEvents(data)
        setView('list')
      })
      .catch(err => {
        console.error("Failed to fetch events", err)
      })
  }

  const handleLogin = (username) => {
    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })
      .then(res => res.json())
      .then(u => {
        setUser(u)
        localStorage.setItem('hangover_user', JSON.stringify(u))
        fetchEvents(u.id)
      })
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('hangover_user')
    setView('login')
    setCurrentEvent(null)
  }

  const handleCreateEvent = () => {
    const newEvent = {
      userId: user.id,
      name: 'New Event',
      data: {
        name: 'New Event',
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
      }
    }

    fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    })
      .then(res => res.json())
      .then(({ id }) => {
        fetchEvents(user.id)
      })
  }

  const handleDeleteEvent = (id) => {
    fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE'
    })
      .then(() => fetchEvents(user.id))
  }

  const handleSaveEvent = (data) => {
    if (!currentEvent) return

    setCurrentEvent({ ...currentEvent, data, name: data.name })

    fetch(`${API_URL}/events/${currentEvent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, data })
    })
  }

  const handleSelectEvent = (ev) => {
    setCurrentEvent(ev)
    setView('dashboard')
  }

  if (view === 'login') {
    return <Login onLogin={handleLogin} />
  }

  if (view === 'list') {
    return (
      <EventList
        username={user?.username}
        events={events}
        onSelect={handleSelectEvent}
        onDelete={handleDeleteEvent}
        onCreate={handleCreateEvent}
        onLogout={handleLogout}
      />
    )
  }

  if (view === 'dashboard' && currentEvent) {
    return (
      <EventDashboard
        key={currentEvent.id}
        eventId={currentEvent.id}
        initialData={currentEvent.data}
        onSave={handleSaveEvent}
        onBack={() => {
          fetchEvents(user.id)
          setView('list')
        }}
      />
    )
  }

  if (view === 'public' && currentEvent) {
    return (
      <EventDashboard
        key={currentEvent.id}
        initialData={currentEvent.data}
        publicMode={true}
      />
    )
  }

  return <div>Loading...</div>
}

export default App
