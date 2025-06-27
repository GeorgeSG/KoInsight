import { useComputedColorScheme } from '@mantine/core';
import C from 'clsx';
import { JSX } from 'react';
import { NavLink } from 'react-router';
import LogoSVG from '../../assets/logo.svg?react';
import LogoMono from '../../assets/logo-mono.svg?react';
import { RoutePath } from '../../routes';

import style from './logo.module.css';

export type LogoProps = {
  className?: string;
  onClick?: () => void;
};

export function Logo({ onClick, className }: LogoProps): JSX.Element {
  const colorScheme = useComputedColorScheme();

  return (
    <NavLink to={RoutePath.HOME} onClick={onClick} className={C(style.Logo, className)}>
      <span className={style.LogoImage}>
        {colorScheme === 'light' ? <LogoSVG /> : <LogoMono />}
      </span>
      <strong>KoInsight</strong>
    </NavLink>
  );
}
