import { useState } from 'react';
import { ActionIcon } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconCloud } from '@tabler/icons-react';
import { WebDavConnectModal, WebdavConfig } from './web-dav-connect';

export function WebDavSyncButton() {
  const [config, setConfig] = useState<WebdavConfig | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const syncWithConfig = async (cfg: WebdavConfig) => {
    setLoading(true);
    try {
      const res = await fetch('/api/upload/from-webdav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      showNotification({
        title: 'Successfully Synced',
        message: 'Successfully imported database from WebDAV.',
        icon: <IconCloud size={18} />,
        color: 'green',
      });
    } catch (err: any) {
      showNotification({
        title: 'Sync Failed',
        message:
          err?.message ??
          'Failed to connect to WebDAV server or import database.',
        color: 'red',
      });

      setModalOpened(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!config) {
      setModalOpened(true);
    } else {
      void syncWithConfig(config);
    }
  };

  const handleModalSubmit = (cfg: WebdavConfig) => {
    setConfig(cfg);
    setModalOpened(false);
    void syncWithConfig(cfg);
  };

  return (
    <>
      <ActionIcon
          variant="default"
          size="lg"
          aria-label="WebDAV"
          loading={loading}
          onClick={handleClick}
        >
          <IconCloud stroke={1.5} />
      </ActionIcon>

      <WebDavConnectModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        loading={loading}
        initialConfig={config}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}