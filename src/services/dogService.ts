// 小狗通讯服务
export interface DogStatus {
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

export interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
}

class DogService {
  private ws: WebSocket | null = null;
  private apiBaseUrl = 'http://localhost:8080/api';
  private wsUrl = 'ws://localhost:8081';
  private statusListeners: Array<(status: DogStatus) => void> = [];
  private connectionListeners: Array<(connected: boolean) => void> = [];

  // 连接小狗
  async connect(ip?: string, port?: string): Promise<CommandResponse> {
    try {
      // 如果有提供IP和端口，更新API地址
      if (ip && port) {
        this.apiBaseUrl = `http://${ip}:${port}/api`;
        this.wsUrl = `ws://${ip}:${port === '8080' ? '8081' : port}`;
      }

      // 先通过REST API连接
      const response = await fetch(`${this.apiBaseUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`连接失败: ${response.statusText}`);
      }

      // 建立WebSocket连接
      await this.connectWebSocket();

      return await response.json();
    } catch (error) {
      console.error('连接小狗失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接失败'
      };
    }
  }

  // 断开连接
  async disconnect(): Promise<CommandResponse> {
    try {
      // 通过REST API断开连接
      const response = await fetch(`${this.apiBaseUrl}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 关闭WebSocket连接
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      // 通知连接状态变化
      this.notifyConnectionListeners(false);

      return await response.json();
    } catch (error) {
      console.error('断开连接失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '断开连接失败'
      };
    }
  }

  // 建立WebSocket连接
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket连接已建立');
        this.notifyConnectionListeners(true);
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status') {
            this.notifyStatusListeners(data.data);
          }
        } catch (error) {
          console.error('WebSocket消息解析失败:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        reject(new Error('WebSocket连接失败'));
      };

      this.ws.onclose = () => {
        console.log('WebSocket连接已关闭');
        this.ws = null;
        this.notifyConnectionListeners(false);
      };
    });
  }

  // 发送命令
  async sendCommand(command: string, params?: any): Promise<CommandResponse> {
    try {
      // 优先使用WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        return new Promise((resolve) => {
          const messageId = Date.now().toString();
          
          const handleResponse = (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'command_response' && data.id === messageId) {
                this.ws?.removeEventListener('message', handleResponse);
                resolve(data.response);
              }
            } catch (error) {
              // 忽略解析错误
            }
          };
          
          this.ws?.addEventListener('message', handleResponse);
          
          this.ws?.send(JSON.stringify({
            type: 'command',
            id: messageId,
            command,
            params
          }));
          
          // 超时处理
          setTimeout(() => {
            this.ws?.removeEventListener('message', handleResponse);
            resolve({
              success: true,
              message: '命令已发送（异步执行）'
            });
          }, 1000);
        });
      }
      
      // 回退到REST API
      const response = await fetch(`${this.apiBaseUrl}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, params }),
      });

      if (!response.ok) {
        throw new Error(`命令执行失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('发送命令失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '命令发送失败'
      };
    }
  }

  // 执行程序
  async executeProgram(code: string): Promise<CommandResponse> {
    try {
      // 优先使用WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'program',
          code
        }));
        
        return {
          success: true,
          message: '程序已发送执行'
        };
      }
      
      // 回退到REST API
      const response = await fetch(`${this.apiBaseUrl}/program`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`程序执行失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('执行程序失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '程序执行失败'
      };
    }
  }

  // 获取当前状态
  async getStatus(): Promise<DogStatus> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/status`);
      
      if (!response.ok) {
        throw new Error(`获取状态失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取状态失败:', error);
      // 返回默认状态
      return {
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
    }
  }

  // 添加状态监听器
  addStatusListener(listener: (status: DogStatus) => void): void {
    this.statusListeners.push(listener);
  }

  // 移除状态监听器
  removeStatusListener(listener: (status: DogStatus) => void): void {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  // 添加连接状态监听器
  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  // 移除连接状态监听器
  removeConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  // 通知状态监听器
  private notifyStatusListeners(status: DogStatus): void {
    this.statusListeners.forEach(listener => listener(status));
  }

  // 通知连接状态监听器
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // 检查WebSocket连接状态
  isWebSocketConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // 获取WebSocket实例（用于直接操作）
  getWebSocket(): WebSocket | null {
    return this.ws;
  }
}

// 创建单例实例
export const dogService = new DogService();

// 常用命令常量
export const DogCommands = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  MOVE_FORWARD: 'MOVE_FORWARD',
  MOVE_BACKWARD: 'MOVE_BACKWARD',
  TURN_LEFT: 'TURN_LEFT',
  TURN_RIGHT: 'TURN_RIGHT',
  BARK: 'BARK',
  STOP: 'STOP'
} as const;