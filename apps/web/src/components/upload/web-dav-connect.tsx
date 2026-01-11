import { FormEvent, useEffect, useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconCloud, IconInfoCircle} from '@tabler/icons-react';

type WebDavConnectModalProps = {
  opened: boolean;
  onClose: () => void;
  loading: boolean;
  initialConfig?: WebdavConfig | null;
  onSubmit: (config: WebdavConfig) => void;
};

export type WebdavConfig = {
  url: string;
  folder: string;
  username?: string;
  password?: string;
};

export function WebDavConnectModal({ opened, onClose, loading, initialConfig, onSubmit}: WebDavConnectModalProps) {
  const [url, setUrl] = useState('');
  const [folder, setFolder] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (opened) {
      setUrl(initialConfig?.url ?? '');
      setFolder(initialConfig?.folder ?? '');
      setUsername(initialConfig?.username ?? '');
      setPassword(initialConfig?.password ?? '');
    }
  }, [opened, initialConfig]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      url: url.trim(),
      folder: folder.trim(),
      username: username.trim() || undefined,
      password: password || undefined,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Sync from WebDAV"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="WebDAV Address"
            placeholder="https://example.com/dav"
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            required
          />
          <TextInput
            label={
              <Group gap={4}>
                Remote Folder
                <Tooltip label="The remote folder that holds the database.">
                  <ActionIcon variant="subtle" size="sm" color="gray">
                    <IconInfoCircle size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            }
            placeholder="koreader_statistics"
            value={folder}
            onChange={(e) => setFolder(e.currentTarget.value)}
          />
          <TextInput
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Connect
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}