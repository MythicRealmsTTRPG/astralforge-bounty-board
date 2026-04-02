const MODULE_ID = "astralforge-bounty-board";

const LOCATION_TYPES = {
  all: "All",
  tavern: "Tavern",
  inn: "Inn",
  guildhall: "Guild Hall",
  temple: "Temple",
  market: "Market",
  blackmarket: "Black Market"
};

const STATUS_TYPES = {
  available: "Available",
  accepted: "Accepted",
  completed: "Completed",
  expired: "Expired"
};

const DEFAULT_QUESTS = [
  {
    id: foundry.utils.randomID(),
    title: "Cellar Trouble at the Copper Cup",
    description: "The innkeeper swears something larger than a rat has been getting into the ale casks after midnight.",
    reward: "15 gp and free room for 2 nights",
    patron: "Mira Stonehand",
    locationType: "tavern",
    status: "available",
    difficulty: "Low",
    postedDate: new Date().toLocaleDateString(),
    tags: ["vermin", "investigation"],
    claimedBy: "",
    notes: ""
  },
  {
    id: foundry.utils.randomID(),
    title: "Missing Caravan on the North Road",
    description: "A merchant wagon bound for town never arrived. Last seen before sundown near the stone bridge.",
    reward: "75 gp",
    patron: "Harlan Voss",
    locationType: "inn",
    status: "available",
    difficulty: "Moderate",
    postedDate: new Date().toLocaleDateString(),
    tags: ["escort", "investigation"],
    claimedBy: "",
    notes: ""
  },
  {
    id: foundry.utils.randomID(),
    title: "Ledger Recovery Contract",
    description: "The guild seeks recovery of a stolen shipping ledger before it reaches the wrong hands.",
    reward: "120 gp and guild favor",
    patron: "Merchants' Guild",
    locationType: "guildhall",
    status: "available",
    difficulty: "Moderate",
    postedDate: new Date().toLocaleDateString(),
    tags: ["retrieval", "urban"],
    claimedBy: "",
    notes: ""
  }
];

/* ----------------------------------------- */
/* Helpers                                   */
/* ----------------------------------------- */

function duplicateQuests() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, "quests") ?? []);
}

async function saveQuests(quests) {
  return game.settings.set(MODULE_ID, "quests", quests);
}

async function seedDefaultQuests() {
  const quests = duplicateQuests();
  if (quests.length > 0) return;
  await saveQuests(foundry.utils.deepClone(DEFAULT_QUESTS));
}

function normalizeQuest(data = {}) {
  return {
    id: data.id ?? foundry.utils.randomID(),
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
    reward: String(data.reward ?? "").trim(),
    patron: String(data.patron ?? "").trim(),
    locationType: data.locationType && LOCATION_TYPES[data.locationType] ? data.locationType : "tavern",
    status: data.status && STATUS_TYPES[data.status] ? data.status : "available",
    difficulty: String(data.difficulty ?? "").trim(),
    postedDate: String(data.postedDate ?? new Date().toLocaleDateString()).trim(),
    tags: Array.isArray(data.tags)
      ? data.tags.map(t => String(t).trim()).filter(Boolean)
      : String(data.tags ?? "")
          .split(",")
          .map(t => t.trim())
          .filter(Boolean),
    claimedBy: String(data.claimedBy ?? "").trim(),
    notes: String(data.notes ?? "").trim()
  };
}

function getQuestById(id) {
  return duplicateQuests().find(q => q.id === id);
}

async function addQuest(questData) {
  const quests = duplicateQuests();
  quests.push(normalizeQuest(questData));
  await saveQuests(quests);
}

async function updateQuest(id, updates) {
  const quests = duplicateQuests();
  const index = quests.findIndex(q => q.id === id);
  if (index === -1) return false;
  quests[index] = normalizeQuest({ ...quests[index], ...updates, id });
  await saveQuests(quests);
  return true;
}

async function deleteQuest(id) {
  const quests = duplicateQuests().filter(q => q.id !== id);
  await saveQuests(quests);
}

