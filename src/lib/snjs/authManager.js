import {Platform} from 'react-native';
import KeyManager from "@Lib/snjs/keyManager"
import Storage from '@SNJS/storageManager'
import Server from '@SNJS/httpManager'
import AlertManager from '@SNJS/alertManager'

export default class Auth extends SFAuthManager {

  static instance = null;
  static get() {
    if(this.instance == null) {
      this.instance = new Auth(Storage.get(), Server.get(), AlertManager.get());
    }
    return this.instance;
  }

  defaultServer() {
    if (__DEV__) {
      if(Platform.OS === "android") {
        return "http://10.0.2.2:3000"
      } else {
        return "http://localhost:3000"
      }
    } else {
      return "https://sync.standardnotes.org";
    }
  }

  serverUrl() {
    let user = KeyManager.get().user;
    return (user && user.server) || this.defaultServer();
  }

  offline() {
    let keys = KeyManager.get().activeKeys() || {};
    return !keys.jwt;
  }

  async signout(clearAllData) {
    await Storage.get().clearAllModels();
    await KeyManager.get().clearAccountKeysAndData();
    this._keys = null;
    // DONT clear all data. We will do this ourselves manually, as we need to preserve certain data keys.
    return super.signout(false);
  }

  async keys() {
    // AuthManager only handles account related keys. If we are requesting keys,
    // we are referring to account keys. KeyManager.activeKeys can return local passcode
    // keys.
    if(this.offline()) {
      return null;
    }

    return KeyManager.get().activeKeys();
  }

  async getAuthParams() {
    return KeyManager.get().getRootKeyParams();
  }

  async handleAuthResponse(response, email, url, authParams, keys) {
    // We don't want to call super, as the super implementation is meant for web credentials
    // super will save keys to storage, which we don't want.
    // await super.handleAuthResponse(response, email, url, authParams, keys);
    try {
      this._keys = keys;
      return Promise.all([
        KeyManager.get().persistAccountKeys(_.merge(keys, {jwt: response.token})),
        KeyManager.get().setAccountAuthParams(authParams),
        KeyManager.get().saveUser({server: url, email: email})
      ]);
    } catch(e) {
      console.log("Error saving auth paramters", e);
      return null;
    }
  }

  async verifyAccountPassword(password) {
    const authParams = await this.getAuthParams();
    const keys = await RNProtocolManager.get().computeRootKey({password, authParams});
    const currentKeys = await this.keys();
    const success = await RNProtocolManager.get().compareKeys(keys, currentKeys);
    return success;
  }
}
