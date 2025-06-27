import { BookWithData } from '@koinsight/common/types';
import { Flex, Group, Image, Title, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBooks, IconCalendar, IconHighlight, IconNote, IconUser } from '@tabler/icons-react';
import { JSX } from 'react';
import { API_URL } from '../../api/api';
import { formatRelativeDate } from '../../utils/dates';

import style from './book-card.module.css';

type BookCardProps = {
  book: BookWithData;
};

export function BookCard({ book }: BookCardProps): JSX.Element {
  const media = useMediaQuery(`(max-width: 62em)`);

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

        <Title fw="800">{book.title}</Title>

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
