// src/demo-mode.ts
// Demo mode with mock responses for testing without credentials

import { Logger } from './logger';

export class DemoMode {
  private static isDemoMode: boolean = false;

  static isEnabled(): boolean {
    // Enable demo mode if no credentials or explicitly set
    const noCreds =
      !process.env.LODESTAR_USERNAME || !process.env.LODESTAR_PASSWORD;
    const explicitDemo = process.env.DEMO_MODE === 'true';

    this.isDemoMode = noCreds || explicitDemo;

    if (this.isDemoMode) {
      Logger.info('🎮 DEMO MODE ENABLED - Using mock data for all API calls');
    }

    return this.isDemoMode;
  }

  static getMockSession(): string {
    return 'demo-session-' + Date.now();
  }

  static getMockResponse(endpoint: string, args: any): any {
    Logger.debug(`Demo Mode: Mocking response for ${endpoint}`, args);

    switch (endpoint) {
      case '/Login/login.php':
        return {
          session_id: this.getMockSession(),
          success: 'Login successful (DEMO MODE)',
          demo_mode: true,
        };

      case '/closing_cost_calculations.php':
        return this.getMockClosingCosts(args);

      case '/property_tax.php':
        return this.getMockPropertyTax(args);

      case '/endorsements.php':
        return this.getMockEndorsements(args);

      case '/sub_agents.php':
        return this.getMockSubAgents(args);

      case '/counties.php':
        return this.getMockCounties(args);

      case '/townships.php':
        return this.getMockTownships(args);

      case '/questions.php':
        return this.getMockQuestions(args);

      case '/geocode_check.php':
        return this.getMockGeocodeCheck(args);

      case '/appraisal_modifiers.php':
        return this.getMockAppraisalModifiers(args);

      default:
        return { success: true, demo_mode: true, message: 'Mock response' };
    }
  }

  private static getMockClosingCosts(args: any): any {
    const isPurchase = args.purpose === '11';
    const loanAmount = args.loan_amount || 300000;
    const purchasePrice = args.purchase_price || 400000;

    return {
      success: true,
      demo_mode: true,
      transaction_type: isPurchase ? 'Purchase' : 'Refinance',
      location: {
        state: args.state,
        county: args.county,
        township: args.township,
      },
      loan_details: {
        loan_amount: loanAmount,
        purchase_price: isPurchase ? purchasePrice : null,
        purpose: args.purpose,
      },
      title_fees: {
        'Title Search': 450,
        'Title Examination': 225,
        'Title Insurance Binder': 75,
        'Document Preparation': 150,
        'Settlement Fee': 995,
        'Notary Fees': 50,
        'Courier Services': 45,
      },
      title_insurance: {
        "Lender's Title Policy": this.calculateTitleInsurance(
          loanAmount,
          'lender'
        ),
        "Owner's Title Policy": isPurchase
          ? this.calculateTitleInsurance(purchasePrice, 'owner')
          : 0,
        'Simultaneous Issue Discount': isPurchase ? -100 : 0,
        'Reissue Credit':
          args.purpose === '04'
            ? -this.calculateTitleInsurance(loanAmount, 'lender') * 0.4
            : 0,
      },
      recording_fees: {
        'Deed Recording': isPurchase ? 125 : 0,
        'Mortgage Recording': 175,
        'Transfer Tax': isPurchase ? purchasePrice * 0.01 : 0,
        'State Transfer Tax': isPurchase ? purchasePrice * 0.002 : 0,
      },
      total_fees: this.calculateTotalFees(args, loanAmount, purchasePrice),
      pdf_available: args.include_pdf === 1,
      calculation_date: new Date().toISOString(),
      disclaimer:
        'DEMO MODE - These are sample calculations for testing purposes only',
    };
  }

  private static calculateTitleInsurance(
    amount: number,
    type: 'lender' | 'owner'
  ): number {
    // Simplified title insurance calculation
    const baseRate = type === 'lender' ? 0.0035 : 0.004;
    const minPremium = type === 'lender' ? 175 : 200;

    return Math.max(minPremium, Math.round(amount * baseRate));
  }

