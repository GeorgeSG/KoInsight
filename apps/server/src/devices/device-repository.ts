import { Device } from '@koinsight/common/types/device';
import { db } from '../knex';

export class DeviceRepository {
  static async getAll(): Promise<Device[]> {
    return db<Device>('device').select('*');
  }

  static async getById(id: string): Promise<Device | undefined> {
    return db<Device>('device').where({ id }).first();
  }

  static async getByModel(model: string): Promise<Device | undefined> {
    return db<Device>('device').where({ model }).first();
  }

  static async insertIfNotExists(device: Device): Promise<void> {
    const existingDevice = await this.getById(device.id);

    if (!existingDevice) {
      await db<Device>('device').insert(device);
    }
  }

  static async findOrCreateByModel(model: Device['model']): Promise<Device> {
    const existingDevice = await db<Device>('device').where({ model }).first();

    if (existingDevice) {
      return existingDevice;
    }

    const [result] = await db<Device>('device').insert({ model }).returning('*');
    return result;
  }
}
