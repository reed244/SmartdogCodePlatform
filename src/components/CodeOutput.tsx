import React, { useState, useEffect } from 'react';
import './CodeOutput.css';

const CodeOutput: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [outputLog, setOutputLog] = useState<string[]>([
    '欢迎使用Smart Dog Scratch编程平台',
    '拖拽积木块到工作区创建程序',
    '点击"生成代码"按钮查看生成的JavaScript代码'
  ]);
  const [activeTab, setActiveTab] = useState<'code' | 'log'>('code');

  // 监听代码生成事件
  useEffect(() => {
    const handleCodeGenerated = (event: any) => {
      const code = event.detail.code;
      setGeneratedCode(code);
      setOutputLog(prev => [...prev, `代码生成时间: ${new Date().toLocaleTimeString()}`, '生成的代码:', code]);
      setActiveTab('code');
    };

    const handleGenerateCode = () => {
      // 触发代码生成事件
      const event = new CustomEvent('generateCode');
      window.dispatchEvent(event);
    };

    window.addEventListener('codeGenerated', handleCodeGenerated);
    window.addEventListener('generateCode', handleGenerateCode);

    return () => {
      window.removeEventListener('codeGenerated', handleCodeGenerated);
      window.removeEventListener('generateCode', handleGenerateCode);
    };
  }, []);

  const clearOutput = () => {
    setOutputLog(['输出日志已清空']);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode)
      .then(() => {
        setOutputLog(prev => [...prev, '代码已复制到剪贴板']);
      })
      .catch(err => {
        setOutputLog(prev => [...prev, `复制失败: ${err.message}`]);
      });
  };

  const formatCode = (code: string): string => {
    // 简单的代码格式化
    let formatted = code;
    formatted = formatted.replace(/;/g, ';\n');
    formatted = formatted.replace(/{/g, ' {\n');
    formatted = formatted.replace(/}/g, '\n}');
    
    // 添加缩进
    let indentLevel = 0;
    const lines = formatted.split('\n');
    const formattedLines = lines.map(line => {
      line = line.trim();
      if (line.endsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indentedLine = '  '.repeat(indentLevel) + line;
      
      if (line.endsWith('{')) {
        indentLevel++;
      }
      
      return indentedLine;
    });
    
    return formattedLines.join('\n');
  };

  const simulateExecution = () => {
    if (!generatedCode) {
      setOutputLog(prev => [...prev, '错误: 没有可执行的代码']);
      return;
    }

    setOutputLog(prev => [...prev, '开始模拟执行程序...', '---']);
    
    // 解析代码并模拟执行
    const lines = generatedCode.split('\n');
    lines.forEach((line, index) => {
      if (line.trim()) {
        setTimeout(() => {
          setOutputLog(prev => [...prev, `执行: ${line.trim()}`]);
        }, index * 500);
      }
    });

    setTimeout(() => {
      setOutputLog(prev => [...prev, '---', '程序执行完成']);
    }, lines.length * 500);
  };

  return (
    <div className="code-output">
      <h2>代码输出</h2>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          生成的代码
        </button>
        <button 
          className={`tab-button ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          输出日志
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'code' ? (
          <div className="code-section">
            <div className="code-toolbar">
              <button onClick={copyCode} disabled={!generatedCode}>
                复制代码
              </button>
              <button onClick={simulateExecution} disabled={!generatedCode}>
                模拟执行
              </button>
            </div>
            <pre className="code-display">
              {generatedCode ? formatCode(generatedCode) : '// 生成的代码将显示在这里\n// 请先在Scratch编辑器中创建程序并点击"生成代码"'}
            </pre>
            <div className="code-info">
              <p>生成的代码基于Blockly JavaScript生成器</p>
              <p>代码可以直接在支持JavaScript的环境中运行</p>
            </div>
          </div>
        ) : (
          <div className="log-section">
            <div className="log-toolbar">
              <button onClick={clearOutput}>
                清空日志
              </button>
            </div>
            <div className="log-display">
              {outputLog.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))}
            </div>
            <div className="log-info">
              <p>日志显示程序执行状态和调试信息</p>
            </div>
          </div>
        )}
      </div>

      <div className="api-info">
        <h3>小狗控制API参考</h3>
        <div className="api-list">
          <div className="api-item">
            <code>dog.moveForward(duration)</code>
            <span>前进指定秒数</span>
          </div>
          <div className="api-item">
            <code>dog.turn(angle)</code>
            <span>转向指定角度（度）</span>
          </div>
          <div className="api-item">
            <code>dog.bark()</code>
            <span>让小狗叫一声</span>
          </div>
          <div className="api-item">
            <code>sleep(milliseconds)</code>
            <span>等待指定毫秒数</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeOutput;