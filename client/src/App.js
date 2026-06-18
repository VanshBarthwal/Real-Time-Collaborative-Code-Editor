import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import './App.css';

const AVATAR_COLORS = [
  { bg: '#4F46E5', text: '#EEF2FF' },
  { bg: '#0891B2', text: '#E0F7FA' },
  { bg: '#059669', text: '#ECFDF5' },
  { bg: '#D97706', text: '#FFFBEB' },
  { bg: '#DC2626', text: '#FEF2F2' },
  { bg: '#7C3AED', text: '#F5F3FF' },
  { bg: '#DB2777', text: '#FDF2F8' },
  { bg: '#0284C7', text: '#E0F2FE' },
];

const getAvatarColor = (name) => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (name) => {
  return name.trim().slice(0, 2).toUpperCase();
};

function App() {
  const [code, setCode] = useState('// Welcome to CodeSync\n// Start typing to collaborate in real time...\n');
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [joined, setJoined] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    socketRef.current.on('code-update', (newCode) => setCode(newCode));
    socketRef.current.on('language-update', (newLanguage) => setLanguage(newLanguage));
    socketRef.current.on('user-list', (updatedUsers) => setUsers(updatedUsers));
    return () => { socketRef.current.disconnect(); };
  }, []);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socketRef.current) {
      socketRef.current.emit('code-change', { roomId, code: newCode });
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim() && userName.trim()) {
      socketRef.current.emit('join-room', { roomId, userName });
      setJoined(true);
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socketRef.current.emit('language-change', { roomId, language: newLanguage });
  };

  const handleLeaveRoom = () => {
    socketRef.current.disconnect();
    setJoined(false);
    setUsers([]);
    setCode('// Welcome to CodeSync\n// Start typing to collaborate in real time...\n');
    socketRef.current = io('http://localhost:5000');
    socketRef.current.on('code-update', (c) => setCode(c));
    socketRef.current.on('language-update', (l) => setLanguage(l));
    socketRef.current.on('user-list', (u) => setUsers(u));
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app">
      {!joined ? (

        // ── JOIN SCREEN ──────────────────────────────────
        <div className="join-screen">
          <div className="join-card">

            <div className="brand">
              
              <span className="brand-name">CodeSync</span>
            </div>

            <p className="join-tagline">
              Real-time collaborative coding.
            </p>

            <div className="join-fields">
              <div className="field-group">
                <label className="field-label">YOUR NAME</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. Rahul"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  autoFocus
                />
              </div>

              <div className="field-group">
                <label className="field-label">ROOM ID</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. room123"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              <button
                className="join-btn"
                onClick={handleJoinRoom}
                disabled={!roomId.trim() || !userName.trim()}
              >
                Join Room →
              </button>
            </div>

            <p className="join-hint">
              Share the Room ID with teammates to collaborate instantly.
            </p>
          </div>
        </div>

      ) : (

        // ── EDITOR SCREEN ────────────────────────────────
        <div className="editor-screen">

          {/* ── HEADER ── */}
          <header className="header">
            <div className="header-left">
              
              <span className="brand-name small">CodeSync</span>
            </div>

            <div className="header-center">
              <div className="room-pill">
                <span className="room-label">ROOM</span>
                <span className="room-id">{roomId}</span>
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyRoomId}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="header-right">
              <select
                className="lang-select"
                value={language}
                onChange={handleLanguageChange}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>

              <button className="leave-btn" onClick={handleLeaveRoom}>
                Leave
              </button>
            </div>
          </header>

          {/* ── MAIN ── */}
          <div className="main">

            {/* ── USERS PANEL ── */}
            <aside className="users-panel">
              <p className="panel-title">COLLABORATORS</p>
              <ul className="users-list">
                {users.map((user) => {
                  const colors = getAvatarColor(user.name);
                  const isYou = user.name === userName;
                  return (
                    <li key={user.id} className="user-item">
                      <div
                        className="avatar"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div className="user-info">
                        <span className="user-name">
                          {user.name}
                          {isYou && <span className="you-tag">you</span>}
                        </span>
                        <span className="user-status">
                          <span className="online-dot" />
                          online
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="panel-footer">
                <span className="user-count">{users.length} online</span>
              </div>
            </aside>

            {/* ── EDITOR ── */}
            <div className="editor-wrap">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 15,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  automaticLayout: true,
                  lineHeight: 24,
                  padding: { top: 20, bottom: 20 },
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'gutter',
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  tabSize: 2,
                }}
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;