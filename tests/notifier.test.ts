import { describe, it, expect, vi, afterEach } from "vitest";
import { sendNotification } from "../src/notifier.ts";

const WEBHOOK_URL = "https://hooks.slack.com/test";

const PRODUCT = {
  name: "Nintendo Switch 2",
  url: "https://item.rakuten.co.jp/example/switch2/",
  siteType: "rakuten" as const,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendNotification", () => {
  it("Webhook URL に POST する", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    await sendNotification(WEBHOOK_URL, PRODUCT, "in_stock");
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toBe(WEBHOOK_URL);
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("POST");
  });

  it("メッセージに商品名・サイト名・新ステータス・URL が含まれる", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    await sendNotification(WEBHOOK_URL, PRODUCT, "in_stock");
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    const text = JSON.stringify(body);
    expect(text).toContain("Nintendo Switch 2");
    expect(text).toContain("rakuten");
    expect(text).toContain("in_stock");
    expect(text).toContain("https://item.rakuten.co.jp/example/switch2/");
  });

  it("HTTP エラー時に例外を throw する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );
    await expect(
      sendNotification(WEBHOOK_URL, PRODUCT, "in_stock"),
    ).rejects.toThrow();
  });
});
