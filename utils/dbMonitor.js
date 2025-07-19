const mongoose = require('mongoose');
const { logInfo, logWarn, logError } = require('./logger');

/**
 * Database connection pool monitoring utility
 * Provides insights into connection pool performance and health
 */
class DatabaseMonitor {
  constructor() {
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      lastCheck: null,
    };

    this.monitoringInterval = null;
  }

  /**
   * Start monitoring the database connection pool
   * @param {number} intervalMs - Monitoring interval in milliseconds (default: 30000)
   */
  startMonitoring(intervalMs = 30000) {
    if (this.monitoringInterval) {
      logWarn('Database monitoring already started');
      return;
    }

    logInfo('Starting database connection pool monitoring', { intervalMs });

    this.monitoringInterval = setInterval(() => {
      this.logConnectionStats();
    }, intervalMs);

    // Log initial stats
    this.logConnectionStats();
  }

  /**
   * Stop monitoring the database connection pool
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logInfo('Database connection pool monitoring stopped');
    }
  }

  /**
   * Get current connection pool statistics
   * @returns {Object} Connection pool statistics
   */
  getConnectionStats() {
    const connection = mongoose.connection;
    const db = connection.db;

    if (!db || !db.admin) {
      return {
        error: 'Database not connected or admin access not available',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Get server status information
      const serverStatus = db.admin().serverStatus();

      return {
        timestamp: new Date().toISOString(),
        connections: {
          current: serverStatus.connections?.current || 0,
          available: serverStatus.connections?.available || 0,
          totalCreated: serverStatus.connections?.totalCreated || 0,
        },
        network: {
          bytesIn: serverStatus.network?.bytesIn || 0,
          bytesOut: serverStatus.network?.bytesOut || 0,
          numRequests: serverStatus.network?.numRequests || 0,
        },
        opcounters: serverStatus.opcounters || {},
        mem: serverStatus.mem || {},
        uptime: serverStatus.uptime || 0,
      };
    } catch (error) {
      logError('Error getting database stats', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Log current connection pool statistics
   */
  logConnectionStats() {
    const stats = this.getConnectionStats();

    if (stats.error) {
      logWarn('Unable to get database stats', { error: stats.error });
      return;
    }

    const { connections, network, opcounters } = stats;

    // Calculate connection pool utilization
    const poolUtilization =
      connections.available > 0
        ? ((connections.current / (connections.current + connections.available)) * 100).toFixed(2)
        : 0;

    // Determine health status
    let healthStatus = 'healthy';
    if (poolUtilization > 80) {
      healthStatus = 'warning';
    } else if (poolUtilization > 95) {
      healthStatus = 'critical';
    }

    const logData = {
      connections: {
        current: connections.current,
        available: connections.available,
        totalCreated: connections.totalCreated,
        utilization: `${poolUtilization}%`,
      },
      network: {
        bytesIn: this.formatBytes(network.bytesIn),
        bytesOut: this.formatBytes(network.bytesOut),
        requests: network.numRequests,
      },
      operations: {
        insert: opcounters.insert || 0,
        query: opcounters.query || 0,
        update: opcounters.update || 0,
        delete: opcounters.delete || 0,
      },
      health: healthStatus,
    };

    if (healthStatus === 'critical') {
      logError('Database connection pool critical utilization', logData);
    } else if (healthStatus === 'warning') {
      logWarn('Database connection pool high utilization', logData);
    } else {
      logInfo('Database connection pool status', logData);
    }

    // Update internal stats
    this.stats = {
      ...this.stats,
      totalConnections: connections.current + connections.available,
      activeConnections: connections.current,
      idleConnections: connections.available,
      lastCheck: new Date(),
    };
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted bytes
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get connection pool health check
   * @returns {Object} Health check result
   */
  getHealthCheck() {
    const stats = this.getConnectionStats();

    if (stats.error) {
      return {
        status: 'error',
        message: stats.error,
        timestamp: stats.timestamp,
      };
    }

    const { connections } = stats;
    const poolUtilization =
      connections.available > 0
        ? (connections.current / (connections.current + connections.available)) * 100
        : 0;

    return {
      status: poolUtilization > 95 ? 'critical' : poolUtilization > 80 ? 'warning' : 'healthy',
      utilization: poolUtilization,
      connections: {
        current: connections.current,
        available: connections.available,
        total: connections.current + connections.available,
      },
      timestamp: stats.timestamp,
    };
  }

  /**
   * Get monitoring configuration
   * @returns {Object} Monitoring configuration
   */
  getConfig() {
    return {
      maxPoolSize: mongoose.connection.db?.s?.options?.maxPoolSize || 'unknown',
      minPoolSize: mongoose.connection.db?.s?.options?.minPoolSize || 'unknown',
      maxIdleTimeMS: mongoose.connection.db?.s?.options?.maxIdleTimeMS || 'unknown',
      monitoringActive: !!this.monitoringInterval,
      lastStats: this.stats,
    };
  }
}

// Create singleton instance
const dbMonitor = new DatabaseMonitor();

module.exports = dbMonitor;
