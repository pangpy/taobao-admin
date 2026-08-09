import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Tag, Tabs } from 'antd';
import { WifiOutlined, SendOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Message {
  id: string;
  type: 'sent' | 'received' | 'ack';
  content: string;
  timestamp: Date;
  fromUserId?: number;
  toUserId?: number;
}

// 安全显示 token
const maskToken = (token: string): string => {
  if (!token || token.length < 12) return '***';
  return `${token.substring(0, 6)}...${token.substring(token.length - 6)}`;
};

// 用户配置
const USER_CONFIGS = {
  userA: { id: 2, name: '用户2', role: 'user' },
  userB: { id: 3, name: '用户3', role: 'admin' },
};

type UserKey = 'userA' | 'userB';

const WebSocketTest: React.FC = () => {
  // ============ 用户A 状态 ============
  const [isConnectedA, setIsConnectedA] = useState(false);
  const [messagesA, setMessagesA] = useState<Message[]>([]);
  const [inputMessageA, setInputMessageA] = useState('');
  const wsRefA = useRef<WebSocket | null>(null);

  // ============ 用户B 状态 ============
  const [isConnectedB, setIsConnectedB] = useState(false);
  const [messagesB, setMessagesB] = useState<Message[]>([]);
  const [inputMessageB, setInputMessageB] = useState('');
  const wsRefB = useRef<WebSocket | null>(null);

  const [roomId, setRoomId] = useState('test-room-001');

  // ============================================================
  // 通用连接函数
  // ============================================================
  const connectUser = (userKey: UserKey) => {
    const user = USER_CONFIGS[userKey];
    const isA = userKey === 'userA';
    const setConnected = isA ? setIsConnectedA : setIsConnectedB;
    const wsRef = isA ? wsRefA : wsRefB;

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const token = import.meta.env.VITE_ACCESS_TOKEN;
      if (!token) return;

      const wsUrl = `wss://api.apiscode.org/api/wsproxy?sub_user_id=${user.id}&role=${user.role}&room_id=${roomId}&token=${encodeURIComponent(token)}`;

      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        setConnected(true);
        wsRef.current = websocket;
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const msg: Message = {
            id: Date.now().toString(),
            type: data.type === 'ack' ? 'ack' : 'received',
            content: data.type === 'ack' ? '✅ 已送达' : (data.content || JSON.stringify(data)),
            timestamp: new Date(),
            fromUserId: data.from,
            toUserId: data.to
          };
          
          if (isA) {
            setMessagesA(prev => [...prev, msg]);
          } else {
            setMessagesB(prev => [...prev, msg]);
          }
        } catch (e) {
          // 忽略解析错误
        }
      };

      websocket.onerror = () => {
        setConnected(false);
      };

      websocket.onclose = () => {
        setConnected(false);
        wsRef.current = null;
      };

    } catch (error) {
      // 忽略
    }
  };

  // ============================================================
  // 断开连接
  // ============================================================
  const disconnectUser = (userKey: UserKey) => {
    const isA = userKey === 'userA';
    const wsRef = isA ? wsRefA : wsRefB;
    const setConnected = isA ? setIsConnectedA : setIsConnectedB;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  };

  // ============================================================
  // 发送消息
  // ============================================================
  const sendMessage = (userKey: UserKey) => {
    const isA = userKey === 'userA';
    const wsRef = isA ? wsRefA : wsRefB;
    const setMessages = isA ? setMessagesA : setMessagesB;
    const inputMessage = isA ? inputMessageA : inputMessageB;
    const setInputMessage = isA ? setInputMessageA : setInputMessageB;
    const currentUser = USER_CONFIGS[userKey];
    const targetUser = isA ? USER_CONFIGS.userB : USER_CONFIGS.userA;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!inputMessage.trim()) return;

    try {
      const msg = {
        content: inputMessage,
        to_user_id: targetUser.id,
        to_role: targetUser.role
      };
      wsRef.current.send(JSON.stringify(msg));
      
      const newMsg: Message = {
        id: Date.now().toString(),
        type: 'sent',
        content: inputMessage,
        timestamp: new Date(),
        fromUserId: currentUser.id,
        toUserId: targetUser.id
      };
      setMessages(prev => [...prev, newMsg]);
      setInputMessage('');
    } catch (e) {
      // 忽略
    }
  };

  // ============================================================
  // 渲染消息列表
  // ============================================================
  const renderMessages = (messages: Message[], userKey: UserKey) => {
    const currentUser = USER_CONFIGS[userKey];
    const otherUser = userKey === 'userA' ? USER_CONFIGS.userB : USER_CONFIGS.userA;
    
    return (
      <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50 mt-1">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">暂无消息，开始聊天吧</div>
        ) : (
          messages.map((item) => {
            const isSent = item.type === 'sent';
            const isAck = item.type === 'ack';
            const label = isSent ? `${currentUser.name} → ${otherUser.name}` : 
                          isAck ? '✅ 已送达' : 
                          `${otherUser.name} → ${currentUser.name}`;
            const color = isSent ? 'blue' : isAck ? 'green' : 'orange';
            
            return (
              <div key={item.id} className="flex justify-between items-start border-b border-gray-100 py-1.5 px-2 hover:bg-gray-100">
                <div className="flex-1">
                  <Tag color={color} size="small">{label}</Tag>
                  <span className="text-sm ml-1">{item.content}</span>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // ============================================================
  // 渲染单个用户面板
  // ============================================================
  const renderUserPanel = (userKey: UserKey) => {
    const user = USER_CONFIGS[userKey];
    const isA = userKey === 'userA';
    const isConnected = isA ? isConnectedA : isConnectedB;
    const messages = isA ? messagesA : messagesB;
    const inputMessage = isA ? inputMessageA : inputMessageB;
    const setInputMessage = isA ? setInputMessageA : setInputMessageB;
    const targetUser = isA ? USER_CONFIGS.userB : USER_CONFIGS.userA;

    return (
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span><UserOutlined /> {user.name} (ID:{user.id})</span>
            <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
              {isConnected ? '🟢 在线' : '🔴 离线'}
            </span>
          </div>
        }
        className="h-full"
        extra={
          <div className="flex gap-2">
            {!isConnected ? (
              <Button size="small" type="primary" onClick={() => connectUser(userKey)}>
                连接
              </Button>
            ) : (
              <Button size="small" danger onClick={() => disconnectUser(userKey)}>
                断开
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-2">
          <div className="flex gap-4 text-sm text-gray-500">
            <span>角色: {user.role}</span>
            <span>对话: {targetUser.name}</span>
          </div>
          
          {renderMessages(messages, userKey)}
          
          <div className="flex gap-2 mt-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`发给 ${targetUser.name}...`}
              onPressEnter={() => sendMessage(userKey)}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => sendMessage(userKey)}
              disabled={!isConnected}
            >
              发送
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // ============================================================
  // 清理
  // ============================================================
  useEffect(() => {
    return () => {
      if (wsRefA.current) wsRefA.current.close();
      if (wsRefB.current) wsRefB.current.close();
    };
  }, []);

  // ============================================================
  // 主界面
  // ============================================================
  return (
    <div className="p-4 max-w-full mx-auto">
      <Card title="💬 WebSocket 双人聊天" className="shadow-lg">
        <div className="flex gap-4 mb-4 items-center">
          <div>
            <Text type="secondary">房间 ID</Text>
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="room_id"
              className="w-48"
            />
          </div>
          <div className="text-xs text-gray-400">
            Token: {maskToken(import.meta.env.VITE_ACCESS_TOKEN || '')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderUserPanel('userA')}
          {renderUserPanel('userB')}
        </div>
      </Card>
    </div>
  );
};

export default WebSocketTest;
