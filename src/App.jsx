import { useState, useEffect } from 'react'
import Login from './Login'
import EventList from './EventList'
import EventDashboard from './EventDashboard'

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '/api'

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
      fetchEvents(u)
    }
  }, [])

  const fetchEvents = (userObj) => {
    fetch(`${API_URL}/events?userId=${userObj.id}`, {
      headers: { 'Authorization': `Bearer ${userObj.token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          handleLogout()
          throw new Error('Unauthorized')
        }
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data)
        } else {
          console.error("Expected array but got:", data)
          setEvents([])
        }
        setView('list')
      })
      .catch(err => {
        console.error("Failed to fetch events", err)
      })
  }

  const handleLogin = (username, password, setErrorMsg) => {
    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to login')
        return data
      })
      .then(u => {
        setUser(u)
        localStorage.setItem('hangover_user', JSON.stringify(u))
        fetchEvents(u)
      })
      .catch(err => {
        if (setErrorMsg) setErrorMsg(err.message)
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify(newEvent)
    })
      .then(res => res.json())
      .then(({ id }) => {
        fetchEvents(user)
      })
  }

  const handleDeleteEvent = (id) => {
    if (!user) return
    fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(() => fetchEvents(user))
      .catch(err => console.error("Failed to delete event", err))
  }

  const handleSaveEvent = (data) => {
    if (!currentEvent || !user) return

    setCurrentEvent({ ...currentEvent, data, name: data.name })

    fetch(`${API_URL}/events/${currentEvent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify({ name: data.name, data })
    })
      .catch(err => console.error("Failed to save event", err))
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
          fetchEvents(user)
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
