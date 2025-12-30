import { Annotation } from '@koinsight/common/types';
import { Badge, Box, Group, Paper, Stack, Text } from '@mantine/core';
import { IconBookmark, IconHighlight, IconNote } from '@tabler/icons-react';
import { format } from 'date-fns';
import { JSX } from 'react';

type AnnotationCardProps = {
  annotation: Annotation;
  currentTotalPages: number; // Current total pages (reference_pages or total_pages from book)
};

export function AnnotationCard({ annotation, currentTotalPages }: AnnotationCardProps): JSX.Element {
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

  // Recalculate page number based on current total pages to handle reflows
  const getRecalculatedPage = (): number | undefined => {
    if (!annotation.pageno || !annotation.total_pages) {
      return annotation.pageno;
    }

    // If total pages haven't changed, return original page number
    if (annotation.total_pages === currentTotalPages) {
      return annotation.pageno;
    }

    // Recalculate based on proportion: (original_page / original_total) * current_total
    const recalculated = Math.round(
      (annotation.pageno / annotation.total_pages) * currentTotalPages
    );

    return recalculated;
  };

  const displayPage = getRecalculatedPage();

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
          {annotation.chapter && (
            <Text size="xs" c="dimmed">
              📖 {annotation.chapter}
            </Text>
          )}
          {displayPage && (
            <Text size="xs" c="dimmed">
              📄 Page {displayPage}
              {annotation.total_pages && annotation.total_pages !== currentTotalPages && (
                <Text component="span" size="xs" c="dimmed" style={{ opacity: 0.7 }}>
                  {' '}(originally {annotation.pageno}/{annotation.total_pages})
                </Text>
              )}
            </Text>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
