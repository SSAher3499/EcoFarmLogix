const { prisma } = require('../config/database');

class ScheduleController {
  // Get all schedules for a farm
  async getFarmSchedules(req, res) {
    try {
      const { farmId } = req.params;

      const schedules = await prisma.schedule.findMany({
        where: { farmId },
        include: {
          actuator: {
            select: {
              id: true,
              actuatorName: true,
              actuatorType: true,
              currentState: true
            }
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(schedules);
    } catch (error) {
      console.error('Error fetching farm schedules:', error);
      res.status(500).json({ message: 'Failed to fetch schedules', error: error.message });
    }
  }

  // Get single schedule
  async getSchedule(req, res) {
    try {
      const { scheduleId } = req.params;

      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          actuator: {
            select: {
              id: true,
              actuatorName: true,
              actuatorType: true,
              currentState: true
            }
          },
          farm: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      res.json(schedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({ message: 'Failed to fetch schedule', error: error.message });
    }
  }

  // Create new schedule
  async createSchedule(req, res) {
    try {
      const { farmId } = req.params;
      const {
        actuatorId,
        name,
        description,
        scheduleType,
        time,
        daysOfWeek,
        action,
        duration
      } = req.body;

      // Check authentication
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
      }

      // Validate required fields
      if (!actuatorId || !name || !time || !action) {
        return res.status(400).json({
          message: 'Missing required fields: actuatorId, name, time, action'
        });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return res.status(400).json({
          message: 'Invalid time format. Use HH:MM (24-hour format)'
        });
      }

      // Validate action
      if (!['ON', 'OFF'].includes(action)) {
        return res.status(400).json({
          message: 'Action must be either ON or OFF'
        });
      }

      // Validate days of week
      if (daysOfWeek && !Array.isArray(daysOfWeek)) {
        return res.status(400).json({
          message: 'daysOfWeek must be an array'
        });
      }

      // Calculate next run time
      const nextRunAt = this.calculateNextRun({ time, daysOfWeek: daysOfWeek || [0,1,2,3,4,5,6] });

      const schedule = await prisma.schedule.create({
        data: {
          name,
          description: description || null,
          scheduleType: scheduleType || 'DAILY',
          time,
          daysOfWeek: daysOfWeek || [0,1,2,3,4,5,6],
          action,
          duration: duration ? parseInt(duration) : null,
          nextRunAt,
          // Use connect syntax for relations
          farm: { connect: { id: farmId } },
          actuator: { connect: { id: actuatorId } },
          createdBy: { connect: { id: req.user.userId } }
        },
        include: {
          actuator: {
            select: {
              id: true,
              actuatorName: true,
              actuatorType: true
            }
          },
          farm: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({
        message: 'Schedule created successfully',
        schedule
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({ message: 'Failed to create schedule', error: error.message });
    }
  }

  // Update schedule
  async updateSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const {
        name,
        description,
        scheduleType,
        time,
        daysOfWeek,
        action,
        duration,
        isEnabled
      } = req.body;

      // Check if schedule exists
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId }
      });

      if (!existingSchedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      // Validate time format if provided
      if (time) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
          return res.status(400).json({
            message: 'Invalid time format. Use HH:MM (24-hour format)'
          });
        }
      }

      // Validate action if provided
      if (action && !['ON', 'OFF'].includes(action)) {
        return res.status(400).json({
          message: 'Action must be either ON or OFF'
        });
      }

      // Calculate new next run time if time or days changed
      let nextRunAt = existingSchedule.nextRunAt;
      if (time || daysOfWeek) {
        nextRunAt = this.calculateNextRun({
          time: time || existingSchedule.time,
          daysOfWeek: daysOfWeek || existingSchedule.daysOfWeek
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (scheduleType !== undefined) updateData.scheduleType = scheduleType;
      if (time !== undefined) updateData.time = time;
      if (daysOfWeek !== undefined) updateData.daysOfWeek = daysOfWeek;
      if (action !== undefined) updateData.action = action;
      if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
      if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
      if (nextRunAt) updateData.nextRunAt = nextRunAt;

      const schedule = await prisma.schedule.update({
        where: { id: scheduleId },
        data: updateData,
        include: {
          actuator: {
            select: {
              id: true,
              actuatorName: true,
              actuatorType: true
            }
          }
        }
      });

      res.json({
        message: 'Schedule updated successfully',
        schedule
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ message: 'Failed to update schedule', error: error.message });
    }
  }

  // Delete schedule
  async deleteSchedule(req, res) {
    try {
      const { scheduleId } = req.params;

      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId }
      });

      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      await prisma.schedule.delete({
        where: { id: scheduleId }
      });

      res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ message: 'Failed to delete schedule', error: error.message });
    }
  }

  // Toggle schedule enabled/disabled
  async toggleSchedule(req, res) {
    try {
      const { scheduleId } = req.params;

      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId }
      });

      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      const updatedSchedule = await prisma.schedule.update({
        where: { id: scheduleId },
        data: { isEnabled: !schedule.isEnabled },
        include: {
          actuator: {
            select: {
              id: true,
              actuatorName: true,
              actuatorType: true
            }
          }
        }
      });

      res.json({
        message: `Schedule ${updatedSchedule.isEnabled ? 'enabled' : 'disabled'} successfully`,
        schedule: updatedSchedule
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      res.status(500).json({ message: 'Failed to toggle schedule', error: error.message });
    }
  }

  // Helper function to calculate next run time
  calculateNextRun({ time, daysOfWeek }) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If the time has passed today, start from tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    // Find next valid day
    let attempts = 0;
    while (!daysOfWeek.includes(nextRun.getDay()) && attempts < 7) {
      nextRun.setDate(nextRun.getDate() + 1);
      attempts++;
    }

    return nextRun;
  }
}

module.exports = new ScheduleController();
