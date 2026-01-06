import React, { useState, useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import './CodeAssistant.css';

interface Suggestion {
  type: 'block' | 'variable' | 'function' | 'keyword';
  name: string;
  description: string;
  insertText: string;
}

interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  severity: 'high' | 'medium' | 'low';
}

const CodeAssistant: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [isChecking, setIsChecking] = useState(false);
  
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 获取当前工作区
  useEffect(() => {
    const getWorkspace = () => {
      const workspaces = Blockly.getMainWorkspace();
      if (workspaces) {
        workspaceRef.current = workspaces as Blockly.WorkspaceSvg;
        
        // 监听工作区变化
        workspaceRef.current.addChangeListener(handleWorkspaceChange);
      }
    };

    const timer = setTimeout(getWorkspace, 1000);
    return () => {
      clearTimeout(timer);
      if (workspaceRef.current) {
        workspaceRef.current.removeChangeListener(handleWorkspaceChange);
      }
    };
  }, []);

  // 处理工作区变化
  const handleWorkspaceChange = (event: any) => {
    if (event.type === Blockly.Events.BLOCK_CHANGE || 
        event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_DELETE ||
        event.type === Blockly.Events.BLOCK_MOVE) {
      
      // 延迟检查，避免频繁触发
      setTimeout(() => {
        analyzeCode();
        updateSuggestions();
      }, 300);
    }
  };

  // 分析代码
  const analyzeCode = () => {
    if (!workspaceRef.current) return;

    setIsChecking(true);
    
    try {
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      setCurrentCode(code);
      
      const newIssues: CodeIssue[] = [];
      
      // 检查语法问题
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // 检查未闭合的括号
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        if (openParens > closeParens) {
          newIssues.push({
            type: 'error',
            message: '可能缺少闭合括号',
            line: lineNumber,
            column: line.indexOf('(') + 1,
            severity: 'high'
          });
        }
        
        // 检查未闭合的花括号
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          newIssues.push({
            type: 'error',
            message: '可能缺少闭合花括号',
            line: lineNumber,
            column: line.indexOf('{') + 1,
            severity: 'high'
          });
        }
        
        // 检查分号
        if (line.trim() && !line.trim().endsWith(';') && 
            !line.trim().endsWith('{') && !line.trim().endsWith('}') &&
            !line.includes('if') && !line.includes('for') && !line.includes('while') &&
            !line.includes('function')) {
          newIssues.push({
            type: 'warning',
            message: '建议在语句末尾添加分号',
            line: lineNumber,
            column: line.length,
            severity: 'medium'
          });
        }
        
        // 检查未使用的变量
        if (line.includes('let ') || line.includes('const ') || line.includes('var ')) {
          const varNameMatch = line.match(/(let|const|var)\s+(\w+)/);
          if (varNameMatch) {
            const varName = varNameMatch[2];
            const usedCount = code.split(varName).length - 2; // 减去定义的那一次
            if (usedCount <= 1) {
              newIssues.push({
                type: 'warning',
                message: `变量 \"${varName}\" 可能未被使用`,
                line: lineNumber,
                column: line.indexOf(varName) + 1,
                severity: 'low'
              });
            }
          }
        }
      });
      
      // 检查重复的块
      const allBlocks = workspaceRef.current.getAllBlocks(false);
      const blockTypes = new Map<string, number>();
      
      allBlocks.forEach(block => {
        const type = block.type;
        blockTypes.set(type, (blockTypes.get(type) || 0) + 1);
      });
      
      blockTypes.forEach((count, type) => {
        if (count > 5) {
          newIssues.push({
            type: 'info',
            message: `有 ${count} 个 \"${type}\" 类型的积木块，考虑使用循环`,
            line: 1,
            column: 1,
            severity: 'low'
          });
        }
      });
      
      setIssues(newIssues);
    } catch (error) {
      console.error('代码分析错误:', error);
      setIssues([{
        type: 'error',
        message: `代码分析失败: ${error}`,
        line: 1,
        column: 1,
        severity: 'high'
      }]);
    } finally {
      setIsChecking(false);
    }
  };

  // 更新建议
  const updateSuggestions = () => {
    if (!workspaceRef.current) return;

    const allBlocks = workspaceRef.current.getAllBlocks(false);
    const newSuggestions: Suggestion[] = [];
    
    // 获取所有变量
    const variables = new Set<string>();
    allBlocks.forEach(block => {
      if (block.type === 'variables_get' || block.type === 'variables_set') {
        const varName = block.getFieldValue('VAR');
        if (varName) {
          variables.add(varName);
        }
      }
    });
    
    // 添加变量建议
    variables.forEach(varName => {
      newSuggestions.push({
        type: 'variable',
        name: varName,
        description: `变量: ${varName}`,
        insertText: varName
      });
    });
    
    // 添加积木块建议
    const blockSuggestions = [
      { type: 'dog_move_forward', name: '前进', desc: '让小狗前进指定时间' },
      { type: 'dog_turn', name: '转向', desc: '让小狗转向指定角度' },
      { type: 'dog_bark', name: '叫一声', desc: '让小狗叫一声' },
      { type: 'dog_wait', name: '等待', desc: '等待指定时间' },
      { type: 'controls_if', name: '如果', desc: '条件判断' },
      { type: 'controls_repeat_ext', name: '重复', desc: '循环执行' },
      { type: 'math_arithmetic', name: '数学运算', desc: '加减乘除运算' },
      { type: 'text_join', name: '连接文本', desc: '连接多个文本' }
    ];
    
    blockSuggestions.forEach(block => {
      newSuggestions.push({
        type: 'block',
        name: block.name,
        description: block.desc,
        insertText: block.name
      });
    });
    
    // 添加关键字建议
    const keywordSuggestions = [
      { name: '如果', desc: '条件语句', insert: '如果...那么' },
      { name: '循环', desc: '循环语句', insert: '重复...次' },
      { name: '等待', desc: '延迟执行', insert: '等待...秒' },
      { name: '设置变量', desc: '变量赋值', insert: '设置...为' }
    ];
    
    keywordSuggestions.forEach(keyword => {
      newSuggestions.push({
        type: 'keyword',
        name: keyword.name,
        description: keyword.desc,
        insertText: keyword.insert
      });
    });
    
    setSuggestions(newSuggestions);
  };

  // 应用建议
  const applySuggestion = (suggestion: Suggestion) => {
    if (!workspaceRef.current) return;
    
    // 根据建议类型执行不同的操作
    switch (suggestion.type) {
      case 'block':
        // 创建新的积木块
        const block = workspaceRef.current.newBlock(suggestion.name);
        if (block) {
          block.initSvg();
          block.render();
          // 将块放在工作区中心
          const metrics = workspaceRef.current.getMetrics();
          block.moveBy(metrics.viewWidth / 2, metrics.viewHeight / 2);
        }
        break;
        
      case 'variable':
        // 创建变量获取块
        const varBlock = workspaceRef.current.newBlock('variables_get');
        if (varBlock) {
          varBlock.setFieldValue(suggestion.name, 'VAR');
          varBlock.initSvg();
          varBlock.render();
          const metrics = workspaceRef.current.getMetrics();
          varBlock.moveBy(metrics.viewWidth / 2, metrics.viewHeight / 2);
        }
        break;
        
      default:
        console.log('应用建议:', suggestion);
    }
    
    setShowSuggestions(false);
  };

  // 修复问题
  const fixIssue = (issue: CodeIssue) => {
    if (!workspaceRef.current) return;
    
    switch (issue.message) {
      case '建议在语句末尾添加分号':
        // 这里可以自动添加分号，但需要更复杂的代码分析
        alert('请手动在语句末尾添加分号');
        break;
        
      case '可能缺少闭合括号':
        alert('请检查并添加缺失的闭合括号');
        break;
        
      default:
        alert(`问题: ${issue.message}\\n请手动修复`);
    }
  };

  // 导出代码分析报告
  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      code: currentCode,
      issues: issues,
      suggestions: suggestions.slice(0, 10), // 只导出前10个建议
      summary: {
        totalIssues: issues.length,
        errors: issues.filter(i => i.type === 'error').length,
        warnings: issues.filter(i => i.type === 'warning').length,
        infos: issues.filter(i => i.type === 'info').length
      }
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `code_analysis_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="code-assistant">
      <div className="assistant-header">
        <h3>代码助手</h3>
        <div className="header-actions">
          <button 
            onClick={analyzeCode} 
            disabled={isChecking}
            className="analyze-btn"
          >
            {isChecking ? '分析中...' : '分析代码'}
          </button>
          <button 
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="suggestions-btn"
          >
            显示建议
          </button>
          <button onClick={exportReport} className="export-btn">
            导出报告
          </button>
        </div>
      </div>

      <div className="assistant-content">
        <div className="issues-section">
          <div className="section-header">
            <h4>代码问题 ({issues.length})</h4>
            <span className={`status-indicator ${issues.length === 0 ? 'status-ok' : 'status-issues'}`}>
              {issues.length === 0 ? '✓' : '!'}
            </span>
          </div>
          
          {issues.length === 0 ? (
            <div className="empty-state">
              <p>🎉 代码检查通过！没有发现问题。</p>
            </div>
          ) : (
            <div className="issues-list">
              {issues.map((issue, index) => (
                <div 
                  key={index} 
                  className={`issue-item issue-${issue.type}`}
                  onClick={() => fixIssue(issue)}
                >
                  <div className="issue-header">
                    <span className="issue-type">{issue.type.toUpperCase()}</span>
                    <span className="issue-severity severity-${issue.severity}">
                      {issue.severity}
                    </span>
                  </div>
                  <div className="issue-message">{issue.message}</div>
                  <div className="issue-location">
                    行 {issue.line}, 列 {issue.column}
                  </div>
                  <div className="issue-actions">
                    <button className="small-btn">修复</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="suggestions-section" ref={suggestionsRef}>
          <div className="section-header">
            <h4>智能建议 ({suggestions.length})</h4>
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="toggle-suggestions"
            >
              {showSuggestions ? '隐藏' : '显示'}
            </button>
          </div>
          
          {showSuggestions ? (
            <div className="suggestions-list">
              {suggestions.slice(0, 10).map((suggestion, index) => (
                <div 
                  key={index} 
                  className="suggestion-item"
                  onClick={() => applySuggestion(suggestion)}
                >
                  <div className="suggestion-header">
                    <span className={`suggestion-type type-${suggestion.type}`}>
                      {suggestion.type}
                    </span>
                    <span className="suggestion-name">{suggestion.name}</span>
                  </div>
                  <div className="suggestion-description">
                    {suggestion.description}
                  </div>
                  <div className="suggestion-preview">
                    <code>{suggestion.insertText}</code>
                  </div>
                </div>
              ))}
              
              {suggestions.length > 10 && (
                <div className="more-suggestions">
                  还有 {suggestions.length - 10} 个建议...
                </div>
              )}
            </div>
          ) : (
            <div className="suggestions-preview">
              <p>点击"显示建议"查看代码优化建议</p>
              <p className="hint">💡 提示: 右键点击积木块可以快速设置断点</p>
            </div>
          )}
        </div>

        <div className="stats-section">
          <div className="section-header">
            <h4>代码统计</h4>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{currentCode.split('\\n').length}</div>
              <div className="stat-label">代码行数</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{currentCode.split(';').length - 1}</div>
              <div className="stat-label">语句数量</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {issues.filter(i => i.type === 'error').length}
              </div>
              <div className="stat-label">错误</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {issues.filter(i => i.type === 'warning').length}
              </div>
              <div className="stat-label">警告</div>
            </div>
          </div>
        </div>
      </div>

      <div className="assistant-tips">
        <h5>💡 编程技巧</h5>
        <ul>
          <li>使用循环来避免重复的积木块</li>
          <li>合理使用变量存储中间结果</li>
          <li>复杂的逻辑可以拆分成多个函数</li>
          <li>定期使用"分析代码"检查潜在问题</li>
          <li>利用智能建议快速添加常用积木块</li>
        </ul>
      </div>
    </div>
  );
};

export default CodeAssistant;