/**
 * Payment provider abstraction for payment operations.
 */
export interface PaymentProvider {
  /**
   * Create a payment intent for the specified amount and currency.
   * @param amountCents Amount in cents to charge.
   * @param currency ISO currency code (e.g. "usd").
   * @returns Object containing the payment intent ID and client secret.
   * @throws Error when intent creation fails.
   */
  createPaymentIntent(
    amountCents: number,
    currency: string,
  ): Promise<{
    id: string;
    clientSecret: string | null;
  }>;

  /**
   * Confirm a payment intent by ID.
   * @param paymentIntentId Stripe payment intent identifier.
   * @returns The payment intent status string.
   * @throws Error when confirmation fails.
   */
  confirmPayment(paymentIntentId: string): Promise<string>;

  /**
   * Handle a webhook event payload.
   * @param event Raw webhook event from the provider.
   * @returns String describing the handled event.
   * @throws Error when webhook validation fails.
   */
  handleWebhook(event: unknown): Promise<string>;

  /**
   * Refund a payment intent.
   * @param paymentIntentId Payment intent to refund.
   * @param amountCents Optional amount in cents to refund.
   * @returns The refund ID.
   * @throws Error when refund fails.
   */
  refund(paymentIntentId: string, amountCents?: number): Promise<string>;
}
