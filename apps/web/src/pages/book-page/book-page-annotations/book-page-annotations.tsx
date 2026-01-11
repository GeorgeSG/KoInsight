import { Annotation, BookWithData } from '@koinsight/common/types';
import { Accordion, Box, Divider, Stack, Text, Title } from '@mantine/core';
import { useMemo } from 'react';
import { AnnotationCard } from './annotation-card';
import { AnnotationFiltersComponent } from './annotation-filters';
import { useAnnotationFilters } from './use-annotation-filters';

type BookPageAnnotationsProps = {
  book: BookWithData;
};

export function BookPageAnnotations({ book }: BookPageAnnotationsProps) {
  const { searchTerm, types, showDeleted, sortBy, groupBy } = useAnnotationFilters();

  const filteredAndSortedAnnotations = useMemo(() => {
    let filtered = book.annotations;

    // Filter by type
    filtered = filtered.filter((a) => types.includes(a.annotation_type));

    // Filter by deleted status
    if (!showDeleted) {
      filtered = filtered.filter((a) => !a.deleted_at && !a.deleted);
    }

    // Filter by search text
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.text?.toLowerCase().includes(searchLower) ||
          a.note?.toLowerCase().includes(searchLower) ||
          a.chapter?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
        case 'oldest':
          return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
        case 'page-asc':
          return (a.pageno ?? 0) - (b.pageno ?? 0);
        case 'page-desc':
          return (b.pageno ?? 0) - (a.pageno ?? 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [book.annotations, types, sortBy, searchTerm, showDeleted, groupBy]);

  const groupedAnnotations = useMemo(() => {
    if (groupBy === 'none') {
      return { '': filteredAndSortedAnnotations };
    }

    const groups: Record<string, Annotation[]> = {};

    filteredAndSortedAnnotations.forEach((annotation) => {
      let key = '';

      if (groupBy === 'type') {
        key = annotation.annotation_type;
      } else if (groupBy === 'chapter') {
        key = annotation.chapter || 'Unknown chapter';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(annotation);
    });

    return groups;
  }, [filteredAndSortedAnnotations, groupBy]);

  return (
    <Stack gap="lg">
      <Box>
        <Title order={3} mb="xs">
          Annotations ({filteredAndSortedAnnotations.length} of {book.annotations.length})
        </Title>
        <Text size="sm" c="dimmed">
          {book.highlights_count} highlights · {book.notes_count} notes · {book.bookmarks_count}{' '}
          bookmarks
          {book.deleted_count > 0 && ` · ${book.deleted_count} deleted`}
        </Text>
      </Box>

      <AnnotationFiltersComponent />

      <Divider />

      {filteredAndSortedAnnotations.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No annotations found with the current filters.
        </Text>
      ) : groupBy === 'none' ? (
        <AnnotationsList annotations={filteredAndSortedAnnotations} />
      ) : (
        <Accordion variant="separated">
          {Object.entries(groupedAnnotations).map(([groupName, annotations]) => (
            <Accordion.Item key={groupName} value={groupName}>
              <Accordion.Control>
                <Text fw={600}>
                  {groupName} ({annotations.length})
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <AnnotationsList annotations={annotations} />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Stack>
  );
}

function AnnotationsList({ annotations }: { annotations: Annotation[] }) {
  console.log({ annotations });
  return (
    <Stack gap="md">
      {annotations.map((annotation) => (
        <AnnotationCard key={annotation.id} annotation={annotation} />
      ))}
    </Stack>
  );
}
