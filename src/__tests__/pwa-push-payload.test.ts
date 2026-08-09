import { describe, it, expect } from "vitest";
import { buildPushPayload, PUSH_WIRE_KEYS } from "@/lib/pwa/push-payload";

describe("buildPushPayload", () => {
  it("emits only the three whitelisted wire keys", () => {
    const payload = buildPushPayload({ kind: "consultation_reply", link: "/consultations/abc" });
    expect(Object.keys(payload).sort()).toEqual([...PUSH_WIRE_KEYS].sort());
  });

  // The load-bearing privacy test. Push notifications render on a LOCKED
  // screen; a preview naming a symptom or medication would defeat the
  // anonymity this product is built on. If this test fails, do not "fix" it by
  // updating the expectation — the leak is the bug.
  it("strips medical and identifying content even when a caller passes it", () => {
    const payload = buildPushPayload({
      kind: "consultation_reply",
      link: "/consultations/abc",
      symptoms: "chest pain and dizziness",
      medication: "Sertraline 50mg",
      patientName: "Ama Mensah",
      pharmacistName: "Dr. Osei",
      message: "Your STI results are ready",
      description: "anxiety consultation",
    } as never);

    const serialized = JSON.stringify(payload).toLowerCase();
    for (const leak of ["chest pain", "sertraline", "ama", "osei", "sti results", "anxiety"]) {
      expect(serialized).not.toContain(leak);
    }
  });

  it("keeps the notification body generic per kind", () => {
    expect(buildPushPayload({ kind: "delivery_update", link: "/track" })).toMatchObject({
      kind: "delivery_update",
    });
  });

  describe("link sanitisation", () => {
    it("keeps same-origin relative paths", () => {
      expect(buildPushPayload({ kind: "order_update", link: "/orders/42" }).link).toBe("/orders/42");
    });

    // A notification tap opens a window; an absolute URL here would be an open
    // redirect triggered from a lock screen.
    it("rejects absolute URLs", () => {
      expect(buildPushPayload({ kind: "order_update", link: "https://evil.example/steal" }).link).toBe("/");
      expect(buildPushPayload({ kind: "order_update", link: "//evil.example" }).link).toBe("/");
    });

    it("rejects non-http schemes", () => {
      expect(buildPushPayload({ kind: "order_update", link: "javascript:alert(1)" }).link).toBe("/");
    });

    it("falls back to root when the link is missing", () => {
      expect(buildPushPayload({ kind: "order_update", link: "" }).link).toBe("/");
    });
  });

  it("defaults tag to the kind so repeat alerts collapse instead of stacking", () => {
    expect(buildPushPayload({ kind: "consultation_reply", link: "/x" }).tag).toBe("consultation_reply");
    expect(buildPushPayload({ kind: "consultation_reply", link: "/x", tag: "consult-7" }).tag).toBe("consult-7");
  });
});
