# Smart Dog Scratch编程平台

基于Scratch的可视化编程平台，用于控制智能小狗机器人。

## 功能特性

### 1. Scratch积木块编程界面
- 拖拽式编程界面，类似MIT Scratch
- 自定义小狗控制积木块（前进、转向、叫等）
- 逻辑控制积木块（条件判断、循环）
- 变量和函数定义

### 2. 小狗控制面板
- 实时连接状态显示
- 小狗状态监控（电量、位置、方向）
- 传感器数据显示（距离、声音、温度）
- 快速控制按钮

### 3. 代码生成与输出
- 实时生成JavaScript代码
- 代码格式化显示
- 输出日志记录
- 模拟执行功能

### 4. 通讯控制框架
- REST API接口
- WebSocket实时通讯
- 命令执行和程序上传
- 状态同步更新

## 项目结构

```
smartdog-scratch/
├── src/                    # 前端React应用
│   ├── components/         # React组件
│   │   ├── ScratchEditor/  # Scratch编程界面
│   │   ├── DogControlPanel/# 小狗控制面板
│   │   └── CodeOutput/     # 代码输出面板
│   ├── services/          # 服务层
│   │   └── dogService.ts  # 小狗通讯服务
│   └── App.tsx           # 主应用组件
├── backend/               # 后端API服务
│   ├── server.js         # Express服务器
│   └── package.json      # 后端依赖
└── README.md             # 项目文档
```

## 快速开始

### 1. 安装依赖

```bash
# 前端依赖
cd smartdog-scratch
npm install

# 后端依赖
cd backend
npm install
```

### 2. 启动服务

```bash
# 启动前端开发服务器（端口3000）
cd smartdog-scratch
npm start

# 启动后端API服务（端口8080）
cd backend
npm start
```

### 3. 访问应用

打开浏览器访问：http://localhost:3000

## 使用指南

### 1. 连接小狗
1. 在控制面板输入小狗的IP地址和端口（默认：localhost:8080）
2. 点击"连接小狗"按钮
3. 等待连接成功，状态指示灯变为绿色

### 2. 编程控制
1. 从左侧工具栏拖拽积木块到工作区
2. 连接积木块创建程序逻辑
3. 常用积木块：
   - `前进 [秒数]` - 让小狗前进指定时间
   - `转向 [角度]` - 让小狗转向指定角度
   - `叫一声` - 让小狗发出声音
   - `等待 [秒数]` - 程序暂停指定时间
   - `如果...那么` - 条件判断
   - `重复 [次数]` - 循环执行

### 3. 执行程序
1. 点击"生成代码"按钮查看生成的JavaScript代码
2. 点击"执行程序"按钮将程序发送到小狗
3. 在输出日志中查看执行状态

### 4. 快速控制
- 使用控制面板的快速按钮进行手动控制
- 实时查看小狗状态和传感器数据
- 保存和加载工作区配置

## API接口

### REST API (端口8080)

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/status` | GET | 获取小狗当前状态 |
| `/api/connect` | POST | 连接小狗 |
| `/api/disconnect` | POST | 断开连接 |
| `/api/command` | POST | 发送控制命令 |
| `/api/program` | POST | 上传并执行程序 |

### WebSocket (端口8081)

- 连接地址：`ws://localhost:8081`
- 实时推送小狗状态更新
- 接收控制命令和程序

## 开发指南

### 添加新的积木块

1. 在 `ScratchEditor.tsx` 中定义积木块JSON
2. 注册积木块到Blockly
3. 添加JavaScript代码生成器
4. 更新工具箱配置

### 扩展小狗功能

1. 在 `dogService.ts` 中添加新的命令
2. 在后端 `server.js` 中实现命令处理
3. 在前端控制面板添加对应的控制按钮

### 自定义样式

- 编辑 `App.css` 修改全局样式
- 各组件有自己的CSS文件
- 使用CSS变量统一主题颜色

## 技术栈

### 前端
- React 19 + TypeScript
- Blockly (Google可视化编程库)
- CSS3 + Flexbox布局

### 后端
- Node.js + Express
- WebSocket实时通讯
- RESTful API设计

## 许可证

MIT License

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 问题反馈

如有问题或建议，请提交Issue或联系项目维护者。