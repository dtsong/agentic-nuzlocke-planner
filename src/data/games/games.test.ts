import { describe, expect, it } from "vitest";
import pokemonIndex from "../pokemon-index.json";
import {
  BossesSchema,
  EncountersSchema,
  GameMetaSchema,
  RoutesSchema,
  TierListSchema,
} from "../schemas";
import fireRedBosses from "./fire-red/bosses.json";
import fireRedEncounters from "./fire-red/encounters.json";
import fireRedMeta from "./fire-red/meta.json";
import fireRedRoutes from "./fire-red/routes.json";
import fireRedTierList from "./fire-red/tier-list.json";
import leafGreenEncounters from "./leaf-green/encounters.json";
import leafGreenMeta from "./leaf-green/meta.json";

const validPokemonIds = new Set(Object.keys(pokemonIndex).map(Number));
const fireRedRouteIds = new Set(fireRedRoutes.map((r) => r.id));

describe("FireRed meta.json", () => {
  it("should validate against GameMetaSchema", () => {
    const result = GameMetaSchema.safeParse(fireRedMeta);
    expect(result.success).toBe(true);
  });

  it("should have correct game_id", () => {
    expect(fireRedMeta.game_id).toBe("fire-red");
  });

  it("should be generation 3 in kanto", () => {
    expect(fireRedMeta.generation).toBe(3);
    expect(fireRedMeta.region).toBe("kanto");
  });
});

describe("LeafGreen meta.json", () => {
  it("should validate against GameMetaSchema", () => {
    const result = GameMetaSchema.safeParse(leafGreenMeta);
    expect(result.success).toBe(true);
  });

  it("should have correct game_id", () => {
    expect(leafGreenMeta.game_id).toBe("leaf-green");
  });

  it("should share the same version_group as FireRed", () => {
    expect(leafGreenMeta.version_group).toBe(fireRedMeta.version_group);
  });
});

