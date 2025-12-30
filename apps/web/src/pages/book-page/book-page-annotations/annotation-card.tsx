import { Annotation } from '@koinsight/common/types';
import { Badge, Box, Group, Paper, Stack, Text } from '@mantine/core';
import { IconBookmark, IconHighlight, IconNote } from '@tabler/icons-react';
import { format } from 'date-fns';
import { JSX } from 'react';

type AnnotationCardProps = {
  annotation: Annotation;
};

export function AnnotationCard({ annotation }: AnnotationCardProps): JSX.Element {
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

  return (
    <Paper
      withBorder
      p="md"
      radius="sm"
      style={{
        opacity: annotation.deleted_at ? 0.5 : 1,
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge
              leftSection={getTypeIcon()}
              color={getTypeColor()}
              variant="light"
              size="sm"
            >
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
            {annotation.deleted_at && (
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
          {annotation.chapter && (
            <Text size="xs" c="dimmed">
              📖 {annotation.chapter}
            </Text>
          )}
          {annotation.pageno && (
            <Text size="xs" c="dimmed">
              📄 Page {annotation.pageno}
            </Text>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
