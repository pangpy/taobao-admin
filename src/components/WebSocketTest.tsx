import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Typography, Upload, message, Image } from 'antd';
import { SendOutlined, UserOutlined, PlusOutlined, FilePdfOutlined, FileWordOutlined, FileOutlined, VideoCameraOutlined, PhoneOutlined, AudioMutedOutlined } from '@ant-design/icons';

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

const maskToken = (token: string): string => {
  if (!token || token.length < 12) return '***';
  return `${token.substring(0, 6)}...${token.substring(token.length - 6)}`;
};

const USER_CONFIGS = {
  userA: { id: 2, name: '用户2', role: 'user' },
  userB: { id: 3, name: '用户3', role: 'admin' },
};

type UserKey = 'userA' | 'userB';

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

const FileIcon: React.FC<{ fileName?: string; fileMime?: string }> = ({ fileName, fileMime }) => {
  if (isPdfFile(fileMime, fileName)) return <FilePdfOutlined className="text-2xl text-red-500" />;
  if (isWordFile(fileMime, fileName)) return <FileWordOutlined className="text-2xl text-blue-600" />;
  if (isVideoFile(fileMime, fileName)) return <VideoCameraOutlined className="text-2xl text-purple-500" />;
  return <FileOutlined className="text-2xl text-gray-500" />;
};

const getUploadToken = (): string => {
  return import.meta.env.VITE_ACCESS_TOKEN || localStorage.getItem('access_token') || '';
};

