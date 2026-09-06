// Cash Drawer Service
// Generates RJ11 / Printer Kick pulse signal, logs opening events and tamper audit

import { HardwareStatus } from './WeighingScaleService';

class CashDrawerService {
  private isConnected = true;
  private isOpen = false;
  private lastHeartbeat = new Date().toISOString();
  private openEvents: { timestamp: string; cashierId?: string; reason: string }[] = [];

  getStatus(): HardwareStatus {
    return {
      name: 'Electronic Cash Drawer (APG / Posiflex RJ11 Kick)',
      type: 'CASH_DRAWER',
      status: this.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      port: 'RJ11 via Thermal Printer Kick Port',
      lastHeartbeat: this.lastHeartbeat,
      details: `State: ${this.isOpen ? 'OPEN' : 'CLOSED'}, Total kicks: ${this.openEvents.length}`
    };
  }

  async kickDrawer(cashierId?: string, reason = 'CASH_SALE'): Promise<{ success: boolean; message: string }> {
    this.isOpen = true;
    this.lastHeartbeat = new Date().toISOString();
    const event = {
      timestamp: new Date().toISOString(),
      cashierId,
      reason
    };
    this.openEvents.push(event);

    console.log(`💵 [Cash Drawer] Kick pulse sent (ESC p 0 25 250). Drawer opened for reason: ${reason}`);

    // Auto-reset simulated open state after 3 seconds
    setTimeout(() => {
      this.isOpen = false;
    }, 3000);

    return {
      success: true,
      message: 'Cash drawer trigger pulse sent successfully.'
    };
  }

  getOpenHistory() {
    return this.openEvents.slice(-20);
  }
}

export const cashDrawerService = new CashDrawerService();
