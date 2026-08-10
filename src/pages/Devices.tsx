// src/pages/Devices.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Switch, Button, Tag, Typography, Space, message, Input, Drawer } from 'antd';
import { ReloadOutlined, ThunderboltOutlined, BulbOutlined, WifiOutlined, ToolOutlined } from '@ant-design/icons';
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

  // 模拟器状态
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simTemp, setSimTemp] = useState(26.5);
  const [simHum, setSimHum] = useState(65.2);
  const [simLight, setSimLight] = useState(320);
  const [simDeviceId, setSimDeviceId] = useState('device1');
  const [simRelay1, setSimRelay1] = useState(false);
  const [simRelay2, setSimRelay2] = useState(false);
  const simClientRef = useRef<mqtt.MqttClient | null>(null);

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

    client.on('message', (_topic: string, payload: Buffer) => {
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

    client.on('error', (err: Error) => {
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

  // ============ 模拟器连接 ============
  const connectSimulator = () => {
    const token = getToken();
    if (!token) return;

    if (simClientRef.current) simClientRef.current.end();

    const client = mqtt.connect('wss://api.apiscode.org/mqtt', {
      username: simDeviceId,
      password: token,
      clientId: `sim_${Date.now()}`,
      clean: true,
    });

    client.on('connect', () => {
      message.success('模拟器已连接');
      client.subscribe(`user/${USER_ID}/${simDeviceId}/command`);
    });

    client.on('message', (topic: string, payload: Buffer) => {
      try {
        const cmd = JSON.parse(payload.toString());
        if (cmd.action === 'relay') {
          if (cmd.pin === 1) setSimRelay1(cmd.value === 1);
          if (cmd.pin === 2) setSimRelay2(cmd.value === 1);
          message.info(`模拟器: 开关${cmd.pin} ${cmd.value === 1 ? '开' : '关'}`);
          reportSimStatus(client);
        }
      } catch (e) {}
    });

    simClientRef.current = client;
  };

  const disconnectSimulator = () => {
    simClientRef.current?.end();
    simClientRef.current = null;
  };

  const reportSimSensor = () => {
    if (!simClientRef.current) return;
    const payload = JSON.stringify({
      temperature: simTemp,
      humidity: simHum,
      light: simLight,
    });
    simClientRef.current.publish(`user/${USER_ID}/${simDeviceId}/sensor`, payload);
    message.success('传感器数据已上报');
  };

  const reportSimStatus = (client?: mqtt.MqttClient) => {
    const c = client || simClientRef.current;
    if (!c) return;
    const payload = JSON.stringify({
      temperature: simTemp,
      humidity: simHum,
      light: simLight,
      relay1: simRelay1,
      relay2: simRelay2,
    });
    c.publish(`user/${USER_ID}/${simDeviceId}/status`, payload);
  };

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
          <Button icon={<ToolOutlined />} onClick={() => {
            setSimulatorOpen(true);
            connectSimulator();
          }}>
            模拟器
          </Button>
          <Button icon={<ReloadOutlined />} onClick={connectMqtt}>
            重连
          </Button>
        </Space>
      </div>

      {/* ========== 连接方式切换 ========== */}
      <Card size="small" className="mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            <Button
              type={connectType === 'ws' ? 'primary' : 'default'}
              icon={<WifiOutlined />}
              onClick={() => setConnectType('ws')}
            >
              WebSocket (wss://)
            </Button>
            <Button
              type={connectType === 'tcp' ? 'primary' : 'default'}
              icon={<WifiOutlined />}
              onClick={() => setConnectType('tcp')}
            >
              TCP (tcp://)
            </Button>
          </div>

          {connectType === 'tcp' && (
            <Space>
              <Input value={tcpHost} onChange={(e) => setTcpHost(e.target.value)} placeholder="主机" className="w-40" size="small" />
              <Input value={tcpPort} onChange={(e) => setTcpPort(e.target.value)} placeholder="端口" className="w-20" size="small" />
            </Space>
          )}

          <Text type="secondary" className="text-xs">
            {connectType === 'ws' ? '浏览器直连，走 443 端口' : '直连 TCP，低功耗低延迟'}
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
                    <Switch checked={device.data?.relay1} onChange={(v) => sendCommand(device.id, 1, v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <ThunderboltOutlined className="text-lg" />
                    <span className="text-sm">开关2</span>
                    <Switch checked={device.data?.relay2} onChange={(v) => sendCommand(device.id, 2, v)} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ============ 设备模拟器抽屉 ============ */}
      <Drawer
        title="🔧 设备模拟器"
        open={simulatorOpen}
        onClose={() => {
          setSimulatorOpen(false);
          disconnectSimulator();
        }}
        width={400}
      >
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">设备ID</div>
            <Input value={simDeviceId} onChange={(e) => setSimDeviceId(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">温度 °C</div>
            <Input type="number" value={simTemp} onChange={(e) => setSimTemp(Number(e.target.value))} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">湿度 %</div>
            <Input type="number" value={simHum} onChange={(e) => setSimHum(Number(e.target.value))} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">光照 lux</div>
            <Input type="number" value={simLight} onChange={(e) => setSimLight(Number(e.target.value))} />
          </div>
          <Button type="primary" block onClick={reportSimSensor}>
            📤 上报传感器数据
          </Button>

          <div className="border-t pt-4 mt-4">
            <div className="text-sm font-medium mb-3">开关状态</div>
            <div className="flex justify-between items-center mb-2">
              <span>开关1</span>
              <Switch checked={simRelay1} onChange={(v) => { setSimRelay1(v); reportSimStatus(); }} />
            </div>
            <div className="flex justify-between items-center">
              <span>开关2</span>
              <Switch checked={simRelay2} onChange={(v) => { setSimRelay2(v); reportSimStatus(); }} />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Devices;
