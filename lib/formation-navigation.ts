import type { SessionModule, SessionModuleGroup } from "@/lib/types";

export function buildSessionModuleGroups(modules: SessionModule[]): SessionModuleGroup[] {
  const parents = modules
    .filter((module) => module.module_type === "parent")
    .sort((left, right) => left.module_order - right.module_order);
  const children = modules
    .filter((module) => module.module_type === "child")
    .sort((left, right) => left.module_order - right.module_order);
  const parentGroups = parents.map((parent) => ({
    parent,
    children: children.filter((child) => child.parent_module_id === parent.id)
  }));
  const assignedChildIds = new Set(parentGroups.flatMap(({ children: groupChildren }) => groupChildren.map((child) => child.id)));
  const standaloneGroups = modules
    .filter((module) => module.module_type !== "parent" && !assignedChildIds.has(module.id))
    .sort((left, right) => left.module_order - right.module_order)
    .map((module) => ({ parent: module, children: [] }));

  return [...parentGroups, ...standaloneGroups];
}

export function resolveDefaultSelectedModule(moduleGroups: SessionModuleGroup[]) {
  const firstGroup = moduleGroups[0];
  return firstGroup ? firstGroup.children[0] ?? firstGroup.parent : null;
}

export function getFormationNavigation(modules: SessionModule[], selectedModuleId?: string | null) {
  const groups = buildSessionModuleGroups(modules);
  const orderedModules = groups.flatMap(({ parent, children }) => children.length ? children : [parent]);
  const defaultModule = resolveDefaultSelectedModule(groups);
  const selectedModule = orderedModules.find((module) => module.id === selectedModuleId) ?? defaultModule;

  if (!selectedModule) {
    return {
      groups,
      current: null,
      previous: null,
      next: null,
      stepIndex: 0,
      stepCount: 0,
      moduleIndex: 0,
      moduleCount: groups.length,
      submoduleIndex: null,
      submoduleCount: 0,
      parent: null
    };
  }

  const stepIndex = orderedModules.findIndex((module) => module.id === selectedModule.id);
  const moduleIndex = groups.findIndex(
    ({ parent, children }) => parent.id === selectedModule.id || children.some((child) => child.id === selectedModule.id)
  );
  const group = groups[moduleIndex];
  const submoduleIndex = group?.children.findIndex((child) => child.id === selectedModule.id) ?? -1;

  return {
    groups,
    current: selectedModule,
    previous: stepIndex > 0 ? orderedModules[stepIndex - 1] : null,
    next: stepIndex < orderedModules.length - 1 ? orderedModules[stepIndex + 1] : null,
    stepIndex: stepIndex + 1,
    stepCount: orderedModules.length,
    moduleIndex: moduleIndex + 1,
    moduleCount: groups.length,
    submoduleIndex: submoduleIndex >= 0 ? submoduleIndex + 1 : null,
    submoduleCount: group?.children.length ?? 0,
    parent: submoduleIndex >= 0 ? group?.parent ?? null : null
  };
}
