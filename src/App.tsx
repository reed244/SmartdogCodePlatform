import React from 'react';
import './App.css';
import ScratchEditor from './components/ScratchEditor';
import DogControlPanel from './components/DogControlPanel';
import CodeOutput from './components/CodeOutput';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Smart Dog Scratch编程平台</h1>
        <p>通过Scratch积木块编程控制智能小狗</p>
      </header>
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
