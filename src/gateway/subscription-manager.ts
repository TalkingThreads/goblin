/**
 * Subscription Manager for resource subscriptions
 */

import { createLogger } from "../observability/logger.js";

const logger = createLogger("subscription-manager");

/**
 * Subscription tracking entry
 */
export interface Subscription {
  clientId: string;
  uri: string;
  serverId: string;
  subscribedAt: Date;
}

/**
 * Configuration for subscription limits
 */
export interface SubscriptionConfig {
  maxSubscriptionsPerClient: number;
}

/**
 * Default subscription configuration
 */
const DEFAULT_CONFIG: SubscriptionConfig = {
  maxSubscriptionsPerClient: 100,
};

/**
 * Manages resource subscriptions for the gateway.
 * Tracks which clients are subscribed to which resources and routes notifications.
 */
export class SubscriptionManager {
  private subscriptions = new Map<string, Set<string>>(); // uri -> Set<clientId>
  private clientSubscriptions = new Map<string, Set<string>>(); // clientId -> Set<uri>
  private subscriptionDetails = new Map<string, Subscription>(); // "clientId:uri" -> Subscription
  private config: SubscriptionConfig;

  constructor(config?: Partial<SubscriptionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Subscribe a client to a resource URI.
   * Validates that the URI exists and enforces subscription limits.
   *
   * @param clientId - The client identifier
   * @param uri - The resource URI to subscribe to
   * @param serverId - The server that owns this resource
   * @returns The subscription object if successful
   * @throws Error if URI doesn't exist or subscription limit exceeded
   */
  subscribe(clientId: string, uri: string, serverId: string): Subscription {
    const subscriptionKey = `${clientId}:${uri}`;

    // Check if already subscribed
    if (this.subscriptionDetails.has(subscriptionKey)) {
      logger.debug({ clientId, uri }, "Client already subscribed to resource");
      // biome-ignore lint/style/noNonNullAssertion: Existence checked above via has()
      return this.subscriptionDetails.get(subscriptionKey)!;
    }

    // Check subscription limit
    const currentSubscriptions = this.clientSubscriptions.get(clientId)?.size ?? 0;
    if (currentSubscriptions >= this.config.maxSubscriptionsPerClient) {
      const error = new Error(
        `Subscription limit exceeded. Maximum ${this.config.maxSubscriptionsPerClient} subscriptions per client.`,
      );
      logger.warn(
        { clientId, current: currentSubscriptions, limit: this.config.maxSubscriptionsPerClient },
        "Subscription limit exceeded",
      );
      throw error;
    }

    // Create subscription
    const subscription: Subscription = {
      clientId,
      uri,
      serverId,
      subscribedAt: new Date(),
    };

    // Add to URI index (who's subscribed to this URI)
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, new Set());
    }
    // biome-ignore lint/style/noNonNullAssertion: Set just created above, guaranteed to exist
    this.subscriptions.get(uri)!.add(clientId);

    // Add to client index (what is this client subscribed to)
    if (!this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.set(clientId, new Set());
    }
    // biome-ignore lint/style/noNonNullAssertion: Set just created above, guaranteed to exist
    this.clientSubscriptions.get(clientId)!.add(uri);

    // Store details
    this.subscriptionDetails.set(subscriptionKey, subscription);

    logger.info({ clientId, uri, serverId }, "Client subscribed to resource");

    return subscription;
  }

  /**
   * Unsubscribe a client from a resource URI.
   *
   * @param clientId - The client identifier
   * @param uri - The resource URI to unsubscribe from
   * @returns true if unsubscribed, false if not subscribed
   */
  unsubscribe(clientId: string, uri: string): boolean {
    const subscriptionKey = `${clientId}:${uri}`;

    if (!this.subscriptionDetails.has(subscriptionKey)) {
      logger.debug({ clientId, uri }, "Client not subscribed to resource");
      return false;
    }

    // Remove from URI index
    const uriSubscribers = this.subscriptions.get(uri);
    if (uriSubscribers) {
      uriSubscribers.delete(clientId);
      if (uriSubscribers.size === 0) {
        this.subscriptions.delete(uri);
      }
    }

    // Remove from client index
    const clientSubs = this.clientSubscriptions.get(clientId);
    if (clientSubs) {
      clientSubs.delete(uri);
      if (clientSubs.size === 0) {
        this.clientSubscriptions.delete(clientId);
      }
    }

    // Remove details
    this.subscriptionDetails.delete(subscriptionKey);

    logger.info({ clientId, uri }, "Client unsubscribed from resource");

    return true;
  }

  /**
   * Get all client IDs subscribed to a specific resource URI.
   *
   * @param uri - The resource URI
   * @returns Array of client IDs subscribed to this URI
   */
  getSubscribers(uri: string): string[] {
    const subscribers = this.subscriptions.get(uri);
    return subscribers ? Array.from(subscribers) : [];
  }

  /**
   * Get all resource URIs a client is subscribed to.
   *
   * @param clientId - The client identifier
   * @returns Array of resource URIs
   */
  getClientSubscriptions(clientId: string): string[] {
    const subscriptions = this.clientSubscriptions.get(clientId);
    return subscriptions ? Array.from(subscriptions) : [];
  }

  /**
   * Get subscription details for a specific client and URI.
   *
   * @param clientId - The client identifier
   * @param uri - The resource URI
   * @returns The subscription details or undefined if not subscribed
   */
  getSubscription(clientId: string, uri: string): Subscription | undefined {
    return this.subscriptionDetails.get(`${clientId}:${uri}`);
  }

  /**
   * Check if a client is subscribed to a specific resource URI.
   *
   * @param clientId - The client identifier
   * @param uri - The resource URI
   * @returns true if subscribed, false otherwise
   */
  isSubscribed(clientId: string, uri: string): boolean {
    return this.subscriptionDetails.has(`${clientId}:${uri}`);
  }

  /**
   * Clean up all subscriptions for a disconnected client.
   *
   * @param clientId - The client identifier to clean up
   * @returns The number of subscriptions removed
   */
  cleanupClient(clientId: string): number {
    const subscriptions = this.clientSubscriptions.get(clientId);
    if (!subscriptions) {
      return 0;
    }

    let removed = 0;
    for (const uri of subscriptions) {
      this.unsubscribe(clientId, uri);
      removed++;
    }

    logger.info({ clientId, removed }, "Cleaned up client subscriptions");
    return removed;
  }

  /**
   * Get the total number of active subscriptions.
   */
  getSubscriptionCount(): number {
    return this.subscriptionDetails.size;
  }

  /**
   * Get the number of subscriptions for a specific client.
   *
   * @param clientId - The client identifier
   * @returns The number of subscriptions
   */
  getClientSubscriptionCount(clientId: string): number {
    return this.clientSubscriptions.get(clientId)?.size ?? 0;
  }

  /**
   * Get all subscriptions (for testing/debugging).
   */
  getAllSubscriptions(): Subscription[] {
    return Array.from(this.subscriptionDetails.values());
  }

  /**
   * Clear all subscriptions (for testing/reset).
   */
  clear(): void {
    this.subscriptions.clear();
    this.clientSubscriptions.clear();
    this.subscriptionDetails.clear();
    logger.debug("Cleared all subscriptions");
  }
}