async function updateQuestStatus(id, status) {
  if (!STATUS_TYPES[status]) return false;
  const quest = getQuestById(id);
  if (!quest) return false;

  const updates = { status };
  if (status === "accepted" && !quest.claimedBy) updates.claimedBy = game.user.name;
  if (status !== "accepted") updates.claimedBy = quest.claimedBy ?? "";

  return updateQuest(id, updates);
}

function notifyInfo(message) {
  ui.notifications?.info(message);
}

function notifyWarn(message) {
  ui.notifications?.warn(message);
}

function notifyError(message) {
  ui.notifications?.error(message);
}

function buildQuestFormHTML(quest = null) {
  const q = normalizeQuest(quest ?? {});
  const locationOptions = Object.entries(LOCATION_TYPES)
    .filter(([key]) => key !== "all")
    .map(([key, label]) => `<option value="${key}" ${q.locationType === key ? "selected" : ""}>${label}</option>`)
    .join("");

  const statusOptions = Object.entries(STATUS_TYPES)
    .map(([key, label]) => `<option value="${key}" ${q.status === key ? "selected" : ""}>${label}</option>`)
    .join("");

  return `
    <form class="astralforge-bounty-form">
      <div class="form-group">
        <label>Title</label>
        <input type="text" name="title" value="${foundry.utils.escapeHTML(q.title)}" required />
      </div>

      <div class="form-group">
        <label>Patron</label>
        <input type="text" name="patron" value="${foundry.utils.escapeHTML(q.patron)}" />
      </div>

      <div class="form-group">
        <label>Reward</label>
        <input type="text" name="reward" value="${foundry.utils.escapeHTML(q.reward)}" />
      </div>

      <div class="form-group">
        <label>Location</label>
        <select name="locationType">${locationOptions}</select>
      </div>

      <div class="form-group">
        <label>Status</label>
        <select name="status">${statusOptions}</select>
      </div>

      <div class="form-group">
        <label>Difficulty</label>
        <input type="text" name="difficulty" value="${foundry.utils.escapeHTML(q.difficulty)}" />
      </div>

      <div class="form-group">
        <label>Posted Date</label>
        <input type="text" name="postedDate" value="${foundry.utils.escapeHTML(q.postedDate)}" />
      </div>

      <div class="form-group">
        <label>Tags (comma separated)</label>
        <input type="text" name="tags" value="${foundry.utils.escapeHTML(q.tags.join(", "))}" />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea name="description" rows="5">${foundry.utils.escapeHTML(q.description)}</textarea>
      </div>

      <div class="form-group">
        <label>GM Notes</label>
        <textarea name="notes" rows="4">${foundry.utils.escapeHTML(q.notes)}</textarea>
      </div>
    </form>
  `;
}

function extractFormData(form) {
  const fd = new FormData(form);
  return normalizeQuest({
    title: fd.get("title"),
    patron: fd.get("patron"),
    reward: fd.get("reward"),
    locationType: fd.get("locationType"),
    status: fd.get("status"),
    difficulty: fd.get("difficulty"),
    postedDate: fd.get("postedDate"),
    tags: fd.get("tags"),
    description: fd.get("description"),
    notes: fd.get("notes")
  });
}

async function openQuestDialog({ quest = null, mode = "create" } = {}) {
  const isEdit = mode === "edit";
  const dialogTitle = isEdit ? "Edit Quest" : "Create Quest";

  return foundry.applications.api.DialogV2.wait({
    window: {
      title: dialogTitle
    },
    content: buildQuestFormHTML(quest),
    buttons: [
      {
        action: "save",
        label: isEdit ? "Save Changes" : "Create Quest",
        icon: "fas fa-floppy-disk",
        default: true,
        callback: async (_event, button, dialog) => {
          const form = button.form ?? dialog.element.querySelector("form");
          const data = extractFormData(form);

          if (!data.title) {
            notifyWarn("Quest title is required.");
            return false;
          }

          if (isEdit && quest?.id) {
            await updateQuest(quest.id, data);
            notifyInfo(`Updated quest: ${data.title}`);
          } else {
            await addQuest(data);
            notifyInfo(`Created quest: ${data.title}`);
          }

          return true;
        }
      },
      {
        action: "cancel",
        label: "Cancel",
        icon: "fas fa-xmark"
      }
    ],
    rejectClose: false
  });
}

