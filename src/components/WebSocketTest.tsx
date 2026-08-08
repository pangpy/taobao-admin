import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Alert, Typography, List, Tag } from 'antd';
import { WifiOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons';
import { getDynamicHeaders } from '../api/sdkHelper';

const { Text } = Typography;

interface Message {
  id: string;
  type: 'sent' | 'received' | 'system' | 'ack';
  content: string;
  timestamp: Date;
}

const WebSocketTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [roomId, setRoomId] = useState('test-room-001');
  const [subUserId, setSubUserId] = useState('1');
  const [role, setRole] = useState('admin');
  const [logs, setLogs] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // 添加日志
  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  };

  // 连接 WebSocket
  const connectWebSocket = async () => {
    try {
      // 1. 获取动态认证头
      const headers = await getDynamicHeaders();
      const authHeader = headers['Authorization'] || '';
      const token = authHeader.replace('Bearer ', '');
      
      if (!token) {
        addLog('❌ 无法获取认证 token，请先登录');
        return;
      }

      // 2. 通过 URL 参数传递 token
      const wsUrl = `wss://api.apiscode.org/api/wsproxy?token=${token}&sub_user_id=${subUserId}&role=${role}&room_id=${roomId}`;
      addLog(`🔗 正在连接: ${wsUrl}`);

      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        setIsConnected(true);
        addLog('✅ WebSocket 连接成功');
        wsRef.current = websocket;
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addLog(`📩 收到消息: ${event.data.substring(0, 100)}...`);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: data.type === 'ack' ? 'ack' : 'received',
            content: JSON.stringify(data, null, 2),
            timestamp: new Date()
          }]);
        } catch (e) {
          addLog(`📩 收到原始消息: ${event.data}`);
        }
      };

      websocket.onerror = (error) => {
        addLog(`❌ WebSocket 错误: ${error}`);
        setIsConnected(false);
      };

      websocket.onclose = () => {
        addLog('🔌 WebSocket 连接关闭');
        setIsConnected(false);
        wsRef.current = null;
      };
    } catch (error) {
      addLog(`❌ 获取认证信息失败: ${error}`);
    }
  };

  // 断开连接
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    addLog('🔌 主动断开连接');
  };

  // 发送消息
  const sendMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('❌ WebSocket 未连接');
      return;
    }

    if (!inputMessage.trim()) {
      addLog('⚠️ 请输入消息内容');
      return;
    }

    try {
      const msg = {
        content: inputMessage,
        to_user_id: 2,
        to_role: 'user'
      };
      wsRef.current.send(JSON.stringify(msg));
      addLog(`📤 发送: ${inputMessage}`);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'sent',
        content: inputMessage,
        timestamp: new Date()
      }]);
      
      setInputMessage('');
    } catch (e) {
      addLog(`❌ 发送失败: ${e}`);
    }
  };

  // 清理日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 清理连接
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card title="🔌 WebSocket 测试工具" className="shadow-lg">
        {/* 连接配置 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Text type="secondary">房间 ID</Text>
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="room_id"
              disabled={isConnected}
            />
          </div>
          <div>
            <Text type="secondary">用户 ID</Text>
            <Input
              value={subUserId}
              onChange={(e) => setSubUserId(e.target.value)}
              placeholder="sub_user_id"
              disabled={isConnected}
            />
          </div>
          <div>
            <Text type="secondary">角色</Text>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="admin / user"
              disabled={isConnected}
            />
          </div>
          <div className="flex items-end space-x-2">
            {!isConnected ? (
              <Button type="primary" icon={<WifiOutlined />} onClick={connectWebSocket} block>
                连接
              </Button>
            ) : (
              <Button danger icon={<CloseOutlined />} onClick={disconnectWebSocket} block>
                断开
              </Button>
            )}
          </div>
        </div>

        {/* 连接状态 */}
        <div className="mb-4">
          {isConnected ? (
            <Alert message="✅ 已连接" type="success" showIcon />
          ) : (
            <Alert message="⛔ 未连接" type="warning" showIcon />
          )}
        </div>

        {/* 消息发送 */}
        <div className="flex gap-2 mb-4">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="输入消息..."
            onPressEnter={sendMessage}
            disabled={!isConnected}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} disabled={!isConnected}>
            发送
          </Button>
        </div>

        {/* 消息列表和日志 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text strong>📋 消息记录 ({messages.length})</Text>
            <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50 mt-1">
              {messages.length === 0 ? (
                <Text type="secondary">暂无消息</Text>
              ) : (
                <List
                  size="small"
                  dataSource={messages}
                  renderItem={(item) => (
                    <List.Item>
                      <div className="w-full">
                        <div className="flex justify-between">
                          <Tag color={item.type === 'sent' ? 'blue' : item.type === 'ack' ? 'green' : 'orange'}>
                            {item.type === 'sent' ? '发送' : item.type === 'ack' ? '回执' : '接收'}
                          </Tag>
                          <Text type="secondary" className="text-xs">
                            {item.timestamp.toLocaleTimeString()}
                          </Text>
                        </div>
                        <Text className="text-sm">{item.content}</Text>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Text strong>📊 日志 ({logs.length})</Text>
              <Button size="small" onClick={clearLogs}>清空</Button>
            </div>
            <div className="h-64 overflow-y-auto border rounded p-2 bg-black text-green-400 font-mono text-xs mt-1">
              {logs.length === 0 ? (
                <Text type="secondary">暂无日志</Text>
              ) : (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WebSocketTest;
