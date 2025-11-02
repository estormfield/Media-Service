import { Menu } from 'electron';

export const setupMenu = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const menu = Menu.buildFromTemplate([{
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }]
    }]);
    Menu.setApplicationMenu(menu);
  } else {
    Menu.setApplicationMenu(null);
  }
};
