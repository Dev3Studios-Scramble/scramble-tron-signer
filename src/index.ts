import { ecrecover, fromRpcSig } from "ethereumjs-util";
import { KeyPair, SignerInterface } from "@scramble/types";
import { bufferToHex, hexToBuffer } from "@scramble/utils";
import TronWeb, { AccountWithMnemonic } from "tronweb";
import { getTronWeb } from "@scramble/utils/src/tronweb";

// eslint-disable-next-line no-shadow
enum TronTxType {
  NATIVE = "TransferContract",
  TRIGGER_SMARTCONTRACT = "TriggerSmartContract",
  TRC10 = "TransferAssetContract",
}

class Signer implements SignerInterface {
  async generate(mnemonic: string, derivationPath = ""): Promise<KeyPair> {
    // https://developers.tron.network/reference/frommnemonic (BIP44)
    const tronWallet: AccountWithMnemonic = TronWeb.fromMnemonic(
      mnemonic,
      derivationPath
    );

    return {
      address: tronWallet.address,
      privateKey: tronWallet.privateKey,
      publicKey: tronWallet.publicKey,
    };
  }

  async verify(
    msgHash: string,
    sig: string,
    publicKey: string
  ): Promise<boolean> {
    const sigdecoded = fromRpcSig(sig);
    const rpubkey = ecrecover(
      hexToBuffer(msgHash),
      sigdecoded.v,
      sigdecoded.r,
      sigdecoded.s
    );
    return bufferToHex(rpubkey) === publicKey;
  }

  /**
   * Identify the asset to sign
   * TRX native |
   * TRC-10 |
   * TRC-20 |
   * ____
   * @param msgHash - the stringified transaction object
   * @param keyPair - the current scramble account
   */
  async sign(msgHash: string, keyPair: KeyPair): Promise<string> {
    const pk = keyPair.privateKey.startsWith("0x")
      ? keyPair.privateKey.substring(2)
      : keyPair.privateKey;

    if (msgHash.trim().startsWith("{")) {
      const { data, network } = JSON.parse(msgHash);
      const tronWeb = getTronWeb(network.node);
      const typeOfTransaction: TronTxType = this.findType(data);
      try {
        switch (typeOfTransaction) {
          case TronTxType.NATIVE:
          case TronTxType.TRC10: {
            return await tronWeb.trx.sign(data, pk);
          }
          case TronTxType.TRIGGER_SMARTCONTRACT: {
            // TRC20 we might need to sign data.transaction, for general calls data (e.g. swap)
            return await tronWeb.trx.sign(data.transaction ? data.transaction : data, pk);
          }
          default:
            // just try to sign, before failing
            return await tronWeb.trx.sign(data, pk);
        }
      } catch (e) {
        return `Invalid Transaction received in TronSigner: ${e}`;
      }
    } else {
      // regular message
      console.log("TRON - REGULAR SIGN MESSAGE FROM TRON_BE_FALLBACK: ", pk);
      return TronWeb.Trx.signMessageV2(msgHash, pk);
    }
  }

  public findType(obj) {
    const keys = Object.keys(obj);
    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      if (key === "type") {
        return obj[key];
      }
      if (typeof obj[key] === "object" && obj[key] !== null) {
        const result = this.findType(obj[key]);
        if (result !== undefined) {
          return result;
        }
      }
    }
    return undefined;
  }
}

export default Signer;
