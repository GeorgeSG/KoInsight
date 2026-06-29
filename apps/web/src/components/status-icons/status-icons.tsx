import { Tooltip } from '@mantine/core';
import { IconArchive, IconBook, IconCircleCheck, IconPlayerPause } from '@tabler/icons-react';
import { JSX } from 'react';

type StatusIconProps = {
  size?: number;
  withTooltip?: boolean;
};

export function CompletedIcon({ size = 16, withTooltip = true }: StatusIconProps): JSX.Element {
  const icon = (
    <IconCircleCheck
      size={size}
      stroke={1.5}
      style={{ flexShrink: 0, color: 'var(--mantine-color-green-6)' }}
    />
  );

  if (withTooltip) {
    return (
      <Tooltip label="Completed" withArrow>
        {icon}
      </Tooltip>
    );
  }
  return icon;
}

export function ReadingIcon({ size = 16, withTooltip = true }: StatusIconProps): JSX.Element {
  const icon = (
    <IconBook
      size={size}
      stroke={1.5}
      style={{ flexShrink: 0, color: 'var(--mantine-color-blue-6)' }}
    />
  );

  if (withTooltip) {
    return (
      <Tooltip label="Reading" withArrow>
        {icon}
      </Tooltip>
    );
  }
  return icon;
}

export function OnHoldIcon({ size = 16, withTooltip = true }: StatusIconProps): JSX.Element {
  const icon = (
    <IconPlayerPause
      size={size}
      stroke={1.5}
      style={{ flexShrink: 0, color: 'var(--mantine-color-yellow-6)' }}
    />
  );

  if (withTooltip) {
    return (
      <Tooltip label="On Hold" withArrow>
        {icon}
      </Tooltip>
    );
  }
  return icon;
}

export function AbandonedIcon({ size = 16, withTooltip = true }: StatusIconProps): JSX.Element {
  const icon = (
    <IconArchive
      size={size}
      stroke={1.5}
      style={{ flexShrink: 0, color: 'var(--mantine-color-red-6)' }}
    />
  );

  if (withTooltip) {
    return (
      <Tooltip label="Abandoned" withArrow>
        {icon}
      </Tooltip>
    );
  }
  return icon;
}
