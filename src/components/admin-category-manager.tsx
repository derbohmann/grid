"use client";

import {
  deleteCategoryAction,
  deleteItemAction,
  reorderCategoriesAction,
  reorderItemsAction,
  runCheckAction,
  saveCategoryAction,
  saveItemAction
} from "@/app/actions";
import { FloatingField } from "@/components/floating-field";
import { HealthChart } from "@/components/health-chart";
import { IconPicker } from "@/components/icon-picker";
import { IconView } from "@/components/icon-view";
import { StatusDot } from "@/components/status-dot";
import type { IconAssetLike } from "@/lib/icon-value";
import { cn, formatDateTime } from "@/lib/utils";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { HealthStatus } from "@prisma/client";
import { ChevronDown, GripVertical, PencilIcon, RefreshCcw, SaveIcon, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type AdminHealthPoint = {
  checkedAt: string;
  latencyMs: number | null;
  online: number;
};

export type AdminItem = {
  id: string;
  categoryId: string;
  title: string;
  description: string | null;
  icon: string | null;
  url: string;
  healthCheckUrl: string | null;
  openInNewTab: boolean;
  sortOrder: number;
  checkIntervalSeconds: number;
  healthResults: Array<{
    checkedAt: string | Date;
    status: HealthStatus;
    latencyMs: number | null;
  }>;
};

export type AdminCategory = {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  items: AdminItem[];
};

function categoriesStructureSnapshot(cats: AdminCategory[]): string {
  return JSON.stringify(
    cats.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      sortOrder: c.sortOrder,
      items: c.items.map((i) => ({
        id: i.id,
        categoryId: i.categoryId,
        title: i.title,
        description: i.description,
        icon: i.icon,
        url: i.url,
        healthCheckUrl: i.healthCheckUrl,
        openInNewTab: i.openInNewTab,
        sortOrder: i.sortOrder,
        checkIntervalSeconds: i.checkIntervalSeconds
      }))
    }))
  );
}

function chartDataForItem(item: AdminItem): AdminHealthPoint[] {
  return [...item.healthResults]
    .reverse()
    .map((result) => ({
      checkedAt: formatDateTime(new Date(result.checkedAt)),
      latencyMs: result.latencyMs,
      online: result.status === "ONLINE" ? 1 : 0
    }));
}

