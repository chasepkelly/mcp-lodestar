export declare class DemoMode {
    private static isDemoMode;
    static isEnabled(): boolean;
    static getMockSession(): string;
    static getMockResponse(endpoint: string, args: any): any;
    private static getMockClosingCosts;
    private static calculateTitleInsurance;
    private static calculateTotalFees;
    private static getMockPropertyTax;
    private static getMockEndorsements;
    private static getMockSubAgents;
    private static getMockCounties;
    private static getMockTownships;
    private static getMockQuestions;
    private static getMockGeocodeCheck;
    private static getMockAppraisalModifiers;
}