  private static calculateTotalFees(
    args: any,
    loanAmount: number,
    purchasePrice: number
  ): number {
    let total = 0;

    // Title fees (flat fees)
    total += 450 + 225 + 75 + 150 + 995 + 50 + 45; // $1,990

    // Title insurance
    total += this.calculateTitleInsurance(loanAmount, 'lender');

    if (args.purpose === '11') {
      // Purchase
      total += this.calculateTitleInsurance(purchasePrice, 'owner');
      total -= 100; // Simultaneous issue discount
      total += 125; // Deed recording
      total += purchasePrice * 0.012; // Transfer taxes
    }

    if (args.purpose === '04') {
      // Refinance with reissue
      total -= this.calculateTitleInsurance(loanAmount, 'lender') * 0.4;
    }

    total += 175; // Mortgage recording

    return Math.round(total);
  }

  private static getMockPropertyTax(args: any): any {
    const purchasePrice = args.purchase_price || 400000;
    const annualTax = purchasePrice * 0.012; // 1.2% tax rate
    const monthlyTax = annualTax / 12;

    return {
      success: true,
      demo_mode: true,
      property_address: args.address,
      location: {
        state: args.state,
        county: args.county,
        city: args.city,
      },
      assessment: {
        market_value: purchasePrice,
        assessed_value: purchasePrice * 0.8,
        tax_rate: '1.2%',
        exemptions: ['Homestead Exemption'],
      },
      annual_taxes: {
        county_tax: annualTax * 0.6,
        city_tax: annualTax * 0.25,
        school_tax: annualTax * 0.15,
        total_annual: annualTax,
      },
      monthly_escrow: monthlyTax,
      proration: {
        close_date: args.close_date,
        days_seller_owes: 180,
        proration_amount: (annualTax / 365) * 180,
      },
      disclaimer: 'DEMO MODE - Sample property tax calculation',
    };
  }

  private static getMockEndorsements(args: any): any {
    const endorsements = [
      {
        id: 'ALTA-4',
        name: 'ALTA 4 - Condominium',
        premium: 50,
        required: false,
      },
      {
        id: 'ALTA-5',
        name: 'ALTA 5 - Planned Unit Development',
        premium: 50,
        required: false,
      },
      {
        id: 'ALTA-6',
        name: 'ALTA 6 - Variable Rate Mortgage',
        premium: 75,
        required: false,
      },
      {
        id: 'ALTA-8.1',
        name: 'ALTA 8.1 - Environmental Protection',
        premium: 100,
        required: false,
      },
      {
        id: 'ALTA-9',
        name: 'ALTA 9 - Restrictions, Encroachments',
        premium: 150,
        required: true,
      },
    ];

    // Filter based on transaction type
    if (args.purpose === '11') {
      // Purchase
      endorsements.push({
        id: 'OWNER-1',
        name: "Owner's Enhanced Coverage",
        premium: 200,
        required: false,
      });
    }

    return {
      success: true,
      demo_mode: true,
      location: {
        state: args.state,
        county: args.county,
      },
      transaction_type: args.purpose,
      available_endorsements: endorsements,
      total_if_all_selected: endorsements.reduce(
        (sum, e) => sum + e.premium,
        0
      ),
      disclaimer: 'DEMO MODE - Sample endorsements list',
    };
  }

  private static getMockSubAgents(args: any): any {
    return {
      success: true,
      demo_mode: true,
      location: {
        state: args.state,
        county: args.county,
        township: args.township,
      },
      sub_agents: [
        {
          id: 1,
          name: 'Demo Title Company',
          office_id: 1,
          office_name: 'Main Office',
          address: '123 Demo Street, Demo City, ' + args.state,
          phone: '555-0100',
          email: 'demo@titlecompany.com',
          rating: 4.5,
          reviews: 127,
        },
        {
          id: 2,
          name: 'Sample Title Services',
          office_id: 1,
          office_name: 'Downtown Branch',
          address: '456 Sample Ave, Demo City, ' + args.state,
          phone: '555-0200',
          email: 'info@sampletitle.com',
          rating: 4.8,
          reviews: 89,
        },
        {
          id: 3,
          name: 'Test Title Agency',
          office_id: 2,
          office_name: 'Regional Office',
          address: '789 Test Blvd, Demo City, ' + args.state,
          phone: '555-0300',
          email: 'contact@testtitle.com',
          rating: 4.3,
          reviews: 56,
        },
      ],
      total_agents: 3,
      disclaimer: 'DEMO MODE - Sample sub-agents list',
    };
  }

