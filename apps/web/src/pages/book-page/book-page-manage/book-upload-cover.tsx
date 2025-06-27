import { Book } from '@koinsight/common/types';
import { Button, FileInput, Flex, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { uploadBookCover } from '../../../api/books';

export type BookUploadCoverProps = {
  book: Book;
};

export function BookUploadCover({ book }: BookUploadCoverProps) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const onSuccess = async () => {
    // FIXME: this doesn't seem to work.
    await mutate('books');
    await mutate(`books/${book.id}`);
    notifications.show({
      title: 'Success',
      message: 'File uploaded and validated successfully.',
      position: 'top-center',
      color: 'green',
    });
    setMessage('Cover updated');
    close();
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadBookCover(book.id, formData);

      if (response.ok) {
        await onSuccess();
      } else {
        setMessage('Failed to upload file.');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  return (
    <div>
      <Title order={3} mb="md">
        Upload cover
      </Title>
      <form onSubmit={handleUpload} encType="multipart/form-data">
        <Flex align="flex-end" gap="md">
          <FileInput
            w={200}
            label="Choose Book cover"
            placeholder="cover.png"
            onChange={(e) => setFile(e)}
            accept=".png,.jpg,.jpeg,.gif"
          />
          <Button type="submit" disabled={file === null}>
            Upload
          </Button>
        </Flex>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