describe("FireRed routes.json", () => {
  it("should validate against RoutesSchema", () => {
    const result = RoutesSchema.safeParse(fireRedRoutes);
    expect(result.success).toBe(true);
  });

  it("should have sequential order with no gaps", () => {
    const orders = fireRedRoutes.map((r) => r.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      expect(orders[i]).toBe(i + 1);
    }
  });

  it("should have unique route ids", () => {
    const ids = fireRedRoutes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique order values", () => {
    const orders = fireRedRoutes.map((r) => r.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("should start with Pallet Town", () => {
    const first = fireRedRoutes.find((r) => r.order === 1);
    expect(first?.id).toBe("pallet-town");
  });

  it("should include key locations", () => {
    const ids = fireRedRoutes.map((r) => r.id);
    expect(ids).toContain("viridian-forest");
    expect(ids).toContain("mt-moon-1f");
    expect(ids).toContain("rock-tunnel-1f");
    expect(ids).toContain("safari-zone-area-1");
    expect(ids).toContain("power-plant");
    expect(ids).toContain("victory-road-1f");
    expect(ids).toContain("cerulean-cave");
  });

  it("parent_location values should group related cave floors", () => {
    const byId = Object.fromEntries(fireRedRoutes.map((r) => [r.id, r]));

    // Mt. Moon floors
    for (const id of ["mt-moon-1f", "mt-moon-b1f", "mt-moon-b2f"]) {
      expect((byId[id] as Record<string, unknown>).parent_location).toBe("mt-moon");
    }

    // Rock Tunnel floors
    for (const id of ["rock-tunnel-1f", "rock-tunnel-b1f"]) {
      expect((byId[id] as Record<string, unknown>).parent_location).toBe("rock-tunnel");
    }

    // Victory Road floors
    for (const id of ["victory-road-1f", "victory-road-2f", "victory-road-3f"]) {
      expect((byId[id] as Record<string, unknown>).parent_location).toBe("victory-road");
    }
  });

  it("should include city locations", () => {
    const byId = Object.fromEntries(fireRedRoutes.map((r) => [r.id, r]));
    expect(byId["vermilion-city"]).toBeDefined();
    expect(byId["vermilion-city"].type).toBe("city");
    expect(byId["cerulean-city"]).toBeDefined();
    expect(byId["cerulean-city"].type).toBe("city");
  });

  it("routes with the same parent_location should share the same type", () => {
    const routesWithParent = fireRedRoutes.filter(
      (r) => "parent_location" in r && r.parent_location,
    );
    const groups = new Map<string, string[]>();
    for (const route of routesWithParent) {
      const parent = (route as Record<string, unknown>).parent_location as string;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent)!.push(route.type);
    }
    for (const [parent, types] of groups) {
      const uniqueTypes = new Set(types);
      expect(
        uniqueTypes.size,
        `Routes with parent_location "${parent}" have inconsistent types: ${[...uniqueTypes].join(", ")}`,
      ).toBe(1);
    }
  });
});

describe("FireRed encounters.json", () => {
  it("should validate against EncountersSchema", () => {
    const result = EncountersSchema.safeParse(fireRedEncounters);
    expect(result.success).toBe(true);
  });

  it("all pokemon_ids should exist in pokemon-index.json", () => {
    for (const route of fireRedEncounters) {
      for (const [, entries] of Object.entries(route.methods)) {
        for (const entry of entries) {
          expect(
            validPokemonIds.has(entry.pokemon_id),
            `Pokemon ID ${entry.pokemon_id} (${entry.name}) on ${route.route_id} not in pokemon-index`,
          ).toBe(true);
        }
      }
    }
  });

  it("all route_ids should reference valid routes", () => {
    for (const encounter of fireRedEncounters) {
      expect(
        fireRedRouteIds.has(encounter.route_id),
        `Encounter route_id "${encounter.route_id}" not found in routes.json`,
      ).toBe(true);
    }
  });

  it("min_level should not exceed max_level", () => {
    for (const route of fireRedEncounters) {
      for (const [, entries] of Object.entries(route.methods)) {
        for (const entry of entries) {
          expect(entry.min_level).toBeLessThanOrEqual(entry.max_level);
        }
      }
    }
  });

  it("should include starter gifts in pallet-town", () => {
    const pallet = fireRedEncounters.find((e) => e.route_id === "pallet-town");
    expect(pallet).toBeDefined();
    const giftIds = pallet!.methods.gift?.map((g) => g.pokemon_id) ?? [];
    expect(giftIds).toContain(1); // Bulbasaur
    expect(giftIds).toContain(4); // Charmander
    expect(giftIds).toContain(7); // Squirtle
  });

  it("should include Lapras gift at Silph Co", () => {
    const silph = fireRedEncounters.find((e) => e.route_id === "silph-co");
    expect(silph).toBeDefined();
    const giftIds = silph!.methods.gift?.map((g) => g.pokemon_id) ?? [];
    expect(giftIds).toContain(131);
  });

  it("should include trade encounters with valid pokemon", () => {
    // Route 2: Mr. Mime trade
    const route2 = fireRedEncounters.find((e) => e.route_id === "route-2");
    expect(route2).toBeDefined();
    expect(route2!.methods.trade).toBeDefined();
    const route2TradeIds = route2!.methods.trade!.map((t) => t.pokemon_id);
    expect(route2TradeIds).toContain(122); // Mr. Mime

    // Vermilion City: Farfetch'd trade
    const vermilion = fireRedEncounters.find((e) => e.route_id === "vermilion-city");
    expect(vermilion).toBeDefined();
    expect(vermilion!.methods.trade).toBeDefined();
    const vermilionTradeIds = vermilion!.methods.trade!.map((t) => t.pokemon_id);
    expect(vermilionTradeIds).toContain(83); // Farfetch'd

    // Cinnabar Lab: trade encounters
    const cinnabar = fireRedEncounters.find((e) => e.route_id === "cinnabar-lab");
    expect(cinnabar).toBeDefined();
    expect(cinnabar!.methods.trade).toBeDefined();
    expect(cinnabar!.methods.trade!.length).toBeGreaterThan(0);
  });

  it("trade encounters should have valid pokemon_ids for both received and required pokemon", () => {
    for (const route of fireRedEncounters) {
      if (!route.methods.trade) continue;
      for (const trade of route.methods.trade) {
        expect(
          validPokemonIds.has(trade.pokemon_id),
          `Trade on ${route.route_id}: received pokemon_id ${trade.pokemon_id} not in pokemon-index`,
        ).toBe(true);
        const req = trade as Record<string, unknown>;
        if (req.requires_pokemon_id != null) {
          expect(
            validPokemonIds.has(req.requires_pokemon_id as number),
            `Trade on ${route.route_id}: requires_pokemon_id ${req.requires_pokemon_id} not in pokemon-index`,
          ).toBe(true);
        }
      }
    }
  });

  it("should include purchase encounters", () => {
    // Route 4: Magikarp purchase
    const route4 = fireRedEncounters.find((e) => e.route_id === "route-4");
    expect(route4).toBeDefined();
    expect(route4!.methods.purchase).toBeDefined();
    const route4PurchaseIds = route4!.methods.purchase!.map((p) => p.pokemon_id);
    expect(route4PurchaseIds).toContain(129); // Magikarp

    // Celadon Game Corner: Porygon purchase
    const celadon = fireRedEncounters.find((e) => e.route_id === "celadon-game-corner");
    expect(celadon).toBeDefined();
    expect(celadon!.methods.purchase).toBeDefined();
    const celadonPurchaseIds = celadon!.methods.purchase!.map((p) => p.pokemon_id);
    expect(celadonPurchaseIds).toContain(137); // Porygon
  });

  it("should include fishing encounters on water routes", () => {
    const route19 = fireRedEncounters.find((e) => e.route_id === "route-19");
    expect(route19).toBeDefined();
    expect(route19!.methods.fishing_old).toBeDefined();
    expect(route19!.methods.fishing_old!.length).toBeGreaterThan(0);
    expect(route19!.methods.fishing_good).toBeDefined();
    expect(route19!.methods.fishing_good!.length).toBeGreaterThan(0);
    expect(route19!.methods.fishing_super).toBeDefined();
    expect(route19!.methods.fishing_super!.length).toBeGreaterThan(0);
  });
});

describe("LeafGreen encounters.json", () => {
  it("should validate against EncountersSchema", () => {
    const result = EncountersSchema.safeParse(leafGreenEncounters);
    expect(result.success).toBe(true);
  });

  it("all route_ids should reference valid FireRed routes", () => {
    for (const encounter of leafGreenEncounters) {
      expect(
        fireRedRouteIds.has(encounter.route_id),
        `LeafGreen override route_id "${encounter.route_id}" not found in FireRed routes.json`,
      ).toBe(true);
    }
  });

  it("all pokemon_ids should exist in pokemon-index.json", () => {
    for (const route of leafGreenEncounters) {
      for (const [, entries] of Object.entries(route.methods)) {
        for (const entry of entries) {
          expect(
            validPokemonIds.has(entry.pokemon_id),
            `Pokemon ID ${entry.pokemon_id} (${entry.name}) on ${route.route_id} not in pokemon-index`,
          ).toBe(true);
        }
      }
    }
  });

  it("should include Bellsprout as a LG exclusive (replacing Oddish)", () => {
    const hassBellsprout = leafGreenEncounters.some((route) =>
      Object.values(route.methods).some((entries) =>
        entries.some((e: { pokemon_id: number }) => e.pokemon_id === 69),
      ),
    );
    expect(hassBellsprout).toBe(true);
  });

  it("should include Vulpix as a LG exclusive (replacing Growlithe)", () => {
    const hasVulpix = leafGreenEncounters.some((route) =>
      Object.values(route.methods).some((entries) =>
        entries.some((e: { pokemon_id: number }) => e.pokemon_id === 37),
      ),
    );
    expect(hasVulpix).toBe(true);
  });

  it("should include Pinsir as a LG exclusive (replacing Scyther)", () => {
    const hasPinsir = leafGreenEncounters.some((route) =>
      Object.values(route.methods).some((entries) =>
        entries.some(
          (e: { pokemon_id: number; rate: number }) => e.pokemon_id === 127 && e.rate > 0,
        ),
      ),
    );
    expect(hasPinsir).toBe(true);
  });

  it("should include Porygon purchase at Game Corner", () => {
    const celadon = leafGreenEncounters.find((e) => e.route_id === "celadon-game-corner");
    expect(celadon).toBeDefined();
    expect(celadon!.methods.purchase).toBeDefined();
    const purchaseIds = celadon!.methods.purchase!.map((p) => p.pokemon_id);
    expect(purchaseIds).toContain(137); // Porygon
  });
});

describe("FireRed bosses.json", () => {
  it("should validate against BossesSchema", () => {
    const result = BossesSchema.safeParse(fireRedBosses);
    expect(result.success).toBe(true);
  });

  it("should have all 8 gym leaders", () => {
    const gymLeaders = fireRedBosses.filter((b) => b.type === "gym_leader");
    expect(gymLeaders).toHaveLength(8);
  });

  it("should have 4 Elite Four members", () => {
    const e4 = fireRedBosses.filter((b) => b.type === "elite_four");
    expect(e4).toHaveLength(4);
  });

  it("should have a Champion", () => {
    const champion = fireRedBosses.filter((b) => b.type === "champion");
    expect(champion).toHaveLength(1);
  });

  it("should have rival fights", () => {
    const rivals = fireRedBosses.filter((b) => b.type === "rival");
    expect(rivals.length).toBeGreaterThanOrEqual(2);
  });

  it("all boss pokemon_ids should exist in pokemon-index.json", () => {
    for (const boss of fireRedBosses) {
      for (const pokemon of boss.pokemon) {
        expect(
          validPokemonIds.has(pokemon.pokemon_id),
          `Boss ${boss.name} has invalid pokemon_id ${pokemon.pokemon_id}`,
        ).toBe(true);
      }
    }
  });

  it("boss pokemon types should match pokemon-index.json", () => {
    for (const boss of fireRedBosses) {
      for (const pokemon of boss.pokemon) {
        const indexEntry = pokemonIndex[String(pokemon.pokemon_id) as keyof typeof pokemonIndex];
        if (indexEntry) {
          expect(pokemon.types).toEqual(indexEntry.types);
        }
      }
    }
  });

  it("gym leaders should have sequential badge numbers", () => {
    const gymLeaders = fireRedBosses
      .filter(
        (b): b is typeof b & { badge_number: number } =>
          b.type === "gym_leader" && "badge_number" in b,
      )
      .sort((a, b) => a.badge_number - b.badge_number);

    for (let i = 0; i < gymLeaders.length; i++) {
      expect(gymLeaders[i].badge_number).toBe(i + 1);
    }
  });

  it("Brock should be the first gym leader with Rock specialty", () => {
    const brock = fireRedBosses.find((b) => b.id === "brock");
    expect(brock).toBeDefined();
    expect(brock?.type).toBe("gym_leader");
    expect((brock as Record<string, unknown>)?.specialty_type).toBe("rock");
  });
});

describe("FireRed tier-list.json", () => {
  it("should validate against TierListSchema", () => {
    const result = TierListSchema.safeParse(fireRedTierList);
    expect(result.success).toBe(true);
  });

  it("should have correct game_id", () => {
    expect(fireRedTierList.game_id).toBe("fire-red");
  });

  it("all pokemon_ids should exist in pokemon-index.json", () => {
    for (const [tier, ids] of Object.entries(fireRedTierList.tiers)) {
      for (const id of ids) {
        expect(validPokemonIds.has(id), `Tier ${tier} has invalid pokemon_id ${id}`).toBe(true);
      }
    }
  });

  it("should cover a reasonable portion of Gen 1 Pokemon", () => {
    const allTiered = Object.values(fireRedTierList.tiers).flat();
    expect(allTiered.length).toBeGreaterThanOrEqual(100);
  });

  it("should have no duplicate pokemon across tiers", () => {
    const allTiered = Object.values(fireRedTierList.tiers).flat();
    expect(new Set(allTiered).size).toBe(allTiered.length);
  });

  it("S tier should include top Nuzlocke picks", () => {
    const sTier = fireRedTierList.tiers.S;
    expect(sTier).toContain(65); // Alakazam
    expect(sTier).toContain(130); // Gyarados
    expect(sTier).toContain(143); // Snorlax
    expect(sTier).toContain(34); // Nidoking
  });

  it("should have all five tiers", () => {
    expect(fireRedTierList.tiers).toHaveProperty("S");
    expect(fireRedTierList.tiers).toHaveProperty("A");
    expect(fireRedTierList.tiers).toHaveProperty("B");
    expect(fireRedTierList.tiers).toHaveProperty("C");
    expect(fireRedTierList.tiers).toHaveProperty("F");
  });
});
