export function createStatusTab(root) {
  root.innerHTML = '<div class="control-menu-placeholder"><h3>SYSTEM STATUS</h3><p>MODULE STATUS AND DIAGNOSTICS WILL BE ADDED HERE.</p></div>';
  return { refresh() {} };
}
