import { useState } from 'react';
import './AppBuilderWorkspace.css';

export function AppBuilderWorkspace({ onExit }: { onExit: () => void }) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  return (
    <div className="app-builder-workspace">
      <div className="app-builder-sidebar">
        <div className="app-builder-sidebar-header">
          <h3>App Builder Assistant</h3>
          <span className="agent-badge">Pi Agent</span>
        </div>
        <div className="app-builder-chat">
          <div className="chat-messages">
            <div className="message assistant">
              Hello! I am Pi, your App Builder assistant. What are we building today?
            </div>
          </div>
          <div className="chat-input-area">
            <input type="text" placeholder="Describe the app or feature..." className="chat-input" />
            <button className="send-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="app-builder-main">
        <div className="app-builder-tabs">
          <button 
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
          <div className="flex-1"></div>
          <button className="exit-btn" onClick={onExit}>Close</button>
        </div>

        <div className="app-builder-content">
          {activeTab === 'preview' ? (
            <div className="preview-pane">
              <div className="preview-placeholder">
                <p>App Preview will appear here</p>
                <span className="preview-subtitle">Ask Pi to start building</span>
              </div>
            </div>
          ) : (
            <div className="code-pane">
              <div className="file-tree">
                <div className="file-tree-title">Files</div>
                <ul>
                  <li className="active">index.html</li>
                  <li>styles.css</li>
                  <li>app.js</li>
                </ul>
              </div>
              <div className="editor-container">
                <div className="editor-placeholder">
                  {/* Monaco Editor will go here */}
                  <pre><code>{`<!DOCTYPE html>
<html>
<head>
  <title>New App</title>
</head>
<body>
  <h1>Welcome to your new app!</h1>
</body>
</html>`}</code></pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
