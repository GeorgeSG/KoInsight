import { createDevice, fakeDevice } from '../db/factories/device-factory';
import { db } from '../knex';
import { DeviceRepository } from './device-repository';

describe(DeviceRepository, () => {
  describe(DeviceRepository.getAll, () => {
    it('returns an empty array when no devices exist', async () => {
      const devices = await DeviceRepository.getAll();
      expect(devices).toHaveLength(0);
    });

    it('returns all devices', async () => {
      await createDevice(db, { model: 'Test Device' });
      await createDevice(db, { model: 'Test Device 2' });

      const devices = await DeviceRepository.getAll();

      expect(devices).toHaveLength(2);
      expect(devices[0].model).toBe('Test Device');
      expect(devices[1].model).toBe('Test Device 2');
    });
  });

  describe(DeviceRepository.getById, () => {
    it('gets a device by id', async () => {
      const device = await createDevice(db, { model: 'Test Device' });
      const foundDevice = await DeviceRepository.getById(device.id);

      expect(foundDevice?.model).toEqual(device.model);
    });

    it('returns undefined for non-existent device', async () => {
      const foundDevice = await DeviceRepository.getById('999');
      expect(foundDevice).toBeUndefined();
    });
  });

  describe(DeviceRepository.getByModel, () => {
    it('gets a device by model', async () => {
      const device = await createDevice(db, { model: 'Test Device' });
      const foundDevice = await DeviceRepository.getByModel(device.model);

      expect(foundDevice?.model).toEqual(device.model);
    });

    it('returns undefined for non-existent device', async () => {
      const foundDevice = await DeviceRepository.getById('999');
      expect(foundDevice).toBeUndefined();
    });
  });

  describe(DeviceRepository.insertIfNotExists, () => {
    it('inserts a new device if it does not exist', async () => {
      let foundDevice = await DeviceRepository.getByModel('Test Device');
      expect(foundDevice).toBeUndefined();

      const device = fakeDevice({ model: 'Test Device' });
      await DeviceRepository.insertIfNotExists(device);

      foundDevice = await DeviceRepository.getByModel('Test Device');
      expect(foundDevice?.model).toEqual(device.model);
    });

    it('does not insert a device if it already exists', async () => {
      const device = await createDevice(db, { model: 'Test Device' });
      let foundDevice = await DeviceRepository.getByModel('Test Device');
      expect(foundDevice?.model).toEqual(device.model);
      expect(await DeviceRepository.getAll()).toHaveLength(1);

      await DeviceRepository.insertIfNotExists(device);
      expect(await DeviceRepository.getAll()).toHaveLength(1);
    });
  });

  describe(DeviceRepository.findOrCreateByModel, () => {
    it('creates a device by model', async () => {
      expect(await DeviceRepository.getAll()).toHaveLength(0);
      const foundDevice = await DeviceRepository.findOrCreateByModel('Test Device 1');

      expect(foundDevice?.model).toEqual('Test Device 1');
      expect(await DeviceRepository.getAll()).toHaveLength(1);
    });

    it('returns an existing device by model', async () => {
      const device = await createDevice(db, { model: 'Test Device' });
      expect(await DeviceRepository.getAll()).toHaveLength(1);
      const foundDevice = await DeviceRepository.findOrCreateByModel(device.model);

      expect(foundDevice?.model).toEqual(device.model);
      expect(await DeviceRepository.getAll()).toHaveLength(1);
    });
  });
});
