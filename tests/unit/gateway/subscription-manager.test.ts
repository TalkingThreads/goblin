/**
 * Unit tests for SubscriptionManager
 */

import { describe, expect, test } from "bun:test";
import { SubscriptionManager } from "../../../src/gateway/subscription-manager.js";

describe("SubscriptionManager", () => {
  describe("subscribe", () => {
    test("should subscribe a client to a resource", () => {
      const manager = new SubscriptionManager();
      const subscription = manager.subscribe("client1", "file:///test.txt", "server1");

      expect(subscription).toEqual({
        clientId: "client1",
        uri: "file:///test.txt",
        serverId: "server1",
        subscribedAt: expect.any(Date),
      });
    });

    test("should track subscription in URI index", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test.txt", "server1");

      const subscribers = manager.getSubscribers("file:///test.txt");
      expect(subscribers).toEqual(["client1"]);
    });

    test("should track subscription in client index", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test.txt", "server1");

      const subscriptions = manager.getClientSubscriptions("client1");
      expect(subscriptions).toEqual(["file:///test.txt"]);
    });

    test("should allow multiple clients to subscribe to same resource", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test.txt", "server1");
      manager.subscribe("client2", "file:///test.txt", "server1");

      const subscribers = manager.getSubscribers("file:///test.txt");
      expect(subscribers).toEqual(["client1", "client2"]);
    });

    test("should allow client to subscribe to multiple resources", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test1.txt", "server1");
      manager.subscribe("client1", "file:///test2.txt", "server1");

      const subscriptions = manager.getClientSubscriptions("client1");
      expect(subscriptions).toEqual(["file:///test1.txt", "file:///test2.txt"]);
    });

    test("should return existing subscription if already subscribed", () => {
      const manager = new SubscriptionManager();
      const sub1 = manager.subscribe("client1", "file:///test.txt", "server1");
      const sub2 = manager.subscribe("client1", "file:///test.txt", "server1");

      expect(sub1).toEqual(sub2);
      expect(manager.getSubscriptionCount()).toBe(1);
    });

    test("should throw when subscription limit is exceeded", () => {
      const limitedManager = new SubscriptionManager({ maxSubscriptionsPerClient: 2 });

      limitedManager.subscribe("client1", "file:///test1.txt", "server1");
      limitedManager.subscribe("client1", "file:///test2.txt", "server1");

      expect(() => {
        limitedManager.subscribe("client1", "file:///test3.txt", "server1");
      }).toThrow("Subscription limit exceeded");
    });

    test("should allow different clients to have their own limits", () => {
      const limitedManager = new SubscriptionManager({ maxSubscriptionsPerClient: 2 });

      limitedManager.subscribe("client1", "file:///test1.txt", "server1");
      limitedManager.subscribe("client1", "file:///test2.txt", "server1");
      limitedManager.subscribe("client2", "file:///test1.txt", "server1");
      limitedManager.subscribe("client2", "file:///test2.txt", "server1");

      expect(limitedManager.getClientSubscriptionCount("client1")).toBe(2);
      expect(limitedManager.getClientSubscriptionCount("client2")).toBe(2);
    });
  });

  describe("unsubscribe", () => {
    test("should unsubscribe a client from a resource", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test.txt", "server1");
      const result = manager.unsubscribe("client1", "file:///test.txt");

      expect(result).toBe(true);
      expect(manager.getSubscribers("file:///test.txt")).toEqual([]);
      expect(manager.getClientSubscriptions("client1")).toEqual([]);
    });

    test("should return false if not subscribed", () => {
      const manager = new SubscriptionManager();
      const result = manager.unsubscribe("client1", "file:///test.txt");

      expect(result).toBe(false);
    });

    test("should handle unsubscribe from resource with multiple subscribers", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test.txt", "server1");
      manager.subscribe("client2", "file:///test.txt", "server1");
      manager.unsubscribe("client1", "file:///test.txt");

      const subscribers = manager.getSubscribers("file:///test.txt");
      expect(subscribers).toEqual(["client2"]);
    });

    test("should handle partial unsubscribe from client's subscriptions", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test1.txt", "server1");
      manager.subscribe("client1", "file:///test2.txt", "server1");
      manager.unsubscribe("client1", "file:///test1.txt");

      const subscriptions = manager.getClientSubscriptions("client1");
      expect(subscriptions).toEqual(["file:///test2.txt"]);
    });
  });

  describe("getSubscribers", () => {
    test("should return empty array for unsubscribed resource", () => {
      const manager = new SubscriptionManager();
      const subscribers = manager.getSubscribers("file:///test.txt");

      expect(subscribers).toEqual([]);
    });

    test("should return all subscribers for a resource", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test.txt", "server1");
      manager.subscribe("client2", "file:///test.txt", "server1");
      manager.subscribe("client3", "file:///test.txt", "server1");

      const subscribers = manager.getSubscribers("file:///test.txt");
      expect(subscribers).toHaveLength(3);
      expect(subscribers).toContain("client1");
      expect(subscribers).toContain("client2");
      expect(subscribers).toContain("client3");
    });
  });

  describe("getClientSubscriptions", () => {
    test("should return empty array for client with no subscriptions", () => {
      const manager = new SubscriptionManager();
      const subscriptions = manager.getClientSubscriptions("client1");

      expect(subscriptions).toEqual([]);
    });

    test("should return all subscriptions for a client", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test1.txt", "server1");
      manager.subscribe("client1", "file:///test2.txt", "server1");
      manager.subscribe("client1", "file:///test3.txt", "server1");

      const subscriptions = manager.getClientSubscriptions("client1");
      expect(subscriptions).toHaveLength(3);
      expect(subscriptions).toContain("file:///test1.txt");
      expect(subscriptions).toContain("file:///test2.txt");
      expect(subscriptions).toContain("file:///test3.txt");
    });
  });

  describe("isSubscribed", () => {
    test("should return true when subscribed", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test.txt", "server1");

      expect(manager.isSubscribed("client1", "file:///test.txt")).toBe(true);
    });

    test("should return false when not subscribed", () => {
      const manager = new SubscriptionManager();
      expect(manager.isSubscribed("client1", "file:///test.txt")).toBe(false);
    });

    test("should return false after unsubscribe", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test.txt", "server1");
      manager.unsubscribe("client1", "file:///test.txt");

      expect(manager.isSubscribed("client1", "file:///test.txt")).toBe(false);
    });
  });

  describe("cleanupClient", () => {
    test("should remove all subscriptions for a client", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test1.txt", "server1");
      manager.subscribe("client1", "file:///test2.txt", "server1");
      manager.subscribe("client2", "file:///test.txt", "server1");

      const removed = manager.cleanupClient("client1");

      expect(removed).toBe(2);
      expect(manager.getClientSubscriptions("client1")).toEqual([]);
      expect(manager.getSubscribers("file:///test1.txt")).toEqual([]);
      expect(manager.getSubscribers("file:///test2.txt")).toEqual([]);
      expect(manager.getSubscribers("file:///test.txt")).toEqual(["client2"]);
    });

    test("should return 0 for client with no subscriptions", () => {
      const manager = new SubscriptionManager();
      const removed = manager.cleanupClient("client1");

      expect(removed).toBe(0);
    });
  });

  describe("getSubscriptionCount", () => {
    test("should return 0 when empty", () => {
      const manager = new SubscriptionManager();
      expect(manager.getSubscriptionCount()).toBe(0);
    });

    test("should return correct count", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test1.txt", "server1");
      manager.subscribe("client1", "file:///test2.txt", "server1");
      manager.subscribe("client2", "file:///test.txt", "server1");

      expect(manager.getSubscriptionCount()).toBe(3);
    });
  });

  describe("getClientSubscriptionCount", () => {
    test("should return 0 for client with no subscriptions", () => {
      const manager = new SubscriptionManager();
      expect(manager.getClientSubscriptionCount("client1")).toBe(0);
    });

    test("should return correct count", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test1.txt", "server1");
      manager.subscribe("client1", "file:///test2.txt", "server1");

      expect(manager.getClientSubscriptionCount("client1")).toBe(2);
    });
  });

  describe("getAllSubscriptions", () => {
    test("should return empty array when empty", () => {
      const manager = new SubscriptionManager();
      expect(manager.getAllSubscriptions()).toEqual([]);
    });

    test("should return all subscriptions", () => {
      const manager = new SubscriptionManager();
      const sub1 = manager.subscribe("client1", "file:///test1.txt", "server1");
      const sub2 = manager.subscribe("client2", "file:///test2.txt", "server2");

      const all = manager.getAllSubscriptions();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(sub1);
      expect(all).toContainEqual(sub2);
    });
  });

  describe("clear", () => {
    test("should remove all subscriptions", () => {
      const manager = new SubscriptionManager();
      manager.subscribe("client1", "file:///test1.txt", "server1");
      manager.subscribe("client1", "file:///test2.txt", "server1");
      manager.subscribe("client2", "file:///test.txt", "server1");

      manager.clear();

      expect(manager.getSubscriptionCount()).toBe(0);
      expect(manager.getSubscribers("file:///test1.txt")).toEqual([]);
      expect(manager.getClientSubscriptions("client1")).toEqual([]);
    });
  });

  describe("getSubscription", () => {
    test("should return undefined when not subscribed", () => {
      const manager = new SubscriptionManager();
      const sub = manager.getSubscription("client1", "file:///test.txt");

      expect(sub).toBeUndefined();
    });

    test("should return subscription details", () => {
      const manager = new SubscriptionManager();
      const expected = manager.subscribe("client1", "file:///test.txt", "server1");
      const actual = manager.getSubscription("client1", "file:///test.txt");

      expect(actual).toEqual(expected);
    });
  });
});
