import { Book } from '@koinsight/common/types';
import { Switch, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { mutate } from 'swr';
import { hideBook, showBook } from '../../../api/books';
import { RoutePath } from '../../../routes';

export type BookHideProps = {
  book: Book;
};

export function BookHide({ book }: BookHideProps) {
  const navigate = useNavigate();

  const [hideLoading, setHideLoading] = useState(false);

  const onUpdate = async (hidden: boolean) => {
    try {
      setHideLoading(true);

      if (hidden) {
        await hideBook(book.id);
      } else {
        await showBook(book.id);
      }

      await mutate('books');
      await mutate(`books/${book.id}`);

      if (hidden) {
        navigate(RoutePath.HOME);
      }

      notifications.show({
        title: `Book ${hidden ? 'hidden' : 'shown'}`,
        message: `${book ? `"${book?.title}"` : 'Book'} ${hidden ? 'hidden' : 'shown'} successfully.`,
        color: 'green',
        position: 'top-center',
      });
    } catch (error) {
      notifications.show({
        title: `Failed to ${hidden ? 'hide' : 'show'} the book`,
        message: `Failed to ${hidden ? 'hide' : 'show'} the book.`,
        color: 'red',
        position: 'top-center',
      });
    } finally {
      setHideLoading(false);
    }
  };

  return (
    <div>
      <Title order={3} mb="md">
        Hide book
      </Title>
      <Text size="sm" mb="md" lh="xl">
        Hidden books are not shown in the book list and are excluded from statistics.
      </Text>
      <Switch
        disabled={hideLoading}
        label="Hide book"
        checked={book.soft_deleted}
        onChange={(e) => onUpdate(e.target.checked)}
      ></Switch>
    </div>
  );
}
