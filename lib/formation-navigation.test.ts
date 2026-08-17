import { describe, expect, it } from "vitest";
import { getFormationNavigation } from "@/lib/formation-navigation";
import type { SessionModule } from "@/lib/types";

function moduleItem(overrides: Partial<SessionModule>): SessionModule {
  return {
    id: "module",
    title: "Module",
    summary: null,
    module_order: 1,
    estimated_minutes: null,
    content_text: null,
    video_url: null,
    pdf_url: null,
    trainer_guidance: null,
    parent_module_id: null,
    module_type: "parent",
    is_active: true,
    is_completed: false,
    completed_at: null,
    ...overrides
  };
}

describe("formation navigation", () => {
  const parent = moduleItem({ id: "parent", title: "Parent" });
  const firstChild = moduleItem({
    id: "child-1",
    title: "Sous-module 1",
    module_type: "child",
    parent_module_id: "parent"
  });
  const secondChild = moduleItem({
    id: "child-2",
    title: "Sous-module 2",
    module_order: 2,
    module_type: "child",
    parent_module_id: "parent"
  });

  it("selects the first submodule by default", () => {
    const navigation = getFormationNavigation([parent, firstChild, secondChild]);
    expect(navigation.current?.id).toBe("child-1");
    expect(navigation.submoduleIndex).toBe(1);
    expect(navigation.submoduleCount).toBe(2);
  });

  it("provides previous and next steps", () => {
    const navigation = getFormationNavigation([parent, firstChild, secondChild], "child-1");
    expect(navigation.previous).toBeNull();
    expect(navigation.next?.id).toBe("child-2");
    expect(navigation.stepIndex).toBe(1);
    expect(navigation.stepCount).toBe(2);
  });
});
