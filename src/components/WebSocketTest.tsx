import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Typography, Upload, message, Modal, Image } from 'antd';
import { SendOutlined, UserOutlined, PlusOutlined, FileImageOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Text } = Typography;

interface Message {
  id: string;
  type: 'sent' | 'received' | 'ack' | 'file';
  content: string;
  timestamp: Date;
  fromUserId?: number;
  toUserId?: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMime?: string;
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

// ============================================================
// 判断文件类型是否为图片
// ============================================================
const isImageFile = (mime?: string, name?: string): boolean => {
  if (mime && mime.startsWith('image/')) return true;
  const ext = name?.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
};

// ============================================================
// 获取上传凭证（从环境变量或API获取）
// ============================================================
const getUploadToken = (): string => {
  // 这里需要替换为实际的token获取方式
  return import.meta.env.VITE_ACCESS_TOKEN || localStorage.getItem('access_token') || '';
};

const WebSocketTest: React.FC = () => {
  // ============ 用户A 状态 ============
  const [isConnectedA, setIsConnectedA] = useState(false);
  const [messagesA, setMessagesA] = useState<Message[]>([]);
  const [inputMessageA, setInputMessageA] = useState('');
  const wsRefA = useRef<WebSocket | null>(null);
  const [uploadingA, setUploadingA] = useState(false);

  // ============ 用户B 状态 ============
  const [isConnectedB, setIsConnectedB] = useState(false);
  const [messagesB, setMessagesB] = useState<Message[]>([]);
  const [inputMessageB, setInputMessageB] = useState('');
  const wsRefB = useRef<WebSocket | null>(null);
  const [uploadingB, setUploadingB] = useState(false);

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
          // 处理文件消息
          if (data.type === 'file') {
            const msg: Message = {
              id: Date.now().toString(),
              type: 'file',
              content: data.content || `[文件] ${data.file_name || ''}`,
              timestamp: new Date(),
              fromUserId: data.from,
              toUserId: data.to,
              fileUrl: data.file_url,
              fileName: data.file_name,
              fileSize: data.file_size,
              fileMime: data.file_mime,
            };
            if (isA) {
              setMessagesA(prev => [...prev, msg]);
            } else {
              setMessagesB(prev => [...prev, msg]);
            }
            return;
          }

          const msg: Message = {
            id: Date.now().toString(),
            type: data.type === 'ack' ? 'ack' : 'received',
            content: data.type === 'ack' ? '✅ 已送达' : (data.content || JSON.stringify(data)),
            timestamp: new Date(),
            fromUserId: data.from,
            toUserId: data.to,
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
  // 上传文件到后端
  // ============================================================
  const uploadFile = async (file: File, userKey: UserKey): Promise<{ url: string; filename: string; size: number; mime: string } | null> => {
    const isA = userKey === 'userA';
    const setUploading = isA ? setUploadingA : setUploadingB;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getUploadToken();
      
      const response = await fetch('https://api.apiscode.org/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.code === 200) {
        return {
          url: result.data.url,
          filename: result.data.filename,
          size: result.data.size,
          mime: result.data.mime,
        };
      } else {
        message.error(result.message || '上传失败');
        return null;
      }
    } catch (error) {
      message.error('上传失败，请检查网络连接');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // 发送文件消息（通过WebSocket通知对方）
  // ============================================================
  const sendFileMessage = (userKey: UserKey, fileInfo: { url: string; filename: string; size: number; mime: string }) => {
    const isA = userKey === 'userA';
    const wsRef = isA ? wsRefA : wsRefB;
    const setMessages = isA ? setMessagesA : setMessagesB;
    const currentUser = USER_CONFIGS[userKey];
    const targetUser = isA ? USER_CONFIGS.userB : USER_CONFIGS.userA;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    try {
      const msg = {
        type: 'file',
        content: `[文件] ${fileInfo.filename}`,
        file_url: fileInfo.url,
        file_name: fileInfo.filename,
        file_size: fileInfo.size,
        file_mime: fileInfo.mime,
        to_user_id: targetUser.id,
        to_role: targetUser.role,
      };
      wsRef.current.send(JSON.stringify(msg));

      const newMsg: Message = {
        id: Date.now().toString(),
        type: 'file',
        content: `[文件] ${fileInfo.filename}`,
        timestamp: new Date(),
        fromUserId: currentUser.id,
        toUserId: targetUser.id,
        fileUrl: fileInfo.url,
        fileName: fileInfo.filename,
        fileSize: fileInfo.size,
        fileMime: fileInfo.mime,
      };
      setMessages(prev => [...prev, newMsg]);
    } catch (e) {
      // 忽略
    }
  };

  // ============================================================
  // 处理文件选择
  // ============================================================
  const handleFileSelect = async (file: File, userKey: UserKey) => {
    // 文件大小限制 2MB
    if (file.size > 2 * 1024 * 1024) {
      message.error('文件大小不能超过2MB');
      return false;
    }

    // 显示上传提示
    const hide = message.loading('正在上传...', 0);
    
    const result = await uploadFile(file, userKey);
    hide();

    if (result) {
      sendFileMessage(userKey, result);
      message.success('文件发送成功');
    }

    return false; // 阻止默认上传行为
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
  // 渲染消息（微信风格 + 文件消息）
  // ============================================================
  const renderMessages = (messages: Message[], userKey: UserKey) => {
    const currentUser = USER_CONFIGS[userKey];
    const otherUser = userKey === 'userA' ? USER_CONFIGS.userB : USER_CONFIGS.userA;

    return (
      <div className="h-80 overflow-y-auto p-3 bg-gray-100 rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">暂无消息，开始聊天吧 💬</div>
        ) : (
          messages.map((item) => {
            // ack 消息不显示气泡
            if (item.type === 'ack') {
              return (
                <div key={item.id} className="text-center text-xs text-gray-400 py-1">
                  {item.content}
                </div>
              );
            }

            const isMine = item.type === 'sent' || item.type === 'file' || 
              (item.fromUserId === currentUser.id);
            const displayName = isMine ? currentUser.name : otherUser.name;
            const time = item.timestamp.toLocaleTimeString();

            // 文件消息
            if (item.type === 'file') {
              const isImage = isImageFile(item.fileMime, item.fileName);
              return (
                <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                  {!isMine && (
                    <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2">
                      {displayName.charAt(0)}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                    {!isMine && (
                      <div className="text-xs text-gray-500 mb-0.5 ml-1">{displayName}</div>
                    )}
                    <div className={`rounded-lg p-2 ${isMine ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'}`}>
                      {isImage && item.fileUrl ? (
                        <Image
                          src={item.fileUrl}
                          alt={item.fileName}
                          className="max-w-full rounded cursor-pointer"
                          style={{ maxHeight: 200 }}
                          preview={{ mask: '点击查看大图' }}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <FileImageOutlined className="text-2xl text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {item.fileName || '未知文件'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : ''}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`text-xs text-gray-400 mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}>
                      {time}
                    </div>
                  </div>
                  {isMine && (
                    <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-2 order-3">
                      {displayName.charAt(0)}
                    </div>
                  )}
                </div>
              );
            }

            // 普通文本消息
            const displayContent = item.content;
            return (
              <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                {!isMine && (
                  <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2">
                    {displayName.charAt(0)}
                  </div>
                )}
                <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                  {!isMine && (
                    <div className="text-xs text-gray-500 mb-0.5 ml-1">{displayName}</div>
                  )}
                  <div className={`rounded-lg px-3 py-2 break-words ${
                    isMine 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}>
                    {displayContent}
                  </div>
                  <div className={`text-xs text-gray-400 mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}>
                    {time}
                  </div>
                </div>
                {isMine && (
                  <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-2 order-3">
                    {displayName.charAt(0)}
                  </div>
                )}
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
    const uploading = isA ? uploadingA : uploadingB;
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
            {/* ============ + 号上传按钮 ============ */}
            <Upload
              showUploadList={false}
              beforeUpload={(file) => handleFileSelect(file, userKey)}
              accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.pdf,.doc,.docx"
              disabled={!isConnected || uploading}
            >
              <Button
                icon={<PlusOutlined />}
                disabled={!isConnected || uploading}
                loading={uploading}
                title="发送文件"
              />
            </Upload>

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
