const express = require('express');
const WebSocket = require('ws');  // 添加这行
const { WebSocketServer } = require('ws');
const app = express();
const port = process.env.PORT || 3000;

// 创建 HTTP 服务器
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ 信令服务器已启动，监听端口: ${port}`);
});

// 生成唯一ID的函数
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// 创建 WebSocket 服务器
const wss = new WebSocketServer({
  server,
  clientTracking: true
});

// WebSocket 连接处理
wss.on('connection', (ws, request) => {
  const clientIp = request.socket.remoteAddress;
  const clientId = generateId();
  ws.clientId = clientId;
  
  console.log(`🟢 客户端已连接，IP: ${clientIp}, ID: ${clientId}`);

  // 发送欢迎消息和ID
  ws.send(JSON.stringify({
    type: 'welcome',
    id: clientId
  }));
// 存储客户端连接
  clients.set(clientId, ws);
  
  console.log(`🟢 客户端已连接，IP: ${clientIp}, ID: ${clientId}`);
  // 存储客户端连接
  clients.set(clientId, ws);
  
  console.log(`🟢 客户端已连接，IP: ${clientIp}, ID: ${clientId}`);
// 发送欢迎消息和ID
  ws.send(JSON.stringify({
    type: 'welcome',
    id: clientId
  }));

  
  // 处理客户端消息
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());
      console.log(`📨 收到消息 from ${clientId}:`, msg);

      // 处理连接请求
      if (msg.type === 'connect') {
        const targetWs = clients.get(msg.targetId);
        if (targetWs) {
          // 只发送给目标客户端
          targetWs.send(JSON.stringify({
            type: 'connect-request',
            fromId: clientId,
            targetId: msg.targetId
          }));
        } else {
          // 目标客户端不存在
          ws.send(JSON.stringify({
            type: 'connect-error',
            message: '对方不在线'
          }));
        }
      }
      // 处理连接接受
      else if (msg.type === 'connect-accept') {
        const sourceWs = clients.get(msg.targetId);
        if (sourceWs) {
          sourceWs.send(JSON.stringify({
            type: 'connect-accepted',
            fromId: clientId
          }));
        }
      }
      // 处理连接拒绝
      else if (msg.type === 'connect-reject') {
        const sourceWs = clients.get(msg.targetId);
        if (sourceWs) {
          sourceWs.send(JSON.stringify({
            type: 'connect-rejected',
            fromId: clientId
          }));
        }
      }
    } catch (e) {
      console.error('消息解析错误:', e);
    }
  });

  // 连接关闭处理
  ws.on('close', () => {
    console.log(`🔴 客户端断开连接，IP: ${clientIp}, ID: ${clientId}`);
    clients.delete(clientId);
  });
});

 // 定期发送心跳包
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
    }
  }, 30000);

// 连接关闭处理
  ws.on('close', () => {
    console.log(`🔴 客户端断开连接，IP: ${clientIp}, ID: ${clientId}`);
    clients.delete(clientId);
    clearInterval(interval);
  });

 // 错误处理
  ws.on('error', (error) => {
    console.error(`WebSocket 错误 (${clientId}):`, error);
  });
});

// 基础 HTTP 路由
app.get('/', (req, res) => {
  const connectedClients = Array.from(wss.clients).map(client => client.clientId);
  res.status(200).json({
    status: 'online',
    protocol: 'WebSocket',
    secure: req.secure,
    clients: wss.clients.size,
    clientIds: connectedClients
  });
});

// 处理无效路径
app.use((req, res) => {
  res.status(404).send('🚫 无效路径');
});

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('⚠️ 未捕获异常:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ 未处理的 Promise 拒绝:', reason);
});