const WebSocketTest: React.FC = () => {
  const [isConnectedA, setIsConnectedA] = useState(false);
  const [messagesA, setMessagesA] = useState<Message[]>([]);
  const [inputMessageA, setInputMessageA] = useState('');
  const wsRefA = useRef<WebSocket | null>(null);
  const [uploadingA, setUploadingA] = useState(false);

  const [isConnectedB, setIsConnectedB] = useState(false);
  const [messagesB, setMessagesB] = useState<Message[]>([]);
  const [inputMessageB, setInputMessageB] = useState('');
  const wsRefB = useRef<WebSocket | null>(null);
  const [uploadingB, setUploadingB] = useState(false);

  const [roomId, setRoomId] = useState('test-room-001');

  // ============ WebRTC 语音+视频通话状态 ============
  const [inCallA, setInCallA] = useState(false);
  const [mutedA, setMutedA] = useState(false);
  const [videoOnA, setVideoOnA] = useState(false);
  const [remoteVideoA, setRemoteVideoA] = useState(false);
  const pcRefA = useRef<RTCPeerConnection | null>(null);
  const localStreamRefA = useRef<MediaStream | null>(null);
  const localVideoRefA = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefA = useRef<HTMLVideoElement | null>(null);
  const remoteStreamRefA = useRef<MediaStream | null>(null);

  const [inCallB, setInCallB] = useState(false);
  const [mutedB, setMutedB] = useState(false);
  const [videoOnB, setVideoOnB] = useState(false);
  const [remoteVideoB, setRemoteVideoB] = useState(false);
  const pcRefB = useRef<RTCPeerConnection | null>(null);
  const localStreamRefB = useRef<MediaStream | null>(null);
  const localVideoRefB = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefB = useRef<HTMLVideoElement | null>(null);
  const remoteStreamRefB = useRef<MediaStream | null>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // ============ 绑定 video 元素 srcObject ============
  useEffect(() => {
    if (localVideoRefA.current && localStreamRefA.current) {
      localVideoRefA.current.srcObject = localStreamRefA.current;
    }
  }, [inCallA]);

  useEffect(() => {
    if (localVideoRefB.current && localStreamRefB.current) {
      localVideoRefB.current.srcObject = localStreamRefB.current;
    }
  }, [inCallB]);

  useEffect(() => {
    if (remoteVideoRefA.current && remoteStreamRefA.current) {
      remoteVideoRefA.current.srcObject = remoteStreamRefA.current;
    }
  }, [remoteVideoA]);

  useEffect(() => {
    if (remoteVideoRefB.current && remoteStreamRefB.current) {
      remoteVideoRefB.current.srcObject = remoteStreamRefB.current;
    }
  }, [remoteVideoB]);

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
            if (isA) setMessagesA(prev => [...prev, msg]);
            else setMessagesB(prev => [...prev, msg]);
            return;
          }

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

          if (isA) setMessagesA(prev => [...prev, msg]);
          else setMessagesB(prev => [...prev, msg]);
        } catch (e) {}
      };

      websocket.onerror = () => setConnected(false);
      websocket.onclose = () => {
        setConnected(false);
        wsRef.current = null;
      };
    } catch (error) {}
  };

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
  // WebRTC 信令
  // ============================================================
  const sendSignal = (userKey: UserKey, type: string, payload: any) => {
    const wsRef = userKey === 'userA' ? wsRefA : wsRefB;
    const targetUser = userKey === 'userA' ? USER_CONFIGS.userB : USER_CONFIGS.userA;
    wsRef.current?.send(JSON.stringify({
      type, payload,
      to_user_id: targetUser.id,
      to_role: targetUser.role,
    }));
  };

  const handleSignal = async (userKey: UserKey, data: any) => {
    const isA = userKey === 'userA';
    const pcRef = isA ? pcRefA : pcRefB;
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
  // 发起通话（withVideo: true 视频，false 语音）
  // ============================================================
  const startCall = async (userKey: UserKey, withVideo: boolean = false) => {
    try {
      const isA = userKey === 'userA';
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });

      if (isA) {
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
        const remoteStream = event.streams[0];
        if (isA) {
          remoteStreamRefA.current = remoteStream;
        } else {
          remoteStreamRefB.current = remoteStream;
        }
        // 检测是否有视频轨
        if (remoteStream.getVideoTracks().length > 0) {
          if (isA) setRemoteVideoA(true);
          else setRemoteVideoB(true);
        }
        // 音频自动播放
        if (remoteStream.getAudioTracks().length > 0) {
          const audio = new Audio();
          audio.srcObject = remoteStream;
          audio.autoplay = true;
        }
      };

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      if (isA) {
        pcRefA.current = pc;
        setVideoOnA(withVideo);
      } else {
        pcRefB.current = pc;
        setVideoOnB(withVideo);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(userKey, 'webrtc_offer', offer);

      if (isA) setInCallA(true);
      else setInCallB(true);
    } catch (e) {
      message.error('无法访问麦克风/摄像头');
    }
  };

  const hangUp = (userKey: UserKey) => {
    const isA = userKey === 'userA';
    const pcRef = isA ? pcRefA : pcRefB;
    const localStreamRef = isA ? localStreamRefA : localStreamRefB;

    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    if (isA) {
      setInCallA(false);
      setRemoteVideoA(false);
      remoteStreamRefA.current = null;
    } else {
      setInCallB(false);
      setRemoteVideoB(false);
      remoteStreamRefB.current = null;
    }
  };

  const toggleMute = (userKey: UserKey) => {
    const isA = userKey === 'userA';
    const localStreamRef = isA ? localStreamRefA : localStreamRefB;
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    if (isA) setMutedA(!mutedA);
    else setMutedB(!mutedB);
  };

  const toggleVideo = (userKey: UserKey) => {
    const isA = userKey === 'userA';
    const localStreamRef = isA ? localStreamRefA : localStreamRefB;
    localStreamRef.current?.getVideoTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    if (isA) setVideoOnA(!videoOnA);
    else setVideoOnB(!videoOnB);
  };

  // ============================================================
  // 上传文件
  // ============================================================
  const uploadFile = async (file: File, userKey: UserKey): Promise<{ url: string; filename: string; size: number; mime: string } | null> => {
    const isA = userKey === 'userA';
    const setUploading = isA ? setUploadingA : setUploadingB;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = getUploadToken();
      const response = await fetch('https://api.apiscode.org/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (result.code === 200) {
        return { url: result.data.url, filename: result.data.filename, size: result.data.size, mime: result.data.mime };
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
    } catch (e) {}
  };

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
      wsRef.current.send(JSON.stringify({
        content: inputMessage,
        to_user_id: targetUser.id,
        to_role: targetUser.role,
      }));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'sent',
        content: inputMessage,
        timestamp: new Date(),
        fromUserId: currentUser.id,
        toUserId: targetUser.id,
      }]);
      setInputMessage('');
    } catch (e) {}
  };

  // ============================================================
  // 渲染
  // ============================================================
  const renderFileContent = (item: Message) => {
    if (isImageFile(item.fileMime, item.fileName) && item.fileUrl) {
      return (
        <Image src={item.fileUrl} alt={item.fileName}
          className="max-w-full rounded cursor-pointer"
          style={{ maxHeight: 200 }} preview={{ mask: '点击查看大图' }} />
      );
    }
    if (isVideoFile(item.fileMime, item.fileName) && item.fileUrl) {
      return (
        <div className="w-full max-w-[280px]">
          <video controls className="w-full rounded" style={{ maxHeight: 200 }} preload="metadata">
            <source src={item.fileUrl} type={item.fileMime || 'video/mp4'} />
          </video>
          <div className="text-xs text-gray-400 mt-1 truncate">{item.fileName}</div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
        onClick={() => item.fileUrl && window.open(item.fileUrl, '_blank')} title="点击打开/下载文件">
        <FileIcon fileName={item.fileName} fileMime={item.fileMime} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{item.fileName || '未知文件'}</div>
          <div className="text-xs text-gray-400">{item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : ''}</div>
        </div>
      </div>
    );
  };

  const renderMessages = (messages: Message[], userKey: UserKey) => {
    const currentUser = USER_CONFIGS[userKey];
    const otherUser = userKey === 'userA' ? USER_CONFIGS.userB : USER_CONFIGS.userA;
    return (
      <div className="h-80 overflow-y-auto p-3 bg-gray-100 rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">暂无消息，开始聊天吧 💬</div>
        ) : messages.map((item) => {
          if (item.type === 'ack') {
            return <div key={item.id} className="text-center text-xs text-gray-400 py-1">{item.content}</div>;
          }
          const isMine = item.type === 'sent' ||
            (item.type === 'file' && item.fromUserId === currentUser.id) ||
            (item.fromUserId === currentUser.id);
          const displayName = isMine ? currentUser.name : otherUser.name;
          const time = item.timestamp.toLocaleTimeString();
          if (item.type === 'file') {
            return (
              <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                {!isMine && <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2">{displayName.charAt(0)}</div>}
                <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                  {!isMine && <div className="text-xs text-gray-500 mb-0.5 ml-1">{displayName}</div>}
                  <div className={`rounded-lg p-2 ${isMine ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'}`}>
                    {renderFileContent(item)}
                  </div>
                  <div className={`text-xs text-gray-400 mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}>{time}</div>
                </div>
                {isMine && <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-2 order-3">{displayName.charAt(0)}</div>}
              </div>
            );
          }
          return (
            <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
              {!isMine && <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2">{displayName.charAt(0)}</div>}
              <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                {!isMine && <div className="text-xs text-gray-500 mb-0.5 ml-1">{displayName}</div>}
                <div className={`rounded-lg px-3 py-2 break-words ${isMine ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                  {item.content}
                </div>
                <div className={`text-xs text-gray-400 mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}>{time}</div>
              </div>
              {isMine && <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-2 order-3">{displayName.charAt(0)}</div>}
            </div>
          );
        })}
      </div>
    );
  };

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
    const videoOn = isA ? videoOnA : videoOnB;
    const remoteVideo = isA ? remoteVideoA : remoteVideoB;
    const localVideoRef = isA ? localVideoRefA : localVideoRefB;
    const remoteVideoRef = isA ? remoteVideoRefA : remoteVideoRefB;

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
              <Button size="small" type="primary" onClick={() => connectUser(userKey)}>连接</Button>
            ) : (
              <Button size="small" danger onClick={() => disconnectUser(userKey)}>断开</Button>
            )}
          </div>
        }
      >
        <div className="space-y-2">
          <div className="flex gap-4 text-sm text-gray-500">
            <span>角色: {user.role}</span>
            <span>对话: {targetUser.name}</span>
          </div>

          {/* ============ 通话按钮 ============ */}
          <div className="flex gap-2 mb-2">
            {isConnected && !inCall ? (
              <>
                <Button icon={<PhoneOutlined />} onClick={() => startCall(userKey, false)}>语音</Button>
                <Button icon={<VideoCameraOutlined />} onClick={() => startCall(userKey, true)}>视频</Button>
              </>
            ) : isConnected && inCall ? (
              <div className="flex gap-2 flex-wrap">
                <Button icon={<AudioMutedOutlined />} onClick={() => toggleMute(userKey)}>
                  {muted ? '取消静音' : '静音'}
                </Button>
                {videoOn && (
                  <Button icon={<VideoCameraOutlined />} onClick={() => toggleVideo(userKey)}>
                    关闭视频
                  </Button>
                )}
                <Button danger onClick={() => hangUp(userKey)}>挂断</Button>
              </div>
            ) : null}
          </div>

          {/* ============ 视频画面 ============ */}
          {inCall && (
            <div className="relative bg-black rounded-lg mb-2" style={{ minHeight: 200 }}>
              {/* 远程视频（大） */}
              {remoteVideo ? (
                <video ref={remoteVideoRef} autoPlay playsInline
                  className="w-full rounded-lg" style={{ maxHeight: 200 }} />
              ) : (
                <div className="flex items-center justify-center h-48 text-white text-sm">
                  {videoOn ? '等待对方视频...' : '语音通话中...'}
                </div>
              )}
              {/* 本地视频（小窗） */}
              {videoOn && (
                <video ref={localVideoRef} autoPlay playsInline muted
                  className="absolute bottom-2 right-2 w-24 h-18 rounded border-2 border-white bg-gray-800 object-cover" />
              )}
            </div>
          )}

          {renderMessages(messages, userKey)}

          <div className="flex gap-2 mt-2">
            <Upload showUploadList={false} beforeUpload={(file) => handleFileSelect(file, userKey)}
              accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.pdf,.doc,.docx" disabled={!isConnected || uploading}>
              <Button icon={<PlusOutlined />} disabled={!isConnected || uploading} loading={uploading} title="发送文件" />
            </Upload>
            <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`发给 ${targetUser.name}...`} onPressEnter={() => sendMessage(userKey)}
              disabled={!isConnected} className="flex-1" />
            <Button type="primary" icon={<SendOutlined />} onClick={() => sendMessage(userKey)} disabled={!isConnected}>
              发送
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  useEffect(() => {
    return () => {
      if (wsRefA.current) wsRefA.current.close();
      if (wsRefB.current) wsRefB.current.close();
    };
  }, []);

  return (
    <div className="p-4 max-w-full mx-auto">
      <Card title="💬 WebSocket 双人聊天" className="shadow-lg">
        <div className="flex gap-4 mb-4 items-center">
          <div>
            <Text type="secondary">房间 ID</Text>
            <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="room_id" className="w-48" />
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
