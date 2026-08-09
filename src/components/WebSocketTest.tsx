import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Typography, Upload, message, Image } from 'antd';
import { SendOutlined, UserOutlined, PlusOutlined, FileImageOutlined, FilePdfOutlined, FileWordOutlined, FileOutlined, VideoCameraOutlined, PhoneOutlined, AudioMutedOutlined } from '@ant-design/icons';

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
// 判断文件类型
// ============================================================
const isImageFile = (mime?: string, name?: string): boolean => {
  if (mime && mime.startsWith('image/')) return true;
  const ext = name?.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
};

const isVideoFile = (mime?: string, name?: string): boolean => {
  if (mime && mime.startsWith('video/')) return true;
  const ext = name?.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'webm', 'avi'].includes(ext || '');
};

const isPdfFile = (mime?: string, name?: string): boolean => {
  if (mime === 'application/pdf') return true;
  const ext = name?.split('.').pop()?.toLowerCase();
  return ext === 'pdf';
};

const isWordFile = (mime?: string, name?: string): boolean => {
  if (mime && (mime.includes('word') || mime.includes('msword') || mime.includes('document'))) return true;
  const ext = name?.split('.').pop()?.toLowerCase();
  return ['doc', 'docx'].includes(ext || '');
};

// ============================================================
// 文件图标组件
// ============================================================
const FileIcon: React.FC<{ fileName?: string; fileMime?: string }> = ({ fileName, fileMime }) => {
  if (isPdfFile(fileMime, fileName)) return <FilePdfOutlined className="text-2xl text-red-500" />;
  if (isWordFile(fileMime, fileName)) return <FileWordOutlined className="text-2xl text-blue-600" />;
  if (isVideoFile(fileMime, fileName)) return <VideoCameraOutlined className="text-2xl text-purple-500" />;
  return <FileOutlined className="text-2xl text-gray-500" />;
};

// ============================================================
// 获取上传凭证
// ============================================================
const getUploadToken = (): string => {
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

  // ============ WebRTC 语音通话状态 ============
  const [inCallA, setInCallA] = useState(false);
  const [mutedA, setMutedA] = useState(false);
  const pcRefA = useRef<RTCPeerConnection | null>(null);
  const localStreamRefA = useRef<MediaStream | null>(null);

  const [inCallB, setInCallB] = useState(false);
  const [mutedB, setMutedB] = useState(false);
  const pcRefB = useRef<RTCPeerConnection | null>(null);
  const localStreamRefB = useRef<MediaStream | null>(null);

  // ============================================================
  // WebRTC 配置
  // ============================================================
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

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

          // 处理 WebRTC 信令
          if (['webrtc_offer', 'webrtc_answer', 'webrtc_ice'].includes(data.type)) {
            const currentUserKey: UserKey = isA ? 'userA' : 'userB';
            handleSignal(currentUserKey, data);
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
  // 发送信令
  // ============================================================
  const sendSignal = (userKey: UserKey, type: string, payload: any) => {
    const wsRef = userKey === 'userA' ? wsRefA : wsRefB;
    const targetUser = userKey === 'userA' ? USER_CONFIGS.userB : USER_CONFIGS.userA;
    wsRef.current?.send(JSON.stringify({
      type,
      payload,
      to_user_id: targetUser.id,
      to_role: targetUser.role,
    }));
  };

  // ============================================================
  // 处理信令
  // ============================================================
  const handleSignal = async (userKey: UserKey, data: any) => {
    const pcRef = userKey === 'userA' ? pcRefA : pcRefB;
    const pc = pcRef.current;
    if (!pc) return;

    try {
      if (data.type === 'webrtc_offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(userKey, 'webrtc_answer', answer);
      } else if (data.type === 'webrtc_answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
      } else if (data.type === 'webrtc_ice') {
        await pc.addIceCandidate(new RTCIceCandidate(data.payload));
      }
    } catch (e) {
      console.error('信令处理失败:', e);
    }
  };

  // ============================================================
  // 发起/接听通话
  // ============================================================
  const startCall = async (userKey: UserKey) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (userKey === 'userA') {
        localStreamRefA.current = stream;
      } else {
        localStreamRefB.current = stream;
      }

      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(userKey, 'webrtc_ice', event.candidate);
        }
      };

      pc.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
      };

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      if (userKey === 'userA') pcRefA.current = pc;
      else pcRefB.current = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(userKey, 'webrtc_offer', offer);

      if (userKey === 'userA') setInCallA(true);
      else setInCallB(true);
    } catch (e) {
      message.error('无法访问麦克风');
    }
  };

  // ============================================================
  // 挂断
  // ============================================================
  const hangUp = (userKey: UserKey) => {
    const pcRef = userKey === 'userA' ? pcRefA : pcRefB;
    const localStreamRef = userKey === 'userA' ? localStreamRefA : localStreamRefB;
    const setInCall = userKey === 'userA' ? setInCallA : setInCallB;

    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    setInCall(false);
  };

  // ============================================================
  // 静音
  // ============================================================
  const toggleMute = (userKey: UserKey) => {
    const localStreamRef = userKey === 'userA' ? localStreamRefA : localStreamRefB;
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    if (userKey === 'userA') setMutedA(!mutedA);
    else setMutedB(!mutedB);
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
    if (file.size > 2 * 1024 * 1024) {
      message.error('文件大小不能超过2MB');
      return false;
    }

    const hide = message.loading('正在上传...', 0);

    const result = await uploadFile(file, userKey);
    hide();

    if (result) {
      sendFileMessage(userKey, result);
      message.success('文件发送成功');
    }

    return false;
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
  // 渲染文件内容（根据类型）
  // ============================================================
  const renderFileContent = (item: Message) => {
    if (isImageFile(item.fileMime, item.fileName) && item.fileUrl) {
      return (
        <Image
          src={item.fileUrl}
          alt={item.fileName}
          className="max-w-full rounded cursor-pointer"
          style={{ maxHeight: 200 }}
          preview={{ mask: '点击查看大图' }}
        />
      );
    }

    if (isVideoFile(item.fileMime, item.fileName) && item.fileUrl) {
      return (
        <div className="w-full max-w-[280px]">
          <video
            controls
            className="w-full rounded"
            style={{ maxHeight: 200 }}
            preload="metadata"
          >
            <source src={item.fileUrl} type={item.fileMime || 'video/mp4'} />
            您的浏览器不支持视频播放
          </video>
          <div className="text-xs text-gray-400 mt-1 truncate">
            {item.fileName}
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => item.fileUrl && window.open(item.fileUrl, '_blank')}
        title="点击打开/下载文件"
      >
        <FileIcon fileName={item.fileName} fileMime={item.fileMime} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {item.fileName || '未知文件'}
          </div>
          <div className="text-xs text-gray-400">
            {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : ''}
          </div>
        </div>
      </div>
    );
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

            if (item.type === 'file') {
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
                      {renderFileContent(item)}
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
    const inCall = isA ? inCallA : inCallB;
    const muted = isA ? mutedA : mutedB;

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

          {/* ============ 语音通话按钮 ============ */}
          <div className="flex gap-2 mb-2">
            {isConnected && (
              !inCall ? (
                <Button icon={<PhoneOutlined />} onClick={() => startCall(userKey)}>
                  语音通话
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button icon={<AudioMutedOutlined />} onClick={() => toggleMute(userKey)}>
                    {muted ? '取消静音' : '静音'}
                  </Button>
                  <Button danger onClick={() => hangUp(userKey)}>挂断</Button>
                </div>
              )
            )}
          </div>

          {renderMessages(messages, userKey)}

          <div className="flex gap-2 mt-2">
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
