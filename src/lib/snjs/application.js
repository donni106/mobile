import angular from 'angular';
import { SNComponentManager, SFAlertManager } from 'snjs';
import { isDesktopApplication, getPlatformString } from '@/utils';

export class Application extends SNApplication {
  createComponentManager() {
    this.componentManager = new ComponentManager({
      modelManager: this.modelManager,
      syncManager: this.syncManager,
      alertManager: this.alertManager,
      environment: "mobile",
      platform: Platform.OS
    })
  }
}