async function confirmDeleteQuest(id) {
  const quest = getQuestById(id);
  if (!quest) return;

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: "Delete Quest" },
    content: `<p>Delete <strong>${foundry.utils.escapeHTML(quest.title)}</strong>?</p>`,
    yes: {
      label: "Delete",
      icon: "fas fa-trash"
    },
    no: {
      label: "Cancel",
      icon: "fas fa-xmark"
    },
    rejectClose: false
  });

  if (!confirmed) return;
  await deleteQuest(id);
  notifyInfo(`Deleted quest: ${quest.title}`);
}

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("or", (a, b) => Boolean(a || b));
  Handlebars.registerHelper("joinTags", tags => Array.isArray(tags) ? tags.join(", ") : "");
  Handlebars.registerHelper("statusLabel", status => STATUS_TYPES[status] ?? status);
  Handlebars.registerHelper("locationLabel", location => LOCATION_TYPES[location] ?? location);
}

/* ----------------------------------------- */
/* Main App                                  */
/* ----------------------------------------- */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class BountyBoardApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this._filters = {
      locationType: options.locationType ?? "all",
      status: options.status ?? "all",
      search: ""
    };
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: "astralforge-bounty-board-app",
    classes: ["astralforge-bounty-board-app"],
    tag: "section",
    position: {
      width: 840,
      height: 720
    },
    window: {
      title: "AstralForge Bounty Board",
      icon: "fas fa-scroll",
      resizable: true
    }
  });

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/bounty-board.hbs`,
      root: true
    }
  };

  async _prepareContext() {
    const allQuests = duplicateQuests().sort((a, b) => a.title.localeCompare(b.title));

    const quests = allQuests.filter(q => {
      const matchesLocation = this._filters.locationType === "all" || q.locationType === this._filters.locationType;
      const matchesStatus = this._filters.status === "all" || q.status === this._filters.status;
      const needle = this._filters.search.trim().toLowerCase();

      const haystack = [
        q.title,
        q.description,
        q.patron,
        q.reward,
        q.difficulty,
        q.locationType,
        q.status,
        ...(q.tags ?? [])
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !needle || haystack.includes(needle);
      return matchesLocation && matchesStatus && matchesSearch;
    });

    return {
      isGM: game.user.isGM,
      quests,
      filters: foundry.utils.deepClone(this._filters),
      hasQuests: quests.length > 0,
      locationOptions: Object.entries(LOCATION_TYPES).map(([value, label]) => ({
        value,
        label,
        selected: value === this._filters.locationType
      })),
      statusOptions: [
        { value: "all", label: "All", selected: this._filters.status === "all" },
        ...Object.entries(STATUS_TYPES).map(([value, label]) => ({
          value,
          label,
          selected: value === this._filters.status
        }))
      ]
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    const html = this.element;
    if (!html) return;

    html.querySelector("[data-action='create-quest']")?.addEventListener("click", async () => {
      if (!game.user.isGM) return;
      await openQuestDialog({ mode: "create" });
      this.render(true);
    });

    html.querySelector("[data-action='reset-filters']")?.addEventListener("click", async () => {
      this._filters = { locationType: "all", status: "all", search: "" };
      this.render(true);
    });

    html.querySelector("[name='locationFilter']")?.addEventListener("change", event => {
      this._filters.locationType = event.currentTarget.value;
      this.render(true);
    });

    html.querySelector("[name='statusFilter']")?.addEventListener("change", event => {
      this._filters.status = event.currentTarget.value;
      this.render(true);
    });

    html.querySelector("[name='searchFilter']")?.addEventListener("input", event => {
      this._filters.search = event.currentTarget.value ?? "";
      this.render(true);
    });

    html.querySelectorAll("[data-action='accept-quest']").forEach(button => {
      button.addEventListener("click", async event => {
        const id = event.currentTarget.dataset.questId;
        const quest = getQuestById(id);
        if (!quest) return;

        if (quest.status !== "available") {
          notifyWarn("That quest is no longer available.");
          return;
        }

        await updateQuest(id, {
          status: "accepted",
          claimedBy: game.user.name
        });

        notifyInfo(`Accepted quest: ${quest.title}`);
        this.render(true);
      });
    });

    html.querySelectorAll("[data-action='mark-complete']").forEach(button => {
      button.addEventListener("click", async event => {
        if (!game.user.isGM) return;
        const id = event.currentTarget.dataset.questId;
        const quest = getQuestById(id);
        if (!quest) return;

        await updateQuest(id, { status: "completed" });
        notifyInfo(`Completed quest: ${quest.title}`);
        this.render(true);
      });
    });

    html.querySelectorAll("[data-action='mark-available']").forEach(button => {
      button.addEventListener("click", async event => {
        if (!game.user.isGM) return;
        const id = event.currentTarget.dataset.questId;
        const quest = getQuestById(id);
        if (!quest) return;

        await updateQuest(id, { status: "available", claimedBy: "" });
        notifyInfo(`Returned quest to available: ${quest.title}`);
        this.render(true);
      });
    });

    html.querySelectorAll("[data-action='mark-expired']").forEach(button => {
      button.addEventListener("click", async event => {
        if (!game.user.isGM) return;
        const id = event.currentTarget.dataset.questId;
        const quest = getQuestById(id);
        if (!quest) return;

        await updateQuest(id, { status: "expired" });
        notifyInfo(`Expired quest: ${quest.title}`);
        this.render(true);
      });
    });

    html.querySelectorAll("[data-action='edit-quest']").forEach(button => {
      button.addEventListener("click", async event => {
        if (!game.user.isGM) return;
        const id = event.currentTarget.dataset.questId;
        const quest = getQuestById(id);
        if (!quest) return;

        await openQuestDialog({ quest, mode: "edit" });
        this.render(true);
      });
    });

    html.querySelectorAll("[data-action='delete-quest']").forEach(button => {
      button.addEventListener("click", async event => {
        if (!game.user.isGM) return;
        const id = event.currentTarget.dataset.questId;
        await confirmDeleteQuest(id);
        this.render(true);
      });
    });
  }
}

/* ----------------------------------------- */
/* Settings Menu                             */
/* ----------------------------------------- */

class BountyBoardSettingsApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: "astralforge-bounty-board-settings",
    classes: ["astralforge-bounty-board-settings"],
    tag: "section",
    position: {
      width: 520,
      height: 260
    },
    window: {
      title: "AstralForge Bounty Board Settings",
      icon: "fas fa-gears",
      resizable: false
    }
  });

  static PARTS = {
    main: {
      root: true,
      template: `modules/${MODULE_ID}/templates/settings-placeholder.hbs`
    }
  };

  async _prepareContext() {
    return {};
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
  }
}

/* ----------------------------------------- */
/* Init / Ready                              */
/* ----------------------------------------- */

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);

  registerHandlebarsHelpers();

  game.settings.register(MODULE_ID, "quests", {
    name: "Quest Data",
    hint: "Internal storage for AstralForge Bounty Board quests.",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.modules.get(MODULE_ID).api = {
    openBoard: options => new BountyBoardApp(options).render(true),
    getQuests: duplicateQuests,
    addQuest,
    updateQuest,
    deleteQuest,
    updateQuestStatus
  };
});

Hooks.once("ready", async () => {
  console.log(`${MODULE_ID} | Ready`);
  if (game.user.isGM) await seedDefaultQuests();
});

/* ----------------------------------------- */
/* Scene Controls                            */
/* ----------------------------------------- */

Hooks.on("getSceneControlButtons", controls => {
  const toolConfig = {
    name: "astralforgeBountyBoard",
    title: "AstralForge Bounty Board",
    icon: "fas fa-scroll",
    button: true,
    visible: true,
    onClick: () => new BountyBoardApp().render(true)
  };

  // Compatibility approach for differing control structures.
  if (Array.isArray(controls)) {
    controls.push({
      name: "astralforgeBountyBoard",
      title: "AstralForge Bounty Board",
      icon: "fas fa-scroll",
      layer: "controls",
      tools: [toolConfig]
    });
    return;
  }

  const target = controls.notes ?? controls.tokens ?? controls.drawings;
  if (!target) return;

  if (Array.isArray(target.tools)) {
    target.tools.push(toolConfig);
  } else {
    target.tools ??= {};
    target.tools.astralforgeBountyBoard = toolConfig;
  }
});