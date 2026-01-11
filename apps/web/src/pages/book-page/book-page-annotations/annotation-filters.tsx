import { AnnotationType } from '@koinsight/common/types';
import { Checkbox, Flex, Group, Select, Stack, TextInput, Tooltip } from '@mantine/core';
import { IconArrowsDownUp, IconSearch, IconUsersGroup } from '@tabler/icons-react';
import { JSX } from 'react';

export type AnnotationFilters = {
  search: string;
  types: AnnotationType[];
  showDeleted: boolean;
  sortBy: 'newest' | 'oldest' | 'page-asc' | 'page-desc';
  groupBy: 'none' | 'type' | 'chapter';
};

type AnnotationFiltersProps = {
  filters: AnnotationFilters;
  onFiltersChange: (filters: AnnotationFilters) => void;
};

export function AnnotationFiltersComponent({
  filters,
  onFiltersChange,
}: AnnotationFiltersProps): JSX.Element {
  const toggleType = (type: AnnotationType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  return (
    <Stack gap="md">
      <Flex align="center" gap="md">
        <TextInput
          placeholder="Search annotations..."
          leftSection={<IconSearch size={16} />}
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.currentTarget.value })}
          style={{ flex: 1 }}
        />

        <Group gap="md" ml="auto">
          <Checkbox
            label="Highlights"
            checked={filters.types.includes('highlight')}
            onChange={() => toggleType('highlight')}
          />
          <Checkbox
            label="Notes"
            checked={filters.types.includes('note')}
            onChange={() => toggleType('note')}
          />
          <Checkbox
            label="Bookmarks"
            checked={filters.types.includes('bookmark')}
            onChange={() => toggleType('bookmark')}
          />
          <Checkbox
            label="Show deleted"
            checked={filters.showDeleted}
            onChange={(e) => onFiltersChange({ ...filters, showDeleted: e.currentTarget.checked })}
          />
        </Group>
      </Flex>

      <Group gap="md">
        <Tooltip label="Sort by" openDelay={1000} position="top" withArrow>
          <Select
            leftSection={<IconArrowsDownUp size={16} />}
            value={filters.sortBy}
            onChange={(value) =>
              onFiltersChange({ ...filters, sortBy: value as AnnotationFilters['sortBy'] })
            }
            data={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'page-asc', label: 'Page (ascending)' },
              { value: 'page-desc', label: 'Page (descending)' },
            ]}
            style={{ width: 200 }}
          />
        </Tooltip>

        <Tooltip label="Group by" openDelay={1000} position="top" withArrow>
          <Select
            leftSection={<IconUsersGroup size={16} />}
            value={filters.groupBy}
            onChange={(value) =>
              onFiltersChange({ ...filters, groupBy: value as AnnotationFilters['groupBy'] })
            }
            data={[
              { value: 'none', label: 'No grouping' },
              { value: 'type', label: 'By type' },
              { value: 'chapter', label: 'By chapter' },
            ]}
            style={{ width: 200 }}
          />
        </Tooltip>
      </Group>
    </Stack>
  );
}
