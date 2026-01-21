import { BookWithData } from '@koinsight/common/types';
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Image,
  Modal,
  Tabs,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconBooks,
  IconCalendar,
  IconHighlight,
  IconNote,
  IconPencil,
  IconUser,
} from '@tabler/icons-react';
import { JSX, useState } from 'react';
import { API_URL } from '../../api/api';
import { formatRelativeDate } from '../../utils/dates';
import { BookPageCoverSelector } from './components/book-page-cover-selector';

import style from './book-card.module.css';
import { BookUploadCover } from './components/book-upload-cover';
import { mutate } from 'swr';

type BookCardProps = {
  book: BookWithData;
};

export function BookCard({ book }: BookCardProps): JSX.Element {
  const media = useMediaQuery(`(max-width: 62em)`);
  const [isCoverSelectorOpened, { open: openCoverSelector, close: closeCoverSelector }] =
    useDisclosure(false);
  const [coverVersion, setCoverVersion] = useState(0);

  const handleCoverChange = () => {
    setCoverVersion((v) => v + 1);
    closeCoverSelector();
  };

  return (
    <Flex align="center" gap="lg">
      <Box
        pos="relative"
        className={style.CoverContainer}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openCoverSelector();
        }}
      >
        <Image
          key={`cover-${book.id}-${coverVersion}`}
          src={`${API_URL}/books/${book.id}/cover?v=${coverVersion}`}
          h={media ? 150 : 250}
          alt={book.title}
          radius="md"
          fallbackSrc="/book-placeholder-small.png"
        />
        <Tooltip label="Change cover" position="right" withArrow>
          <ActionIcon
            className={style.EditIcon}
            variant="filled"
            color="violet"
            size="lg"
            radius="xl"
          >
            <IconPencil size={18} />
          </ActionIcon>
        </Tooltip>
      </Box>
      <Modal
        opened={isCoverSelectorOpened}
        onClose={closeCoverSelector}
        title="Change book cover"
        size="calc(100vw - 3rem)"
        centered
      >
        <Tabs defaultValue="cover-selector" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="cover-selector">Select Cover</Tabs.Tab>
            <Tabs.Tab value="upload-cover">Upload Cover</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="cover-selector" p="md">
            <BookPageCoverSelector book={book} onSave={handleCoverChange} />
          </Tabs.Panel>

          <Tabs.Panel value="upload-cover" pt="lg" p="md">
            <BookUploadCover book={book} showTitle={false} onChange={handleCoverChange} />
          </Tabs.Panel>
        </Tabs>
      </Modal>
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
