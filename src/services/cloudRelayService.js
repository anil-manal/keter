// Universal Cross-Network Cloud Relay for Keter Mobile Companion
// Powered by global high-availability secure WebSockets (EMQX & HiveMQ)
// 100% zero-configuration, $0 server cost, works anywhere across 5G/4G/Wi-Fi worldwide.
import mqtt from 'mqtt';

const BROKER_SERVERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];

export function createCloudRelay({ roomId, isHost = false, onMessage, onStatusChange }) {
  if (!roomId) return null;
  const cleanRoom = roomId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const toHostTopic = `keter/v1/${cleanRoom}/to_host`;
  const toCompanionTopic = `keter/v1/${cleanRoom}/to_companion`;

  const subscribeTopic = isHost ? toHostTopic : toCompanionTopic;
  const publishTopic = isHost ? toCompanionTopic : toHostTopic;

  let currentBrokerIndex = 0;
  let client = null;
  let isDestroyed = false;
  let hasConnectedOnce = false;

  const connect = () => {
    if (isDestroyed) return;
    const brokerUrl = BROKER_SERVERS[currentBrokerIndex];
    console.log(`[Cloud Relay] Connecting (${isHost ? 'Host' : 'Phone'}) to ${brokerUrl}...`);
    onStatusChange?.('connecting');

    try {
      client = mqtt.connect(brokerUrl, {
        keepalive: 30,
        reconnectPeriod: 4000,
        connectTimeout: 8000,
        clean: true,
      });

      client.on('connect', () => {
        hasConnectedOnce = true;
        console.log(`[Cloud Relay] Connected to ${brokerUrl}! Subscribed to ${subscribeTopic}`);
        onStatusChange?.('connected');
        client.subscribe(subscribeTopic, { qos: 0 }, (err) => {
          if (!err && !isHost) {
            // Mobile HUD requests initial sync immediately upon connecting
            client.publish(publishTopic, JSON.stringify({ action: 'request_sync' }), { qos: 0 });
          }
        });
      });

      client.on('message', (topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          onMessage?.(data);
        } catch (e) {
          console.error('[Cloud Relay] Parse error:', e);
        }
      });

      client.on('error', (err) => {
        console.warn('[Cloud Relay] Connection notice:', err?.message || err);
        // If first broker fails to connect, automatically try secondary broker
        if (!hasConnectedOnce && currentBrokerIndex < BROKER_SERVERS.length - 1) {
          currentBrokerIndex++;
          client.end(true);
          setTimeout(connect, 1000);
        }
      });

      client.on('offline', () => {
        onStatusChange?.('offline');
      });
    } catch (e) {
      console.warn('[Cloud Relay] Init error:', e);
    }
  };

  connect();

  return {
    send: (payload) => {
      if (client && client.connected) {
        try {
          client.publish(publishTopic, JSON.stringify(payload), { qos: 0 });
        } catch (e) {
          console.warn('[Cloud Relay] Publish error:', e);
        }
      }
    },
    destroy: () => {
      isDestroyed = true;
      try {
        client?.end(true);
      } catch (_) {}
    },
  };
}