function SortableCategorySection({
  category,
  categoryIndex,
  allCategories,
  iconAssets,
  editingId,
  setEditingId,
  expanded,
  onToggleExpanded,
  addingItem,
  onToggleAddItem,
  onCloseAddItem,
  expandedItemIds,
  toggleItemExpanded,
  onRunCheck
}: {
  category: AdminCategory;
  categoryIndex: number;
  allCategories: AdminCategory[];
  iconAssets: IconAssetLike[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  addingItem: boolean;
  onToggleAddItem: () => void;
  onCloseAddItem: () => void;
  expandedItemIds: Set<string>;
  toggleItemExpanded: (itemId: string) => void;
  onRunCheck: (itemId: string) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1
  };

  const isEditing = editingId === category.id;
  const itemIds = useMemo(() => category.items.map((i) => i.id), [category.items]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start sm:gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="mt-1 shrink-0 cursor-grab touch-none rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={`Reorder category ${category.name}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            {!isEditing ? (
              <div
                className="group flex w-full flex-wrap items-center gap-3 rounded-xl sm:px-2 sm:py-1 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                onClick={onToggleExpanded}
              >
                <div className="flex flex-wrap sm:items-center gap-x-3 gap-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <IconView icon={category.icon} alt="" className="h-10 w-10 shrink-0" />
                    <h2 className="text-2xl font-black">{category.name}</h2>
                  </div>
                  {expanded && (
                    <div className="shrink-0 flex items-center gap-2 order-3 sm:order-2 ml-auto">
                      {!isEditing && (
                        <button
                          type="button"
                          className="btn btn-secondary text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(category.id);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                      <button
                        className="btn btn-danger-outline text-sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingDelete(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>

                    </div>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "h-6 w-6 shrink-0 transition-transform text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 order-2 sm:order-3",
                    expanded ? "ml-auto sm:ml-0 rotate-180" : "ml-auto "
                  )}
                />
              </div>
            ) : (
              <form
                className="mt-1 flex flex-col md:flex-row flex-wrap xl:flex-nowrap gap-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await saveCategoryAction(fd);
                  setEditingId(null);
                }}
              >
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="sortOrder" value={String(categoryIndex)} />
                <FloatingField label="Category name" defaultFilled={category.name.length > 0}>
                  <input className="field" name="name" placeholder="Category name" defaultValue={category.name} required />
                </FloatingField>
                <IconPicker
                  key={`cat-icon-${category.id}-${category.icon ?? ""}`}
                  name="icon"
                  value={category.icon}
                  icons={iconAssets}
                />

                <div className="flex flex-wrap xl:flex-nowrap items-end gap-2">
                  <button className="btn" type="submit">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>

      {confirmingDelete ? (
        <div
          aria-labelledby={`delete-category-title-${category.id}`}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          onClick={() => {
            if (!isDeleting) {
              setConfirmingDelete(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-slate-50"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id={`delete-category-title-${category.id}`} className="text-xl font-black">
              Delete {category.name}?
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              This will permanently delete the category and all items inside it.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                className="btn btn-secondary"
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteCategoryAction(category.id);
                    setConfirmingDelete(false);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete category"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <>
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className="mt-8 grid gap-x-6 gap-y-2 xl:grid-cols-2 items-start">
              {category.items.map((item, itemIndex) => (
                <SortableItemCard
                  key={item.id}
                  item={item}
                  itemIndex={itemIndex}
                  allCategories={allCategories}
                  iconAssets={iconAssets}
                  expanded={expandedItemIds.has(item.id)}
                  onToggleExpand={() => toggleItemExpanded(item.id)}
                  onRunCheck={onRunCheck}
                />
              ))}
            </div>
          </SortableContext>

          {!addingItem ? (
            <button className="btn mt-8" type="button" onClick={onToggleAddItem}>
              Add item
            </button>
          ) : (
            <form
              className="mt-8 grid gap-3 rounded-3xl bg-slate-100 p-5 dark:bg-slate-800"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await saveItemAction(fd);
                onCloseAddItem();
                e.target.reset();
              }}
            >
              <h3 className="font-black">Add item to {category.name}</h3>
              <input type="hidden" name="categoryId" value={category.id} />
              <FloatingField label="Title">
                <input className="field" name="title" placeholder="Title" required />
              </FloatingField>
              <FloatingField label="Description">
                <input className="field" name="description" placeholder="Description" />
              </FloatingField>
              <IconPicker key={`add-item-${category.id}`} name="icon" icons={iconAssets} />
              <FloatingField label="URL">
                <input className="field" name="url" placeholder="https://service.local" required />
              </FloatingField>
              <FloatingField label="Health check URL">
                <input className="field" name="healthCheckUrl" placeholder="Optional health check URL" />
              </FloatingField>

              <fieldset className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-600">
                <legend className="text-sm font-semibold px-1">Open service link</legend>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="radio" name="openInNewTab" value="true" defaultChecked />
                  New tab
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="radio" name="openInNewTab" value="false" />
                  Same tab
                </label>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <FloatingField label="Sort order" defaultFilled>
                  <input
                    className="field"
                    name="sortOrder"
                    type="number"
                    placeholder="Sort order"
                    defaultValue={category.items.length}
                  />
                </FloatingField>
                <FloatingField label="Check interval seconds" defaultFilled>
                  <input
                    className="field"
                    name="checkIntervalSeconds"
                    type="number"
                    min="15"
                    placeholder="Check interval seconds"
                    defaultValue="60"
                  />
                </FloatingField>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn w-fit" type="submit">
                  Add item
                </button>
                <button className="btn btn-secondary w-fit" type="button" onClick={onCloseAddItem}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : null}
    </section>
  );
}

function SortableItemCard({
  item,
  itemIndex,
  allCategories,
  iconAssets,
  expanded,
  onToggleExpand,
  onRunCheck
}: {
  item: AdminItem;
  itemIndex: number;
  allCategories: AdminCategory[];
  iconAssets: IconAssetLike[];
  expanded: boolean;
  onToggleExpand: () => void;
  onRunCheck: (itemId: string) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1
  };

  const latest = item.healthResults[0];
  const chart = chartDataForItem(item);
  const hasHealthUrl = Boolean((item.healthCheckUrl ?? "").trim());

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className=" shrink-0 cursor-grab touch-none rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={`Reorder item ${item.title}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="min-w-0 flex-1 rounded-xl sm:px-3 sm:py-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
            onClick={onToggleExpand}
          >
            <div className="flex min-w-0 items-center gap-3">
              <IconView icon={item.icon} alt="" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0" />
              <div className="min-w-0 mr-auto">
                <h3 className="font-black">{item.title}</h3>
                <p className="truncate text-sm text-slate-500">{item.url}</p>
              </div>
              <ChevronDown className={cn("h-6 w-6 transition-transform shrink-0", expanded ? "rotate-180" : "")} />
            </div>
          </button>
        </div>
        <div className="flex items-center justify-center">
          <StatusDot status={latest?.status} monitoringEnabled={hasHealthUrl} />
        </div>
      </div>

      {expanded ? (
        <>
          <form
            className="mt-5 grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await saveItemAction(fd);
              onToggleExpand();
            }}
          >
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="sortOrder" value={String(itemIndex)} />
            <FloatingField label="Category" defaultFilled>
              <select className="field" name="categoryId" defaultValue={item.categoryId}>
                {allCategories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </FloatingField>
            <FloatingField label="Title" defaultFilled={item.title.length > 0}>
              <input className="field" name="title" placeholder="Title" defaultValue={item.title} required />
            </FloatingField>
            <FloatingField label="Description" defaultFilled={(item.description ?? "").length > 0}>
              <input
                className="field"
                name="description"
                defaultValue={item.description ?? ""}
                placeholder="Description"
              />
            </FloatingField>
            <IconPicker
              key={`item-icon-${item.id}-${item.icon ?? ""}`}
              name="icon"
              value={item.icon}
              icons={iconAssets}
            />
            <FloatingField label="URL" defaultFilled={item.url.length > 0}>
              <input className="field" name="url" placeholder="URL" defaultValue={item.url} required />
            </FloatingField>
            <FloatingField label="Health check URL" defaultFilled={(item.healthCheckUrl ?? "").length > 0}>
              <input
                className="field"
                name="healthCheckUrl"
                defaultValue={item.healthCheckUrl ?? ""}
                placeholder="Health check URL"
              />
            </FloatingField>
            <fieldset className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-600">
              <legend className="text-sm font-semibold px-1">Open service link</legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="openInNewTab" value="true" defaultChecked={item.openInNewTab} />
                New tab
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="openInNewTab" value="false" defaultChecked={!item.openInNewTab} />
                Same tab
              </label>
            </fieldset>
            <FloatingField label="Check interval seconds" defaultFilled>
              <input
                className="field"
                name="checkIntervalSeconds"
                type="number"
                min="15"
                placeholder="Check interval seconds"
                defaultValue={item.checkIntervalSeconds}
              />
            </FloatingField>
            <div className="flex gap-2 justify-between">

              <button className="btn w-fit" type="submit">
                <SaveIcon className="h-4 w-4" />
                Save item
              </button>
              <button className="btn btn-danger text-red-300" type="button" onClick={() => {
                deleteItemAction(item.id);
              }}>
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-3">

            <button
              className="btn btn-secondary"
              type="button"
              disabled={!hasHealthUrl}
              title={hasHealthUrl ? undefined : "Set a health check URL to run checks"}
              onClick={() => {
                void onRunCheck(item.id);
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              Check now
            </button>


          </div>

          <div className="mt-5">
            <HealthChart data={chart} />
          </div>
        </>
      ) : null}
    </article>
  );
}

export function AdminCategoryManager({
  initialCategories,
  iconAssets
}: {
  initialCategories: AdminCategory[];
  iconAssets: IconAssetLike[];
}) {
  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => new Set(initialCategories.map((category) => category.id))
  );
  const [addingItemCategoryIds, setAddingItemCategoryIds] = useState<Set<string>>(() => new Set());
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(() => new Set());

  const initialCategoriesRef = useRef(initialCategories);
  const categoriesRef = useRef(categories);

  useLayoutEffect(() => {
    initialCategoriesRef.current = initialCategories;
  }, [initialCategories]);

  useLayoutEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const structureSnapshot = useMemo(
    () => categoriesStructureSnapshot(initialCategories),
    [initialCategories]
  );

  useEffect(() => {
    const fresh = initialCategoriesRef.current;
    const prev = categoriesRef.current;
    const prevCatIds = new Set(prev.map((c) => c.id));
    const freshCatIds = new Set(fresh.map((c) => c.id));
    const sameCategoryIdSet =
      prevCatIds.size === freshCatIds.size && [...prevCatIds].every((id) => freshCatIds.has(id));

    setCategories(fresh);

    if (sameCategoryIdSet) {
      setExpandedCategoryIds((exp) => new Set([...exp].filter((id) => freshCatIds.has(id))));
    } else {
      setExpandedCategoryIds(new Set(fresh.map((c) => c.id)));
    }

    setExpandedItemIds((prevExp) => {
      const valid = new Set(fresh.flatMap((c) => c.items.map((i) => i.id)));
      return new Set([...prevExp].filter((id) => valid.has(id)));
    });
    setAddingItemCategoryIds((prevAdd) => {
      const valid = new Set(fresh.map((c) => c.id));
      return new Set([...prevAdd].filter((id) => valid.has(id)));
    });
    setEditingCategoryId((prevEdit) =>
      prevEdit && fresh.some((c) => c.id === prevEdit) ? prevEdit : null
    );
  }, [structureSnapshot]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);

  function toggleItemExpanded(itemId: string) {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function toggleCategoryExpanded(categoryId: string) {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
    setAddingItemCategoryIds((prev) => {
      if (!prev.has(categoryId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  }

  function toggleAddItem(categoryId: string) {
    setAddingItemCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function closeAddItem(categoryId: string) {
    setAddingItemCategoryIds((prev) => {
      if (!prev.has(categoryId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }

    if (categories.some((c) => c.id === activeId)) {
      if (!categories.some((c) => c.id === overId)) {
        return;
      }
      setCategories((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === activeId);
        const newIndex = prev.findIndex((c) => c.id === overId);
        if (oldIndex === -1 || newIndex === -1) {
          return prev;
        }
        const next = arrayMove(prev, oldIndex, newIndex);
        void reorderCategoriesAction(next.map((c) => c.id));
        return next;
      });
      return;
    }

    const fromCat = categories.find((c) => c.items.some((i) => i.id === activeId));
    const toCat = categories.find((c) => c.items.some((i) => i.id === overId));
    if (!fromCat || !toCat || fromCat.id !== toCat.id) {
      return;
    }

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== fromCat.id) {
          return c;
        }
        const oldIndex = c.items.findIndex((i) => i.id === activeId);
        const newIndex = c.items.findIndex((i) => i.id === overId);
        if (oldIndex === -1 || newIndex === -1) {
          return c;
        }
        const newItems = arrayMove(c.items, oldIndex, newIndex);
        void reorderItemsAction(c.id, newItems.map((i) => i.id));
        return { ...c, items: newItems };
      })
    );
  }

  async function handleRunCheck(itemId: string) {
    const result = await runCheckAction(itemId);
    if (!result) {
      return;
    }

    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        items: category.items.map((item) => {
          if (item.id !== itemId) {
            return item;
          }
          return {
            ...item,
            healthResults: [
              {
                checkedAt: result.checkedAt,
                status: result.status,
                latencyMs: result.latencyMs
              },
              ...item.healthResults
            ].slice(0, 50)
          };
        })
      }))
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-8">
          {categories.map((category, categoryIndex) => (
            <SortableCategorySection
              key={category.id}
              category={category}
              categoryIndex={categoryIndex}
              allCategories={categories}
              iconAssets={iconAssets}
              editingId={editingCategoryId}
              setEditingId={setEditingCategoryId}
              expanded={expandedCategoryIds.has(category.id)}
              onToggleExpanded={() => toggleCategoryExpanded(category.id)}
              addingItem={addingItemCategoryIds.has(category.id)}
              onToggleAddItem={() => toggleAddItem(category.id)}
              onCloseAddItem={() => closeAddItem(category.id)}
              expandedItemIds={expandedItemIds}
              toggleItemExpanded={toggleItemExpanded}
              onRunCheck={handleRunCheck}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
