import { createSectionsTab } from './tabs/sections/sections-tab.js';
import { createModulesTab } from './tabs/modules/modules-tab.js';
import { createStatusTab } from './tabs/status/status-tab.js';

export function createControlMenu(root, state, onChange) {
  root.innerHTML =
    '<div class="control-menu-shell">' +
      '<header class="control-menu-header"><div><small>CASSANDRA · COMMAND SYSTEM</small><h2>CONTROL MENU</h2></div><button type="button" data-control-close aria-label="Close">×</button></header>' +
      '<nav class="control-menu-tabs" aria-label="Control menu sections">' +
        '<button type="button" data-control-tab="sections" class="active">SECTIONS</button>' +
        '<button type="button" data-control-tab="modules">MODULES</button>' +
        '<button type="button" data-control-tab="status">STATUS</button>' +
      '</nav>' +
      '<div class="control-menu-content">' +
        '<section data-control-view="sections"></section>' +
        '<section data-control-view="modules" hidden><div class="control-menu-placeholder"><h3>MODULE CONTROL</h3><p>MODULE ACTIONS WILL BE ADDED HERE.</p></div></section>' +
        '<section data-control-view="status" hidden><div class="control-menu-placeholder"><h3>SYSTEM STATUS</h3><p>MODULE STATUS AND DIAGNOSTICS WILL BE ADDED HERE.</p></div></section>' +
      '</div>' +
    '</div>';
  const views = [...root.querySelectorAll('[data-control-view]')];
  const tabs = [...root.querySelectorAll('[data-control-tab]')];
  const sections = createSectionsTab(root.querySelector('[data-control-view="sections"]'), state, onChange);
  const modules = createModulesTab(root.querySelector('[data-control-view="modules"]'));
  const status = createStatusTab(root.querySelector('[data-control-view="status"]'));
  let open = false;
  let activeTab = 'sections';

  function selectTab(tab) {
    if (!['sections', 'modules', 'status'].includes(tab)) return;
    activeTab = tab;
    tabs.forEach((button) => button.classList.toggle('active', button.dataset.controlTab === tab));
    views.forEach((view) => { view.hidden = view.dataset.controlView !== tab; });
    if (tab === 'sections') sections.refresh();
    if (tab === 'modules') modules.refresh();
    if (tab === 'status') status.refresh();
  }
  function render() {
    root.hidden = !open;
    if (!open) return;
    selectTab(activeTab);
  }
  root.querySelector('[data-control-close]').addEventListener('click', () => {
    open = false;
    sections.close();
    render();
  });
  tabs.forEach((button) => button.addEventListener('click', () => selectTab(button.dataset.controlTab)));

  return {
    open() {
      activeTab = 'sections';
      open = true;
      sections.open();
      render();
    },
    openFromDevice(device, deckId) {
      const opened = sections.openFromDevice(device, deckId);
      if (!opened) return false;
      activeTab = 'sections';
      open = true;
      render();
      return true;
    },
    close() {
      open = false;
      sections.close();
      render();
    },
    toggle() {
      if (open) this.close();
      else this.open();
    },
    selectPanel(id) {
      activeTab = 'sections';
      open = true;
      sections.selectPanel(id);
      render();
    },
    refresh() {
      if (activeTab === 'sections') sections.refresh();
      render();
    },
    get isOpen() {
      return open;
    },
  };
}
