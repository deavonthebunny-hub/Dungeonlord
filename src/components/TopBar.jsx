import { BUILD_VERSION } from "../playtestSupport";

export default function TopBar(props) {
  const {
    activeMobileTab,
    activeTab,
    lastSavedAt,
    mobileMenuOpen,
    mobileTabs,
    saveStatus,
    selectMobileTab,
    setMobileMenuOpen,
    state,
  } = props;

  return (
    <header className="topbar">
              <div className="titleBlock">
                <div className="title">Dungeonlord</div>
                <div className="releaseMeta">
                  Alpha {BUILD_VERSION} | Seed {state.runSeed} | <span className={saveStatus === "Save Failed" ? "saveBad" : ""}>{saveStatus}</span>
                  {lastSavedAt ? ` ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                </div>
              </div>
              <div className="mobileNav">
                <button
                  className={`mobileMenuBtn ${mobileMenuOpen ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-nav-drawer"
                >
                  <span className="mobileMenuIcon" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="mobileMenuText">
                    <span className="mobileMenuLabel">Menu</span>
                    <span className="mobileMenuCurrent">{activeMobileTab.label}</span>
                  </span>
                </button>
                {mobileMenuOpen && (
                  <div className="mobileDrawer" id="mobile-nav-drawer">
                    {mobileTabs.map((tab) => (
                      <button
                        key={tab.key}
                        className={`mobileNavBtn ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => selectMobileTab(tab.key)}
                      >
                        <span>{tab.label}</span>
                        <span className="mobileNavMeta">{tab.desc}</span>
                      </button>
                    ))}
                    <a
                      className="mobileNavBtn"
                      href={`${import.meta.env.BASE_URL}guidebook/Dungeonlord_Guidebook.pdf`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>Guidebook</span>
                      <span className="mobileNavMeta">Open the player field guide</span>
                    </a>
                  </div>
                )}
              </div>
            </header>
  );
}
