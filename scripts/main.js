const MODULE_ID = "astralforge-bounty-board";

Hooks.once("init", async () => {
  console.log(`${MODULE_ID} | Initialized`);

  Handlebars.registerHelper("eq", (a, b) => a === b);

  game.settings.register(MODULE_ID, "quests", {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
});

Hooks.on("getSceneControlButtons", (controls) => {
  controls.push({
    name: "astralforge-bounty",
    title: "AstralForge Bounty Board",
    icon: "fas fa-scroll",
    layer: "controls",
    tools: [
      {
        name: "open",
        title: "Open Bounty Board",
        icon: "fas fa-thumbtack",
        button: true,
        onClick: () => new BountyBoardApp().render(true)
      }
    ]
  });
});

function getQuests() {
  return game.settings.get(MODULE_ID, "quests") || [];
}

async function saveQuests(quests) {
  return game.settings.set(MODULE_ID, "quests", quests);
}

class BountyBoardApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "astralforge-bounty-board",
    window: {
      title: "AstralForge Bounty Board",
      icon: "fas fa-scroll"
    },
    position: {
      width: 700,
      height: 600
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/bounty-board.hbs`
    }
  };

  async _prepareContext() {
    return {
      quests: getQuests(),
      isGM: game.user.isGM
    };
  }
}