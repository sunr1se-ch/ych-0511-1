import { FieldModel } from '../models/FieldModel';
import { SensorDataModel } from '../models/SensorDataModel';
import { WorkOrderModel } from '../models/WorkOrderModel';

export class WorkOrderService {
  static checkAndCreateWorkOrder(fieldId: number): boolean {
    const recentData = SensorDataModel.getRecentByFieldId(fieldId, 3);
    if (recentData.length < 3) {
      return false;
    }

    const field = FieldModel.getById(fieldId);
    if (!field) {
      return false;
    }

    const allOverThreshold = recentData.every(d => d.humidity >= field.humidityThreshold);
    if (!allOverThreshold) {
      return false;
    }

    const today = new Date().toISOString().split('T')[0];
    const existingOpenOrder = WorkOrderModel.getPendingByFieldIdAndDate(fieldId, today);
    if (existingOpenOrder) {
      return false;
    }

    const avgHumidity = recentData.reduce((sum, d) => sum + d.humidity, 0) / recentData.length;
    const triggeredAt = new Date().toISOString();
    WorkOrderModel.create(fieldId, avgHumidity, triggeredAt);

    console.log(`[WorkOrderService] Created work order for field ${field.code}, avg humidity: ${avgHumidity.toFixed(2)}%`);
    return true;
  }

  static checkAllFields(): number {
    const fields = FieldModel.getAll();
    let createdCount = 0;
    for (const field of fields) {
      if (this.checkAndCreateWorkOrder(field.id)) {
        createdCount++;
      }
    }
    return createdCount;
  }

  static simulateSensorData(): void {
    const fields = FieldModel.getAll();
    const now = new Date();

    for (const field of fields) {
      let humidity: number;

      if (field.id === 1) {
        const recentData = SensorDataModel.getRecentByFieldId(field.id, 3);
        const overCount = recentData.filter(d => d.humidity >= field.humidityThreshold).length;
        
        if (overCount === 0) {
          humidity = field.humidityThreshold + 5 + Math.random() * 5;
        } else if (overCount < 3) {
          humidity = field.humidityThreshold + 3 + Math.random() * 5;
        } else {
          humidity = field.humidityThreshold - 10 + Math.random() * 8;
        }
      } else {
        const baseHumidity = field.humidityThreshold - 8;
        humidity = baseHumidity + Math.random() * 10;
      }

      humidity = Math.round(humidity * 100) / 100;
      SensorDataModel.create(field.id, humidity, now.toISOString());
      console.log(`[SensorSimulator] Field ${field.code}: ${humidity}%`);

      this.checkAndCreateWorkOrder(field.id);
    }
  }
}
