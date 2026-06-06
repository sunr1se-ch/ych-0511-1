import cron from 'node-cron';
import { WorkOrderService } from '../services/WorkOrderService';

export function startScheduledTasks() {
  console.log('[Scheduler] Starting scheduled tasks...');

  const sensorTask = cron.schedule('*/10 * * * *', () => {
    console.log('[Scheduler] Running sensor data simulation...');
    WorkOrderService.simulateSensorData();
  });

  const checkTask = cron.schedule('*/5 * * * *', () => {
    console.log('[Scheduler] Running work order check...');
    const created = WorkOrderService.checkAllFields();
    if (created > 0) {
      console.log(`[Scheduler] Created ${created} new work orders`);
    }
  });

  console.log('[Scheduler] Scheduled tasks started');
  console.log('[Scheduler] - Sensor simulation: every 10 minutes');
  console.log('[Scheduler] - Work order check: every 5 minutes');

  process.on('SIGINT', () => {
    sensorTask.stop();
    checkTask.stop();
    console.log('[Scheduler] Scheduled tasks stopped');
    process.exit(0);
  });

  setTimeout(() => {
    console.log('[Scheduler] Running initial sensor simulation...');
    WorkOrderService.simulateSensorData();
  }, 3000);
}
