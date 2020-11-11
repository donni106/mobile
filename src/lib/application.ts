import Bugsnag from '@bugsnag/react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { SCREEN_AUTHENTICATE } from '@Screens/screens';
import { Platform } from 'react-native';
import VersionInfo from 'react-native-version-info';
import {
  Challenge,
  Environment,
  platformFromString,
  SNApplication,
  SNComponentManager,
} from 'snjs';
import { DeinitSource } from 'snjs/dist/@types/types';
import { AlertService } from './alert_service';
import { ApplicationState } from './application_state';
import { BackupsService } from './backups_service';
import { ComponentGroup } from './component_group';
import { ComponentManager } from './component_manager';
import { EditorGroup } from './editor_group';
import { InstallationService } from './installation_service';
import { MobileDeviceInterface } from './interface';
import Keychain from './keychain';
import { push } from './navigation_service';
import { PreferencesManager } from './preferences_manager';
import { SNReactNativeCrypto } from './react_native_crypto';
import { ReviewService } from './review_service';
import { StatusManager } from './status_manager';

type MobileServices = {
  applicationState: ApplicationState;
  reviewService: ReviewService;
  backupsService: BackupsService;
  installationService: InstallationService;
  prefsService: PreferencesManager;
  statusManager: StatusManager;
};

export class MobileApplication extends SNApplication {
  private MobileServices!: MobileServices;
  public editorGroup: EditorGroup;
  public componentGroup: ComponentGroup;
  public Uuid: string; // UI remounts when Uuid changes

  constructor(deviceInterface: MobileDeviceInterface, identifier: string) {
    super(
      Environment.Mobile,
      platformFromString(Platform.OS),
      deviceInterface,
      new SNReactNativeCrypto(),
      new AlertService(),
      identifier,
      [
        {
          swap: SNComponentManager,
          with: ComponentManager,
        },
      ],
      undefined,
      VersionInfo.bundleIdentifier?.includes('dev')
        ? 'https://syncing-server-dev.standardnotes.org/'
        : 'https://sync.standardnotes.org'
    );
    this.Uuid = Math.random().toString();
    this.editorGroup = new EditorGroup(this);
    this.componentGroup = new ComponentGroup(this);
    setTimeout(() => {
      this.logState();
    }, 1000);

    setTimeout(() => {
      this.logState();
    }, 5000);
  }

  async logState() {
    const storageKeys = (await AsyncStorage.getAllKeys()).filter(
      key => !key.startsWith('Item-')
    );
    const keychain = await Keychain.getKeys();
    const values = await AsyncStorage.multiGet(storageKeys);
    Bugsnag.leaveBreadcrumb('Storage values: ' + values);
    Bugsnag.leaveBreadcrumb('keychain: ' + keychain);
    console.log('storage values:', values, 'keychain', keychain);
  }

  /** @override */
  deinit(source: DeinitSource) {
    for (const key of Object.keys(this.MobileServices)) {
      const service = (this.MobileServices as any)[key];
      if (service.deinit) {
        service.deinit();
      }
      service.application = undefined;
    }
    this.MobileServices = {} as MobileServices;
    this.editorGroup.deinit();
    this.componentGroup.deinit();
    super.deinit(source);
  }

  promptForChallenge(challenge: Challenge) {
    push(SCREEN_AUTHENTICATE, { challenge, title: challenge.modalTitle });
  }

  setMobileServices(services: MobileServices) {
    this.MobileServices = services;
  }

  public getAppState() {
    return this.MobileServices.applicationState;
  }

  public getBackupsService() {
    return this.MobileServices.backupsService;
  }

  public getPrefsService() {
    return this.MobileServices.prefsService;
  }

  public getStatusManager() {
    return this.MobileServices.statusManager;
  }
}
