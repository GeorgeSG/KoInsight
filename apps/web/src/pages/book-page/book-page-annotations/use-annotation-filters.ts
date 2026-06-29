import { AnnotationType } from '@koinsight/common/types';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import { useCallback } from 'react';

const TYPES_OPTIONS = ['highlight', 'note', 'bookmark'] as const;
const SORT_BY_OPTIONS = ['newest', 'oldest', 'page-asc', 'page-desc'] as const;
const GROUP_BY_OPTIONS = ['none', 'type', 'chapter'] as const;

export type SortBy = (typeof SORT_BY_OPTIONS)[number];
export type GroupBy = (typeof GROUP_BY_OPTIONS)[number];

export function useAnnotationFilters() {
  const [searchTerm, setSearchTerm] = useQueryState('search', parseAsString.withDefault(''));

  const [types, setTypes] = useQueryState<AnnotationType[]>(
    'types',
    parseAsArrayOf(parseAsStringLiteral(TYPES_OPTIONS)).withDefault([
      'highlight',
      'note',
      'bookmark',
    ])
  );

  const toggleType = useCallback(
    (type: AnnotationType) => {
      const newTypes = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
      setTypes(newTypes);
    },
    [types, setTypes]
  );

  const [showDeleted, setShowDeleted] = useQueryState(
    'showDeleted',
    parseAsBoolean.withDefault(false)
  );

  const [sortBy, setSortBy] = useQueryState<SortBy>(
    'sortBy',
    parseAsStringLiteral(SORT_BY_OPTIONS).withDefault('newest')
  );

  const [groupBy, setGroupBy] = useQueryState<GroupBy>(
    'groupBy',
    parseAsStringLiteral(GROUP_BY_OPTIONS).withDefault('none')
  );

  return {
    searchTerm,
    setSearchTerm,
    types,
    setTypes,
    toggleType,
    showDeleted,
    setShowDeleted,
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
  };
}
