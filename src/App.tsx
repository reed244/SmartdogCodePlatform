import React, { useState } from 'react';
import './App.css';
import ScratchEditor from './components/ScratchEditor';
import DogControlPanel from './components/DogControlPanel';
import CodeOutput from './components/CodeOutput';
import CustomBlockManager from './components/CustomBlockManager';
import DebugPanel from './components/DebugPanel';
import CodeAssistant from './components/CodeAssistant';
import FileManager from './components/FileManager';
import { WorkspaceData } from './services/dataService';

function App() {
  const [showCustomBlocks, setShowCustomBlocks] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showCodeAssistant, setShowCodeAssistant] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);

  const handleDataLoaded = (data: WorkspaceData) => {
    setWorkspaceData(data);
    console.log('工作区数据已加载');
  };

  const handleDataUpdated = (data: WorkspaceData) => {
    setWorkspaceData(data);
    console.log('工作区数据已更新');
  };

  // 获取工作区统计信息
  const getWorkspaceStats = () => {
    if (!workspaceData) {
      return null;
    }
    
    const { workspace, customBlocks } = workspaceData;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(workspace.xml || '<xml></xml>', 'text/xml');
    const blocks = xmlDoc.getElementsByTagName('block');
    
    return {
      blockCount: blocks.length,
      variableCount: workspace.variables.length,
      functionCount: workspace.functions.length,
      customBlockCount: customBlocks.length
    };
  };

  const workspaceStats = getWorkspaceStats();

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <div className="header-title">
            <h1>Smart Dog Scratch编程平台</h1>
            <p>通过Scratch积木块编程控制智能小狗</p>
          </div>
          <div className="header-controls">
            <FileManager 
              onDataLoaded={handleDataLoaded}
              onDataUpdated={handleDataUpdated}
            />
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
          </div>
        </div>
        
        <div className="current-project-info">
          <span className="project-name-badge">📁 Smart Dog 工作区</span>
          <span className="project-version">v1.0.0</span>
          {workspaceStats && (
            <span className="project-stats">
              积木块: {workspaceStats.blockCount} | 
              自定义积木块: {workspaceStats.customBlockCount}
            </span>
          )}
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
        <div className="footer-project-info">
          <span>专注于工作区数据和自定义积木块管理</span>
          <span>数据自动保存到浏览器本地存储</span>
          {workspaceStats && (
            <span>当前: {workspaceStats.blockCount}个积木块, {workspaceStats.customBlockCount}个自定义积木块</span>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;