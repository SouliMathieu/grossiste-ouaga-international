export type PaymentProviderCode =
  | 'ORANGE_MONEY'
  | 'MOOV_MONEY'
  | 'WAVE'
  | 'CORIS_MONEY'
  | 'CASH_ON_DELIVERY'
  | 'PAY_AT_STORE'
  | 'BANK_TRANSFER';

export type PaymentStatus =
  'PENDING' | 'SUBMITTED' | 'VERIFYING' | 'PAID' | 'REJECTED' | 'REFUNDED' | 'EXPIRED';

export type PaymentActionMode = 'MANUAL' | 'DEEPLINK' | 'USSD' | 'HOSTED_CHECKOUT';
export type PaymentVerificationMode = 'MANUAL' | 'PROVIDER';

export interface PaymentMethod {
  code: PaymentProviderCode;
  name: string;
  description: string;
  enabled: boolean;
  actionMode: PaymentActionMode;
  verificationMode: PaymentVerificationMode;
}
