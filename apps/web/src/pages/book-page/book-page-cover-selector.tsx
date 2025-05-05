import { Book } from '@koinsight/common/types/book';
import { ActionIcon, Box, Flex, Image, Skeleton, TextInput, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { JSX, useEffect, useState } from 'react';
import { listCovers, saveCover } from '../../api/open-library';

import style from './book-page-cover-selector.module.css';
import { IconSearch } from '@tabler/icons-react';

type BookPageCoverSelectorProps = {
  book: Book;
};

export function BookPageCoverSelector({ book }: BookPageCoverSelectorProps): JSX.Element {
  const [state, setState] = useState<{
    data: string[] | null;
    query: string | null;
    isLoading: boolean;
    loadedCovers: string[];
    isSavingCovers: boolean;
  }>({ data: null, query: null, isLoading: false, loadedCovers: [], isSavingCovers: false });

  useEffect(() => {
    setState((prev) => ({...prev, query: book.title}));
  }, [book]);
  
  const onSearch = async () => {
    setState((prev) => ({ isLoading: true, query: prev.query || book.title, data: null, loadedCovers: [], isSavingCovers: false }));
    const coverIds = await listCovers(state.query || book.title);
    setState((prev) => ({ ...prev, isLoading: false, data: coverIds }));
  };

  const onSave = async (coverId: string) => {
    setState((prev) => ({ ...prev, isSavingCovers: true }));
    saveCover(book.id, coverId ?? '')
      .then(() =>
        notifications.show({
          title: 'Cover saved',
          message: 'Cover saved successfully.',
          position: 'top-center',
        })
      )
      .catch(() =>
        notifications.show({
          title: 'Error saving cover',
          message: `Unable to save cover for ${book.title}.`,
          color: 'red',
          position: 'top-center',
        })
      )
      .finally(() => setState((prev) => ({ ...prev, isSavingCovers: false })));
  };

  return (
    <>
      <Flex mt="lg" gap={16} direction="row">
      <TextInput
          placeholder="Search query..."
          w={300}
          value={state.query || ""}
          onKeyUp={(e) => e.code === "Enter" ? onSearch() : null}
          onChange={(e) => setState((prev) => ({...prev, query: e.target.value}))}
          rightSection={
            <ActionIcon size={32} radius="xl" color="violet" variant="filled" onClick={onSearch} loading={state.isLoading}>
              <IconSearch size={16} stroke={1.5} />
            </ActionIcon>
          }
        />
      </Flex>
      <Flex mt="lg" gap={16} direction="row" wrap="wrap">
        {state.data?.map((coverId) => (
          <Box
            key={coverId}
            onClick={() => onSave(coverId)}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <Skeleton
              visible={!state.loadedCovers.includes(coverId) || state.isSavingCovers}
              height={250}
            >
              <Tooltip position="top" label="Click to save cover" withArrow>
                <Image
                  src={`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`}
                  h={250}
                  w={180}
                  fit="contain"
                  style={{ width: state.loadedCovers.includes(coverId) ? 'auto' : 150 }}
                  onLoad={() =>
                    setState((prev) => ({
                      ...prev,
                      loadedCovers: [...prev.loadedCovers, coverId],
                    }))
                  }
                  fallbackSrc="/book-placeholder-small.png"
                  className={style.Cover}
                />
              </Tooltip>
            </Skeleton>
          </Box>
        ))}
      </Flex>
    </>
  );
}
