import useSWR from 'swr';
import { fetchFromAPI } from './api';
import { Device } from '@koinsight/common/types/device';

export function useDevices() {
  return useSWR('devices', () => fetchFromAPI<Device[]>('devices'), { fallbackData: [] });
}
