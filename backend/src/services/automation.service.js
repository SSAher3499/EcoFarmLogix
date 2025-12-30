const { prisma } = require('../config/database');

class AutomationService {
  
  /**
   * Create a new automation rule
   */
  async createRule(farmId, user, ruleData) {
    // Verify farm access
    let farm;
    if (user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can access any farm
      farm = await prisma.farm.findUnique({
        where: { id: farmId }
      });
    } else {
      // Regular users - check ownership or FarmUser access
      farm = await prisma.farm.findFirst({
        where: {
          id: farmId,
          OR: [
            { userId: user.userId },
            { farmUsers: { some: { userId: user.userId, isActive: true } } }
          ]
        }
      });
    }

    if (!farm) {
      throw { status: 404, message: 'Farm not found or access denied' };
    }

    // Verify actuator belongs to this farm
    const actuator = await prisma.actuator.findFirst({
      where: { id: ruleData.actuatorId },
      include: { device: true }
    });

    if (!actuator || actuator.device.farmId !== farmId) {
      throw { status: 400, message: 'Invalid actuator for this farm' };
    }

    // If sensor-based rule, verify sensor belongs to this farm
    if (ruleData.triggerType === 'SENSOR_VALUE' && ruleData.triggerConfig?.sensorId) {
      const sensor = await prisma.sensor.findFirst({
        where: { id: ruleData.triggerConfig.sensorId },
        include: { device: true }
      });

      if (!sensor || sensor.device.farmId !== farmId) {
        throw { status: 400, message: 'Invalid sensor for this farm' };
      }
    }

    const rule = await prisma.automationRule.create({
      data: {
        farmId,
        actuatorId: ruleData.actuatorId,
        name: ruleData.name,
        triggerType: ruleData.triggerType,
        triggerConfig: ruleData.triggerConfig,
        actionConfig: ruleData.actionConfig,
        isEnabled: ruleData.isEnabled ?? true
      },
      include: {
        actuator: {
          select: {
            id: true,
            actuatorName: true,
            actuatorType: true,
            currentState: true
          }
        }
      }
    });

    return rule;
  }