  private static getMockCounties(args: any): any {
    const stateCounties: Record<string, string[]> = {
      CA: [
        'Los Angeles',
        'San Francisco',
        'San Diego',
        'Orange',
        'Alameda',
        'Santa Clara',
      ],
      TX: ['Harris', 'Dallas', 'Travis', 'Bexar', 'Tarrant', 'Fort Bend'],
      FL: [
        'Miami-Dade',
        'Broward',
        'Palm Beach',
        'Orange',
        'Hillsborough',
        'Duval',
      ],
      NY: ['New York', 'Kings', 'Queens', 'Bronx', 'Nassau', 'Suffolk'],
      IL: ['Cook', 'DuPage', 'Lake', 'Will', 'Kane', 'McHenry'],
    };

    const counties = stateCounties[args.state] || [
      'Demo County',
      'Sample County',
      'Test County',
      'Example County',
    ];

    return {
      success: true,
      demo_mode: true,
      state: args.state,
      counties: counties.map((name) => ({
        name,
        code: name.toUpperCase().replace(/\s+/g, '_'),
        active: true,
      })),
      total_counties: counties.length,
      disclaimer: 'DEMO MODE - Sample counties list',
    };
  }

  private static getMockTownships(args: any): any {
    const townships = [
      'Downtown',
      'Northside',
      'Southside',
      'Eastside',
      'Westside',
      'Midtown',
      'Uptown',
      'Old Town',
      'New Town',
      'Riverside',
    ];

    return {
      success: true,
      demo_mode: true,
      state: args.state,
      county: args.county,
      townships: townships.map((name) => ({
        name: name + ' ' + args.county,
        code: name.toUpperCase(),
        has_additional_tax: Math.random() > 0.7,
        geocoding_required: Math.random() > 0.5,
      })),
      total_townships: townships.length,
      disclaimer: 'DEMO MODE - Sample townships list',
    };
  }

  private static getMockQuestions(args: any): any {
    const questions = [
      {
        id: 'q1',
        question: 'Is this a first-time home buyer?',
        type: 'boolean',
        required: true,
        affects_calculation: true,
      },
      {
        id: 'q2',
        question: 'Will this be your primary residence?',
        type: 'boolean',
        required: true,
        affects_calculation: true,
      },
      {
        id: 'q3',
        question: 'Are you a veteran?',
        type: 'boolean',
        required: false,
        affects_calculation: true,
      },
      {
        id: 'q4',
        question: 'Property type',
        type: 'select',
        options: ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'],
        required: true,
        affects_calculation: true,
      },
    ];

    if (args.purpose === '00' || args.purpose === '04') {
      questions.push({
        id: 'q5',
        question: 'Original purchase date',
        type: 'date',
        required: args.purpose === '04',
        affects_calculation: true,
      });
    }

    return {
      success: true,
      demo_mode: true,
      state: args.state,
      purpose: args.purpose,
      questions,
      total_questions: questions.length,
      required_questions: questions.filter((q) => q.required).length,
      disclaimer: 'DEMO MODE - Sample questions',
    };
  }

  private static getMockGeocodeCheck(args: any): any {
    const inTownship = Math.random() > 0.3;

    return {
      success: true,
      demo_mode: true,
      address: args.address,
      location: {
        state: args.state,
        county: args.county,
        township: args.township,
      },
      geocoding_result: {
        in_township_limits: inTownship,
        additional_tax_applies: inTownship,
        tax_rate: inTownship ? 0.0025 : 0,
        coordinates: {
          latitude: 40.7128 + (Math.random() - 0.5),
          longitude: -74.006 + (Math.random() - 0.5),
        },
      },
      disclaimer: 'DEMO MODE - Sample geocoding result',
    };
  }

  private static getMockAppraisalModifiers(args: any): any {
    const baseAppraisal = 500;
    const modifiers = [];

    if (args.prop_type === 3) {
      // Condo
      modifiers.push({
        type: 'property_type',
        description: 'Condominium',
        adjustment: -50,
      });
    }
    if (args.loan_type === 2) {
      // FHA
      modifiers.push({
        type: 'loan_type',
        description: 'FHA Loan',
        adjustment: 75,
      });
    }
    if (args.loan_type === 3) {
      // VA
      modifiers.push({
        type: 'loan_type',
        description: 'VA Loan',
        adjustment: 0,
      });
    }

    const totalAdjustment = modifiers.reduce((sum, m) => sum + m.adjustment, 0);

    return {
      success: true,
      demo_mode: true,
      location: {
        state: args.state,
        county: args.county,
      },
      base_appraisal_fee: baseAppraisal,
      modifiers,
      total_adjustment: totalAdjustment,
      final_appraisal_fee: baseAppraisal + totalAdjustment,
      disclaimer: 'DEMO MODE - Sample appraisal modifiers',
    };
  }
}
