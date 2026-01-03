import { BookStatus, BookWithData } from '@koinsight/common/types';
import { Button, Flex, Group, Image, Menu, Title, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconBooks,
  IconCalendar,
  IconChevronDown,
  IconHighlight,
  IconNote,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import { JSX } from 'react';
import { useSWRConfig } from 'swr';
import { API_URL } from '../../api/api';
import { updateBookStatus } from '../../api/books';
import {
  AbandonedIcon,
  CompletedIcon,
  OnHoldIcon,
  ReadingIcon,
} from '../../components/status-icons';
import { formatRelativeDate } from '../../utils/dates';

import style from './book-card.module.css';

type BookCardProps = {
  book: BookWithData;
};

const getStatusIcon = (status: BookStatus, size = 16) => {
  switch (status) {
    case 'complete':
      return <CompletedIcon size={size} withTooltip={false} />;
    case 'reading':
      return <ReadingIcon size={size} withTooltip={false} />;
    case 'on_hold':
      return <OnHoldIcon size={size} withTooltip={false} />;
    case 'abandoned':
      return <AbandonedIcon size={size} withTooltip={false} />;
    default:
      return null;
  }
};

const getStatusLabel = (status: BookStatus) => {
  switch (status) {
    case 'complete':
      return 'Completed';
    case 'reading':
      return 'Reading';
    case 'on_hold':
      return 'On Hold';
    case 'abandoned':
      return 'Abandoned';
    default:
      return 'Set Status';
  }
};

export function BookCard({ book }: BookCardProps): JSX.Element {
  const media = useMediaQuery(`(max-width: 62em)`);
  const { mutate } = useSWRConfig();

  const handleStatusChange = async (status: BookStatus) => {
    await updateBookStatus(book.id, status);
    mutate(`books/${book.id}`);
  };

  return (
    <Flex align="center" gap="lg">
      <Image
        src={`${API_URL}/books/${book.id}/cover`}
        h={media ? 150 : 250}
        alt={book.title}
        radius="md"
        fallbackSrc="/book-placeholder-small.png"
      />
      <div>
        <Flex align="center" gap={8} mt={3}>
          <Tooltip label="Author" position="top" withArrow>
            <IconUser stroke={1.5} size={16} />
          </Tooltip>
          <span className={style.Author}>{book.authors ?? 'N/A'}</span>
        </Flex>

        <Flex align="center" gap={8}>
          <Title fw="800">{book.title}</Title>
          {book.status && getStatusIcon(book.status, 24)}
        </Flex>

        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button
              variant="light"
              size="xs"
              mt="xs"
              leftSection={getStatusIcon(book.status, 14)}
              rightSection={<IconChevronDown size={14} />}
            >
              {getStatusLabel(book.status)}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Reading status</Menu.Label>
            <Menu.Item
              leftSection={<CompletedIcon size={14} withTooltip={false} />}
              onClick={() => handleStatusChange('complete')}
              color={book.status === 'complete' ? 'green' : undefined}
            >
              Completed
            </Menu.Item>
            <Menu.Item
              leftSection={<ReadingIcon size={14} withTooltip={false} />}
              onClick={() => handleStatusChange('reading')}
              color={book.status === 'reading' ? 'blue' : undefined}
            >
              Reading
            </Menu.Item>
            <Menu.Item
              leftSection={<OnHoldIcon size={14} withTooltip={false} />}
              onClick={() => handleStatusChange('on_hold')}
              color={book.status === 'on_hold' ? 'yellow' : undefined}
            >
              On Hold
            </Menu.Item>
            <Menu.Item
              leftSection={<AbandonedIcon size={14} withTooltip={false} />}
              onClick={() => handleStatusChange('abandoned')}
              color={book.status === 'abandoned' ? 'red' : undefined}
            >
              Abandoned
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconX size={14} />}
              onClick={() => handleStatusChange(null)}
            >
              Clear status
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Flex align="center" gap={8} mt="sm">
          <Tooltip label="Series" position="top" withArrow>
            <IconBooks stroke={1.5} size={16} />
          </Tooltip>
          <span className={style.InfoText}>{book.series}</span>
        </Flex>

        <Flex align="center" gap={8} mt={5}>
          <Tooltip label="Last opened" position="top" withArrow>
            <IconCalendar stroke={1.5} size={16} />
          </Tooltip>
          <span className={style.InfoText}>{formatRelativeDate(book.last_open * 1000)}</span>
        </Flex>

        <Group>
          <Flex align="center" gap={8} mt={5}>
            <Tooltip label="Highlights" position="top" withArrow>
              <IconHighlight stroke={1.5} size={16} />
            </Tooltip>
            <span className={style.InfoText}>
              {book.device_data.reduce((acc, device) => acc + device.highlights, 0)}
            </span>
          </Flex>

          <Flex align="center" gap={8} mt={5}>
            <Tooltip label="Notes" position="top" withArrow>
              <IconNote stroke={1.5} size={16} />
            </Tooltip>
            <span className={style.InfoText}>
              {book.device_data.reduce((acc, device) => acc + device.notes, 0)}
            </span>
          </Flex>
        </Group>
      </div>
    </Flex>
  );
}
