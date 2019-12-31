import { NativeModules, Platform } from 'react-native';
import { SNProtocolManager, SFAbstractCrypto } from 'snjs';
import { SNReactNativeCrypto } from 'sncrypto';
const Aes = NativeModules.Aes;
const base64 = require('base-64');

export default class RNProtocolManager extends SNProtocolManager {

  static instance = null;
  static get() {
    if (this.instance == null) {
      // We don't want SNJS using this function, since we can only generate uuid async here.
      // SNJS will check to make sure `generateUUIDSync` is defined before using it.
      SFReactNativeCrypto.prototype.generateUUIDSync = null;

      let cryptoInstance = new SNReactNativeCrypto();
      cryptoInstance.setNativeModules({aes: Aes, base64: base64});

      this.instance = new RNProtocolManager(cryptoInstance);
    }
    return this.instance;
  }

  supportsPasswordDerivationCost(cost) {
    return true;
  }
}
