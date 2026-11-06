const SENSOR_CONFIG = {
  pulse: { service: 'heart_rate', characteristic: 'heart_rate_measurement', label: 'heart-rate monitor', mode: 'stream' },
  pressure: { service: 'blood_pressure', characteristic: 'blood_pressure_measurement', label: 'blood-pressure cuff', mode: 'single' },
  oxygen: { service: 'pulse_oximeter', characteristic: 'plx_spot_check_measurement', label: 'pulse oximeter', mode: 'single' },
  glucose: { service: 'glucose', characteristic: 'glucose_measurement', label: 'glucose meter', mode: 'last-record' },
};

function shortFloat(data, offset) {
  const raw = data.getUint16(offset, true);
  let mantissa = raw & 0x0fff;
  if (mantissa >= 0x0800) mantissa -= 0x1000;
  let exponent = (raw >> 12) & 0x0f;
  if (exponent >= 0x08) exponent -= 0x10;
  const value = mantissa * 10 ** exponent;
  return Number.isFinite(value) ? value : null;
}

function parseMeasurement(field, data) {
  if (!data || data.byteLength < 2) return null;
  if (field === 'pulse') {
    const flags = data.getUint8(0);
    if ((flags & 0x04) && !(flags & 0x02)) return null;
    const value = flags & 0x01 ? data.getUint16(1, true) : data.getUint8(1);
    return Number.isFinite(value) ? { value, time: new Date().toISOString() } : null;
  }
  if (field === 'pressure') {
    if (data.byteLength < 7) return null;
    const flags = data.getUint8(0);
    const factor = flags & 0x01 ? 7.50062 : 1;
    const systolic = shortFloat(data, 1) * factor;
    const diastolic = shortFloat(data, 3) * factor;
    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic) || systolic <= diastolic) return null;
    return { value: { systolic: Math.round(systolic), diastolic: Math.round(diastolic) }, time: new Date().toISOString() };
  }
  if (field === 'oxygen') {
    if (data.byteLength < 3) return null;
    const value = shortFloat(data, 1);
    if (!Number.isFinite(value) || value < 0 || value > 100) return null;
    return { value: Math.round(value * 10) / 10, time: new Date().toISOString() };
  }
  if (field === 'glucose') {
    if (data.byteLength < 10) return null;
    const flags = data.getUint8(0);
    if (!(flags & 0x02)) return null;
    const sequence = data.getUint16(1, true);
    const year = data.getUint16(3, true);
    const month = data.getUint8(5), day = data.getUint8(6);
    const hour = data.getUint8(7), minute = data.getUint8(8), second = data.getUint8(9);
    if (!year || !month || !day || month > 12 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
    let time = Date.UTC(year, month - 1, day, hour, minute, second);
    let offset = 10;
    if (flags & 0x01) { if (data.byteLength < offset + 2) return null; time += data.getInt16(offset, true) * 60000; offset += 2; }
    if (data.byteLength < offset + 3) return null;
    const concentration = shortFloat(data, offset);
    if (!Number.isFinite(concentration)) return null;
    const value = flags & 0x04 ? concentration * 18015.6 : concentration * 100000;
    if (!Number.isFinite(value) || value < 0 || value > 9999) return null;
    const measuredAt = new Date(time);
    return { value: Math.round(value), time: Number.isFinite(measuredAt.getTime()) ? measuredAt.toISOString() : new Date().toISOString(), sequence };
  }
  return null;
}

/** Pair one Bluetooth LE sensor from a user-initiated button click. */
export async function connectCrewSensor(field, { onReading, onDisconnect, onStatus }) {
  const config = SENSOR_CONFIG[field];
  if (!config) throw new Error('This sensor type is not configured.');
  if (!navigator.bluetooth?.requestDevice) throw new Error('Bluetooth pairing is unavailable in this browser. Try a recent Chrome or Edge browser over HTTPS.');
  onStatus?.(`Choose a compatible ${config.label} in the browser picker.`);
  const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [config.service] }] });
  const handleDisconnect = () => onDisconnect?.(device.name || config.label);
  device.addEventListener('gattserverdisconnected', handleDisconnect);
  try {
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(config.service);
    const characteristic = await service.getCharacteristic(config.characteristic);
    const onChange = event => {
      const reading = parseMeasurement(field, event.target.value);
      if (reading) onReading?.({ ...reading, deviceName: device.name || config.label });
    };
    characteristic.addEventListener('characteristicvaluechanged', onChange);
    await characteristic.startNotifications();
    if (config.mode === 'last-record') {
      const control = await service.getCharacteristic('record_access_control_point');
      await control.startNotifications();
      const request = new Uint8Array([0x01, 0x06]); // Report the latest stored record.
      if (control.writeValueWithResponse) await control.writeValueWithResponse(request);
      else await control.writeValue(request);
    }
    onStatus?.(config.mode === 'last-record'
      ? `${device.name || config.label} connected. The latest stored glucose reading was requested; returned readings are saved automatically.`
      : `${device.name || config.label} connected. New readings will be saved automatically when the sensor sends them.`);
    return {
      device,
      disconnect() { if (device.gatt?.connected) device.gatt.disconnect(); else handleDisconnect(); },
    };
  } catch (error) {
    if (device.gatt?.connected) device.gatt.disconnect();
    device.removeEventListener('gattserverdisconnected', handleDisconnect);
    throw error;
  }
}