  /**
   * Get all rules for a farm
   */
  async getFarmRules(farmId, user) {
    // Verify farm access
    let farm;
    if (user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can access any farm
      farm = await prisma.farm.findUnique({
        where: { id: farmId }
      });
    } else {
      // Regular users - check ownership or FarmUser access
      farm = await prisma.farm.findFirst({
        where: {
          id: farmId,
          OR: [
            { userId: user.userId },
            { farmUsers: { some: { userId: user.userId, isActive: true } } }
          ]
        }
      });
    }

    if (!farm) {
      throw { status: 404, message: 'Farm not found or access denied' };
    }

    const rules = await prisma.automationRule.findMany({
      where: { farmId },
      include: {
        actuator: {
          select: {
            id: true,
            actuatorName: true,
            actuatorType: true,
            currentState: true,
            device: {
              select: {
                deviceName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich with sensor info for SENSOR_VALUE rules
    const enrichedRules = await Promise.all(
      rules.map(async (rule) => {
        if (rule.triggerType === 'SENSOR_VALUE' && rule.triggerConfig?.sensorId) {
          const sensor = await prisma.sensor.findUnique({
            where: { id: rule.triggerConfig.sensorId },
            select: {
              id: true,
              sensorName: true,
              sensorType: true,
              unit: true,
              lastReading: true
            }
          });
          return { ...rule, sensor };
        }
        return rule;
      })
    );

    return enrichedRules;
  }

  /**
   * Get single rule
   */
  async getRule(ruleId, user) {
    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
      include: {
        farm: {
          select: { userId: true }
        },
        actuator: {
          select: {
            id: true,
            actuatorName: true,
            actuatorType: true,
            currentState: true
          }
        }
      }
    });

    if (!rule) {
      throw { status: 404, message: 'Rule not found' };
    }

    // SUPER_ADMIN can access any rule
    if (user.role !== 'SUPER_ADMIN') {
      // Regular users - check ownership or FarmUser access
      const hasAccess = await prisma.farm.findFirst({
        where: {
          id: rule.farmId,
          OR: [
            { userId: user.userId },
            { farmUsers: { some: { userId: user.userId, isActive: true } } }
          ]
        }
      });

      if (!hasAccess) {
        throw { status: 403, message: 'Access denied' };
      }
    }

    return rule;
  }

  /**
   * Update rule
   */
  async updateRule(ruleId, user, updateData) {
    // Verify rule exists and user has access
    await this.getRule(ruleId, user);

    const rule = await prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        name: updateData.name,
        triggerType: updateData.triggerType,
        triggerConfig: updateData.triggerConfig,
        actionConfig: updateData.actionConfig,
        isEnabled: updateData.isEnabled
      },
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

    return rule;
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleId, user) {
    // Verify rule exists and user has access
    await this.getRule(ruleId, user);

    await prisma.automationRule.delete({
      where: { id: ruleId }
    });

    return { message: 'Rule deleted successfully' };
  }

  /**
   * Toggle rule enabled/disabled
   */
  async toggleRule(ruleId, user) {
    const rule = await this.getRule(ruleId, user);

    const updated = await prisma.automationRule.update({
      where: { id: ruleId },
      data: { isEnabled: !rule.isEnabled }
    });

    return updated;
  }

  /**
   * Evaluate rules for a sensor reading
   * Called when new sensor data arrives via MQTT
   */
  async evaluateSensorRules(sensorId, sensorValue, farmId) {
    try {
      // Get all enabled SENSOR_VALUE rules for this farm
      const rules = await prisma.automationRule.findMany({
        where: {
          farmId,
          triggerType: 'SENSOR_VALUE',
          isEnabled: true
        },
        include: {
          actuator: true
        }
      });

      for (const rule of rules) {
        // Check if this rule applies to this sensor
        if (rule.triggerConfig?.sensorId !== sensorId) {
          continue;
        }

        const condition = rule.triggerConfig?.condition;
        const threshold = parseFloat(rule.triggerConfig?.value);
        const value = parseFloat(sensorValue);

        // Check cooldown (prevent rapid toggling)
        const cooldownMinutes = rule.triggerConfig?.cooldownMinutes || 5;
        if (rule.lastRunAt) {
          const minutesSinceLastRun = (Date.now() - new Date(rule.lastRunAt).getTime()) / 60000;
          if (minutesSinceLastRun < cooldownMinutes) {
            continue; // Still in cooldown
          }
        }

        // Evaluate condition
        let shouldTrigger = false;
        switch (condition) {
          case 'GREATER_THAN':
            shouldTrigger = value > threshold;
            break;
          case 'LESS_THAN':
            shouldTrigger = value < threshold;
            break;
          case 'GREATER_THAN_OR_EQUAL':
            shouldTrigger = value >= threshold;
            break;
          case 'LESS_THAN_OR_EQUAL':
            shouldTrigger = value <= threshold;
            break;
          case 'EQUAL_TO':
            shouldTrigger = value === threshold;
            break;
        }

        if (shouldTrigger) {
          await this.executeAction(rule);
        }
      }
    } catch (error) {
      console.error('Error evaluating automation rules:', error);
    }
  }

  /**
   * Execute the action defined in a rule
   */
  async executeAction(rule) {
    try {
      const desiredState = rule.actionConfig?.state || 'ON';
      
      // Check if actuator is already in desired state
      if (rule.actuator.currentState === desiredState) {
        return; // No action needed
      }

      // Update actuator state
      await prisma.actuator.update({
        where: { id: rule.actuatorId },
        data: {
          currentState: desiredState,
          lastActionAt: new Date()
        }
      });

      // Update rule lastRunAt
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: { lastRunAt: new Date() }
      });

      // Log the action
      await prisma.actionLog.create({
        data: {
          farmId: rule.farmId,
          actuatorId: rule.actuatorId,
          action: desiredState,
          value: `Rule: ${rule.name}`,
          source: 'AUTOMATION'
        }
      });

      console.log(`🤖 Automation: ${rule.name} -> ${rule.actuator.actuatorName} = ${desiredState}`);

      // Return the command to be sent via MQTT
      return {
        actuatorId: rule.actuatorId,
        deviceMac: rule.actuator.device?.macAddress,
        gpioPin: rule.actuator.gpioPin,
        state: desiredState
      };
    } catch (error) {
      console.error('Error executing automation action:', error);
    }
  }

  /**
   * Get available sensors and actuators for a farm (for rule creation)
   */
  async getFarmComponents(farmId, user) {
    // Verify farm access
    let farm;
    if (user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can access any farm
      farm = await prisma.farm.findUnique({
        where: { id: farmId }
      });
    } else {
      // Regular users - check ownership or FarmUser access
      farm = await prisma.farm.findFirst({
        where: {
          id: farmId,
          OR: [
            { userId: user.userId },
            { farmUsers: { some: { userId: user.userId, isActive: true } } }
          ]
        }
      });
    }

    if (!farm) {
      throw { status: 404, message: 'Farm not found or access denied' };
    }

    const devices = await prisma.device.findMany({
      where: { farmId },
      include: {
        sensors: {
          where: { isActive: true },
          select: {
            id: true,
            sensorName: true,
            sensorType: true,
            unit: true,
            lastReading: true
          }
        },
        actuators: {
          where: { isActive: true },
          select: {
            id: true,
            actuatorName: true,
            actuatorType: true,
            currentState: true
          }
        }
      }
    });

    const sensors = devices.flatMap(d => 
      d.sensors.map(s => ({ ...s, deviceName: d.deviceName }))
    );
    
    const actuators = devices.flatMap(d => 
      d.actuators.map(a => ({ ...a, deviceName: d.deviceName }))
    );

    return { sensors, actuators };
  }
}

module.exports = new AutomationService();