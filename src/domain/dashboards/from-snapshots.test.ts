import { describe, expect, it } from "vitest";
import { dashboardCatalog, dashboardFromSnapshots, type PublicSnapshotRow } from "@/domain/dashboards/from-snapshots";

function row(overrides: Partial<PublicSnapshotRow>): PublicSnapshotRow {
  return {
    publicationId: "pub-1",
    cycleId: "cycle-1",
    cycleName: "2026",
    organizationId: null,
    organizationName: null,
    axisCode: null,
    metric: "iqvst",
    value: "3.7700",
    responseCount: 40,
    classification: "boa",
    methodologyId: "metodologia-a",
    createdAt: "2026-10-28T15:00:00.000Z",
    ...overrides,
  };
}

describe("dashboardFromSnapshots", () => {
  it("não transforma ausência em zero", () => {
    const dashboard = dashboardFromSnapshots([]);
    expect(dashboard.availability).toBe("no_publication");
    expect(dashboard.iqvstLabel).toBeNull();
    expect(dashboard.responseCount).toBeNull();
    expect(dashboard.publishedOrganizations).toBeNull();
    expect(dashboard.axes.every((axis) => axis.mean === null)).toBe(true);
  });

  it("monta o painel com a fotografia mais recente", () => {
    const dashboard = dashboardFromSnapshots([
      row({ publicationId: "pub-old", createdAt: "2026-01-01T15:00:00.000Z", value: "2.1000", classification: "baixa" }),
      row({}),
      row({ metric: "axis_mean", axisCode: "E1", value: "4.2000" }),
      row({ metric: "response_count", value: "40.0000", responseCount: 40 }),
      row({
        organizationId: "org-1",
        organizationName: "Controladoria",
        value: "3.5000",
      }),
    ]);

    expect(dashboard.availability).toBe("published");
    expect(dashboard.title).toBe("2026");
    expect(dashboard.iqvstLabel).toBe("3,77");
    expect(dashboard.classificationLabel).toBe("Boa");
    expect(dashboard.responseCount).toBe(40);
    expect(dashboard.axes.find((axis) => axis.code === "E1")?.meanLabel).toBe("4,20");
    expect(dashboard.axes.find((axis) => axis.code === "E2")?.status).toBe("no_data");
    expect(dashboard.publishedOrganizations).toBe(1);
    expect(dashboard.organizations[0]?.name).toBe("Controladoria");
    expect(dashboard.updatedAt).toContain("28/10/2026");
  });

  it("marca a série antiga como não comparável quando a metodologia muda", () => {
    const dashboard = dashboardFromSnapshots([
      row({
        publicationId: "pub-old",
        cycleId: "cycle-old",
        cycleName: "2025",
        methodologyId: "metodologia-b",
        value: "3.1000",
        createdAt: "2025-10-28T15:00:00.000Z",
      }),
      row({}),
    ]);

    expect(dashboard.history).toEqual([
      { cycle: "2025", iqvst: 3.1, comparable: false },
      { cycle: "2026", iqvst: 3.77, comparable: true },
    ]);
  });

  it("separa o painel por período anual e conserva a série completa", () => {
    const rows = [
      row({
        publicationId: "pub-2025",
        cycleId: "cycle-2025",
        cycleName: "2025",
        value: "3.1000",
        createdAt: "2025-10-28T15:00:00.000Z",
      }),
      row({}),
    ];

    const older = dashboardFromSnapshots(rows, "2025");
    expect(older.title).toBe("2025");
    expect(older.iqvstLabel).toBe("3,10");
    expect(older.history.map((point) => point.cycle)).toEqual(["2025", "2026"]);

    expect(dashboardCatalog(rows).editions.map((edition) => edition.year)).toEqual(["2026", "2025"]);
  });
});
