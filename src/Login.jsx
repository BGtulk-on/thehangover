import { useState } from 'react'

const Login = ({ onLogin }) => {
    const [user, setUser] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!user.trim()) return
        onLogin(user)
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="gh-box drop-in" style={{ width: '300px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '20px' }}>Login</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        value={user}
                        onChange={e => setUser(e.target.value)}
                        placeholder="Username"
                        style={{ width: '100%', marginBottom: '15px' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        style={{ width: '100%', marginBottom: '15px' }}
                    />

                    <button type="submit" style={{ width: '100%', background: '#238636', color: '#fff', border: '1px solid rgba(240,246,252,0.1)' }}>
                        Enter
                    </button>

                    <div style={{ marginTop: '15px', borderTop: '1px solid #30363d', paddingTop: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#8b949e' }}>Don't have an account?</span>
                        <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '5px' }}>
                            Just type your username and hit enter. <br /> We'll create one for you.
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login
