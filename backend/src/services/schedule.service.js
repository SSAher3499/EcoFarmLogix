const cron = require('node-cron');
const { prisma } = require('../config/database');

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronTask = null;
  }

  /**
   * Start the scheduler service
   * Runs every minute to check and execute schedules
   */
  start() {
    if (this.isRunning) {
      console.log('⏰ Scheduler is already running');
      return;
    }

    // Run every minute: '* * * * *'
    // Format: minute hour day month day-of-week
    this.cronTask = cron.schedule('* * * * *', async () => {
      await this.checkAndExecuteSchedules();
    });

    this.isRunning = true;
    console.log('⏰ Scheduler service started - checking schedules every minute');
  }

  /**
   * Stop the scheduler service
   */
  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.isRunning = false;
      console.log('⏰ Scheduler service stopped');
    }
  }

  /**
   * Check for schedules that should run now and execute them
   */
  async checkAndExecuteSchedules() {
    try {
      const now = new Date();
      const currentTime = this.formatTime(now); // "HH:MM"
      const currentDay = now.getDay(); // 0-6

      // Find all enabled schedules that should run at this time on this day
      const schedules = await prisma.schedule.findMany({
        where: {
          isEnabled: true,
          time: currentTime,
        },
        include: {
          actuator: {
            include: {
              device: true
            }
          },
          farm: true
        }
      });

      // Filter schedules by day of week
      const schedulesToRun = schedules.filter(schedule =>
        schedule.daysOfWeek.includes(currentDay)
      );

      for (const schedule of schedulesToRun) {
        // Check if already ran this minute
        if (this.hasRunThisMinute(schedule.lastRunAt, now)) {
          continue; // Skip, already ran
        }

        try {
          await this.executeSchedule(schedule, now);
        } catch (error) {
          console.error(`❌ Schedule execution failed: ${schedule.name}`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in scheduler check:', error);
    }
  }

  /**
   * Execute a schedule
   */
  async executeSchedule(schedule, now) {
    try {
      console.log(`⏰ Executing schedule: ${schedule.name} - ${schedule.actuator.actuatorName} ${schedule.action}`);

      // Execute the actuator command
      await this.controlActuator(schedule.actuator, schedule.action, schedule.farmId);

      // Update lastRunAt and calculate nextRunAt
      const nextRunAt = this.calculateNextRun(schedule);

      await prisma.schedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: now,
          nextRunAt: nextRunAt
        }
      });

      // Log the action
      await this.logScheduleAction(schedule, schedule.action);

      console.log(`✅ Schedule executed successfully: ${schedule.name}`);

      // Handle auto turn OFF after duration
      if (schedule.duration && schedule.action === 'ON') {
        setTimeout(async () => {
          try {
            console.log(`⏰ Auto OFF: ${schedule.actuator.actuatorName} after ${schedule.duration} minutes`);
            await this.controlActuator(schedule.actuator, 'OFF', schedule.farmId);
            await this.logScheduleAction(schedule, 'OFF (Auto)');
          } catch (error) {
            console.error(`❌ Auto OFF failed for ${schedule.actuator.actuatorName}:`, error);
          }
        }, schedule.duration * 60 * 1000); // Convert minutes to milliseconds
      }

    } catch (error) {
      console.error(`❌ Error executing schedule ${schedule.name}:`, error);
      throw error;
    }
  }

  /**
   * Control an actuator (turn ON/OFF)
   */
  async controlActuator(actuator, action, farmId) {
    try {
      // Update actuator state
      await prisma.actuator.update({
        where: { id: actuator.id },
        data: {
          currentState: action,
          lastActionAt: new Date()
        }
      });

      // TODO: Send MQTT command to device
      // This would publish to MQTT topic: farms/{farmId}/devices/{deviceId}/actuators/{actuatorId}/set
      // Payload: { action: "ON" or "OFF" }

      console.log(`🎮 Actuator ${actuator.actuatorName} set to ${action}`);

      return true;
    } catch (error) {
      console.error(`❌ Error controlling actuator ${actuator.actuatorName}:`, error);
      throw error;
    }
  }

  /**
   * Log schedule action to action_logs table
   */
  async logScheduleAction(schedule, action) {
    try {
      await prisma.actionLog.create({
        data: {
          farmId: schedule.farmId,
          actuatorId: schedule.actuatorId,
          action: action,
          value: null,
          source: 'SCHEDULE',
          userId: schedule.createdById
        }
      });
    } catch (error) {
      console.error('❌ Error logging schedule action:', error);
    }
  }

  /**
   * Calculate next run time for a schedule
   */
  calculateNextRun(schedule) {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If the time has passed today, start from tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    // Find next valid day based on daysOfWeek
    let attempts = 0;
    while (!schedule.daysOfWeek.includes(nextRun.getDay()) && attempts < 7) {
      nextRun.setDate(nextRun.getDate() + 1);
      attempts++;
    }

    return nextRun;
  }

  /**
   * Check if schedule has already run this minute
   */
  hasRunThisMinute(lastRunAt, now) {
    if (!lastRunAt) return false;

    const lastRun = new Date(lastRunAt);

    return (
      lastRun.getFullYear() === now.getFullYear() &&
      lastRun.getMonth() === now.getMonth() &&
      lastRun.getDate() === now.getDate() &&
      lastRun.getHours() === now.getHours() &&
      lastRun.getMinutes() === now.getMinutes()
    );
  }

  /**
   * Format time as HH:MM
   */
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

// Export singleton instance
module.exports = new SchedulerService();
