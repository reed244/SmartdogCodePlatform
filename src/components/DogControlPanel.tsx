import React, { useState, useEffect } from 'react';
import { dogService, DogStatus as ServiceDogStatus, DogCommands } from '../services/dogService';
import './DogControlPanel.css';

interface DogStatus {
  connected: boolean;
  battery: number;
  position: { x: number; y: number };
  orientation: number;
  sensors: {
    distance: number;
    sound: number;
    temperature: number;
  };
}

const DogControlPanel: React.FC = () => {
  const [dogStatus, setDogStatus] = useState<ServiceDogStatus>({
    connected: false,
    battery: 100,
    position: { x: 0, y: 0 },
    orientation: 0,
    sensors: {
      distance: 0,
      sound: 0,
      temperature: 25
    }
  });

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [dogIp, setDogIp] = useState<string>('localhost');
  const [dogPort, setDogPort] = useState<string>('8080');

  // 连接小狗
  const connectToDog = async () => {
    setConnectionStatus('connecting');
    
    try {
      const result = await dogService.connect(dogIp, dogPort);
      
      if (result.success) {
        setConnectionStatus('connected');
        
        // 获取初始状态
        const status = await dogService.getStatus();
        setDogStatus(status);
        
        alert('小狗连接成功！');
      } else {
        setConnectionStatus('disconnected');
        alert(`连接失败: ${result.message}`);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      alert(`连接错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const disconnectFromDog = async () => {
    try {
      const result = await dogService.disconnect();
      
      if (result.success) {
        setConnectionStatus('disconnected');
        setDogStatus(prev => ({ ...prev, connected: false }));
        alert('小狗已断开连接');
      } else {
        alert(`断开连接失败: ${result.message}`);
      }
    } catch (error) {
      alert(`断开连接错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const sendCommand = async (command: string) => {
    if (!dogStatus.connected) {
      alert('请先连接小狗');
      return;
    }
    
    try {
      const result = await dogService.sendCommand(command);
      
      if (result.success) {
        console.log(`命令发送成功: ${command}`);
        
        // 更新状态
        const status = await dogService.getStatus();
        setDogStatus(status);
      } else {
        alert(`命令发送失败: ${result.message}`);
      }
    } catch (error) {
      alert(`命令发送错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const executeProgram = async () => {
    if (!dogStatus.connected) {
      alert('请先连接小狗');
      return;
    }
    
    // 监听代码生成事件
    const handleCodeGenerated = (event: any) => {
      const code = event.detail.code;
      
      dogService.executeProgram(code)
        .then(result => {
          if (result.success) {
            alert('程序已发送到小狗执行');
          } else {
            alert(`程序执行失败: ${result.message}`);
          }
        })
        .catch(error => {
          alert(`程序执行错误: ${error.message}`);
        });
      
      // 移除监听器
      window.removeEventListener('codeGenerated', handleCodeGenerated);
    };
    
    window.addEventListener('codeGenerated', handleCodeGenerated);
    
    // 触发代码生成
    const generateEvent = new Event('generateCode');
    window.dispatchEvent(generateEvent);
  };

  // 监听状态更新
  useEffect(() => {
    const handleStatusUpdate = (status: ServiceDogStatus) => {
      setDogStatus(status);
      setConnectionStatus(status.connected ? 'connected' : 'disconnected');
    };

    const handleConnectionUpdate = (connected: boolean) => {
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      setDogStatus(prev => ({ ...prev, connected }));
    };

    dogService.addStatusListener(handleStatusUpdate);
    dogService.addConnectionListener(handleConnectionUpdate);

    // 获取初始状态
    dogService.getStatus().then(setDogStatus);

    return () => {
      dogService.removeStatusListener(handleStatusUpdate);
      dogService.removeConnectionListener(handleConnectionUpdate);
    };
  }, []);

  return (
    <div className="dog-control-panel">
      <h2>小狗控制面板</h2>
      
      <div className="connection-section">
        <h3>连接设置</h3>
        <div className="connection-inputs">
          <div className="input-group">
            <label>IP地址:</label>
            <input 
              type="text" 
              value={dogIp}
              onChange={(e) => setDogIp(e.target.value)}
              placeholder="小狗IP地址"
            />
          </div>
          <div className="input-group">
            <label>端口:</label>
            <input 
              type="text" 
              value={dogPort}
              onChange={(e) => setDogPort(e.target.value)}
              placeholder="端口号"
            />
          </div>
        </div>
        
        <div className="connection-status">
          <span>状态: </span>
          <div className={`status-indicator status-${connectionStatus}`} />
          <span className="status-text">
            {connectionStatus === 'disconnected' && '未连接'}
            {connectionStatus === 'connecting' && '连接中...'}
            {connectionStatus === 'connected' && '已连接'}
          </span>
        </div>
        
        <div className="connection-buttons">
          {connectionStatus !== 'connected' ? (
            <button onClick={connectToDog} disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connecting' ? '连接中...' : '连接小狗'}
            </button>
          ) : (
            <button onClick={disconnectFromDog} className="disconnect-btn">
              断开连接
            </button>
          )}
        </div>
      </div>

      <div className="status-section">
        <h3>小狗状态</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">电量:</span>
            <div className="battery-container">
              <div 
                className="battery-level" 
                style={{ width: `${dogStatus.battery}%` }}
              />
              <span className="battery-text">{dogStatus.battery.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="status-item">
            <span className="status-label">位置:</span>
            <span className="status-value">({dogStatus.position.x}, {dogStatus.position.y})</span>
          </div>
          
          <div className="status-item">
            <span className="status-label">方向:</span>
            <span className="status-value">{dogStatus.orientation}°</span>
          </div>
        </div>
      </div>

      <div className="sensors-section">
        <h3>传感器数据</h3>
        <div className="sensors-grid">
          <div className="sensor-item">
            <span className="sensor-label">距离传感器:</span>
            <span className="sensor-value">{dogStatus.sensors.distance.toFixed(1)} cm</span>
          </div>
          
          <div className="sensor-item">
            <span className="sensor-label">声音传感器:</span>
            <span className="sensor-value">{dogStatus.sensors.sound.toFixed(1)} dB</span>
          </div>
          
          <div className="sensor-item">
            <span className="sensor-label">温度传感器:</span>
            <span className="sensor-value">{dogStatus.sensors.temperature.toFixed(1)} °C</span>
          </div>
        </div>
      </div>

      <div className="quick-controls">
        <h3>快速控制</h3>
        <div className="control-buttons">
          <button onClick={() => sendCommand(DogCommands.MOVE_FORWARD)}>前进</button>
          <button onClick={() => sendCommand(DogCommands.MOVE_BACKWARD)}>后退</button>
          <button onClick={() => sendCommand(DogCommands.TURN_LEFT)}>左转</button>
          <button onClick={() => sendCommand(DogCommands.TURN_RIGHT)}>右转</button>
          <button onClick={() => sendCommand(DogCommands.BARK)}>叫一声</button>
          <button onClick={executeProgram}>执行程序</button>
        </div>
      </div>
    </div>
  );
};

export default DogControlPanel;