const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 8080;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟小狗状态
let dogStatus = {
  connected: false,
  battery: 100,
  position: { x: 0, y: 0 },
  orientation: 0,
  sensors: {
    distance: 0,
    sound: 0,
    temperature: 25
  }
};

// WebSocket服务器
const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', (ws) => {
  console.log('新的WebSocket连接建立');
  
  // 发送当前状态
  ws.send(JSON.stringify({
    type: 'status',
    data: dogStatus
  }));
  
  // 处理消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到消息:', data);
      
      switch (data.type) {
        case 'command':
          handleCommand(data.command, data.params);
          // 广播状态更新
          broadcastStatus();
          break;
        case 'program':
          handleProgram(data.code);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('消息处理错误:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket连接关闭');
  });
});

// 广播状态给所有客户端
function broadcastStatus() {
  const message = JSON.stringify({
    type: 'status',
    data: dogStatus
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 处理命令
function handleCommand(command, params) {
  console.log(`执行命令: ${command}`, params);
  
  switch (command) {
    case 'CONNECT':
      dogStatus.connected = true;
      console.log('小狗已连接');
      break;
      
    case 'DISCONNECT':
      dogStatus.connected = false;
      console.log('小狗已断开连接');
      break;
      
    case 'MOVE_FORWARD':
      dogStatus.position.y += 1;
      dogStatus.battery = Math.max(0, dogStatus.battery - 0.5);
      console.log('小狗前进1单位');
      break;
      
    case 'MOVE_BACKWARD':
      dogStatus.position.y -= 1;
      dogStatus.battery = Math.max(0, dogStatus.battery - 0.5);
      console.log('小狗后退1单位');
      break;
      
    case 'TURN_LEFT':
      dogStatus.orientation = (dogStatus.orientation - 90) % 360;
      dogStatus.battery = Math.max(0, dogStatus.battery - 0.2);
      console.log('小狗左转90度');
      break;
      
    case 'TURN_RIGHT':
      dogStatus.orientation = (dogStatus.orientation + 90) % 360;
      dogStatus.battery = Math.max(0, dogStatus.battery - 0.2);
      console.log('小狗右转90度');
      break;
      
    case 'BARK':
      console.log('小狗叫了一声: 汪汪!');
      break;
      
    default:
      console.log(`未知命令: ${command}`);
  }
  
  // 更新传感器数据
  updateSensors();
}

// 处理程序
function handleProgram(code) {
  console.log('执行程序:', code);
  
  // 这里可以添加实际的程序执行逻辑
  // 目前只是模拟执行
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    setTimeout(() => {
      console.log(`执行第${index + 1}行: ${line.trim()}`);
    }, index * 500);
  });
}

// 更新传感器数据
function updateSensors() {
  dogStatus.sensors = {
    distance: Math.random() * 100,
    sound: Math.random() * 80,
    temperature: 25 + Math.random() * 5
  };
}

// 模拟传感器数据更新
setInterval(() => {
  if (dogStatus.connected) {
    updateSensors();
    broadcastStatus();
  }
}, 2000);

// REST API路由
app.get('/api/status', (req, res) => {
  res.json(dogStatus);
});

app.post('/api/connect', (req, res) => {
  dogStatus.connected = true;
  console.log('通过REST API连接小狗');
  broadcastStatus();
  res.json({ success: true, message: '小狗已连接' });
});

app.post('/api/disconnect', (req, res) => {
  dogStatus.connected = false;
  console.log('通过REST API断开小狗连接');
  broadcastStatus();
  res.json({ success: true, message: '小狗已断开连接' });
});

app.post('/api/command', (req, res) => {
  const { command, params } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: '缺少命令参数' });
  }
  
  handleCommand(command, params);
  broadcastStatus();
  
  res.json({ success: true, message: `命令 ${command} 已执行` });
});

app.post('/api/program', (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: '缺少代码参数' });
  }
  
  handleProgram(code);
  
  res.json({ success: true, message: '程序已开始执行' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Smart Dog 后端API服务运行在 http://localhost:${PORT}`);
  console.log(`WebSocket 服务运行在 ws://localhost:8081`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  wss.close();
  process.exit(0);
});