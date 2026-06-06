import { FieldModel } from '../models/FieldModel';
import { SensorDataModel } from '../models/SensorDataModel';
import { WorkOrderModel } from '../models/WorkOrderModel';
import type { Field } from '../../shared/types';

function calculateFieldStatus(field: Field): { status: 'normal' | 'warning' | 'alarm'; currentHumidity?: number } {
  const latestData = SensorDataModel.getLatestByFieldId(field.id);
  if (!latestData) {
    return { status: 'normal' };
  }

  const currentHumidity = latestData.humidity;
  const threshold = field.humidityThreshold;

  if (currentHumidity >= threshold) {
    return { status: 'alarm', currentHumidity };
  } else if (currentHumidity >= threshold - 5) {
    return { status: 'warning', currentHumidity };
  }

  return { status: 'normal', currentHumidity };
}

export const FieldService = {
  getAllFieldsWithStatus() {
    const fields = FieldModel.getAll();
    return fields.map(field => {
      const { status, currentHumidity } = calculateFieldStatus(field);
      return {
        ...field,
        status,
        currentHumidity,
      };
    });
  },

  getFieldWithStatus(id: number) {
    const field = FieldModel.getById(id);
    if (!field) return null;
    const { status, currentHumidity } = calculateFieldStatus(field);
    return {
      ...field,
      status,
      currentHumidity,
    };
  },
};
