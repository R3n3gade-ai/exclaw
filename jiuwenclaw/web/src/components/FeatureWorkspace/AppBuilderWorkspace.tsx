import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { webRequest } from '../../services/webClient';
import './AppBuilderWorkspace.css';


export function AppBuilderWorkspace({ onExit }: { onExit: () => void }) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [fileContent, setFileContent] = useState<string>('<!-- Loading... -->');
  const [chatInput, setChatInput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Poll workspace files
  const loadFiles = useCallback(async () => {
    try {
      const res = await webRequest<{ files: string[] }>('app_builder.workspace.list');
      if (res && res.files) {
        setFiles(res.files);
        if (!res.files.includes(activeFile) && res.files.length > 0) {
          setActiveFile(res.files[0]);
        }
      }
    } catch (e) {
      console.error('Failed to list files:', e);
    }
  }, [activeFile]);

  // Load active file content
  const loadFileContent = useCallback(async (path: string) => {
    try {
      const res = await webRequest<{ content: string }>('app_builder.workspace.read', { path });
      if (res && res.content !== undefined) {
        setFileContent(res.content);
      }
    } catch (e) {
      console.error('Failed to read file:', e);
      setFileContent('');
    }
  }, []);

  useEffect(() => {
    void loadFiles();
    const interval = setInterval(() => void loadFiles(), 5000); // refresh file list periodically
    return () => clearInterval(interval);
  }, [loadFiles]);

  useEffect(() => {
    if (activeFile) {
      void loadFileContent(activeFile);
    }
  }, [activeFile, loadFileContent]);

  const handleEditorChange = (value: string | undefined) => {
    setFileContent(value || '');
  };

  const handleSave = async () => {
    try {
      await webRequest('app_builder.workspace.write', { path: activeFile, content: fileContent });
      // Reload iframe if we are in preview
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    } catch (e) {
      console.error('Failed to save file:', e);
    }
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    return 'html';
  };

  // Chat integration mock - we will wire it up properly later
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatInput('');
    // TODO: Send to pi_builder agent
    alert("Chat wiring pending - message: " + chatInput);
  };
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
            <input 
              type="text" 
              placeholder="Describe the app or feature..." 
              className="chat-input" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            />
            <button className="send-btn" onClick={handleSendMessage}>
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
              <iframe 
                ref={iframeRef}
                src={`/preview-api/index.html?t=${Date.now()}`}
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
                title="App Preview"
              />
            </div>
          ) : (
            <div className="code-pane">
              <div className="file-tree">
                <div className="file-tree-title">Files</div>
                <ul>
                  {files.map(f => (
                    <li 
                      key={f} 
                      className={activeFile === f ? 'active' : ''}
                      onClick={() => setActiveFile(f)}
                    >
                      {f}
                    </li>
                  ))}
                  {files.length === 0 && <li className="text-muted text-xs p-3">No files</li>}
                </ul>
              </div>
              <div className="editor-container">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-2 bg-secondary border-b border-border">
                    <span className="text-xs font-mono">{activeFile}</span>
                    <button className="btn primary text-xs py-1 px-3" onClick={handleSave}>Save File</button>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language={getLanguage(activeFile)}
                      theme="vs-dark"
                      value={fileContent}
                      onChange={handleEditorChange}
                      options={{ minimap: { enabled: false }, fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
