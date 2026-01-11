import { Annotation, Book } from '@koinsight/common/types';
import { NavLink as RouterNavLink } from 'react-router';
import { Anchor, Badge, Box, Group, NavLink, Paper, Stack, Text } from '@mantine/core';
import {
  IconArticle,
  IconBookmark,
  IconBooks,
  IconHighlight,
  IconNote,
  IconVocabulary,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { JSX } from 'react';
import { Link } from 'react-router';
import { RoutePath } from '../../../routes';

type AnnotationCardProps = {
  annotation: Annotation;
  book?: Book;
};

export function AnnotationCard({ annotation, book }: AnnotationCardProps): JSX.Element {
  const getTypeIcon = () => {
    switch (annotation.annotation_type) {
      case 'highlight':
        return <IconHighlight size={16} />;
      case 'note':
        return <IconNote size={16} />;
      case 'bookmark':
        return <IconBookmark size={16} />;
    }
  };

  const getTypeColor = () => {
    switch (annotation.annotation_type) {
      case 'highlight':
        return 'yellow';
      case 'note':
        return 'blue';
      case 'bookmark':
        return 'green';
    }
  };

  const isDeleted = annotation.deleted_at || annotation.deleted;

  return (
    <Paper
      withBorder
      p="md"
      radius="sm"
      style={{
        opacity: isDeleted ? 0.5 : 1,
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge leftSection={getTypeIcon()} color={getTypeColor()} variant="light" size="sm">
              {annotation.annotation_type}
            </Badge>
            {annotation.color && (
              <Badge variant="outline" size="sm" color="gray">
                {annotation.color}
              </Badge>
            )}
            {annotation.drawer && (
              <Badge variant="outline" size="sm" color="gray">
                {annotation.drawer}
              </Badge>
            )}
            {isDeleted && (
              <Badge color="red" variant="filled" size="sm">
                Deleted
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {format(annotation.datetime, 'dd MMM yyyy, HH:mm')}
          </Text>
        </Group>

        {annotation.text && (
          <Box>
            <Text size="sm" style={{ fontStyle: 'italic' }}>
              "{annotation.text}"
            </Text>
          </Box>
        )}

        {annotation.note && (
          <Box>
            <Text size="xs" fw={600} c="dimmed" mb={4}>
              Note:
            </Text>
            <Text size="sm">{annotation.note}</Text>
          </Box>
        )}

        <Group gap="md">
          {book && (
            <Anchor
              component={RouterNavLink}
              to={RoutePath.BOOK.replace(':id', book.id.toString())}
              c="dimmed"
              size="xs"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <IconBooks size={16} /> {book.title} by {book.authors}
            </Anchor>
          )}
          {annotation.chapter && (
            <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconArticle size={16} /> {annotation.chapter}
            </Text>
          )}
          {annotation.pageno && annotation.total_pages && (
            <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconVocabulary size={16} /> Page {annotation.pageno}/{annotation.total_pages}
            </Text>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
