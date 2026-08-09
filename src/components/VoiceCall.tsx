// components/VoiceCall.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { PhoneOutlined, AudioMutedOutlined } from '@ant-design/icons';

interface Props {
  wsRef: React.RefObject<WebSocket | null>;
  targetUserId: number;
  targetRole: string;
}

const VoiceCall: React.FC<Props> = ({ wsRef, targetUserId, targetRole }) => {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // WebRTC 配置（STUN/TURN 在这里）
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // 监听 WebSocket 信令
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const handleMessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      // 只处理 WebRTC 相关消息
      if (!['webrtc_offer', 'webrtc_answer', 'webrtc_ice'].includes(data.type)) return;
      if (data.from === targetUserId || data.to === targetUserId) {
        await handleSignal(data);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [targetUserId]);

  // 处理信令
  const handleSignal = async (data: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      if (data.type === 'webrtc_offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal('webrtc_answer', answer);
      } else if (data.type === 'webrtc_answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
      } else if (data.type === 'webrtc_ice') {
        await pc.addIceCandidate(new RTCIceCandidate(data.payload));
      }
    } catch (e) {
      console.error('信令处理失败:', e);
    }
  };

  // 发送信令
  const sendSignal = (type: string, payload: any) => {
    wsRef.current?.send(JSON.stringify({
      type,
      payload,
      to_user_id: targetUserId,
      to_role: targetRole,
    }));
  };

  // 创建 PeerConnection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfig); // ← STUN 配置在这里生效

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('webrtc_ice', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // 发起呼叫
  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal('webrtc_offer', offer);

      setInCall(true);
    } catch (e) {
      message.error('无法访问麦克风');
    }
  };

  // 挂断
  const hangUp = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    setInCall(false);
  };

  // 静音
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    setMuted(!muted);
  };

  return (
    <div>
      <audio ref={remoteAudioRef} autoPlay />
      {!inCall ? (
        <Button icon={<PhoneOutlined />} onClick={startCall}>语音通话</Button>
      ) : (
        <div className="flex gap-2">
          <Button icon={<AudioMutedOutlined />} onClick={toggleMute}>
            {muted ? '取消静音' : '静音'}
          </Button>
          <Button danger onClick={hangUp}>挂断</Button>
        </div>
      )}
    </div>
  );
};

export default VoiceCall;
