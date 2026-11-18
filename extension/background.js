const DEFAULT_RULES = [
  "Is my Stop-Loss strictly defined and entered?",
  "Am I risking less than 1% of total capital?",
  "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
];

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.get(
    {
      rules: null,
      enabled: true,
      capital: 200000,
      maxRiskPercent: 1.0,
      cooldownMinutes: 3,
      maxTradesPerDay: 5,
      openingGuardEnabled: true,
      strictRiskConfirm: true,
      currentMood: "Calm",
      calmNote: "Protect capital first. Missing a trade costs ₹0; a revenge trade ruins the whole week.",
      tradesSkipped: 0,
      rulesTriggered: 0,
      tradeJournal: []
    },
    (data) => {
      if (!data.rules) {
        chrome.storage.local.set({
          rules: DEFAULT_RULES,
          enabled: true,
          capital: 200000,
          maxRiskPercent: 1.0,
          cooldownMinutes: 3,
          maxTradesPerDay: 5,
          openingGuardEnabled: true,
          strictRiskConfirm: true,
          currentMood: "Calm",
          calmNote: "Protect capital first. Missing a trade costs ₹0; a revenge trade ruins the whole week.",
          tradesSkipped: 0,
          rulesTriggered: 0
        });
      }
    }
  );

  if (details && details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html")
    });
  }
});
