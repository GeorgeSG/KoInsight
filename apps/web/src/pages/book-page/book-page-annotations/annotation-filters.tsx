import { Checkbox, Flex, Group, Select, Stack, TextInput, Tooltip } from '@mantine/core';
import { IconArrowsDownUp, IconCategory, IconSearch } from '@tabler/icons-react';
import { JSX } from 'react';
import { GroupBy, SortBy, useAnnotationFilters } from './use-annotation-filters';

export function AnnotationFiltersComponent(): JSX.Element {
  const {
    types,
    setTypes,
    toggleType,
    searchTerm,
    setSearchTerm,
    showDeleted,
    setShowDeleted,
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
  } = useAnnotationFilters();

  return (
    <Stack gap="md">
      <Flex align="center" gap="md">
        <TextInput
          placeholder="Search annotations..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          style={{ flex: 1 }}
        />

        <Group gap="md" ml="auto">
          <Checkbox
            label="Highlights"
            checked={types.includes('highlight')}
            onChange={() => toggleType('highlight')}
          />
          <Checkbox
            label="Notes"
            checked={types.includes('note')}
            onChange={() => toggleType('note')}
          />
          <Checkbox
            label="Bookmarks"
            checked={types.includes('bookmark')}
            onChange={() => toggleType('bookmark')}
          />
          <Checkbox
            label="Show deleted"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.currentTarget.checked)}
          />
        </Group>
      </Flex>

      <Group gap="md">
        <Tooltip label="Sort by" openDelay={1000} position="top" withArrow>
          <Select
            leftSection={<IconArrowsDownUp size={16} />}
            value={sortBy}
            onChange={(value) => setSortBy(value as SortBy)}
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
            leftSection={<IconCategory size={16} />}
            value={groupBy}
            onChange={(value) => setGroupBy(value as GroupBy)}
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
