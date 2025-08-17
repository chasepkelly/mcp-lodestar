// src/demo-mode.ts
import { Logger } from './logger.js';

export class DemoMode {
  static isEnabled(): boolean {
    const noCreds =
      !process.env.LODESTAR_USERNAME || !process.env.LODESTAR_PASSWORD;
    const explicitDemo = process.env.DEMO_MODE === 'true';
    return noCreds || explicitDemo;
  }

  static getMockSession(): string {
    return 'demo-session-' + Date.now();
  }

  static getMockResponse(endpoint: string, args: any): any {
    Logger.debug(`Demo Mode: Mocking ${endpoint}`, args);

    if (endpoint.includes('login')) {
      return {
        session_id: this.getMockSession(),
        success: 'Login successful (DEMO MODE)',
        demo_mode: true,
      };
    }

    if (endpoint.includes('closing_cost')) {
      const loanAmount = args.loan_amount || 300000;
      const purchasePrice = args.purchase_price || 400000;
      const isPurchase = args.purpose === '11';

      return {
        success: true,
        demo_mode: true,
        transaction_type: isPurchase ? 'Purchase' : 'Refinance',
        location: {
          state: args.state,
          county: args.county,
          township: args.township,
        },
        title_fees: {
          'Settlement Fee': 995,
          'Title Search': 450,
          'Document Preparation': 150,
        },
        title_insurance: {
          'Lenders Policy': Math.round(loanAmount * 0.0035),
          'Owners Policy': isPurchase ? Math.round(purchasePrice * 0.004) : 0,
        },
        total_closing_costs: Math.round(
          1595 + loanAmount * 0.0035 + (isPurchase ? purchasePrice * 0.004 : 0)
        ),
        disclaimer: 'DEMO MODE - Sample calculations',
      };
    }

    return {
      success: true,
      demo_mode: true,
      message: 'Mock response',
      data: args,
    };
  }
}
