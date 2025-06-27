import { Book } from '@koinsight/common/types';
import { Button, Flex, NumberInput, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { updateBookReferencePages } from '../../../api/books';

export type BookReferencePagesProps = {
  book: Book;
};

export function BookReferencePages({ book }: BookReferencePagesProps) {
  const [referencePages, setReferencePages] = useState(book.reference_pages ?? 0);

  const [updateLoading, setUpdateLoading] = useState(false);

  const onUpdateReferencePages = async () => {
    try {
      setUpdateLoading(true);
      await updateBookReferencePages(book.id, referencePages);
      notifications.show({
        title: 'Reference page count updated',
        message: `${book ? `"${book?.title}"` : 'Book'} reference page count updated successfully.`,
        color: 'green',
        position: 'top-center',
      });
    } catch (error) {
      notifications.show({
        title: 'Failed to update reference page count',
        message: '',
        color: 'red',
        position: 'top-center',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div>
      <Title order={3} mb="md">
        Reference page count
      </Title>
      <Text size="sm" mb="md" maw="80%" lh="xl">
        KOReader tracks your reading progress based on <em>pages in the app</em>, which can vary
        depending on settings like font size, margins, and layout. For example, a 100-page book
        might show up as 150 pages in KOReader if you increase the font size.
        <br />
        <br />
        To get accurate reading stats, you can set the <strong>reference page</strong> count — the
        actual number of pages in the physical or original version of the book. KoInsight will then
        adjust your stats to match that real-world page count.
      </Text>
      <Flex gap="md">
        <NumberInput
          min={0}
          value={referencePages}
          onChange={(e) => setReferencePages(Number(e))}
        />
        <Button variant="subtle" loading={updateLoading} onClick={onUpdateReferencePages}>
          Update reference pages
        </Button>
      </Flex>
    </div>
  );
}
