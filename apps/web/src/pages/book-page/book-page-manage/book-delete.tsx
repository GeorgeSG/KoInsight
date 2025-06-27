import { Book } from '@koinsight/common/types';
import { Button, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { mutate } from 'swr';
import { deleteBook } from '../../../api/books';
import { RoutePath } from '../../../routes';

export type BookDeleteProps = {
  book: Book;
};

export function BookDelete({ book }: BookDeleteProps) {
  const navigate = useNavigate();

  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteConfirm = () =>
    modals.openConfirmModal({
      title: 'Delete Book?',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{book ? `"${book?.title}"` : 'this book'}</strong>
          ? This action is destructive and cannot be reverted.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: "No, don't delete it" },
      confirmProps: { color: 'red' },
      onConfirm: onDelete,
    });

  const onDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteBook(book.id);
      await mutate('books');
      navigate(RoutePath.HOME);
      notifications.show({
        title: 'Book deleted',
        message: `${book ? `"${book?.title}"` : 'Book'} deleted successfully.`,
        color: 'green',
        position: 'top-center',
      });
    } catch (error) {
      notifications.show({
        title: 'Failed to delete the book',
        message: 'Failed to delete the book.',
        color: 'red',
        position: 'top-center',
      });
    }
  };

  return (
    <div>
      <Title order={3} mb="md">
        Delete book
      </Title>
      <Button
        loading={deleteLoading}
        leftSection={<IconTrash size={16} />}
        variant="danger"
        onClick={openDeleteConfirm}
      >
        Delete book
      </Button>
    </div>
  );
}
