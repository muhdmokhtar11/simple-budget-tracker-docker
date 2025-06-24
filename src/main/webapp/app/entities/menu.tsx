import React from 'react';

import MenuItem from 'app/shared/layout/menus/menu-item';

const EntitiesMenu = () => {
  return (
    <>
      {/* prettier-ignore */}
      <MenuItem icon="tachometer-alt" to="/dashboard">
        Dashboard
      </MenuItem>
      <MenuItem icon="asterisk" to="/category">
        Category
      </MenuItem>
      <MenuItem icon="asterisk" to="/income">
        Income
      </MenuItem>
      <MenuItem icon="asterisk" to="/expense">
        Expense
      </MenuItem>
      {/* jhipster-needle-add-entity-to-menu - JHipster will add entities to the menu here */}
    </>
  );
};

export default EntitiesMenu;
