import { Book } from '@koinsight/common/types';
import { Flex } from '@mantine/core';
import { JSX } from 'react';
import { BookHide } from './book-hide';
import { BookReferencePages } from './book-reference-pages';
import { BookUploadCover } from './book-upload-cover';
import { BookDelete } from './book-delete';

type BookPageManageProps = {
  book: Book;
};

export function BookPageManage({ book }: BookPageManageProps): JSX.Element {
  return (
    <Flex direction="column" align="flex-start" gap="xl">
      <BookReferencePages book={book} />
      <BookUploadCover book={book} />
      <BookHide book={book} />
      <BookDelete book={book} />
    </Flex>
  );
}
