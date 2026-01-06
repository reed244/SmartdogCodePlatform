import React, { useState, useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import './DebugPanel.css';

interface Breakpoint {
  blockId: string;
  lineNumber: number;
  enabled: boolean;
}

interface VariableValue {
  name: string;
  value: any;
  type: string;
}

// 调试样式常量
const DEBUG_STYLES = {
  default: {},
  highlighted: {
    colourPrimary: '#ff9900',
    colourSecondary: '#ffcc66',
    colourTertiary: '#ff9933'
  },
  breakpoint: {
    colourPrimary: '#ff4444',
    colourSecondary: '#ff8888',
    colourTertiary: '#ff6666'
  },
  disabled: {
    colourPrimary: '#cccccc',
    colourSecondary: '#dddddd',
    colourTertiary: '#bbbbbb'
  }
};

const DebugPanel: React.FC = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [variables, setVariables] = useState<VariableValue[]>([]);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [executionSpeed, setExecutionSpeed] = useState(1000); // 毫秒
  
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const executionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当前工作区
  useEffect(() => {
    const getWorkspace = () => {
      const workspaces = Blockly.getMainWorkspace();
      if (workspaces) {
        workspaceRef.current = workspaces as Blockly.WorkspaceSvg;
      }
    };

    // 延迟获取，确保Blockly已初始化
    const timer = setTimeout(getWorkspace, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 监听变量变化
  useEffect(() => {
    if (!workspaceRef.current) return;

    const updateVariables = () => {
      const allBlocks = workspaceRef.current?.getAllBlocks(false) || [];
      const variableBlocks = allBlocks.filter(block => 
        block.type === 'variables_get' || block.type === 'variables_set'
      );

      const variableMap = new Map<string, any>();
      variableBlocks.forEach(block => {
        if (block.type === 'variables_set') {
          const varName = block.getFieldValue('VAR');
          // 这里应该从执行上下文中获取实际值
          // 目前使用模拟值
          variableMap.set(varName, `值_${varName}`);
        }
      });

      const variableList: VariableValue[] = Array.from(variableMap.entries()).map(([name, value]) => ({
        name,
        value,
        type: typeof value
      }));

      setVariables(variableList);
    };

    // 定期更新变量
    const interval = setInterval(updateVariables, 1000);
    return () => clearInterval(interval);
  }, [workspaceRef.current]);

  // 监听断点切换事件
  useEffect(() => {
    const handleToggleBreakpoint = (event: CustomEvent) => {
      const { blockId } = event.detail;
      toggleBreakpoint(blockId);
    };

    window.addEventListener('toggleBreakpoint', handleToggleBreakpoint as EventListener);
    
    return () => {
      window.removeEventListener('toggleBreakpoint', handleToggleBreakpoint as EventListener);
    };
  }, [breakpoints]);

  // 设置断点
  const toggleBreakpoint = (blockId: string) => {
    const existingBreakpoint = breakpoints.find(bp => bp.blockId === blockId);
    
    if (existingBreakpoint) {
      // 切换断点状态
      const updatedBreakpoints = breakpoints.map(bp =>
        bp.blockId === blockId ? { ...bp, enabled: !bp.enabled } : bp
      );
      setBreakpoints(updatedBreakpoints);
      
      // 更新块的外观
      const block = workspaceRef.current?.getBlockById(blockId);
      if (block) {
        if (existingBreakpoint.enabled) {
          block.setStyle(DEBUG_STYLES.disabled as any);
        } else {
          block.setStyle(DEBUG_STYLES.default as any);
        }
      }
    } else {
      // 添加新断点
      const newBreakpoint: Breakpoint = {
        blockId,
        lineNumber: breakpoints.length + 1,
        enabled: true
      };
      setBreakpoints([...breakpoints, newBreakpoint]);
      
      // 标记块
      const block = workspaceRef.current?.getBlockById(blockId);
      if (block) {
        block.setStyle(DEBUG_STYLES.breakpoint as any);
      }
    }
  };

  // 开始调试
  const startDebugging = () => {
    if (!workspaceRef.current) return;

    setIsDebugging(true);
    setIsPaused(false);
    setCurrentStep(0);
    setExecutionLog([]);
    
    // 获取所有块
    const allBlocks = workspaceRef.current.getTopBlocks(true);
    setTotalSteps(allBlocks.length);

    // 高亮第一个块
    if (allBlocks.length > 0) {
      highlightBlock(allBlocks[0].id);
    }

    // 开始执行
    executeStepByStep(allBlocks);
  };

  // 逐步执行
  const executeStepByStep = (blocks: Blockly.Block[]) => {
    let step = 0;
    
    const executeNextStep = () => {
      if (step >= blocks.length || !isDebugging || isPaused) {
        if (executionIntervalRef.current) {
          clearInterval(executionIntervalRef.current);
          executionIntervalRef.current = null;
        }
        return;
      }

      const block = blocks[step];
      const blockId = block.id;
      
      // 检查是否有断点
      const breakpoint = breakpoints.find(bp => bp.blockId === blockId && bp.enabled);
      if (breakpoint) {
        setIsPaused(true);
        addToLog(`在断点处暂停: ${getBlockDescription(block)}`);
        return;
      }

      // 执行当前块
      executeBlock(block);
      setCurrentStep(step + 1);
      
      // 高亮下一个块
      if (step + 1 < blocks.length) {
        highlightBlock(blocks[step + 1].id);
      }
      
      step++;
    };

    // 清除之前的间隔
    if (executionIntervalRef.current) {
      clearInterval(executionIntervalRef.current);
    }

    // 设置新的执行间隔
    executionIntervalRef.current = setInterval(executeNextStep, executionSpeed);
  };

  // 执行单个块
  const executeBlock = (block: Blockly.Block) => {
    const blockType = block.type;
    const description = getBlockDescription(block);
    
    addToLog(`执行: ${description}`);
    
    // 根据块类型执行不同的操作
    switch (blockType) {
      case 'dog_move_forward':
        const duration = block.getFieldValue('DURATION');
        addToLog(`小狗前进 ${duration} 秒`);
        break;
      case 'dog_turn':
        const angle = block.getFieldValue('ANGLE');
        addToLog(`小狗转向 ${angle} 度`);
        break;
      case 'dog_bark':
        addToLog('小狗叫了一声');
        break;
      case 'dog_wait':
        const waitTime = block.getFieldValue('DURATION');
        addToLog(`等待 ${waitTime} 秒`);
        break;
      case 'variables_set':
        const varName = block.getFieldValue('VAR');
        addToLog(`设置变量 ${varName}`);
        break;
      case 'controls_if':
        addToLog('执行条件判断');
        break;
      case 'controls_repeat_ext':
        const times = block.getFieldValue('TIMES');
        addToLog(`循环执行 ${times} 次`);
        break;
      default:
        addToLog(`执行 ${blockType} 块`);
    }
  };

  // 获取块描述
  const getBlockDescription = (block: Blockly.Block): string => {
    const blockType = block.type;
    
    switch (blockType) {
      case 'dog_move_forward':
        return `前进 ${block.getFieldValue('DURATION')} 秒`;
      case 'dog_turn':
        return `转向 ${block.getFieldValue('ANGLE')} 度`;
      case 'dog_bark':
        return '叫一声';
      case 'dog_wait':
        return `等待 ${block.getFieldValue('DURATION')} 秒`;
      case 'variables_set':
        return `设置变量 ${block.getFieldValue('VAR')}`;
      case 'controls_if':
        return '条件判断';
      case 'controls_repeat_ext':
        return `循环 ${block.getFieldValue('TIMES')} 次`;
      default:
        return blockType;
    }
  };

  // 高亮块
  const highlightBlock = (blockId: string) => {
    if (!workspaceRef.current) return;
    
    try {
      // 清除之前的高亮
      const allBlocks = workspaceRef.current.getAllBlocks(false);
      allBlocks.forEach(block => {
        if (!block) return;
        if (block.id !== blockId) {
          try {
            // 使用默认样式清除高亮
            block.setStyle(DEBUG_STYLES.default as any);
          } catch (error) {
            console.warn('清除块样式失败:', error);
          }
        }
      });

      // 高亮当前块
      const block = workspaceRef.current.getBlockById(blockId);
      if (block) {
        try {
          // 使用高亮样式
          block.setStyle(DEBUG_STYLES.highlighted as any);
        } catch (error) {
          console.warn('高亮块失败:', error);
        }
      }
    } catch (error) {
      console.error('高亮块过程中出错:', error);
    }
  };

  // 添加日志
  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 继续执行
  const continueExecution = () => {
    if (!isDebugging || !isPaused) return;
    
    setIsPaused(false);
    addToLog('继续执行');
    
    // 获取剩余块
    const allBlocks = workspaceRef.current?.getTopBlocks(true) || [];
    const remainingBlocks = allBlocks.slice(currentStep);
    
    executeStepByStep(remainingBlocks);
  };

  // 单步执行
  const stepOver = () => {
    if (!isDebugging || !isPaused || !workspaceRef.current) return;
    
    const allBlocks = workspaceRef.current.getTopBlocks(true);
    if (currentStep >= allBlocks.length) return;
    
    const block = allBlocks[currentStep];
    executeBlock(block);
    setCurrentStep(currentStep + 1);
    
    // 高亮下一个块
    if (currentStep + 1 < allBlocks.length) {
      highlightBlock(allBlocks[currentStep + 1].id);
    }
    
    addToLog('单步执行完成');
  };

  // 停止调试
  const stopDebugging = () => {
    setIsDebugging(false);
    setIsPaused(false);
    
    if (executionIntervalRef.current) {
      clearInterval(executionIntervalRef.current);
      executionIntervalRef.current = null;
    }
    
    // 清除所有高亮
    const allBlocks = workspaceRef.current?.getAllBlocks(false) || [];
    allBlocks.forEach(block => {
      block.setStyle(DEBUG_STYLES.default as any);
    });
    
    addToLog('调试已停止');
  };

  // 清除断点
  const clearAllBreakpoints = () => {
    setBreakpoints([]);
    
    // 清除所有块的断点样式
    const allBlocks = workspaceRef.current?.getAllBlocks(false) || [];
    allBlocks.forEach(block => {
      block.setStyle(DEBUG_STYLES.default as any);
    });
    
    addToLog('所有断点已清除');
  };

  // 清除日志
  const clearLog = () => {
    setExecutionLog([]);
  };

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>调试工具</h3>
        <div className="debug-controls">
          {!isDebugging ? (
            <button onClick={startDebugging} className="debug-btn start">
              开始调试
            </button>
          ) : (
            <>
              {isPaused ? (
                <>
                  <button onClick={continueExecution} className="debug-btn continue">
                    继续
                  </button>
                  <button onClick={stepOver} className="debug-btn step">
                    单步执行
                  </button>
                </>
              ) : (
                <button onClick={() => setIsPaused(true)} className="debug-btn pause">
                  暂停
                </button>
              )}
              <button onClick={stopDebugging} className="debug-btn stop">
                停止
              </button>
            </>
          )}
        </div>
      </div>

      <div className="debug-content">
        <div className="debug-section">
          <div className="section-header">
            <h4>执行控制</h4>
            <div className="section-actions">
              <button onClick={clearAllBreakpoints} className="small-btn">
                清除断点
              </button>
            </div>
          </div>
          
          <div className="control-info">
            <div className="info-item">
              <span>当前步骤:</span>
              <strong>{currentStep}/{totalSteps}</strong>
            </div>
            <div className="info-item">
              <span>断点数量:</span>
              <strong>{breakpoints.filter(bp => bp.enabled).length}</strong>
            </div>
            <div className="info-item">
              <span>执行速度:</span>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={executionSpeed}
                onChange={(e) => setExecutionSpeed(parseInt(e.target.value))}
                disabled={isDebugging && !isPaused}
              />
              <span>{executionSpeed}ms</span>
            </div>
          </div>
        </div>

        <div className="debug-section">
          <div className="section-header">
            <h4>变量监视</h4>
          </div>
          <div className="variables-list">
            {variables.length === 0 ? (
              <p className="empty-message">暂无变量</p>
            ) : (
              <table className="variables-table">
                <thead>
                  <tr>
                    <th>变量名</th>
                    <th>值</th>
                    <th>类型</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((variable, index) => (
                    <tr key={index}>
                      <td>{variable.name}</td>
                      <td className="variable-value">{String(variable.value)}</td>
                      <td className="variable-type">{variable.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="debug-section">
          <div className="section-header">
            <h4>执行日志</h4>
            <div className="section-actions">
              <button onClick={clearLog} className="small-btn">
                清除日志
              </button>
            </div>
          </div>
          <div className="execution-log">
            {executionLog.length === 0 ? (
              <p className="empty-message">暂无日志</p>
            ) : (
              <div className="log-content">
                {executionLog.map((log, index) => (
                  <div key={index} className="log-entry">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="debug-section">
          <div className="section-header">
            <h4>断点管理</h4>
          </div>
          <div className="breakpoints-list">
            {breakpoints.length === 0 ? (
              <p className="empty-message">暂无断点</p>
            ) : (
              <div className="breakpoints-content">
                {breakpoints.map((breakpoint, index) => (
                  <div key={index} className="breakpoint-item">
                    <div className="breakpoint-info">
                      <span className="breakpoint-line">行 {breakpoint.lineNumber}</span>
                      <span className="breakpoint-status">
                        {breakpoint.enabled ? '启用' : '禁用'}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleBreakpoint(breakpoint.blockId)}
                      className="small-btn"
                    >
                      {breakpoint.enabled ? '禁用' : '启用'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="debug-instructions">
        <p><strong>使用说明:</strong></p>
        <ul>
          <li>点击"开始调试"开始逐步执行程序</li>
          <li>在积木块上右键点击可以设置/清除断点</li>
          <li>使用"继续"、"暂停"、"单步执行"控制调试过程</li>
          <li>在变量监视器中查看当前变量的值</li>
          <li>调整执行速度控制调试节奏</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugPanel;