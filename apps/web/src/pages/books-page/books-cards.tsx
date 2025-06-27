import { BookWithData } from '@koinsight/common/types';
import { Box, Group, Image, Progress, Text, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBooks, IconEyeClosed, IconProgress, IconUser } from '@tabler/icons-react';
import C from 'clsx';
import { JSX } from 'react';
import { useNavigate } from 'react-router';
import { API_URL } from '../../api/api';
import { getBookPath } from '../../routes';

import style from './books-cards.module.css';

type BooksCardsProps = {
  books: BookWithData[];
};

export function BooksCards({ books }: BooksCardsProps): JSX.Element {
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(`(max-width: 62em)`);

  const cardWidth = isSmallScreen ? 120 : 200;

  return (
    <div
      className={style.CardGrid}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, 1fr))` }}
    >
      {books.map((book) => (
        <Box
          key={book.id}
          className={style.Card}
          role="button"
          onClick={() => navigate(getBookPath(book.id))}
        >
          {book.soft_deleted ? (
            <Tooltip label="This book is hidden" withArrow>
              <IconEyeClosed size={16} className={style.BookHiddenIndicator} />
            </Tooltip>
          ) : null}
          <Image
            src={`${API_URL}/books/${book.id}/cover`}
            style={{ aspectRatio: '1/1.5' }}
            w={cardWidth}
            alt={book.title}
            fallbackSrc="/book-placeholder-small.png"
            className={book.soft_deleted ? style.BookHidden : undefined}
          />
          <Progress
            radius={0}
            h={5}
            value={(book.unique_read_pages / book.total_pages) * 100}
            color="koinsight"
          />
          <Box px="lg" className={C(style.CardDetails, { [style.Small]: isSmallScreen })}>
            <Text fz="md" fw={600} style={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>
              {book.title}
            </Text>
            <Group wrap="nowrap" gap={8} mt="xs">
              <Tooltip label="Author" position="top" withArrow>
                <IconUser stroke={1.5} size={16} />
              </Tooltip>
              <span className={style.Attribute}>{book.authors ?? 'N/A'}</span>
            </Group>
            {!isSmallScreen && (
              <>
                <Group wrap="nowrap" gap={8}>
                  <Tooltip label="Series" position="top" withArrow>
                    <IconBooks stroke={1.5} size={16} />
                  </Tooltip>
                  <span className={style.Attribute}>{book.series}</span>
                </Group>
                <Group wrap="nowrap" gap={8}>
                  <Tooltip label="Pages read" position="top" withArrow>
                    <IconProgress stroke={1.5} size={16} />
                  </Tooltip>
                  <span className={style.Attribute}>
                    {book.total_read_pages}
                    &nbsp;/&nbsp;
                    {book.total_pages} pages read
                  </span>
                </Group>
              </>
            )}
          </Box>
        </Box>
      ))}
    </div>
  );
}
