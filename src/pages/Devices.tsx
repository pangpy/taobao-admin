// src/pages/Devices.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Switch, Button, Tag, Typography, Space, message, Radio, Input } from 'antd';
import { ReloadOutlined, ThunderboltOutlined, BulbOutlined, WifiOutlined } from '@ant-design/icons';
import mqtt from 'mqtt';

const { Text, Title } = Typography;

interface DeviceData {
  temperature: number;
  humidity: number;
  light: number;
  relay1: boolean;
  relay2: boolean;
}

interface Device {
  id: string;
  name: string;
  online: boolean;
  lastSeen: string;
  data: DeviceData;
}

const USER_ID = '3';

const getToken = () => {
  return import.meta.env.VITE_ACCESS_TOKEN || localStorage.getItem('access_token') || '';
};

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Record<string, Device>>({});
  const [connected, setConnected] = useState(false);
  const [connectType, setConnectType] = useState<'ws' | 'tcp'>('ws');
  const [tcpHost, setTcpHost] = useState('api.apiscode.org');
  const [tcpPort, setTcpPort] = useState('1883');
  const clientRef = useRef<mqtt.MqttClient | null>(null);

  const getBrokerUrl = () => {
    if (connectType === 'ws') {
      return 'wss://api.apiscode.org/mqtt';
    }
    return `tcp://${tcpHost}:${tcpPort}`;
  };

  const connectMqtt = () => {
    const token = getToken();
    if (!token) {
      message.error('未登录，无法连接设备');
      return;
    }

    if (clientRef.current) {
      clientRef.current.end();
    }

    const url = getBrokerUrl();
    console.log('[MQTT] 连接:', url);

    const client = mqtt.connect(url, {
      username: 'web-client',
      password: token,
      clientId: `web_${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    client.on('connect', () => {
      console.log('[MQTT] 已连接');
      setConnected(true);
      client.subscribe(`user/${USER_ID}/+/status`);
      client.subscribe(`user/${USER_ID}/+/sensor`);
      message.success('MQTT 已连接');
    });

    client.on('message', (topic, payload) => {
      try {
        const parts = topic.split('/');
        const deviceId = parts[2];
        const data = JSON.parse(payload.toString());

        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            id: deviceId,
            name: `设备 ${deviceId}`,
            online: true,
            lastSeen: new Date().toLocaleTimeString(),
            data: { ...prev[deviceId]?.data, ...data },
          },
        }));
      } catch (e) {}
    });

    client.on('error', (err) => {
      console.error('[MQTT] 错误:', err);
      setConnected(false);
      message.error('MQTT 连接失败');
    });

    client.on('close', () => setConnected(false));

    clientRef.current = client;
  };

  useEffect(() => {
    connectMqtt();
    return () => { clientRef.current?.end(); };
  }, [connectType]);

  const sendCommand = (deviceId: string, relay: number, value: boolean) => {
    if (!clientRef.current) return;
    const topic = `user/${USER_ID}/${deviceId}/command`;
    const payload = JSON.stringify({
      action: 'relay',
      pin: relay,
      value: value ? 1 : 0,
    });
    clientRef.current.publish(topic, payload);
    message.success(`已发送: 开关${relay} ${value ? '开' : '关'}`);
  };

  const deviceList = Object.values(devices);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="!mb-0">📡 设备管理</Title>
        <Space>
          <Tag color={connected ? 'green' : 'red'}>
            MQTT {connected ? '已连接' : '未连接'}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={connectMqtt}>
            重连
          </Button>
        </Space>
      </div>

      {/* ========== 连接方式切换 ========== */}
      <Card size="small" className="mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Radio.Group
            value={connectType}
            onChange={(e) => setConnectType(e.target.value)}
            optionType="button"
          >
            <Radio.Button value="ws">
              <WifiOutlined /> WebSocket (wss://)
            </Radio.Button>
            <Radio.Button value="tcp">
              <WifiOutlined /> TCP (tcp://)
            </Radio.Button>
          </Radio.Group>

          {connectType === 'tcp' && (
            <Space>
              <Input
                value={tcpHost}
                onChange={(e) => setTcpHost(e.target.value)}
                placeholder="主机"
                className="w-40"
                size="small"
              />
              <Input
                value={tcpPort}
                onChange={(e) => setTcpPort(e.target.value)}
                placeholder="端口"
                className="w-20"
                size="small"
              />
            </Space>
          )}

          <Text type="secondary" className="text-xs">
            {connectType === 'ws'
              ? '浏览器直连，走 443 端口'
              : '直连 TCP，低功耗低延迟'}
          </Text>
        </div>
      </Card>

      {deviceList.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">📡</div>
          <Text type="secondary">暂无设备数据</Text>
          <div className="mt-2 text-xs text-gray-400">
            等待设备上报数据... 主题: user/{USER_ID}/+/status
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deviceList.map((device) => (
            <Card
              key={device.id}
              title={
                <div className="flex justify-between items-center">
                  <span>{device.name}</span>
                  <Tag color={device.online ? 'green' : 'red'}>
                    {device.online ? '在线' : '离线'}
                  </Tag>
                </div>
              }
              className="shadow-md"
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {device.data?.temperature?.toFixed(1) ?? '--'}°C
                  </div>
                  <div className="text-xs text-gray-500 mt-1">温度</div>
                </div>
                <div className="bg-cyan-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {device.data?.humidity?.toFixed(1) ?? '--'}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">湿度</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {device.data?.light ?? '--'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">光照 (lux)</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center flex flex-col justify-center">
                  <div className="text-xs text-gray-500">最后上报</div>
                  <div className="text-sm font-medium">{device.lastSeen}</div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">远程控制</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <BulbOutlined className="text-lg" />
                    <span className="text-sm">开关1</span>
                    <Switch
                      checked={device.data?.relay1}
                      onChange={(v) => sendCommand(device.id, 1, v)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <ThunderboltOutlined className="text-lg" />
                    <span className="text-sm">开关2</span>
                    <Switch
                      checked={device.data?.relay2}
                      onChange={(v) => sendCommand(device.id, 2, v)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Devices;
