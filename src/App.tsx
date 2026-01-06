import React, { useState } from 'react';
import './App.css';
import ScratchEditor from './components/ScratchEditor';
import DogControlPanel from './components/DogControlPanel';
import CodeOutput from './components/CodeOutput';
import CustomBlockManager from './components/CustomBlockManager';
import DebugPanel from './components/DebugPanel';
import CodeAssistant from './components/CodeAssistant';

function App() {
  const [showCustomBlocks, setShowCustomBlocks] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showCodeAssistant, setShowCodeAssistant] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Smart Dog Scratch编程平台</h1>
        <p>通过Scratch积木块编程控制智能小狗</p>
        <div className="header-actions">
          <button 
            onClick={() => setShowCustomBlocks(!showCustomBlocks)}
            className="toggle-custom-blocks"
          >
            {showCustomBlocks ? '隐藏自定义积木块' : '管理自定义积木块'}
          </button>
          <button 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="toggle-debug-panel"
          >
            {showDebugPanel ? '隐藏调试工具' : '显示调试工具'}
          </button>
          <button 
            onClick={() => setShowCodeAssistant(!showCodeAssistant)}
            className="toggle-code-assistant"
          >
            {showCodeAssistant ? '隐藏代码助手' : '显示代码助手'}
          </button>
        </div>
      </header>
      
      {showCustomBlocks && (
        <div className="custom-blocks-section">
          <CustomBlockManager />
        </div>
      )}
      
      {showDebugPanel && (
        <div className="debug-section">
          <DebugPanel />
        </div>
      )}
      
      {showCodeAssistant && (
        <div className="code-assistant-section">
          <CodeAssistant />
        </div>
      )}
      
      <main className="App-main">
        <div className="editor-section">
          <ScratchEditor />
        </div>
        <div className="control-section">
          <DogControlPanel />
          <CodeOutput />
        </div>
      </main>
      <footer className="App-footer">
        <p>Smart Dog Project - 基于Scratch的可视化编程平台</p>
      </footer>
    </div>
  );
}

export default App;
